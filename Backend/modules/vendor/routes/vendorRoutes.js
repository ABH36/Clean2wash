const express = require('express');
const router = express.Router();
const vendorAuthController = require('../controllers/vendorAuthController');
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../../../middlewares/authMiddleware');

// Public route
router.post('/login', vendorAuthController.login);
router.post('/signup', vendorAuthController.register);

// Protected routes (Only accessible by Vendors)
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('vendor'));

router.get('/profile', vendorAuthController.getProfile);
router.patch('/profile', vendorAuthController.updateProfile);
router.get('/dashboard', vendorController.getDashboard);
router.get('/orders', vendorController.getOrders);
router.get('/orders/:orderId', vendorController.getOrderById);
router.patch('/orders/:orderId/status', vendorController.updateOrderStatus);
router.post('/orders/:orderId/assign-staff', vendorController.assignStaff);

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
router.delete('/staff/:staffId', vendorController.unlinkStaff);

// Payouts
router.post('/payout', vendorController.requestPayout);

module.exports = router;
