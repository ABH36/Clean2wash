const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../../../middleware/authMiddleware');
const { requirePermission, requireSuperAdmin } = require('../../../middleware/rbacMiddleware');
const { logActivity } = require('../../../middleware/activityLogger');

// Protect all routes
router.use(protect);

// Statistics
router.get(
    '/stats',
    requirePermission('admins', 'view'),
    permissionController.getPermissionStats
);

// Search permissions
router.get(
    '/search',
    requirePermission('admins', 'view'),
    permissionController.searchPermissions
);

// Get grouped permissions
router.get(
    '/grouped',
    requirePermission('admins', 'view'),
    permissionController.getGroupedPermissions
);

// Get permissions by category
router.get(
    '/category/:category',
    requirePermission('admins', 'view'),
    permissionController.getByCategory
);

// Get all permissions
router.get(
    '/',
    requirePermission('admins', 'view'),
    permissionController.getAllPermissions
);

// Bulk create permissions (super admin only)
router.post(
    '/bulk',
    requireSuperAdmin(),
    logActivity('BULK_CREATE_PERMISSIONS', 'Permission'),
    permissionController.bulkCreatePermissions
);

// Create permission (super admin only)
router.post(
    '/',
    requireSuperAdmin(),
    logActivity('CREATE_PERMISSION', 'Permission'),
    permissionController.createPermission
);

// Get single permission
router.get(
    '/:id',
    requirePermission('admins', 'view'),
    permissionController.getPermission
);

// Update permission (super admin only)
router.patch(
    '/:id',
    requireSuperAdmin(),
    logActivity('UPDATE_PERMISSION', 'Permission'),
    permissionController.updatePermission
);

// Delete permission (super admin only)
router.delete(
    '/:id',
    requireSuperAdmin(),
    logActivity('DELETE_PERMISSION', 'Permission'),
    permissionController.deletePermission
);

module.exports = router;
