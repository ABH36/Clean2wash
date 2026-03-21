const WalletTransaction = require('../../../models/WalletTransaction');
const catchAsync = require('../../../utils/catchAsync');
const { executeWalletTransaction } = require('../../../utils/walletHelper');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const SpareDriver = require('../../../models/SpareDriver');
const AuditLog = require('../../../models/AuditLog');

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

// @desc    Get financial statistics for settlements
// @route   GET /api/admin/transactions/stats
// @access  Private (Admin)
exports.getSettlementStats = catchAsync(async (req, res, next) => {
    const stats = await WalletTransaction.aggregate([
        {
            $group: {
                _id: { status: '$status', category: '$category' },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {
        pendingWithdrawals: 0,
        totalSettled: 0,
        platformVolume: 0
    };

    stats.forEach(item => {
        if (item._id.category === 'WITHDRAWAL' && item._id.status === 'pending') {
            result.pendingWithdrawals += item.totalAmount;
        }
        if (item._id.category === 'WITHDRAWAL' && item._id.status === 'completed') {
            result.totalSettled += item.totalAmount;
        }
        result.platformVolume += item.totalAmount;
    });

    res.status(200).json({
        status: 'success',
        data: result
    });
});

// Update transaction status (Admin only)
exports.updateTransactionStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, adminNote, utr } = req.body; // status: 'completed', 'rejected', 'failed', utr: 'Unique Transaction Ref'

    const transaction = await WalletTransaction.findById(id);
    if (!transaction) {
        return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    }

    // Protection: Don't update already finalized transactions
    if (['completed', 'rejected'].includes(transaction.status)) {
        return res.status(400).json({ status: 'fail', message: `Transaction is already ${transaction.status}` });
    }

    // Handle Withdrawal Rejection (Refund Hold)
    if (transaction.category === 'WITHDRAWAL' && status === 'rejected') {
        // Use the right model for the refund
        let modelToUse = User;
        let userInstance = await User.findById(transaction.user);
        if (!userInstance) {
            userInstance = await Captain.findById(transaction.user);
            modelToUse = Captain;
        }

        if (userInstance) {
            await executeWalletTransaction(
                userInstance._id,
                transaction.amount,
                'credit',
                {
                    category: 'REFUND',
                    description: `Refund for rejected withdrawal request #${transaction._id.toString().slice(-6).toUpperCase()}`,
                    referenceId: transaction._id.toString(),
                    referenceType: 'refund'
                },
                null, // No external session
                modelToUse
            );
        }
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    if (adminNote) transaction.description += ` | Admin Note: ${adminNote}`;
    if (utr) {
        transaction.metaData = transaction.metaData || {};
        transaction.metaData.utr = utr;
        transaction.description += ` | UTR: ${utr}`;
    }
    await transaction.save();

    // Record in Audit Log
    await AuditLog.create({
        userId: req.user._id,
        action: 'UPDATE_TRANSACTION_STATUS',
        resource: 'WalletTransaction',
        resourceId: transaction._id,
        oldValue: oldStatus,
        newValue: status,
        metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            utr,
            adminNote
        }
    });

    res.status(200).json({
        status: 'success',
        data: { transaction }
    });
});
