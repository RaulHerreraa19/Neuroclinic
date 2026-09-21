const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const appointmentController = require('../controllers/appointmentController');
const paymentController = require('../controllers/paymentController');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('paciente'),
  [
    body('doctorId').isUUID(),
    body('fecha').isISO8601(),
    body('horaInicio').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  ],
  validate,
  asyncHandler(appointmentController.createAppointment)
);

router.post(
  '/doctor',
  authorize('medico'),
  [
    body('patientId').isUUID(),
    body('fecha').isISO8601(),
    body('horaInicio').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  ],
  validate,
  asyncHandler(appointmentController.createAppointmentForPatient)
);

router.get('/me', authorize('paciente'), asyncHandler(appointmentController.listMyAppointments));
router.patch('/:id/cancel', asyncHandler(appointmentController.cancelAppointment));
router.patch('/:id/status', authorize('medico', 'admin'), asyncHandler(appointmentController.updateStatus));

router.get('/:id/payment', authorize('medico', 'admin'), asyncHandler(paymentController.getPayment));
router.post('/:id/payment', authorize('medico', 'admin'), asyncHandler(paymentController.createPayment));
router.patch('/:id/payment', authorize('medico', 'admin'), asyncHandler(paymentController.updatePayment));

module.exports = router;
