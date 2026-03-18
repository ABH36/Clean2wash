const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB = process.env.MONGODB_URI;

mongoose.connect(DB).then(() => {
    console.log('DB Connection successful');
}).catch(err => {
    console.error('DB Connection error:', err);
});

const seedVendor = async () => {
    try {
        await User.findOneAndDelete({ email: 'vendor@CarWash.in' });

        const newVendor = await User.create({
            name: 'Cyber Hub Elite Studio',
            email: 'vendor@CarWash.in',
            phone: '9876543212',
            password: 'vendor123',
            passwordConfirm: 'vendor123',
            role: 'vendor',
            isEnterprise: true,
            studioName: 'Cyber Hub Wash & Detailing',
            verificationStatus: 'verified',
            city: 'Gurugram'
        });

        console.log('Vendor seeded successfully!', newVendor.email);
        process.exit();
    } catch (error) {
        console.error('Error seeding vendor:', error);
        process.exit(1);
    }
};

seedVendor();
