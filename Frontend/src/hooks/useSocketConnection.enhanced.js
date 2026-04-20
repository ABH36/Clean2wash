import { useEffect, useRef, useState, useCallback } from 'react';
import socketClient from '../utils/enhancedSocketClient';

/**
 * Enhanced Socket Connection Hook - Backward Compatible Wrapper
 * Uses enhancedSocketClient under the hood while maintaining the same API
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event queuing for offline scenarios
 * - Heartbeat monitoring
 * - Complete error handling
 * - Backward compatible with old useSocketConnection API
 */
export const useSocketConnection = (options = {}) => {
  const {
    autoConnect = true,
    bookingId = null,
    userId = null,
    token = null,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [queueSize, setQueueSize] = useState(0);
  
  const listenersRef = useRef(new Map());
  const isCleaningUpRef = useRef(false);
  const unsubscribersRef = useRef([]);

  // Get token from options or localStorage
  const getToken = useCallback(() => {
    return token || 
           localStorage.getItem('chauffeur_token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('admin_token');
  }, [token]);

  // Connect to socket
  const connect = useCallback(async (authToken) => {
    if (isCleaningUpRef.current) return;
    
    try {
      const tokenToUse = authToken || getToken();
      if (!tokenToUse) {
        throw new Error('No authentication token available');
      }

      setConnectionStatus('connecting');
      await socketClient.connect(tokenToUse);
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      
      if (onConnect) onConnect();
    } catch (err) {
      console.error('[useSocketConnection] Connect error:', err);
      setError(err);
      setConnectionStatus('error');
      if (onError) onError(err);
    }
  }, [getToken, onConnect, onError]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    try {
      // Cleanup all listeners
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
      listenersRef.current.clear();
      
      // Note: We don't actually disconnect the singleton socket
      // Just cleanup this component's listeners
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (onDisconnect) onDisconnect();
    } catch (err) {
      console.error('[useSocketConnection] Disconnect error:', err);
    }
  }, [onDisconnect]);

  // Join booking room
  const joinBookingRoom = useCallback(async (id) => {
    if (!id || isCleaningUpRef.current) return;
    
    try {
      await socketClient.joinRoom(id);
      await socketClient.joinRoom(`booking_${id}`);
    } catch (err) {
      console.error('[useSocketConnection] Join booking room error:', err);
      setError(err);
    }
  }, []);

  // Leave booking room (no-op for enhanced client)
  const leaveBookingRoom = useCallback((id) => {
    // Enhanced client doesn't need explicit leave
    // Rooms are managed by server
  }, []);

  // Join user room
  const joinUserRoom = useCallback(async (id) => {
    if (!id || isCleaningUpRef.current) return;
    
    try {
      await socketClient.joinRoom(id);
    } catch (err) {
      console.error('[useSocketConnection] Join user room error:', err);
      setError(err);
    }
  }, []);

  // Subscribe to event with automatic cleanup
  const on = useCallback((event, handler) => {
    if (isCleaningUpRef.current) return;
    
    try {
      const unsubscribe = socketClient.on(event, handler);
      unsubscribersRef.current.push(unsubscribe);
      listenersRef.current.set(event, handler);
      return unsubscribe;
    } catch (err) {
      console.error(`[useSocketConnection] Subscribe to ${event} error:`, err);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, handler) => {
    if (isCleaningUpRef.current) return;
    
    try {
      socketClient.off(event, handler);
      listenersRef.current.delete(event);
    } catch (err) {
      console.error(`[useSocketConnection] Unsubscribe from ${event} error:`, err);
    }
  }, []);

  // Emit event with queuing support
  const emit = useCallback(async (event, data) => {
    if (isCleaningUpRef.current) {
      console.warn(`[useSocketConnection] Cannot emit ${event}: cleaning up`);
      return;
    }
    
    try {
      const result = await socketClient.emit(event, data, { queue: true });
      return result;
    } catch (err) {
      console.error(`[useSocketConnection] Emit ${event} error:`, err);
      throw err;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnect) return;
    
    let mounted = true;

    const initConnection = async () => {
      if (mounted) {
        await connect();
      }
    };

    initConnection();
    
    return () => {
      mounted = false;
      isCleaningUpRef.current = true;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Setup status listeners
  useEffect(() => {
    let mounted = true;

    const unsubscribeConnect = socketClient.on('connect', () => {
      if (mounted && !isCleaningUpRef.current) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        if (onConnect) onConnect();
      }
    });

    const unsubscribeDisconnect = socketClient.on('disconnect', ({ reason }) => {
      if (mounted && !isCleaningUpRef.current) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        if (onDisconnect) onDisconnect(reason);
      }
    });

    const unsubscribeError = socketClient.on('connect_error', ({ error: err }) => {
      if (mounted && !isCleaningUpRef.current) {
        setError(err);
        setConnectionStatus('error');
        if (onError) onError(err);
      }
    });

    const unsubscribeReconnect = socketClient.on('reconnect', () => {
      if (mounted && !isCleaningUpRef.current) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      }
    });

    const unsubscribeReconnectAttempt = socketClient.on('reconnect_attempt', ({ attempts }) => {
      if (mounted && !isCleaningUpRef.current) {
        setConnectionStatus(`reconnecting (${attempts})`);
      }
    });

    const unsubscribeLatency = socketClient.on('latency', ({ latency: lat }) => {
      if (mounted && !isCleaningUpRef.current) {
        setLatency(lat);
      }
    });

    // Update queue size periodically
    const queueInterval = setInterval(() => {
      if (mounted && !isCleaningUpRef.current) {
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
    };
  }, [onConnect, onDisconnect, onError]);

  // Join rooms when IDs change
  useEffect(() => {
    if (!isConnected) return;
    
    if (bookingId) {
      joinBookingRoom(bookingId);
    }
    
    if (userId) {
      joinUserRoom(userId);
    }
  }, [isConnected, bookingId, userId, joinBookingRoom, joinUserRoom]);

  // Get socket status
  const getStatus = useCallback(() => {
    return socketClient.getStatus();
  }, []);

  return {
    // Backward compatible API
    isConnected,
    error,
    connect,
    disconnect,
    joinBookingRoom,
    leaveBookingRoom,
    joinUserRoom,
    on,
    off,
    emit,
    socket: socketClient.socket, // For backward compatibility
    
    // Enhanced features
    connectionStatus,
    latency,
    queueSize,
    getStatus
  };
};

/**
 * Hook for booking-specific socket connection
 * Enhanced version with better error handling
 */
export const useBookingSocket = (bookingId, handlers = {}) => {
  const {
    onStatusUpdate,
    onLocationUpdate,
    onDriverAssigned,
    onOTPRevealed
  } = handlers;

  const socket = useSocketConnection({
    autoConnect: true,
    bookingId
  });

  useEffect(() => {
    if (!socket.isConnected || !bookingId) return;

    const unsubscribers = [];

    if (onStatusUpdate) {
      const unsub = socket.on('booking_status_updated', onStatusUpdate);
      unsubscribers.push(unsub);
    }

    if (onLocationUpdate) {
      const unsub1 = socket.on('location_updated', onLocationUpdate);
      const unsub2 = socket.on('locationUpdate', onLocationUpdate);
      unsubscribers.push(unsub1, unsub2);
    }

    if (onDriverAssigned) {
      const unsub = socket.on('driver_assigned', onDriverAssigned);
      unsubscribers.push(unsub);
    }

    if (onOTPRevealed) {
      const unsub = socket.on('otp_revealed', onOTPRevealed);
      unsubscribers.push(unsub);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [socket, bookingId, onStatusUpdate, onLocationUpdate, onDriverAssigned, onOTPRevealed]);

  return socket;
};

export default useSocketConnection;

