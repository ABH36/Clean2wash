/**
 * 🚀 Dispatch Routes
 * 
 * Routes for dispatch engine management
 */

const express = require('express');
const router = express.Router();
const adminDispatchController = require('../controllers/adminDispatchController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// ── Dispatch Statistics ──────────────────────────────────────────
router.get('/stats', adminDispatchController.getDispatchStats);

// ── Auto-Assignment ──────────────────────────────────────────────
router.post('/assign/:bookingId', adminDispatchController.triggerAutoAssign);
router.get('/available-drivers/:bookingId', adminDispatchController.getAvailableDrivers);

// ── Queue Management ─────────────────────────────────────────────
router.post('/process-queue', adminDispatchController.processQueue);
router.post('/start', adminDispatchController.startDispatch);
router.post('/stop', adminDispatchController.stopDispatch);

// ── Pending & Stuck Bookings ─────────────────────────────────────
router.get('/pending-bookings', adminDispatchController.getPendingBookings);
router.get('/stuck-bookings', adminDispatchController.getStuckBookings);

module.exports = router;
