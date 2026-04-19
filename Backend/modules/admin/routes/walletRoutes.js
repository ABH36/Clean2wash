const express = require('express');
const router = express.Router();
const walletController = require('../controllers/adminWalletController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// Wallet management routes
router.get('/', walletController.getWallets);
router.get('/stats', walletController.getWalletStats);

// Individual wallet operations
router.patch('/:userId/adjust', walletController.adjustWallet);
router.patch('/:userId/hold', walletController.holdAmount);
router.patch('/:userId/release', walletController.releaseHold);
router.get('/:userId/transactions', walletController.getWalletTransactions);

module.exports = router;