const mongoose = require('mongoose');

/**
 * Admin Chat Message Model - Individual messages in admin conversations
 */

const adminChatMessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminChat',
        required: true,
        index: true
    },
    
    sender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'sender.type'
        },
        type: {
            type: String,
            required: true,
            enum: ['Admin', 'User', 'SpareDriver', 'Captain', 'Vendor']
        },
        name: String,
        role: String // For admin: 'super_admin', 'support', 'manager', etc.
    },
    
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'voice', 'video', 'location', 'system', 'quick_reply', 'template'],
        default: 'text'
    },
    
    content: {
        text: String,
        imageUrl: String,
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        voiceUrl: String,
        voiceDuration: Number,
        videoUrl: String,
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        quickReply: {
            type: String,
            options: [String]
        },
        template: {
            name: String,
            variables: mongoose.Schema.Types.Mixed
        }
    },
    
    // Message status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    
    isRead: {
        type: Boolean,
        default: false
    },
    
    readAt: Date,
    deliveredAt: Date,
    
    // Reply reference
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminChatMessage'
    },
    
    // Metadata
    metadata: {
        isSystemGenerated: {
            type: Boolean,
            default: false
        },
        isAutoResponse: {
            type: Boolean,
            default: false
        },
        isInternal: {
            type: Boolean,
            default: false // Internal admin-only messages
        },
        translatedText: String,
        language: String,
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative']
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent']
        }
    },
    
    // Attachments
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'document', 'video', 'audio']
        },
        url: String,
        name: String,
        size: Number,
        mimeType: String
    }],
    
    // Reactions
    reactions: [{
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Editing history
    editedAt: Date,
    isEdited: {
        type: Boolean,
        default: false
    },
    
    // Deletion
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'sender.type'
    }
}, {
    timestamps: true
});

// Indexes for performance
adminChatMessageSchema.index({ conversation: 1, createdAt: -1 });
adminChatMessageSchema.index({ 'sender.id': 1, createdAt: -1 });
adminChatMessageSchema.index({ conversation: 1, isRead: 1 });
adminChatMessageSchema.index({ status: 1 });

// Methods
adminChatMessageSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
};

adminChatMessageSchema.methods.markAsDelivered = function() {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
};

adminChatMessageSchema.methods.softDelete = function(deletedBy) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

adminChatMessageSchema.methods.edit = function(newText) {
    this.content.text = newText;
    this.isEdited = true;
    this.editedAt = new Date();
    return this.save();
};

adminChatMessageSchema.methods.addReaction = function(adminId, emoji) {
    // Remove existing reaction from same admin
    this.reactions = this.reactions.filter(r => r.admin.toString() !== adminId.toString());
    
    // Add new reaction
    this.reactions.push({
        admin: adminId,
        emoji,
        createdAt: new Date()
    });
    
    return this.save();
};

module.exports = mongoose.model('AdminChatMessage', adminChatMessageSchema);
