const express = require('express');
const {
    registerVendor,
    loginVendor,
    getMe,
    getDashboardStats,
    getStaff,
    addStaff,
    manageService,
    deleteService,
    getBookings,
    updateSubscription,
    handleBooking,
    assignTask,
    updateBookingStatus,
    manageAccessory,
    deleteAccessory,
    getAccessories,
    verifyOTP
} = require('./vendor.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.post('/register', registerVendor);
router.post('/login', loginVendor);
router.get('/me', protect, getMe);
router.get('/dashboard', protect, getDashboardStats);

router.put('/subscription', protect, updateSubscription);

router.get('/staff', protect, getStaff);
router.post('/staff', protect, addStaff);

router.post('/services', protect, manageService);
router.delete('/services/:id', protect, deleteService);

router.get('/bookings', protect, getBookings);
router.put('/bookings/:id/handle', protect, handleBooking);
router.put('/bookings/:id/assign', protect, assignTask);
router.put('/bookings/:id/status', protect, updateBookingStatus);
router.put('/bookings/:id/verify-otp', protect, verifyOTP);

router.get('/accessories', protect, getAccessories);
router.post('/accessories', protect, manageAccessory);
router.delete('/accessories/:id', protect, deleteAccessory);

module.exports = router;
