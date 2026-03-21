const razorpay = require('../../../config/razorpay');
const crypto = require('crypto');
const { sendNotification } = require('../../../utils/notificationService');
const Booking = require('../../../models/Booking');
const socketService = require('../../../socketService');

// Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({
                status: 'error',
                message: 'Payment gateway not configured'
            });
        }

        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Valid amount is required'
            });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise (integers only)
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            status: 'success',
            message: 'Order created successfully',
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'All payment details are required'
            });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || 'GkxKRQ2B0U63BKBoayuugS3D';
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid payment signature'
            });
        }

        // 🛡️ Atomic Persistence Logic
        const booking = await Booking.findOneAndUpdate(
            { $or: [{ _id: bookingId }, { bookingId: bookingId }] },
            {
                $set: {
                    'payment.status': 'paid',
                    'payment.transactionId': razorpay_payment_id,
                    'payment.paidAt': new Date(),
                    'status': 'confirmed' // Or keep as pending if waiting for something else, but 'confirmed' is standard after payment
                }
            },
            { returnDocument: 'after' }
        );

        if (booking) {
            // Signal real-time ecosystem
            socketService.emitToRoom(booking._id.toString(), 'booking_status_updated', {
                bookingId: booking._id,
                status: 'confirmed',
                paymentStatus: 'paid'
            });

            // Notify Admin
            const io = socketService.getIO();
            io.to('admin_room').emit('global_status_update', {
                type: 'payment_received',
                bookingId: booking.bookingId,
                amount: booking.pricing?.totalAmount
            });
        }

        await sendNotification(req.user.id, {
            title: 'Payment Successful ✅',
            message: `Your payment was verified. Booking #${booking?.bookingId || razorpay_order_id} is now confirmed.`,
            type: 'payment',
            priority: 'medium'
        });

        res.status(200).json({
            status: 'success',
            message: 'Payment verified and booking confirmed',
            data: {
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                bookingStatus: booking?.status
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Payment verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Handle Razorpay Webhooks (Emergency Fallback)
exports.handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).send('Invalid Signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured' || event === 'order.paid') {
            const orderId = payload.payment.entity.order_id;
            const paymentId = payload.payment.entity.id;

            // Find booking by transaction_id (which we store as razorpay_order_id initially if needed) 
            // or we might need to store order_id in booking model first
            const booking = await Booking.findOneAndUpdate(
                { 'payment.transactionId': orderId }, // Search by order_id if txId not yet set
                {
                    $set: {
                        'payment.status': 'paid',
                        'payment.transactionId': paymentId,
                        'payment.paidAt': new Date(),
                        'status': 'confirmed'
                    }
                }
            );

            if (booking) console.log(`[Webhook] Payment confirmed for booking ${booking.bookingId}`);
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Get Razorpay Key (for frontend)
exports.getRazorpayKey = (req, res) => {
    try {
        if (!razorpay || !razorpay.key_id) {
            return res.status(500).json({
                status: 'error',
                message: 'Payment gateway not configured'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                key_id: razorpay.key_id
            }
        });
    } catch (error) {
        console.error('Get Razorpay key error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get payment key'
        });
    }
};
