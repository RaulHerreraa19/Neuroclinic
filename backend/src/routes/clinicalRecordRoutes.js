const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const clinicalRecordController = require('../controllers/clinicalRecordController');

const router = Router();

router.use(authenticate);

router.get(
  '/patients/:patientId/clinical-records',
  authorize('medico', 'admin'),
  asyncHandler(clinicalRecordController.listForPatient)
);
router.post(
  '/patients/:patientId/clinical-records',
  authorize('medico'),
  asyncHandler(clinicalRecordController.createRecord)
);
router.put(
  '/clinical-records/:id',
  authorize('medico'),
  asyncHandler(clinicalRecordController.updateRecord)
);

module.exports = router;
