const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpareDriver'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    alertType: {
        type: String,
        required: true,
        enum: [
            'MULTIPLE_CANCELLATIONS',
            'SUSPICIOUS_PAYMENT',
            'FAKE_BOOKING',
            'ACCOUNT_SHARING',
            'LOCATION_MISMATCH',
            'RAPID_BOOKINGS',
            'UNUSUAL_PATTERN',
            'DRIVER_FRAUD',
            'PAYMENT_FRAUD',
            'IDENTITY_FRAUD',
            'RATING_MANIPULATION',
            'REFUND_ABUSE'
        ]
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    evidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED'],
        default: 'PENDING'
    },
    actionTaken: {
        type: String,
        enum: ['NONE', 'WARNING', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN', 'ACCOUNT_REVIEW'],
        default: 'NONE'
    },
    investigatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    investigationNotes: String,
    resolvedAt: Date,
    autoDetected: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
fraudAlertSchema.index({ user: 1, createdAt: -1 });
fraudAlertSchema.index({ driver: 1, createdAt: -1 });
fraudAlertSchema.index({ status: 1, severity: 1 });
fraudAlertSchema.index({ riskScore: -1 });
fraudAlertSchema.index({ alertType: 1 });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
