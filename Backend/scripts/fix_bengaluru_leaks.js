const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

/**
 * 🧹 Data Cleanup Migration: Fix "Bengaluru Leak"
 * This script identifies addresses with 'Bengaluru' as city but whose street address 
 * contains other keywords (like Indore, Delhi, etc.) and fixes them.
 */

async function runMigration() {
    try {
        console.log('🚀 Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const users = await User.find({ 
            $or: [
                { 'profile.address.city': 'Bengaluru' },
                { 'profile.addresses.city': 'Bengaluru' }
            ]
        });

        console.log(`🔍 Found ${users.length} users with Bengaluru addresses. Inspecting...`);

        let fixedCount = 0;

        for (const user of users) {
            let modified = false;

            // 1. Check Legacy Address
            if (user.profile?.address?.city === 'Bengaluru') {
                const street = (user.profile.address.street || '').toLowerCase();
                if (street.includes('indore') || street.includes('delhi') || street.includes('kartavya path')) {
                    console.log(`   Fixing Legacy for user ${user._id}: ${user.profile.address.street}`);
                    if (street.includes('indore')) user.profile.address.city = 'Indore';
                    else if (street.includes('delhi')) user.profile.address.city = 'Delhi';
                    modified = true;
                }
            }

            // 2. Check Modern Addresses Array
            if (user.profile?.addresses?.length > 0) {
                user.profile.addresses.forEach(addr => {
                    if (addr.city === 'Bengaluru') {
                        const street = (addr.street || '').toLowerCase();
                        if (street.includes('indore') || street.includes('delhi') || street.includes('kartavya path')) {
                            console.log(`   Fixing Modern for user ${user._id}: ${addr.street}`);
                            if (street.includes('indore')) addr.city = 'Indore';
                            else if (street.includes('delhi')) addr.city = 'Delhi';
                            modified = true;
                        }
                    }
                });
            }

            if (modified) {
                // Ensure primary address syncs back to legacy
                const primary = user.profile.addresses.find(a => a.isPrimary) || user.profile.addresses[0];
                if (primary) {
                    user.profile.address = {
                        ...user.profile.address,
                        city: primary.city,
                        street: primary.street,
                        state: primary.state || user.profile.address.state
                    };
                }
                
                await User.findByIdAndUpdate(user._id, { profile: user.profile });
                fixedCount++;
            }
        }

        console.log(`\n✅ Migration Complete. Fixed ${fixedCount} users.`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
