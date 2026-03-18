const crypto = require('crypto');
const razorpay = require('../../../config/razorpay');
const { sendNotification } = require('../../../utils/notificationService');

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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'All payment details are required'
            });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('Razorpay secret missing in production');
        }
        // Use development fallback for signature verification if secret missing
        const verificationSecret = secret || 'GkxKRQ2B0U63BKBoayuugS3D';

        const generated_signature = crypto
            .createHmac('sha256', verificationSecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid payment signature'
            });
        }

        // Send notification
        await sendNotification(req.user.id, {
            title: 'Payment Successful ✅',
            message: `Your payment for booking successfully verified. Order ID: ${razorpay_order_id}`,
            type: 'payment',
            priority: 'medium',
            metaData: { orderId: razorpay_order_id, paymentId: razorpay_payment_id }
        });

        // Payment is verified, you can update booking status here
        res.status(200).json({
            status: 'success',
            message: 'Payment verified successfully',
            data: {
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
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
