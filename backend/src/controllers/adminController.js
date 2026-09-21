const bcrypt = require('bcryptjs');
const { sequelize, User, DoctorProfile, Appointment } = require('../models');
const { recordAudit } = require('../middleware/auditLog');
const { getRevenueSummary } = require('../services/revenue');

async function createDoctor(req, res) {
  const {
    email,
    password,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    telefono,
    cedulaProfesional,
    especialidad,
    biografia,
    duracionCitaMinutos,
  } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  const doctor = await sequelize.transaction(async (t) => {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create(
      { email, passwordHash, role: 'medico', roles: ['medico'], nombre, apellidoPaterno, apellidoMaterno, telefono },
      { transaction: t }
    );
    await DoctorProfile.create(
      {
        userId: user.id,
        ownerAdminId: req.user.id,
        cedulaProfesional,
        especialidad,
        biografia: biografia || null,
        duracionCitaMinutos: duracionCitaMinutos || 45,
      },
      { transaction: t }
    );
    return user;
  });

  await recordAudit({
    user: req.user,
    entidad: 'users',
    entidadId: doctor.id,
    accion: 'create',
    req,
    detalles: { roles: ['medico'], ownerAdminId: req.user.id },
  });
  res.status(201).json({ doctor: { id: doctor.id, email: doctor.email, nombre: doctor.nombre } });
}

// Solo los doctores dados de alta por este admin (modelo multi-clínica): nunca todos los del sistema.
async function listMyDoctors(req, res) {
  const doctorProfiles = await DoctorProfile.findAll({
    where: { ownerAdminId: req.user.id },
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'isActive'] },
    ],
  });
  res.json({ doctors: doctorProfiles });
}

// Solo citas de los doctores propios del admin (nunca la operación de otras clínicas/admins).
async function listAllAppointments(req, res) {
  const appointments = await Appointment.findAll({
    include: [
      { model: User, as: 'patient', attributes: ['id', 'nombre', 'apellidoPaterno'] },
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'nombre', 'apellidoPaterno'],
        required: true,
        include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: [], where: { ownerAdminId: req.user.id } }],
      },
    ],
    order: [['fecha', 'DESC'], ['horaInicio', 'DESC']],
    limit: 200,
  });
  res.json({ appointments });
}

async function getRevenue(req, res) {
  const { from, to } = req.query;
  const summary = await getRevenueSummary({ ownerAdminId: req.user.id, from, to });
  res.json(summary);
}

module.exports = { createDoctor, listMyDoctors, listAllAppointments, getRevenue };
