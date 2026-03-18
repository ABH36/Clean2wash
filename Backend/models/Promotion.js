const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Coupons', 'Referrals', 'Offers', 'Banners', 'Expansion'],
        required: true
    },
    // Common fields
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    usage: {
        type: Number,
        default: 0
    },
    // Coupon/Offer specific
    code: {
        type: String,
        trim: true,
        uppercase: true
    },
    reductionType: {
        type: String, // Percentage, Flat, Freebie
        enum: ['Percentage', 'Flat', 'Freebie']
    },
    val: String, // "50%", "₹100", etc.
    expiry: String, // simplified to match frontend date string

    // Referral specific
    name: String,
    userGets: String,
    friendGets: String,

    // Banner specific
    title: String,
    subtitle: String,
    image: String, // URL
    cta: String,
    path: String,
    theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark'
    },

    applicableServices: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
