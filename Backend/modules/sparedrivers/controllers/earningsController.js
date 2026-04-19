const Booking = require('../../../models/Booking');
const DriverPayout = require('../../../models/DriverPayout');
const Penalty = require('../../../models/Penalty');
const SpareDriver = require('../../../models/SpareDriver');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');

/**
 * DRIVER EARNINGS CONTROLLER
 * Real-time earnings tracking and history for drivers
 */

// Get driver's current earnings (today)
exports.getTodayEarnings = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get completed bookings for today
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed',
        completedAt: {
            $gte: today,
            $lt: tomorrow
        }
    }).select('bookingId pricing completedAt duration');
    
    // Calculate earnings
    const totalEarnings = bookings.reduce((sum, booking) => {
        return sum + (booking.pricing?.driverEarning || 0);
    }, 0);
    
    const totalTrips = bookings.length;
    const totalHours = bookings.reduce((sum, booking) => {
        return sum + (booking.duration || 0);
    }, 0);
    
    // Get pending penalties for today
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED',
        appliedAt: {
            $gte: today,
            $lt: tomorrow
        }
    });
    
    const totalPenalties = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
    
    // Calculate net earnings
    const netEarnings = totalEarnings - totalPenalties;
    
    res.status(200).json({
        status: 'success',
        data: {
            date: today,
            totalEarnings,
            totalPenalties,
            netEarnings,
            totalTrips,
            totalHours,
            avgEarningPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
            avgEarningPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
            bookings: bookings.map(b => ({
                bookingId: b.bookingId,
                earning: b.pricing?.driverEarning || 0,
                completedAt: b.completedAt,
                duration: b.duration
            }))
        }
    });
});

// Get driver's weekly earnings
exports.getWeeklyEarnings = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    
    // Get start of current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Get completed bookings for this week
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed',
        completedAt: {
            $gte: weekStart,
            $lt: weekEnd
        }
    }).select('bookingId pricing completedAt duration');
    
    // Calculate daily breakdown
    const dailyBreakdown = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dayName = days[date.getDay()];
        
        dailyBreakdown[dayName] = {
            date: date.toISOString().split('T')[0],
            earnings: 0,
            trips: 0,
            hours: 0
        };
    }
    
    bookings.forEach(booking => {
        const completedDate = new Date(booking.completedAt);
        const dayName = days[completedDate.getDay()];
        
        if (dailyBreakdown[dayName]) {
            dailyBreakdown[dayName].earnings += booking.pricing?.driverEarning || 0;
            dailyBreakdown[dayName].trips += 1;
            dailyBreakdown[dayName].hours += booking.duration || 0;
        }
    });
    
    // Get penalties for this week
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED',
        appliedAt: {
            $gte: weekStart,
            $lt: weekEnd
        }
    });
    
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
    const totalTrips = bookings.length;
    const totalHours = bookings.reduce((sum, b) => sum + (b.duration || 0), 0);
    
    res.status(200).json({
        status: 'success',
        data: {
            weekStart,
            weekEnd,
            totalEarnings,
            totalPenalties,
            netEarnings: totalEarnings - totalPenalties,
            totalTrips,
            totalHours,
            avgEarningPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
            avgEarningPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
            dailyBreakdown
        }
    });
});

// Get driver's monthly earnings
exports.getMonthlyEarnings = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    const { month, year } = req.query;
    
    // Default to current month
    const targetDate = new Date();
    if (year) targetDate.setFullYear(parseInt(year));
    if (month) targetDate.setMonth(parseInt(month) - 1);
    
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Get completed bookings for this month
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed',
        completedAt: {
            $gte: monthStart,
            $lte: monthEnd
        }
    }).select('bookingId pricing completedAt duration service');
    
    // Calculate weekly breakdown
    const weeklyBreakdown = [];
    let currentWeekStart = new Date(monthStart);
    
    while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59);
        
        const weekBookings = bookings.filter(b => {
            const completedDate = new Date(b.completedAt);
            return completedDate >= currentWeekStart && completedDate <= weekEnd;
        });
        
        const weekEarnings = weekBookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
        const weekTrips = weekBookings.length;
        const weekHours = weekBookings.reduce((sum, b) => sum + (b.duration || 0), 0);
        
        weeklyBreakdown.push({
            weekStart: currentWeekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            earnings: weekEarnings,
            trips: weekTrips,
            hours: weekHours
        });
        
        currentWeekStart = new Date(weekEnd);
        currentWeekStart.setDate(currentWeekStart.getDate() + 1);
        currentWeekStart.setHours(0, 0, 0, 0);
    }
    
    // Get penalties for this month
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED',
        appliedAt: {
            $gte: monthStart,
            $lte: monthEnd
        }
    });
    
    // Calculate service type breakdown
    const serviceBreakdown = {};
    bookings.forEach(booking => {
        const serviceType = booking.service?.metadata?.serviceType || 'unknown';
        if (!serviceBreakdown[serviceType]) {
            serviceBreakdown[serviceType] = {
                trips: 0,
                earnings: 0,
                hours: 0
            };
        }
        serviceBreakdown[serviceType].trips += 1;
        serviceBreakdown[serviceType].earnings += booking.pricing?.driverEarning || 0;
        serviceBreakdown[serviceType].hours += booking.duration || 0;
    });
    
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
    const totalTrips = bookings.length;
    const totalHours = bookings.reduce((sum, b) => sum + (b.duration || 0), 0);
    
    res.status(200).json({
        status: 'success',
        data: {
            month: targetDate.getMonth() + 1,
            year: targetDate.getFullYear(),
            monthStart,
            monthEnd,
            totalEarnings,
            totalPenalties,
            netEarnings: totalEarnings - totalPenalties,
            totalTrips,
            totalHours,
            avgEarningPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
            avgEarningPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
            weeklyBreakdown,
            serviceBreakdown
        }
    });
});

// Get earnings history with pagination
exports.getEarningsHistory = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        serviceType
    } = req.query;
    
    const query = {
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed'
    };
    
    if (startDate || endDate) {
        query.completedAt = {};
        if (startDate) query.completedAt.$gte = new Date(startDate);
        if (endDate) query.completedAt.$lte = new Date(endDate);
    }
    
    if (serviceType) {
        query['service.metadata.serviceType'] = serviceType;
    }
    
    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
        .select('bookingId pricing completedAt duration service consumer')
        .populate('consumer', 'name phone')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    const earnings = bookings.map(booking => ({
        bookingId: booking.bookingId,
        serviceType: booking.service?.metadata?.serviceType || 'unknown',
        earning: booking.pricing?.driverEarning || 0,
        baseAmount: booking.pricing?.baseAmount || 0,
        commission: booking.pricing?.platformCommission || 0,
        completedAt: booking.completedAt,
        duration: booking.duration,
        customer: {
            name: booking.consumer?.name,
            phone: booking.consumer?.phone
        }
    }));
    
    res.status(200).json({
        status: 'success',
        results: earnings.length,
        data: {
            earnings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get earnings summary (all-time)
exports.getEarningsSummary = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    
    // Get all completed bookings
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed'
    }).select('pricing completedAt duration');
    
    // Get all applied penalties
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED'
    });
    
    // Get all payouts
    const payouts = await DriverPayout.find({
        driver: driverId,
        status: { $in: ['COMPLETED', 'PROCESSING'] }
    });
    
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidOut = payouts.reduce((sum, p) => sum + p.payoutAmount, 0);
    const totalTrips = bookings.length;
    const totalHours = bookings.reduce((sum, b) => sum + (b.duration || 0), 0);
    
    // Calculate pending payout (current week earnings not yet paid)
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const currentWeekBookings = bookings.filter(b => new Date(b.completedAt) >= weekStart);
    const currentWeekEarnings = currentWeekBookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
    const currentWeekPenalties = penalties.filter(p => new Date(p.appliedAt) >= weekStart).reduce((sum, p) => sum + p.amount, 0);
    const pendingPayout = currentWeekEarnings - currentWeekPenalties;
    
    res.status(200).json({
        status: 'success',
        data: {
            lifetime: {
                totalEarnings,
                totalPenalties,
                netEarnings: totalEarnings - totalPenalties,
                totalPaidOut,
                totalTrips,
                totalHours,
                avgEarningPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
                avgEarningPerHour: totalHours > 0 ? totalEarnings / totalHours : 0
            },
            currentWeek: {
                earnings: currentWeekEarnings,
                penalties: currentWeekPenalties,
                netEarnings: pendingPayout,
                trips: currentWeekBookings.length
            },
            pendingPayout,
            lastPayoutDate: payouts.length > 0 ? payouts[payouts.length - 1].processedAt : null
        }
    });
});

// Get payout history
exports.getPayoutHistory = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    const {
        page = 1,
        limit = 20,
        status
    } = req.query;
    
    const query = { driver: driverId };
    if (status) query.status = status.toUpperCase();
    
    const skip = (page - 1) * limit;
    
    const payouts = await DriverPayout.find(query)
        .select('payoutPeriod totalEarnings totalPenalties payoutAmount status transactionId processedAt')
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

// Request early payout (withdrawal)
exports.requestWithdrawal = catchAsync(async (req, res) => {
    const driverId = req.user._id;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Valid withdrawal amount is required'
        });
    }
    
    // Get driver's current week earnings
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
        'provider.id': driverId,
        'service.type': 'sparedriver',
        status: 'completed',
        completedAt: { $gte: weekStart }
    });
    
    const penalties = await Penalty.find({
        driver: driverId,
        status: 'APPLIED',
        appliedAt: { $gte: weekStart }
    });
    
    const currentEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.driverEarning || 0), 0);
    const currentPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
    const availableAmount = currentEarnings - currentPenalties;
    
    if (amount > availableAmount) {
        return res.status(400).json({
            status: 'error',
            message: `Insufficient earnings. Available: ₹${availableAmount}`,
            data: {
                availableAmount,
                requestedAmount: amount
            }
        });
    }
    
    // Create withdrawal request (as a special payout)
    const weekEnd = new Date();
    const payout = await DriverPayout.create({
        driver: driverId,
        payoutPeriod: {
            start: weekStart,
            end: weekEnd
        },
        trips: bookings.map(b => ({
            booking: b._id,
            amount: b.pricing?.finalAmount || 0,
            commission: b.pricing?.platformCommission || 0,
            earning: b.pricing?.driverEarning || 0,
            completedAt: b.completedAt
        })),
        penalties: penalties.map(p => ({
            penalty: p._id,
            amount: p.amount,
            reason: p.reason
        })),
        payoutAmount: amount,
        status: 'PENDING',
        notes: `Early withdrawal request: ${reason || 'Driver requested early payout'}`
    });
    
    payout.calculatePayout();
    await payout.save();
    
    res.status(201).json({
        status: 'success',
        message: 'Withdrawal request submitted successfully. Admin will process it shortly.',
        data: {
            payout
        }
    });
});

module.exports = exports;