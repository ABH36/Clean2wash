const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../../../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.post('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;
