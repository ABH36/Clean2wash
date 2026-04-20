const mongoose = require('mongoose');

/**
 * Admin Chat Model - For direct admin-user and admin-driver communication
 * Separate from booking-based chat for support and general communication
 */

const adminChatSchema = new mongoose.Schema({
    // Conversation participants
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true
    },
    participant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'participant.type'
        },
        type: {
            type: String,
            required: true,
            enum: ['User', 'SpareDriver', 'Captain', 'Vendor'],
            index: true
        },
        name: String,
        phone: String,
        email: String
    },
    
    // Conversation metadata
    conversationType: {
        type: String,
        enum: ['support', 'general', 'emergency', 'complaint', 'inquiry', 'verification'],
        default: 'support',
        index: true
    },
    
    subject: {
        type: String,
        trim: true,
        maxlength: 200
    },
    
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent', 'emergency'],
        default: 'normal',
        index: true
    },
    
    status: {
        type: String,
        enum: ['active', 'resolved', 'closed', 'pending', 'escalated'],
        default: 'active',
        index: true
    },
    
    // Related entities
    relatedBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    
    relatedTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportTicket'
    },
    
    // Last message info for quick access
    lastMessage: {
        text: String,
        sender: {
            type: String,
            enum: ['admin', 'participant']
        },
        timestamp: Date
    },
    
    // Unread counts
    unreadByAdmin: {
        type: Number,
        default: 0
    },
    
    unreadByParticipant: {
        type: Number,
        default: 0
    },
    
    // Tags for categorization
    tags: [{
        type: String,
        trim: true
    }],
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    
    // Timestamps
    lastActivityAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    resolvedAt: Date,
    closedAt: Date,
    
    // Notes (internal admin notes)
    internalNotes: [{
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        note: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Metadata
    metadata: {
        isEmergency: {
            type: Boolean,
            default: false
        },
        autoResponded: {
            type: Boolean,
            default: false
        },
        escalationLevel: {
            type: Number,
            default: 0
        },
        responseTime: Number, // in seconds
        resolutionTime: Number, // in seconds
        satisfactionRating: {
            type: Number,
            min: 1,
            max: 5
        },
        satisfactionFeedback: String
    }
}, {
    timestamps: true
});

// Indexes for performance
adminChatSchema.index({ admin: 1, status: 1, lastActivityAt: -1 });
adminChatSchema.index({ 'participant.id': 1, status: 1, lastActivityAt: -1 });
adminChatSchema.index({ conversationType: 1, priority: 1 });
adminChatSchema.index({ status: 1, priority: 1, lastActivityAt: -1 });
adminChatSchema.index({ assignedTo: 1, status: 1 });

// Methods
adminChatSchema.methods.markAsResolved = function() {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.metadata.resolutionTime = Math.floor((this.resolvedAt - this.createdAt) / 1000);
    return this.save();
};

adminChatSchema.methods.markAsClosed = function() {
    this.status = 'closed';
    this.closedAt = new Date();
    return this.save();
};

adminChatSchema.methods.escalate = function() {
    this.priority = 'urgent';
    this.metadata.escalationLevel += 1;
    return this.save();
};

adminChatSchema.methods.addInternalNote = function(adminId, note) {
    this.internalNotes.push({
        admin: adminId,
        note,
        createdAt: new Date()
    });
    return this.save();
};

adminChatSchema.methods.updateLastMessage = function(text, sender) {
    this.lastMessage = {
        text,
        sender,
        timestamp: new Date()
    };
    this.lastActivityAt = new Date();
    return this.save();
};

adminChatSchema.methods.incrementUnreadAdmin = function() {
    this.unreadByAdmin += 1;
    return this.save();
};

adminChatSchema.methods.incrementUnreadParticipant = function() {
    this.unreadByParticipant += 1;
    return this.save();
};

adminChatSchema.methods.resetUnreadAdmin = function() {
    this.unreadByAdmin = 0;
    return this.save();
};

adminChatSchema.methods.resetUnreadParticipant = function() {
    this.unreadByParticipant = 0;
    return this.save();
};

module.exports = mongoose.model('AdminChat', adminChatSchema);
