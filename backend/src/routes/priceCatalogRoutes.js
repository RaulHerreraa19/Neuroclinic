const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const priceCatalogController = require('../controllers/priceCatalogController');

const router = Router();

router.use(authenticate, authorize('admin', 'medico'));

router.get('/', asyncHandler(priceCatalogController.listCatalog));
router.post(
  '/',
  authorize('admin'),
  [body('nombre').notEmpty(), body('precio').isFloat({ min: 0 })],
  validate,
  asyncHandler(priceCatalogController.createItem)
);
router.patch('/:id', authorize('admin'), asyncHandler(priceCatalogController.updateItem));
router.delete('/:id', authorize('admin'), asyncHandler(priceCatalogController.deactivateItem));

module.exports = router;
