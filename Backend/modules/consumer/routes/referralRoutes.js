const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { protect } = require('../controllers/authController');

// All referral routes are protected
router.use(protect);

router.get('/stats', referralController.getReferralStats);

module.exports = router;
