const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const Booking = require('../models/Booking');

/**
 * Enhanced Socket Service with Robust Error Handling
 * Handles connection drops, reconnection, location updates, and notifications
 */

let io;
const connectedClients = new Map(); // Track connected clients
const locationUpdateQueue = new Map(); // Queue for failed location updates
const notificationQueue = new Map(); // Queue for failed notifications

/**
 * Initialize Socket.IO with enhanced error handling
 */
const init = (httpServer) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL)
        ? (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL).split(',')
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

    io = require('socket.io')(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true
        },
        // Enhanced connection settings
        pingInterval: 25000, // 25s (increased for poor networks)
        pingTimeout: 60000,  // 60s (increased timeout)
        connectTimeout: 45000, // 45s connection timeout
        transports: ['websocket', 'polling'], // Fallback to polling
        allowUpgrades: true,
        perMessageDeflate: false, // Disable compression for speed
        httpCompression: false,
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
    });

    // Redis adapter for scalability (optional)
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        try {
            const redisConfig = process.env.REDIS_URL || {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD
            };

            const pubClient = new Redis(redisConfig);
            const subClient = pubClient.duplicate();

            // Error handling for Redis
            pubClient.on('error', (err) => {
                console.error('[Socket] Redis pub client error:', err.message);
            });

            subClient.on('error', (err) => {
                console.error('[Socket] Redis sub client error:', err.message);
            });

            io.adapter(createAdapter(pubClient, subClient));
            console.log('✅ Socket.io Redis Adapter Initialized');
        } catch (err) {
            console.error('❌ Failed to initialize Redis Adapter:', err.message);
            console.log('⚠️ Continuing without Redis adapter (single-server mode)');
        }
    }

    // Authentication middleware with error handling
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

            if (!token) {
                console.error(`[Socket] Connection denied: No token (${socket.id})`);
                return next(new Error('AUTH_ERROR: No token provided'));
            }

            const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
            const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

            socket.user = decoded;
            socket.userId = decoded.id || decoded._id;
            socket.userRole = decoded.role;

            next();
        } catch (err) {
            console.error(`[Socket] Authentication failed: ${err.message}`);
            return next(new Error(`AUTH_ERROR: ${err.message}`));
        }
    });

    // Connection handler with enhanced error handling
    io.on('connection', (socket) => {
        handleConnection(socket);
    });

    // Global error handler
    io.engine.on('connection_error', (err) => {
        console.error('[Socket] Connection error:', {
            code: err.code,
            message: err.message,
            context: err.context
        });
    });

    return io;
};

/**
 * Handle new socket connection
 */
const handleConnection = (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    console.log(`[Socket] Connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Track connection
    connectedClients.set(socket.id, {
        userId,
        userRole,
        connectedAt: new Date(),
        lastActivity: new Date()
    });

    // Auto-join personal room
    if (userId) {
        socket.join(userId);
        
        const roleRoom = userRole === 'driver' || userRole === 'sparedriver' 
            ? `sparedriver_${userId}` 
            : `user_${userId}`;
        socket.join(roleRoom);

        console.log(`[Socket] ${socket.id} joined rooms: ${userId}, ${roleRoom}`);
    }

    // Send queued notifications on reconnection
    sendQueuedNotifications(socket, userId);

    // Send queued location updates on reconnection
    sendQueuedLocationUpdates(socket, userId);

    // Heartbeat to detect connection health
    setupHeartbeat(socket);

    // Event handlers with error handling
    setupEventHandlers(socket);

    // Disconnect handler
    socket.on('disconnect', (reason) => {
        handleDisconnect(socket, reason);
    });

    // Error handler
    socket.on('error', (error) => {
        console.error(`[Socket] Error on ${socket.id}:`, error);
    });

    // Reconnection handler
    socket.on('reconnect', (attemptNumber) => {
        console.log(`[Socket] ${socket.id} reconnected after ${attemptNumber} attempts`);
        sendQueuedNotifications(socket, userId);
        sendQueuedLocationUpdates(socket, userId);
    });
};

/**
 * Setup event handlers with error handling
 */
const setupEventHandlers = (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Join booking room with error handling
    socket.on('join_booking_room', (bookingId) => {
        try {
            if (!bookingId) {
                socket.emit('error', { message: 'Booking ID required' });
                return;
            }

            socket.join(bookingId);
            socket.join(`booking_${bookingId}`);
            
            console.log(`[Socket] ${socket.id} joined booking: ${bookingId}`);
            socket.emit('joined_booking', { bookingId, success: true });
        } catch (error) {
            console.error(`[Socket] Error joining booking:`, error);
            socket.emit('error', { message: 'Failed to join booking room' });
        }
    });

    // Location update with error handling and queuing
    socket.on('update_location', async (data) => {
        try {
            const { bookingId, location } = data;

            if (!bookingId || !location || !location.lat || !location.lng) {
                socket.emit('location_error', { message: 'Invalid location data' });
                return;
            }

            // Validate user role
            if (!['captain', 'staff', 'vendor', 'sparedriver'].includes(userRole)) {
                socket.emit('location_error', { message: 'Unauthorized' });
                return;
            }

            const normalizedPayload = {
                bookingId,
                lat: location.lat,
                lng: location.lng,
                location,
                accuracy: location.accuracy || null,
                speed: location.speed || null,
                heading: location.heading || null,
                timestamp: new Date(),
                userId,
                userRole
            };

            // Update database with error handling
            try {
                await Booking.findByIdAndUpdate(
                    bookingId,
                    {
                        $set: {
                            'tracking.currentLocation': {
                                lat: location.lat,
                                lng: location.lng,
                                updatedAt: new Date()
                            },
                            'tracking.lastUpdated': new Date()
                        }
                    },
                    { runValidators: false }
                );
            } catch (dbError) {
                console.error(`[Socket] DB update failed for ${bookingId}:`, dbError.message);
                // Continue with socket emission even if DB fails
            }

            // Emit to booking room
            const emitSuccess = socket.to(bookingId).emit('location_updated', normalizedPayload);
            socket.to(bookingId).emit('locationUpdate', normalizedPayload); // Backward compatible

            // Emit to admin room
            io.to('admin_room').emit('specialist_location_pulse', normalizedPayload);

            // Confirm to sender
            socket.emit('location_update_success', { 
                bookingId, 
                timestamp: normalizedPayload.timestamp 
            });

            // Update last activity
            const client = connectedClients.get(socket.id);
            if (client) {
                client.lastActivity = new Date();
            }

        } catch (error) {
            console.error(`[Socket] Location update error:`, error);
            
            // Queue for retry
            queueLocationUpdate(userId, data);
            
            socket.emit('location_error', { 
                message: 'Location update failed, will retry',
                queued: true
            });
        }
    });

    // Consumer location update
    socket.on('update_consumer_location', async (data) => {
        try {
            const { bookingId, location } = data;

            if (!bookingId || !location) {
                socket.emit('location_error', { message: 'Invalid data' });
                return;
            }

            if (userRole !== 'consumer') {
                socket.emit('location_error', { message: 'Unauthorized' });
                return;
            }

            const payload = {
                bookingId,
                location,
                timestamp: new Date(),
                userId
            };

            socket.to(bookingId).emit('consumer_location_updated', payload);
            io.to('admin_room').emit('consumer_location_pulse', payload);

            socket.emit('location_update_success', { bookingId });

        } catch (error) {
            console.error(`[Socket] Consumer location error:`, error);
            socket.emit('location_error', { message: 'Update failed' });
        }
    });

    // Sync Route Path (Driver to Consumer)
    socket.on('update_route_path', (data) => {
        try {
            const { bookingId, path } = data;
            if (!bookingId || !path) return;

            // Broadcast to the booking room so the consumer can see the driver's route
            socket.to(bookingId).emit('route_path_updated', { bookingId, path });
        } catch (error) {
            console.error(`[Socket] Route path sync error:`, error);
        }
    });

    // Chat events with error handling
    socket.on('join_booking', ({ bookingId }) => {
        try {
            socket.join(`booking_${bookingId}`);
            socket.emit('joined_chat', { bookingId });
        } catch (error) {
            console.error(`[Socket] Join chat error:`, error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });

    socket.on('typing', ({ bookingId, userId }) => {
        try {
            socket.to(`booking_${bookingId}`).emit('user_typing', { bookingId, userId });
        } catch (error) {
            console.error(`[Socket] Typing event error:`, error);
        }
    });

    socket.on('stop_typing', ({ bookingId, userId }) => {
        try {
            socket.to(`booking_${bookingId}`).emit('user_stopped_typing', { bookingId, userId });
        } catch (error) {
            console.error(`[Socket] Stop typing error:`, error);
        }
    });

    // Admin room join
    socket.on('join_admin_room', () => {
        try {
            if (userRole === 'admin') {
                socket.join('admin_room');
                socket.emit('joined_admin_room', { success: true });
                console.log(`[Socket] ${socket.id} joined admin_room`);
            } else {
                socket.emit('error', { message: 'Unauthorized' });
            }
        } catch (error) {
            console.error(`[Socket] Admin room join error:`, error);
            socket.emit('error', { message: 'Failed to join admin room' });
        }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });
};

/**
 * Setup heartbeat to detect stale connections
 */
const setupHeartbeat = (socket) => {
    const heartbeatInterval = setInterval(() => {
        const client = connectedClients.get(socket.id);
        
        if (!client) {
            clearInterval(heartbeatInterval);
            return;
        }

        const inactiveTime = Date.now() - client.lastActivity.getTime();
        
        // If inactive for more than 5 minutes, send ping
        if (inactiveTime > 5 * 60 * 1000) {
            socket.emit('heartbeat', { timestamp: Date.now() });
        }
    }, 60000); // Check every minute

    socket.on('heartbeat_ack', () => {
        const client = connectedClients.get(socket.id);
        if (client) {
            client.lastActivity = new Date();
        }
    });

    socket.on('disconnect', () => {
        clearInterval(heartbeatInterval);
    });
};

/**
 * Handle disconnect with cleanup
 */
const handleDisconnect = (socket, reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (Reason: ${reason})`);

    const client = connectedClients.get(socket.id);
    
    if (client) {
        console.log(`[Socket] User ${client.userId} disconnected after ${
            Math.floor((Date.now() - client.connectedAt.getTime()) / 1000)
        }s`);
    }

    connectedClients.delete(socket.id);
};

/**
 * Queue location update for retry
 */
const queueLocationUpdate = (userId, data) => {
    if (!locationUpdateQueue.has(userId)) {
        locationUpdateQueue.set(userId, []);
    }

    const queue = locationUpdateQueue.get(userId);
    queue.push({
        data,
        timestamp: new Date(),
        attempts: 0
    });

    // Keep only last 10 updates
    if (queue.length > 10) {
        queue.shift();
    }
};

/**
 * Send queued location updates on reconnection
 */
const sendQueuedLocationUpdates = async (socket, userId) => {
    const queue = locationUpdateQueue.get(userId);
    
    if (!queue || queue.length === 0) return;

    console.log(`[Socket] Sending ${queue.length} queued location updates to ${userId}`);

    for (const item of queue) {
        try {
            socket.emit('queued_location_update', item.data);
            item.attempts++;
        } catch (error) {
            console.error(`[Socket] Failed to send queued location:`, error);
        }
    }

    // Clear queue after sending
    locationUpdateQueue.delete(userId);
};

/**
 * Queue notification for retry
 */
const queueNotification = (userId, notification) => {
    if (!notificationQueue.has(userId)) {
        notificationQueue.set(userId, []);
    }

    const queue = notificationQueue.get(userId);
    queue.push({
        notification,
        timestamp: new Date(),
        attempts: 0
    });

    // Keep only last 20 notifications
    if (queue.length > 20) {
        queue.shift();
    }
};

/**
 * Send queued notifications on reconnection
 */
const sendQueuedNotifications = (socket, userId) => {
    const queue = notificationQueue.get(userId);
    
    if (!queue || queue.length === 0) return;

    console.log(`[Socket] Sending ${queue.length} queued notifications to ${userId}`);

    for (const item of queue) {
        try {
            socket.emit('queued_notification', item.notification);
            item.attempts++;
        } catch (error) {
            console.error(`[Socket] Failed to send queued notification:`, error);
        }
    }

    // Clear queue after sending
    notificationQueue.delete(userId);
};

/**
 * Send notification with retry logic
 */
const sendNotification = (userId, notification) => {
    try {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }

        const sent = io.to(userId).emit('notification', notification);

        // If no clients in room, queue for later
        const room = io.sockets.adapter.rooms.get(userId);
        if (!room || room.size === 0) {
            console.log(`[Socket] User ${userId} not connected, queuing notification`);
            queueNotification(userId, notification);
            return { success: false, queued: true };
        }

        return { success: true, queued: false };

    } catch (error) {
        console.error(`[Socket] Notification send error:`, error);
        queueNotification(userId, notification);
        return { success: false, queued: true, error: error.message };
    }
};

/**
 * Broadcast to room with error handling
 */
const broadcastToRoom = (room, event, data) => {
    try {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }

        io.to(room).emit(event, data);
        return { success: true };

    } catch (error) {
        console.error(`[Socket] Broadcast error:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Get connected clients count
 */
const getConnectedClientsCount = () => {
    return connectedClients.size;
};

/**
 * Get connected clients by user ID
 */
const getClientsByUserId = (userId) => {
    const clients = [];
    
    for (const [socketId, client] of connectedClients.entries()) {
        if (client.userId === userId) {
            clients.push({ socketId, ...client });
        }
    }
    
    return clients;
};

/**
 * Check if user is connected
 */
const isUserConnected = (userId) => {
    if (!io) return false;
    
    const room = io.sockets.adapter.rooms.get(userId);
    return room && room.size > 0;
};

/**
 * Get IO instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Cleanup old queued items (run periodically)
 */
const cleanupQueues = () => {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    // Cleanup location queue
    for (const [userId, queue] of locationUpdateQueue.entries()) {
        const filtered = queue.filter(item => 
            now - item.timestamp.getTime() < maxAge
        );
        
        if (filtered.length === 0) {
            locationUpdateQueue.delete(userId);
        } else {
            locationUpdateQueue.set(userId, filtered);
        }
    }

    // Cleanup notification queue
    for (const [userId, queue] of notificationQueue.entries()) {
        const filtered = queue.filter(item => 
            now - item.timestamp.getTime() < maxAge
        );
        
        if (filtered.length === 0) {
            notificationQueue.delete(userId);
        } else {
            notificationQueue.set(userId, filtered);
        }
    }

    console.log(`[Socket] Queue cleanup: ${locationUpdateQueue.size} location queues, ${notificationQueue.size} notification queues`);
};

// Run cleanup every hour
setInterval(cleanupQueues, 60 * 60 * 1000);

module.exports = {
    init,
    getIO,
    sendNotification,
    broadcastToRoom,
    getConnectedClientsCount,
    getClientsByUserId,
    isUserConnected,
    queueNotification,
    queueLocationUpdate,
    cleanupQueues
};
