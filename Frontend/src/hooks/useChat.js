import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useChat = (bookingId, userId, userType) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const socket = useSocket();

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/chat/${bookingId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    // Send message
    const sendMessage = useCallback(async (text) => {
        try {
            const response = await axios.post(
                `${API_URL}/chat/send`,
                {
                    bookingId,
                    messageType: 'text',
                    content: { text }
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [bookingId]);

    // Send location
    const sendLocation = useCallback(async (location) => {
        try {
            const response = await axios.post(
                `${API_URL}/chat/location`,
                {
                    bookingId,
                    location
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.message;
        } catch (error) {
            console.error('Error sending location:', error);
            throw error;
        }
    }, [bookingId]);

    // Send quick reply
    const sendQuickReply = useCallback(async (options) => {
        try {
            const response = await axios.post(
                `${API_URL}/chat/quick-reply`,
                {
                    bookingId,
                    options
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.message;
        } catch (error) {
            console.error('Error sending quick reply:', error);
            throw error;
        }
    }, [bookingId]);

    // Mark messages as read
    const markAsRead = useCallback(async () => {
        try {
            await axios.patch(
                `${API_URL}/chat/${bookingId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, [bookingId]);

    // Socket event handlers
    useEffect(() => {
        if (!socket || !bookingId) return;

        // Join booking room
        socket.emit('join_booking', { bookingId });

        // Listen for new messages
        const handleNewMessage = (data) => {
            if (data.bookingId === bookingId) {
                setMessages((prev) => [...prev, data.message]);
                // Auto-mark as read if chat is open
                markAsRead();
            }
        };

        // Listen for messages read
        const handleMessagesRead = (data) => {
            if (data.bookingId === bookingId) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.sender.id === userId
                            ? { ...msg, status: 'read', metadata: { ...msg.metadata, isRead: true } }
                            : msg
                    )
                );
            }
        };

        // Listen for typing indicators
        const handleUserTyping = (data) => {
            if (data.bookingId === bookingId && data.userId !== userId) {
                setIsTyping(true);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.bookingId === bookingId && data.userId !== userId) {
                setIsTyping(false);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stopped_typing', handleUserStoppedTyping);
        };
    }, [socket, bookingId, userId, markAsRead]);

    // Fetch messages on mount
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return {
        messages,
        loading,
        isTyping,
        sendMessage,
        sendLocation,
        sendQuickReply,
        markAsRead,
        refetch: fetchMessages
    };
};
