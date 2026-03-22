const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const Booking = require('./models/Booking');

async function fixBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all bookings where provider.type exists but provider.model does not
        const filter = {
            'provider.type': { $exists: true },
            'provider.model': { $exists: false }
        };

        const count = await Booking.countDocuments(filter);
        console.log(`Found ${count} bookings missing provider.model`);

        if (count > 0) {
            const bookings = await Booking.find(filter).limit(100);
            let fixed = 0;

            for (const b of bookings) {
                const type = b.provider.type;
                let model = '';
                if (type === 'captain') model = 'Captain';
                else if (type === 'vendor') model = 'User';
                else if (type === 'sparedriver') model = 'SpareDriver';

                if (model) {
                    await Booking.updateOne({ _id: b._id }, { $set: { 'provider.model': model } });
                    fixed++;
                }
            }
            console.log(`Successfully fixed ${fixed} bookings`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Fix error:', error);
        process.exit(1);
    }
}

fixBookings();
