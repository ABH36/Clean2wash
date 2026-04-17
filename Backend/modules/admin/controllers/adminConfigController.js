const { FEATURE_FLAGS, PLATFORM_MODE } = require('../../../middleware/featureGuard');
const catchAsync = require('../../../utils/catchAsync');

/**
 * Get Platform Configuration
 * Returns active mode and feature flags to sync with the frontend.
 */
exports.getPlatformConfig = catchAsync(async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            mode: PLATFORM_MODE,
            flags: FEATURE_FLAGS,
            serverTime: new Date(),
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

/**
 * Get Admin Permissions based on Role
 * (Optional extension for granular role+feature logic)
 */
exports.getAdminPermissions = catchAsync(async (req, res) => {
    const role = req.auth?.role || req.user?.role;
    
    // In a production system, this would come from a database mapping
    // role_permissions.find({ role })
    const basePermissions = {
        admin: ['*'], // Admin has access to all enabled features
        'ops-manager': ['OVERVIEW', 'OPERATIONS', 'USERS', 'SAFETY_SUPPORT'],
        'fin-admin': ['OVERVIEW', 'FINANCE', 'SYSTEM_CONTROL'],
    };

    res.status(200).json({
        status: 'success',
        data: {
            role,
            permissions: basePermissions[role] || []
        }
    });
});
