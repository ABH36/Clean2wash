import { useEffect, useState, useCallback, useRef } from 'react';
import socketClient from '../utils/enhancedSocketClient';

/**
 * Enhanced Socket Hook with Error Handling
 * Easy-to-use React hook for socket operations
 */

export const useEnhancedSocket = (token) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState(null);
    const [latency, setLatency] = useState(null);
    const [queueSize, setQueueSize] = useState(0);
    const listenersRef = useRef([]);

    // Connect on mount
    useEffect(() => {
        if (!token) return;

        let mounted = true;

        const connect = async () => {
            try {
                setConnectionStatus('connecting');
                await socketClient.connect(token);
                
                if (mounted) {
                    setIsConnected(true);
                    setConnectionStatus('connected');
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    setConnectionStatus('error');
                }
            }
        };

        connect();

        // Setup status listeners
        const unsubscribeConnect = socketClient.on('connect', () => {
            if (mounted) {
                setIsConnected(true);
                setConnectionStatus('connected');
                setError(null);
            }
        });

        const unsubscribeDisconnect = socketClient.on('disconnect', () => {
            if (mounted) {
                setIsConnected(false);
                setConnectionStatus('disconnected');
            }
        });

        const unsubscribeError = socketClient.on('connect_error', ({ error }) => {
            if (mounted) {
                setError(error.message);
                setConnectionStatus('error');
            }
        });

        const unsubscribeReconnect = socketClient.on('reconnect', () => {
            if (mounted) {
                setIsConnected(true);
                setConnectionStatus('connected');
                setError(null);
            }
        });

        const unsubscribeReconnectAttempt = socketClient.on('reconnect_attempt', ({ attempts }) => {
            if (mounted) {
                setConnectionStatus(`reconnecting (${attempts})`);
            }
        });

        const unsubscribeLatency = socketClient.on('latency', ({ latency: lat }) => {
            if (mounted) {
                setLatency(lat);
            }
        });

        // Update queue size periodically
        const queueInterval = setInterval(() => {
            if (mounted) {
                const status = socketClient.getStatus();
                setQueueSize(status.queueSize);
            }
        }, 5000);

        return () => {
            mounted = false;
            unsubscribeConnect();
            unsubscribeDisconnect();
            unsubscribeError();
            unsubscribeReconnect();
            unsubscribeReconnectAttempt();
            unsubscribeLatency();
            clearInterval(queueInterval);
            
            // Cleanup all listeners
            listenersRef.current.forEach(unsubscribe => unsubscribe());
        };
    }, [token]);

    // Emit event
    const emit = useCallback(async (event, data, options) => {
        try {
            const result = await socketClient.emit(event, data, options);
            return result;
        } catch (err) {
            console.error(`[useSocket] Emit error:`, err);
            throw err;
        }
    }, []);

    // Listen to event
    const on = useCallback((event, callback) => {
        const unsubscribe = socketClient.on(event, callback);
        listenersRef.current.push(unsubscribe);
        return unsubscribe;
    }, []);

    // Join room
    const joinRoom = useCallback(async (room) => {
        return emit('join_booking_room', room);
    }, [emit]);

    // Update location
    const updateLocation = useCallback(async (bookingId, location) => {
        return socketClient.updateLocation(bookingId, location);
    }, []);

    // Get status
    const getStatus = useCallback(() => {
        return socketClient.getStatus();
    }, []);

    return {
        isConnected,
        connectionStatus,
        error,
        latency,
        queueSize,
        emit,
        on,
        joinRoom,
        updateLocation,
        getStatus
    };
};

/**
 * Hook for location tracking with automatic updates
 */
export const useLocationTracking = (bookingId, enabled = true) => {
    const { updateLocation, isConnected } = useEnhancedSocket();
    const [isTracking, setIsTracking] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!enabled || !bookingId || !isConnected) {
            stopTracking();
            return;
        }

        startTracking();

        return () => stopTracking();
    }, [enabled, bookingId, isConnected]);

    const startTracking = () => {
        if (watchIdRef.current) return;

        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setIsTracking(true);
        setError(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed,
                    heading: position.coords.heading,
                    timestamp: position.timestamp
                };

                try {
                    await updateLocation(bookingId, location);
                    setLastUpdate(new Date());
                    setError(null);
                } catch (err) {
                    console.error('[LocationTracking] Update failed:', err);
                    setError(err.message);
                }
            },
            (err) => {
                console.error('[LocationTracking] Error:', err);
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    };

    return {
        isTracking,
        lastUpdate,
        error,
        startTracking,
        stopTracking
    };
};

/**
 * Hook for receiving notifications
 */
export const useSocketNotifications = (onNotification) => {
    const { on, isConnected } = useEnhancedSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsubscribe = on('notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            if (onNotification) {
                onNotification(notification);
            }
        });

        return unsubscribe;
    }, [on, onNotification]);

    const markAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications,
        isConnected
    };
};

export default useEnhancedSocket;
