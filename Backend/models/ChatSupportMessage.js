const mongoose = require('mongoose');

const ChatSupportMessageSchema = new mongoose.Schema({
    roomId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ChatRoom', 
        required: true,
        index: true
    },
    sender: {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            refPath: 'sender.userType',
            required: true
        },
        userType: { 
            type: String, 
            enum: ['User', 'SpareDriver', 'Admin', 'Captain', 'Vendor'], 
            required: true 
        },
        name: String,
        avatar: String
    },
    content: {
        type: { 
            type: String, 
            enum: ['text', 'image', 'file', 'system'], 
            default: 'text' 
        },
        text: String,
        fileUrl: String,
        fileName: String,
        fileSize: Number
    },
    status: { 
        type: String, 
        enum: ['sent', 'delivered', 'read'], 
        default: 'sent' 
    },
    readBy: [{ 
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }, 
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Indexing for performance
ChatSupportMessageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSupportMessage', ChatSupportMessageSchema);
