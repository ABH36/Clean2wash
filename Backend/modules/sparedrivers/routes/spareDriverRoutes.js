const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/spareDriverController');
const authMiddleware = require('../../../middlewares/authMiddleware');

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
router.get('/bookings', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.getBookings);
router.patch('/bookings/:id/accept', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.acceptBooking);
router.patch('/bookings/:id/status', authMiddleware.protect, authMiddleware.restrictTo('sparedriver'), ctrl.updateBookingStatus);

// ── Admin-Only Routes ──
router.get('/admin/drivers', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminListDrivers);
router.patch('/admin/drivers/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), ctrl.adminVerifyDriver);

module.exports = router;
