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
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            path: '/socket.io' // Ensure this matches backend
        });

        this.socket.on('connect', () => {
            console.log('🔗 WebSocket Connected!', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('🔴 WebSocket Disconnected!');
        });
    }

    connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    joinUserRoom(userId) {
        if (this.socket && userId) {
            this.socket.emit('join_user_room', userId);
        }
    }

    joinBookingRoom(bookingId) {
        if (this.socket && bookingId) {
            this.socket.emit('join_booking_room', bookingId);
        }
    }

    joinAdminRoom() {
        if (this.socket) {
            this.socket.emit('join_admin_room');
        }
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
