const Penalty = require('../../../models/Penalty');
const SpareDriver = require('../../../models/SpareDriver');
const Consumer = require('../../../models/Consumer');
const Booking = require('../../../models/Booking');
const WalletTransaction = require('../../../models/WalletTransaction');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');

// Get all penalties with filters
exports.getPenalties = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        type,
        driverId,
        startDate,
        endDate,
        search
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (status && status !== 'All') query.status = status.toUpperCase();
    if (type && type !== 'All') query.type = type;
    if (driverId) query.driver = driverId;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    let penalties = await Penalty.find(query)
        .populate({
            path: 'driver',
            select: 'name driverId phone wallet',
            populate: {
                path: 'user',
                select: 'name phone'
            }
        })
        .populate('booking', 'bookingId consumer service pricing')
        .populate('appliedBy', 'name email')
        .populate('waivedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    // Apply search filter if provided
    if (search) {
        const searchTerm = search.toLowerCase();
        penalties = penalties.filter(penalty => {
            const driverName = penalty.driver?.name?.toLowerCase() || 
                             penalty.driver?.user?.name?.toLowerCase() || '';
            const driverPhone = penalty.driver?.phone?.toLowerCase() || 
                              penalty.driver?.user?.phone?.toLowerCase() || '';
            const reason = penalty.reason?.toLowerCase() || '';
            const type = penalty.type?.toLowerCase() || '';
            
            return driverName.includes(searchTerm) || 
                   driverPhone.includes(searchTerm) || 
                   reason.includes(searchTerm) ||
                   type.includes(searchTerm);
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

// Get penalty statistics
exports.getPenaltyStats = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const [statusStats, typeStats, driverCount, customerCount] = await Promise.all([
        Penalty.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]),
        Penalty.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]),
        Penalty.countDocuments({
            ...dateFilter,
            driver: { $exists: true }
        }),
        Penalty.countDocuments({
            ...dateFilter,
            driver: { $exists: false }
        })
    ]);
    
    // Format stats
    const summary = {
        totalPenalties: 0,
        totalAmount: 0,
        driverPenalties: driverCount,
        customerPenalties: customerCount,
        byStatus: {
            PENDING: { count: 0, amount: 0 },
            APPLIED: { count: 0, amount: 0 },
            WAIVED: { count: 0, amount: 0 },
            DISPUTED: { count: 0, amount: 0 }
        },
        byType: {}
    };
    
    statusStats.forEach(stat => {
        summary.totalPenalties += stat.count;
        summary.totalAmount += stat.totalAmount;
        if (summary.byStatus[stat._id]) {
            summary.byStatus[stat._id] = {
                count: stat.count,
                amount: stat.totalAmount
            };
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
        data: summary
    });
});

// Create new penalty
exports.addPenalty = catchAsync(async (req, res) => {
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
    
    // Find user by ID or phone
    let user;
    if (userType === 'driver') {
        // Try to find by ID first, then by phone
        user = await SpareDriver.findById(userId) || 
               await SpareDriver.findOne({ phone: userId }) ||
               await SpareDriver.findOne({ driverId: userId });
    } else if (userType === 'customer') {
        user = await Consumer.findById(userId) || 
               await Consumer.findOne({ phone: userId });
    }
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: `${userType} not found with ID/phone: ${userId}`
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
    
    // Create penalty data
    const penaltyData = {
        type,
        amount: parseFloat(amount),
        reason,
        description: description || `Manual penalty: ${reason}`
    };
    
    if (userType === 'driver') {
        penaltyData.driver = user._id;
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
    if (bookingId) {
        await penalty.populate('booking', 'bookingId');
    }
    
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
    
    await penalty.populate('driver', 'name driverId phone');
    
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
    
    await penalty.populate('driver', 'name driverId phone');
    
    res.status(200).json({
        status: 'success',
        message: 'Penalty waived successfully',
        data: {
            penalty
        }
    });
});

// Update penalty status
exports.updatePenaltyStatus = catchAsync(async (req, res) => {
    const { status, reason } = req.body;
    
    const penalty = await Penalty.findById(req.params.id);
    
    if (!penalty) {
        return res.status(404).json({
            status: 'error',
            message: 'Penalty not found'
        });
    }
    
    if (status === 'APPLIED' && penalty.status === 'PENDING') {
        await penalty.apply(req.user._id);
    } else if (status === 'WAIVED') {
        if (!reason) {
            return res.status(400).json({
                status: 'error',
                message: 'Waiver reason is required'
            });
        }
        await penalty.waive(req.user._id, reason);
    } else {
        penalty.status = status;
        await penalty.save();
    }
    
    await penalty.populate('driver', 'name driverId phone');
    
    res.status(200).json({
        status: 'success',
        message: 'Penalty status updated successfully',
        data: {
            penalty
        }
    });
});

// Get penalty types and amounts (for frontend dropdowns)
exports.getPenaltyTypes = catchAsync(async (req, res) => {
    const penaltyTypes = [
        {
            value: 'CANCELLATION_BEFORE_TRIP',
            label: 'Cancellation Before Trip',
            defaultAmount: {
                customer: 50,
                driver: 100
            }
        },
        {
            value: 'CANCELLATION_AFTER_START',
            label: 'Cancellation After Trip Start',
            defaultAmount: {
                customer: 100,
                driver: 200
            }
        },
        {
            value: 'NO_SHOW',
            label: 'No Show',
            defaultAmount: {
                customer: 0,
                driver: 300
            }
        },
        {
            value: 'LATE_ARRIVAL',
            label: 'Late Arrival',
            defaultAmount: {
                customer: 0,
                driver: 150
            }
        },
        {
            value: 'CUSTOMER_COMPLAINT',
            label: 'Customer Complaint',
            defaultAmount: {
                customer: 0,
                driver: 200
            }
        },
        {
            value: 'DOCUMENT_VIOLATION',
            label: 'Document Violation',
            defaultAmount: {
                customer: 0,
                driver: 500
            }
        },
        {
            value: 'BEHAVIOR_VIOLATION',
            label: 'Behavior Violation',
            defaultAmount: {
                customer: 0,
                driver: 1000
            }
        },
        {
            value: 'SAFETY_VIOLATION',
            label: 'Safety Violation',
            defaultAmount: {
                customer: 0,
                driver: 2000
            }
        },
        {
            value: 'OTHER',
            label: 'Other',
            defaultAmount: {
                customer: 0,
                driver: 100
            }
        }
    ];
    
    res.status(200).json({
        status: 'success',
        data: {
            penaltyTypes
        }
    });
});

module.exports = exports;