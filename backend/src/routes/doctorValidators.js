const { body } = require('express-validator');

// Campos del perfil profesional que puede editar tanto el admin como el propio doctor.
const doctorProfileValidators = [
  body('duracionCitaMinutos')
    .optional()
    .isInt({ min: 10, max: 240 })
    .withMessage('La duración de la consulta debe estar entre 10 y 240 minutos.')
    .toInt(),
  body('biografia').optional({ nullable: true }).isString(),
  body('servicioIds').optional().isArray().withMessage('Servicios inválidos.'),
  body('servicioIds.*').isUUID().withMessage('Servicio inválido.'),
];

module.exports = { doctorProfileValidators };
