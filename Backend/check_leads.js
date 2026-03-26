const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const leads = await Booking.find({
        'service.type': 'vendor',
        status: 'pending',
        isActive: true
    }).populate('consumer', 'name').populate('vehicle', 'brand model');
    
    console.log('Pending Vendor Leads:', leads.length);
    leads.forEach(l => {
        console.log(`ID: ${l._id}, BookingId: ${l.bookingId}, Consumer: ${l.consumer?.name}, Vehicle: ${l.vehicle?.brand} ${l.vehicle?.model}, ProviderID: ${l.provider?.id}`);
    });
    
    process.exit(0);
}

check();
