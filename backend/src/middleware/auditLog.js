const { AuditLog } = require('../models');

// Registra un evento de auditoría (NOM-024): quién, qué entidad, qué acción, desde dónde.
// Se llama explícitamente desde los controladores tras la operación (create/read/update/delete),
// en vez de inferirlo genéricamente, para capturar el id real de la entidad afectada.
async function recordAudit({ user, entidad, entidadId, accion, req, detalles }) {
  await AuditLog.create({
    userId: user?.id ?? null,
    entidad,
    entidadId: entidadId ? String(entidadId) : null,
    accion,
    ipAddress: req?.ip ?? null,
    detalles: detalles ?? null,
  });
}

module.exports = { recordAudit };
