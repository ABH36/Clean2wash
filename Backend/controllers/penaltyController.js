const Penalty = require('../models/Penalty');
const SpareDriver = require('../models/SpareDriver');
const User = require('../models/User');
const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get all penalties with filters
exports.getAllPenalties = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        type,
        driverId,
        customerId,
        startDate,
        endDate,
        search
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (driverId) query.driver = driverId;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    let penalties = await Penalty.find(query)
        .populate('driver', 'name driverId phone')
        .populate('booking', 'bookingId consumer service')
        .populate('appliedBy', 'name email')
        .populate('waivedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    // Apply search filter if provided
    if (search) {
        penalties = penalties.filter(penalty => {
            const driverName = penalty.driver?.name?.toLowerCase() || '';
            const driverPhone = penalty.driver?.phone?.toLowerCase() || '';
            const reason = penalty.reason?.toLowerCase() || '';
            const searchTerm = search.toLowerCase();
            
            return driverName.includes(searchTerm) || 
                   driverPhone.includes(searchTerm) || 
                   reason.includes(searchTerm);
        });
    }
    
    const total = await Penalty.countDocuments(query);
    
    res.status(200).json({
        status: 'success',
        results: penalties.length,
        data: {
            penalties,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get single penalty
exports.getPenalty = catchAsync(async (req, res) => {
    const penalty = await Penalty.findById(req.params.id)
        .populate('driver', 'name driverId phone wallet')
        .populate('booking', 'bookingId consumer service pricing')
        .populate('appliedBy', 'name email')
        .populate('waivedBy', 'name email')
        .populate('transactionId');
    
    if (!penalty) {
        return next(new AppError('Penalty not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            penalty
        }
    });
});

// Create new penalty
exports.createPenalty = catchAsync(async (req, res) => {
    const {
        userId,
        userType,
        bookingId,
        type,
        amount,
        reason,
        description,
        autoApply = false
    } = req.body;
    
    // Validate required fields
    if (!userId || !userType || !type || !amount || !reason) {
        return res.status(400).json({
            status: 'error',
            message: 'User ID, user type, penalty type, amount, and reason are required'
        });
    }
    
    // Validate user exists
    let user;
    if (userType === 'driver') {
        user = await SpareDriver.findById(userId);
    } else if (userType === 'customer') {
        user = await User.findOne({ _id: userId, role: 'consumer' });
    }
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: `${userType} not found`
        });
    }
    
    // Validate booking if provided
    let booking;
    if (bookingId) {
        booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                status: 'error',
                message: 'Booking not found'
            });
        }
    }
    
    // Create penalty
    const penaltyData = {
        type,
        amount: parseFloat(amount),
        reason,
        description
    };
    
    if (userType === 'driver') {
        penaltyData.driver = userId;
    }
    
    if (bookingId) {
        penaltyData.booking = bookingId;
    }
    
    const penalty = await Penalty.create(penaltyData);
    
    // Auto-apply if requested
    if (autoApply) {
        await penalty.apply(req.user._id);
    }
    
    // Populate for response
    await penalty.populate('driver', 'name driverId phone');
    await penalty.populate('booking', 'bookingId');
    
    res.status(201).json({
        status: 'success',
        message: 'Penalty created successfully',
        data: {
            penalty
        }
    });
});

// Apply penalty
exports.applyPenalty = catchAsync(async (req, res) => {
    const penalty = await Penalty.findById(req.params.id);
    
    if (!penalty) {
        return res.status(404).json({
            status: 'error',
            message: 'Penalty not found'
        });
    }
    
    if (penalty.status !== 'PENDING') {
        return res.status(400).json({
            status: 'error',
            message: 'Can only apply pending penalties'
        });
    }
    
    await penalty.apply(req.user._id);
    
    res.status(200).json({
        status: 'success',
        message: 'Penalty applied successfully',
        data: {
            penalty
        }
    });
});

// Waive penalty
exports.waivePenalty = catchAsync(async (req, res) => {
    const { reason } = req.body;
    
    if (!reason) {
        return res.status(400).json({
            status: 'error',
            message: 'Waiver reason is required'
        });
    }
    
    const penalty = await Penalty.findById(req.params.id);
    
    if (!penalty) {
        return res.status(404).json({
            status: 'error',
            message: 'Penalty not found'
        });
    }
    
    if (penalty.status === 'WAIVED') {
        return res.status(400).json({
            status: 'error',
            message: 'Penalty is already waived'
        });
    }
    
    await penalty.waive(req.user._id, reason);
    
    res.status(200).json({
        status: 'success',
        message: 'Penalty waived successfully',
        data: {
            penalty
        }
    });
});

// Get penalty statistics
exports.getPenaltyStats = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const stats = await Penalty.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
    
    const typeStats = await Penalty.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
    
    const driverPenalties = await Penalty.countDocuments({
        ...dateFilter,
        driver: { $exists: true }
    });
    
    const customerPenalties = await Penalty.countDocuments({
        ...dateFilter,
        driver: { $exists: false }
    });
    
    // Format stats
    const summary = {
        total: 0,
        totalAmount: 0,
        pending: { count: 0, amount: 0 },
        applied: { count: 0, amount: 0 },
        waived: { count: 0, amount: 0 },
        disputed: { count: 0, amount: 0 },
        driverPenalties,
        customerPenalties,
        byType: {}
    };
    
    stats.forEach(stat => {
        summary.total += stat.count;
        summary.totalAmount += stat.totalAmount;
        const status = stat._id.toLowerCase();
        if (summary[status]) {
            summary[status].count = stat.count;
            summary[status].amount = stat.totalAmount;
        }
    });
    
    typeStats.forEach(stat => {
        summary.byType[stat._id] = {
            count: stat.count,
            amount: stat.totalAmount
        };
    });
    
    res.status(200).json({
        status: 'success',
        data: {
            stats: summary
        }
    });
});

// Bulk apply penalties
exports.bulkApplyPenalties = catchAsync(async (req, res) => {
    const { penaltyIds } = req.body;
    
    if (!penaltyIds || !Array.isArray(penaltyIds)) {
        return res.status(400).json({
            status: 'error',
            message: 'Penalty IDs array is required'
        });
    }
    
    const results = [];
    
    for (const penaltyId of penaltyIds) {
        try {
            const penalty = await Penalty.findById(penaltyId);
            if (penalty && penalty.status === 'PENDING') {
                await penalty.apply(req.user._id);
                results.push({
                    penaltyId,
                    status: 'success',
                    message: 'Applied successfully'
                });
            } else {
                results.push({
                    penaltyId,
                    status: 'error',
                    message: 'Penalty not found or not pending'
                });
            }
        } catch (error) {
            results.push({
                penaltyId,
                status: 'error',
                message: error.message
            });
        }
    }
    
    res.status(200).json({
        status: 'success',
        message: `Processed ${results.length} penalties`,
        data: {
            results
        }
    });
});

// Auto-apply penalty based on booking event
exports.autoApplyPenalty = catchAsync(async (bookingId, penaltyType, reason, amount) => {
    const booking = await Booking.findById(bookingId)
        .populate('provider.id', 'wallet');
    
    if (!booking || !booking.provider?.id) {
        throw new Error('Booking or driver not found');
    }
    
    // Create and auto-apply penalty
    const penalty = await Penalty.create({
        driver: booking.provider.id._id,
        booking: bookingId,
        type: penaltyType,
        amount,
        reason,
        description: `Auto-applied penalty for ${reason}`
    });
    
    // Apply immediately
    await penalty.apply(null); // System applied
    
    return penalty;
});

module.exports = exports;