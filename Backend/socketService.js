let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // A user or captain can join a room matching their ID to get personal notifications
            socket.on('join_user_room', (userId) => {
                socket.join(userId);
                console.log(`Socket ${socket.id} joined user room: ${userId}`);
            });

            // Join a booking-specific room for real-time tracking
            socket.on('join_booking_room', (bookingId) => {
                socket.join(bookingId);
                console.log(`Socket ${socket.id} joined booking room: ${bookingId}`);
            });

            // Join the general admin room for broadcast alerts like SOS
            socket.on('join_admin_room', () => {
                socket.join('admin_room');
                console.log(`Socket ${socket.id} joined admin_room`);
            });

            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
