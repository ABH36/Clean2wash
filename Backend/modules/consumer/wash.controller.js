const ErrorResponse = require('../../utils/errorResponse');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');

// @desc    Get all active services
// @route   GET /api/v1/consumer/services
// @access  Public
exports.getServices = async (req, res, next) => {
    try {
        const services = await Service.find({ status: { $ne: 'Draft' } });
        res.status(200).json({
            success: true,
            data: services
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new wash booking
// @route   POST /api/v1/consumer/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        req.body.consumer = req.user.id;

        // Generate a random booking ID like the frontend does
        req.body.bookingId = 'CW-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const booking = await Booking.create(req.body);

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get my bookings
// @route   GET /api/v1/consumer/bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ consumer: req.user.id })
            .populate('service')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};
