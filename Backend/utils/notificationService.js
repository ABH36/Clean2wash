const Notification = require('../models/Notification');
const socketService = require('../socketService');

/**
 * Send a notification to a consumer
 * @param {string} consumerId - The ID of the consumer
 * @param {Object} data - Notification data (title, message, type, priority, etc.)
 */
const sendNotification = async (consumerId, data) => {
    try {
        const { title, message, type, priority = 'medium', actionUrl, actionText, imageUrl, metaData } = data;

        // 1. Save to Database
        const notification = await Notification.create({
            consumer: consumerId,
            title,
            message,
            type,
            priority,
            actionUrl,
            actionText,
            imageUrl,
            data: metaData || {}
        });

        // 2. Emit via Socket.io for real-time update
        const io = socketService.getIO();
        if (io) {
            // Join consumer-specific room if not already handled by middeleware/auth
            // Assuming consumers join a room named by their ID on connection
            io.to(consumerId.toString()).emit('new_notification', {
                notification: {
                    id: notification._id,
                    title,
                    message,
                    type,
                    priority,
                    createdAt: notification.createdAt,
                    isNew: true
                }
            });
        }

        return notification;
    } catch (error) {
        console.error('Error in sendNotification utility:', error);
        // We don't throw here to avoid breaking the main flow if notification fails
        return null;
    }
};

/**
 * Send a notification to a captain
 * @param {string} captainId - The ID of the captain
 * @param {Object} data - Notification data (title, message, type, priority, etc.)
 */
const sendCaptainNotification = async (captainId, data) => {
    try {
        const { title, message, type, priority = 'medium', actionUrl, actionText, imageUrl, metaData } = data;

        // 1. Save to Database
        const notification = await Notification.create({
            captain: captainId,
            title,
            message,
            type,
            priority,
            actionUrl,
            actionText,
            imageUrl,
            data: metaData || {}
        });

        // 2. Emit via Socket.io for real-time update
        const io = socketService.getIO();
        if (io) {
            io.to(captainId.toString()).emit('new_captain_notification', {
                notification: {
                    id: notification._id,
                    title,
                    message,
                    type,
                    priority,
                    createdAt: notification.createdAt,
                    isNew: true
                }
            });
        }

        return notification;
    } catch (error) {
        console.error('Error in sendCaptainNotification utility:', error);
        return null;
    }
};

/**
 * Send a notification to administrators
 * @param {Object} data - Notification data
 */
const sendAdminNotification = async (data) => {
    try {
        const { title, message, type, priority = 'high', metaData } = data;
        
        // 1. Save to Database (using a generic notification with type 'admin')
        const notification = await Notification.create({
            title,
            message,
            type: type || 'ADMIN_ALERT',
            priority,
            isAdmin: true,
            data: metaData || {}
        });

        // 2. Emit via Socket.io to 'admin_room'
        const io = socketService.getIO();
        if (io) {
            io.to('admin_room').emit('new_admin_notification', {
                notification: {
                    id: notification._id,
                    title,
                    message,
                    type,
                    priority,
                    createdAt: notification.createdAt
                }
            });
        }
        return notification;
    } catch (err) {
        console.error('sendAdminNotification error:', err);
        return null;
    }
};

module.exports = {
    sendNotification,
    sendCaptainNotification,
    sendAdminNotification
};
