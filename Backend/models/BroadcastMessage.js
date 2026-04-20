const mongoose = require('mongoose');

/**
 * Broadcast Message Model - For sending messages to multiple users/drivers
 */

const broadcastMessageSchema = new mongoose.Schema({
    // Creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    
    // Broadcast details
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    
    // Target audience
    targetType: {
        type: String,
        required: true,
        enum: ['all', 'users', 'drivers', 'captains', 'vendors', 'custom'],
        index: true
    },
    
    // Custom targeting
    targetFilters: {
        userType: {
            type: String,
            enum: ['User', 'SpareDriver', 'Captain', 'Vendor']
        },
        status: [String], // e.g., ['active', 'verified']
        city: [String],
        registeredAfter: Date,
        registeredBefore: Date,
        hasCompletedBookings: Boolean,
        minBookings: Number,
        maxBookings: Number,
        isPremium: Boolean,
        tags: [String]
    },
    
    // Specific recipients (for custom broadcasts)
    specificRecipients: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'specificRecipients.type'
        },
        type: {
            type: String,
            enum: ['User', 'SpareDriver', 'Captain', 'Vendor']
        }
    }],
    
    // Message type and priority
    messageType: {
        type: String,
        enum: ['announcement', 'promotion', 'alert', 'update', 'emergency', 'maintenance'],
        default: 'announcement'
    },
    
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    // Delivery channels
    channels: {
        inApp: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        email: {
            type: Boolean,
            default: false
        }
    },
    
    // Rich content
    content: {
        imageUrl: String,
        actionUrl: String,
        actionText: String,
        buttons: [{
            text: String,
            url: String,
            action: String
        }]
    },
    
    // Scheduling
    scheduledFor: Date,
    
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
        default: 'draft',
        index: true
    },
    
    // Delivery stats
    stats: {
        totalRecipients: {
            type: Number,
            default: 0
        },
        sent: {
            type: Number,
            default: 0
        },
        delivered: {
            type: Number,
            default: 0
        },
        read: {
            type: Number,
            default: 0
        },
        failed: {
            type: Number,
            default: 0
        },
        clicked: {
            type: Number,
            default: 0
        }
    },
    
    // Delivery tracking
    deliveryLog: [{
        recipient: {
            id: mongoose.Schema.Types.ObjectId,
            type: String
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed', 'clicked']
        },
        channel: String,
        timestamp: Date,
        error: String
    }],
    
    // Timestamps
    sentAt: Date,
    completedAt: Date,
    
    // Metadata
    metadata: {
        estimatedReach: Number,
        actualReach: Number,
        deliveryRate: Number,
        readRate: Number,
        clickRate: Number,
        avgResponseTime: Number,
        tags: [String],
        campaign: String
    },
    
    // Expiry
    expiresAt: Date,
    
    // A/B Testing
    isABTest: {
        type: Boolean,
        default: false
    },
    
    abTestVariant: {
        type: String,
        enum: ['A', 'B']
    }
}, {
    timestamps: true
});

// Indexes
broadcastMessageSchema.index({ createdBy: 1, createdAt: -1 });
broadcastMessageSchema.index({ status: 1, scheduledFor: 1 });
broadcastMessageSchema.index({ targetType: 1, status: 1 });
broadcastMessageSchema.index({ messageType: 1, createdAt: -1 });

// Methods
broadcastMessageSchema.methods.markAsSending = function() {
    this.status = 'sending';
    return this.save();
};

broadcastMessageSchema.methods.markAsSent = function() {
    this.status = 'sent';
    this.sentAt = new Date();
    return this.save();
};

broadcastMessageSchema.methods.markAsCompleted = function() {
    this.status = 'sent';
    this.completedAt = new Date();
    
    // Calculate rates
    if (this.stats.totalRecipients > 0) {
        this.metadata.deliveryRate = (this.stats.delivered / this.stats.totalRecipients) * 100;
        this.metadata.readRate = (this.stats.read / this.stats.totalRecipients) * 100;
        this.metadata.clickRate = (this.stats.clicked / this.stats.totalRecipients) * 100;
    }
    
    return this.save();
};

broadcastMessageSchema.methods.markAsFailed = function() {
    this.status = 'failed';
    return this.save();
};

broadcastMessageSchema.methods.cancel = function() {
    this.status = 'cancelled';
    return this.save();
};

broadcastMessageSchema.methods.updateStats = function(statsUpdate) {
    Object.assign(this.stats, statsUpdate);
    return this.save();
};

broadcastMessageSchema.methods.addDeliveryLog = function(recipient, status, channel, error = null) {
    this.deliveryLog.push({
        recipient,
        status,
        channel,
        timestamp: new Date(),
        error
    });
    
    // Update stats
    if (status === 'sent') this.stats.sent += 1;
    if (status === 'delivered') this.stats.delivered += 1;
    if (status === 'read') this.stats.read += 1;
    if (status === 'failed') this.stats.failed += 1;
    if (status === 'clicked') this.stats.clicked += 1;
    
    return this.save();
};

// Static methods
broadcastMessageSchema.statics.getScheduledMessages = function() {
    return this.find({
        status: 'scheduled',
        scheduledFor: { $lte: new Date() }
    }).sort({ scheduledFor: 1 });
};

broadcastMessageSchema.statics.getRecentBroadcasts = function(adminId, limit = 10) {
    return this.find({ createdBy: adminId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-deliveryLog');
};

module.exports = mongoose.model('BroadcastMessage', broadcastMessageSchema);
