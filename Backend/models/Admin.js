const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role is required']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number']
    },
    avatar: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    mustChangePassword: {
        type: Boolean,
        default: true // Force password change on first login
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    metadata: {
        department: {
            type: String,
            default: ''
        },
        employeeId: {
            type: String,
            default: ''
        },
        notes: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ status: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for account locked status
adminSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();
    
    // Hash password
    this.password = await bcrypt.hash(this.password, 10);
    
    // Set password changed timestamp
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token is created after password change
    }
    
    next();
});

// Compare password method
adminSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });
};

// Static method to get admin with role and permissions
adminSchema.statics.findByIdWithPermissions = async function(id) {
    return this.findById(id)
        .populate({
            path: 'role',
            populate: {
                path: 'permissions',
                select: 'module action resource description'
            }
        })
        .select('+password');
};

// Static method to check if email exists
adminSchema.statics.emailExists = async function(email, excludeId = null) {
    const query = { email: email.toLowerCase() };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const admin = await this.findOne(query);
    return !!admin;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
