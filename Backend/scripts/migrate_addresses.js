const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const colors = require('colors');

dotenv.config({ path: './.env.local' });

const migrateAddresses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB'.green);

        const users = await User.find({ 'profile.address': { $exists: true } });
        console.log(`Found ${users.length} users with legacy address objects.`.yellow);

        let migratedCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (const user of users) {
            const legacyAddress = user.profile.address;

            // Skip if no actual street data (it might just be an empty object {})
            if (!legacyAddress || !legacyAddress.street) {
                skipCount++;
                continue;
            }

            // If array is already populated, skip
            if (user.profile.addresses && user.profile.addresses.length > 0) {
                skipCount++;
                continue;
            }

            // Check for required coordinate fields
            if (!legacyAddress.coordinates || typeof legacyAddress.coordinates.lat !== 'number' || typeof legacyAddress.coordinates.lng !== 'number') {
                console.warn(`[WARN] Skipping user ${user._id} (${user.name}): Incomplete coordinates.`);
                failCount++;
                continue;
            }

            try {
                user.profile.addresses = [{
                    label: 'Home',
                    street: legacyAddress.street,
                    city: legacyAddress.city || 'Bengaluru',
                    state: legacyAddress.state || 'Karnataka',
                    pincode: legacyAddress.pincode || '560001',
                    landmark: legacyAddress.landmark || '',
                    coordinates: legacyAddress.coordinates,
                    isPrimary: true
                }];

                // Use validateBeforeSave: false to avoid issues with missing fields like passwords or unrelated model updates
                await user.save({ validateBeforeSave: false });
                migratedCount++;
            } catch (err) {
                console.error(`[ERROR] Failed to migrate user ${user._id}:`, err.message);
                failCount++;
            }
        }

        console.log(`\n-------------------------------------------`.white);
        console.log(`Successfully migrated : ${String(migratedCount).green.bold}`);
        console.log(`Failed/Skipped        : ${String(failCount).red.bold}`);
        console.log(`Already Migrated/Empty: ${String(skipCount).blue}`);
        console.log(`-------------------------------------------\n`.white);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:'.red, error);
        process.exit(1);
    }
};

migrateAddresses();
