const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const upload = require('../../../middleware/uploadMiddleware');

// All routes are protected by admin auth middleware (applied in parent router)

router.route('/rooms')
    .post(chatController.createRoom)
    .get(chatController.getRooms);

router.route('/rooms/:roomId')
    .get(chatController.getRoom);

router.route('/rooms/:roomId/messages')
    .post(chatController.sendMessage)
    .get(chatController.getMessages);

router.patch('/rooms/:roomId/read', chatController.markAsRead);
router.patch('/rooms/:roomId/close', chatController.closeChat);
router.post('/upload', upload.single('file'), chatController.uploadFile);

module.exports = router;
