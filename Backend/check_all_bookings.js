const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwash';

async function test() {
    await mongoose.connect(DB);
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`TOTAL_BOOKINGS_FOUND:${bookings.length}`);
    bookings.forEach((b, i) => {
        console.log(`B[${i}]: ID=${b._id}, Consumer=${b.consumer}, Status=${b.status}, HasImages=${!!b.serviceImages}`);
    });
    process.exit();
}

test();
