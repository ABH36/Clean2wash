const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../../../middleware/authMiddleware');
const { requirePermission, requireSuperAdmin } = require('../../../middleware/rbacMiddleware');
const { logActivity } = require('../../../middleware/activityLogger');

// Protect all routes
router.use(protect);

// Statistics (requires view permission)
router.get(
    '/stats',
    requirePermission('admins', 'view'),
    adminController.getAdminStats
);

// Get all admins
router.get(
    '/',
    requirePermission('admins', 'view'),
    adminController.getAllAdmins
);

// Create admin (super admin only)
router.post(
    '/',
    requirePermission('admins', 'create'),
    logActivity('CREATE_ADMIN', 'Admin'),
    adminController.createAdmin
);

// Get single admin
router.get(
    '/:id',
    requirePermission('admins', 'view'),
    adminController.getAdmin
);

// Update admin
router.patch(
    '/:id',
    requirePermission('admins', 'update'),
    logActivity('UPDATE_ADMIN', 'Admin'),
    adminController.updateAdmin
);

// Delete admin
router.delete(
    '/:id',
    requirePermission('admins', 'delete'),
    logActivity('DELETE_ADMIN', 'Admin'),
    adminController.deleteAdmin
);

// Toggle admin status
router.patch(
    '/:id/status',
    requirePermission('admins', 'update'),
    logActivity('TOGGLE_ADMIN_STATUS', 'Admin'),
    adminController.toggleStatus
);

// Assign role to admin
router.patch(
    '/:id/role',
    requirePermission('admins', 'manage_roles'),
    logActivity('ASSIGN_ROLE', 'Admin'),
    adminController.assignRole
);

// Reset admin password
router.post(
    '/:id/reset-password',
    requirePermission('admins', 'update'),
    logActivity('RESET_ADMIN_PASSWORD', 'Admin'),
    adminController.resetPassword
);

// Get admin activity
router.get(
    '/:id/activity',
    requirePermission('admins', 'view_activity'),
    adminController.getAdminActivity
);

module.exports = router;
