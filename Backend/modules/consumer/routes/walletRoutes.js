const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../../../middlewares/authMiddleware');

// Base route: /api/consumer/wallet
router.use(protect); // Ensure user is logged in

// Get Wallet Balance & Top 50 Txns
router.get('/', walletController.getWallet);

// Razorpay Wallet Recharge Flow
router.post('/create-order', walletController.createWalletOrder);
router.post('/verify-payment', walletController.verifyWalletPayment);

// Withdraw funds
router.post('/withdraw', walletController.withdrawMoney);

module.exports = router;
