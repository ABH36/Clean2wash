const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function seed() {
    try {
        await mongoose.connect(DB);
        console.log('Connected to database for notification seeding...');

        const user = await User.findOne({ phone: '9999999999' });
        if (!user) {
            console.error('Test user 9999999999 not found!');
            process.exit(1);
        }

        // Clean up existing notifications for this user
        await Notification.deleteMany({ consumer: user._id });
        console.log('Cleaned up old notifications.');

        const notifications = [
            {
                consumer: user._id,
                title: 'Booking Confirmed!',
                message: 'Your Premium Eco Wash for Hyundai Creta (DL62AA8) is confirmed for Mar 12, 10:00 AM.',
                type: 'booking',
                priority: 'high',
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
            },
            {
                consumer: user._id,
                title: 'Captain Assigned',
                message: 'Captain Rahul has been assigned to your booking CW' + Date.now().toString(36).toUpperCase(),
                type: 'booking',
                priority: 'medium',
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            },
            {
                consumer: user._id,
                title: 'Wallet Topped Up',
                message: '₹500 has been successfully added to your wallet.',
                type: 'payment',
                priority: 'medium',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
            },
            {
                consumer: user._id,
                title: 'Weekend Special Offer!',
                message: 'Get 20% OFF on all Studio services this weekend. Use code: WEEKEND20',
                type: 'promotion',
                priority: 'low',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
            }
        ];

        await Notification.insertMany(notifications);
        console.log('Seeded 4 notifications for test user.');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
