const mongoose = require('mongoose');
const Admin = require('../models/Admin');
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

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Validate password strength
 */
function isValidPassword(password) {
    return password.length >= 8;
}

/**
 * Reset admin password
 */
async function resetAdminPassword() {
    try {
        log.header('🔐 RESET ADMIN PASSWORD');

        // Connect to database
        log.info('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        log.success('Connected to database\n');

        // Get admin email
        const email = await question('Enter admin email: ');
        
        if (!email) {
            log.error('Email is required!');
            process.exit(1);
        }

        // Find admin
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).populate('role');
        
        if (!admin) {
            log.error('Admin not found with this email!');
            process.exit(1);
        }

        // Display admin info
        log.info('\nAdmin found:');
        log.info(`  Name: ${admin.name}`);
        log.info(`  Email: ${admin.email}`);
        log.info(`  Role: ${admin.role.name}`);
        log.info(`  Status: ${admin.status}\n`);

        // Confirm reset
        const confirm = await question('Do you want to reset password for this admin? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
            log.info('Operation cancelled.');
            process.exit(0);
        }

        // Get new password
        let newPassword;
        while (!newPassword) {
            newPassword = await question('\nEnter new password (min 8 characters): ');
            if (!isValidPassword(newPassword)) {
                log.error('Password must be at least 8 characters!');
                newPassword = null;
            }
        }

        // Confirm password
        const confirmPassword = await question('Confirm new password: ');
        
        if (newPassword !== confirmPassword) {
            log.error('Passwords do not match!');
            process.exit(1);
        }

        // Reset password
        admin.password = newPassword;
        admin.mustChangePassword = false;
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();

        log.success('\n✅ Password reset successfully!\n');
        log.info('New Credentials:');
        log.info(`  Email: ${admin.email}`);
        log.info(`  Password: ${newPassword}\n`);
        
        log.warning('⚠️  IMPORTANT: Share these credentials securely with the admin.');
        log.warning('⚠️  Login attempts have been reset.\n');

        process.exit(0);
    } catch (error) {
        log.error(`\nFailed to reset password: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the script
resetAdminPassword();
