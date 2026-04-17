const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/authMiddleware');

// Import route modules
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const activityLogRoutes = require('./activityLogRoutes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use(protect);
router.use('/admins', adminRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/activity-logs', activityLogRoutes);

module.exports = router;
