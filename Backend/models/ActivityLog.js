const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    resource: {
        type: String,
        required: true,
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS',
        index: true
    },
    errorMessage: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function(data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Failed to log activity:', error);
        return null;
    }
};

// Static method to get recent activities
activityLogSchema.statics.getRecent = function(limit = 10) {
    return this.find()
        .populate('admin', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to get activities by admin
activityLogSchema.statics.getByAdmin = function(adminId, limit = 50) {
    return this.find({ admin: adminId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to get failed activities
activityLogSchema.statics.getFailed = function(limit = 20) {
    return this.find({ status: 'FAILED' })
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to get activity stats
activityLogSchema.statics.getStats = async function(startDate, endDate) {
    const filter = {};
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [total, successful, failed] = await Promise.all([
        this.countDocuments(filter),
        this.countDocuments({ ...filter, status: 'SUCCESS' }),
        this.countDocuments({ ...filter, status: 'FAILED' })
    ]);

    return {
        total,
        successful,
        failed,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0
    };
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
