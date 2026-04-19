const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const authMiddleware = require('../../../middleware/authMiddleware');

// Protect all routes - driver only
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('sparedriver'));

// Earnings routes
router.get('/today', earningsController.getTodayEarnings);
router.get('/weekly', earningsController.getWeeklyEarnings);
router.get('/monthly', earningsController.getMonthlyEarnings);
router.get('/history', earningsController.getEarningsHistory);
router.get('/summary', earningsController.getEarningsSummary);

// Payout routes
router.get('/payouts', earningsController.getPayoutHistory);
router.post('/withdraw', earningsController.requestWithdrawal);

module.exports = router;