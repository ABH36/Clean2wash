const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const spareDriverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [4, 'Password must be at least 4 characters'],
        select: false
    },
    status: {
        type: String,
        enum: ['pending_docs', 'pending_verification', 'active', 'rejected', 'suspended'],
        default: 'pending_docs'
    },
    documents: {
        aadhaarCard: { url: { type: String, default: '' } },
        drivingLicense: { url: { type: String, default: '' } },
        selfie: { url: { type: String, default: '' } }
    },
    adminNote: {
        type: String,
        default: ''
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    wallet: {
        balance: { type: Number, default: 0, min: 0 },
        lastWithdrawAt: Date
    },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },
    fcmTokens: [{
        token: String,
        platform: String,
        lastUsed: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Index for geo-spatial queries
spareDriverSchema.index({ currentLocation: '2dsphere' });


// Hash password before saving
spareDriverSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
spareDriverSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const SpareDriver = mongoose.model('SpareDriver', spareDriverSchema);

module.exports = SpareDriver;
