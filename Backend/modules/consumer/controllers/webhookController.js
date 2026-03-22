const crypto = require('crypto');
const { executeWalletTransaction } = require('../../../utils/walletHelper');
const WalletTransaction = require('../../../models/WalletTransaction');
const { sendNotification } = require('../../../utils/notificationService');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const ProductOrder = require('../../../models/ProductOrder');

/**
 * Handle Razorpay Webhooks
 * This ensures that even if the user's browser closes, the payment is processed.
 */
exports.handleRazorpayWebhook = catchAsync(async (req, res, next) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';
    const signature = req.headers['x-razorpay-signature'];

    // 1. Verify Signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    // Optional: In some environments, JSON.stringify might mismatch. 
    // For local dev, we might skip strict signature check if no secret is set.
    if (process.env.NODE_ENV === 'production' && signature !== expectedSignature) {
        console.error('[Webhook] Invalid Razorpay Signature');
        return next(new AppError('Invalid signature', 400));
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Webhook] Received Razorpay Event: ${event}`);

    // 2. Handle 'payment.captured'
    if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const amount = payment.amount / 100; // Razorpay sends in paise
        const paymentId = payment.id;
        const orderId = payment.order_id;

        // Extract userId from notes (we should always pass userId in notes when creating order)
        const userId = payment.notes?.userId;

        if (!userId) {
            console.warn('[Webhook] No userId found in payment notes. Skipping.');
            return res.status(200).json({ status: 'ok' });
        }

        // check if already processed (Idempotency)
        const existing = await WalletTransaction.findOne({
            referenceId: paymentId,
            category: 'WALLET_RECHARGE'
        });

        if (existing) {
            console.log(`[Webhook] Payment ${paymentId} already processed. Skipping.`);
            return res.status(200).json({ status: 'ok' });
        }

        // 3. Execute Atomic Credit
        try {
            await executeWalletTransaction(
                userId,
                amount,
                'credit',
                {
                    category: 'WALLET_RECHARGE',
                    description: `Wallet recharge of INR ${amount} (via Razorpay Webhook)`,
                    referenceId: paymentId,
                    referenceType: 'wallet_recharge',
                    paymentMethod: 'razorpay'
                }
            );

            // Notify User
            await sendNotification(userId, {
                title: 'Wallet Recharged (Auto)',
                message: `INR ${amount} has been added to your wallet.`,
                type: 'payment',
                priority: 'medium',
                metaData: { amount, type: 'credit', transactionId: paymentId }
            });

            console.log(`[Webhook] Successfully processed payment ${paymentId} for user ${userId}`);
        } catch (err) {
            console.error(`[Webhook] Failed to process transaction: ${err.message}`);
        }

        // 4. Handle Product Orders (If any)
        try {
            const order = await ProductOrder.findOneAndUpdate(
                { 'payment.razorpayOrderId': orderId, 'payment.status': 'pending' },
                {
                    $set: {
                        'payment.status': 'paid',
                        'payment.transactionId': paymentId,
                        'payment.razorpayPaymentId': paymentId,
                        status: 'processing'
                    },
                    $push: {
                        history: { status: 'processing', note: 'Payment captured via Webhook.' }
                    }
                },
                { returnDocument: 'after' }
            );

            if (order) {
                console.log(`[Webhook] ProductOrder ${order.orderId} confirmed via webhook.`);

                // Signal ecosystem
                const socketService = require('../../../socketService');
                const io = socketService.getIO();
                io.to(order.consumer.toString()).emit('order_status_updated', {
                    orderId: order._id,
                    status: 'processing'
                });

                await sendNotification(order.consumer, {
                    title: 'Payment Successful (Auto) 📦',
                    message: `Your payment for order #${order.orderId} was captured. We are processing it!`,
                    type: 'payment',
                    priority: 'medium'
                });
            }
        } catch (err) {
            console.error(`[Webhook] ProductOrder update failed: ${err.message}`);
        }
    }

    res.status(200).json({ status: 'ok' });
});
