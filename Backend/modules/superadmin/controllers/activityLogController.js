const ActivityLog = require('../../../models/ActivityLog');
const Admin = require('../../../models/Admin');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Get all activity logs
 * GET /api/superadmin/activity-logs
 */
exports.getAllLogs = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 50,
        admin,
        action,
        resource,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    if (admin) {
        filter.admin = admin;
    }

    if (action) {
        filter.action = { $regex: action, $options: 'i' };
    }

    if (resource) {
        filter.resource = { $regex: resource, $options: 'i' };
    }

    if (status) {
        filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
            .populate('admin', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        ActivityLog.countDocuments(filter)
    ]);

    res.status(200).json({
        status: 'success',
        results: logs.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            logs
        }
    });
});

/**
 * Get single activity log
 * GET /api/superadmin/activity-logs/:id
 */
exports.getLog = catchAsync(async (req, res, next) => {
    const log = await ActivityLog.findById(req.params.id)
        .populate('admin', 'name email role');

    if (!log) {
        return next(new AppError('Activity log not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            log
        }
    });
});

/**
 * Get logs by admin
 * GET /api/superadmin/activity-logs/admin/:adminId
 */
exports.getLogsByAdmin = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify admin exists
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) {
        return next(new AppError('Admin not found', 404));
    }

    const [logs, total] = await Promise.all([
        ActivityLog.find({ admin: req.params.adminId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        ActivityLog.countDocuments({ admin: req.params.adminId })
    ]);

    res.status(200).json({
        status: 'success',
        results: logs.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            },
            logs
        }
    });
});

/**
 * Get activity statistics
 * GET /api/superadmin/activity-logs/stats
 */
exports.getActivityStats = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total activities
    const total = await ActivityLog.countDocuments(dateFilter);
    const successful = await ActivityLog.countDocuments({ ...dateFilter, status: 'SUCCESS' });
    const failed = await ActivityLog.countDocuments({ ...dateFilter, status: 'FAILED' });

    // Activities by action
    const byAction = await ActivityLog.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Activities by resource
    const byResource = await ActivityLog.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$resource',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Most active admins
    const mostActiveAdmins = await ActivityLog.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$admin',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'admins',
                localField: '_id',
                foreignField: '_id',
                as: 'adminInfo'
            }
        },
        {
            $unwind: '$adminInfo'
        },
        {
            $project: {
                admin: {
                    _id: '$adminInfo._id',
                    name: '$adminInfo.name',
                    email: '$adminInfo.email'
                },
                count: 1
            }
        }
    ]);

    // Activities by hour (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const byHour = await ActivityLog.aggregate([
        {
            $match: {
                createdAt: { $gte: last24Hours }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d %H:00',
                        date: '$createdAt'
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Activities by day (last 30 days)
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const byDay = await ActivityLog.aggregate([
        {
            $match: {
                createdAt: { $gte: last30Days }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$createdAt'
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            summary: {
                total,
                successful,
                failed,
                successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0
            },
            byAction,
            byResource,
            mostActiveAdmins,
            timeline: {
                byHour,
                byDay
            }
        }
    });
});

/**
 * Export activity logs
 * GET /api/superadmin/activity-logs/export
 */
exports.exportLogs = catchAsync(async (req, res, next) => {
    const {
        admin,
        action,
        resource,
        status,
        startDate,
        endDate,
        format = 'json'
    } = req.query;

    // Build filter
    const filter = {};

    if (admin) filter.admin = admin;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = { $regex: resource, $options: 'i' };
    if (status) filter.status = status;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Limit export to 10000 records
    const logs = await ActivityLog.find(filter)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .limit(10000);

    if (format === 'csv') {
        // Convert to CSV
        const csv = [
            'Timestamp,Admin,Email,Action,Resource,Status,IP Address',
            ...logs.map(log => 
                `${log.createdAt},${log.admin?.name || 'N/A'},${log.admin?.email || 'N/A'},${log.action},${log.resource},${log.status},${log.ipAddress || 'N/A'}`
            )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
        return res.send(csv);
    }

    // Default: JSON format
    res.status(200).json({
        status: 'success',
        results: logs.length,
        exportedAt: new Date(),
        data: {
            logs
        }
    });
});

/**
 * Delete old logs (cleanup)
 * DELETE /api/superadmin/activity-logs/cleanup
 */
exports.cleanupLogs = catchAsync(async (req, res, next) => {
    const { days = 90 } = req.body;

    if (days < 30) {
        return next(new AppError('Cannot delete logs newer than 30 days', 400));
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await ActivityLog.deleteMany({
        createdAt: { $lt: cutoffDate }
    });

    res.status(200).json({
        status: 'success',
        message: `Deleted ${result.deletedCount} logs older than ${days} days`,
        data: {
            deletedCount: result.deletedCount,
            cutoffDate
        }
    });
});

/**
 * Get recent activities (dashboard widget)
 * GET /api/superadmin/activity-logs/recent
 */
exports.getRecentActivities = catchAsync(async (req, res, next) => {
    const { limit = 10 } = req.query;

    const logs = await ActivityLog.find()
        .populate('admin', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        status: 'success',
        results: logs.length,
        data: {
            logs
        }
    });
});

/**
 * Get failed activities
 * GET /api/superadmin/activity-logs/failed
 */
exports.getFailedActivities = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        ActivityLog.find({ status: 'FAILED' })
            .populate('admin', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        ActivityLog.countDocuments({ status: 'FAILED' })
    ]);

    res.status(200).json({
        status: 'success',
        results: logs.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            logs
        }
    });
});
