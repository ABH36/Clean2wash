const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect } = require('../../../middleware/authMiddleware');
const { requirePermission } = require('../../../middleware/rbacMiddleware');

// Protect all routes
router.use(protect);

// Statistics
router.get(
    '/stats',
    requirePermission('admins', 'view_activity'),
    activityLogController.getActivityStats
);

// Recent activities (dashboard widget)
router.get(
    '/recent',
    requirePermission('admins', 'view_activity'),
    activityLogController.getRecentActivities
);

// Failed activities
router.get(
    '/failed',
    requirePermission('admins', 'view_activity'),
    activityLogController.getFailedActivities
);

// Export logs
router.get(
    '/export',
    requirePermission('admins', 'view_activity'),
    activityLogController.exportLogs
);

// Cleanup old logs
router.delete(
    '/cleanup',
    requirePermission('admins', 'delete'),
    activityLogController.cleanupLogs
);

// Get logs by admin
router.get(
    '/admin/:adminId',
    requirePermission('admins', 'view_activity'),
    activityLogController.getLogsByAdmin
);

// Get all logs
router.get(
    '/',
    requirePermission('admins', 'view_activity'),
    activityLogController.getAllLogs
);

// Get single log
router.get(
    '/:id',
    requirePermission('admins', 'view_activity'),
    activityLogController.getLog
);

module.exports = router;
