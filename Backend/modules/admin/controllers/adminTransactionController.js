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
    const { adjustWalletHold } = require('../../../utils/walletHelper');

    const transaction = await WalletTransaction.findById(id);
    if (!transaction) {
        return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    }

    // Protection: Don't update already finalized transactions
    if (['completed', 'rejected'].includes(transaction.status)) {
        return res.status(400).json({ status: 'fail', message: `Transaction is already ${transaction.status}` });
    }

    const oldStatus = transaction.status;

    // --- WITHDRAWAL PROTOCOL (CRITICAL: Handle Held Balance) ---
    if (transaction.category === 'WITHDRAWAL') {
        const userId = transaction.user;
        let modelToUse = User;
        let userInstance = await User.findById(userId);
        if (!userInstance) {
            userInstance = await Captain.findById(userId);
            modelToUse = Captain;
        }
        if (!userInstance) {
            userInstance = await SpareDriver.findById(userId);
            modelToUse = SpareDriver;
        }

        if (status === 'completed') {
            // Confirm Payout: Consume the held amount
            await adjustWalletHold(userId, transaction.amount, 'consume', {
                category: 'WITHDRAWAL',
                description: `Withdrawal successfully settled to bank. UTR: ${utr || 'N/A'}`,
                referenceId: transaction.referenceId,
                referenceType: 'withdrawal_success'
            }, null, modelToUse);
        } else if (status === 'rejected' || status === 'failed') {
            // Reject Payout: Release the held amount back to user's available balance
            await adjustWalletHold(userId, transaction.amount, 'release', {
                category: 'REFUND',
                description: `Rejected withdrawal request. Funds released back to wallet. Note: ${adminNote || 'Policy violation'}`,
                referenceId: transaction.referenceId,
                referenceType: 'withdrawal_rejection'
            }, null, modelToUse);
        }
    }

    transaction.status = status;
    if (adminNote) transaction.description += ` | Admin Note: ${adminNote}`;
    if (utr) {
        transaction.metaData = transaction.metaData || {};
        transaction.metaData.utr = utr;
        transaction.description += ` | UTR: ${utr}`;
    }
    await transaction.save();

    // --- NOTIFICATION PROTOCOL ---
    const { sendNotification } = require('../../../utils/notificationService');
    if (transaction.category === 'WITHDRAWAL') {
        const userId = transaction.user;
        let title = '';
        let message = '';
        let type = 'payment';

        if (status === 'completed') {
            title = 'Payout Disbursed 💰';
            message = `Your withdrawal of INR ${transaction.amount} has been successfully transferred to your bank. UTR: ${utr || 'Processed'}.`;
        } else if (status === 'rejected') {
            title = 'Withdrawal Rejected ⚠️';
            message = `Request for INR ${transaction.amount} was not approved. Reason: ${adminNote || 'Policy violation'}. Funds returned to wallet.`;
            type = 'alert';
        }

        if (title) {
            await sendNotification(userId, {
                title,
                message,
                type,
                priority: 'high',
                metaData: { transactionId: transaction._id, amount: transaction.amount, status }
            }).catch(err => console.error('Notification error:', err));
        }
    }

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

// @desc    Get detailed financial analytics
// @route   GET /api/admin/transactions/analytics
// @access  Private (Admin)
exports.getFinancialAnalytics = catchAsync(async (req, res, next) => {
    // 1. Calculate Total Revenue (all completed credits from customers)
    const revenueStats = await WalletTransaction.aggregate([
        {
            $match: {
                category: { $in: ['BOOKING_PAYMENT', 'ADD_FUNDS'] },
                type: 'credit',
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    // 2. Calculate Total Payouts (all completed withdrawals to drivers)
    const payoutStats = await WalletTransaction.aggregate([
        {
            $match: {
                category: 'WITHDRAWAL',
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    // 3. Daily Earnings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyEarnings = await WalletTransaction.aggregate([
        {
            $match: {
                type: 'credit',
                status: 'completed',
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: '$amount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const totalRevenue = revenueStats[0]?.total || 0;
    const totalPayouts = payoutStats[0]?.total || 0;
    const profitMargin = totalRevenue > 0 ? (((totalRevenue - totalPayouts) / totalRevenue) * 100).toFixed(1) : 0;

    res.status(200).json({
        status: 'success',
        data: {
            totalRevenue,
            totalPayouts,
            profitMargin,
            dailyEarnings: dailyEarnings.map(d => ({ date: d._id, revenue: d.revenue })),
            activeTransactions: await WalletTransaction.countDocuments({ status: 'pending' }),
            commissionRate: 15 // Standard platform commission
        }
    });
});
