const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
        sparse: true, // Some roles might only use phone (like Consumers initially)
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
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
        minlength: [4, 'Password/PIN must be at least 4 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['consumer', 'captain', 'sparedriver', 'vendor', 'staff', 'admin'],
        required: true,
        default: 'consumer'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date
    },
    profile: {
        avatar: { type: String, default: '' },
        // Consumer specific
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            coordinates: { lat: Number, lng: Number }
        },
        // Captain / SpareDriver specific
        vehicleType: { type: String, default: '' },
        plate: { type: String, default: '' },
        kit: { type: String, default: '' },
        experience: { type: Number, default: 0 },
        // Vendor / Staff specific
        studioName: { type: String, default: '' },
        hub: { type: String, default: '' },
        city: { type: String, default: '' },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For staff to link to vendor
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        idProof: { type: String, default: '' },
        inventory: [{
            id: String,
            name: String,
            category: String,
            stock: Number,
            unit: String,
            status: String,
            threshold: Number
        }],
        fleet: [{
            id: String,
            model: String,
            plate: String,
            type: String,
            status: { type: String, default: 'Available' }
        }],
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true }
        },
        trustedContacts: [{
            name: { type: String, required: true },
            phone: { type: String, required: true },
            relation: { type: String },
            addedAt: { type: Date, default: Date.now }
        }]
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    wallet: {
        balance: {
            type: Number,
            default: 0,
            min: [0, 'Wallet balance cannot be negative']
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    vehicles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    }],
    primaryVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    // For captains and drivers
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
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: undefined
        },
        coordinates: {
            type: [Number],
            default: undefined
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Referral System
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralsCount: {
        type: Number,
        default: 0
    },
    totalReferralEarnings: {
        type: Number,
        default: 0
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1, role: 1 }, { sparse: true });
userSchema.index({ 'profile.address.city': 1 });
userSchema.index({ isActive: 1, isOnline: 1 });
userSchema.index({ currentLocation: '2dsphere' }, { sparse: true });

// Pre-save middleware to hash password and generate referral code
userSchema.pre('save', async function () {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    // Generate Referral Code if not present
    if (!this.referralCode) {
        const namePart = (this.name || 'USER').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.referralCode = `${namePart}${randomPart}`;
    }
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    if (!userPassword) return false;
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to generate OTP
userSchema.methods.generateOTP = function () {
    // FIXED DEFAULT TO 1234 FOR TESTING PURPOSES AS PER FRONTEND EXPECTATION
    const otp = '1234';
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
    if (!this.otp || !this.otp.code) return false;

    // DEV MODE FALLBACK
    if (enteredOTP === '1234') return true;

    const isExpired = this.otp.expiresAt < new Date();
    if (isExpired) return false;

    return this.otp.code === enteredOTP;
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = function (identifier) {
    if (!identifier) return null;
    const strIdentifier = identifier.toString();
    return this.findOne({
        $or: [
            { phone: strIdentifier },
            { email: strIdentifier.toLowerCase() }
        ]
    });
};

module.exports = mongoose.model('User', userSchema);
