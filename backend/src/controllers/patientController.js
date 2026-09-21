const { Op } = require('sequelize');
const { sequelize, User, PatientProfile } = require('../models');
const { recordAudit } = require('../middleware/auditLog');

const PATIENT_ATTRIBUTES = ['id', 'email', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'isActive'];
const PROFILE_ATTRIBUTES = ['fechaNacimiento', 'sexo', 'direccion', 'contactoEmergenciaNombre', 'contactoEmergenciaTelefono'];

// Búsqueda rápida (usada al agendar una cita desde el calendario): solo pacientes activos,
// resultados acotados, sin datos clínicos.
async function searchPatients(req, res) {
  const q = (req.query.q || '').trim();
  const where = { roles: { [Op.contains]: ['paciente'] }, isActive: true };
  if (q) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${q}%` } },
      { apellidoPaterno: { [Op.iLike]: `%${q}%` } },
      { apellidoMaterno: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const patients = await User.findAll({
    where,
    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'email', 'telefono'],
    order: [['nombre', 'ASC']],
    limit: 20,
  });
  res.json({ patients });
}

// Catálogo completo (incluye inactivos) para la sección "Pacientes" del médico/admin, donde se
// gestionan los datos de contacto y el estado activo/inactivo — no el expediente clínico.
async function listPatients(req, res) {
  const patients = await User.findAll({
    where: { roles: { [Op.contains]: ['paciente'] } },
    attributes: PATIENT_ATTRIBUTES,
    include: [{ model: PatientProfile, as: 'patientProfile', attributes: PROFILE_ATTRIBUTES }],
    order: [['nombre', 'ASC']],
  });
  res.json({ patients });
}

async function getPatient(req, res) {
  const patient = await User.findOne({
    where: { id: req.params.id, roles: { [Op.contains]: ['paciente'] } },
    attributes: PATIENT_ATTRIBUTES,
    include: [{ model: PatientProfile, as: 'patientProfile', attributes: PROFILE_ATTRIBUTES }],
  });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
  res.json({ patient });
}

// Edita datos de contacto/demográficos y el estado activo/inactivo. El correo no es editable
// aquí (es el identificador de acceso) y el expediente clínico tiene su propio flujo, aparte.
async function updatePatient(req, res) {
  const patient = await User.findOne({ where: { id: req.params.id, roles: { [Op.contains]: ['paciente'] } } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });

  const {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    telefono,
    isActive,
    direccion,
    contactoEmergenciaNombre,
    contactoEmergenciaTelefono,
    fechaNacimiento,
    sexo,
  } = req.body;

  await sequelize.transaction(async (t) => {
    await patient.update(
      {
        ...(nombre !== undefined && { nombre }),
        ...(apellidoPaterno !== undefined && { apellidoPaterno }),
        ...(apellidoMaterno !== undefined && { apellidoMaterno }),
        ...(telefono !== undefined && { telefono }),
        ...(isActive !== undefined && { isActive }),
      },
      { transaction: t }
    );

    const profile = await PatientProfile.findOne({ where: { userId: patient.id }, transaction: t });
    if (profile) {
      await profile.update(
        {
          ...(direccion !== undefined && { direccion }),
          ...(contactoEmergenciaNombre !== undefined && { contactoEmergenciaNombre }),
          ...(contactoEmergenciaTelefono !== undefined && { contactoEmergenciaTelefono }),
          ...(fechaNacimiento !== undefined && { fechaNacimiento }),
          ...(sexo !== undefined && { sexo }),
        },
        { transaction: t }
      );
    }
  });

  await recordAudit({
    user: req.user,
    entidad: 'users',
    entidadId: patient.id,
    accion: 'update',
    req,
    detalles: { camposActualizados: Object.keys(req.body) },
  });

  const updated = await User.findOne({
    where: { id: patient.id },
    attributes: PATIENT_ATTRIBUTES,
    include: [{ model: PatientProfile, as: 'patientProfile', attributes: PROFILE_ATTRIBUTES }],
  });
  res.json({ patient: updated });
}

module.exports = { searchPatients, listPatients, getPatient, updatePatient };
