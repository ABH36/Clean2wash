/**
 * 🎯 Admin Dispatch Controller
 * 
 * Endpoints for managing dispatch engine and auto-assignment
 */

const dispatchService = require('../../../services/dispatchService');
const Booking = require('../../../models/Booking');
const catchAsync = require('../../../utils/catchAsync');

/**
 * Get dispatch statistics
 * GET /api/admin/dispatch/stats
 */
exports.getDispatchStats = catchAsync(async (req, res) => {
    const stats = await dispatchService.getStats();
    
    if (!stats) {
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dispatch statistics'
        });
    }

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

/**
 * Manually trigger auto-assignment for a specific booking
 * POST /api/admin/dispatch/assign/:bookingId
 */
exports.triggerAutoAssign = catchAsync(async (req, res) => {
    const { bookingId } = req.params;

    const result = await dispatchService.autoAssignBooking(bookingId);

    if (!result.success) {
        return res.status(400).json({
            status: 'fail',
            message: result.message
        });
    }

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            booking: result.booking,
            driver: {
                id: result.driver._id,
                name: result.driver.name,
                phone: result.driver.phone
            }
        }
    });
});

/**
 * Find available drivers for a booking
 * GET /api/admin/dispatch/available-drivers/:bookingId
 */
exports.getAvailableDrivers = catchAsync(async (req, res) => {
    const { bookingId } = req.params;
    const { radius = 15 } = req.query;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
        return res.status(404).json({
            status: 'fail',
            message: 'Booking not found'
        });
    }

    const nearbyDrivers = await dispatchService.findNearbyDrivers(booking, parseInt(radius));
    
    // Check eligibility for each driver
    const driversWithEligibility = await Promise.all(
        nearbyDrivers.map(async (driverData) => {
            const eligibility = await dispatchService.checkDriverEligibility(driverData.driver);
            return {
                driver: {
                    id: driverData.driver._id,
                    name: driverData.driver.name,
                    phone: driverData.driver.phone,
                    driverId: driverData.driver.driverId,
                    reliabilityScore: driverData.reliabilityScore,
                    isOnline: driverData.isOnline,
                    currentLocation: driverData.driver.currentLocation // ✅ Added for Admin Map View
                },
                distance: driverData.distance,
                eligible: eligibility.canAccept,
                reason: eligibility.reason
            };
        })
    );

    res.status(200).json({
        status: 'success',
        results: driversWithEligibility.length,
        data: {
            drivers: driversWithEligibility,
            bookingLocation: booking.location?.address?.coordinates
        }
    });
});

/**
 * Manually process dispatch queue
 * POST /api/admin/dispatch/process-queue
 */
exports.processQueue = catchAsync(async (req, res) => {
    // Trigger queue processing (non-blocking)
    dispatchService.processQueue();

    res.status(200).json({
        status: 'success',
        message: 'Dispatch queue processing triggered'
    });
});

/**
 * Start dispatch queue processor
 * POST /api/admin/dispatch/start
 */
exports.startDispatch = catchAsync(async (req, res) => {
    dispatchService.startQueueProcessor();

    res.status(200).json({
        status: 'success',
        message: 'Dispatch queue processor started'
    });
});

/**
 * Stop dispatch queue processor
 * POST /api/admin/dispatch/stop
 */
exports.stopDispatch = catchAsync(async (req, res) => {
    dispatchService.stopQueueProcessor();

    res.status(200).json({
        status: 'success',
        message: 'Dispatch queue processor stopped'
    });
});

/**
 * Get pending bookings that need assignment
 * GET /api/admin/dispatch/pending-bookings
 */
exports.getPendingBookings = catchAsync(async (req, res) => {
    const pendingBookings = await Booking.find({
        'service.category': 'Chauffeur',
        status: 'pending',
        isActive: true
    })
    .populate('consumer', 'name phone')
    .sort({ createdAt: 1 })
    .limit(50);

    const bookingsWithAge = pendingBookings.map(booking => {
        const age = Date.now() - new Date(booking.createdAt).getTime();
        const ageMinutes = Math.floor(age / 60000);
        
        return {
            ...booking.toObject(),
            age: ageMinutes,
            isStuck: age > 180000 // 3 minutes
        };
    });

    res.status(200).json({
        status: 'success',
        results: bookingsWithAge.length,
        data: {
            bookings: bookingsWithAge
        }
    });
});

/**
 * Get stuck bookings (pending for more than 3 minutes)
 * GET /api/admin/dispatch/stuck-bookings
 */
exports.getStuckBookings = catchAsync(async (req, res) => {
    const stuckBookings = await Booking.find({
        'service.category': 'Chauffeur',
        status: 'pending',
        isActive: true,
        createdAt: { $lte: new Date(Date.now() - 180000) } // 3 minutes ago
    })
    .populate('consumer', 'name phone')
    .sort({ createdAt: 1 });

    const bookingsWithAge = stuckBookings.map(booking => {
        const age = Date.now() - new Date(booking.createdAt).getTime();
        const ageMinutes = Math.floor(age / 60000);
        
        return {
            ...booking.toObject(),
            age: ageMinutes,
            priority: ageMinutes > 10 ? 'CRITICAL' : ageMinutes > 5 ? 'HIGH' : 'MEDIUM'
        };
    });

    res.status(200).json({
        status: 'success',
        results: bookingsWithAge.length,
        data: {
            bookings: bookingsWithAge
        }
    });
});
