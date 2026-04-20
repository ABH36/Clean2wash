const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const Admin = require('../models/Admin');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash');
        console.log('✅ Connected to MongoDB');

        // Check if Super Admin role exists
        let superAdminRole = await Role.findOne({ slug: 'super_admin' });
        
        if (!superAdminRole) {
            console.log('📝 Creating Super Admin role...');
            
            // Create wildcard permission for full access
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
                console.log('✅ Created wildcard permission');
            }
            
            // Create Super Admin role
            superAdminRole = await Role.create({
                name: 'Super Admin',
                slug: 'super_admin',
                description: 'Full system access with admin management',
                level: 1,
                permissions: [wildcardPermission._id],
                isSystem: true,
                isActive: true
            });
            console.log('✅ Created Super Admin role');
        } else {
            console.log('✅ Super Admin role already exists');
        }

        // Check if Super Admin user exists
        const existingAdmin = await Admin.findOne({ email: 'admin@SpareDriver.in' });
        
        if (existingAdmin) {
            console.log('⚠️  Super Admin already exists:', existingAdmin.email);
            console.log('   Use this email to login');
            process.exit(0);
        }

        // Create Super Admin user
        const superAdmin = await Admin.create({
            name: 'Super Administrator',
            email: 'admin@SpareDriver.in',
            password: 'admin123', // Will be hashed automatically by pre-save hook
            role: superAdminRole._id,
            status: 'ACTIVE',
            phone: '9876543210', // 10-digit format without +91
            mustChangePassword: false // Set to true in production
        });

        console.log('\n🎉 Super Admin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', superAdmin.email);
        console.log('🔑 Password: admin123');
        console.log('🔐 Role:', superAdminRole.name);
        console.log('📊 Level:', superAdminRole.level);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        console.log('🌐 Login at: http://localhost:5173/admin/login\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
        process.exit(1);
    }
}

// Run the script
createSuperAdmin();
