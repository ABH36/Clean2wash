# SUPER ADMIN RBAC SYSTEM - IMPLEMENTATION GUIDE

**Complete Step-by-Step Implementation**  
**Estimated Time:** 2-3 days  
**Difficulty:** Intermediate to Advanced

---

## 📦 PHASE 1: DATABASE MODELS (COMPLETED)

### ✅ Created Models:
1. `Backend/models/Admin.js` - Admin user model
2. `Backend/models/Role.js` - Role model with permissions
3. `Backend/models/Permission.js` - Permission model

### 🔄 Next: Create ActivityLog Model

Create `Backend/models/ActivityLog.js`:

```javascript
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        uppercase: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resource: 1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
```

---

## 🛡️ PHASE 2: MIDDLEWARE

### 1. RBAC Middleware

Create `Backend/middleware/rbacMiddleware.js`:

```javascript
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

            // Super admin has all permissions
            if (role.level === 1) {
                return next();
            }

            // Check if role has the permission
            const hasPermission = role.permissions.some(permission =>
                permission.module === module &&
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
                    permission.module === module &&
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
                    permission.module === module &&
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
```

### 2. Activity Logger Middleware

Create `Backend/middleware/activityLogger.js`:

```javascript
const ActivityLog = require('../models/ActivityLog');

/**
 * Log admin activity
 * Usage: logActivity('CREATE_DRIVER', 'Driver')
 */
exports.logActivity = (action, resource) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function
        res.send = function(data) {
            // Log activity after response
            setImmediate(async () => {
                try {
                    const logData = {
                        admin: req.admin?._id,
                        action,
                        resource,
                        resourceId: req.params.id || req.body._id,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                        status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED'
                    };

                    // Add changes if available
                    if (req.activityChanges) {
                        logData.changes = req.activityChanges;
                    }

                    // Add error message if failed
                    if (res.statusCode >= 400 && data) {
                        try {
                            const parsedData = JSON.parse(data);
                            logData.errorMessage = parsedData.message || 'Unknown error';
                        } catch (e) {
                            logData.errorMessage = 'Failed to parse error';
                        }
                    }

                    await ActivityLog.create(logData);
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
            });

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Helper to attach changes to request
 */
exports.attachChanges = (before, after) => {
    return (req, res, next) => {
        req.activityChanges = { before, after };
        next();
    };
};
```

---

## 🌱 PHASE 3: SEED DATA

Create `Backend/scripts/seedPermissions.js`:

```javascript
const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
require('dotenv').config();

const permissions = [
    // Driver Management
    { module: 'drivers', action: 'view', resource: 'Driver Management', description: 'View driver list and details', metadata: { category: 'operations', icon: 'users', order: 1 } },
    { module: 'drivers', action: 'create', resource: 'Driver Management', description: 'Add new drivers', metadata: { category: 'operations', icon: 'user-plus', order: 2 } },
    { module: 'drivers', action: 'update', resource: 'Driver Management', description: 'Edit driver information', metadata: { category: 'operations', icon: 'edit', order: 3 } },
    { module: 'drivers', action: 'delete', resource: 'Driver Management', description: 'Remove drivers', metadata: { category: 'operations', icon: 'trash', order: 4 } },
    { module: 'drivers', action: 'verify', resource: 'Driver Management', description: 'Verify driver documents', metadata: { category: 'operations', icon: 'check-circle', order: 5 } },
    { module: 'drivers', action: 'approve', resource: 'Driver Management', description: 'Approve/reject drivers', metadata: { category: 'operations', icon: 'shield-check', order: 6 } },
    { module: 'drivers', action: 'suspend', resource: 'Driver Management', description: 'Suspend/activate drivers', metadata: { category: 'operations', icon: 'ban', order: 7 } },
    
    // Booking Management
    { module: 'bookings', action: 'view', resource: 'Booking Management', description: 'View all bookings', metadata: { category: 'operations', icon: 'calendar', order: 10 } },
    { module: 'bookings', action: 'create', resource: 'Booking Management', description: 'Create bookings', metadata: { category: 'operations', icon: 'plus-circle', order: 11 } },
    { module: 'bookings', action: 'update', resource: 'Booking Management', description: 'Update booking details', metadata: { category: 'operations', icon: 'edit', order: 12 } },
    { module: 'bookings', action: 'cancel', resource: 'Booking Management', description: 'Cancel bookings', metadata: { category: 'operations', icon: 'x-circle', order: 13 } },
    { module: 'bookings', action: 'assign', resource: 'Booking Management', description: 'Assign drivers to bookings', metadata: { category: 'operations', icon: 'user-check', order: 14 } },
    { module: 'bookings', action: 'refund', resource: 'Booking Management', description: 'Process refunds', metadata: { category: 'finance', icon: 'dollar-sign', order: 15 } },
    
    // Service Management
    { module: 'services', action: 'view', resource: 'Service Management', description: 'View services', metadata: { category: 'configuration', icon: 'briefcase', order: 20 } },
    { module: 'services', action: 'create', resource: 'Service Management', description: 'Create new services', metadata: { category: 'configuration', icon: 'plus', order: 21 } },
    { module: 'services', action: 'update', resource: 'Service Management', description: 'Update service pricing', metadata: { category: 'configuration', icon: 'edit', order: 22 } },
    { module: 'services', action: 'delete', resource: 'Service Management', description: 'Remove services', metadata: { category: 'configuration', icon: 'trash', order: 23 } },
    { module: 'services', action: 'toggle', resource: 'Service Management', description: 'Enable/disable services', metadata: { category: 'configuration', icon: 'toggle-right', order: 24 } },
    
    // Payout Management
    { module: 'payouts', action: 'view', resource: 'Payout Management', description: 'View payout requests', metadata: { category: 'finance', icon: 'credit-card', order: 30 } },
    { module: 'payouts', action: 'approve', resource: 'Payout Management', description: 'Approve payouts', metadata: { category: 'finance', icon: 'check', order: 31 } },
    { module: 'payouts', action: 'reject', resource: 'Payout Management', description: 'Reject payouts', metadata: { category: 'finance', icon: 'x', order: 32 } },
    { module: 'payouts', action: 'process', resource: 'Payout Management', description: 'Process payments', metadata: { category: 'finance', icon: 'send', order: 33 } },
    { module: 'payouts', action: 'export', resource: 'Payout Management', description: 'Export payout reports', metadata: { category: 'finance', icon: 'download', order: 34 } },
    
    // Analytics
    { module: 'analytics', action: 'view_dashboard', resource: 'Analytics', description: 'View main dashboard', metadata: { category: 'analytics', icon: 'bar-chart', order: 40 } },
    { module: 'analytics', action: 'view_reports', resource: 'Analytics', description: 'View detailed reports', metadata: { category: 'analytics', icon: 'file-text', order: 41 } },
    { module: 'analytics', action: 'export_data', resource: 'Analytics', description: 'Export analytics data', metadata: { category: 'analytics', icon: 'download', order: 42 } },
    { module: 'analytics', action: 'view_revenue', resource: 'Analytics', description: 'View revenue analytics', metadata: { category: 'analytics', icon: 'trending-up', order: 43 } },
    
    // Admin Management (Super Admin Only)
    { module: 'admins', action: 'view', resource: 'Admin Management', description: 'View admin list', metadata: { category: 'system', icon: 'shield', order: 50 } },
    { module: 'admins', action: 'create', resource: 'Admin Management', description: 'Create new admins', metadata: { category: 'system', icon: 'user-plus', order: 51 } },
    { module: 'admins', action: 'update', resource: 'Admin Management', description: 'Update admin details', metadata: { category: 'system', icon: 'edit', order: 52 } },
    { module: 'admins', action: 'delete', resource: 'Admin Management', description: 'Remove admins', metadata: { category: 'system', icon: 'trash', order: 53 } },
    { module: 'admins', action: 'manage_roles', resource: 'Admin Management', description: 'Assign roles to admins', metadata: { category: 'system', icon: 'key', order: 54 } },
    { module: 'admins', action: 'view_activity', resource: 'Admin Management', description: 'View activity logs', metadata: { category: 'system', icon: 'activity', order: 55 } },
    
    // Wildcard permission for super admin
    { module: '*', action: '*', resource: 'All Resources', description: 'Full system access', metadata: { category: 'system', icon: 'star', order: 100 } }
];

async function seedPermissions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to database');

        // Clear existing permissions
        await Permission.deleteMany({});
        console.log('🗑️  Cleared existing permissions');

        // Create permissions
        const createdPermissions = await Permission.insertMany(permissions);
        console.log(`✅ Created ${createdPermissions.length} permissions`);

        // Create default roles
        const allPermissions = await Permission.find();
        
        // Super Admin Role
        const superAdminPermissions = allPermissions.filter(p => p.module === '*' || p.action === '*');
        await Role.findOneAndUpdate(
            { slug: 'super_admin' },
            {
                name: 'Super Admin',
                slug: 'super_admin',
                description: 'Full system access with admin management',
                permissions: superAdminPermissions.map(p => p._id),
                level: 1,
                isSystem: true,
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created Super Admin role');

        // Admin Role
        const adminPermissions = allPermissions.filter(p => 
            p.module !== 'admins' && p.module !== '*'
        );
        await Role.findOneAndUpdate(
            { slug: 'admin' },
            {
                name: 'Admin',
                slug: 'admin',
                description: 'Full operational access except admin management',
                permissions: adminPermissions.map(p => p._id),
                level: 2,
                isSystem: true,
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created Admin role');

        // Sub-Admin Role
        const subAdminPermissions = allPermissions.filter(p => 
            ['drivers', 'bookings', 'analytics'].includes(p.module) &&
            ['view', 'update', 'verify', 'assign', 'view_dashboard'].includes(p.action)
        );
        await Role.findOneAndUpdate(
            { slug: 'sub_admin' },
            {
                name: 'Sub-Admin',
                slug: 'sub_admin',
                description: 'Limited operational access',
                permissions: subAdminPermissions.map(p => p._id),
                level: 3,
                isSystem: true,
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created Sub-Admin role');

        // Manager Role
        const managerPermissions = allPermissions.filter(p => 
            ['drivers', 'bookings', 'analytics'].includes(p.module) &&
            ['view', 'view_dashboard'].includes(p.action)
        );
        await Role.findOneAndUpdate(
            { slug: 'manager' },
            {
                name: 'Manager',
                slug: 'manager',
                description: 'Read-only access for monitoring',
                permissions: managerPermissions.map(p => p._id),
                level: 4,
                isSystem: true,
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created Manager role');

        console.log('\n🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedPermissions();
```

**Run seeding:**
```bash
cd Backend
node scripts/seedPermissions.js
```

---

## 🚀 NEXT STEPS

1. ✅ Models created
2. ⏳ Create middleware (copy code above)
3. ⏳ Run seed script
4. ⏳ Create controllers (next document)
5. ⏳ Create routes
6. ⏳ Create frontend components

**Continue to:** `SUPER_ADMIN_CONTROLLERS_GUIDE.md` (creating next)

---

**Status:** Phase 1-3 Complete  
**Next:** Controllers & Routes Implementation
