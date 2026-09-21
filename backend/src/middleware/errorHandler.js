function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el tamaño máximo permitido (2MB).' : err.message;
    return res.status(400).json({ error: message });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Ese horario acaba de ser reservado por alguien más. Elige otro.' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors?.[0]?.message || 'Datos inválidos.' });
  }

  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor.' : err.message,
  });
}

module.exports = { asyncHandler, errorHandler };
