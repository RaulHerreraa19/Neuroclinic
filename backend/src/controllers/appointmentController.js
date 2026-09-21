const { Op } = require('sequelize');
const { assertDoctorOwnedByAdmin } = require('../services/ownership');
const { Appointment, User, DoctorProfile, PatientProfile } = require('../models');
const { computeAppointmentSlot, isSlotAvailable } = require('../services/appointments');
const { recordAudit } = require('../middleware/auditLog');

// Un paciente ya registrado agenda una cita de seguimiento (el flujo de primera vez pasa por
// authController.registerPatient, que crea la cuenta y la cita en un solo paso).
async function createAppointment(req, res) {
  const { doctorId, fecha, horaInicio, motivoConsulta } = req.body;

  const doctorProfile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!doctorProfile) return res.status(404).json({ error: 'Doctor no encontrado.' });

  const available = await isSlotAvailable(doctorId, fecha, horaInicio);
  if (!available) {
    return res.status(409).json({ error: 'Ese horario ya no está disponible. Elige otro.' });
  }

  const slot = computeAppointmentSlot(horaInicio, doctorProfile.duracionCitaMinutos);
  const appointment = await Appointment.create({
    patientId: req.user.id,
    doctorId,
    fecha,
    horaInicio: slot.horaInicio,
    horaFin: slot.horaFin,
    esPrimeraVez: false,
    motivoConsulta: motivoConsulta || null,
  });

  await recordAudit({ user: req.user, entidad: 'appointments', entidadId: appointment.id, accion: 'create', req });
  res.status(201).json({ appointment });
}

// El médico agenda a un paciente ya registrado desde su propio calendario (clic en un hueco
// libre + búsqueda de paciente), en vez de que el paciente lo haga por su cuenta.
async function createAppointmentForPatient(req, res) {
  const { patientId, fecha, horaInicio, motivoConsulta } = req.body;
  const doctorId = req.user.id;

  const patient = await User.findOne({ where: { id: patientId, roles: { [Op.contains]: ['paciente'] }, isActive: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });

  const doctorProfile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!doctorProfile) return res.status(404).json({ error: 'No tienes un perfil de doctor configurado.' });

  const available = await isSlotAvailable(doctorId, fecha, horaInicio);
  if (!available) {
    return res.status(409).json({ error: 'Ese horario ya no está disponible. Elige otro.' });
  }

  const slot = computeAppointmentSlot(horaInicio, doctorProfile.duracionCitaMinutos);
  const appointment = await Appointment.create({
    patientId,
    doctorId,
    fecha,
    horaInicio: slot.horaInicio,
    horaFin: slot.horaFin,
    esPrimeraVez: false,
    motivoConsulta: motivoConsulta || null,
  });

  await recordAudit({ user: req.user, entidad: 'appointments', entidadId: appointment.id, accion: 'create', req });
  res.status(201).json({ appointment });
}

async function listMyAppointments(req, res) {
  const appointments = await Appointment.findAll({
    where: { patientId: req.user.id },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'] }],
    order: [['fecha', 'DESC'], ['horaInicio', 'DESC']],
  });
  res.json({ appointments });
}

// Agenda de un doctor (el propio doctor o el admin dueño de ese doctor) para un rango de fechas.
async function listDoctorAppointments(req, res) {
  const { doctorId } = req.params;
  const { from, to } = req.query;

  if (req.user.hasRole('medico') && req.user.id === doctorId) {
    // el propio doctor: sin más validación
  } else if (req.user.hasRole('admin')) {
    await assertDoctorOwnedByAdmin(doctorId, req.user.id);
  } else {
    return res.status(403).json({ error: 'No puedes ver la agenda de otro doctor.' });
  }

  const where = { doctorId };
  if (from && to) where.fecha = { [Op.between]: [from, to] };

  const appointments = await Appointment.findAll({
    where,
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'email'],
        include: [
          {
            model: PatientProfile,
            as: 'patientProfile',
            attributes: ['fechaNacimiento', 'direccion', 'contactoEmergenciaNombre', 'contactoEmergenciaTelefono'],
          },
        ],
      },
    ],
    order: [['fecha', 'ASC'], ['horaInicio', 'ASC']],
  });
  res.json({ appointments });
}

async function cancelAppointment(req, res) {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

  const isOwnerPatient = req.user.hasRole('paciente') && appointment.patientId === req.user.id;
  const isOwnerDoctor = req.user.hasRole('medico') && appointment.doctorId === req.user.id;
  if (!isOwnerPatient && !isOwnerDoctor) {
    if (!req.user.hasRole('admin')) {
      return res.status(403).json({ error: 'No puedes cancelar esta cita.' });
    }
    await assertDoctorOwnedByAdmin(appointment.doctorId, req.user.id);
  }

  await appointment.update({ estado: 'cancelada' });
  await recordAudit({ user: req.user, entidad: 'appointments', entidadId: appointment.id, accion: 'update', req, detalles: { estado: 'cancelada' } });
  res.json({ appointment });
}

// El médico (o admin) confirma, marca completada o marca inasistencia.
async function updateStatus(req, res) {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

  const isOwnerDoctor = req.user.hasRole('medico') && appointment.doctorId === req.user.id;
  if (!isOwnerDoctor) {
    if (!req.user.hasRole('admin')) {
      return res.status(403).json({ error: 'No puedes modificar esta cita.' });
    }
    await assertDoctorOwnedByAdmin(appointment.doctorId, req.user.id);
  }

  const { estado } = req.body;
  const allowed = ['confirmada', 'completada', 'no_asistio', 'cancelada'];
  if (!allowed.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  await appointment.update({ estado });
  await recordAudit({ user: req.user, entidad: 'appointments', entidadId: appointment.id, accion: 'update', req, detalles: { estado } });
  res.json({ appointment });
}

module.exports = {
  createAppointment,
  createAppointmentForPatient,
  listMyAppointments,
  listDoctorAppointments,
  cancelAppointment,
  updateStatus,
};
