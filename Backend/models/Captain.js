const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const CaptainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
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
        required: [true, 'Please add a password/PIN'],
        minlength: 4,
        select: false
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    city: String,
    role: {
        type: String,
        default: 'captain'
    },
    experience: {
        type: String,
        enum: ['Fresher', '1-2 Years', '2+ Years']
    },
    vehicle: {
        vType: {
            type: String,
            enum: ['Two Wheeler', 'Electric Scouter', 'Three Wheeler', 'Four Wheeler']
        },
        plate: String
    },
    kit: {
        type: String,
        enum: ['Mini-Pro Kit', 'Full Tech Setup', 'I need a kit from CarWash']
    },
    studio: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on-job', 'suspended', 'pending-verification'],
        default: 'pending-verification'
    },
    rating: {
        type: Number,
        default: 5.0
    },
    totalWashes: {
        type: Number,
        default: 0
    },
    earnings: {
        today: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    wallet: {
        balance: { type: Number, default: 0 }
    },
    documents: [{
        name: String,
        status: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected'],
            default: 'Pending'
        },
        url: String
    }],
    profileImage: String,
    isOnline: {
        type: Boolean,
        default: false
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [77.5946, 12.9716] // Default Bangalore
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geo-spatial queries
CaptainSchema.index({ location: '2dsphere' });

// Encrypt password using bcrypt
CaptainSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
CaptainSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: 'captain' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
CaptainSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Captain', CaptainSchema);
