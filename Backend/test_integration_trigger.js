const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Captain = require('./models/Captain');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const { sendNotification } = require('./utils/notificationService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

async function testIntegration() {
    try {
        await mongoose.connect(DB);
        console.log('Connected to DB for integration testing...');

        const user = await User.findOne({ phone: '9999999999' });
        let captain = await Captain.findOne({ phone: '8888888888' });

        if (!captain) {
            console.log('Captain 8888888888 not found, attempting to find any captain...');
            captain = await Captain.findOne({});
        }

        if (!captain) {
            console.log('Creating a dummy captain for integration test...');
            try {
                captain = await Captain.create({
                    name: 'Captain Rahul (Test)',
                    phone: '8888888888',
                    password: 'password123',
                    isVerified: true,
                    status: 'active'
                });
            } catch (err) {
                if (err.code === 11000) {
                    console.log('Captain already exists (duplicate key), fetching...');
                    captain = await Captain.findOne({ phone: '8888888888' });
                } else {
                    throw err;
                }
            }
        }

        if (!captain || !user) {
            console.error('User or Captain not found. User:', !!user, 'Captain:', !!captain);
            process.exit(1);
        }

        // Ensure user has a vehicle
        let vehicle = await Vehicle.findOne({ owner: user._id });
        if (!vehicle) {
            console.log('Creating dummy vehicle for user...');
            vehicle = await Vehicle.create({
                owner: user._id,
                brand: 'Hyundai',
                model: 'Creta',
                type: 'SUV',
                plate: 'TEST-VEHICLE-123',
                isPrimary: true
            });
        }

        // 1. Find a pending booking for this user
        let booking = await Booking.findOne({ consumer: user._id, status: 'pending' });

        if (!booking) {
            console.log('Creating a dummy pending booking for integration test...');
            // Create a minimal booking
            booking = await Booking.create({
                consumer: user._id,
                vehicle: vehicle._id,
                service: {
                    id: 'eco-wash',
                    name: 'Eco Wash Integration Test',
                    category: 'Doorstep',
                    type: 'captain'
                },
                pricing: { baseAmount: 299, totalAmount: 299 },
                status: 'pending',
                provider: { type: 'captain' }
            });
        }

        console.log('Simulating Captain accepting job... (Booking ID:', booking._id, ')');

        // Trigger notification exactly like in jobController.js acceptJob
        await sendNotification(booking.consumer, {
            title: 'Captain Assigned! 👷',
            message: `Captain ${captain.name} has accepted your booking for ${booking.service?.name || 'your wash'}.`,
            type: 'booking',
            priority: 'high',
            metaData: { bookingId: booking._id, captainId: captain._id }
        });

        console.log('Notification sent for "Captain Assigned"');

        // Simulate status update to "completed"
        console.log('Simulating job completion status change...');

        await sendNotification(booking.consumer, {
            title: 'Your Car is Clean! ✨',
            message: `Captain ${captain.name} has finished the wash. Order #${booking.bookingId || booking._id} is complete.`,
            type: 'booking',
            priority: 'high',
            metaData: { bookingId: booking._id, status: 'completed' }
        });

        console.log('Notification sent for "Job Completed"');

        process.exit(0);
    } catch (error) {
        if (error.name === 'ValidationError') {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error on ${key}:`, error.errors[key].message);
            });
        } else {
            console.error('Integration test failed:', error);
        }
        process.exit(1);
    }
}

testIntegration();
