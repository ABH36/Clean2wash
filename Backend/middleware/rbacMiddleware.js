const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AppError = require('../utils/AppError');

/**
 * Check if admin has specific permission
 * Usage: requirePermission('drivers', 'create')
 */
exports.requirePermission = (module, action) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return next(new AppError('Access denied. No role assigned.', 403));
            }

            const role = await Role.findById(req.admin.role).populate('permissions');
            
            if (!role) {
                return next(new AppError('Role not found', 404));
            }

            // Super admin (level 1) has all permissions
            if (role.level === 1) {
                return next();
            }

            // Check if role has the permission
            const hasPermission = role.permissions.some(permission =>
                (permission.module === module || permission.module === '*') &&
                (permission.action === action || permission.action === '*')
            );

            if (!hasPermission) {
                return next(new AppError(`Access denied. Required permission: ${module}:${action}`, 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if admin has any of the permissions
 * Usage: requireAnyPermission(['drivers:create', 'drivers:update'])
 */
exports.requireAnyPermission = (permissionArray) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return next(new AppError('Access denied. No role assigned.', 403));
            }

            const role = await Role.findById(req.admin.role).populate('permissions');
            
            if (!role) {
                return next(new AppError('Role not found', 404));
            }

            // Super admin has all permissions
            if (role.level === 1) {
                return next();
            }

            // Check if role has any of the permissions
            const hasAnyPermission = permissionArray.some(perm => {
                const [module, action] = perm.split(':');
                return role.permissions.some(permission =>
                    (permission.module === module || permission.module === '*') &&
                    (permission.action === action || permission.action === '*')
                );
            });

            if (!hasAnyPermission) {
                return next(new AppError(`Access denied. Required any of: ${permissionArray.join(', ')}`, 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if admin has all permissions
 * Usage: requireAllPermissions(['drivers:view', 'drivers:update'])
 */
exports.requireAllPermissions = (permissionArray) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return next(new AppError('Access denied. No role assigned.', 403));
            }

            const role = await Role.findById(req.admin.role).populate('permissions');
            
            if (!role) {
                return next(new AppError('Role not found', 404));
            }

            // Super admin has all permissions
            if (role.level === 1) {
                return next();
            }

            // Check if role has all permissions
            const hasAllPermissions = permissionArray.every(perm => {
                const [module, action] = perm.split(':');
                return role.permissions.some(permission =>
                    (permission.module === module || permission.module === '*') &&
                    (permission.action === action || permission.action === '*')
                );
            });

            if (!hasAllPermissions) {
                return next(new AppError(`Access denied. Required all of: ${permissionArray.join(', ')}`, 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check role level
 * Usage: requireRoleLevel(2) // Admin level or higher
 */
exports.requireRoleLevel = (minLevel) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return next(new AppError('Access denied. No role assigned.', 403));
            }

            const role = await Role.findById(req.admin.role);
            
            if (!role) {
                return next(new AppError('Role not found', 404));
            }

            if (role.level > minLevel) {
                return next(new AppError(`Access denied. Minimum role level required: ${minLevel}`, 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Super admin only
 * Usage: requireSuperAdmin()
 */
exports.requireSuperAdmin = () => {
    return exports.requireRoleLevel(1);
};

/**
 * Check if admin can access resource
 * Usage: canAccessResource('driver', driverId)
 */
exports.canAccessResource = (resourceType, resourceId) => {
    return async (req, res, next) => {
        try {
            if (!req.admin || !req.admin.role) {
                return next(new AppError('Access denied. No role assigned.', 403));
            }

            const role = await Role.findById(req.admin.role);
            
            if (!role) {
                return next(new AppError('Role not found', 404));
            }

            // Super admin can access everything
            if (role.level === 1) {
                return next();
            }

            // Add custom resource access logic here
            // For example, check if admin created the resource
            // or if resource belongs to admin's department

            next();
        } catch (error) {
            next(error);
        }
    };
};
