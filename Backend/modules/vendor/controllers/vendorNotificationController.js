const Notification = require('../../../models/Notification');

/**
 * Get all notifications for the authenticated vendor
 */
exports.getMyNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isRead, priority } = req.query;
        
        const result = await Notification.getVendorNotifications(req.user.id, {
            page: parseInt(page),
            limit: parseInt(limit),
            type,
            isRead: isRead !== undefined ? isRead === 'true' : undefined,
            priority
        });

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Error in getMyNotifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch notifications'
        });
    }
};

/**
 * Mark a specific notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            vendor: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                status: 'fail',
                message: 'Notification not found'
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update notification'
        });
    }
};

/**
 * Mark all notifications as read for the vendor
 */
exports.markAllRead = async (req, res) => {
    try {
        await Notification.markAllAsReadForVendor(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error in markAllRead:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update notifications'
        });
    }
};

/**
 * Clear all notifications for the vendor
 */
exports.clearNotifications = async (req, res) => {
    try {
        await Notification.clearAllForVendor(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Notification history cleared'
        });
    } catch (error) {
        console.error('Error in clearNotifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to clear notifications'
        });
    }
};
