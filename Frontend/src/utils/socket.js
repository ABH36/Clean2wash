import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/api/consumer';

class SocketService {
    constructor() {
        // Handle relative URLs by basing them on current origin
        let baseUrl;
        if (SOCKET_URL.startsWith('/')) {
            baseUrl = window.location.origin;
        } else {
            const url = new URL(SOCKET_URL);
            baseUrl = `${url.protocol}//${url.host}`;
        }

        this.socket = io(baseUrl, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000, // Exponential backoff max
            randomizationFactor: 0.5,
            path: '/socket.io'
        });

        this.socket.on('connect', () => {
            console.log('🔗 WebSocket Connected!', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('🔗 WebSocket Connection Error:', err.message);
        });

        this.socket.on('disconnect', () => {
            console.log('🔴 WebSocket Disconnected!');
        });
    }

    /**
     * Connect to the socket server with a token for authentication.
     * @param {string} token - JWT authentication token
     */
    connect(token) {
        if (!this.socket.connected && token) {
            // Set auth token for the handshake
            this.socket.auth = { token };
            console.log('🔗 Connecting to WebSocket with authentication...');
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    joinBookingRoom(bookingId) {
        if (this.socket && bookingId) {
            this.socket.emit('join_booking_room', bookingId);
        }
    }

    joinUserRoom(userId) {
        // Auto-joined by backend on connection, but kept for compatibility
        if (this.socket && userId) {
            this.socket.emit('join_user_room', userId);
        }
    }

    joinAdminRoom() {
        if (this.socket) {
            this.socket.emit('join_admin_room');
        }
    }

    getSocket() {
        return this.socket;
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export const socketService = new SocketService();
