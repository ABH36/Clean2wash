const AuditLog = require('../../../models/AuditLog');
const catchAsync = require('../../../utils/catchAsync');

/**
 * @desc    Get all system audit logs
 * @route   GET /api/admin/audit/logs
 * @access  Private (Admin)
 */
exports.getAuditLogs = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 50, action, resource, userId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (action) query.action = action.toUpperCase();
    if (resource) query.resource = resource.toUpperCase();
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
        status: 'success',
        results: logs.length,
        data: {
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * @desc    Get stats of audit logs (most active admins, most common actions)
 * @route   GET /api/admin/audit/stats
 * @access  Private (Admin)
 */
exports.getAuditStats = catchAsync(async (req, res, next) => {
    const stats = await AuditLog.aggregate([
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});
