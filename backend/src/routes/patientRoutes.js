const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const patientController = require('../controllers/patientController');
const { normalizeMxPhone } = require('../utils/phone');

const router = Router();

// El admin no gestiona pacientes (solo a sus propios doctores): esta lista es exclusiva del médico.
router.use(authenticate, authorize('medico'));

// Nota de orden: /catalog debe ir antes de /:id para que Express no lo interprete como un id.
router.get('/catalog', asyncHandler(patientController.listPatients));
router.get('/', asyncHandler(patientController.searchPatients));
router.get('/:id', asyncHandler(patientController.getPatient));
router.patch(
  '/:id',
  [
    body('isActive').optional().isBoolean(),
    body('fechaNacimiento').optional().isISO8601(),
    body('sexo').optional().isIn(['masculino', 'femenino', 'otro']),
    body('telefono')
      .optional()
      .custom((value) => normalizeMxPhone(value) !== null)
      .withMessage('Escribe un celular de 10 dígitos.'),
  ],
  validate,
  asyncHandler(patientController.updatePatient)
);
router.post('/:id/reset-password', asyncHandler(patientController.resetPatientPassword));

module.exports = router;
