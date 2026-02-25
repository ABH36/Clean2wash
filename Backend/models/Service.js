const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    subtitle: String,
    price: {
        type: String, // Stored as "₹299" to match frontend parse logic
        required: true
    },
    originalPrice: String,
    duration: String,
    tag: String,
    badge: String,
    image: String,
    features: [String],
    provider: {
        type: String,
        enum: ['captain', 'vendor'],
        required: true
    },
    category: {
        type: String,
        enum: ['Doorstep', 'Studio', 'Add-ons', 'Prestige'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Draft', 'Featured'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Service', ServiceSchema);
