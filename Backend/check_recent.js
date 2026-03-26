const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    const bookings = await Booking.find({
        createdAt: { $gte: thirtyMinAgo }
    }).populate('consumer', 'name').populate('vehicle', 'brand model');
    
    console.log(`Recent Bookings (last 30m): ${bookings.length}`);
    bookings.forEach(l => {
        console.log(`ID: ${l._id}, BookingId: ${l.bookingId}, Status: ${l.status}, Type: ${l.service?.type}, Consumer: ${l.consumer?.name}, CreatedAt: ${l.createdAt}`);
    });
    
    process.exit(0);
}

check();
