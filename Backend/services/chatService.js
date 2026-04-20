const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const { sendNotification } = require('../utils/notificationService');
const socketService = require('../services/enhancedSocketService');

/**
 * Chat Service - Production-grade messaging system
 */

/**
 * Send a chat message
 */
const sendMessage = async (bookingId, senderId, senderType, messageData) => {
    // Validate booking
    const booking = await Booking.findById(bookingId)
        .populate('consumer')
        .populate('provider.id');

    if (!booking) {
        throw new Error('Booking not found');
    }

    // Determine receiver
    let receiverId, receiverType, receiverName, receiverPhone;

    if (senderType === 'User') {
        // User is sending to driver
        receiverId = booking.provider?.id?._id || booking.provider?.id;
        receiverType = 'SpareDriver';
        receiverName = booking.provider?.id?.name;
        receiverPhone = booking.provider?.id?.phone;
    } else if (senderType === 'SpareDriver') {
        // Driver is sending to user
        receiverId = booking.consumer._id;
        receiverType = 'User';
        receiverName = booking.consumer.name;
        receiverPhone = booking.consumer.phone;
    }

    if (!receiverId) {
        throw new Error('Receiver not found for this booking');
    }

    // Get sender details
    let senderName, senderPhone;
    if (senderType === 'User') {
        const user = await User.findById(senderId);
        senderName = user.name;
        senderPhone = user.phone;
    } else if (senderType === 'SpareDriver') {
        const driver = await SpareDriver.findById(senderId);
        senderName = driver.name;
        senderPhone = driver.phone;
    }

    // Create message
    const message = await ChatMessage.create({
        bookingId,
        sender: {
            id: senderId,
            type: senderType,
            name: senderName,
            phone: senderPhone
        },
        receiver: {
            id: receiverId,
            type: receiverType,
            name: receiverName,
            phone: receiverPhone
        },
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        metadata: {
            isSystemGenerated: messageData.isSystemGenerated || false,
            language: messageData.language || 'en'
        }
    });

    // Mark as delivered immediately (optimistic)
    await message.markAsDelivered();

    // Send real-time notification via socket
    const socket = socketService.getIO();
    if (socket) {
        socket.to(`booking_${bookingId}`).emit('new_message', {
            bookingId,
            message: message.toObject()
        });

        // Send to receiver's personal room
        socket.to(`${receiverType.toLowerCase()}_${receiverId}`).emit('new_message', {
            bookingId,
            message: message.toObject()
        });
    }

    // Send push notification
    await sendNotification(receiverId, {
        title: `New message from ${senderName}`,
        message: messageData.content.text || 'Sent a message',
        type: 'chat',
        priority: 'normal',
        data: {
            bookingId: bookingId.toString(),
            messageId: message._id.toString(),
            senderType
        }
    });

    return message;
};

/**
 * Send system message
 */
const sendSystemMessage = async (bookingId, content, receiverId = null, receiverType = null) => {
    const booking = await Booking.findById(bookingId)
        .populate('consumer')
        .populate('provider.id');

    if (!booking) {
        throw new Error('Booking not found');
    }

    // If no receiver specified, send to both user and driver
    const receivers = [];

    if (receiverId && receiverType) {
        receivers.push({ id: receiverId, type: receiverType });
    } else {
        // Send to both
        receivers.push({
            id: booking.consumer._id,
            type: 'User',
            name: booking.consumer.name,
            phone: booking.consumer.phone
        });

        if (booking.provider?.id) {
            receivers.push({
                id: booking.provider.id._id,
                type: 'SpareDriver',
                name: booking.provider.id.name,
                phone: booking.provider.id.phone
            });
        }
    }

    const messages = [];

    for (const receiver of receivers) {
        const message = await ChatMessage.create({
            bookingId,
            sender: {
                id: booking.consumer._id, // System uses consumer ID as placeholder
                type: 'Admin',
                name: 'System',
                phone: 'system'
            },
            receiver,
            messageType: 'system',
            content: {
                text: content
            },
            metadata: {
                isSystemGenerated: true
            }
        });

        await message.markAsDelivered();

        // Send real-time notification
        const socket = socketService.getIO();
        if (socket) {
            socket.to(`booking_${bookingId}`).emit('new_message', {
                bookingId,
                message: message.toObject()
            });

            socket.to(`${receiver.type.toLowerCase()}_${receiver.id}`).emit('new_message', {
                bookingId,
                message: message.toObject()
            });
        }

        messages.push(message);
    }

    return messages;
};

/**
 * Get chat messages for a booking
 */
const getMessages = async (bookingId, userId, userType, page = 1, limit = 50) => {
    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new Error('Booking not found');
    }

    const hasAccess = (
        (userType === 'User' && booking.consumer.toString() === userId.toString()) ||
        (userType === 'SpareDriver' && booking.provider?.id?.toString() === userId.toString())
    );

    if (!hasAccess) {
        throw new Error('Access denied to this chat');
    }

    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ bookingId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ChatMessage.countDocuments({ bookingId });

    // Mark unread messages as read
    await ChatMessage.updateMany(
        {
            bookingId,
            'receiver.id': userId,
            'metadata.isRead': false
        },
        {
            $set: {
                'metadata.isRead': true,
                'metadata.readAt': new Date(),
                status: 'read'
            }
        }
    );

    return {
        messages: messages.reverse(), // Return in chronological order
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
    };
};

/**
 * Get unread message count
 */
const getUnreadCount = async (userId, userType) => {
    return await ChatMessage.countDocuments({
        'receiver.id': userId,
        'receiver.type': userType,
        'metadata.isRead': false
    });
};

/**
 * Mark messages as read
 */
const markAsRead = async (bookingId, userId) => {
    const result = await ChatMessage.updateMany(
        {
            bookingId,
            'receiver.id': userId,
            'metadata.isRead': false
        },
        {
            $set: {
                'metadata.isRead': true,
                'metadata.readAt': new Date(),
                status: 'read'
            }
        }
    );

    // Notify sender via socket
    const socket = socketService.getIO();
    if (socket) {
        socket.to(`booking_${bookingId}`).emit('messages_read', {
            bookingId,
            readBy: userId,
            count: result.modifiedCount
        });
    }

    return result.modifiedCount;
};

/**
 * Send quick reply options
 */
const sendQuickReply = async (bookingId, senderId, senderType, options) => {
    return await sendMessage(bookingId, senderId, senderType, {
        messageType: 'quick_reply',
        content: {
            text: 'Please select an option:',
            quickReply: {
                type: 'options',
                options
            }
        }
    });
};

/**
 * Send location
 */
const sendLocation = async (bookingId, senderId, senderType, location) => {
    return await sendMessage(bookingId, senderId, senderType, {
        messageType: 'location',
        content: {
            location: {
                lat: location.lat,
                lng: location.lng,
                address: location.address || 'Current Location'
            }
        }
    });
};

/**
 * Get active chats for user
 */
const getActiveChats = async (userId, userType) => {
    const messages = await ChatMessage.aggregate([
        {
            $match: {
                $or: [
                    { 'sender.id': userId, 'sender.type': userType },
                    { 'receiver.id': userId, 'receiver.type': userType }
                ]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: '$bookingId',
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$receiver.id', userId] },
                                    { $eq: ['$metadata.isRead', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $sort: { 'lastMessage.createdAt': -1 }
        },
        {
            $limit: 20
        }
    ]);

    // Populate booking details
    const bookingIds = messages.map(m => m._id);
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
        .populate('consumer', 'name phone')
        .populate('provider.id', 'name phone')
        .lean();

    const bookingMap = {};
    bookings.forEach(b => {
        bookingMap[b._id.toString()] = b;
    });

    return messages.map(m => ({
        bookingId: m._id,
        booking: bookingMap[m._id.toString()],
        lastMessage: m.lastMessage,
        unreadCount: m.unreadCount
    }));
};

module.exports = {
    sendMessage,
    sendSystemMessage,
    getMessages,
    getUnreadCount,
    markAsRead,
    sendQuickReply,
    sendLocation,
    getActiveChats
};
