const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadAvatar } = require('../middleware/upload');
const authController = require('../controllers/authController');

const router = Router();

const patientDataValidators = [
  body('email').isEmail().withMessage('Correo inválido.'),
  body('nombre').notEmpty().withMessage('El nombre es requerido.'),
  body('apellidoPaterno').notEmpty().withMessage('El apellido paterno es requerido.'),
  body('fechaNacimiento').isISO8601().withMessage('Fecha de nacimiento inválida.'),
  body('sexo').isIn(['masculino', 'femenino', 'otro']),
  body('avisoPrivacidadAceptado').isBoolean(),
  body('appointment.doctorId').optional().isUUID(),
  body('appointment.fecha').optional().isISO8601(),
  body('appointment.horaInicio').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/),
];

router.post('/register-patient', patientDataValidators, validate, asyncHandler(authController.registerPatient));

// Un médico (o admin) da de alta a un paciente nuevo desde su calendario, p. ej. al recibir
// una llamada. No inicia sesión como el paciente: la cuenta creada es la del paciente.
router.post(
  '/register-patient-by-staff',
  authenticate,
  authorize('medico', 'admin'),
  patientDataValidators,
  validate,
  asyncHandler(authController.registerPatientByStaff)
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(authController.login)
);

router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), asyncHandler(authController.uploadAvatar));
router.put(
  '/me/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Escribe tu contraseña actual.'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
  ],
  validate,
  asyncHandler(authController.changePassword)
);
router.get('/me/reminders', authenticate, asyncHandler(authController.getMyReminders));

module.exports = router;
