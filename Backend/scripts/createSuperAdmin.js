const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const Admin = require('../models/Admin');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const ADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@SpareDriver.in').toLowerCase();
const ADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
const ADMIN_PHONE = process.env.SUPERADMIN_PHONE || '9876543210';
const ADMIN_NAME = process.env.SUPERADMIN_NAME || 'Super Administrator';

async function ensureSuperAdminRole() {
    let superAdminRole = await Role.findOne({ slug: 'super_admin' });

    if (superAdminRole) {
        console.log('Super Admin role already exists');
        return superAdminRole;
    }

    console.log('Creating Super Admin role...');

    let wildcardPermission = await Permission.findOne({ module: '*', action: '*' });

    if (!wildcardPermission) {
        wildcardPermission = await Permission.create({
            module: '*',
            action: '*',
            resource: 'System',
            description: 'Full system access',
            isSystem: true,
            metadata: {
                category: 'SYSTEM',
                icon: 'crown',
                order: 0
            }
        });
        console.log('Created wildcard permission');
    }

    superAdminRole = await Role.create({
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full system access with admin management',
        level: 1,
        permissions: [wildcardPermission._id],
        isSystem: true,
        isActive: true
    });

    console.log('Created Super Admin role');
    return superAdminRole;
}

async function createSuperAdmin() {
    try {
        if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
            throw new Error('SUPERADMIN_PASSWORD is required and must be at least 12 characters long');
        }

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash');
        console.log('Connected to MongoDB');

        const superAdminRole = await ensureSuperAdminRole();

        const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            existingAdmin.name = ADMIN_NAME;
            existingAdmin.password = ADMIN_PASSWORD;
            existingAdmin.role = superAdminRole._id;
            existingAdmin.status = 'ACTIVE';
            existingAdmin.phone = ADMIN_PHONE;
            existingAdmin.mustChangePassword = false;
            await existingAdmin.save();

            console.log('Existing Super Admin updated successfully');
            console.log(`Email: ${existingAdmin.email}`);
            console.log('Temporary password has been refreshed');
            return;
        }

        const superAdmin = await Admin.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: superAdminRole._id,
            status: 'ACTIVE',
            phone: ADMIN_PHONE,
            mustChangePassword: false
        });

        console.log('Super Admin created successfully');
        console.log(`Email: ${superAdmin.email}`);
        console.log('Temporary password has been set');
        console.log(`Role: ${superAdminRole.name}`);
    } catch (error) {
        console.error('Error creating or updating Super Admin:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect().catch(() => {});
        console.log('Disconnected from MongoDB');
    }
}

createSuperAdmin();
