const ChatRoom = require('../models/ChatRoom');
const ChatSupportMessage = require('../models/ChatSupportMessage');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Support Chat Service - Handles logic for admin-user/driver communication
 */

/**
 * Create a new chat room
 */
exports.createChatRoom = async (participants, type = 'support', metadata = {}) => {
    // 1. Validate participants
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
        throw new AppError('A chat room must have at least 2 participants', 400);
    }

    // 2. Validate participant data structure
    participants.forEach(p => {
        if (!p.userId || !p.userType) {
            throw new AppError('Each participant must have a userId and userType', 400);
        }
    });

    // Check if room already exists for these participants (for 1:1 chats)
    if (participants.length === 2) {
        const p1 = participants[0].userId;
        const p2 = participants[1].userId;
        
        const existingRoom = await ChatRoom.findOne({
            'participants.userId': { $all: [p1, p2] },
            type
        });
        
        if (existingRoom) return existingRoom;
    }

    const room = await ChatRoom.create({
        participants,
        type,
        metadata
    });

    return room;
};

/**
 * Get all chat rooms for an admin
 */
exports.getChatRooms = async (filters = {}, options = {}) => {
    const { status, type, userId } = filters;
    const { page = 1, limit = 20 } = options;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query['participants.userId'] = userId;

    const rooms = await ChatRoom.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await ChatRoom.countDocuments(query);

    return {
        rooms,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get room details
 */
exports.getRoomById = async (roomId) => {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new AppError('Invalid room ID', 400);
    }
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new AppError('Chat room not found', 404);
    return room;
};

/**
 * Send a message in a room
 */
exports.sendMessage = async (roomId, sender, content) => {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new AppError('Chat room not found', 404);

    const message = await ChatSupportMessage.create({
        roomId,
        sender,
        content
    });

    // Update room's last message
    room.lastMessage = {
        text: content.text || `Sent a ${content.type}`,
        sender: sender.userId,
        timestamp: new Date()
    };

    // Increment unread counts for other participants
    room.participants.forEach(p => {
        if (p.userId.toString() !== sender.userId.toString()) {
            const currentCount = room.unreadCount.get(p.userId.toString()) || 0;
            room.unreadCount.set(p.userId.toString(), currentCount + 1);
        }
    });

    await room.save();

    return message;
};

/**
 * Get messages for a room
 */
exports.getMessages = async (roomId, options = {}) => {
    const { page = 1, limit = 50 } = options;

    const messages = await ChatSupportMessage.find({ roomId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await ChatSupportMessage.countDocuments({ roomId, isDeleted: false });

    return {
        messages: messages.reverse(),
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Mark messages as read in a room
 */
exports.markAsRead = async (roomId, userId) => {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new AppError('Chat room not found', 404);

    // Reset unread count for this user
    room.unreadCount.set(userId.toString(), 0);
    await room.save();

    // Update individual messages
    await ChatSupportMessage.updateMany(
        { 
            roomId, 
            'readBy.userId': { $ne: userId },
            'sender.userId': { $ne: userId }
        },
        { 
            $push: { readBy: { userId, readAt: new Date() } },
            $set: { status: 'read' }
        }
    );

    return true;
};

/**
 * Close a chat room
 */
exports.closeChatRoom = async (roomId) => {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new AppError('Chat room not found', 404);

    room.status = 'closed';
    await room.save();

    return room;
};
