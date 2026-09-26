const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, DoctorProfile, Appointment, PriceCatalogItem } = require('../models');
const { recordAudit } = require('../middleware/auditLog');
const { getRevenueSummary } = require('../services/revenue');
const { assertDoctorOwnedByAdmin } = require('../services/ownership');
const { setDoctorServices, SERVICIO_ATTRIBUTES } = require('../services/doctorServices');
const { todayDateOnly } = require('../utils/timeUtils');

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
    servicioIds,
  } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  const doctor = await sequelize.transaction(async (t) => {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create(
      { email, passwordHash, role: 'medico', roles: ['medico'], nombre, apellidoPaterno, apellidoMaterno, telefono },
      { transaction: t }
    );
    const profile = await DoctorProfile.create(
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
    if (Array.isArray(servicioIds)) await setDoctorServices(profile, servicioIds, t);
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
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'isActive', 'avatarUrl'],
      },
      { model: PriceCatalogItem, as: 'servicios', attributes: SERVICIO_ATTRIBUTES, through: { attributes: [] } },
    ],
    order: [[{ model: User, as: 'user' }, 'nombre', 'ASC']],
  });

  // Citas futuras no canceladas por doctor: se muestran al admin antes de desactivar a alguien,
  // porque desactivar no cancela citas automáticamente.
  const futureCounts = await Appointment.findAll({
    attributes: ['doctorId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    where: {
      doctorId: { [Op.in]: doctorProfiles.map((p) => p.userId) },
      fecha: { [Op.gte]: todayDateOnly() },
      estado: { [Op.notIn]: ['cancelada', 'completada', 'no_asistio'] },
    },
    group: ['doctorId'],
    raw: true,
  });
  const countByDoctor = Object.fromEntries(futureCounts.map((c) => [c.doctorId, Number(c.total)]));

  res.json({
    doctors: doctorProfiles.map((p) => ({ ...p.toJSON(), citasFuturas: countByDoctor[p.userId] || 0 })),
  });
}

// Edición completa del doctor por su admin dueño: datos de cuenta, perfil profesional y servicios.
async function updateDoctor(req, res) {
  const doctorId = req.params.id;
  const profile = await assertDoctorOwnedByAdmin(doctorId, req.user.id);
  const user = await User.findByPk(doctorId);

  const {
    email,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    telefono,
    cedulaProfesional,
    especialidad,
    biografia,
    duracionCitaMinutos,
    servicioIds,
  } = req.body;

  if (email && email !== user.email) {
    const taken = await User.findOne({ where: { email, id: { [Op.ne]: doctorId } } });
    if (taken) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
  }
  if (cedulaProfesional && cedulaProfesional !== profile.cedulaProfesional) {
    const taken = await DoctorProfile.findOne({ where: { cedulaProfesional, id: { [Op.ne]: profile.id } } });
    if (taken) return res.status(409).json({ error: 'Esa cédula profesional ya está registrada.' });
  }

  const userChanges = pickDefined({ email, nombre, apellidoPaterno, apellidoMaterno, telefono });
  const profileChanges = pickDefined({ cedulaProfesional, especialidad, biografia, duracionCitaMinutos });

  await sequelize.transaction(async (t) => {
    await user.update(userChanges, { transaction: t });
    await profile.update(profileChanges, { transaction: t });
    if (Array.isArray(servicioIds)) await setDoctorServices(profile, servicioIds, t);
  });

  await recordAudit({
    user: req.user,
    entidad: 'users',
    entidadId: doctorId,
    accion: 'update',
    req,
    detalles: {
      campos: [...Object.keys(userChanges), ...Object.keys(profileChanges), ...(Array.isArray(servicioIds) ? ['servicios'] : [])],
    },
  });
  res.json({ doctor: { id: user.id, email: user.email, nombre: user.nombre } });
}

// Baja/alta lógica: nunca se borra al doctor (sus citas, cobros y notas clínicas lo referencian
// y deben conservarse por NOM-004). Inactivo = no puede iniciar sesión ni aparece para agendar.
async function setDoctorStatus(req, res) {
  const doctorId = req.params.id;
  if (doctorId === req.user.id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' });
  }
  await assertDoctorOwnedByAdmin(doctorId, req.user.id);
  const user = await User.findByPk(doctorId);
  const { isActive } = req.body;

  await user.update({ isActive });
  await recordAudit({
    user: req.user,
    entidad: 'users',
    entidadId: doctorId,
    accion: 'update',
    req,
    detalles: { isActive },
  });
  res.json({ doctor: { id: user.id, isActive: user.isActive } });
}

function pickDefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
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

module.exports = { createDoctor, listMyDoctors, updateDoctor, setDoctorStatus, listAllAppointments, getRevenue };
