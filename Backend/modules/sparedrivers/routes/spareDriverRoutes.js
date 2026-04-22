const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/spareDriverController');
const authMiddleware = require('../../../middleware/authMiddleware');

// Import earnings routes
const earningsRoutes = require('./earningsRoutes');

// Import map controller (shared with consumer)
const mapController = require('../../consumer/controllers/mapController');

// ── MAP PROXY ROUTES (Public) ──────────────────────────────────
// These routes allow spare driver app to search addresses and reverse geocode
router.get('/maps/proxy/reverse', mapController.reverseGeocodeProxy);
router.get('/maps/proxy/search', mapController.searchProxy);

// Public driver auth
router.post('/auth/send-otp', ctrl.sendSignupOTP);
router.post('/auth/verify-otp', ctrl.verifySignupOTP);
router.post('/register', ctrl.register);
router.post(
    '/register-complete',
    ctrl.upload.fields([
        { name: 'aadhaarFront', maxCount: 1 },
        { name: 'aadhaarBack', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'policeVerification', maxCount: 1 }
    ]),
    ctrl.registerComplete
);
router.post('/login', ctrl.login);

// ── EARNINGS & PAYOUTS ─────────────────────────────────────────
router.use('/earnings', earningsRoutes);

// Protected driver routes
router.post(
    '/upload-docs',
    authMiddleware.protect,
    authMiddleware.restrictTo('sparedriver'),
    ctrl.upload.fields([
        { name: 'aadhaarFront', maxCount: 1 },
        { name: 'aadhaarBack', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    ctrl.uploadDocuments
);
router.get('/kit-payment/key', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getKitPaymentKey);
router.post('/kit-payment/order', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.createKitPaymentOrder);
router.post('/kit-payment/verify', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.verifyKitPayment);
router.get('/kit-config', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getKitConfig);
router.get('/premium-config', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getPremiumConfig);
router.post(
    '/kit-payment',
    authMiddleware.protect,
    authMiddleware.restrictTo('sparedriver'),
    ctrl.upload.fields([
        { name: 'paymentProof', maxCount: 1 }
    ]),
    ctrl.submitKitPaymentProof
);
router.get('/profile', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getProfile);
router.post('/inquiry', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.submitInquiry);
router.patch(
    '/profile-picture',
    authMiddleware.protect,
    authMiddleware.restrictTo('sparedriver'),
    ctrl.upload.fields([{ name: 'selfie', maxCount: 1 }]),
    ctrl.updateProfilePicture
);
router.patch(
    '/police-verification',
    authMiddleware.protect,
    authMiddleware.restrictTo('sparedriver'),
    ctrl.upload.fields([{ name: 'pvrFile', maxCount: 1 }]),
    ctrl.uploadPoliceVerification
);
router.patch('/profile', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateProfile);
router.patch('/toggle-online', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.toggleOnline);
router.patch('/availability', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateAvailability);
router.get('/bookings', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getBookings);
router.patch('/location', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateLocation);
router.patch('/bookings/:id/accept', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.acceptBooking);
router.patch('/bookings/:id/reject', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.rejectBooking);
router.patch('/bookings/:id/status', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateBookingStatus);
router.patch('/bookings/:id/cancel', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.cancelBooking);
router.get('/history', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getTripHistory);
router.get('/transactions', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getTransactions);
router.get('/notifications', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getNotifications);
router.patch('/notifications/:id/read', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.markNotificationRead);
router.delete('/notifications/clear', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.clearNotifications);
router.post('/fcm-token', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateFCMToken);
router.get('/duty-stats', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getDutyStats);
router.post('/emergency', authMiddleware.protect, ctrl.reportEmergency);

// 💬 Chat & Message Dummy Routes
router.get('/messages/unread-count', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getUnreadMessageCount);
router.get('/messages/active-chats', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getActiveChats);

// Admin-only routes
router.get('/admin/drivers', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminListDrivers);
router.patch('/admin/drivers/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminVerifyDriver);
router.patch('/admin/drivers/:id/premium', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminUpdatePremiumVerification);
router.patch('/admin/bookings/:id/assign', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminAssignBooking);
router.patch('/admin/bookings/:id/release', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminReleaseBooking);
router.patch('/admin/bookings/:id/cancel', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminCancelBooking);
router.patch('/admin/bookings/:id/issue', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminUpdateBookingIssue);

// ── EARNINGS ROUTES ────────────────────────────────────────────
router.use('/earnings', earningsRoutes);

module.exports = router;
