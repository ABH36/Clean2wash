const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/adminServiceController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin'));

// Service routes
router.get('/', serviceController.getAllServices);
router.post('/initialize', serviceController.initializeServices);
router.get('/:type', serviceController.getService);
router.patch('/:type', serviceController.updateService);
router.patch('/:type/toggle', serviceController.toggleServiceStatus);

module.exports = router;
