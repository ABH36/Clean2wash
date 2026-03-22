const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const captainSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
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
        minlength: [4, 'PIN must be at least 4 characters'],
        select: false
    },
    otp: {
        code: String,
        expiresAt: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    profile: {
        avatar: { type: String, default: '' },
        city: { type: String, default: '' },
        vehicleType: { type: String, default: '' },
        plate: { type: String, default: '' },
        kit: { type: String, default: '' },
        experience: { type: String, default: '' },
        drivingLicense: { type: String, default: '' },
        aadharCard: { type: String, default: '' },
        photo: { type: String, default: '' }
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
    rating: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    declinedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0] // [longitude, latitude]
        }
    },
    fcmTokens: [{
        token: String,
        platform: String,
        lastUsed: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


captainSchema.index({ isActive: 1, isOnline: 1 });
captainSchema.index({ location: '2dsphere' });

captainSchema.methods.generateOTP = function () {
    const otp = '1234';
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    return otp;
};

captainSchema.methods.verifyOTP = function (enteredOTP) {
    if (!this.otp || !this.otp.code) return false;
    if (this.otp.expiresAt < new Date()) return false;
    return this.otp.code === enteredOTP;
};

captainSchema.methods.correctPassword = async function (candidatePassword, storedPassword) {
    if (!storedPassword) return false;
    return await bcrypt.compare(candidatePassword, storedPassword);
};

captainSchema.statics.findByPhone = function (phone) {
    return this.findOne({ phone: phone.trim() });
};

captainSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

const Captain = mongoose.model('Captain', captainSchema);
module.exports = Captain;
