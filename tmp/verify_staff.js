const mongoose = require('c:/Users/FTT/Documents/GitHub/Clean-2-Wash/Backend/node_modules/mongoose');
const User = require('c:/Users/FTT/Documents/GitHub/Clean-2-Wash/Backend/models/User');
const dotenv = require('c:/Users/FTT/Documents/GitHub/Clean-2-Wash/Backend/node_modules/dotenv');
const path = require('path');

dotenv.config({ path: 'c:/Users/FTT/Documents/GitHub/Clean-2-Wash/Backend/.env' });

const testStaffFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Find a vendor
        const vendor = await User.findOne({ role: 'vendor' });
        if (!vendor) throw new Error('No vendor found for testing');
        console.log(`Testing with Vendor: ${vendor.name} (${vendor._id})`);

        const testPhone = '9999999999';

        // 2. Clean up any existing test user
        await User.deleteOne({ phone: testPhone });
        console.log('Cleaned up previous test user');

        // 3. Create a staff member via vendor logic (simulating createStaff)
        const newStaff = await User.create({
            name: 'Test Agent',
            phone: testPhone,
            password: '1234',
            role: 'staff',
            isVerified: true,
            profile: {
                vendorId: vendor._id,
                studioName: vendor.profile?.studioName || 'Test Studio'
            }
        });
        console.log(`Created Staff: ${newStaff.name} linked to ${vendor._id}`);

        // 4. Verify linkage via getStaff logic
        const linkedStaff = await User.find({ role: 'staff', 'profile.vendorId': vendor._id });
        const isLinked = linkedStaff.some(s => s.phone === testPhone);
        console.log(`Verification: Staff linked correctly? ${isLinked}`);

        // 5. Simulate search
        const searchResult = await User.findOne({ phone: testPhone, role: 'staff' });
        console.log(`Verification: Search found staff? ${!!searchResult}`);

        // 6. Simulate unlink
        await User.updateOne(
            { _id: newStaff._id },
            { $set: { 'profile.vendorId': null } }
        );
        const postUnlink = await User.findById(newStaff._id);
        console.log(`Verification: Staff unlinked correctly? ${postUnlink.profile.vendorId === null}`);

        // 7. Clean up
        await User.deleteOne({ _id: newStaff._id });
        console.log('Test completed and cleaned up');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testStaffFlow();
