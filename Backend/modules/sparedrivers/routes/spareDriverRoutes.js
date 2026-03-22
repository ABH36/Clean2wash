const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/spareDriverController');
const authMiddleware = require('../../../middleware/authMiddleware');

// ── Public Driver Routes ──
router.post('/register', ctrl.register);

// ── Protected Driver Routes ──
router.post(
    '/upload-docs',
    authMiddleware.protect,
    authMiddleware.restrictTo('sparedriver'),
    ctrl.upload.fields([
        { name: 'aadhaarCard', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    ctrl.uploadDocuments
);
router.get('/profile', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getProfile);
router.patch('/toggle-online', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.toggleOnline);
router.get('/bookings', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getBookings);
router.patch('/location', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateLocation);
router.patch('/bookings/:id/accept', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.acceptBooking);
router.patch('/bookings/:id/status', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateBookingStatus);
router.patch('/bookings/:id/cancel', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.cancelBooking);
router.get('/history', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getTripHistory);
router.get('/transactions', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getTransactions);
router.get('/notifications', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getNotifications);
router.patch('/notifications/:id/read', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.markNotificationRead);
router.post('/fcm-token', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateFCMToken);

// ── Admin-Only Routes ──
router.get('/admin/drivers', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminListDrivers);
router.patch('/admin/drivers/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminVerifyDriver);

module.exports = router;
