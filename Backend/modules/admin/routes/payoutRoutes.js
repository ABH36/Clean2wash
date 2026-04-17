const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/adminPayoutController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin'));

// Payout routes
router.get('/', payoutController.getAllPayouts);
router.get('/stats', payoutController.getPayoutStats);
router.post('/generate', payoutController.generatePayout);
router.post('/generate-all', payoutController.generateAllPayouts);
router.get('/:id', payoutController.getPayout);
router.post('/:id/adjustment', payoutController.addAdjustment);
router.post('/:id/process', payoutController.processPayout);

module.exports = router;
