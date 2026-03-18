const User = require('../../../models/User');
const WalletTransaction = require('../../../models/WalletTransaction');
const crypto = require('crypto');
const razorpay = require('../../../config/razorpay');

const ensureWallet = (user) => {
    if (!user.wallet) {
        user.wallet = { balance: 0, lastUpdated: new Date() };
    }
    if (typeof user.wallet.balance !== 'number') {
        user.wallet.balance = 0;
    }
};

// Get wallet balance and transaction history
exports.getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('wallet');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const transactions = await WalletTransaction.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            status: 'success',
            data: {
                wallet: user.wallet || { balance: 0, lastUpdated: new Date() },
                transactions
            }
        });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch wallet info.'
        });
    }
};

// Create Razorpay Order for Wallet
exports.createWalletOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid amount.' });
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
    } catch (error) {
        console.error('Create wallet order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initiate payment.'
        });
    }
};

// Verify wallet payment and credit balance
exports.verifyWalletPayment = async (req, res) => {
    let errorStep = 'init';
    try {
        errorStep = 'read_payload';
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        errorStep = 'validate_payload';
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'All payment details are required'
            });
        }

        errorStep = 'load_verification_secret';
        const verificationSecret = razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
        if (!verificationSecret) {
            return res.status(500).json({
                status: 'error',
                message: 'Payment gateway not configured correctly.'
            });
        }

        errorStep = 'verify_signature';
        const generatedSignature = crypto
            .createHmac('sha256', verificationSecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid payment signature'
            });
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
            return res.status(502).json({
                status: 'error',
                message: 'Unable to verify payment with gateway. Please retry in a minute.'
            });
        }

        errorStep = 'load_user';
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        errorStep = 'update_wallet_balance';
        ensureWallet(user);
        const balanceBefore = user.wallet.balance;
        user.wallet.balance += amount;
        user.wallet.lastUpdated = Date.now();
        await user.save();

        errorStep = 'create_wallet_transaction';
        const transaction = await WalletTransaction.createTransaction({
            user: user._id,
            amount,
            type: 'credit',
            status: 'completed',
            category: 'WALLET_RECHARGE',
            description: `Wallet recharge of INR ${amount} (via Razorpay)`,
            referenceId: razorpay_payment_id,
            referenceType: 'wallet_recharge',
            paymentMethod: 'razorpay',
            balanceBefore,
            balanceAfter: user.wallet.balance
        });

        errorStep = 'send_notification';
        const { sendNotification } = require('../../../utils/notificationService');
        await sendNotification(user._id, {
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
                balance: user.wallet.balance,
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

        console.error('Wallet payment verification error:', {
            errorStep,
            message: error?.message,
            stack: error?.stack,
            razorpay_order_id: req.body?.razorpay_order_id,
            razorpay_payment_id: req.body?.razorpay_payment_id
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorStep
        });
    }
};

// Withdraw money from wallet
exports.withdrawMoney = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid amount.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        ensureWallet(user);
        if (user.wallet.balance < amount) {
            return res.status(400).json({ status: 'error', message: 'Insufficient wallet balance.' });
        }

        const balanceBefore = user.wallet.balance;
        user.wallet.balance -= amount;
        user.wallet.lastUpdated = Date.now();
        await user.save();

        const transaction = await WalletTransaction.createTransaction({
            user: user._id,
            amount,
            type: 'debit',
            status: 'completed',
            category: 'WITHDRAWAL',
            description: `Withdrawal of INR ${amount} to bank`,
            referenceId: `TXN-WDR-${Date.now()}`,
            referenceType: 'withdrawal',
            paymentMethod: 'bank',
            balanceBefore,
            balanceAfter: user.wallet.balance
        });

        const { sendNotification } = require('../../../utils/notificationService');
        await sendNotification(user._id, {
            title: 'Withdrawal Successful',
            message: `INR ${amount} withdrawal process has been initiated.`,
            type: 'payment',
            priority: 'medium',
            metaData: { amount, type: 'debit' }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully withdrawn INR ${amount}.`,
            data: {
                balance: user.wallet.balance,
                transaction
            }
        });
    } catch (error) {
        console.error('Error withdrawing money:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process withdrawal.'
        });
    }
};

// Internal function to deduct money (for use in other controllers)
exports.deductMoney = async (userId, amount, category, description, referenceId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    ensureWallet(user);
    if (user.wallet.balance < amount) {
        throw new Error('Insufficient wallet balance.');
    }

    const balanceBefore = user.wallet.balance;
    user.wallet.balance -= amount;
    user.wallet.lastUpdated = Date.now();
    await user.save();

    const transaction = await WalletTransaction.createTransaction({
        user: userId,
        amount,
        type: 'debit',
        status: 'completed',
        category,
        description,
        referenceId,
        paymentMethod: 'wallet',
        balanceBefore,
        balanceAfter: user.wallet.balance
    });

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

// Internal helper to credit money to wallet (used by refunds and system flows)
exports.addMoney = async (userId, amount, category, description, referenceId) => {
    if (!amount || amount <= 0) {
        throw new Error('Amount should be greater than 0.');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    ensureWallet(user);
    const balanceBefore = user.wallet.balance;
    user.wallet.balance += amount;
    user.wallet.lastUpdated = Date.now();
    await user.save();

    const transaction = await WalletTransaction.createTransaction({
        user: userId,
        amount,
        type: 'credit',
        status: 'completed',
        category,
        description: description || `INR ${amount} credited to wallet`,
        referenceId,
        paymentMethod: 'wallet',
        balanceBefore,
        balanceAfter: user.wallet.balance
    });

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
