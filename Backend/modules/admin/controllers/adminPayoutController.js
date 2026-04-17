const DriverPayout = require('../../../models/DriverPayout');
const Penalty = require('../../../models/Penalty');
const SpareDriver = require('../../../models/SpareDriver');
const catchAsync = require('../../../utils/catchAsync');

// Get all payouts with filters
exports.getAllPayouts = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        driverId,
        startDate,
        endDate
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (driverId) query.driver = driverId;
    if (startDate || endDate) {
        query['payoutPeriod.start'] = {};
        if (startDate) query['payoutPeriod.start'].$gte = new Date(startDate);
        if (endDate) query['payoutPeriod.start'].$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const payouts = await DriverPayout.find(query)
        .populate('driver', 'name driverId phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await DriverPayout.countDocuments(query);
    
    res.status(200).json({
        status: 'success',
        results: payouts.length,
        data: {
            payouts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get single payout
exports.getPayout = catchAsync(async (req, res) => {
    const payout = await DriverPayout.findById(req.params.id)
        .populate('driver', 'name driverId phone bankDetails upiId')
        .populate('trips.booking')
        .populate('penalties.penalty');
    
    if (!payout) {
        return res.status(404).json({
            status: 'error',
            message: 'Payout not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            payout
        }
    });
});

// Generate weekly payout for driver
exports.generatePayout = catchAsync(async (req, res) => {
    const { driverId, startDate, endDate } = req.body;
    
    if (!driverId || !startDate || !endDate) {
        return res.status(400).json({
            status: 'error',
            message: 'Driver ID, start date, and end date are required'
        });
    }
    
    const payout = await DriverPayout.generateWeeklyPayout(
        driverId,
        new Date(startDate),
        new Date(endDate)
    );
    
    res.status(201).json({
        status: 'success',
        message: 'Payout generated successfully',
        data: {
            payout
        }
    });
});

// Generate payouts for all active drivers
exports.generateAllPayouts = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
        return res.status(400).json({
            status: 'error',
            message: 'Start date and end date are required'
        });
    }
    
    const drivers = await SpareDriver.find({
        status: 'ACTIVE',
        verificationStatus: 'APPROVED'
    }).select('_id');
    
    const results = [];
    
    for (const driver of drivers) {
        try {
            const payout = await DriverPayout.generateWeeklyPayout(
                driver._id,
                new Date(startDate),
                new Date(endDate)
            );
            results.push({
                driverId: driver._id,
                status: 'success',
                payoutId: payout._id,
                amount: payout.payoutAmount
            });
        } catch (error) {
            results.push({
                driverId: driver._id,
                status: 'error',
                error: error.message
            });
        }
    }
    
    res.status(200).json({
        status: 'success',
        message: `Generated payouts for ${results.filter(r => r.status === 'success').length} drivers`,
        data: {
            results
        }
    });
});

// Add adjustment to payout
exports.addAdjustment = catchAsync(async (req, res) => {
    const { type, amount, reason } = req.body;
    
    if (!type || !amount || !reason) {
        return res.status(400).json({
            status: 'error',
            message: 'Type, amount, and reason are required'
        });
    }
    
    const payout = await DriverPayout.findById(req.params.id);
    
    if (!payout) {
        return res.status(404).json({
            status: 'error',
            message: 'Payout not found'
        });
    }
    
    if (payout.status !== 'PENDING') {
        return res.status(400).json({
            status: 'error',
            message: 'Can only add adjustments to pending payouts'
        });
    }
    
    payout.addAdjustment(type, parseFloat(amount), reason, req.user._id);
    await payout.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Adjustment added successfully',
        data: {
            payout
        }
    });
});

// Process payout
exports.processPayout = catchAsync(async (req, res) => {
    const { transactionId } = req.body;
    
    if (!transactionId) {
        return res.status(400).json({
            status: 'error',
            message: 'Transaction ID is required'
        });
    }
    
    const payout = await DriverPayout.findById(req.params.id);
    
    if (!payout) {
        return res.status(404).json({
            status: 'error',
            message: 'Payout not found'
        });
    }
    
    if (payout.status !== 'PENDING') {
        return res.status(400).json({
            status: 'error',
            message: 'Can only process pending payouts'
        });
    }
    
    await payout.process(req.user._id, transactionId);
    
    res.status(200).json({
        status: 'success',
        message: 'Payout processed successfully',
        data: {
            payout
        }
    });
});

// Get payout statistics
exports.getPayoutStats = catchAsync(async (req, res) => {
    const stats = await DriverPayout.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$payoutAmount' }
            }
        }
    ]);
    
    const summary = {
        total: 0,
        pending: { count: 0, amount: 0 },
        processing: { count: 0, amount: 0 },
        completed: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 }
    };
    
    stats.forEach(stat => {
        summary.total += stat.count;
        const status = stat._id.toLowerCase();
        if (summary[status]) {
            summary[status].count = stat.count;
            summary[status].amount = stat.totalAmount;
        }
    });
    
    res.status(200).json({
        status: 'success',
        data: {
            stats: summary
        }
    });
});
