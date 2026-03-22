const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const colors = require('colors');

dotenv.config({ path: './.env.local' });

const verifySync = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ 'profile.addresses.0': { $exists: true } });

        if (!user) {
            console.log('No migrated users found to verify.'.yellow);
            process.exit(0);
        }

        console.log(`Verifying User: ${user.name} (${user.role})`.cyan);
        console.log('Legacy Address:', JSON.stringify(user.profile.address, null, 2).green);
        console.log('Modern Addresses[0]:', JSON.stringify(user.profile.addresses[0], null, 2).blue);

        const isSynced =
            user.profile.address.street === user.profile.addresses[0].street &&
            user.profile.address.pincode === user.profile.addresses[0].pincode;

        if (isSynced) {
            console.log('\n✅ SYNC VERIFIED: Legacy and Modern fields are identical.'.green.bold);
        } else {
            console.log('\n❌ SYNC ERROR: Mismatch detected between legacy and modern fields.'.red.bold);
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verifySync();
