const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const allPending = await Booking.find({
        status: 'pending',
        isActive: true
    }).populate('consumer', 'name').populate('vehicle', 'brand model');
    
    console.log('Total Pending Bookings:', allPending.length);
    allPending.forEach(l => {
        console.log(`ID: ${l._id}, BookingId: ${l.bookingId}, Type: ${l.service?.type}, Consumer: ${l.consumer?.name}, CreatedAt: ${l.createdAt}`);
    });
    
    process.exit(0);
}

check();
