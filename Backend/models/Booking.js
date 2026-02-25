const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Consumer',
        required: true
    },
    service: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: true
    },
    bookingId: {
        type: String,
        unique: true
    },
    vehicle: {
        brand: String,
        model: String,
        plate: String,
        vType: String // SUV, Sedan, etc for multiplier logic
    },
    address: {
        label: String,
        address: String,
        coordinates: { lat: Number, lng: Number }
    },
    scheduledDate: Date,
    scheduledTime: String,
    mode: {
        type: String,
        enum: ['instant', 'scheduled'],
        default: 'instant'
    },
    price: {
        base: Number,
        multiplier: Number,
        final: Number
    },
    status: {
        type: String,
        enum: [
            'pending',          // Initial request
            'accepted',         // Vendor accepted
            'pickup-assigned',  // Staff assigned for pickup
            'out-for-pickup',   // Staff on way to consumer
            'picked-up',        // Car picked up (OTP verified)
            'at-studio',        // Car arrived at studio
            'in-wash',          // Washing in progress
            'wash-completed',   // Wash done, ready for drop
            'drop-assigned',    // Staff assigned for drop
            'out-for-delivery', // Staff on way to drop
            'completed',        // Job done (OTP verified)
            'cancelled',
            'rejected'
        ],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    captain: {
        type: mongoose.Schema.ObjectId,
        ref: 'Captain' // Primary captain for doorstep or pickup/drop
    },
    pickupStaff: {
        type: mongoose.Schema.ObjectId,
        ref: 'Captain'
    },
    dropStaff: {
        type: mongoose.Schema.ObjectId,
        ref: 'Captain'
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor'
    },
    // Verification & Proof
    pickupOTP: String,
    dropOTP: String,
    beforePhotos: [String], // Array of URLs
    afterPhotos: [String],  // Array of URLs
    otpVerified: {
        pickup: { type: Boolean, default: false },
        drop: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
