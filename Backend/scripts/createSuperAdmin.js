const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Role = require('../models/Role');
const readline = require('readline');
require('dotenv').config();

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

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    return password.length >= 8;
}

/**
 * Create super admin interactively
 */
async function createSuperAdmin() {
    try {
        log.header('🚀 CREATE SUPER ADMIN');

        // Connect to database
        log.info('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        log.success('Connected to database\n');

        // Check if super admin role exists
        const superAdminRole = await Role.findOne({ slug: 'super_admin' });
        
        if (!superAdminRole) {
            log.error('Super Admin role not found!');
            log.warning('Please run the seed script first: npm run seed:rbac');
            process.exit(1);
        }

        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: superAdminRole._id });
        
        if (existingSuperAdmin) {
            log.warning('Super Admin already exists:');
            log.info(`  Name: ${existingSuperAdmin.name}`);
            log.info(`  Email: ${existingSuperAdmin.email}`);
            log.info(`  Status: ${existingSuperAdmin.status}\n`);
            
            const overwrite = await question('Do you want to create another super admin? (yes/no): ');
            
            if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
                log.info('Operation cancelled.');
                process.exit(0);
            }
        }

        // Get admin details from user
        log.info('\nEnter super admin details:\n');

        let name, email, password, phone;

        // Get name
        while (!name) {
            name = await question('Full Name: ');
            if (!name.trim()) {
                log.error('Name is required!');
                name = null;
            }
        }

        // Get email
        while (!email) {
            email = await question('Email: ');
            if (!isValidEmail(email)) {
                log.error('Invalid email format!');
                email = null;
            } else {
                // Check if email already exists
                const emailExists = await Admin.emailExists(email);
                if (emailExists) {
                    log.error('Email already exists!');
                    email = null;
                }
            }
        }

        // Get password
        while (!password) {
            password = await question('Password (min 8 characters): ');
            if (!isValidPassword(password)) {
                log.error('Password must be at least 8 characters!');
                password = null;
            }
        }

        // Get phone (optional)
        phone = await question('Phone (optional, 10 digits): ');
        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            log.warning('Invalid phone format. Skipping...');
            phone = '';
        }

        // Create super admin
        log.info('\nCreating super admin...');
        
        const admin = await Admin.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: superAdminRole._id,
            status: 'ACTIVE',
            phone: phone || '',
            mustChangePassword: false,
            metadata: {
                department: 'System',
                employeeId: 'SA-' + Date.now().toString().slice(-6),
                notes: 'Super administrator created via CLI'
            }
        });

        log.success('\n✅ Super Admin created successfully!\n');
        log.info('Login Credentials:');
        log.info(`  Email: ${admin.email}`);
        log.info(`  Password: ${password}`);
        log.info(`  Role: Super Admin`);
        log.info(`  Status: ${admin.status}\n`);
        
        log.warning('⚠️  IMPORTANT: Save these credentials securely!');
        log.warning('⚠️  You can now login to the admin panel.\n');

        process.exit(0);
    } catch (error) {
        log.error(`\nFailed to create super admin: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the script
createSuperAdmin();
