const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'Plan price is required'],
        min: 0
    },
    interval: {
        type: String,
        required: [true, 'Billing interval is required'],
        enum: ['Monthly', 'Quarterly', 'Annual'],
        default: 'Monthly'
    },
    features: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['Live', 'Hidden'],
        default: 'Live'
    },
    accent: {
        type: String,
        default: 'brand' // Accent color identifier for frontend
    },
    applicableServices: {
        type: [String],
        default: []
    },
    credits: {
        type: Number,
        required: [true, 'Please specify the number of washes/credits'],
        default: 0
    },
    maxVehicles: {
        type: Number,
        default: 1
    },
    rollover: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
