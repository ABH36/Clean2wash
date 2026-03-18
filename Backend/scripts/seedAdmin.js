require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carwash';
        await mongoose.connect(dbUri);
        console.log('Connected to DB');

        const adminEmail = 'admin@CarWash.in';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin already exists. Deleting...');
            await User.deleteOne({ email: adminEmail });
        }

        const hashedPassword = await bcrypt.hash('admin123', 12);

        const newAdmin = new User({
            name: 'System Admin',
            email: adminEmail,
            phone: '9000000000', // Dummy phone, since it's required by User model
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await newAdmin.save();
        console.log('Admin user seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed admin:', error);
        process.exit(1);
    }
};

seedAdmin();
