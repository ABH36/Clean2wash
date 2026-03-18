const WalletTransaction = require('../../../models/WalletTransaction');
const catchAsync = require('../../../utils/catchAsync');

// Get all transactions with filters
exports.getAllTransactions = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20, type, category, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    // Search by description or referenceId
    if (search) {
        query.$or = [
            { description: { $regex: search, $options: 'i' } },
            { referenceId: { $regex: search, $options: 'i' } }
        ];
    }

    const transactions = await WalletTransaction.find(query)
        .populate({
            path: 'user',
            select: 'name email phone role'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await WalletTransaction.countDocuments(query);

    res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: {
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Update transaction status (Admin only)
exports.updateTransactionStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const transaction = await WalletTransaction.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!transaction) {
        return res.status(404).json({
            status: 'fail',
            message: 'Transaction not found'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            transaction
        }
    });
});
