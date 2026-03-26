const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const result = await Booking.updateMany(
        { bookingId: 'CWMMTY7234' },
        { status: 'completed', isActive: false }
    );
    
    console.log('Update Result:', result);
    process.exit(0);
}

run();
