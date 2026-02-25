const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const VendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an owner name']
    },
    email: {
        type: String,
        required: [true, 'Please add a business email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        unique: true,
        match: [
            /^\d{10}$/,
            'Please add a valid 10 digit phone number'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    studioName: {
        type: String,
        required: [true, 'Please add a studio name']
    },
    city: {
        type: String,
        required: [true, 'Please add an operating city']
    },
    role: {
        type: String,
        default: 'vendor'
    },
    idProof: {
        type: String, // URL/Base64
        required: [true, 'Please upload an ID proof']
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'bronze', 'silver', 'gold'],
            default: 'free'
        },
        expiresAt: Date,
        isActive: {
            type: Boolean,
            default: false
        }
    },
    operationalStatus: {
        type: String,
        enum: ['online', 'offline', 'busy'],
        default: 'offline'
    },
    earnings: {
        daily: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    wallet: {
        balance: { type: Number, default: 0 }
    },
    rating: {
        type: Number,
        default: 5.0
    },
    reviews: {
        type: Number,
        default: 0
    },
    location: {
        address: String,
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    services: [{
        name: String,
        price: Number,
        duration: { type: String, default: '1 hour' },
        category: {
            type: String,
            enum: ['Cleaning', 'Detailing', 'Protection', 'Maintenance', 'Enhancement'],
            default: 'Cleaning'
        },
        active: { type: Boolean, default: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
VendorSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
VendorSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: 'vendor' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
VendorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Vendor', VendorSchema);
