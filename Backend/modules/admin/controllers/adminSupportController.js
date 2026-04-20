const SupportTicket = require('../../../models/SupportTicket');
const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Get all tickets with filters
exports.getAllTickets = catchAsync(async (req, res, next) => {
    const { status, category, priority, user } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (user) query.user = user;

    const tickets = await SupportTicket.find(query)
        .sort('-createdAt')
        .populate('user', 'name phone email role')
        .populate('booking', 'bookingId status service');

    res.status(200).json({
        status: 'success',
        results: tickets.length,
        data: {
            tickets
        }
    });
});

// Get ticket stats
exports.getTicketStats = catchAsync(async (req, res, next) => {
    const stats = await SupportTicket.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const categoryStats = await SupportTicket.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            statusStats: stats,
            categoryStats
        }
    });
});

// Update ticket status and add response
exports.updateTicket = catchAsync(async (req, res, next) => {
    const { status, message, priority } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
        return next(new AppError('No ticket found with that ID', 404));
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    if (message) {
        ticket.responses.push({
            admin: req.user.id,
            message
        });
    }

    await ticket.save();

    res.status(200).json({
        status: 'success',
        data: {
            ticket
        }
    });
});

// Get single ticket
exports.getTicket = catchAsync(async (req, res, next) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('user')
        .populate('booking')
        .populate('responses.admin', 'name email');

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
