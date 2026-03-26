const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const vehicleController = require('../controllers/vehicleController');
const bookingController = require('../controllers/bookingController');
const serviceController = require('../controllers/serviceController');
const productController = require('../controllers/productController');
const profileController = require('../controllers/profileController');
const paymentController = require('../controllers/paymentController');
const mapController = require('../controllers/mapController');
const reviewController = require('../controllers/reviewController');
const sosController = require('../controllers/sosController');
const webhookController = require('../controllers/webhookController');

// Import Auth Middleware
const authMiddleware = require('../../../middleware/authMiddleware');

const walletRoutes = require('./walletRoutes');
const referralRoutes = require('./referralRoutes');

// Authentication routes
router.post('/auth/send-otp', authController.sendOTP);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);
router.post('/auth/logout', authController.logout);
router.post('/auth/fcm-token', authMiddleware.protect, authController.updateFCMToken);

// Public routes (no authentication required)
router.get('/services', serviceController.getServices);
router.get('/services/banners', serviceController.getBanners);
router.get('/services/categories', serviceController.getServiceCategories);
router.get('/services/home', authMiddleware.optionalProtect, serviceController.getHomeData);
router.get('/services/apartment-flow', serviceController.getApartmentFlowData);
router.get('/services/instant-config', serviceController.getInstantWashConfig);
router.get('/services/search', serviceController.search);
router.get('/services/stats', serviceController.getPlatformStats);

router.get('/portfolio', authMiddleware.optionalProtect, serviceController.getPortfolio);
router.patch('/portfolio/:id/like', serviceController.likePortfolioItem);
router.get('/services/promotions', authMiddleware.optionalProtect, serviceController.getPromotionalCards);
router.post('/services/promotions/validate-coupon', authMiddleware.protect, serviceController.validateCoupon);
router.get('/hubs', serviceController.getHubs);
router.get('/services/vehicle-models', serviceController.getVehicleModels);

// Product routes
router.get('/products', productController.getProducts);
router.get('/products/trending', productController.getTrendingProducts);
router.get('/eshop/metadata', productController.getEshopMetadata);
router.get('/products/:id', productController.getProductDetails);

// Service Routes (Specific endpoints before parameterized)
router.get('/services/plans', serviceController.getPlans);
router.get('/services/promotions/active-referral', serviceController.getActiveReferral);
router.post('/services/calculate-pricing', serviceController.calculatePricing);
router.get('/services/time-slots', serviceController.getTimeSlots);
router.post('/services/validate-availability', serviceController.validateServiceAvailability);
router.get('/services/:serviceId/plans', serviceController.getServicePlans);
router.get('/services/:serviceId', serviceController.getServiceDetails);

router.get('/vehicles/types', vehicleController.getVehicleTypes);

// Payment routes (public - for getting key and webhooks)
router.get('/payment/key', paymentController.getRazorpayKey);
router.post('/payment/webhook', webhookController.handleRazorpayWebhook);

// Map Proxy routes
router.get('/maps/proxy/reverse', mapController.reverseGeocodeProxy);
router.get('/maps/proxy/search', mapController.searchProxy);

// Protected routes (require authentication)
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('consumer'));

// Wallet routes
router.use('/wallet', walletRoutes);
router.use('/referral', referralRoutes);

// Profile routes
router.get('/profile', authController.getMe);
router.get('/profile/stats', profileController.getStats);
router.put('/profile', profileController.updateProfile);
router.put('/profile/address', profileController.updateAddress); // Legacy
router.put('/profile/avatar', profileController.updateAvatar);

// Modern Multi-Address Routes (Phase 1)
const locationController = require('../controllers/locationController');
router.get('/profile/addresses', locationController.getAddresses);
router.post('/profile/addresses', locationController.addAddress);
router.put('/profile/addresses/:addressId', locationController.updateAddress);
router.delete('/profile/addresses/:addressId', locationController.deleteAddress);
router.patch('/profile/addresses/:addressId/primary', locationController.setPrimaryAddress);

// Vehicle routes
router.get('/vehicles', vehicleController.getMyVehicles);
router.post('/vehicles', vehicleController.addVehicle);
router.get('/vehicles/:id', vehicleController.getVehicle);
router.put('/vehicles/:id', vehicleController.updateVehicle);
router.delete('/vehicles/:id', vehicleController.deleteVehicle);
router.patch('/vehicles/:id/set-primary', vehicleController.setPrimaryVehicle);
router.get('/vehicles/:id/compliance', vehicleController.getComplianceStatus);
router.post('/vehicles/fetch-vahan', vehicleController.fetchFromVAHAN);

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

// Product Order routes
const orderController = require('../controllers/orderController');
router.get('/orders', orderController.getMyOrders);
router.post('/orders', orderController.createOrder);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders/verify-payment', orderController.verifyOrderPayment);

// Product Review routes
router.post('/products/:orderId/items/:productId/review', reviewController.submitProductReview);
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Payment routes (protected)
router.post('/payment/create-order', paymentController.createOrder);
router.post('/payment/verify', paymentController.verifyPayment);

// Notification routes
router.get('/notifications', profileController.getNotifications);
router.patch('/notifications/:notificationId/read', profileController.markNotificationRead);
router.patch('/notifications/read-all', profileController.markAllNotificationsRead);
router.delete('/notifications/clear', profileController.clearNotifications);

// Trusted Contacts routes
router.get('/profile/trusted-contacts', profileController.getTrustedContacts);
router.post('/profile/trusted-contacts', profileController.addTrustedContact);
router.delete('/profile/trusted-contacts/:contactId', profileController.removeTrustedContact);

// Payment Methods routes
router.get('/profile/payment-methods', profileController.getPaymentMethods);
router.post('/profile/payment-methods', profileController.addPaymentMethod);
router.delete('/profile/payment-methods/:methodId', profileController.removePaymentMethod);
router.patch('/profile/payment-methods/:methodId/default', profileController.setDefaultPaymentMethod);

// SOS Alert routes
router.post('/sos', sosController.triggerSOS);
router.get('/sos/:id', sosController.getSOSStatus);
router.patch('/sos/:id/resolve', sosController.resolveSOS);

// Account management
router.get('/subscription', profileController.getSubscription);
router.post('/subscription', profileController.createSubscription);
router.patch('/subscription/pause', profileController.pauseSubscription);
router.patch('/subscription/resume', profileController.resumeSubscription);
router.delete('/subscription', profileController.cancelSubscription);
router.post('/subscription/use-credit', profileController.useSubscriptionCredit);
router.delete('/account', profileController.deleteAccount);

module.exports = router;
