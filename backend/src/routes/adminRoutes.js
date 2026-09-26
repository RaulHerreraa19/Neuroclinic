const { Router } = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const adminController = require('../controllers/adminController');
const { doctorProfileValidators } = require('./doctorValidators');

const router = Router();

router.use(authenticate, authorize('admin'));

router.post(
  '/doctors',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('nombre').notEmpty(),
    body('apellidoPaterno').notEmpty(),
    body('cedulaProfesional').notEmpty(),
    body('especialidad').notEmpty(),
    ...doctorProfileValidators,
  ],
  validate,
  asyncHandler(adminController.createDoctor)
);
router.get('/doctors', asyncHandler(adminController.listMyDoctors));
router.put(
  '/doctors/:id',
  [
    param('id').isUUID(),
    body('email').optional().isEmail().withMessage('Correo inválido.'),
    body('nombre').optional().notEmpty().withMessage('El nombre es requerido.'),
    body('apellidoPaterno').optional().notEmpty().withMessage('El apellido paterno es requerido.'),
    body('cedulaProfesional').optional().notEmpty().withMessage('La cédula es requerida.'),
    body('especialidad').optional().notEmpty().withMessage('La especialidad es requerida.'),
    ...doctorProfileValidators,
  ],
  validate,
  asyncHandler(adminController.updateDoctor)
);
router.patch(
  '/doctors/:id/status',
  [param('id').isUUID(), body('isActive').isBoolean()],
  validate,
  asyncHandler(adminController.setDoctorStatus)
);
router.get('/appointments', asyncHandler(adminController.listAllAppointments));
router.get('/revenue', asyncHandler(adminController.getRevenue));

module.exports = router;
