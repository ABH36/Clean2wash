const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const Booking = require('./models/Booking');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const Captain = require('./models/Captain');
const SpareDriver = require('./models/SpareDriver');

async function testGetBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const filter = {
            isActive: true
        };

        const allBookings = await Booking.find(filter);
        console.log(`Total active bookings in DB: ${allBookings.length}`);

        for (let i = 0; i < allBookings.length; i++) {
            const b = allBookings[i];
            try {
                const doc = await Booking.findById(b._id)
                    .populate('vehicle', 'brand model type plate image')
                    .populate('provider.id', 'name phone rating photo');

                // Trigger virtuals
                if (doc) {
                    doc.toJSON();
                }
            } catch (err) {
                console.error(`!!! CRASH ON BOOKING ${b._id} !!!`);
                console.error(err);
                console.log('Booking Data:', JSON.stringify(b));
            }
        }

        console.log('Test completed.');
        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

testGetBookings();
