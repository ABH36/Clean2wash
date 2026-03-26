const express = require('express');
const router = express.Router();
const vendorAuthController = require('../controllers/vendorAuthController');
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../../../middleware/authMiddleware');

const vendorNotificationController = require('../controllers/vendorNotificationController');
const productLogisticsController = require('../controllers/productLogisticsController');


// Public route
router.post('/login', vendorAuthController.login);
router.post('/signup', vendorAuthController.register);
router.post('/send-otp', vendorAuthController.sendOTP);
router.post('/fcm-token', authMiddleware.protect, vendorAuthController.updateFCMToken);

// Protected routes (Only accessible by Vendors)
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('vendor'));

// Notification routes
router.get('/notifications', vendorNotificationController.getMyNotifications);
router.patch('/notifications/:id/read', vendorNotificationController.markAsRead);
router.patch('/notifications/read-all', vendorNotificationController.markAllRead);
router.delete('/notifications/clear', vendorNotificationController.clearNotifications);

router.get('/profile', vendorAuthController.getProfile);
router.patch('/profile', vendorAuthController.updateProfile);
router.get('/dashboard', vendorController.getDashboard);
router.get('/orders', vendorController.getOrders);
router.get('/leads', vendorController.getAvailableLeads); // Lead Board
router.post('/leads/:orderId/accept', vendorController.acceptLead); // Accept Lead
router.get('/orders/:orderId', vendorController.getOrderById);
router.patch('/orders/:orderId/status', vendorController.updateOrderStatus);
router.post('/orders/:orderId/verify-pin', vendorController.verifyBookingPin);
router.post('/orders/:orderId/assign-staff', vendorController.assignStaff);

// Product Order Management (Phase 28 & 30)
router.get('/product-orders', vendorController.getMyProductOrders);
router.patch('/product-orders/:orderId/items/:itemId', vendorController.updateProductOrderItemStatus);
router.post('/product-orders/:orderId/items/:itemId/assign', productLogisticsController.assignProductDeliveryAgent);
router.post('/product-orders/:orderId/items/:itemId/broadcast', productLogisticsController.broadcastProductPickup);
router.post('/product-orders/:orderId/items/:itemId/verify-pin', productLogisticsController.verifyProductDeliveryPin);
router.post('/product-orders/:orderId/items/:itemId/cancel', productLogisticsController.cancelProductItem);
router.post('/product-orders/:orderId/items/:itemId/return-ack', productLogisticsController.markAsReturned);


// Product Management
router.get('/products', vendorController.getProducts);
router.post('/products', vendorController.createProduct);
router.patch('/products/:productId', vendorController.updateProduct);
router.delete('/products/:productId', vendorController.deleteProduct);

// Service Management
router.get('/services', vendorController.getServices);
router.post('/services', vendorController.createService);
router.patch('/services/:serviceId', vendorController.updateService);
router.delete('/services/:serviceId', vendorController.deleteService);

// Customer & Reports
router.get('/customers', vendorController.getCustomers);
router.get('/reports', vendorController.getReports);

// Staff Management
router.get('/staff', vendorController.getStaff);
router.get('/staff/search', vendorController.searchStaff);
router.post('/staff/link', vendorController.linkStaff);
router.post('/staff/create', vendorController.createStaff);
router.post('/staff/payout', vendorController.payoutStaff);
router.delete('/staff/:staffId', vendorController.unlinkStaff);

// Payouts
router.post('/payout', vendorController.requestPayout);

module.exports = router;
