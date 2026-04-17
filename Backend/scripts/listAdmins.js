const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

// Color codes
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

/**
 * List all admins
 */
async function listAdmins() {
    try {
        log.header('👥 ADMIN LIST');

        // Connect to database
        log.info('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        log.success('Connected to database\n');

        // Get all admins
        const admins = await Admin.find()
            .populate('role', 'name slug level')
            .sort({ createdAt: -1 })
            .select('name email status role lastLogin createdAt');

        if (admins.length === 0) {
            log.warning('No admins found in the database.');
            process.exit(0);
        }

        log.success(`Found ${admins.length} admin(s):\n`);

        // Display admins in table format
        console.log('─'.repeat(120));
        console.log(
            'NAME'.padEnd(25) +
            'EMAIL'.padEnd(35) +
            'ROLE'.padEnd(20) +
            'STATUS'.padEnd(15) +
            'LAST LOGIN'
        );
        console.log('─'.repeat(120));

        admins.forEach((admin) => {
            const name = admin.name.padEnd(25);
            const email = admin.email.padEnd(35);
            const role = (admin.role?.name || 'N/A').padEnd(20);
            
            let status;
            if (admin.status === 'ACTIVE') {
                status = `${colors.green}${admin.status}${colors.reset}`.padEnd(24);
            } else if (admin.status === 'SUSPENDED') {
                status = `${colors.red}${admin.status}${colors.reset}`.padEnd(24);
            } else {
                status = `${colors.yellow}${admin.status}${colors.reset}`.padEnd(24);
            }
            
            const lastLogin = admin.lastLogin 
                ? new Date(admin.lastLogin).toLocaleString()
                : 'Never';

            console.log(`${name}${email}${role}${status}${lastLogin}`);
        });

        console.log('─'.repeat(120));

        // Statistics
        const stats = {
            total: admins.length,
            active: admins.filter(a => a.status === 'ACTIVE').length,
            inactive: admins.filter(a => a.status === 'INACTIVE').length,
            suspended: admins.filter(a => a.status === 'SUSPENDED').length
        };

        log.info(`\nStatistics:`);
        log.info(`  Total: ${stats.total}`);
        log.success(`  Active: ${stats.active}`);
        log.warning(`  Inactive: ${stats.inactive}`);
        log.error(`  Suspended: ${stats.suspended}\n`);

        process.exit(0);
    } catch (error) {
        log.error(`\nFailed to list admins: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
listAdmins();
