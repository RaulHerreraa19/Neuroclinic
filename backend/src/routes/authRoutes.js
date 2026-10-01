const { Router } = require('express');
const { body } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadAvatar } = require('../middleware/upload');
const authController = require('../controllers/authController');
const { normalizeMxPhone } = require('../utils/phone');

const router = Router();

const patientDataValidators = [
  body('email').isEmail().withMessage('Correo inválido.'),
  body('nombre').notEmpty().withMessage('El nombre es requerido.'),
  body('apellidoPaterno').notEmpty().withMessage('El apellido paterno es requerido.'),
  // Obligatorio: es la vía de recuperación de contraseña por SMS.
  body('telefono')
    .custom((value) => normalizeMxPhone(value) !== null)
    .withMessage('Escribe un celular de 10 dígitos.'),
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

// Límite por dato de recuperación (correo/celular), no por IP: detrás de Vercel + Render todas
// las peticiones pueden llegar con la misma IP del proxy. El límite por cuenta (3 códigos/hora)
// y los 5 intentos por código viven en services/passwordReset.js.
function limitByIdentifier(limit, message) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const value = String(req.body?.identifier || '').trim().toLowerCase();
      return value.includes('@') ? value : normalizeMxPhone(value) || value;
    },
    message: { error: message },
  });
}

router.post(
  '/password-reset/request',
  [body('identifier').trim().notEmpty().withMessage('Escribe tu correo o tu celular.')],
  validate,
  limitByIdentifier(5, 'Demasiadas solicitudes. Intenta de nuevo en una hora o comunícate con la clínica.'),
  asyncHandler(authController.requestPasswordReset)
);
router.post(
  '/password-reset/confirm',
  [
    body('identifier').trim().notEmpty().withMessage('Escribe tu correo o tu celular.'),
    body('code').matches(/^\d{6}$/).withMessage('El código tiene 6 dígitos.'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
  ],
  validate,
  limitByIdentifier(20, 'Demasiados intentos. Pide un código nuevo en una hora o comunícate con la clínica.'),
  asyncHandler(authController.confirmPasswordReset)
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
