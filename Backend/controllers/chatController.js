const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const chatService = require('../services/chatService');

/**
 * Send a message
 */
exports.sendMessage = catchAsync(async (req, res, next) => {
    const { bookingId, messageType, content } = req.body;

    if (!bookingId || !content) {
        return next(new AppError('Please provide bookingId and content', 400));
    }

    const message = await chatService.sendMessage(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User',
        {
            messageType: messageType || 'text',
            content
        }
    );

    res.status(201).json({
        status: 'success',
        data: { message }
    });
});

/**
 * Get messages for a booking
 */
exports.getMessages = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await chatService.getMessages(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User',
        parseInt(page),
        parseInt(limit)
    );

    res.status(200).json({
        status: 'success',
        ...result
    });
});

/**
 * Get unread message count
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
    const count = await chatService.getUnreadCount(
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User'
    );

    res.status(200).json({
        status: 'success',
        data: { unreadCount: count }
    });
});

/**
 * Mark messages as read
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;

    const count = await chatService.markAsRead(bookingId, req.user.id);

    res.status(200).json({
        status: 'success',
        data: { markedCount: count }
    });
});

/**
 * Send location
 */
exports.sendLocation = catchAsync(async (req, res, next) => {
    const { bookingId, location } = req.body;

    if (!bookingId || !location || !location.lat || !location.lng) {
        return next(new AppError('Please provide bookingId and location coordinates', 400));
    }

    const message = await chatService.sendLocation(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User',
        location
    );

    res.status(201).json({
        status: 'success',
        data: { message }
    });
});

/**
 * Send quick reply
 */
exports.sendQuickReply = catchAsync(async (req, res, next) => {
    const { bookingId, options } = req.body;

    if (!bookingId || !options || !Array.isArray(options)) {
        return next(new AppError('Please provide bookingId and options array', 400));
    }

    const message = await chatService.sendQuickReply(
        bookingId,
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User',
        options
    );

    res.status(201).json({
        status: 'success',
        data: { message }
    });
});

/**
 * Get active chats
 */
exports.getActiveChats = catchAsync(async (req, res, next) => {
    const chats = await chatService.getActiveChats(
        req.user.id,
        req.user.role === 'driver' ? 'SpareDriver' : 'User'
    );

    res.status(200).json({
        status: 'success',
        results: chats.length,
        data: { chats }
    });
});
