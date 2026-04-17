const SpareDriver = require('../../../models/SpareDriver');
const Booking = require('../../../models/Booking');
const catchAsync = require('../../../utils/catchAsync');

// ─── PHASE 1: DRIVER OPERATIONS UPGRADE ──────────────────────────────

// Get All Drivers with Pagination, Search & Filters (ENHANCED)
exports.getAllDrivers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search, 
            status, 
            verificationStatus, 
            isOnline, 
            kitStatus, 
            policeVerification,
            minReliability,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        const query = {};

        // Search engine mapping
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { driverId: { $regex: search, $options: 'i' } }
            ];
        }

        // Filters
        if (status) query.status = status;
        if (verificationStatus) query.verificationStatus = verificationStatus;
        if (kitStatus) query.kitStatus = { $in: kitStatus.split(',') }; 
        if (policeVerification) query.policeVerification = { $in: policeVerification.split(',') };
        if (isOnline !== undefined) query['onlineStatus.isOnline'] = isOnline === 'true';
        if (minReliability) query['reliabilityScore.score'] = { $gte: parseInt(minReliability) };

        const skip = (page - 1) * limit;
        
        // Dynamic sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const drivers = await SpareDriver.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password -bankDetails.accountNumber'); // Never send sensitive credentials

        const total = await SpareDriver.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                drivers,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getAllDrivers error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch drivers',
            error: error.message
        });
    }
};

// Get Full Driver Profile Details
exports.getDriverById = async (req, res) => {
    try {
        const driver = await SpareDriver.findById(req.params.id).select('-password -bankDetails.accountNumber');
        if (!driver) {
            return res.status(404).json({ status: 'error', message: 'Driver not found' });
        }
        
        res.status(200).json({
            status: 'success',
            data: { driver }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Complete Verification and Activate Driver
exports.approveDriver = async (req, res) => {
    try {
        const driverObj = await SpareDriver.findById(req.params.id);
        if (!driverObj) return res.status(404).json({ status: 'error', message: 'Driver not found' });

        // Enforce Verification Constraints
        if (driverObj.kitStatus !== 'COMPLETED') {
            return res.status(400).json({ status: 'error', message: 'Driver kit purchase is not completed.' });
        }
        if (driverObj.policeVerification !== 'VERIFIED') {
            return res.status(400).json({ status: 'error', message: 'Driver police verification is not completed.' });
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: 'APPROVED', status: 'ACTIVE' },
            { new: true, runValidators: true }
        ).select('-password -bankDetails.accountNumber');

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Reject Verification
exports.rejectDriver = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ status: 'error', message: 'Rejection reason is required' });
        }
        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: 'REJECTED', status: 'rejected', rejectionReason: reason },
            { new: true, runValidators: true }
        ).select('-password -bankDetails.accountNumber');

        if (!driver) return res.status(404).json({ status: 'error', message: 'Driver not found' });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Track Kit Onboarding
exports.updateKitStatus = async (req, res) => {
    try {
        const { kitStatus } = req.body;
        if (!['NOT_PURCHASED', 'PENDING', 'COMPLETED'].includes(kitStatus)) {
            return res.status(400).json({ status: 'error', message: 'Invalid kitStatus enum' });
        }
        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { kitStatus },
            { new: true, runValidators: true }
        ).select('-password -bankDetails.accountNumber');
        
        if (!driver) return res.status(404).json({ status: 'error', message: 'Driver not found' });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Track Compliance
exports.updatePoliceVerification = async (req, res) => {
    try {
        const { policeVerification } = req.body;
        if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(policeVerification)) {
            return res.status(400).json({ status: 'error', message: 'Invalid policeVerification enum' });
        }
        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { policeVerification },
            { new: true, runValidators: true }
        ).select('-password -bankDetails.accountNumber');

        if (!driver) return res.status(404).json({ status: 'error', message: 'Driver not found' });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Suspension / Activation (Admin Override)
exports.updateDriverStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status enum. Use ACTIVE or BLOCKED' });
        }
        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select('-password -bankDetails.accountNumber');

        if (!driver) return res.status(404).json({ status: 'error', message: 'Driver not found' });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ─── PHASE 1: NEW ENDPOINTS ──────────────────────────────────────────

// Toggle Online/Offline Status
exports.toggleOnlineStatus = catchAsync(async (req, res) => {
    const { isOnline } = req.body;
    
    if (typeof isOnline !== 'boolean') {
        return res.status(400).json({
            status: 'error',
            message: 'isOnline must be a boolean value'
        });
    }
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    // Update online status
    driver.onlineStatus.isOnline = isOnline;
    driver.lastActive = new Date();
    
    if (isOnline) {
        driver.onlineStatus.lastOnlineAt = new Date();
        driver.onlineStatus.sessionStart = new Date();
    } else {
        driver.onlineStatus.lastOfflineAt = new Date();
        
        // Calculate session duration
        if (driver.onlineStatus.sessionStart) {
            const sessionDuration = Math.floor(
                (Date.now() - driver.onlineStatus.sessionStart) / 60000
            ); // minutes
            driver.updateUtilization('onlineTime', sessionDuration);
        }
    }
    
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                isOnline: driver.onlineStatus.isOnline,
                lastActive: driver.lastActive
            }
        }
    });
});

// Get Driver Availability
exports.getDriverAvailability = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id)
        .select('name driverId availabilitySlots onlineStatus');
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId,
                isOnline: driver.onlineStatus.isOnline,
                availabilitySlots: driver.availabilitySlots
            }
        }
    });
});

// Update Driver Availability Slots
exports.updateAvailability = catchAsync(async (req, res) => {
    const { date, timeSlots, isAvailable } = req.body;
    
    if (!date) {
        return res.status(400).json({
            status: 'error',
            message: 'Date is required'
        });
    }
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    const dateStr = new Date(date).toISOString().split('T')[0];
    const existingSlotIndex = driver.availabilitySlots.findIndex(
        s => new Date(s.date).toISOString().split('T')[0] === dateStr
    );
    
    if (existingSlotIndex >= 0) {
        // Update existing slot
        if (timeSlots) driver.availabilitySlots[existingSlotIndex].timeSlots = timeSlots;
        if (typeof isAvailable === 'boolean') {
            driver.availabilitySlots[existingSlotIndex].isAvailable = isAvailable;
        }
    } else {
        // Add new slot
        driver.availabilitySlots.push({
            date: new Date(date),
            timeSlots: timeSlots || [],
            isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true
        });
    }
    
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            availabilitySlots: driver.availabilitySlots
        }
    });
});

// Get Driver Reliability Score
exports.getReliabilityScore = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id)
        .select('name driverId reliabilityScore');
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId,
                reliabilityScore: driver.reliabilityScore
            }
        }
    });
});

// Recalculate Driver Reliability Score
exports.recalculateReliabilityScore = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id);
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    // Fetch actual booking data
    const bookings = await Booking.find({
        'provider.id': driver._id,
        'service.type': 'sparedriver'
    });
    
    // Update metrics
    driver.reliabilityScore.metrics.totalTrips = bookings.length;
    driver.reliabilityScore.metrics.completedTrips = bookings.filter(
        b => b.status === 'completed'
    ).length;
    driver.reliabilityScore.metrics.cancelledTrips = bookings.filter(
        b => b.status === 'cancelled' && b.cancelledBy === 'provider'
    ).length;
    
    // Calculate score
    const score = driver.calculateReliabilityScore();
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                reliabilityScore: driver.reliabilityScore,
                calculatedScore: score
            }
        }
    });
});

// Get Driver Utilization Stats
exports.getUtilizationStats = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id)
        .select('name driverId utilization onlineStatus');
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    // Calculate utilization percentage
    const todayTotal = driver.utilization.today.activeTime + driver.utilization.today.idleTime;
    const utilizationPercentage = todayTotal > 0
        ? ((driver.utilization.today.activeTime / todayTotal) * 100).toFixed(1)
        : 0;
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId,
                isOnline: driver.onlineStatus.isOnline,
                utilization: driver.utilization,
                utilizationPercentage: parseFloat(utilizationPercentage)
            }
        }
    });
});

// Get Drivers by Availability (for scheduling)
exports.getAvailableDrivers = catchAsync(async (req, res) => {
    const { date, timeSlot } = req.query;
    
    if (!date) {
        return res.status(400).json({
            status: 'error',
            message: 'Date is required'
        });
    }
    
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    // Find drivers with availability on the specified date
    const drivers = await SpareDriver.find({
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        'availabilitySlots.date': {
            $gte: new Date(dateStr),
            $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
        },
        'availabilitySlots.isAvailable': true
    })
    .select('name driverId phone reliabilityScore availabilitySlots onlineStatus currentLocation')
    .sort({ 'reliabilityScore.score': -1 });
    
    // Filter by time slot if provided
    let availableDrivers = drivers;
    if (timeSlot) {
        const { start, end } = JSON.parse(timeSlot);
        availableDrivers = drivers.filter(driver => 
            driver.isAvailableAt(date, { start, end })
        );
    }
    
    res.status(200).json({
        status: 'success',
        results: availableDrivers.length,
        data: {
            drivers: availableDrivers.map(d => ({
                id: d._id,
                name: d.name,
                driverId: d.driverId,
                phone: d.phone,
                reliabilityScore: d.reliabilityScore.score,
                isOnline: d.onlineStatus.isOnline,
                location: d.currentLocation
            }))
        }
    });
});

// ─── PHASE 2: FATIGUE & DUTY CONTROL ENDPOINTS ───────────────────────

// Get Driver Duty Hours
exports.getDutyHours = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id)
        .select('name driverId dutyHours breaks fatigueAlerts');
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    const summary = driver.getDutySummary();
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId
            },
            dutySummary: summary,
            rawData: {
                dutyHours: driver.dutyHours,
                breaks: driver.breaks
            }
        }
    });
});

// Update Duty Limits (Admin Override)
exports.updateDutyLimits = catchAsync(async (req, res) => {
    const { dailyMaxMinutes, weeklyMaxMinutes, mandatoryBreakAfterMinutes, minimumBreakMinutes } = req.body;
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    // Update limits
    if (dailyMaxMinutes !== undefined) {
        driver.dutyHours.limits.dailyMaxMinutes = dailyMaxMinutes;
    }
    if (weeklyMaxMinutes !== undefined) {
        driver.dutyHours.limits.weeklyMaxMinutes = weeklyMaxMinutes;
    }
    if (mandatoryBreakAfterMinutes !== undefined) {
        driver.dutyHours.limits.mandatoryBreakAfterMinutes = mandatoryBreakAfterMinutes;
    }
    if (minimumBreakMinutes !== undefined) {
        driver.dutyHours.limits.minimumBreakMinutes = minimumBreakMinutes;
    }
    
    // Recalculate status with new limits
    driver.updateDutyStatus();
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Duty limits updated successfully',
        data: {
            limits: driver.dutyHours.limits,
            status: driver.dutyHours.status
        }
    });
});

// Record Break (Manual or Automatic)
exports.recordBreak = catchAsync(async (req, res) => {
    const { durationMinutes } = req.body;
    
    if (!durationMinutes || durationMinutes <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Valid break duration in minutes is required'
        });
    }
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    driver.recordBreak(durationMinutes);
    driver.updateDutyStatus();
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Break recorded successfully',
        data: {
            breaks: driver.breaks,
            status: driver.dutyHours.status
        }
    });
});

// Check if Driver Can Accept Booking
exports.checkBookingEligibility = catchAsync(async (req, res) => {
    const driver = await SpareDriver.findById(req.params.id);
    
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    const eligibility = driver.canAcceptBooking();
    
    res.status(200).json({
        status: 'success',
        data: {
            driver: {
                id: driver._id,
                name: driver.name,
                driverId: driver.driverId
            },
            eligibility
        }
    });
});

// Get Overworked Drivers (Admin Alert System)
exports.getOverworkedDrivers = catchAsync(async (req, res) => {
    const { threshold = 80 } = req.query; // Default 80% of daily limit
    
    const drivers = await SpareDriver.find({
        status: 'ACTIVE',
        $or: [
            { 'dutyHours.status.isOverworked': true },
            { 'dutyHours.status.needsBreak': true }
        ]
    })
    .select('name driverId phone dutyHours breaks fatigueAlerts')
    .sort({ 'dutyHours.today.totalMinutes': -1 });
    
    const driversWithSummary = drivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        driverId: driver.driverId,
        phone: driver.phone,
        dutySummary: driver.getDutySummary(),
        recentAlerts: driver.fatigueAlerts
            .filter(a => !a.acknowledged)
            .slice(-3)
    }));
    
    res.status(200).json({
        status: 'success',
        results: driversWithSummary.length,
        data: {
            overworkedDrivers: driversWithSummary
        }
    });
});

// Get Fatigue Alerts
exports.getFatigueAlerts = catchAsync(async (req, res) => {
    const { acknowledged, type } = req.query;
    
    const query = { status: 'ACTIVE' };
    
    const drivers = await SpareDriver.find(query)
        .select('name driverId fatigueAlerts');
    
    let allAlerts = [];
    
    drivers.forEach(driver => {
        driver.fatigueAlerts.forEach(alert => {
            // Filter by acknowledged status
            if (acknowledged !== undefined && alert.acknowledged !== (acknowledged === 'true')) {
                return;
            }
            
            // Filter by type
            if (type && alert.type !== type) {
                return;
            }
            
            allAlerts.push({
                driverId: driver._id,
                driverName: driver.name,
                driverCode: driver.driverId,
                alert: {
                    id: alert._id,
                    type: alert.type,
                    message: alert.message,
                    dutyMinutes: alert.dutyMinutes,
                    triggeredAt: alert.triggeredAt,
                    acknowledged: alert.acknowledged,
                    acknowledgedAt: alert.acknowledgedAt
                }
            });
        });
    });
    
    // Sort by most recent
    allAlerts.sort((a, b) => b.alert.triggeredAt - a.alert.triggeredAt);
    
    res.status(200).json({
        status: 'success',
        results: allAlerts.length,
        data: {
            alerts: allAlerts
        }
    });
});

// Acknowledge Fatigue Alert
exports.acknowledgeFatigueAlert = catchAsync(async (req, res) => {
    const { alertId } = req.body;
    
    if (!alertId) {
        return res.status(400).json({
            status: 'error',
            message: 'Alert ID is required'
        });
    }
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    const alert = driver.fatigueAlerts.id(alertId);
    if (!alert) {
        return res.status(404).json({
            status: 'error',
            message: 'Alert not found'
        });
    }
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Alert acknowledged successfully',
        data: {
            alert
        }
    });
});

// Force Reset Duty Hours (Admin Emergency Override)
exports.forceResetDutyHours = catchAsync(async (req, res) => {
    const { resetType } = req.body; // 'daily' or 'weekly'
    
    if (!['daily', 'weekly'].includes(resetType)) {
        return res.status(400).json({
            status: 'error',
            message: 'resetType must be either "daily" or "weekly"'
        });
    }
    
    const driver = await SpareDriver.findById(req.params.id);
    if (!driver) {
        return res.status(404).json({
            status: 'error',
            message: 'Driver not found'
        });
    }
    
    if (resetType === 'daily') {
        driver.resetDailyDutyHours();
    } else {
        driver.resetWeeklyDutyHours();
    }
    
    driver.updateDutyStatus();
    await driver.save();
    
    res.status(200).json({
        status: 'success',
        message: `${resetType.charAt(0).toUpperCase() + resetType.slice(1)} duty hours reset successfully`,
        data: {
            dutyHours: driver.dutyHours,
            status: driver.dutyHours.status
        }
    });
});
