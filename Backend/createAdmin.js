const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sparedriver');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Phone:', existingAdmin.phone);
            console.log('Role:', existingAdmin.role);
            console.log('Name:', existingAdmin.name);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = new User({
            name: 'Super Administrator',
            email: 'admin@SpareDriver.in',
            phone: '9999999999',
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            isOnline: true,
            profile: {
                avatar: '',
                city: 'Mumbai',
                state: 'Maharashtra'
            }
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@SpareDriver.in');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

createAdmin();