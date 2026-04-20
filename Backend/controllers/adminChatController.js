const adminChatService = require('../services/adminChatService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Admin Chat Controller - Handle admin communication endpoints
 */

/**
 * Create or get conversation
 * POST /api/admin/chat/conversations
 */
exports.createConversation = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { participantId, participantType, conversationType, subject, priority, relatedBooking, tags } = req.body;

    const conversation = await adminChatService.createOrGetConversation(
        adminId,
        participantId,
        participantType,
        {
            conversationType,
            subject,
            priority,
            relatedBooking,
            tags
        }
    );

    res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: { conversation }
    });
});

/**
 * Get all admin conversations
 * GET /api/admin/chat/conversations
 */
exports.getConversations = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { status, priority, conversationType, participantType, limit } = req.query;

    const conversations = await adminChatService.getAdminConversations(adminId, {
        status,
        priority,
        conversationType,
        participantType,
        limit: parseInt(limit) || 50
    });

    res.status(200).json({
        success: true,
        data: {
            conversations,
            total: conversations.length
        }
    });
});

/**
 * Get conversation messages
 * GET /api/admin/chat/conversations/:id/messages
 */
exports.getMessages = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await adminChatService.getMessages(
        id,
        adminId,
        'Admin',
        parseInt(page) || 1,
        parseInt(limit) || 50
    );

    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * Send message in conversation
 * POST /api/admin/chat/conversations/:id/messages
 */
exports.sendMessage = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const messageData = req.body;

    const message = await adminChatService.sendMessage(
        id,
        adminId,
        'Admin',
        messageData
    );

    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
    });
});

/**
 * Resolve conversation
 * PATCH /api/admin/chat/conversations/:id/resolve
 */
exports.resolveConversation = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { resolution } = req.body;

    const conversation = await adminChatService.resolveConversation(id, adminId, resolution);

    res.status(200).json({
        success: true,
        message: 'Conversation resolved successfully',
        data: { conversation }
    });
});

/**
 * Close conversation
 * PATCH /api/admin/chat/conversations/:id/close
 */
exports.closeConversation = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;

    const conversation = await adminChatService.closeConversation(id, adminId);

    res.status(200).json({
        success: true,
        message: 'Conversation closed successfully',
        data: { conversation }
    });
});

/**
 * Escalate conversation
 * PATCH /api/admin/chat/conversations/:id/escalate
 */
exports.escalateConversation = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { reason } = req.body;

    const conversation = await adminChatService.escalateConversation(id, adminId, reason);

    res.status(200).json({
        success: true,
        message: 'Conversation escalated successfully',
        data: { conversation }
    });
});

/**
 * Add internal note
 * POST /api/admin/chat/conversations/:id/notes
 */
exports.addInternalNote = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { note } = req.body;

    const conversation = await adminChatService.addInternalNote(id, adminId, note);

    res.status(201).json({
        success: true,
        message: 'Internal note added successfully',
        data: { conversation }
    });
});

/**
 * Assign conversation to admin
 * PATCH /api/admin/chat/conversations/:id/assign
 */
exports.assignConversation = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;
    const { assignToAdminId } = req.body;

    const conversation = await adminChatService.assignConversation(id, assignToAdminId, adminId);

    res.status(200).json({
        success: true,
        message: 'Conversation assigned successfully',
        data: { conversation }
    });
});

/**
 * Get conversation statistics
 * GET /api/admin/chat/stats
 */
exports.getStats = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { startDate, endDate } = req.query;

    const stats = await adminChatService.getConversationStats(adminId, {
        start: startDate,
        end: endDate
    });

    res.status(200).json({
        success: true,
        data: { stats }
    });
});

// ============================================
// USER/DRIVER ENDPOINTS
// ============================================

/**
 * Get user/driver conversations
 * GET /api/user/admin-chat or /api/sparedrivers/admin-chat
 */
exports.getParticipantConversations = catchAsync(async (req, res) => {
    const participantId = req.user?._id || req.spareDriver?._id;
    const participantType = req.user ? 'User' : 'SpareDriver';

    const conversations = await adminChatService.getParticipantConversations(
        participantId,
        participantType
    );

    res.status(200).json({
        success: true,
        data: {
            conversations,
            total: conversations.length
        }
    });
});

/**
 * Start new conversation with admin
 * POST /api/user/admin-chat/start or /api/sparedrivers/admin-chat/start
 */
exports.startConversation = catchAsync(async (req, res) => {
    const participantId = req.user?._id || req.spareDriver?._id;
    const participantType = req.user ? 'User' : 'SpareDriver';
    const { subject, message, conversationType, priority, relatedBooking } = req.body;

    // Get default admin or support admin
    const Admin = require('../models/Admin');
    const supportAdmin = await Admin.findOne({ role: 'support' }) || await Admin.findOne();

    if (!supportAdmin) {
        return res.status(500).json({
            success: false,
            message: 'No admin available for support'
        });
    }

    // Create conversation
    const conversation = await adminChatService.createOrGetConversation(
        supportAdmin._id,
        participantId,
        participantType,
        {
            conversationType: conversationType || 'support',
            subject: subject || 'Support Request',
            priority: priority || 'normal',
            relatedBooking
        }
    );

    // Send initial message if provided
    if (message) {
        await adminChatService.sendMessage(
            conversation._id,
            participantId,
            participantType,
            {
                messageType: 'text',
                content: { text: message }
            }
        );
    }

    res.status(201).json({
        success: true,
        message: 'Conversation started successfully',
        data: { conversation }
    });
});

/**
 * Send message as user/driver
 * POST /api/user/admin-chat/:id/messages or /api/sparedrivers/admin-chat/:id/messages
 */
exports.sendParticipantMessage = catchAsync(async (req, res) => {
    const participantId = req.user?._id || req.spareDriver?._id;
    const participantType = req.user ? 'User' : 'SpareDriver';
    const { id } = req.params;
    const messageData = req.body;

    const message = await adminChatService.sendMessage(
        id,
        participantId,
        participantType,
        messageData
    );

    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
    });
});

/**
 * Get conversation messages as user/driver
 * GET /api/user/admin-chat/:id/messages or /api/sparedrivers/admin-chat/:id/messages
 */
exports.getParticipantMessages = catchAsync(async (req, res) => {
    const participantId = req.user?._id || req.spareDriver?._id;
    const participantType = req.user ? 'User' : 'SpareDriver';
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await adminChatService.getMessages(
        id,
        participantId,
        participantType,
        parseInt(page) || 1,
        parseInt(limit) || 50
    );

    res.status(200).json({
        success: true,
        data: result
    });
});
