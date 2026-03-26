const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Using ID instead of bookingId for accuracy
    const result = await Booking.updateMany(
        { status: { $ne: 'completed' } }, // Complete ALL non-completed ones
        { status: 'completed', isActive: true }
    );
    
    console.log('Updated ALL non-completed bookings to completed:', result);
    process.exit(0);
}

run();
