const Razorpay = require('razorpay');

/**
 * Centered Razorpay Instance Configuration
 * Ensures test keys are not used in production and environment variables are prioritize.
 */
let razorpay = null;

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (keyId && keySecret) {
    razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
} else if (process.env.NODE_ENV !== 'production') {
    // Development fallback - ONLY if not in production
    razorpay = new Razorpay({
        key_id: 'rzp_test_8sYbzHWidwe5Zw',
        key_secret: 'GkxKRQ2B0U63BKBoayuugS3D'
    });
    console.warn('⚠️ RAZORPAY: Using development test keys. Set RAZORPAY_KEY_ID in .env for production.');
} else {
    console.error('❌ RAZORPAY: Production keys missing! Payments will fail.');
}

module.exports = razorpay;
