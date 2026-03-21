const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    resource: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    resourceId: {
        type: String,
        required: true
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    metadata: {
        ip: String,
        userAgent: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Index for high-performance searching
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, resource: 1 });
auditLogSchema.index({ resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
