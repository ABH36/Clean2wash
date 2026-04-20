const Notification = require('../models/Notification');
const User = require('../models/User');
const Captain = require('../models/Captain');
const SpareDriver = require('../models/SpareDriver');
const socketService = require('../services/enhancedSocketService');
const firebaseService = require('./firebaseService');

/**
 * 🚀 Unified Notification Engine (Phase 2 Hardening)
 * This function handles database persistence, Socket.IO real-time emission,
 * and Firebase Cloud Messaging (FCM) based on user role and availability.
 * 
 * @param {string} userId - The ID of the recipient
 * @param {string} role - The role of the recipient (consumer, captain, vendor, staff, sparedriver)
 * @param {Object} data - { title, message, type, priority, actionUrl, metaData }
 */
const triggerNotification = async (userId, role, data) => {
    try {
        const { title, message, type, priority = 'medium', actionUrl, actionText, imageUrl, metaData } = data;

        // 1. Prepare Notification Object for Database
        const notificationData = {
            title,
            message,
            type,
            priority,
            actionUrl,
            actionText,
            imageUrl,
            data: metaData || {}
        };

        // Map role to the correct field in Notification model
        const roleFieldMap = {
            'consumer': 'consumer',
            'captain': 'captain',
            'vendor': 'vendor',
            'staff': 'staff',
            'sparedriver': 'spareDriver',
            'admin': 'isAdmin'
        };

        const field = roleFieldMap[role.toLowerCase()];
        if (field === 'isAdmin') {
            notificationData.isAdmin = true;
        } else if (field) {
            notificationData[field] = userId;
        }

        // 2. Persist to Database
        const notification = await Notification.create(notificationData);

        // 3. Multi-Channel Delivery: Socket.IO (Real-time)
        let io = null;
        try {
            io = socketService.getIO();
        } catch (socketError) {
            io = null;
        }

        if (io) {
            const socketEventMap = {
                'consumer': 'new_notification',
                'captain': 'new_captain_notification',
                'vendor': 'new_vendor_notification',
                'staff': 'new_staff_notification',
                'sparedriver': 'new_spare_driver_notification',
                'admin': 'new_admin_notification'
            };

            // Safely convert userId to string, handle undefined/null
            const room = field === 'isAdmin' ? 'admin_room' : (userId?._id || userId)?.toString();
            const event = socketEventMap[role.toLowerCase()] || 'new_notification';

            // Only emit if room is valid
            if (room) {
                io.to(room).emit(event, {
                    notification: {
                        id: notification._id,
                        title,
                        message,
                        type,
                        priority,
                        createdAt: notification.createdAt,
                        isNew: true,
                        metaData: notification.data
                    }
                });
            }
        }

        // 4. Multi-Channel Delivery: FCM (Background/Mobile)
        // Only attempt FCM for non-admin roles if user has tokens
        if (field !== 'isAdmin') {
            const recipientModelMap = {
                consumer: User,
                vendor: User,
                staff: User,
                captain: Captain,
                sparedriver: SpareDriver
            };

            const RecipientModel = recipientModelMap[role.toLowerCase()] || User;
            const recipient = await RecipientModel.findById(userId).select('fcmTokens');
            if (recipient && recipient.fcmTokens && recipient.fcmTokens.length > 0) {
                const tokens = recipient.fcmTokens.map((t) => t.token).filter(Boolean);
                if (tokens.length === 0) {
                    return notification;
                }

                await firebaseService.sendMulticastNotification(tokens, {
                    title,
                    body: message,
                    data: {
                        notificationId: notification._id.toString(),
                        type,
                        ...metaData
                    }
                });
            }
        }

        return notification;
    } catch (error) {
        console.error(`❌ Notification Error [${role}]:`, error);
        return null;
    }
};

/**
 * Backward Compatible Wrappers (Prevents breaking existing code)
 */
const sendNotification = (userId, data) => triggerNotification(userId, 'consumer', data);
const sendCaptainNotification = (userId, data) => triggerNotification(userId, 'captain', data);
const sendVendorNotification = (userId, data) => triggerNotification(userId, 'vendor', data);
const sendStaffNotification = (userId, data) => triggerNotification(userId, 'staff', data);
const sendSpareDriverNotification = (userId, data) => triggerNotification(userId, 'sparedriver', data);
const sendAdminNotification = (data) => triggerNotification(null, 'admin', data);

module.exports = {
    triggerNotification,
    sendNotification,
    sendCaptainNotification,
    sendAdminNotification,
    sendVendorNotification,
    sendStaffNotification,
    sendSpareDriverNotification
};
