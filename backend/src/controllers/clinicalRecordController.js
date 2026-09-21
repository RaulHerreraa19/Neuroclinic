const { ClinicalRecord, User } = require('../models');
const { recordAudit } = require('../middleware/auditLog');

// Solo el médico que atiende al paciente (o un admin) puede ver/editar su expediente.
// El paciente NO puede leer su propio expediente clínico crudo desde este endpoint (MVP):
// eso requiere una decisión clínica/legal aparte sobre qué tanto exponerle directamente.
function assertCanAccessPatient(req) {
  if (req.user.hasRole('admin') || req.user.hasRole('medico')) return;
  const err = new Error('No tienes permiso para ver expedientes clínicos.');
  err.status = 403;
  throw err;
}

async function listForPatient(req, res) {
  assertCanAccessPatient(req);
  const { patientId } = req.params;

  const records = await ClinicalRecord.findAll({
    where: { patientId },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'] }],
    order: [['fecha', 'DESC']],
  });

  await recordAudit({ user: req.user, entidad: 'clinical_records', entidadId: patientId, accion: 'read', req, detalles: { count: records.length } });
  res.json({ records });
}

async function createRecord(req, res) {
  if (!req.user.hasRole('medico')) {
    return res.status(403).json({ error: 'Solo un médico puede capturar el expediente clínico.' });
  }
  const { patientId } = req.params;
  const { appointmentId, motivo, evaluacion, diagnostico, planTratamiento, notasPrivadas } = req.body;

  const record = await ClinicalRecord.create({
    patientId,
    doctorId: req.user.id,
    appointmentId: appointmentId || null,
    fecha: new Date().toISOString().slice(0, 10),
    motivo,
    evaluacion,
    diagnostico,
    planTratamiento,
    notasPrivadas,
  });

  await recordAudit({ user: req.user, entidad: 'clinical_records', entidadId: record.id, accion: 'create', req });
  res.status(201).json({ record });
}

async function updateRecord(req, res) {
  const record = await ClinicalRecord.findByPk(req.params.id);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado.' });
  if (!req.user.hasRole('medico') || record.doctorId !== req.user.id) {
    return res.status(403).json({ error: 'No puedes editar este registro.' });
  }

  const { motivo, evaluacion, diagnostico, planTratamiento, notasPrivadas } = req.body;
  await record.update({ motivo, evaluacion, diagnostico, planTratamiento, notasPrivadas });

  await recordAudit({ user: req.user, entidad: 'clinical_records', entidadId: record.id, accion: 'update', req });
  res.json({ record });
}

module.exports = { listForPatient, createRecord, updateRecord };
