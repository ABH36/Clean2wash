const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const activeStates = ['pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned', 'en_route', 'arrived', 'at-studio', 'washing', 'in_progress'];
    
    const activeBookings = await Booking.find({
        status: { $in: activeStates },
        isActive: true
    }).populate('consumer', 'name').populate('vehicle', 'brand model plate');
    
    console.log('Found Active Bookings:', activeBookings.length);
    activeBookings.forEach(l => {
        console.log(`ID: ${l._id}, BookingId: ${l.bookingId}, Status: ${l.status}, Type: ${l.service?.type}, Consumer: ${l.consumer?.name}, Vehicle: ${l.vehicle?.brand} ${l.vehicle?.model} (${l.vehicle?.plate})`);
    });
    
    process.exit(0);
}

check();
