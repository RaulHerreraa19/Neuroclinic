const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const patientController = require('../controllers/patientController');

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
  ],
  validate,
  asyncHandler(patientController.updatePatient)
);

module.exports = router;
