const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const trackingService = require('../services/advancedTrackingService');
const Booking = require('../models/Booking');

/**
 * Update driver location and calculate ETA
 */
exports.updateLocation = catchAsync(async (req, res, next) => {
    const { bookingId, location } = req.body;

    if (!bookingId || !location || !location.lat || !location.lng) {
        return next(new AppError('Please provide bookingId and location coordinates', 400));
    }

    const tracking = await trackingService.updateBookingTracking(bookingId, location);

    res.status(200).json({
        status: 'success',
        data: { tracking }
    });
});

/**
 * Get current tracking status for a booking
 */
exports.getTrackingStatus = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
        .select('tracking liveTracking status provider location')
        .populate('provider.id', 'name phone photo');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tracking: booking.tracking,
            liveTracking: booking.liveTracking,
            bookingStatus: booking.status,
            provider: booking.provider,
            location: booking.location
        }
    });
});

/**
 * Calculate ETA between two points
 */
exports.calculateETA = catchAsync(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        return next(new AppError('Please provide valid origin and destination coordinates', 400));
    }

    const eta = await trackingService.calculateETA(origin, destination);

    res.status(200).json({
        status: 'success',
        data: { eta }
    });
});

/**
 * Get optimized route with alternatives
 */
exports.getOptimizedRoute = catchAsync(async (req, res, next) => {
    const { origin, destination, waypoints } = req.body;

    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        return next(new AppError('Please provide valid origin and destination coordinates', 400));
    }

    const route = await trackingService.getOptimizedRoute(origin, destination, waypoints || []);

    if (!route) {
        return next(new AppError('Unable to calculate route', 500));
    }

    res.status(200).json({
        status: 'success',
        data: { route }
    });
});

/**
 * Get traffic conditions for a route
 */
exports.getTrafficConditions = catchAsync(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return next(new AppError('Please provide origin and destination', 400));
    }

    const traffic = await trackingService.getTrafficConditions(origin, destination);

    res.status(200).json({
        status: 'success',
        data: { traffic }
    });
});

/**
 * Get navigation instructions
 */
exports.getNavigationInstructions = catchAsync(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return next(new AppError('Please provide origin and destination', 400));
    }

    const navigation = await trackingService.getNavigationInstructions(origin, destination);

    if (!navigation) {
        return next(new AppError('Unable to get navigation instructions', 500));
    }

    res.status(200).json({
        status: 'success',
        data: { navigation }
    });
});

/**
 * Start live tracking for a booking
 */
exports.startLiveTracking = catchAsync(async (req, res, next) => {
    const { bookingId } = req.body;
    const driverId = req.user.id;

    if (!bookingId) {
        return next(new AppError('Please provide bookingId', 400));
    }

    const result = await trackingService.startLiveTracking(bookingId, driverId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Stop live tracking for a booking
 */
exports.stopLiveTracking = catchAsync(async (req, res, next) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return next(new AppError('Please provide bookingId', 400));
    }

    const result = await trackingService.stopLiveTracking(bookingId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Predict arrival time with ML
 */
exports.predictArrivalTime = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;

    const prediction = await trackingService.predictArrivalTime(bookingId);

    if (!prediction) {
        return next(new AppError('Unable to predict arrival time', 500));
    }

    res.status(200).json({
        status: 'success',
        data: { prediction }
    });
});

/**
 * Get distance between two points
 */
exports.calculateDistance = catchAsync(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return next(new AppError('Please provide origin and destination', 400));
    }

    const distance = trackingService.calculateDistance(origin, destination);

    res.status(200).json({
        status: 'success',
        data: {
            distance: distance.toFixed(2),
            unit: 'km'
        }
    });
});
