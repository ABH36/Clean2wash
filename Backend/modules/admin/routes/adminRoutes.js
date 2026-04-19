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
const adminConfigController = require('../controllers/adminConfigController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminDriverController = require('../controllers/adminDriverController');
const adminVehicleManagementController = require('../controllers/adminVehicleManagementController');
const authMiddleware = require('../../../middleware/authMiddleware');
const featureGuard = require('../../../middleware/featureGuard');

// ── SPARE DRIVER SERVICES (NEW PRICING ENGINE) ─────────────────
const serviceRoutes = require('./serviceRoutes');
const pricingRoutes = require('./pricingRoutes');
const surgePricingRoutes = require('./surgePricingRoutes');
const payoutRoutes = require('./payoutRoutes');
const penaltyRoutes = require('./penaltyRoutes');
const walletRoutes = require('./walletRoutes');

// Public Admin Route
router.post('/login', adminAuthController.login);

// Protect all routes after this middleware
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Platform Configuration & Permissions
router.get('/platform-config', adminConfigController.getPlatformConfig);
router.get('/permissions', adminConfigController.getAdminPermissions);

// Admin Profile
router.get('/profile', adminAuthController.getProfile);

// Admin Dashboard & Metrics
router.get('/dashboard', adminDashboardController.getDashboard);
router.get('/analytics', adminAnalyticsController.getDetailedAnalytics);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/kyc', adminController.updateUserKyc);
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

// ── Drivers Management (Spare Driver Lifecycle) ────────────────
router.get('/drivers', adminDriverController.getAllDrivers);
router.get('/drivers/:id', adminDriverController.getDriverById);
router.patch('/drivers/:id/approve', adminDriverController.approveDriver);
router.patch('/drivers/:id/reject', adminDriverController.rejectDriver);
router.patch('/drivers/:id/kit', adminDriverController.updateKitStatus);
router.patch('/drivers/:id/police', adminDriverController.updatePoliceVerification);
router.patch('/drivers/:id/status', adminDriverController.updateDriverStatus);

// ── PHASE 1: Driver Operations Upgrade ──────────────────────────
router.patch('/drivers/:id/online-status', adminDriverController.toggleOnlineStatus);
router.get('/drivers/:id/availability', adminDriverController.getDriverAvailability);
router.patch('/drivers/:id/availability', adminDriverController.updateAvailability);
router.get('/drivers/:id/reliability', adminDriverController.getReliabilityScore);
router.post('/drivers/:id/recalculate-reliability', adminDriverController.recalculateReliabilityScore);
router.get('/drivers/:id/utilization', adminDriverController.getUtilizationStats);
router.get('/drivers/available/search', adminDriverController.getAvailableDrivers);

// ── PHASE 2: Fatigue & Duty Control ─────────────────────────────
router.get('/drivers/:id/duty-hours', adminDriverController.getDutyHours);
router.patch('/drivers/:id/duty-limits', adminDriverController.updateDutyLimits);
router.post('/drivers/:id/record-break', adminDriverController.recordBreak);
router.get('/drivers/:id/booking-eligibility', adminDriverController.checkBookingEligibility);
router.get('/drivers/overworked/list', adminDriverController.getOverworkedDrivers);
router.get('/drivers/fatigue-alerts/all', adminDriverController.getFatigueAlerts);
router.post('/drivers/:id/acknowledge-alert', adminDriverController.acknowledgeFatigueAlert);
router.post('/drivers/:id/force-reset-duty', adminDriverController.forceResetDutyHours);

// ── PHASE 3: Vehicle Management ─────────────────────────────────
router.get('/vehicles', adminVehicleManagementController.getAllVehicles);
router.get('/vehicles/pending', adminVehicleManagementController.getPendingVehicles);
router.get('/vehicles/renewal-needed', adminVehicleManagementController.getVehiclesNeedingRenewal);
router.get('/vehicles/statistics', adminVehicleManagementController.getVehicleStatistics);
router.get('/vehicles/user/:userId', adminVehicleManagementController.getVehiclesByUser);
router.get('/vehicles/:id', adminVehicleManagementController.getVehicleById);
router.patch('/vehicles/:id/approve', adminVehicleManagementController.approveVehicle);
router.patch('/vehicles/:id/reject', adminVehicleManagementController.rejectVehicle);
router.patch('/vehicles/:id/classification', adminVehicleManagementController.updateClassification);
router.patch('/vehicles/:id/special-instructions', adminVehicleManagementController.updateSpecialInstructions);
router.patch('/vehicles/:id/admin-notes', adminVehicleManagementController.updateAdminNotes);
router.patch('/vehicles/:id/status', adminVehicleManagementController.updateVehicleStatus);
router.post('/vehicles/:id/report-issue', adminVehicleManagementController.reportIssue);
router.post('/vehicles/:id/resolve-issue', adminVehicleManagementController.resolveIssue);
router.post('/vehicles/bulk-approve', adminVehicleManagementController.bulkApprove);
router.delete('/vehicles/:id', adminVehicleManagementController.deleteVehicle);
router.get('/studio-wash/console', featureGuard.guard('STUDIO_WASH'), adminController.getStudioWashConsole);
router.get('/apartment-wash/console', featureGuard.guard('APARTMENT_WASH'), adminApartmentController.getApartmentWashConsole);
router.patch('/apartment-wash/subscriptions/:id/review', featureGuard.guard('APARTMENT_WASH'), adminApartmentController.reviewApartmentSubscription);

// ── Services CRUD (OLD - COMMENTED OUT) ───────────────────────
// TODO: These old service methods need to be implemented or removed
// router.get('/services', adminServiceController.getServices);
// router.get('/services/instant-config', adminServiceController.getInstantWashConfig);
// router.get('/services/chauffeur-config', adminServiceController.getChauffeurServiceConfig);
// router.get('/services/apartment-config', featureGuard.guard('APARTMENT_WASH'), adminServiceController.getApartmentWashConfig);
// router.patch('/services/instant-config/:id', featureGuard.guard('STUDIO_WASH'), adminServiceController.updateInstantWashService);
// router.patch('/services/chauffeur-config/:id', adminServiceController.updateChauffeurServiceConfig);
// router.patch('/services/apartment-config/:id', featureGuard.guard('APARTMENT_WASH'), adminServiceController.updateApartmentWashServiceConfig);
// router.post('/services', adminServiceController.createService);
// router.patch('/services/:id', adminServiceController.updateService);
// router.delete('/services/:id', adminServiceController.deleteService);

// ── SPARE DRIVER SERVICES (NEW PRICING ENGINE) ─────────────────
router.use('/spare-driver/services', serviceRoutes);
router.use('/spare-driver/pricing', pricingRoutes);
router.use('/spare-driver/surge-pricing', surgePricingRoutes);
router.use('/spare-driver/payouts', payoutRoutes);

// ── FINANCE MANAGEMENT ─────────────────────────────────────────
router.use('/finance/penalties', penaltyRoutes);
router.use('/finance/wallets', walletRoutes);

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
router.get('/hubs', featureGuard.guard('REGIONAL_STUDIOS'), adminHubController.getHubs);
router.post('/hubs', featureGuard.guard('REGIONAL_STUDIOS'), adminHubController.createHub);
router.patch('/hubs/:id', featureGuard.guard('REGIONAL_STUDIOS'), adminHubController.updateHub);
router.delete('/hubs/:id', featureGuard.guard('REGIONAL_STUDIOS'), adminHubController.deleteHub);

// ── Product Governance ────────────────────────────────────────
router.get('/products', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminController.getProducts);
router.get('/products/stats', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminProductController.getProductStats);
router.get('/products/inventory', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminProductController.getMasterInventory);
router.get('/products/live-missions', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminProductController.getLiveMissions);
router.post('/products/resolve-dispute', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminProductController.resolveProductDispute);

router.post('/verify-product', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminController.verifyProduct);

// Product Order Management (Phase 28)
router.get('/product-orders', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminController.getAllProductOrders);
router.patch('/product-orders/:id/status', featureGuard.guard('PRODUCT_ECOSYSTEM'), adminController.updateGlobalProductOrderStatus);

// --- Settings Routes ---
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSetting);

// --- Transaction Hub ---
router.get('/transactions', adminTransactionController.getAllTransactions);
router.get('/transactions/stats', adminTransactionController.getSettlementStats);
router.get('/transactions/analytics', adminTransactionController.getFinancialAnalytics);
router.patch('/transactions/:id/status', adminTransactionController.updateTransactionStatus);

// Audit Logs (P25)
router.get('/audit/logs', adminAuditController.getAuditLogs);
router.get('/audit/stats', adminAuditController.getAuditStats);

// --- Notification Management ---
router.get('/notifications', adminController.getNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationRead);
router.post('/notifications/read-all', adminController.clearAllNotifications);

module.exports = router;
