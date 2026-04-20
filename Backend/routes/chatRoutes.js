const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

// Chat routes
router.post('/send', chatController.sendMessage);
router.get('/:bookingId', chatController.getMessages);
router.get('/unread-count', chatController.getUnreadCount);
router.patch('/:bookingId/read', chatController.markAsRead);
router.post('/location', chatController.sendLocation);
router.post('/quick-reply', chatController.sendQuickReply);
router.get('/active', chatController.getActiveChats);

module.exports = router;
