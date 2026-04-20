import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../utils/socket';

/**
 * Custom hook for managing socket connections with proper cleanup
 * Prevents memory leaks and ensures proper connection lifecycle
 */
export const useSocketConnection = (options = {}) => {
  const {
    autoConnect = true,
    bookingId = null,
    userId = null,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  // Connect to socket
  const connect = useCallback((token) => {
    if (isCleaningUpRef.current) return;
    
    try {
      const authToken = token || localStorage.getItem('auth_token');
      socketService.connect(authToken);
      socketRef.current = socketService.getSocket();
      
      if (socketRef.current) {
        setIsConnected(socketRef.current.connected);
      }
    } catch (err) {
      console.error('[useSocketConnection] Connect error:', err);
      setError(err);
      if (onError) onError(err);
    }
  }, [onError]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    try {
      // Remove all listeners
      listenersRef.current.forEach((handler, event) => {
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
      });
      listenersRef.current.clear();
      
      // Leave rooms
      if (bookingId) {
        socketService.leaveBookingRoom(bookingId);
      }
      if (userId) {
        socketService.leaveUserRoom(userId);
      }
      
      // Disconnect
      socketService.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    } catch (err) {
      console.error('[useSocketConnection] Disconnect error:', err);
    }
  }, [bookingId, userId]);

  // Join booking room
  const joinBookingRoom = useCallback((id) => {
    if (!id || isCleaningUpRef.current) return;
    
    try {
      socketService.joinBookingRoom(id);
    } catch (err) {
      console.error('[useSocketConnection] Join booking room error:', err);
      setError(err);
    }
  }, []);

  // Leave booking room
  const leaveBookingRoom = useCallback((id) => {
    if (!id || isCleaningUpRef.current) return;
    
    try {
      socketService.leaveBookingRoom(id);
    } catch (err) {
      console.error('[useSocketConnection] Leave booking room error:', err);
    }
  }, []);

  // Join user room
  const joinUserRoom = useCallback((id) => {
    if (!id || isCleaningUpRef.current) return;
    
    try {
      socketService.joinUserRoom(id);
    } catch (err) {
      console.error('[useSocketConnection] Join user room error:', err);
      setError(err);
    }
  }, []);

  // Subscribe to event with automatic cleanup
  const on = useCallback((event, handler) => {
    if (!socketRef.current || isCleaningUpRef.current) return;
    
    try {
      socketRef.current.on(event, handler);
      listenersRef.current.set(event, handler);
    } catch (err) {
      console.error(`[useSocketConnection] Subscribe to ${event} error:`, err);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, handler) => {
    if (!socketRef.current || isCleaningUpRef.current) return;
    
    try {
      socketRef.current.off(event, handler);
      listenersRef.current.delete(event);
    } catch (err) {
      console.error(`[useSocketConnection] Unsubscribe from ${event} error:`, err);
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (!socketRef.current || !isConnected || isCleaningUpRef.current) {
      console.warn(`[useSocketConnection] Cannot emit ${event}: not connected`);
      return;
    }
    
    try {
      socketRef.current.emit(event, data);
    } catch (err) {
      console.error(`[useSocketConnection] Emit ${event} error:`, err);
    }
  }, [isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnect) return;
    
    connect();
    
    return () => {
      isCleaningUpRef.current = true;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Handle connection status changes
  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleConnect = () => {
      if (isCleaningUpRef.current) return;
      setIsConnected(true);
      setError(null);
      if (onConnect) onConnect();
    };
    
    const handleDisconnect = (reason) => {
      if (isCleaningUpRef.current) return;
      setIsConnected(false);
      if (onDisconnect) onDisconnect(reason);
      
      // Auto-reconnect on unexpected disconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isCleaningUpRef.current) {
            connect();
          }
        }, 3000);
      }
    };
    
    const handleConnectError = (err) => {
      if (isCleaningUpRef.current) return;
      console.error('[useSocketConnection] Connection error:', err);
      setError(err);
      if (onError) onError(err);
    };
    
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleConnectError);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, onConnect, onDisconnect, onError]);

  // Join rooms when IDs change
  useEffect(() => {
    if (!isConnected) return;
    
    if (bookingId) {
      joinBookingRoom(bookingId);
    }
    
    if (userId) {
      joinUserRoom(userId);
    }
    
    return () => {
      if (bookingId) {
        leaveBookingRoom(bookingId);
      }
      if (userId) {
        // Don't leave user room on unmount, only on disconnect
      }
    };
  }, [isConnected, bookingId, userId, joinBookingRoom, leaveBookingRoom, joinUserRoom]);

  return {
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
    socket: socketRef.current
  };
};

/**
 * Hook for booking-specific socket connection
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

    const handleStatusUpdate = (data) => {
      if (onStatusUpdate) onStatusUpdate(data);
    };

    const handleLocationUpdate = (data) => {
      if (onLocationUpdate) onLocationUpdate(data);
    };

    const handleDriverAssigned = (data) => {
      if (onDriverAssigned) onDriverAssigned(data);
    };

    const handleOTPRevealed = (data) => {
      if (onOTPRevealed) onOTPRevealed(data);
    };

    socket.on('booking_status_updated', handleStatusUpdate);
    socket.on('location_updated', handleLocationUpdate);
    socket.on('locationUpdate', handleLocationUpdate);
    socket.on('driver_assigned', handleDriverAssigned);
    socket.on('otp_revealed', handleOTPRevealed);

    return () => {
      socket.off('booking_status_updated', handleStatusUpdate);
      socket.off('location_updated', handleLocationUpdate);
      socket.off('locationUpdate', handleLocationUpdate);
      socket.off('driver_assigned', handleDriverAssigned);
      socket.off('otp_revealed', handleOTPRevealed);
    };
  }, [socket, bookingId, onStatusUpdate, onLocationUpdate, onDriverAssigned, onOTPRevealed]);

  return socket;
};

export default useSocketConnection;
