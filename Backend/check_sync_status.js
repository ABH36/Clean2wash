const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkSync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Booking = require('./models/Booking');
        const booking = await Booking.findById('69c4d979929d1d303200e6cb');
        
        if (!booking) {
            console.log("Booking not found");
            process.exit(1);
        }

        console.log("--- SYSTEM SYNC STATUS ---");
        console.log(`Booking ID: ${booking.bookingId}`);
        console.log(`Current Status: ${booking.status}`);
        console.log(`Staff Assigned: ${booking.pickupStaff}`);
        console.log(`Custody: ${booking.tracking.custodyStatus}`);
        console.log(`Payment Status: ${booking.payment.status}`);
        
        // Logical Check
        const stepsMap = {
            'pending': 1,
            'confirmed': 2,
            'assigned': 3,
            'en_route': 4,
            'arrived': 5,
            'picked-up': 6,
            'at-studio': 7,
            'washing': 8,
            'completed': 9
        };
        
        console.log(`Current Step: ${stepsMap[booking.status] || 'Unknown'}/9`);
        
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSync();
