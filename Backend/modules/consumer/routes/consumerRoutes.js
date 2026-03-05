const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const vehicleController = require('../controllers/vehicleController');
const bookingController = require('../controllers/bookingController');
const serviceController = require('../controllers/serviceController');
const profileController = require('../controllers/profileController');
const paymentController = require('../controllers/paymentController');

// Authentication routes
router.post('/auth/send-otp', authController.sendOTP);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);
router.post('/auth/logout', authController.logout);

// Public routes (no authentication required)
router.get('/services', serviceController.getServices);
router.get('/services/:serviceId', serviceController.getServiceDetails);
router.get('/services/categories', serviceController.getServiceCategories);
router.get('/services/:serviceId/plans', serviceController.getServicePlans);
router.post('/services/calculate-pricing', serviceController.calculatePricing);
router.get('/services/time-slots', serviceController.getTimeSlots);
router.post('/services/validate-availability', serviceController.validateServiceAvailability);
router.get('/vehicles/types', vehicleController.getVehicleTypes);

// Payment routes (public - for getting key)
router.get('/payment/key', paymentController.getRazorpayKey);

// Protected routes (require authentication)
router.use(authController.protect);

// Profile routes
router.get('/profile', authController.getMe);
router.get('/profile/stats', profileController.getStats);
router.put('/profile', profileController.updateProfile);
router.put('/profile/address', profileController.updateAddress);
router.put('/profile/avatar', profileController.updateAvatar);

// Vehicle routes
router.get('/vehicles', vehicleController.getMyVehicles);
router.post('/vehicles', vehicleController.addVehicle);
router.get('/vehicles/:id', vehicleController.getVehicle);
router.put('/vehicles/:id', vehicleController.updateVehicle);
router.delete('/vehicles/:id', vehicleController.deleteVehicle);
router.patch('/vehicles/:id/set-primary', vehicleController.setPrimaryVehicle);
router.get('/vehicles/:id/compliance', vehicleController.getComplianceStatus);
router.post('/vehicles/fetch-vahan', vehicleController.fetchFromVAHAN);

// Service routes (protected)
router.post('/services/calculate-pricing', serviceController.calculatePricing);
router.get('/services/time-slots', serviceController.getTimeSlots);
router.post('/services/validate-availability', serviceController.validateServiceAvailability);

// Booking routes
router.get('/bookings', bookingController.getMyBookings);
router.get('/bookings/upcoming', bookingController.getUpcomingBookings);
router.get('/bookings/history', bookingController.getBookingHistory);
router.get('/bookings/stats', bookingController.getBookingStats);
router.post('/bookings', bookingController.createBooking);
router.get('/bookings/:id', bookingController.getBooking);
router.put('/bookings/:id', bookingController.updateBooking);
router.delete('/bookings/:id', bookingController.cancelBooking);
router.post('/bookings/:id/feedback', bookingController.submitFeedback);
router.post('/bookings/:id/issues', bookingController.reportIssue);

// Wallet routes
router.get('/wallet', profileController.getWallet);
router.post('/wallet/add', profileController.addToWallet);

// Payment routes (protected)
router.post('/payment/create-order', paymentController.createOrder);
router.post('/payment/verify', paymentController.verifyPayment);

// Notification routes
router.get('/notifications', profileController.getNotifications);
router.patch('/notifications/:notificationId/read', profileController.markNotificationRead);
router.patch('/notifications/read-all', profileController.markAllNotificationsRead);

// Account management
router.get('/subscription', profileController.getSubscription);
router.post('/subscription', profileController.createSubscription);
router.delete('/subscription', profileController.cancelSubscription);
router.delete('/account', profileController.deleteAccount);

module.exports = router;
