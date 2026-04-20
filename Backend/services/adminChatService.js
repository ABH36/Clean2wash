const AdminChat = require('../models/AdminChat');
const AdminChatMessage = require('../models/AdminChatMessage');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const socketService = require('../socketService');

/**
 * Admin Chat Service - Handle admin-user and admin-driver communication
 */

/**
 * Create or get existing conversation
 */
const createOrGetConversation = async (adminId, participantId, participantType, conversationData = {}) => {
    // Check if conversation already exists
    let conversation = await AdminChat.findOne({
        admin: adminId,
        'participant.id': participantId,
        'participant.type': participantType,
        status: { $in: ['active', 'pending'] }
    });

    if (conversation) {
        return conversation;
    }

    // Get participant details
    let participant;
    if (participantType === 'User') {
        participant = await User.findById(participantId);
    } else if (participantType === 'SpareDriver') {
        participant = await SpareDriver.findById(participantId);
    }

    if (!participant) {
        throw new Error('Participant not found');
    }

    // Create new conversation
    conversation = await AdminChat.create({
        admin: adminId,
        participant: {
            id: participantId,
            type: participantType,
            name: participant.name,
            phone: participant.phone,
            email: participant.email
        },
        conversationType: conversationData.conversationType || 'support',
        subject: conversationData.subject || 'Support Request',
        priority: conversationData.priority || 'normal',
        relatedBooking: conversationData.relatedBooking,
        relatedTicket: conversationData.relatedTicket,
        tags: conversationData.tags || []
    });

    // Send notification to participant
    await Notification.create({
        [participantType === 'User' ? 'consumer' : 'spareDriver']: participantId,
        type: 'system',
        title: 'Admin Support',
        message: 'An admin has started a conversation with you',
        priority: 'normal',
        data: {
            conversationId: conversation._id.toString(),
            adminId: adminId.toString()
        }
    });

    return conversation;
};

/**
 * Send message in admin conversation
 */
const sendMessage = async (conversationId, senderId, senderType, messageData) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // Get sender details
    let senderName, senderRole;
    if (senderType === 'Admin') {
        const admin = await Admin.findById(senderId);
        senderName = admin.name;
        senderRole = admin.role;
    } else {
        const participant = senderType === 'User' 
            ? await User.findById(senderId)
            : await SpareDriver.findById(senderId);
        senderName = participant.name;
    }

    // Create message
    const message = await AdminChatMessage.create({
        conversation: conversationId,
        sender: {
            id: senderId,
            type: senderType,
            name: senderName,
            role: senderRole
        },
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        replyTo: messageData.replyTo,
        metadata: {
            isSystemGenerated: messageData.isSystemGenerated || false,
            isAutoResponse: messageData.isAutoResponse || false,
            isInternal: messageData.isInternal || false,
            language: messageData.language || 'en',
            priority: messageData.priority
        },
        attachments: messageData.attachments || []
    });

    // Mark as delivered
    await message.markAsDelivered();

    // Update conversation
    await conversation.updateLastMessage(
        messageData.content.text || 'Sent a message',
        senderType === 'Admin' ? 'admin' : 'participant'
    );

    // Increment unread count
    if (senderType === 'Admin') {
        await conversation.incrementUnreadParticipant();
    } else {
        await conversation.incrementUnreadAdmin();
    }

    // Send real-time notification via socket
    const socket = socketService.getIO();
    if (socket) {
        // Send to conversation room
        socket.to(`admin_chat_${conversationId}`).emit('admin_chat_message', {
            conversationId,
            message: message.toObject()
        });

        // Send to participant's room
        if (senderType === 'Admin') {
            const participantRoom = `${conversation.participant.type.toLowerCase()}_${conversation.participant.id}`;
            socket.to(participantRoom).emit('admin_chat_message', {
                conversationId,
                message: message.toObject()
            });
        }

        // Send to admin's room
        if (senderType !== 'Admin') {
            socket.to(`admin_${conversation.admin}`).emit('admin_chat_message', {
                conversationId,
                message: message.toObject()
            });
        }
    }

    // Send push notification
    if (senderType === 'Admin') {
        await Notification.create({
            [conversation.participant.type === 'User' ? 'consumer' : 'spareDriver']: conversation.participant.id,
            type: 'system',
            title: 'New message from Admin',
            message: messageData.content.text || 'You have a new message',
            priority: messageData.priority || 'normal',
            data: {
                conversationId: conversationId.toString(),
                messageId: message._id.toString()
            }
        });
    } else {
        // Notify admin
        await Notification.create({
            isAdmin: true,
            type: 'system',
            title: `New message from ${senderName}`,
            message: messageData.content.text || 'You have a new message',
            priority: 'normal',
            data: {
                conversationId: conversationId.toString(),
                messageId: message._id.toString(),
                participantType: conversation.participant.type,
                participantId: conversation.participant.id.toString()
            }
        });
    }

    return message;
};

/**
 * Get conversation messages
 */
const getMessages = async (conversationId, userId, userType, page = 1, limit = 50) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // Verify access
    const hasAccess = (
        (userType === 'Admin' && conversation.admin.toString() === userId.toString()) ||
        (userType === conversation.participant.type && conversation.participant.id.toString() === userId.toString())
    );

    if (!hasAccess) {
        throw new Error('Access denied to this conversation');
    }

    const skip = (page - 1) * limit;

    const messages = await AdminChatMessage.find({ 
        conversation: conversationId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('replyTo', 'content.text sender')
        .lean();

    const total = await AdminChatMessage.countDocuments({ 
        conversation: conversationId,
        isDeleted: false
    });

    // Mark messages as read
    if (userType === 'Admin') {
        await AdminChatMessage.updateMany(
            {
                conversation: conversationId,
                'sender.type': { $ne: 'Admin' },
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    status: 'read',
                    readAt: new Date()
                }
            }
        );
        await conversation.resetUnreadAdmin();
    } else {
        await AdminChatMessage.updateMany(
            {
                conversation: conversationId,
                'sender.type': 'Admin',
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    status: 'read',
                    readAt: new Date()
                }
            }
        );
        await conversation.resetUnreadParticipant();
    }

    return {
        messages: messages.reverse(),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
        conversation: conversation.toObject()
    };
};

/**
 * Get admin conversations
 */
const getAdminConversations = async (adminId, filters = {}) => {
    const query = { admin: adminId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.conversationType) query.conversationType = filters.conversationType;
    if (filters.participantType) query['participant.type'] = filters.participantType;

    const conversations = await AdminChat.find(query)
        .sort({ lastActivityAt: -1 })
        .limit(filters.limit || 50)
        .lean();

    return conversations;
};

/**
 * Get participant conversations
 */
const getParticipantConversations = async (participantId, participantType) => {
    const conversations = await AdminChat.find({
        'participant.id': participantId,
        'participant.type': participantType,
        status: { $in: ['active', 'pending', 'resolved'] }
    })
        .sort({ lastActivityAt: -1 })
        .populate('admin', 'name email role')
        .lean();

    return conversations;
};

/**
 * Resolve conversation
 */
const resolveConversation = async (conversationId, adminId, resolution) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    await conversation.markAsResolved();

    // Send system message
    await sendMessage(conversationId, adminId, 'Admin', {
        messageType: 'system',
        content: {
            text: resolution || 'This conversation has been resolved.'
        },
        isSystemGenerated: true
    });

    return conversation;
};

/**
 * Close conversation
 */
const closeConversation = async (conversationId, adminId) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    await conversation.markAsClosed();

    return conversation;
};

/**
 * Escalate conversation
 */
const escalateConversation = async (conversationId, adminId, reason) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    await conversation.escalate();

    // Add internal note
    await conversation.addInternalNote(adminId, `Escalated: ${reason}`);

    // Send system message
    await sendMessage(conversationId, adminId, 'Admin', {
        messageType: 'system',
        content: {
            text: 'This conversation has been escalated to higher priority.'
        },
        isSystemGenerated: true
    });

    return conversation;
};

/**
 * Add internal note
 */
const addInternalNote = async (conversationId, adminId, note) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    await conversation.addInternalNote(adminId, note);

    return conversation;
};

/**
 * Assign conversation to admin
 */
const assignConversation = async (conversationId, assignToAdminId, assignedByAdminId) => {
    const conversation = await AdminChat.findById(conversationId);
    
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    conversation.assignedTo = assignToAdminId;
    await conversation.save();

    // Add internal note
    const assignedAdmin = await Admin.findById(assignToAdminId);
    await conversation.addInternalNote(
        assignedByAdminId,
        `Assigned to ${assignedAdmin.name}`
    );

    return conversation;
};

/**
 * Get conversation statistics
 */
const getConversationStats = async (adminId, dateRange = {}) => {
    const query = { admin: adminId };

    if (dateRange.start && dateRange.end) {
        query.createdAt = {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end)
        };
    }

    const stats = await AdminChat.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                resolved: {
                    $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                },
                closed: {
                    $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
                },
                avgResponseTime: { $avg: '$metadata.responseTime' },
                avgResolutionTime: { $avg: '$metadata.resolutionTime' }
            }
        }
    ]);

    return stats[0] || {
        total: 0,
        active: 0,
        resolved: 0,
        closed: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0
    };
};

module.exports = {
    createOrGetConversation,
    sendMessage,
    getMessages,
    getAdminConversations,
    getParticipantConversations,
    resolveConversation,
    closeConversation,
    escalateConversation,
    addInternalNote,
    assignConversation,
    getConversationStats
};
