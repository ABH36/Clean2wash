const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const FraudAlert = require('../../../models/FraudAlert');
const Blacklist = require('../../../models/Blacklist');
const User = require('../../../models/User');
const SpareDriver = require('../../../models/SpareDriver');
const fraudDetectionService = require('../../../services/fraudDetectionService');

/**
 * Get all fraud alerts with filtering and pagination
 */
exports.getAllAlerts = catchAsync(async (req, res, next) => {
    const {
        status,
        severity,
        alertType,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (alertType) filter.alertType = alertType;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const alerts = await FraudAlert.find(filter)
        .populate('user', 'name phone email')
        .populate('driver', 'name phone email')
        .populate('booking', 'bookingId status')
        .populate('investigatedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await FraudAlert.countDocuments(filter);

    // Get statistics
    const stats = await FraudAlert.aggregate([
        {
            $group: {
                _id: null,
                totalAlerts: { $sum: 1 },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
                },
                investigating: {
                    $sum: { $cond: [{ $eq: ['$status', 'INVESTIGATING'] }, 1, 0] }
                },
                confirmed: {
                    $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
                },
                critical: {
                    $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
                },
                high: {
                    $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
                },
                avgRiskScore: { $avg: '$riskScore' }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: alerts.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        stats: stats[0] || {},
        data: { alerts }
    });
});

/**
 * Get single fraud alert details
 */
exports.getAlert = catchAsync(async (req, res, next) => {
    const alert = await FraudAlert.findById(req.params.id)
        .populate('user', 'name phone email wallet profile')
        .populate('driver', 'name phone email verification')
        .populate('booking')
        .populate('investigatedBy', 'name email');

    if (!alert) {
        return next(new AppError('Fraud alert not found', 404));
    }

    // Get user/driver risk profile
    let riskProfile = null;
    if (alert.user) {
        riskProfile = await fraudDetectionService.getUserRiskProfile(alert.user._id);
    } else if (alert.driver) {
        riskProfile = await fraudDetectionService.getDriverRiskProfile(alert.driver._id);
    }

    res.status(200).json({
        status: 'success',
        data: {
            alert,
            riskProfile
        }
    });
});

/**
 * Update fraud alert status and investigation
 */
exports.updateAlert = catchAsync(async (req, res, next) => {
    const { status, actionTaken, investigationNotes } = req.body;

    const alert = await FraudAlert.findById(req.params.id);
    if (!alert) {
        return next(new AppError('Fraud alert not found', 404));
    }

    if (status) alert.status = status;
    if (actionTaken) alert.actionTaken = actionTaken;
    if (investigationNotes) alert.investigationNotes = investigationNotes;

    alert.investigatedBy = req.user.id;

    if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
        alert.resolvedAt = new Date();
    }

    await alert.save();

    res.status(200).json({
        status: 'success',
        data: { alert }
    });
});

/**
 * Get fraud dashboard statistics
 */
exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
        startDate.setDate(now.getDate() - 30);
    } else if (timeRange === '90d') {
        startDate.setDate(now.getDate() - 90);
    }

    // Overall statistics
    const overallStats = await FraudAlert.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAlerts: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' },
                criticalAlerts: {
                    $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
                },
                highAlerts: {
                    $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
                },
                confirmedFraud: {
                    $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
                },
                pendingInvestigation: {
                    $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
                }
            }
        }
    ]);

    // Alerts by type
    const alertsByType = await FraudAlert.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$alertType',
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Trend data (daily)
    const trendData = await FraudAlert.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 },
                critical: {
                    $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
                },
                high: {
                    $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Active blacklist count
    const blacklistCount = await Blacklist.countDocuments({
        isActive: true,
        $or: [
            { isPermanent: true },
            { expiresAt: { $gt: new Date() } }
        ]
    });

    res.status(200).json({
        status: 'success',
        data: {
            overall: overallStats[0] || {},
            alertsByType,
            trendData,
            blacklistCount,
            timeRange
        }
    });
});

/**
 * Get all blacklist entries
 */
exports.getAllBlacklist = catchAsync(async (req, res, next) => {
    const {
        entityType,
        isActive = 'true',
        page = 1,
        limit = 20
    } = req.query;

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (isActive === 'true') {
        filter.isActive = true;
        filter.$or = [
            { isPermanent: true },
            { expiresAt: { $gt: new Date() } }
        ];
    }

    const skip = (page - 1) * limit;

    const entries = await Blacklist.find(filter)
        .populate('userId', 'name phone email')
        .populate('driverId', 'name phone email')
        .populate('addedBy', 'name')
        .populate('relatedAlerts')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Blacklist.countDocuments(filter);

    res.status(200).json({
        status: 'success',
        results: entries.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: { entries }
    });
});

/**
 * Add entity to blacklist
 */
exports.addToBlacklist = catchAsync(async (req, res, next) => {
    const {
        entityType,
        entityId,
        userId,
        driverId,
        reason,
        severity = 'MEDIUM',
        isPermanent = false,
        expiresAt,
        relatedAlerts,
        notes
    } = req.body;

    if (!entityType || !entityId || !reason) {
        return next(new AppError('Please provide entityType, entityId, and reason', 400));
    }

    // Check if already blacklisted
    const existing = await Blacklist.findOne({
        entityType,
        entityId,
        isActive: true
    });

    if (existing) {
        return next(new AppError('Entity is already blacklisted', 400));
    }

    const blacklistEntry = await Blacklist.create({
        entityType,
        entityId,
        userId,
        driverId,
        reason,
        severity,
        isPermanent,
        expiresAt: isPermanent ? null : expiresAt,
        addedBy: req.user.id,
        relatedAlerts,
        notes
    });

    res.status(201).json({
        status: 'success',
        data: { blacklistEntry }
    });
});

/**
 * Remove from blacklist
 */
exports.removeFromBlacklist = catchAsync(async (req, res, next) => {
    const entry = await Blacklist.findById(req.params.id);

    if (!entry) {
        return next(new AppError('Blacklist entry not found', 404));
    }

    entry.isActive = false;
    await entry.save();

    res.status(200).json({
        status: 'success',
        message: 'Entity removed from blacklist'
    });
});

/**
 * Check if entity is blacklisted
 */
exports.checkBlacklist = catchAsync(async (req, res, next) => {
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
        return next(new AppError('Please provide entityType and entityId', 400));
    }

    const isBlacklisted = await fraudDetectionService.isBlacklisted(entityType, entityId);

    res.status(200).json({
        status: 'success',
        data: {
            isBlacklisted,
            entityType,
            entityId
        }
    });
});

/**
 * Get user risk profile
 */
exports.getUserRiskProfile = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const riskProfile = await fraudDetectionService.getUserRiskProfile(userId);

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email
            },
            riskProfile
        }
    });
});

/**
 * Get driver risk profile
 */
exports.getDriverRiskProfile = catchAsync(async (req, res, next) => {
    const { driverId } = req.params;

    const driver = await SpareDriver.findById(driverId);
    if (!driver) {
        return next(new AppError('Driver not found', 404));
    }

    const riskProfile = await fraudDetectionService.getDriverRiskProfile(driverId);

    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                phone: driver.phone,
                email: driver.email
            },
            riskProfile
        }
    });
});

/**
 * Run manual fraud check on user
 */
exports.runUserFraudCheck = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const fraudDetected = await fraudDetectionService.runUserFraudCheck(userId);

    res.status(200).json({
        status: 'success',
        data: {
            fraudDetected,
            message: fraudDetected
                ? 'Fraud patterns detected. Check fraud alerts for details.'
                : 'No fraud patterns detected.'
        }
    });
});

/**
 * Run manual fraud check on driver
 */
exports.runDriverFraudCheck = catchAsync(async (req, res, next) => {
    const { driverId } = req.params;

    const driver = await SpareDriver.findById(driverId);
    if (!driver) {
        return next(new AppError('Driver not found', 404));
    }

    const fraudDetected = await fraudDetectionService.runDriverFraudCheck(driverId);

    res.status(200).json({
        status: 'success',
        data: {
            fraudDetected,
            message: fraudDetected
                ? 'Fraud patterns detected. Check fraud alerts for details.'
                : 'No fraud patterns detected.'
        }
    });
});
