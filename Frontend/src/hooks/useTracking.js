import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useTracking = (bookingId) => {
    const [tracking, setTracking] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [eta, setEta] = useState(null);
    const [route, setRoute] = useState(null);
    const [trafficCondition, setTrafficCondition] = useState('unknown');
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    // Fetch tracking status
    const fetchTrackingStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/tracking/${bookingId}/status`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = response.data.data;
            setTracking(data.tracking);
            setDriverLocation(data.tracking?.currentLocation);
            setEta(data.tracking?.pickupETA || data.tracking?.dropETA);
            setTrafficCondition(
                data.tracking?.pickupETA?.trafficCondition || 
                data.tracking?.dropETA?.trafficCondition || 
                'unknown'
            );
        } catch (error) {
            console.error('Error fetching tracking status:', error);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    // Update driver location
    const updateLocation = useCallback(async (location) => {
        try {
            await axios.post(
                `${API_URL}/tracking/update-location`,
                { bookingId, location },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    }, [bookingId]);

    // Calculate ETA
    const calculateETA = useCallback(async (origin, destination) => {
        try {
            const response = await axios.post(
                `${API_URL}/tracking/calculate-eta`,
                { origin, destination },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.eta;
        } catch (error) {
            console.error('Error calculating ETA:', error);
            throw error;
        }
    }, []);

    // Get optimized route
    const getOptimizedRoute = useCallback(async (origin, destination, waypoints = []) => {
        try {
            const response = await axios.post(
                `${API_URL}/tracking/optimized-route`,
                { origin, destination, waypoints },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setRoute(response.data.data.route.recommended);
            return response.data.data.route;
        } catch (error) {
            console.error('Error getting optimized route:', error);
            throw error;
        }
    }, []);

    // Get traffic conditions
    const getTrafficConditions = useCallback(async (origin, destination) => {
        try {
            const response = await axios.post(
                `${API_URL}/tracking/traffic-conditions`,
                { origin, destination },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.traffic;
        } catch (error) {
            console.error('Error getting traffic conditions:', error);
            throw error;
        }
    }, []);

    // Get navigation instructions
    const getNavigationInstructions = useCallback(async (origin, destination) => {
        try {
            const response = await axios.post(
                `${API_URL}/tracking/navigation`,
                { origin, destination },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.navigation;
        } catch (error) {
            console.error('Error getting navigation instructions:', error);
            throw error;
        }
    }, []);

    // Start live tracking
    const startLiveTracking = useCallback(async () => {
        try {
            await axios.post(
                `${API_URL}/tracking/start-live-tracking`,
                { bookingId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error starting live tracking:', error);
            throw error;
        }
    }, [bookingId]);

    // Stop live tracking
    const stopLiveTracking = useCallback(async () => {
        try {
            await axios.post(
                `${API_URL}/tracking/stop-live-tracking`,
                { bookingId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error stopping live tracking:', error);
            throw error;
        }
    }, [bookingId]);

    // Predict arrival time
    const predictArrivalTime = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_URL}/tracking/${bookingId}/predict-arrival`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.prediction;
        } catch (error) {
            console.error('Error predicting arrival time:', error);
            throw error;
        }
    }, [bookingId]);

    // Socket event handlers
    useEffect(() => {
        if (!socket || !bookingId) return;

        // Listen for tracking updates
        const handleTrackingUpdate = (data) => {
            if (data.bookingId === bookingId) {
                setTracking(data.tracking);
                setDriverLocation(data.currentLocation);
                setEta(data.tracking?.pickupETA || data.tracking?.dropETA);
                setTrafficCondition(
                    data.tracking?.pickupETA?.trafficCondition || 
                    data.tracking?.dropETA?.trafficCondition || 
                    'unknown'
                );
            }
        };

        // Listen for proximity alerts
        const handleProximityAlert = (data) => {
            if (data.bookingId === bookingId) {
                // Show notification
                if (Notification.permission === 'granted') {
                    new Notification(data.title, {
                        body: data.message,
                        icon: '/logo.png'
                    });
                }
            }
        };

        socket.on('tracking_updated', handleTrackingUpdate);
        socket.on('proximity_alert', handleProximityAlert);

        return () => {
            socket.off('tracking_updated', handleTrackingUpdate);
            socket.off('proximity_alert', handleProximityAlert);
        };
    }, [socket, bookingId]);

    // Fetch tracking status on mount
    useEffect(() => {
        fetchTrackingStatus();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchTrackingStatus, 30000);
        
        return () => clearInterval(interval);
    }, [fetchTrackingStatus]);

    return {
        tracking,
        driverLocation,
        eta,
        route,
        trafficCondition,
        loading,
        updateLocation,
        calculateETA,
        getOptimizedRoute,
        getTrafficConditions,
        getNavigationInstructions,
        startLiveTracking,
        stopLiveTracking,
        predictArrivalTime,
        refetch: fetchTrackingStatus
    };
};
