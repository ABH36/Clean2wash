const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect } = require('../../../middleware/authMiddleware');
const { requirePermission, requireSuperAdmin } = require('../../../middleware/rbacMiddleware');
const { logActivity } = require('../../../middleware/activityLogger');

// Protect all routes
router.use(protect);

// Statistics
router.get(
    '/stats',
    requirePermission('admins', 'view'),
    roleController.getRoleStats
);

// Get all roles
router.get(
    '/',
    requirePermission('admins', 'view'),
    roleController.getAllRoles
);

// Create role (super admin only)
router.post(
    '/',
    requireSuperAdmin(),
    logActivity('CREATE_ROLE', 'Role'),
    roleController.createRole
);

// Duplicate role
router.post(
    '/:id/duplicate',
    requireSuperAdmin(),
    logActivity('DUPLICATE_ROLE', 'Role'),
    roleController.duplicateRole
);

// Get single role
router.get(
    '/:id',
    requirePermission('admins', 'view'),
    roleController.getRole
);

// Update role
router.patch(
    '/:id',
    requireSuperAdmin(),
    logActivity('UPDATE_ROLE', 'Role'),
    roleController.updateRole
);

// Delete role
router.delete(
    '/:id',
    requireSuperAdmin(),
    logActivity('DELETE_ROLE', 'Role'),
    roleController.deleteRole
);

// Update role permissions
router.patch(
    '/:id/permissions',
    requireSuperAdmin(),
    logActivity('UPDATE_ROLE_PERMISSIONS', 'Role'),
    roleController.updatePermissions
);

// Toggle role status
router.patch(
    '/:id/toggle',
    requireSuperAdmin(),
    logActivity('TOGGLE_ROLE_STATUS', 'Role'),
    roleController.toggleStatus
);

module.exports = router;
