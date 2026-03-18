const express = require('express');
const staffAuthController = require('../controllers/staffAuthController');
const staffController = require('../controllers/staffController');
const authMiddleware = require('../../../middlewares/authMiddleware');

const router = express.Router();

// Public auth routes
router.post('/login', staffAuthController.login);

// Protected routes
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('staff'));

router.get('/profile', staffAuthController.getProfile);
router.get('/dashboard', staffController.getDashboard);
router.get('/tasks', staffController.getTasks);
router.get('/tasks/:id', staffController.getTaskById);
router.patch('/tasks/:id/status', staffController.updateTaskStatus);

module.exports = router;
