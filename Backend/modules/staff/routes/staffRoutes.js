const express = require('express');
const staffAuthController = require('../controllers/staffAuthController');
const staffController = require('../controllers/staffController');
const authMiddleware = require('../../../middleware/authMiddleware');

const router = express.Router();

// Public auth routes
router.post('/send-otp', staffAuthController.sendOTP);
router.post('/login', staffAuthController.login);
router.post('/fcm-token', staffAuthController.updateFCMToken);

// Protected routes
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('staff'));

router.get('/profile', staffAuthController.getProfile);
router.patch('/profile', staffAuthController.updateProfile);
router.post('/upload-proof', staffController.uploadProof);
router.get('/dashboard', staffController.getDashboard);
router.get('/earnings', staffController.getEarnings);
router.get('/tasks', staffController.getTasks);
router.get('/tasks/:id', staffController.getTaskById);
router.patch('/tasks/:id/status', staffController.updateTaskStatus);
router.put('/tasks/:id/location', staffController.updateLocation);
router.post('/tasks/:id/commit', staffController.commitToSlot);
router.post('/tasks/:id/missed-wash', staffController.handleMissedWash);

// Product Order Logistics for Staff
router.patch('/product-orders/:orderId/items/:itemId/status', staffController.updateProductItemStatus);
router.post('/product-orders/:orderId/items/:itemId/verify-pin', staffController.verifyProductItemPin);

// Notification Management
router.get('/notifications', staffController.getNotifications);
router.patch('/availability', staffController.toggleOnlineStatus);
router.patch('/notifications/:id/read', staffController.markNotificationRead);
router.delete('/notifications/clear', staffController.clearNotifications);

module.exports = router;
