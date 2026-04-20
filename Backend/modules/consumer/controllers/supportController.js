const SupportTicket = require('../../../models/SupportTicket');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Create support ticket
exports.createTicket = catchAsync(async (req, res, next) => {
    const { category, subject, description, bookingId, priority } = req.body;

    if (!category || !subject || !description) {
        return next(new AppError('Please provide category, subject and description.', 400));
    }

    const ticket = await SupportTicket.create({
        user: req.user.id,
        booking: bookingId,
        category,
        subject,
        description,
        priority: priority || 'medium'
    });

    res.status(201).json({
        status: 'success',
        data: {
            ticket
        }
    });
});

// Get user tickets
exports.getMyTickets = catchAsync(async (req, res, next) => {
    const tickets = await SupportTicket.find({ user: req.user.id })
        .sort('-createdAt')
        .populate('booking', 'bookingId status service');

    res.status(200).json({
        status: 'success',
        results: tickets.length,
        data: {
            tickets
        }
    });
});

// Get single ticket details
exports.getTicket = catchAsync(async (req, res, next) => {
    const ticket = await SupportTicket.findOne({
        _id: req.params.id,
        user: req.user.id
    }).populate('booking');

    if (!ticket) {
        return next(new AppError('No ticket found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            ticket
        }
    });
});
