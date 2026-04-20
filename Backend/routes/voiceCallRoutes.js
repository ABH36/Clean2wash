const express = require('express');
const router = express.Router();
const voiceCallController = require('../controllers/voiceCallController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Voice call routes
router.post('/initiate', voiceCallController.initiateCall);
router.post('/:callId/answer', voiceCallController.answerCall);
router.post('/:callId/reject', voiceCallController.rejectCall);
router.post('/:callId/end', voiceCallController.endCall);
router.get('/:bookingId/history', voiceCallController.getCallHistory);
router.get('/:bookingId/active', voiceCallController.getActiveCall);
router.get('/stats', voiceCallController.getCallStats);

module.exports = router;
