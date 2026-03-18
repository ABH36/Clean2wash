const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthController = require('../controllers/adminAuthController');
const adminServiceController = require('../controllers/adminServiceController');
const adminPromotionController = require('../controllers/adminPromotionController');
const adminSubscriptionController = require('../controllers/adminSubscriptionController');
const adminHubController = require('../controllers/adminHubController');
const adminVehicleController = require('../controllers/adminVehicleController');
const adminVehicleModelController = require('../controllers/adminVehicleModelController');
const adminTransactionController = require('../controllers/adminTransactionController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Public Admin Route
router.post('/login', adminAuthController.login);

// Protect all routes after this middleware
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Admin Profile
router.get('/profile', adminAuthController.getProfile);

// Admin Dashboard & Metrics
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminAnalyticsController.getDetailedAnalytics);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/bookings', adminController.getAllBookings);

// Admin Booking Management
router.get('/bookings/pending', adminController.getPendingBookings);
router.patch('/bookings/:id/status', adminController.updateBookingStatus);
router.post('/bookings/:id/assign-staff', adminController.assignStaff);
router.get('/captains', adminController.getActiveCaptains);
router.post('/bookings/:bookingId/assign', adminController.assignCaptain);

// ── Services CRUD ──────────────────────────────────────────────
router.get('/services', adminServiceController.getServices);
router.get('/services/instant-config', adminServiceController.getInstantWashConfig);
router.patch('/services/instant-config/:id', adminServiceController.updateInstantWashService);
router.post('/services', adminServiceController.createService);
router.patch('/services/:id', adminServiceController.updateService);
router.delete('/services/:id', adminServiceController.deleteService);

// ── Vehicle Catalog CRUD ──────────────────────────────────────
router.get('/vehicle-types', adminVehicleController.getVehicleTypes);
router.post('/vehicle-types', adminVehicleController.createVehicleType);
router.patch('/vehicle-types/:id', adminVehicleController.updateVehicleType);
router.delete('/vehicle-types/:id', adminVehicleController.deleteVehicleType);

// Specific Vehicle Models CRUD
router.get('/vehicle-models', adminVehicleModelController.getAllVehicleModels);
router.get('/vehicle-models/:id', adminVehicleModelController.getVehicleModel);
router.post('/vehicle-models', adminVehicleModelController.createVehicleModel);
router.patch('/vehicle-models/:id', adminVehicleModelController.updateVehicleModel);
router.delete('/vehicle-models/:id', adminVehicleModelController.deleteVehicleModel);

// ── Promotions CRUD ───────────────────────────────────────────
router.get('/promotions', adminPromotionController.getPromotions);
router.post('/promotions', adminPromotionController.createPromotion);
router.patch('/promotions/:id', adminPromotionController.updatePromotion);
router.delete('/promotions/:id', adminPromotionController.deletePromotion);

// Admin Subscription Plans
router.get('/plans', adminSubscriptionController.getPlans);
router.post('/plans', adminSubscriptionController.createPlan);
router.patch('/plans/:id', adminSubscriptionController.updatePlan);
router.delete('/plans/:id', adminSubscriptionController.deletePlan);

// ── Hubs CRUD ──────────────────────────────────────────────
router.get('/hubs', adminHubController.getHubs);
router.post('/hubs', adminHubController.createHub);
router.patch('/hubs/:id', adminHubController.updateHub);
router.delete('/hubs/:id', adminHubController.deleteHub);

// ── Product Governance ────────────────────────────────────────
router.get('/products', adminController.getProducts);
router.post('/verify-product', adminController.verifyProduct);

// --- Settings Routes ---
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSetting);

// --- Transaction Hub ---
router.get('/transactions', adminTransactionController.getAllTransactions);
router.patch('/transactions/:id/status', adminTransactionController.updateTransactionStatus);

module.exports = router;
