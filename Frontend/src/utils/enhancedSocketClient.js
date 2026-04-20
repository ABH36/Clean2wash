import { io } from 'socket.io-client';

/**
 * Enhanced Socket Client with Robust Error Handling
 * Handles reconnection, queuing, and error recovery
 */

class EnhancedSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.eventQueue = [];
        this.listeners = new Map();
        this.connectionPromise = null;
        this.heartbeatInterval = null;
        this.lastPongTime = null;
    }

    /**
     * Initialize socket connection
     */
    connect(token) {
        if (this.socket && this.isConnected) {
            console.log('[Socket] Already connected');
            return Promise.resolve(this.socket);
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                this.socket = io(serverUrl, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    reconnectionDelay: this.reconnectDelay,
                    reconnectionDelayMax: this.maxReconnectDelay,
                    timeout: 45000,
                    autoConnect: true,
                    forceNew: false,
                    multiplex: true
                });

                this.setupEventHandlers();
                this.setupHeartbeat();

                // Wait for connection
                this.socket.once('connect', () => {
                    console.log('[Socket] Connected:', this.socket.id);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.processEventQueue();
                    resolve(this.socket);
                });

                this.socket.once('connect_error', (error) => {
                    console.error('[Socket] Connection error:', error.message);
                    reject(error);
                });

                // Timeout fallback
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('Connection timeout'));
                    }
                }, 45000);

            } catch (error) {
                console.error('[Socket] Initialization error:', error);
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('[Socket] Connected:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.connectionPromise = null;
            this.processEventQueue();
            this.notifyListeners('connect', { socketId: this.socket.id });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            this.isConnected = false;
            this.notifyListeners('disconnect', { reason });

            // Auto-reconnect for certain reasons
            if (reason === 'io server disconnect') {
                // Server disconnected, manually reconnect
                setTimeout(() => this.socket.connect(), 1000);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.reconnectAttempts++;
            this.notifyListeners('connect_error', { error, attempts: this.reconnectAttempts });

            // Exponential backoff
            const delay = Math.min(
                this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
                this.maxReconnectDelay
            );

            console.log(`[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.processEventQueue();
            this.notifyListeners('reconnect', { attempts: attemptNumber });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`[Socket] Reconnection attempt ${attemptNumber}`);
            this.notifyListeners('reconnect_attempt', { attempts: attemptNumber });
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('[Socket] Reconnection error:', error.message);
            this.notifyListeners('reconnect_error', { error });
        });

        this.socket.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed after max attempts');
            this.notifyListeners('reconnect_failed', {});
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
            this.notifyListeners('error', { error });
        });

        // Queued messages
        this.socket.on('queued_notification', (notification) => {
            console.log('[Socket] Received queued notification');
            this.notifyListeners('notification', notification);
        });

        this.socket.on('queued_location_update', (data) => {
            console.log('[Socket] Received queued location update');
            this.notifyListeners('location_updated', data);
        });

        // Heartbeat
        this.socket.on('heartbeat', (data) => {
            this.socket.emit('heartbeat_ack');
        });

        this.socket.on('pong', (data) => {
            this.lastPongTime = Date.now();
            const latency = this.lastPongTime - data.timestamp;
            this.notifyListeners('latency', { latency });
        });

        // Success confirmations
        this.socket.on('location_update_success', (data) => {
            this.notifyListeners('location_update_success', data);
        });

        this.socket.on('location_error', (error) => {
            console.error('[Socket] Location error:', error);
            this.notifyListeners('location_error', error);
        });
    }

    /**
     * Setup heartbeat to monitor connection health
     */
    setupHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('ping');

                // Check if pong received within 10 seconds
                setTimeout(() => {
                    if (this.lastPongTime && Date.now() - this.lastPongTime > 10000) {
                        console.warn('[Socket] Connection may be stale, reconnecting...');
                        this.socket.disconnect();
                        this.socket.connect();
                    }
                }, 10000);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Emit event with queuing for offline scenarios
     */
    emit(event, data, options = {}) {
        const { queue = true, timeout = 5000 } = options;

        return new Promise((resolve, reject) => {
            if (!this.socket) {
                const error = new Error('Socket not initialized');
                if (queue) {
                    this.queueEvent(event, data);
                    resolve({ queued: true });
                } else {
                    reject(error);
                }
                return;
            }

            if (!this.isConnected) {
                if (queue) {
                    this.queueEvent(event, data);
                    resolve({ queued: true });
                } else {
                    reject(new Error('Socket not connected'));
                }
                return;
            }

            try {
                this.socket.emit(event, data);
                resolve({ success: true });
            } catch (error) {
                console.error(`[Socket] Emit error for ${event}:`, error);
                if (queue) {
                    this.queueEvent(event, data);
                    resolve({ queued: true });
                } else {
                    reject(error);
                }
            }
        });
    }

    /**
     * Queue event for later emission
     */
    queueEvent(event, data) {
        this.eventQueue.push({
            event,
            data,
            timestamp: Date.now()
        });

        // Keep only last 50 events
        if (this.eventQueue.length > 50) {
            this.eventQueue.shift();
        }

        console.log(`[Socket] Queued event: ${event} (Queue size: ${this.eventQueue.length})`);
    }

    /**
     * Process queued events
     */
    processEventQueue() {
        if (this.eventQueue.length === 0) return;

        console.log(`[Socket] Processing ${this.eventQueue.length} queued events`);

        const queue = [...this.eventQueue];
        this.eventQueue = [];

        for (const item of queue) {
            try {
                // Skip events older than 5 minutes
                if (Date.now() - item.timestamp > 5 * 60 * 1000) {
                    console.log(`[Socket] Skipping old event: ${item.event}`);
                    continue;
                }

                this.socket.emit(item.event, item.data);
            } catch (error) {
                console.error(`[Socket] Failed to process queued event:`, error);
                // Re-queue if failed
                this.eventQueue.push(item);
            }
        }
    }

    /**
     * Listen to events
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event).push(callback);

        // Also listen on socket if connected
        if (this.socket) {
            this.socket.on(event, callback);
        }

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[Socket] Listener error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Join room
     */
    joinRoom(room) {
        return this.emit('join_booking_room', room);
    }

    /**
     * Update location with retry
     */
    updateLocation(bookingId, location) {
        return this.emit('update_location', { bookingId, location }, { queue: true });
    }

    /**
     * Send notification
     */
    sendNotification(data) {
        return this.emit('notification', data, { queue: true });
    }

    /**
     * Disconnect
     */
    disconnect() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnected = false;
        this.connectionPromise = null;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id,
            reconnectAttempts: this.reconnectAttempts,
            queueSize: this.eventQueue.length,
            lastPongTime: this.lastPongTime
        };
    }
}

// Singleton instance
const socketClient = new EnhancedSocketClient();

export default socketClient;
