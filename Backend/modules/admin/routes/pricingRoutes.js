const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/adminPricingController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin'));

// Pricing configuration routes
router.get('/config', pricingController.getPricingConfig);
router.patch('/config', pricingController.updatePricingConfig);
router.get('/summary', pricingController.getPricingSummary);

// Calculate price (preview)
router.post('/calculate', pricingController.calculatePrice);

// Cancellation charges
router.get('/cancellation', pricingController.getCancellationCharges);
router.patch('/cancellation', pricingController.updateCancellationCharges);

// Toggle features
router.patch('/surge/toggle', pricingController.toggleSurge);
router.patch('/night/toggle', pricingController.toggleNightCharges);

module.exports = router;
