const BroadcastMessage = require('../models/BroadcastMessage');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const Notification = require('../models/Notification');
const socketService = require('../socketService');

/**
 * Broadcast Service - Handle mass messaging to users/drivers
 */

/**
 * Create broadcast message
 */
const createBroadcast = async (adminId, broadcastData) => {
    const broadcast = await BroadcastMessage.create({
        createdBy: adminId,
        title: broadcastData.title,
        message: broadcastData.message,
        targetType: broadcastData.targetType,
        targetFilters: broadcastData.targetFilters || {},
        specificRecipients: broadcastData.specificRecipients || [],
        messageType: broadcastData.messageType || 'announcement',
        priority: broadcastData.priority || 'normal',
        channels: broadcastData.channels || {
            inApp: true,
            push: true,
            sms: false,
            email: false
        },
        content: broadcastData.content || {},
        scheduledFor: broadcastData.scheduledFor || new Date(),
        status: broadcastData.scheduledFor ? 'scheduled' : 'draft',
        metadata: {
            tags: broadcastData.tags || [],
            campaign: broadcastData.campaign
        },
        expiresAt: broadcastData.expiresAt
    });

    // Calculate estimated reach
    const estimatedReach = await calculateEstimatedReach(broadcast);
    broadcast.metadata.estimatedReach = estimatedReach;
    await broadcast.save();

    return broadcast;
};

/**
 * Calculate estimated reach based on filters
 */
const calculateEstimatedReach = async (broadcast) => {
    let count = 0;

    if (broadcast.targetType === 'all') {
        const userCount = await User.countDocuments({ status: 'active' });
        const driverCount = await SpareDriver.countDocuments({ status: 'active' });
        count = userCount + driverCount;
    } else if (broadcast.targetType === 'users') {
        count = await User.countDocuments(buildQuery('User', broadcast.targetFilters));
    } else if (broadcast.targetType === 'drivers') {
        count = await SpareDriver.countDocuments(buildQuery('SpareDriver', broadcast.targetFilters));
    } else if (broadcast.targetType === 'custom') {
        count = broadcast.specificRecipients.length;
    }

    return count;
};

/**
 * Build query from filters
 */
const buildQuery = (userType, filters) => {
    const query = {};

    if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
    }

    if (filters.city && filters.city.length > 0) {
        query['address.city'] = { $in: filters.city };
    }

    if (filters.registeredAfter) {
        query.createdAt = { ...query.createdAt, $gte: new Date(filters.registeredAfter) };
    }

    if (filters.registeredBefore) {
        query.createdAt = { ...query.createdAt, $lte: new Date(filters.registeredBefore) };
    }

    if (filters.isPremium !== undefined && userType === 'SpareDriver') {
        query['verification.policeStatus'] = filters.isPremium ? 'approved' : { $ne: 'approved' };
    }

    return query;
};

/**
 * Get recipients for broadcast
 */
const getRecipients = async (broadcast) => {
    let recipients = [];

    if (broadcast.targetType === 'all') {
        const users = await User.find({ status: 'active' }).select('_id name phone email').lean();
        const drivers = await SpareDriver.find({ status: 'active' }).select('_id name phone email').lean();
        
        recipients = [
            ...users.map(u => ({ id: u._id, type: 'User', name: u.name, phone: u.phone, email: u.email })),
            ...drivers.map(d => ({ id: d._id, type: 'SpareDriver', name: d.name, phone: d.phone, email: d.email }))
        ];
    } else if (broadcast.targetType === 'users') {
        const users = await User.find(buildQuery('User', broadcast.targetFilters))
            .select('_id name phone email')
            .lean();
        recipients = users.map(u => ({ id: u._id, type: 'User', name: u.name, phone: u.phone, email: u.email }));
    } else if (broadcast.targetType === 'drivers') {
        const drivers = await SpareDriver.find(buildQuery('SpareDriver', broadcast.targetFilters))
            .select('_id name phone email')
            .lean();
        recipients = drivers.map(d => ({ id: d._id, type: 'SpareDriver', name: d.name, phone: d.phone, email: d.email }));
    } else if (broadcast.targetType === 'custom') {
        recipients = broadcast.specificRecipients;
    }

    return recipients;
};

/**
 * Send broadcast message
 */
const sendBroadcast = async (broadcastId) => {
    const broadcast = await BroadcastMessage.findById(broadcastId);

    if (!broadcast) {
        throw new Error('Broadcast not found');
    }

    if (broadcast.status !== 'draft' && broadcast.status !== 'scheduled') {
        throw new Error('Broadcast already sent or in progress');
    }

    // Mark as sending
    await broadcast.markAsSending();

    try {
        // Get recipients
        const recipients = await getRecipients(broadcast);
        
        broadcast.stats.totalRecipients = recipients.length;
        await broadcast.save();

        // Send to each recipient
        for (const recipient of recipients) {
            try {
                // Send in-app notification
                if (broadcast.channels.inApp) {
                    await Notification.create({
                        [recipient.type === 'User' ? 'consumer' : 'spareDriver']: recipient.id,
                        type: broadcast.messageType,
                        title: broadcast.title,
                        message: broadcast.message,
                        priority: broadcast.priority,
                        imageUrl: broadcast.content.imageUrl,
                        actionUrl: broadcast.content.actionUrl,
                        actionText: broadcast.content.actionText,
                        expiresAt: broadcast.expiresAt,
                        data: {
                            broadcastId: broadcastId.toString(),
                            messageType: broadcast.messageType
                        }
                    });
                }

                // Send push notification
                if (broadcast.channels.push) {
                    const socket = socketService.getIO();
                    if (socket) {
                        const room = `${recipient.type.toLowerCase()}_${recipient.id}`;
                        socket.to(room).emit('broadcast_notification', {
                            title: broadcast.title,
                            message: broadcast.message,
                            data: broadcast.content
                        });
                    }
                }

                // Send SMS (if enabled and phone available)
                if (broadcast.channels.sms && recipient.phone) {
                    // TODO: Integrate SMS service
                    console.log(`SMS to ${recipient.phone}: ${broadcast.message}`);
                }

                // Send Email (if enabled and email available)
                if (broadcast.channels.email && recipient.email) {
                    // TODO: Integrate email service
                    console.log(`Email to ${recipient.email}: ${broadcast.message}`);
                }

                // Log successful delivery
                await broadcast.addDeliveryLog(
                    { id: recipient.id, type: recipient.type },
                    'sent',
                    'inApp'
                );

            } catch (error) {
                console.error(`Failed to send to ${recipient.id}:`, error);
                
                // Log failed delivery
                await broadcast.addDeliveryLog(
                    { id: recipient.id, type: recipient.type },
                    'failed',
                    'inApp',
                    error.message
                );
            }
        }

        // Mark as completed
        await broadcast.markAsCompleted();
        broadcast.metadata.actualReach = broadcast.stats.sent;
        await broadcast.save();

        return broadcast;

    } catch (error) {
        await broadcast.markAsFailed();
        throw error;
    }
};

/**
 * Schedule broadcast
 */
const scheduleBroadcast = async (broadcastId, scheduledFor) => {
    const broadcast = await BroadcastMessage.findById(broadcastId);

    if (!broadcast) {
        throw new Error('Broadcast not found');
    }

    broadcast.scheduledFor = new Date(scheduledFor);
    broadcast.status = 'scheduled';
    await broadcast.save();

    return broadcast;
};

/**
 * Cancel broadcast
 */
const cancelBroadcast = async (broadcastId) => {
    const broadcast = await BroadcastMessage.findById(broadcastId);

    if (!broadcast) {
        throw new Error('Broadcast not found');
    }

    if (broadcast.status === 'sending' || broadcast.status === 'sent') {
        throw new Error('Cannot cancel broadcast that is already sending or sent');
    }

    await broadcast.cancel();

    return broadcast;
};

/**
 * Get broadcast statistics
 */
const getBroadcastStats = async (broadcastId) => {
    const broadcast = await BroadcastMessage.findById(broadcastId)
        .select('title stats metadata createdAt sentAt completedAt')
        .lean();

    if (!broadcast) {
        throw new Error('Broadcast not found');
    }

    return {
        title: broadcast.title,
        stats: broadcast.stats,
        metadata: broadcast.metadata,
        createdAt: broadcast.createdAt,
        sentAt: broadcast.sentAt,
        completedAt: broadcast.completedAt
    };
};

/**
 * Get admin broadcasts
 */
const getAdminBroadcasts = async (adminId, filters = {}) => {
    const query = { createdBy: adminId };

    if (filters.status) query.status = filters.status;
    if (filters.messageType) query.messageType = filters.messageType;
    if (filters.targetType) query.targetType = filters.targetType;

    const broadcasts = await BroadcastMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .select('-deliveryLog')
        .lean();

    return broadcasts;
};

/**
 * Process scheduled broadcasts
 */
const processScheduledBroadcasts = async () => {
    const scheduledBroadcasts = await BroadcastMessage.getScheduledMessages();

    for (const broadcast of scheduledBroadcasts) {
        try {
            await sendBroadcast(broadcast._id);
            console.log(`Sent scheduled broadcast: ${broadcast._id}`);
        } catch (error) {
            console.error(`Failed to send scheduled broadcast ${broadcast._id}:`, error);
        }
    }
};

/**
 * Track broadcast interaction
 */
const trackBroadcastInteraction = async (broadcastId, recipientId, recipientType, action) => {
    const broadcast = await BroadcastMessage.findById(broadcastId);

    if (!broadcast) {
        return;
    }

    // Update delivery log
    const logEntry = broadcast.deliveryLog.find(
        log => log.recipient.id.toString() === recipientId.toString() && log.recipient.type === recipientType
    );

    if (logEntry) {
        if (action === 'read' && logEntry.status === 'delivered') {
            logEntry.status = 'read';
            broadcast.stats.read += 1;
        } else if (action === 'clicked') {
            logEntry.status = 'clicked';
            broadcast.stats.clicked += 1;
        }

        await broadcast.save();
    }
};

/**
 * Create emergency broadcast
 */
const createEmergencyBroadcast = async (adminId, title, message, targetType = 'all') => {
    const broadcast = await createBroadcast(adminId, {
        title,
        message,
        targetType,
        messageType: 'emergency',
        priority: 'urgent',
        channels: {
            inApp: true,
            push: true,
            sms: true,
            email: false
        }
    });

    // Send immediately
    await sendBroadcast(broadcast._id);

    return broadcast;
};

module.exports = {
    createBroadcast,
    sendBroadcast,
    scheduleBroadcast,
    cancelBroadcast,
    getBroadcastStats,
    getAdminBroadcasts,
    processScheduledBroadcasts,
    trackBroadcastInteraction,
    createEmergencyBroadcast,
    getRecipients,
    calculateEstimatedReach
};
