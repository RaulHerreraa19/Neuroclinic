const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const doctorController = require('../controllers/doctorController');
const scheduleController = require('../controllers/scheduleController');
const appointmentController = require('../controllers/appointmentController');

const router = Router();

// Público: elegir doctor y ver su disponibilidad, sin necesidad de iniciar sesión.
router.get('/', asyncHandler(doctorController.listDoctors));
router.get('/:id', asyncHandler(doctorController.getDoctor));
router.get('/:id/availability', asyncHandler(doctorController.getAvailability));

// Horario recurrente y excepciones: solo el propio doctor o un admin.
router.get('/:doctorId/schedules', asyncHandler(scheduleController.listSchedules));
router.post(
  '/:doctorId/schedules',
  authenticate,
  authorize('medico', 'admin'),
  asyncHandler(scheduleController.createSchedule)
);
router.get('/:doctorId/schedule-exceptions', asyncHandler(scheduleController.listExceptions));
router.post(
  '/:doctorId/schedule-exceptions',
  authenticate,
  authorize('medico', 'admin'),
  asyncHandler(scheduleController.createException)
);

// Agenda del doctor (citas) para el propio doctor o un admin.
router.get(
  '/:doctorId/appointments',
  authenticate,
  authorize('medico', 'admin'),
  asyncHandler(appointmentController.listDoctorAppointments)
);

module.exports = router;
