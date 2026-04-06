const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
let io;

module.exports = {
    init: (httpServer) => {
        // Dynamic CORS Logic
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL)
            ? (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL).split(',')
            : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

        io = require('socket.io')(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                credentials: true
            },
            pingInterval: 10000, // 10s
            pingTimeout: 10000,  // 10s
        });

        // 🏗️ Phase 2: Scalability (Redis Adapter)
        // If Redis is configured, use it for horizontal scaling (clustering support)
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
            try {
                const redisConfig = process.env.REDIS_URL || {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD
                };

                const pubClient = new Redis(redisConfig);
                const subClient = pubClient.duplicate();

                io.adapter(createAdapter(pubClient, subClient));
                console.log('✅ Socket.io Redis Adapter Initialized (Ready for Clustering)'.magenta.bold);
            } catch (err) {
                console.error('❌ Failed to initialize Redis Adapter:', err.message);
            }
        }

        // 🛡️ Middleware: Authenticate Socket Connection
        io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

            if (!token) {
                console.error(`Socket connection attempt denied: No token provided.`);
                return next(new Error('Authentication error: No token provided'));
            }

            try {
                // Remove 'Bearer ' if present
                const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
                const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

                // Attach user data to socket
                socket.user = decoded;
                next();
            } catch (err) {
                console.error(`Socket authentication failed: ${err.message}`);
                return next(new Error('Authentication error: Invalid token'));
            }
        });

        io.on('connection', (socket) => {
            const userId = socket.user?.id || socket.user?._id;
            const userRole = socket.user?.role;

            console.log(`Socket connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

            // 🏠 Protocol: Automatically join personal room for notifications
            if (userId) {
                socket.join(userId);
                console.log(`Socket ${socket.id} auto-joined user room: ${userId}`);
            }

            // Join a booking-specific room for real-time tracking
            socket.on('join_booking_room', (bookingId) => {
                socket.join(bookingId);
                console.log(`Socket ${socket.id} joined booking room: ${bookingId}`);
            });

            // Join the general admin room for broadcast alerts like SOS
            socket.on('join_admin_room', () => {
                if (userRole === 'admin') {
                    socket.join('admin_room');
                    console.log(`Socket ${socket.id} joined admin_room`);
                } else {
                    console.warn(`Unauthorized join_admin_room attempt by: ${userId}`);
                }
            });

            // 📍 Real-time GPS Telemetry Stream (Verified)
            socket.on('update_location', (data) => {
                const { bookingId, location } = data;
                if (!bookingId || !location) return;

                // Production Logic: Only allow 'captain' or 'staff' or 'vendor' or 'sparedriver' to update location
                if (userRole === 'captain' || userRole === 'staff' || userRole === 'vendor' || userRole === 'sparedriver') {
                    const normalizedPayload = {
                        bookingId,
                        lat: location.lat,
                        lng: location.lng,
                        location,
                        timestamp: new Date()
                    };

                    // 1. Notify Consumer (Booking Room)
                    socket.to(bookingId).emit('location_updated', normalizedPayload);
                    // Backward-compatible alias for older consumer screens
                    socket.to(bookingId).emit('locationUpdate', normalizedPayload);

                    // 2. Notify Admin Control Tower (Elite Protocol)
                    io.to('admin_room').emit('specialist_location_pulse', {
                        bookingId,
                        lat: location.lat,
                        lng: location.lng,
                        role: userRole,
                        timestamp: new Date()
                    });
                }
            });

            socket.on('update_consumer_location', (data) => {
                const { bookingId, location } = data;
                if (!bookingId || !location) return;

                if (userRole === 'consumer') {
                    socket.to(bookingId).emit('consumer_location_updated', {
                        bookingId,
                        location,
                        timestamp: new Date()
                    });

                    io.to('admin_room').emit('consumer_location_pulse', {
                        bookingId,
                        lat: location.lat,
                        lng: location.lng,
                        role: userRole,
                        timestamp: new Date()
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id} (${userId})`);
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
