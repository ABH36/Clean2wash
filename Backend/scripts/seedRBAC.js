const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Admin = require('../models/Admin');
require('dotenv').config();

/**
 * RBAC SEEDING SCRIPT
 * Seeds permissions, roles, and creates first super admin
 * Safe to run multiple times (idempotent)
 */

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// ============================================================================
// PERMISSIONS DATA
// ============================================================================

const permissions = [
    // ─── DRIVER MANAGEMENT ───────────────────────────────────────────────
    {
        module: 'drivers',
        action: 'view',
        resource: 'Driver Management',
        description: 'View driver list and details',
        metadata: { category: 'operations', icon: 'users', order: 1 }
    },
    {
        module: 'drivers',
        action: 'create',
        resource: 'Driver Management',
        description: 'Add new drivers',
        metadata: { category: 'operations', icon: 'user-plus', order: 2 }
    },
    {
        module: 'drivers',
        action: 'update',
        resource: 'Driver Management',
        description: 'Edit driver information',
        metadata: { category: 'operations', icon: 'edit', order: 3 }
    },
    {
        module: 'drivers',
        action: 'delete',
        resource: 'Driver Management',
        description: 'Remove drivers',
        metadata: { category: 'operations', icon: 'trash', order: 4 }
    },
    {
        module: 'drivers',
        action: 'verify',
        resource: 'Driver Management',
        description: 'Verify driver documents',
        metadata: { category: 'operations', icon: 'check-circle', order: 5 }
    },
    {
        module: 'drivers',
        action: 'approve',
        resource: 'Driver Management',
        description: 'Approve/reject drivers',
        metadata: { category: 'operations', icon: 'shield-check', order: 6 }
    },
    {
        module: 'drivers',
        action: 'suspend',
        resource: 'Driver Management',
        description: 'Suspend/activate drivers',
        metadata: { category: 'operations', icon: 'ban', order: 7 }
    },
    {
        module: 'drivers',
        action: '*',
        resource: 'Driver Management',
        description: 'All driver management permissions',
        metadata: { category: 'operations', icon: 'star', order: 8 }
    },

    // ─── BOOKING MANAGEMENT ──────────────────────────────────────────────
    {
        module: 'bookings',
        action: 'view',
        resource: 'Booking Management',
        description: 'View all bookings',
        metadata: { category: 'operations', icon: 'calendar', order: 10 }
    },
    {
        module: 'bookings',
        action: 'create',
        resource: 'Booking Management',
        description: 'Create bookings',
        metadata: { category: 'operations', icon: 'plus-circle', order: 11 }
    },
    {
        module: 'bookings',
        action: 'update',
        resource: 'Booking Management',
        description: 'Update booking details',
        metadata: { category: 'operations', icon: 'edit', order: 12 }
    },
    {
        module: 'bookings',
        action: 'cancel',
        resource: 'Booking Management',
        description: 'Cancel bookings',
        metadata: { category: 'operations', icon: 'x-circle', order: 13 }
    },
    {
        module: 'bookings',
        action: 'assign',
        resource: 'Booking Management',
        description: 'Assign drivers to bookings',
        metadata: { category: 'operations', icon: 'user-check', order: 14 }
    },
    {
        module: 'bookings',
        action: 'refund',
        resource: 'Booking Management',
        description: 'Process refunds',
        metadata: { category: 'finance', icon: 'dollar-sign', order: 15 }
    },
    {
        module: 'bookings',
        action: '*',
        resource: 'Booking Management',
        description: 'All booking management permissions',
        metadata: { category: 'operations', icon: 'star', order: 16 }
    },

    // ─── SERVICE MANAGEMENT ──────────────────────────────────────────────
    {
        module: 'services',
        action: 'view',
        resource: 'Service Management',
        description: 'View services',
        metadata: { category: 'configuration', icon: 'briefcase', order: 20 }
    },
    {
        module: 'services',
        action: 'create',
        resource: 'Service Management',
        description: 'Create new services',
        metadata: { category: 'configuration', icon: 'plus', order: 21 }
    },
    {
        module: 'services',
        action: 'update',
        resource: 'Service Management',
        description: 'Update service pricing',
        metadata: { category: 'configuration', icon: 'edit', order: 22 }
    },
    {
        module: 'services',
        action: 'delete',
        resource: 'Service Management',
        description: 'Remove services',
        metadata: { category: 'configuration', icon: 'trash', order: 23 }
    },
    {
        module: 'services',
        action: 'toggle',
        resource: 'Service Management',
        description: 'Enable/disable services',
        metadata: { category: 'configuration', icon: 'toggle-right', order: 24 }
    },
    {
        module: 'services',
        action: '*',
        resource: 'Service Management',
        description: 'All service management permissions',
        metadata: { category: 'configuration', icon: 'star', order: 25 }
    },

    // ─── PAYOUT MANAGEMENT ───────────────────────────────────────────────
    {
        module: 'payouts',
        action: 'view',
        resource: 'Payout Management',
        description: 'View payout requests',
        metadata: { category: 'finance', icon: 'credit-card', order: 30 }
    },
    {
        module: 'payouts',
        action: 'approve',
        resource: 'Payout Management',
        description: 'Approve payouts',
        metadata: { category: 'finance', icon: 'check', order: 31 }
    },
    {
        module: 'payouts',
        action: 'reject',
        resource: 'Payout Management',
        description: 'Reject payouts',
        metadata: { category: 'finance', icon: 'x', order: 32 }
    },
    {
        module: 'payouts',
        action: 'process',
        resource: 'Payout Management',
        description: 'Process payments',
        metadata: { category: 'finance', icon: 'send', order: 33 }
    },
    {
        module: 'payouts',
        action: 'export',
        resource: 'Payout Management',
        description: 'Export payout reports',
        metadata: { category: 'finance', icon: 'download', order: 34 }
    },
    {
        module: 'payouts',
        action: '*',
        resource: 'Payout Management',
        description: 'All payout management permissions',
        metadata: { category: 'finance', icon: 'star', order: 35 }
    },

    // ─── ANALYTICS ───────────────────────────────────────────────────────
    {
        module: 'analytics',
        action: 'view_dashboard',
        resource: 'Analytics',
        description: 'View main dashboard',
        metadata: { category: 'analytics', icon: 'bar-chart', order: 40 }
    },
    {
        module: 'analytics',
        action: 'view_reports',
        resource: 'Analytics',
        description: 'View detailed reports',
        metadata: { category: 'analytics', icon: 'file-text', order: 41 }
    },
    {
        module: 'analytics',
        action: 'export_data',
        resource: 'Analytics',
        description: 'Export analytics data',
        metadata: { category: 'analytics', icon: 'download', order: 42 }
    },
    {
        module: 'analytics',
        action: 'view_revenue',
        resource: 'Analytics',
        description: 'View revenue analytics',
        metadata: { category: 'analytics', icon: 'trending-up', order: 43 }
    },
    {
        module: 'analytics',
        action: '*',
        resource: 'Analytics',
        description: 'All analytics permissions',
        metadata: { category: 'analytics', icon: 'star', order: 44 }
    },

    // ─── ADMIN MANAGEMENT (Super Admin Only) ────────────────────────────
    {
        module: 'admins',
        action: 'view',
        resource: 'Admin Management',
        description: 'View admin list',
        metadata: { category: 'system', icon: 'shield', order: 50 }
    },
    {
        module: 'admins',
        action: 'create',
        resource: 'Admin Management',
        description: 'Create new admins',
        metadata: { category: 'system', icon: 'user-plus', order: 51 }
    },
    {
        module: 'admins',
        action: 'update',
        resource: 'Admin Management',
        description: 'Update admin details',
        metadata: { category: 'system', icon: 'edit', order: 52 }
    },
    {
        module: 'admins',
        action: 'delete',
        resource: 'Admin Management',
        description: 'Remove admins',
        metadata: { category: 'system', icon: 'trash', order: 53 }
    },
    {
        module: 'admins',
        action: 'manage_roles',
        resource: 'Admin Management',
        description: 'Assign roles to admins',
        metadata: { category: 'system', icon: 'key', order: 54 }
    },
    {
        module: 'admins',
        action: 'view_activity',
        resource: 'Admin Management',
        description: 'View activity logs',
        metadata: { category: 'system', icon: 'activity', order: 55 }
    },
    {
        module: 'admins',
        action: '*',
        resource: 'Admin Management',
        description: 'All admin management permissions',
        metadata: { category: 'system', icon: 'star', order: 56 }
    },

    // ─── WILDCARD (Super Admin) ─────────────────────────────────────────
    {
        module: '*',
        action: '*',
        resource: 'All Resources',
        description: 'Full system access',
        metadata: { category: 'system', icon: 'star', order: 100 }
    }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

/**
 * Seed permissions
 */
async function seedPermissions() {
    log.header('📋 SEEDING PERMISSIONS');

    try {
        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const perm of permissions) {
            const existing = await Permission.findOne({
                module: perm.module,
                action: perm.action
            });

            if (existing) {
                // Update existing permission
                existing.resource = perm.resource;
                existing.description = perm.description;
                existing.metadata = perm.metadata;
                await existing.save();
                updated++;
                log.info(`Updated: ${perm.module}:${perm.action}`);
            } else {
                // Create new permission
                await Permission.create(perm);
                created++;
                log.success(`Created: ${perm.module}:${perm.action}`);
            }
        }

        log.success(`\nPermissions Summary:`);
        log.info(`  Created: ${created}`);
        log.info(`  Updated: ${updated}`);
        log.info(`  Total: ${permissions.length}`);

        return true;
    } catch (error) {
        log.error(`Failed to seed permissions: ${error.message}`);
        throw error;
    }
}

/**
 * Seed roles
 */
async function seedRoles() {
    log.header('👥 SEEDING ROLES');

    try {
        const allPermissions = await Permission.find();

        // ─── SUPER ADMIN ROLE ────────────────────────────────────────────
        const wildcardPermission = allPermissions.find(p => p.module === '*' && p.action === '*');
        
        let superAdminRole = await Role.findOne({ slug: 'super_admin' });
        if (superAdminRole) {
            superAdminRole.name = 'Super Admin';
            superAdminRole.description = 'Full system access with admin management';
            superAdminRole.permissions = [wildcardPermission._id];
            superAdminRole.level = 1;
            superAdminRole.isSystem = true;
            superAdminRole.isActive = true;
            await superAdminRole.save();
            log.info('Updated: Super Admin role');
        } else {
            superAdminRole = await Role.create({
                name: 'Super Admin',
                slug: 'super_admin',
                description: 'Full system access with admin management',
                permissions: [wildcardPermission._id],
                level: 1,
                isSystem: true,
                isActive: true
            });
            log.success('Created: Super Admin role');
        }

        // ─── ADMIN ROLE ──────────────────────────────────────────────────
        const adminPermissions = allPermissions.filter(p =>
            (p.module !== 'admins' && p.module !== '*') ||
            (p.module === 'admins' && p.action === 'view')
        );

        let adminRole = await Role.findOne({ slug: 'admin' });
        if (adminRole) {
            adminRole.name = 'Admin';
            adminRole.description = 'Full operational access except admin management';
            adminRole.permissions = adminPermissions.map(p => p._id);
            adminRole.level = 2;
            adminRole.isSystem = true;
            adminRole.isActive = true;
            await adminRole.save();
            log.info('Updated: Admin role');
        } else {
            adminRole = await Role.create({
                name: 'Admin',
                slug: 'admin',
                description: 'Full operational access except admin management',
                permissions: adminPermissions.map(p => p._id),
                level: 2,
                isSystem: true,
                isActive: true
            });
            log.success('Created: Admin role');
        }

        // ─── SUB-ADMIN ROLE ──────────────────────────────────────────────
        const subAdminPermissions = allPermissions.filter(p =>
            ['drivers', 'bookings', 'services', 'analytics'].includes(p.module) &&
            ['view', 'update', 'verify', 'assign', 'view_dashboard', 'view_reports'].includes(p.action)
        );

        let subAdminRole = await Role.findOne({ slug: 'sub_admin' });
        if (subAdminRole) {
            subAdminRole.name = 'Sub-Admin';
            subAdminRole.description = 'Limited operational access';
            subAdminRole.permissions = subAdminPermissions.map(p => p._id);
            subAdminRole.level = 3;
            subAdminRole.isSystem = true;
            subAdminRole.isActive = true;
            await subAdminRole.save();
            log.info('Updated: Sub-Admin role');
        } else {
            subAdminRole = await Role.create({
                name: 'Sub-Admin',
                slug: 'sub_admin',
                description: 'Limited operational access',
                permissions: subAdminPermissions.map(p => p._id),
                level: 3,
                isSystem: true,
                isActive: true
            });
            log.success('Created: Sub-Admin role');
        }

        // ─── MANAGER ROLE ────────────────────────────────────────────────
        const managerPermissions = allPermissions.filter(p =>
            ['drivers', 'bookings', 'services', 'analytics'].includes(p.module) &&
            ['view', 'view_dashboard'].includes(p.action)
        );

        let managerRole = await Role.findOne({ slug: 'manager' });
        if (managerRole) {
            managerRole.name = 'Manager';
            managerRole.description = 'Read-only access for monitoring';
            managerRole.permissions = managerPermissions.map(p => p._id);
            managerRole.level = 4;
            managerRole.isSystem = true;
            managerRole.isActive = true;
            await managerRole.save();
            log.info('Updated: Manager role');
        } else {
            managerRole = await Role.create({
                name: 'Manager',
                slug: 'manager',
                description: 'Read-only access for monitoring',
                permissions: managerPermissions.map(p => p._id),
                level: 4,
                isSystem: true,
                isActive: true
            });
            log.success('Created: Manager role');
        }

        log.success('\nRoles Summary:');
        log.info(`  Super Admin: ${superAdminRole.permissions.length} permissions`);
        log.info(`  Admin: ${adminRole.permissions.length} permissions`);
        log.info(`  Sub-Admin: ${subAdminRole.permissions.length} permissions`);
        log.info(`  Manager: ${managerRole.permissions.length} permissions`);

        return { superAdminRole, adminRole, subAdminRole, managerRole };
    } catch (error) {
        log.error(`Failed to seed roles: ${error.message}`);
        throw error;
    }
}

/**
 * Create first super admin
 */
async function createSuperAdmin() {
    log.header('👤 CREATING SUPER ADMIN');

    try {
        const superAdminRole = await Role.findOne({ slug: 'super_admin' });

        if (!superAdminRole) {
            throw new Error('Super Admin role not found. Please run role seeding first.');
        }

        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: superAdminRole._id });

        if (existingSuperAdmin) {
            log.warning('Super Admin already exists:');
            log.info(`  Name: ${existingSuperAdmin.name}`);
            log.info(`  Email: ${existingSuperAdmin.email}`);
            log.info(`  Status: ${existingSuperAdmin.status}`);
            return existingSuperAdmin;
        }

        // Get credentials from environment or use defaults
        const email = process.env.SUPER_ADMIN_EMAIL || 'admin@clean2wash.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
        const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

        // Create super admin
        const superAdmin = await Admin.create({
            name,
            email,
            password,
            role: superAdminRole._id,
            status: 'ACTIVE',
            mustChangePassword: false,
            phone: process.env.SUPER_ADMIN_PHONE || '',
            metadata: {
                department: 'System',
                employeeId: 'SA-001',
                notes: 'System generated super administrator'
            }
        });

        log.success('Super Admin created successfully!');
        log.info(`  Name: ${superAdmin.name}`);
        log.info(`  Email: ${superAdmin.email}`);
        log.info(`  Password: ${password}`);
        log.warning('\n⚠️  IMPORTANT: Please change the password after first login!');

        return superAdmin;
    } catch (error) {
        log.error(`Failed to create super admin: ${error.message}`);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedAll() {
    try {
        log.header('🚀 STARTING RBAC SEEDING');

        // Connect to database
        log.info('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        log.success('Connected to database\n');

        // Seed permissions
        await seedPermissions();

        // Seed roles
        await seedRoles();

        // Create super admin
        await createSuperAdmin();

        log.header('✅ SEEDING COMPLETED SUCCESSFULLY');
        log.info('You can now start the application and login with super admin credentials.\n');

        process.exit(0);
    } catch (error) {
        log.error(`\nSeeding failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// ============================================================================
// RUN SEEDING
// ============================================================================

// Check if running directly
if (require.main === module) {
    seedAll();
}

// Export for use in other scripts
module.exports = {
    seedPermissions,
    seedRoles,
    createSuperAdmin,
    seedAll
};
