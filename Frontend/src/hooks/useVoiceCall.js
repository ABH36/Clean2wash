import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useVoiceCall = (bookingId) => {
    const [call, setCall] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const socket = useSocket();

    // Initiate call
    const initiateCall = useCallback(async () => {
        try {
            const response = await axios.post(
                `${API_URL}/calls/initiate`,
                { bookingId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setCall(response.data.data.call);
            return response.data.data.call;
        } catch (error) {
            console.error('Error initiating call:', error);
            throw error;
        }
    }, [bookingId]);

    // Answer call
    const answerCall = useCallback(async (callId) => {
        try {
            const response = await axios.post(
                `${API_URL}/calls/${callId}/answer`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setCall(response.data.data.call);
            setIncomingCall(null);
            return response.data.data.call;
        } catch (error) {
            console.error('Error answering call:', error);
            throw error;
        }
    }, []);

    // Reject call
    const rejectCall = useCallback(async (callId, reason = 'rejected') => {
        try {
            const response = await axios.post(
                `${API_URL}/calls/${callId}/reject`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setIncomingCall(null);
            return response.data.data.call;
        } catch (error) {
            console.error('Error rejecting call:', error);
            throw error;
        }
    }, []);

    // End call
    const endCall = useCallback(async (callId, reason = 'completed') => {
        try {
            const response = await axios.post(
                `${API_URL}/calls/${callId}/end`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setCall(null);
            return response.data.data.call;
        } catch (error) {
            console.error('Error ending call:', error);
            throw error;
        }
    }, []);

    // Get call history
    const getCallHistory = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_URL}/calls/${bookingId}/history`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.calls;
        } catch (error) {
            console.error('Error fetching call history:', error);
            throw error;
        }
    }, [bookingId]);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        // Listen for incoming calls
        const handleIncomingCall = (data) => {
            if (data.bookingId === bookingId) {
                setIncomingCall(data);
                // Play ringtone
                playRingtone();
            }
        };

        // Listen for call answered
        const handleCallAnswered = (data) => {
            if (call && data.callId === call._id) {
                setCall((prev) => ({ ...prev, status: 'connected' }));
            }
        };

        // Listen for call rejected
        const handleCallRejected = (data) => {
            if (call && data.callId === call._id) {
                setCall(null);
                alert('Call was rejected');
            }
        };

        // Listen for call ended
        const handleCallEnded = (data) => {
            if (call && data.callId === call._id) {
                setCall(null);
            }
        };

        // Listen for missed call
        const handleCallMissed = (data) => {
            if (call && data.callId === call._id) {
                setCall(null);
                alert('Call was missed');
            }
        };

        socket.on('incoming_call', handleIncomingCall);
        socket.on('call_answered', handleCallAnswered);
        socket.on('call_rejected', handleCallRejected);
        socket.on('call_ended', handleCallEnded);
        socket.on('call_missed', handleCallMissed);

        return () => {
            socket.off('incoming_call', handleIncomingCall);
            socket.off('call_answered', handleCallAnswered);
            socket.off('call_rejected', handleCallRejected);
            socket.off('call_ended', handleCallEnded);
            socket.off('call_missed', handleCallMissed);
        };
    }, [socket, bookingId, call]);

    const playRingtone = () => {
        // Play ringtone sound
        const audio = new Audio('/ringtone.mp3');
        audio.loop = true;
        audio.play().catch(console.error);
        
        // Stop after 30 seconds
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 30000);
    };

    return {
        call,
        incomingCall,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        getCallHistory
    };
};
