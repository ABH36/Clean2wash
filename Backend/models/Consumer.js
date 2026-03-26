const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const consumerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
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
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
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
        avatar: {
            type: String,
            default: ''
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        }
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
        },
        transactions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction'
        }]
    },
    vehicles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    }],
    primaryVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    loyalty: {
        completedBookingsCount: {
            type: Number,
            default: 0
        },
        rewardsAvailable: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
// consumerSchema.index({ email: 1 });
// consumerSchema.index({ phone: 1 });
consumerSchema.index({ 'profile.address.city': 1 });
consumerSchema.index({ isActive: 1 });

// Virtual for full address
consumerSchema.virtual('fullAddress').get(function() {
    if (!this.profile.address) return '';
    const { street, city, state, pincode } = this.profile.address;
    return `${street || ''}, ${city || ''}, ${state || ''} ${pincode || ''}`.trim();
});

// Pre-save middleware to hash password
consumerSchema.pre('save', async function() {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return;
    
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
});

// Instance method to check password
consumerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to generate OTP
consumerSchema.methods.generateOTP = function() {
    const otp = '1234';
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    return otp;
};

// Instance method to verify OTP
consumerSchema.methods.verifyOTP = function(enteredOTP) {
    if (!this.otp || !this.otp.code) return false;
    
    const isExpired = this.otp.expiresAt < new Date();
    if (isExpired) return false;
    
    return this.otp.code === enteredOTP;
};

// Static method to find by email or phone
consumerSchema.statics.findByEmailOrPhone = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phone: identifier }
        ]
    });
};

const Consumer = mongoose.model('Consumer', consumerSchema);

module.exports = Consumer;
