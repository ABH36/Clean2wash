import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socketInstance = null;

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.warn('No token found, socket connection skipped');
            return;
        }

        // Reuse existing socket instance
        if (socketInstance && socketInstance.connected) {
            setSocket(socketInstance);
            return;
        }

        // Create new socket connection
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socketInstance = newSocket;
        setSocket(newSocket);

        return () => {
            // Don't disconnect on unmount, keep connection alive
            // Only disconnect when user logs out
        };
    }, []);

    return socket;
};

// Function to disconnect socket (call on logout)
export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
