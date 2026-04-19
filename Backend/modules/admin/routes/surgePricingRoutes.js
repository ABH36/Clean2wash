const express = require('express');
const router = express.Router();
const surgePricingController = require('../controllers/adminSurgePricingController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin'));

// Surge pricing routes
router.get('/', surgePricingController.getAllRules);
router.post('/', surgePricingController.createRule);
router.post('/initialize', surgePricingController.initializeDefaultRules);
router.post('/test', surgePricingController.testRule);
router.get('/stats', surgePricingController.getRuleStats);
router.post('/bulk-update', surgePricingController.bulkUpdateRules);

router.get('/:id', surgePricingController.getRule);
router.patch('/:id', surgePricingController.updateRule);
router.delete('/:id', surgePricingController.deleteRule);
router.patch('/:id/toggle', surgePricingController.toggleRule);

module.exports = router;
