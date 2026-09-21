const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const scheduleController = require('../controllers/scheduleController');

const router = Router();

router.put('/schedules/:id', authenticate, authorize('medico', 'admin'), asyncHandler(scheduleController.updateSchedule));
router.delete('/schedules/:id', authenticate, authorize('medico', 'admin'), asyncHandler(scheduleController.deleteSchedule));
router.delete(
  '/schedule-exceptions/:id',
  authenticate,
  authorize('medico', 'admin'),
  asyncHandler(scheduleController.deleteException)
);

module.exports = router;
