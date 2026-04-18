const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    consumer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consumer'
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Captain'
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    spareDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpareDriver'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        lowercase: true,
        enum: [
            'booking', 'payment', 'promotion', 'system', 'vehicle', 'service',
            'verification', 'order-assigned', 'payout', 'subscription', 'sos',
            'status-update', 'sos_response', 'issue', 'logistics'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    actionUrl: {
        type: String,
        trim: true
    },
    actionText: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better performance
notificationSchema.index({ consumer: 1, createdAt: -1 });
notificationSchema.index({ consumer: 1, isRead: 1 });
notificationSchema.index({ vendor: 1, createdAt: -1 });
notificationSchema.index({ vendor: 1, isRead: 1 });
notificationSchema.index({ spareDriver: 1, createdAt: -1 });
notificationSchema.index({ spareDriver: 1, isRead: 1 });
notificationSchema.index({ isAdmin: 1, createdAt: -1 }); // New index for admin notifications
notificationSchema.index({ type: 1, priority: 1 });

// Static method to get consumer notifications
notificationSchema.statics.getConsumerNotifications = async function (consumerId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { consumer: consumerId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ consumer: consumerId, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

// Static method to get captain notifications
notificationSchema.statics.getCaptainNotifications = async function (captainId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { captain: captainId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ captain: captainId, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

// Static method to get vendor notifications
notificationSchema.statics.getVendorNotifications = async function (vendorId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { vendor: vendorId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ vendor: vendorId, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (notificationData) {
    const notification = await this.create(notificationData);
    return notification;
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    return this.save();
};

// Static method to mark all as read for consumer
notificationSchema.statics.markAllAsRead = async function (consumerId) {
    return this.updateMany(
        { consumer: consumerId, isRead: false },
        { isRead: true }
    );
};

// Static method to mark all as read for vendor
notificationSchema.statics.markAllAsReadForVendor = async function (vendorId) {
    return this.updateMany(
        { vendor: vendorId, isRead: false },
        { isRead: true }
    );
};

// Static method to delete all notifications for consumer
notificationSchema.statics.clearAll = async function (consumerId) {
    return this.deleteMany({ consumer: consumerId });
};

// Static method to get staff notifications
notificationSchema.statics.getStaffNotifications = async function (staffId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { staff: staffId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ staff: staffId, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

// Static method to delete all notifications for vendor
notificationSchema.statics.clearAllForVendor = async function (vendorId) {
    return this.deleteMany({ vendor: vendorId });
};

// Static method to mark all as read for staff
notificationSchema.statics.markAllAsReadForStaff = async function (staffId) {
    return this.updateMany(
        { staff: staffId, isRead: false },
        { isRead: true }
    );
};

// Static method to get spare driver notifications
notificationSchema.statics.getSpareDriverNotifications = async function (driverId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { spareDriver: driverId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ spareDriver: driverId, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

// Static method to mark all as read for spare driver
notificationSchema.statics.markAllAsReadForSpareDriver = async function (driverId) {
    return this.updateMany(
        { spareDriver: driverId, isRead: false },
        { isRead: true }
    );
};

// Static method to delete all notifications for spare driver
notificationSchema.statics.clearAllForSpareDriver = async function (driverId) {
    return this.deleteMany({ spareDriver: driverId });
};

// Static method to delete all notifications for staff
notificationSchema.statics.clearAllForStaff = async function (staffId) {
    return this.deleteMany({ staff: staffId });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function (daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
    });
};

// Static method to get admin notifications
notificationSchema.statics.getAdminNotifications = async function (options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;
    const skip = (page - 1) * limit;

    const query = { isAdmin: true };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ isAdmin: true, isRead: false });

    return {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
