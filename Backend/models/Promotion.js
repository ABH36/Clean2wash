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
    val: {
        type: Number, // Numeric value without symbols
        required: true
    },
    valUnit: {
        type: String,
        enum: ['PERCENT', 'FLAT'],
        default: 'FLAT'
    },
    expiry: Date,

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
    category: {
        type: String,
        enum: ['driver', 'carwash', 'promo'],
        default: 'promo'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
