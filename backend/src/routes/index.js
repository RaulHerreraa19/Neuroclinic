const { Router } = require('express');

const router = Router();

router.use('/auth', require('./authRoutes'));
router.use('/doctors', require('./doctorRoutes'));
router.use('/', require('./scheduleRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/', require('./clinicalRecordRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/price-catalog', require('./priceCatalogRoutes'));

module.exports = router;
