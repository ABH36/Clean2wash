const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
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
            enum: ['User', 'SpareDriver', 'Admin']
        },
        name: String,
        phone: String
    },
    receiver: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'receiver.type'
        },
        type: {
            type: String,
            required: true,
            enum: ['User', 'SpareDriver', 'Admin']
        },
        name: String,
        phone: String
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'location', 'voice', 'system', 'quick_reply'],
        default: 'text'
    },
    content: {
        text: String,
        imageUrl: String,
        voiceUrl: String,
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        quickReply: {
            type: String,
            options: [String]
        }
    },
    metadata: {
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: Date,
        deliveredAt: Date,
        isDelivered: {
            type: Boolean,
            default: false
        },
        isSystemGenerated: {
            type: Boolean,
            default: false
        },
        translatedText: String,
        language: String
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    }
}, {
    timestamps: true
});

// Indexes for performance
chatMessageSchema.index({ bookingId: 1, createdAt: -1 });
chatMessageSchema.index({ 'sender.id': 1, createdAt: -1 });
chatMessageSchema.index({ 'receiver.id': 1, 'metadata.isRead': 1 });
chatMessageSchema.index({ status: 1 });

// Mark message as read
chatMessageSchema.methods.markAsRead = function() {
    this.status = 'read';
    this.metadata.isRead = true;
    this.metadata.readAt = new Date();
    return this.save();
};

// Mark message as delivered
chatMessageSchema.methods.markAsDelivered = function() {
    this.status = 'delivered';
    this.metadata.isDelivered = true;
    this.metadata.deliveredAt = new Date();
    return this.save();
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
