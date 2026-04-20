const broadcastService = require('../services/broadcastService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Broadcast Controller - Handle broadcast messaging endpoints
 */

/**
 * Create broadcast
 * POST /api/admin/broadcast
 */
exports.createBroadcast = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const broadcastData = req.body;

    const broadcast = await broadcastService.createBroadcast(adminId, broadcastData);

    res.status(201).json({
        success: true,
        message: 'Broadcast created successfully',
        data: { broadcast }
    });
});

/**
 * Get all broadcasts
 * GET /api/admin/broadcast
 */
exports.getBroadcasts = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { status, messageType, targetType, limit } = req.query;

    const broadcasts = await broadcastService.getAdminBroadcasts(adminId, {
        status,
        messageType,
        targetType,
        limit: parseInt(limit) || 50
    });

    res.status(200).json({
        success: true,
        data: {
            broadcasts,
            total: broadcasts.length
        }
    });
});

/**
 * Get broadcast details
 * GET /api/admin/broadcast/:id
 */
exports.getBroadcast = catchAsync(async (req, res) => {
    const { id } = req.params;
    const BroadcastMessage = require('../models/BroadcastMessage');

    const broadcast = await BroadcastMessage.findById(id)
        .populate('createdBy', 'name email role')
        .lean();

    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Broadcast not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { broadcast }
    });
});

/**
 * Send broadcast immediately
 * POST /api/admin/broadcast/:id/send
 */
exports.sendBroadcast = catchAsync(async (req, res) => {
    const { id } = req.params;

    const broadcast = await broadcastService.sendBroadcast(id);

    res.status(200).json({
        success: true,
        message: 'Broadcast sent successfully',
        data: { broadcast }
    });
});

/**
 * Schedule broadcast
 * POST /api/admin/broadcast/:id/schedule
 */
exports.scheduleBroadcast = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
        return res.status(400).json({
            success: false,
            message: 'scheduledFor date is required'
        });
    }

    const broadcast = await broadcastService.scheduleBroadcast(id, scheduledFor);

    res.status(200).json({
        success: true,
        message: 'Broadcast scheduled successfully',
        data: { broadcast }
    });
});

/**
 * Cancel broadcast
 * DELETE /api/admin/broadcast/:id
 */
exports.cancelBroadcast = catchAsync(async (req, res) => {
    const { id } = req.params;

    const broadcast = await broadcastService.cancelBroadcast(id);

    res.status(200).json({
        success: true,
        message: 'Broadcast cancelled successfully',
        data: { broadcast }
    });
});

/**
 * Get broadcast statistics
 * GET /api/admin/broadcast/:id/stats
 */
exports.getBroadcastStats = catchAsync(async (req, res) => {
    const { id } = req.params;

    const stats = await broadcastService.getBroadcastStats(id);

    res.status(200).json({
        success: true,
        data: { stats }
    });
});

/**
 * Get broadcast recipients
 * GET /api/admin/broadcast/:id/recipients
 */
exports.getBroadcastRecipients = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const BroadcastMessage = require('../models/BroadcastMessage');
    const broadcast = await BroadcastMessage.findById(id);

    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Broadcast not found'
        });
    }

    const recipients = await broadcastService.getRecipients(broadcast);

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedRecipients = recipients.slice(skip, skip + parseInt(limit));

    res.status(200).json({
        success: true,
        data: {
            recipients: paginatedRecipients,
            total: recipients.length,
            page: parseInt(page),
            totalPages: Math.ceil(recipients.length / limit)
        }
    });
});

/**
 * Send emergency broadcast
 * POST /api/admin/broadcast/emergency
 */
exports.sendEmergencyBroadcast = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { title, message, targetType } = req.body;

    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: 'Title and message are required'
        });
    }

    const broadcast = await broadcastService.createEmergencyBroadcast(
        adminId,
        title,
        message,
        targetType || 'all'
    );

    res.status(201).json({
        success: true,
        message: 'Emergency broadcast sent successfully',
        data: { broadcast }
    });
});

/**
 * Calculate estimated reach
 * POST /api/admin/broadcast/estimate-reach
 */
exports.estimateReach = catchAsync(async (req, res) => {
    const { targetType, targetFilters, specificRecipients } = req.body;

    const BroadcastMessage = require('../models/BroadcastMessage');
    
    // Create temporary broadcast object for calculation
    const tempBroadcast = new BroadcastMessage({
        targetType,
        targetFilters: targetFilters || {},
        specificRecipients: specificRecipients || []
    });

    const estimatedReach = await broadcastService.calculateEstimatedReach(tempBroadcast);

    res.status(200).json({
        success: true,
        data: {
            estimatedReach,
            targetType,
            filters: targetFilters
        }
    });
});

/**
 * Track broadcast interaction
 * POST /api/user/broadcast/:id/track or /api/sparedrivers/broadcast/:id/track
 */
exports.trackInteraction = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'read' or 'clicked'
    const recipientId = req.user?._id || req.spareDriver?._id;
    const recipientType = req.user ? 'User' : 'SpareDriver';

    await broadcastService.trackBroadcastInteraction(
        id,
        recipientId,
        recipientType,
        action
    );

    res.status(200).json({
        success: true,
        message: 'Interaction tracked successfully'
    });
});

/**
 * Duplicate broadcast
 * POST /api/admin/broadcast/:id/duplicate
 */
exports.duplicateBroadcast = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { id } = req.params;

    const BroadcastMessage = require('../models/BroadcastMessage');
    const originalBroadcast = await BroadcastMessage.findById(id).lean();

    if (!originalBroadcast) {
        return res.status(404).json({
            success: false,
            message: 'Broadcast not found'
        });
    }

    // Create duplicate
    const duplicateData = {
        title: `${originalBroadcast.title} (Copy)`,
        message: originalBroadcast.message,
        targetType: originalBroadcast.targetType,
        targetFilters: originalBroadcast.targetFilters,
        specificRecipients: originalBroadcast.specificRecipients,
        messageType: originalBroadcast.messageType,
        priority: originalBroadcast.priority,
        channels: originalBroadcast.channels,
        content: originalBroadcast.content,
        metadata: {
            tags: originalBroadcast.metadata?.tags || [],
            campaign: originalBroadcast.metadata?.campaign
        }
    };

    const duplicate = await broadcastService.createBroadcast(adminId, duplicateData);

    res.status(201).json({
        success: true,
        message: 'Broadcast duplicated successfully',
        data: { broadcast: duplicate }
    });
});

/**
 * Get broadcast analytics summary
 * GET /api/admin/broadcast/analytics/summary
 */
exports.getAnalyticsSummary = catchAsync(async (req, res) => {
    const adminId = req.admin._id;
    const { startDate, endDate } = req.query;

    const BroadcastMessage = require('../models/BroadcastMessage');
    
    const query = { createdBy: adminId };
    
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const summary = await BroadcastMessage.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalBroadcasts: { $sum: 1 },
                totalRecipients: { $sum: '$stats.totalRecipients' },
                totalSent: { $sum: '$stats.sent' },
                totalDelivered: { $sum: '$stats.delivered' },
                totalRead: { $sum: '$stats.read' },
                totalClicked: { $sum: '$stats.clicked' },
                totalFailed: { $sum: '$stats.failed' },
                avgDeliveryRate: { $avg: '$metadata.deliveryRate' },
                avgReadRate: { $avg: '$metadata.readRate' },
                avgClickRate: { $avg: '$metadata.clickRate' }
            }
        }
    ]);

    const result = summary[0] || {
        totalBroadcasts: 0,
        totalRecipients: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalClicked: 0,
        totalFailed: 0,
        avgDeliveryRate: 0,
        avgReadRate: 0,
        avgClickRate: 0
    };

    res.status(200).json({
        success: true,
        data: { summary: result }
    });
});
