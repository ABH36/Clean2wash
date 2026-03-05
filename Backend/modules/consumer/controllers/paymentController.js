const crypto = require('crypto');
const Razorpay = require('razorpay');

// Load environment variables
require('dotenv').config();

// Initialize Razorpay instance only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    // Fallback to hardcoded keys for development
    razorpay = new Razorpay({
        key_id: 'rzp_test_8sYbzHWidwe5Zw',
        key_secret: 'GkxKRQ2B0U63BKBoayuugS3D'
    });
}

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
            amount: amount * 100, // Razorpay expects amount in paise
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

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid payment signature'
            });
        }

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
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw';
        
        res.status(200).json({
            status: 'success',
            data: {
                key_id: keyId
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
