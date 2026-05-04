const supportChatService = require('../services/supportChatService');
const ChatRoom = require('../models/ChatRoom');

/**
 * Chat Socket Handler
 * Handles real-time chat events
 */

const chatSocketHandler = (io, socket) => {
    console.log(`💬 Chat socket connected: ${socket.id}`);

    /**
     * Join a chat room
     * Event: 'join_chat_room'
     * Payload: { roomId: string }
     */
    socket.on('join_chat_room', async (data) => {
        try {
            const { roomId } = data;
            
            // Validate room exists
            const room = await ChatRoom.findById(roomId);
            if (!room) {
                socket.emit('chat_error', { message: 'Chat room not found' });
                return;
            }

            // Join the room
            socket.join(roomId);
            console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                userId: socket.userId,
                userName: socket.user.name,
                timestamp: new Date()
            });

            // Send confirmation
            socket.emit('room_joined', { roomId, room });

        } catch (error) {
            console.error('Error joining chat room:', error);
            socket.emit('chat_error', { message: 'Failed to join room' });
        }
    });

    /**
     * Leave a chat room
     * Event: 'leave_chat_room'
     * Payload: { roomId: string }
     */
    socket.on('leave_chat_room', async (data) => {
        try {
            const { roomId } = data;
            
            socket.leave(roomId);
            console.log(`👋 Socket ${socket.id} left room ${roomId}`);

            // Notify others
            socket.to(roomId).emit('user_left', {
                userId: socket.userId,
                userName: socket.user.name,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error leaving chat room:', error);
        }
    });

    /**
     * Send a message
     * Event: 'send_message'
     * Payload: { roomId: string, content: object }
     */
    socket.on('send_message', async (data) => {
        try {
            const { roomId, content } = data;

            // Validate
            if (!roomId || !content) {
                socket.emit('chat_error', { message: 'Invalid message data' });
                return;
            }

            // Create sender object
            const sender = {
                userId: socket.userId,
                userType: socket.userRole === 'admin' ? 'Admin' : (socket.userRole === 'sparedriver' ? 'SpareDriver' : 'User'),
                name: socket.user.name,
                avatar: socket.user.avatar
            };

            // Save message via service
            const message = await supportChatService.sendMessage(roomId, sender, content);

            // Broadcast to all in room (including sender)
            io.to(roomId).emit('new_message', {
                message,
                roomId
            });

            console.log(`📨 Message sent in room ${roomId} by ${socket.user.name}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('chat_error', { message: 'Failed to send message' });
        }
    });

    /**
     * Typing indicator - start
     * Event: 'typing_start'
     * Payload: { roomId: string }
     */
    socket.on('typing_start', (data) => {
        try {
            const { roomId } = data;
            
            // Broadcast to others in room (not sender)
            socket.to(roomId).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                roomId
            });

        } catch (error) {
            console.error('Error in typing_start:', error);
        }
    });

    /**
     * Typing indicator - stop
     * Event: 'typing_stop'
     * Payload: { roomId: string }
     */
    socket.on('typing_stop', (data) => {
        try {
            const { roomId } = data;
            
            // Broadcast to others in room
            socket.to(roomId).emit('user_stopped_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                roomId
            });

        } catch (error) {
            console.error('Error in typing_stop:', error);
        }
    });

    /**
     * Mark messages as read
     * Event: 'mark_as_read'
     * Payload: { roomId: string }
     */
    socket.on('mark_as_read', async (data) => {
        try {
            const { roomId } = data;
            
            // Mark as read via service
            await supportChatService.markAsRead(roomId, socket.userId);

            // Notify others in room
            socket.to(roomId).emit('messages_read', {
                userId: socket.userId,
                roomId,
                timestamp: new Date()
            });

            console.log(`✅ Messages marked as read in room ${roomId} by ${socket.user.name}`);

        } catch (error) {
            console.error('Error marking as read:', error);
            socket.emit('chat_error', { message: 'Failed to mark as read' });
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        console.log(`💬 Chat socket disconnected: ${socket.id}`);
    });
};

module.exports = chatSocketHandler;
