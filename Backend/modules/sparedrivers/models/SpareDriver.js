const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const spareDriverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    status: {
        type: String,
        enum: ['onboarding', 'pending_verification', 'active', 'suspended', 'rejected'],
        default: 'onboarding'
    },
    documents: {
        aadhaarCard: {
            url: String,
            verified: { type: Boolean, default: false }
        },
        drivingLicense: {
            url: String,
            verified: { type: Boolean, default: false }
        },
        selfie: {
            url: String,
            verified: { type: Boolean, default: false }
        }
    },
    experience: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: undefined    // not set until driver shares location
        },
        coordinates: {
            type: [Number],
            default: undefined    // must be explicitly set, avoids empty Point
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// sparse: true → only index docs that actually have coordinates (skips new drivers)
spareDriverSchema.index({ currentLocation: '2dsphere' }, { sparse: true });

// Encrypt password before saving (async pre-save, no next() needed in Mongoose 6+)
spareDriverSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
spareDriverSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('SpareDriver', spareDriverSchema);
