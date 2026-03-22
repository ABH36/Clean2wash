const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../../../middleware/authMiddleware');

// Get all active banners
router.get('/banners', protect, serviceController.getBanners);

// Get all active services
router.get('/', protect, serviceController.getServices);

// Calculate service pricing dynamically
router.post('/calculate-pricing', protect, serviceController.calculatePricing);

// Get available subscription plans
router.get('/plans', protect, serviceController.getPlans);

// Get active referral promotion
router.get('/promotions/active-referral', protect, serviceController.getActiveReferral);

// Get specific service details
router.get('/:serviceId', protect, serviceController.getServiceDetails);

module.exports = router;
