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
const adminAuditController = require('../controllers/adminAuditController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const adminProductController = require('../controllers/adminProductController');
const adminApartmentController = require('../controllers/adminApartmentController');
const authMiddleware = require('../../../middleware/authMiddleware');

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
router.get('/spare-drivers', adminController.getSpareDrivers);
router.get('/bookings/chauffeur', adminController.getSpareDriverBookings);
router.get('/apartment-wash/console', adminApartmentController.getApartmentWashConsole);
router.patch('/apartment-wash/subscriptions/:id/review', adminApartmentController.reviewApartmentSubscription);

// ── Services CRUD ──────────────────────────────────────────────
router.get('/services', adminServiceController.getServices);
router.get('/services/instant-config', adminServiceController.getInstantWashConfig);
router.get('/services/chauffeur-config', adminServiceController.getChauffeurServiceConfig);
router.get('/services/apartment-config', adminServiceController.getApartmentWashConfig);
router.patch('/services/instant-config/:id', adminServiceController.updateInstantWashService);
router.patch('/services/chauffeur-config/:id', adminServiceController.updateChauffeurServiceConfig);
router.patch('/services/apartment-config/:id', adminServiceController.updateApartmentWashServiceConfig);
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
router.get('/vehicle-models/suggestions', adminVehicleModelController.getPendingSuggestions);
router.get('/vehicle-models/:id', adminVehicleModelController.getVehicleModel);
router.post('/vehicle-models', adminVehicleModelController.createVehicleModel);
router.patch('/vehicle-models/:id', adminVehicleModelController.updateVehicleModel);
router.patch('/vehicle-models/:id/review', adminVehicleModelController.reviewSuggestion);
router.delete('/vehicle-models/:id', adminVehicleModelController.deleteVehicleModel);

// ── Promotions CRUD ───────────────────────────────────────────
router.get('/promotions', adminPromotionController.getPromotions);
router.post('/promotions', adminPromotionController.createPromotion);
router.patch('/promotions/:id', adminPromotionController.updatePromotion);
router.delete('/promotions/:id', adminPromotionController.deletePromotion);

// Admin Subscription Plans
router.get('/plans', adminSubscriptionController.getPlans);
router.get('/plans/chauffeur', adminSubscriptionController.getChauffeurPlans);
router.post('/plans', adminSubscriptionController.createPlan);
router.post('/plans/chauffeur', adminSubscriptionController.createChauffeurPlan);
router.patch('/plans/:id', adminSubscriptionController.updatePlan);
router.patch('/plans/chauffeur/:id', adminSubscriptionController.updateChauffeurPlan);
router.delete('/plans/:id', adminSubscriptionController.deletePlan);
router.delete('/plans/chauffeur/:id', adminSubscriptionController.deleteChauffeurPlan);

// Admin User Subscriptions (Active Instances)
router.get('/subscriptions', adminSubscriptionController.getAllSubscriptions);

// ── Hubs CRUD ──────────────────────────────────────────────
router.get('/hubs', adminHubController.getHubs);
router.post('/hubs', adminHubController.createHub);
router.patch('/hubs/:id', adminHubController.updateHub);
router.delete('/hubs/:id', adminHubController.deleteHub);

// ── Product Governance ────────────────────────────────────────
router.get('/products', adminController.getProducts);
router.get('/products/stats', adminProductController.getProductStats);
router.get('/products/inventory', adminProductController.getMasterInventory);
router.get('/products/live-missions', adminProductController.getLiveMissions);
router.post('/products/resolve-dispute', adminProductController.resolveProductDispute);

router.post('/verify-product', adminController.verifyProduct);

// Product Order Management (Phase 28)
router.get('/product-orders', adminController.getAllProductOrders);
router.patch('/product-orders/:id/status', adminController.updateGlobalProductOrderStatus);

// --- Settings Routes ---
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSetting);

// --- Transaction Hub ---
router.get('/transactions', adminTransactionController.getAllTransactions);
router.get('/transactions/stats', adminTransactionController.getSettlementStats);
router.patch('/transactions/:id/status', adminTransactionController.updateTransactionStatus);

// Audit Logs (P25)
router.get('/audit/logs', adminAuditController.getAuditLogs);
router.get('/audit/stats', adminAuditController.getAuditStats);

// --- Notification Management ---
router.get('/notifications', adminController.getNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationRead);
router.post('/notifications/read-all', adminController.clearAllNotifications);

module.exports = router;
