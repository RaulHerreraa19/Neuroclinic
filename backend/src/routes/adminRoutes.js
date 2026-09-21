const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const adminController = require('../controllers/adminController');

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
  ],
  validate,
  asyncHandler(adminController.createDoctor)
);
router.get('/doctors', asyncHandler(adminController.listMyDoctors));
router.get('/appointments', asyncHandler(adminController.listAllAppointments));
router.get('/revenue', asyncHandler(adminController.getRevenue));

module.exports = router;
