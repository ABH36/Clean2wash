const User = require('../../../models/User');
const WalletTransaction = require('../../../models/WalletTransaction');
const crypto = require('crypto');
const razorpay = require('../../../config/razorpay');
const { executeWalletTransaction, getWalletSnapshot } = require('../../../utils/walletHelper');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const ensureWallet = (user) => {
    if (!user.wallet) {
        user.wallet = { balance: 0, lastUpdated: new Date() };
    }
    if (typeof user.wallet.balance !== 'number') {
        user.wallet.balance = 0;
    }
    if (typeof user.wallet.heldBalance !== 'number') {
        user.wallet.heldBalance = 0;
    }
};

// Get wallet balance and transaction history
exports.getWallet = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).select('wallet');
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    ensureWallet(user);

    const walletSnapshot = getWalletSnapshot(user.wallet);
    const transactions = await WalletTransaction.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        status: 'success',
        data: {
            wallet: {
                ...(user.wallet.toObject?.() || user.wallet),
                balance: walletSnapshot.availableBalance,
                availableBalance: walletSnapshot.availableBalance,
                heldBalance: walletSnapshot.heldBalance,
                totalBalance: walletSnapshot.totalBalance
            },
            transactions
        }
    });
});

// Create Razorpay Order for Wallet
exports.createWalletOrder = catchAsync(async (req, res, next) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return next(new AppError('Invalid amount.', 400));
    }

    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `recharge_${Date.now()}`,
        payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
        status: 'success',
        data: {
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        }
    });
});

// Verify wallet payment and credit balance
exports.verifyWalletPayment = catchAsync(async (req, res, next) => {
    let errorStep = 'init';
    try {
        errorStep = 'read_payload';
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        errorStep = 'validate_payload';
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new AppError('All payment details are required', 400));
        }

        errorStep = 'load_verification_secret';
        const verificationSecret = razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
        if (!verificationSecret) {
            return next(new AppError('Payment gateway not configured correctly.', 500));
        }

        errorStep = 'verify_signature';
        const generatedSignature = crypto
            .createHmac('sha256', verificationSecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return next(new AppError('Invalid payment signature', 400));
        }

        errorStep = 'check_idempotency';
        // Idempotency guard: if this payment is already credited, return success.
        const existingTransaction = await WalletTransaction.findOne({
            referenceId: razorpay_payment_id,
            category: 'WALLET_RECHARGE',
            status: 'completed'
        });
        if (existingTransaction) {
            const userForExistingTxn = await User.findById(req.user._id).select('wallet');
            return res.status(200).json({
                status: 'success',
                message: 'Payment already verified.',
                data: {
                    balance: userForExistingTxn?.wallet?.balance ?? 0,
                    transaction: existingTransaction
                }
            });
        }

        errorStep = 'fetch_order_from_gateway';
        let amount;
        try {
            const order = await razorpay.orders.fetch(razorpay_order_id);
            amount = order.amount / 100;
        } catch (gatewayError) {
            console.error('Razorpay order fetch failed:', gatewayError);
            return next(new AppError('Unable to verify payment with gateway. Please retry in a minute.', 502));
        }

        errorStep = 'execute_atomic_credit';
        const { balance, transaction } = await executeWalletTransaction(
            req.user._id,
            amount,
            'credit',
            {
                category: 'WALLET_RECHARGE',
                description: `Wallet recharge of INR ${amount} (via Razorpay)`,
                referenceId: razorpay_payment_id,
                referenceType: 'wallet_recharge',
                paymentMethod: 'razorpay'
            }
        );

        errorStep = 'send_notification';
        const { sendNotification } = require('../../../utils/notificationService');
        await sendNotification(req.user._id, {
            title: 'Wallet Recharged',
            message: `INR ${amount} has been successfully added to your wallet.`,
            type: 'payment',
            priority: 'medium',
            metaData: { amount, type: 'credit', transactionId: razorpay_payment_id }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully added INR ${amount} to wallet.`,
            data: {
                balance,
                transaction
            }
        });
    } catch (error) {
        // Duplicate transaction write means payment was already processed.
        if (error?.code === 11000) {
            const existingTransaction = await WalletTransaction.findOne({
                referenceId: req.body?.razorpay_payment_id,
                category: 'WALLET_RECHARGE'
            });
            const user = await User.findById(req.user?._id).select('wallet');
            return res.status(200).json({
                status: 'success',
                message: 'Payment already verified.',
                data: {
                    balance: user?.wallet?.balance ?? 0,
                    transaction: existingTransaction
                }
            });
        }

        // Re-throw to be caught by catchAsync if it's not a duplicate
        throw error;
    }
});

// Withdraw money from wallet (Locks as PENDING for admin approval)
exports.withdrawMoney = catchAsync(async (req, res, next) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return next(new AppError('Invalid amount.', 400));
    }

    // Safety Protocol: Use 'hold' to reserve balance for admin review
    const { balance, heldBalance, totalBalance, transaction } = await adjustWalletHold(
        req.user._id,
        amount,
        'hold',
        {
            category: 'WITHDRAWAL',
            description: `Withdrawal request for INR ${amount} to bank`,
            referenceId: `WDR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            referenceType: 'withdrawal_request',
            paymentMethod: 'bank',
            status: 'pending' 
        }
    );

    const { sendNotification } = require('../../../utils/notificationService');
    await sendNotification(req.user._id, {
        title: 'Withdrawal Pending',
        message: `Your request for INR ${amount} is under review. Funds are reserved.`,
        type: 'payment',
        priority: 'medium',
        metaData: { amount, type: 'debit', status: 'pending', heldBalance }
    });

    res.status(200).json({
        status: 'success',
        message: `Withdrawal request for INR ${amount} submitted and funds reserved.`,
        data: {
            balance,
            heldBalance,
            totalBalance,
            transaction
        }
    });
});

// Internal function to deduct money (Atomic)
exports.deductMoney = async (userId, amount, category, description, referenceId) => {
    const { balance, transaction } = await executeWalletTransaction(
        userId,
        amount,
        'debit',
        {
            category,
            description,
            referenceId,
            paymentMethod: 'wallet'
        }
    );

    const { sendNotification } = require('../../../utils/notificationService');
    await sendNotification(userId, {
        title: 'Wallet Updated',
        message: description || `INR ${amount} deducted from your wallet.`,
        type: 'payment',
        priority: 'medium',
        metaData: { amount, type: 'debit' }
    });

    return transaction;
};

// Internal helper to credit money to wallet (Atomic)
exports.addMoney = async (userId, amount, category, description, referenceId) => {
    const { balance, transaction } = await executeWalletTransaction(
        userId,
        amount,
        'credit',
        {
            category,
            description,
            referenceId,
            paymentMethod: 'wallet'
        }
    );

    const { sendNotification } = require('../../../utils/notificationService');
    await sendNotification(userId, {
        title: 'Wallet Updated',
        message: description || `INR ${amount} added to your wallet.`,
        type: 'payment',
        priority: 'medium',
        metaData: { amount, type: 'credit' }
    });

    return transaction;
};

