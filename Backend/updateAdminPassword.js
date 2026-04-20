const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const updateAdminPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sparedriver');
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('❌ No admin user found!');
            process.exit(1);
        }

        console.log('Found admin user:', admin.email);

        // Set new password (will be hashed by pre-save middleware)
        admin.password = 'admin123';
        await admin.save();

        console.log('✅ Admin password updated successfully!');
        console.log('Email:', admin.email);
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error updating admin password:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

updateAdminPassword();