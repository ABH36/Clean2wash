const express = require('express');
const authController = require('../controllers/authController');
const {
    createOrder,
    verifyPayment,
    getRazorpayKey
} = require('../controllers/paymentController');

const router = express.Router();

// Get Razorpay Key (public endpoint)
router.get('/key', getRazorpayKey);

// Create Order (protected)
router.post('/create-order', authController.protect, createOrder);

// Verify Payment (protected)
router.post('/verify', authController.protect, verifyPayment);

module.exports = router;
