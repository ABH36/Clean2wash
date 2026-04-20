const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Tracking routes
router.post('/update-location', trackingController.updateLocation);
router.get('/:bookingId/status', trackingController.getTrackingStatus);
router.post('/calculate-eta', trackingController.calculateETA);
router.post('/optimized-route', trackingController.getOptimizedRoute);
router.post('/traffic-conditions', trackingController.getTrafficConditions);
router.post('/navigation', trackingController.getNavigationInstructions);
router.post('/start-live-tracking', trackingController.startLiveTracking);
router.post('/stop-live-tracking', trackingController.stopLiveTracking);
router.get('/:bookingId/predict-arrival', trackingController.predictArrivalTime);
router.post('/calculate-distance', trackingController.calculateDistance);

module.exports = router;
