const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
    participants: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            refPath: 'participants.userType',
            required: true
        },
        userType: { 
            type: String, 
            enum: ['User', 'SpareDriver', 'Admin', 'Captain', 'Vendor'], 
            required: true 
        },
        name: String,
        avatar: String,
        lastSeen: Date
    }],
    type: { 
        type: String, 
        enum: ['admin-user', 'admin-driver', 'support'], 
        default: 'support' 
    },
    lastMessage: {
        text: String,
        sender: mongoose.Schema.Types.ObjectId,
        timestamp: Date
    },
    unreadCount: { 
        type: Map, 
        of: Number,
        default: {}
    }, // userId -> count
    status: { 
        type: String, 
        enum: ['active', 'closed', 'archived'], 
        default: 'active' 
    },
    metadata: {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        ticketId: String,
        priority: { 
            type: String, 
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        }
    }
}, { timestamps: true });

// Indexing for performance
ChatRoomSchema.index({ 'participants.userId': 1, status: 1 });
ChatRoomSchema.index({ status: 1 });
ChatRoomSchema.index({ type: 1 });
ChatRoomSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
