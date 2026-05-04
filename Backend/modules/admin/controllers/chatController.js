const supportChatService = require('../../../services/supportChatService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const cloudinaryService = require('../../../services/cloudinaryService');

/**
 * Admin Chat Controller - Handles endpoints for the new Chat Support System
 */

/**
 * Create chat room
 * POST /api/admin/chat/rooms
 */
exports.createRoom = catchAsync(async (req, res, next) => {
    const { participants, type, metadata } = req.body;

    if (!participants || !Array.isArray(participants)) {
        return next(new AppError('Please provide participants array', 400));
    }

    const room = await supportChatService.createChatRoom(participants, type, metadata);

    res.status(201).json({
        status: 'success',
        data: { room }
    });
});

/**
 * Get all chat rooms
 * GET /api/admin/chat/rooms
 */
exports.getRooms = catchAsync(async (req, res, next) => {
    const { status, type, userId, page, limit } = req.query;

    const result = await supportChatService.getChatRooms(
        { status, type, userId },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        status: 'success',
        ...result
    });
});

/**
 * Get room details
 * GET /api/admin/chat/rooms/:roomId
 */
exports.getRoom = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;

    const room = await supportChatService.getRoomById(roomId);

    res.status(200).json({
        status: 'success',
        data: { room }
    });
});

/**
 * Send message
 * POST /api/admin/chat/rooms/:roomId/messages
 */
exports.sendMessage = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) {
        return next(new AppError('Please provide message content', 400));
    }

    // Sender is the logged in admin
    const sender = {
        userId: req.admin._id || req.admin.id,
        userType: 'Admin',
        name: req.admin.name,
        avatar: req.admin.avatar
    };

    const message = await supportChatService.sendMessage(roomId, sender, content);

    // Emit socket event
    const socketService = require('../../../services/enhancedSocketService');
    const io = socketService.getIO();
    if (io) {
        io.to(roomId).emit('new_message', {
            message,
            roomId
        });
    }

    res.status(201).json({
        status: 'success',
        data: { message }
    });
});

/**
 * Get messages
 * GET /api/admin/chat/rooms/:roomId/messages
 */
exports.getMessages = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;
    const { page, limit } = req.query;

    const result = await supportChatService.getMessages(
        roomId,
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        status: 'success',
        ...result
    });
});

/**
 * Mark as read
 * PATCH /api/admin/chat/rooms/:roomId/read
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;
    const userId = req.admin._id || req.admin.id;

    await supportChatService.markAsRead(roomId, userId);

    res.status(200).json({
        status: 'success',
        message: 'Messages marked as read'
    });
});

/**
 * Close chat
 * PATCH /api/admin/chat/rooms/:roomId/close
 */
exports.closeChat = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;

    const room = await supportChatService.closeChatRoom(roomId);

    res.status(200).json({
        status: 'success',
        data: { room }
    });
});

/**
 * Upload file
 * POST /api/admin/chat/upload
 */
exports.uploadFile = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a file', 400));
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadToCloudinary(
        req.file.buffer,
        'chat-attachments'
    );

    res.status(200).json({
        status: 'success',
        data: {
            fileUrl: result.secure_url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            publicId: result.public_id
        }
    });
});
