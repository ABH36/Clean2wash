const express = require('express');
const router = express.Router();
const penaltyController = require('../controllers/adminPenaltyController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// Penalty management routes
router.get('/', penaltyController.getPenalties);
router.post('/', penaltyController.addPenalty);
router.get('/stats', penaltyController.getPenaltyStats);
router.get('/types', penaltyController.getPenaltyTypes);

// Individual penalty operations
router.patch('/:id/status', penaltyController.updatePenaltyStatus);
router.patch('/:id/apply', penaltyController.applyPenalty);
router.patch('/:id/waive', penaltyController.waivePenalty);

module.exports = router;