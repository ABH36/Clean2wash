const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    entityType: {
        type: String,
        required: true,
        enum: ['USER', 'DRIVER', 'PHONE', 'EMAIL', 'DEVICE', 'IP_ADDRESS']
    },
    entityId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpareDriver'
    },
    reason: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: Date,
    isPermanent: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    relatedAlerts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FraudAlert'
    }],
    notes: String
}, {
    timestamps: true
});

// Indexes
blacklistSchema.index({ entityType: 1, entityId: 1 });
blacklistSchema.index({ userId: 1 });
blacklistSchema.index({ driverId: 1 });
blacklistSchema.index({ isActive: 1, expiresAt: 1 });

// Check if blacklist entry is still valid
blacklistSchema.methods.isValid = function() {
    if (!this.isActive) return false;
    if (this.isPermanent) return true;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
};

module.exports = mongoose.model('Blacklist', blacklistSchema);
