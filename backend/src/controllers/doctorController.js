const { Op } = require('sequelize');
const { sequelize, User, DoctorProfile, PriceCatalogItem } = require('../models');
const { recordAudit } = require('../middleware/auditLog');
const { setDoctorServices, SERVICIO_ATTRIBUTES } = require('../services/doctorServices');
const { getAvailableSlots } = require('../services/availability');

// Listado público de doctores activos, para que el paciente elija con quién agendar.
async function listDoctors(req, res) {
  const doctors = await User.findAll({
    where: { roles: { [Op.contains]: ['medico'] }, isActive: true },
    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'],
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        attributes: ['especialidad', 'biografia', 'duracionCitaMinutos'],
        include: [publicServiciosInclude()],
      },
    ],
  });
  res.json({ doctors });
}

async function getDoctor(req, res) {
  const doctor = await User.findOne({
    where: { id: req.params.id, roles: { [Op.contains]: ['medico'] }, isActive: true },
    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'],
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        attributes: ['especialidad', 'biografia', 'duracionCitaMinutos'],
        include: [publicServiciosInclude()],
      },
    ],
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado.' });
  res.json({ doctor });
}

async function getAvailability(req, res) {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Debes indicar los parámetros "from" y "to" (YYYY-MM-DD).' });
  }
  const availability = await getAvailableSlots(req.params.id, from, to);
  res.json({ availability });
}

function publicServiciosInclude() {
  return {
    model: PriceCatalogItem,
    as: 'servicios',
    attributes: SERVICIO_ATTRIBUTES,
    where: { activo: true },
    required: false,
    through: { attributes: [] },
  };
}

async function loadMyProfile(userId) {
  return DoctorProfile.findOne({
    where: { userId },
    include: [{ model: PriceCatalogItem, as: 'servicios', attributes: SERVICIO_ATTRIBUTES, through: { attributes: [] } }],
  });
}

async function getMyProfile(req, res) {
  const profile = await loadMyProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: 'No tienes un perfil de doctor configurado.' });
  res.json({ profile });
}

// El doctor ajusta lo operativo de su consulta. Datos de identidad/credenciales (nombre, cédula,
// especialidad) solo los edita su admin, para que no cambien sin control de la clínica.
async function updateMyProfile(req, res) {
  const profile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ error: 'No tienes un perfil de doctor configurado.' });

  const { duracionCitaMinutos, biografia, servicioIds } = req.body;
  const changes = {
    ...(duracionCitaMinutos !== undefined && { duracionCitaMinutos }),
    ...(biografia !== undefined && { biografia: biografia || null }),
  };

  await sequelize.transaction(async (t) => {
    await profile.update(changes, { transaction: t });
    if (Array.isArray(servicioIds)) await setDoctorServices(profile, servicioIds, t);
  });

  await recordAudit({
    user: req.user,
    entidad: 'doctor_profiles',
    entidadId: profile.id,
    accion: 'update',
    req,
    detalles: { campos: [...Object.keys(changes), ...(Array.isArray(servicioIds) ? ['servicios'] : [])] },
  });
  res.json({ profile: await loadMyProfile(req.user.id) });
}

module.exports = { listDoctors, getDoctor, getAvailability, getMyProfile, updateMyProfile };
