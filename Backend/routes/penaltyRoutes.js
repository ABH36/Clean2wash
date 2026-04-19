const express = require('express');
const router = express.Router();
const penaltyController = require('../controllers/penaltyController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Admin-only routes
router.use(restrictTo('admin', 'superadmin'));

// Penalty CRUD routes
router.get('/', penaltyController.getAllPenalties);
router.post('/', penaltyController.createPenalty);
router.get('/stats', penaltyController.getPenaltyStats);

// Bulk operations
router.post('/bulk-apply', penaltyController.bulkApplyPenalties);

// Individual penalty operations
router.get('/:id', penaltyController.getPenalty);
router.patch('/:id/apply', penaltyController.applyPenalty);
router.patch('/:id/waive', penaltyController.waivePenalty);

module.exports = router;