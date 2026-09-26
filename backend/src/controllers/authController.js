const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { sequelize, User, PatientProfile, Appointment, DoctorProfile } = require('../models');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/authToken');
const { sanitizeUser } = require('../utils/sanitize');
const { recordAudit } = require('../middleware/auditLog');
const { computeAppointmentSlot, isSlotAvailable } = require('../services/appointments');
const { sendPatientCredentialsEmail } = require('../services/email');
const { getTomorrowAppointmentsForDoctor, getTomorrowAppointmentForPatient } = require('../services/reminders');
const { assertDoctorOwnedByAdmin } = require('../services/ownership');

// El paciente nunca elige su propia contraseña en el alta pública: se genera aquí y se le
// envía por correo, para no exponer un campo de contraseña en un formulario de agendado.
function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

// Lógica compartida por el autorregistro público (registerPatient) y el alta que hace un
// médico/admin desde su calendario (registerPatientByStaff): crea la cuenta del paciente y,
// si se indica, su cita, en una sola transacción. No decide sesión ni auditoría: eso depende
// de quién lo invoca (el propio paciente vs. personal de la clínica en su nombre).
async function createPatientWithAppointment({
  email,
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  telefono,
  fechaNacimiento,
  sexo,
  curp,
  direccion,
  contactoEmergenciaNombre,
  contactoEmergenciaTelefono,
  avisoPrivacidadAceptado,
  appointment,
}) {
  if (!avisoPrivacidadAceptado) {
    const err = new Error('Debes aceptar el aviso de privacidad.');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('Ya existe una cuenta con ese correo.');
    err.status = 409;
    throw err;
  }

  if (appointment) {
    const available = await isSlotAvailable(appointment.doctorId, appointment.fecha, appointment.horaInicio);
    if (!available) {
      const err = new Error('Ese horario ya no está disponible. Elige otro.');
      err.status = 409;
      throw err;
    }
  }

  const temporaryPassword = generateTemporaryPassword();

  const result = await sequelize.transaction(async (t) => {
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const user = await User.create(
      {
        email,
        passwordHash,
        role: 'paciente',
        roles: ['paciente'],
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        telefono,
      },
      { transaction: t }
    );

    await PatientProfile.create(
      {
        userId: user.id,
        fechaNacimiento,
        sexo,
        curp: curp || null,
        direccion: direccion || null,
        contactoEmergenciaNombre: contactoEmergenciaNombre || null,
        contactoEmergenciaTelefono: contactoEmergenciaTelefono || null,
        avisoPrivacidadAceptadoEn: new Date(),
      },
      { transaction: t }
    );

    let createdAppointment = null;
    if (appointment) {
      const doctorProfile = await DoctorProfile.findOne({
        where: { userId: appointment.doctorId },
        transaction: t,
      });
      if (!doctorProfile) {
        const err = new Error('Doctor no encontrado.');
        err.status = 404;
        throw err;
      }
      const slot = computeAppointmentSlot(appointment.horaInicio, doctorProfile.duracionCitaMinutos);
      createdAppointment = await Appointment.create(
        {
          patientId: user.id,
          doctorId: appointment.doctorId,
          fecha: appointment.fecha,
          horaInicio: slot.horaInicio,
          horaFin: slot.horaFin,
          esPrimeraVez: true,
          motivoConsulta: appointment.motivoConsulta || null,
        },
        { transaction: t }
      );
    }

    return { user, createdAppointment };
  });

  return { ...result, temporaryPassword };
}

async function sendCredentialsEmailSafely({ user, createdAppointment, temporaryPassword }) {
  try {
    const sent = await sendPatientCredentialsEmail({
      to: user.email,
      nombre: user.nombre,
      password: temporaryPassword,
      fecha: createdAppointment?.fecha,
      horaInicio: createdAppointment?.horaInicio,
    });
    return sent.sent;
  } catch (err) {
    console.error('[email] No se pudo enviar el correo de credenciales:', err.message);
    return false;
  }
}

// Autorregistro público (paciente sin sesión previa): crea su propia cuenta y queda autenticado.
async function registerPatient(req, res) {
  const result = await createPatientWithAppointment(req.body);

  const token = signToken(result.user);
  setAuthCookie(res, token);

  await recordAudit({ user: result.user, entidad: 'users', entidadId: result.user.id, accion: 'create', req });
  if (result.createdAppointment) {
    await recordAudit({
      user: result.user,
      entidad: 'appointments',
      entidadId: result.createdAppointment.id,
      accion: 'create',
      req,
    });
  }

  const emailEnviado = await sendCredentialsEmailSafely(result);

  res.status(201).json({
    user: sanitizeUser(result.user),
    appointment: result.createdAppointment,
    emailEnviado,
  });
}

// Alta de un paciente nuevo hecha por un médico o admin (p. ej. al agendar desde el
// calendario a alguien que llama por teléfono). No debe tocar la cookie de sesión de quien
// la ejecuta: la cuenta creada es la del paciente, no la de quien está autenticado.
async function registerPatientByStaff(req, res) {
  const appointment = req.body.appointment
    ? { ...req.body.appointment, doctorId: req.user.hasRole('medico') ? req.user.id : req.body.appointment.doctorId }
    : undefined;

  // Un admin solo puede agendar contra un doctor de su propia clínica (nunca uno ajeno).
  if (appointment && req.user.hasRole('admin') && !req.user.hasRole('medico')) {
    await assertDoctorOwnedByAdmin(appointment.doctorId, req.user.id);
  }

  const result = await createPatientWithAppointment({ ...req.body, appointment });

  await recordAudit({ user: req.user, entidad: 'users', entidadId: result.user.id, accion: 'create', req });
  if (result.createdAppointment) {
    await recordAudit({
      user: req.user,
      entidad: 'appointments',
      entidadId: result.createdAppointment.id,
      accion: 'create',
      req,
    });
  }

  const emailEnviado = await sendCredentialsEmailSafely(result);

  res.status(201).json({
    patient: sanitizeUser(result.user),
    appointment: result.createdAppointment,
    emailEnviado,
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: sanitizeUser(user) });
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).send();
}

async function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const previousUrl = req.user.avatarUrl;
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await req.user.update({ avatarUrl });

  if (previousUrl) {
    const previousPath = path.join(__dirname, '../../', previousUrl);
    fs.unlink(previousPath, () => {});
  }

  await recordAudit({ user: req.user, entidad: 'users', entidadId: req.user.id, accion: 'update', req, detalles: { field: 'avatarUrl' } });
  res.json({ user: sanitizeUser(req.user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
  }

  await req.user.update({ passwordHash: await bcrypt.hash(newPassword, 10) });
  await recordAudit({ user: req.user, entidad: 'users', entidadId: req.user.id, accion: 'update', req, detalles: { field: 'password' } });
  res.status(204).send();
}

// Aviso al iniciar sesión: no aplica a un usuario que solo es admin (sin rol médico/paciente).
async function getMyReminders(req, res) {
  if (req.user.hasRole('medico')) {
    return res.json(await getTomorrowAppointmentsForDoctor(req.user.id));
  }
  if (req.user.hasRole('paciente')) {
    return res.json(await getTomorrowAppointmentForPatient(req.user.id));
  }
  res.json({});
}

module.exports = { registerPatient, registerPatientByStaff, login, logout, me, uploadAvatar, changePassword, getMyReminders };
