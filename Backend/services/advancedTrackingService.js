const axios = require('axios');
const Booking = require('../models/Booking');
const socketService = require('../socketService');
const { sendNotification } = require('../utils/notificationService');

/**
 * Advanced Tracking Service - Production-grade tracking system
 * Features: ETA predictions, route optimization, traffic-aware routing, arrival notifications
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

// Traffic condition thresholds (in seconds per km)
const TRAFFIC_THRESHOLDS = {
    light: 120,      // < 2 min/km
    moderate: 180,   // 2-3 min/km
    heavy: 240,      // 3-4 min/km
    severe: 300      // > 5 min/km
};

// Notification distance thresholds (in meters)
const NOTIFICATION_THRESHOLDS = {
    NEAR_PICKUP: 2000,      // 2 km
    ARRIVING_PICKUP: 500,   // 500 m
    NEAR_DROP: 2000,        // 2 km
    ARRIVING_DROP: 500      // 500 m
};

/**
 * Calculate ETA using Google Maps Distance Matrix API
 */
const calculateETA = async (origin, destination, mode = 'driving') => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('Google Maps API key not configured, using fallback calculation');
            return calculateFallbackETA(origin, destination);
        }

        const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        const params = {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            mode,
            departure_time: 'now',
            traffic_model: 'best_guess',
            key: GOOGLE_MAPS_API_KEY
        };

        const response = await axios.get(url, { params });

        if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
            const element = response.data.rows[0].elements[0];
            
            // Get duration in traffic (real-time)
            const duration = element.duration_in_traffic || element.duration;
            const distance = element.distance;

            // Calculate traffic condition
            const timePerKm = (duration.value / (distance.value / 1000));
            const trafficCondition = getTrafficCondition(timePerKm);

            return {
                duration: duration.value, // in seconds
                durationText: duration.text,
                distance: distance.value, // in meters
                distanceText: distance.text,
                eta: new Date(Date.now() + duration.value * 1000),
                trafficCondition,
                provider: 'google'
            };
        }

        throw new Error('Google Maps API returned invalid response');
    } catch (error) {
        console.error('Error calculating ETA with Google Maps:', error.message);
        return calculateFallbackETA(origin, destination);
    }
};

/**
 * Get optimized route using Google Directions API
 */
const getOptimizedRoute = async (origin, destination, waypoints = []) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return null;
        }

        const url = 'https://maps.googleapis.com/maps/api/directions/json';
        const params = {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            departure_time: 'now',
            traffic_model: 'best_guess',
            alternatives: true,
            optimize: true,
            key: GOOGLE_MAPS_API_KEY
        };

        if (waypoints.length > 0) {
            params.waypoints = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
        }

        const response = await axios.get(url, { params });

        if (response.data.status === 'OK' && response.data.routes.length > 0) {
            const routes = response.data.routes.map(route => ({
                summary: route.summary,
                distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
                duration: route.legs.reduce((sum, leg) => sum + (leg.duration_in_traffic || leg.duration).value, 0),
                polyline: route.overview_polyline.points,
                steps: route.legs[0].steps.map(step => ({
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                    distance: step.distance.text,
                    duration: step.duration.text,
                    maneuver: step.maneuver
                })),
                warnings: route.warnings,
                trafficCondition: getTrafficCondition(
                    route.legs.reduce((sum, leg) => sum + (leg.duration_in_traffic || leg.duration).value, 0) /
                    (route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000)
                )
            }));

            // Sort by duration (fastest first)
            routes.sort((a, b) => a.duration - b.duration);

            return {
                routes,
                recommended: routes[0],
                alternatives: routes.slice(1)
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting optimized route:', error.message);
        return null;
    }
};

/**
 * Determine traffic condition based on time per km
 */
const getTrafficCondition = (timePerKm) => {
    if (timePerKm < TRAFFIC_THRESHOLDS.light) return 'light';
    if (timePerKm < TRAFFIC_THRESHOLDS.moderate) return 'moderate';
    if (timePerKm < TRAFFIC_THRESHOLDS.heavy) return 'heavy';
    if (timePerKm < TRAFFIC_THRESHOLDS.severe) return 'severe';
    return 'severe';
};

/**
 * Fallback ETA calculation using Haversine formula
 */
const calculateFallbackETA = (origin, destination) => {
    const distance = calculateDistance(origin, destination);
    
    // Average speed: 30 km/h in city traffic
    const avgSpeed = 30; // km/h
    const durationHours = distance / avgSpeed;
    const durationSeconds = Math.round(durationHours * 3600);

    return {
        duration: durationSeconds,
        durationText: formatDuration(durationSeconds),
        distance: Math.round(distance * 1000), // convert to meters
        distanceText: `${distance.toFixed(1)} km`,
        eta: new Date(Date.now() + durationSeconds * 1000),
        trafficCondition: 'unknown',
        provider: 'fallback'
    };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (degrees) => degrees * (Math.PI / 180);

/**
 * Format duration in seconds to human-readable text
 */
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
};

/**
 * Update booking tracking with real-time ETA
 */
const updateBookingTracking = async (bookingId, driverLocation) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        const updates = {
            'tracking.currentLocation': driverLocation,
            'tracking.lastUpdated': new Date()
        };

        // Calculate pickup ETA if not picked up yet
        if (!['picked-up', 'at-studio', 'in_progress', 'completed'].includes(booking.status)) {
            const pickupLocation = booking.location.address.coordinates;
            if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
                const pickupETA = await calculateETA(driverLocation, pickupLocation);
                updates['tracking.pickupETA'] = pickupETA;

                // Check for proximity notifications
                await checkProximityNotifications(booking, driverLocation, pickupLocation, 'pickup');
            }
        }

        // Calculate drop ETA if picked up
        if (['picked-up', 'out_for_delivery'].includes(booking.status)) {
            const dropLocation = booking.location.destination?.coordinates || booking.location.address.coordinates;
            if (dropLocation && dropLocation.lat && dropLocation.lng) {
                const dropETA = await calculateETA(driverLocation, dropLocation);
                updates['tracking.dropETA'] = dropETA;

                // Check for proximity notifications
                await checkProximityNotifications(booking, driverLocation, dropLocation, 'drop');
            }
        }

        // Update booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { $set: updates },
            { new: true }
        );

        // Emit real-time update via socket
        const io = socketService.getIO();
        if (io) {
            io.to(`booking_${bookingId}`).emit('tracking_updated', {
                bookingId,
                tracking: updatedBooking.tracking,
                currentLocation: driverLocation
            });

            // Send to consumer's personal room
            io.to(`user_${booking.consumer}`).emit('tracking_updated', {
                bookingId,
                tracking: updatedBooking.tracking,
                currentLocation: driverLocation
            });
        }

        return updatedBooking.tracking;
    } catch (error) {
        console.error('Error updating booking tracking:', error);
        throw error;
    }
};

/**
 * Check proximity and send notifications
 */
const checkProximityNotifications = async (booking, driverLocation, targetLocation, type) => {
    const distance = calculateDistance(driverLocation, targetLocation) * 1000; // convert to meters

    const notificationKey = type === 'pickup' ? 'nearPickup' : 'nearDrop';
    const arrivingKey = type === 'pickup' ? 'arrivingPickup' : 'nearDrop';

    // Near notification (2 km)
    if (distance <= NOTIFICATION_THRESHOLDS.NEAR_PICKUP && !booking.notifications?.[notificationKey]) {
        await sendProximityNotification(booking, type, 'near', distance);
        await Booking.findByIdAndUpdate(booking._id, {
            $set: { [`notifications.${notificationKey}`]: true }
        });
    }

    // Arriving notification (500 m)
    if (distance <= NOTIFICATION_THRESHOLDS.ARRIVING_PICKUP && !booking.notifications?.[arrivingKey]) {
        await sendProximityNotification(booking, type, 'arriving', distance);
        await Booking.findByIdAndUpdate(booking._id, {
            $set: { [`notifications.${arrivingKey}`]: true }
        });
    }
};

/**
 * Send proximity notification
 */
const sendProximityNotification = async (booking, type, stage, distance) => {
    const distanceKm = (distance / 1000).toFixed(1);
    const driverName = booking.provider?.name || 'Driver';

    let title, message;

    if (type === 'pickup') {
        if (stage === 'near') {
            title = `${driverName} is nearby!`;
            message = `Your driver is ${distanceKm} km away and will arrive soon.`;
        } else {
            title = `${driverName} is arriving!`;
            message = `Your driver is just ${Math.round(distance)} meters away. Please be ready!`;
        }
    } else {
        if (stage === 'near') {
            title = 'Almost there!';
            message = `You're ${distanceKm} km away from your destination.`;
        } else {
            title = 'Arriving at destination!';
            message = `You're just ${Math.round(distance)} meters away from your destination.`;
        }
    }

    // Send push notification
    await sendNotification(booking.consumer, {
        title,
        message,
        type: 'tracking',
        priority: 'high',
        data: {
            bookingId: booking._id.toString(),
            stage,
            distance: Math.round(distance)
        }
    });

    // Send socket notification
    const io = socketService.getIO();
    if (io) {
        io.to(`user_${booking.consumer}`).emit('proximity_alert', {
            bookingId: booking._id,
            type,
            stage,
            distance: Math.round(distance),
            title,
            message
        });
    }
};

/**
 * Start live tracking for a booking
 */
const startLiveTracking = async (bookingId, driverId) => {
    try {
        await Booking.findByIdAndUpdate(bookingId, {
            $set: {
                'liveTracking.isActive': true,
                'liveTracking.startedAt': new Date(),
                'liveTracking.driverId': driverId
            }
        });

        return { success: true, message: 'Live tracking started' };
    } catch (error) {
        console.error('Error starting live tracking:', error);
        throw error;
    }
};

/**
 * Stop live tracking for a booking
 */
const stopLiveTracking = async (bookingId) => {
    try {
        await Booking.findByIdAndUpdate(bookingId, {
            $set: {
                'liveTracking.isActive': false,
                'liveTracking.endedAt': new Date()
            }
        });

        return { success: true, message: 'Live tracking stopped' };
    } catch (error) {
        console.error('Error stopping live tracking:', error);
        throw error;
    }
};

/**
 * Get traffic conditions for a route
 */
const getTrafficConditions = async (origin, destination) => {
    try {
        const eta = await calculateETA(origin, destination);
        const route = await getOptimizedRoute(origin, destination);

        return {
            currentTraffic: eta.trafficCondition,
            estimatedDelay: calculateDelay(eta),
            alternativeRoutes: route?.alternatives || [],
            recommendedRoute: route?.recommended || null
        };
    } catch (error) {
        console.error('Error getting traffic conditions:', error);
        return null;
    }
};

/**
 * Calculate delay based on traffic
 */
const calculateDelay = (eta) => {
    if (!eta || eta.trafficCondition === 'unknown') return 0;

    const baseSpeed = 50; // km/h without traffic
    const baseTime = (eta.distance / 1000) / baseSpeed * 3600; // in seconds
    const delay = Math.max(0, eta.duration - baseTime);

    return Math.round(delay / 60); // return in minutes
};

/**
 * Get navigation instructions
 */
const getNavigationInstructions = async (origin, destination) => {
    try {
        const route = await getOptimizedRoute(origin, destination);
        
        if (!route || !route.recommended) {
            return null;
        }

        return {
            steps: route.recommended.steps,
            distance: route.recommended.distance,
            duration: route.recommended.duration,
            polyline: route.recommended.polyline,
            trafficCondition: route.recommended.trafficCondition
        };
    } catch (error) {
        console.error('Error getting navigation instructions:', error);
        return null;
    }
};

/**
 * Predict arrival time with machine learning (simplified version)
 */
const predictArrivalTime = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        const currentLocation = booking.tracking?.currentLocation;
        const targetLocation = booking.status === 'picked-up' 
            ? booking.location.destination?.coordinates || booking.location.address.coordinates
            : booking.location.address.coordinates;

        if (!currentLocation || !targetLocation) {
            return null;
        }

        const eta = await calculateETA(currentLocation, targetLocation);
        
        // Apply historical data adjustments (simplified)
        const adjustmentFactor = getHistoricalAdjustment(booking);
        const adjustedDuration = Math.round(eta.duration * adjustmentFactor);

        return {
            ...eta,
            duration: adjustedDuration,
            eta: new Date(Date.now() + adjustedDuration * 1000),
            confidence: calculateConfidence(eta.trafficCondition),
            adjustmentFactor
        };
    } catch (error) {
        console.error('Error predicting arrival time:', error);
        return null;
    }
};

/**
 * Get historical adjustment factor based on time of day and traffic
 */
const getHistoricalAdjustment = (booking) => {
    const hour = new Date().getHours();
    
    // Peak hours: 8-10 AM, 5-8 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        return 1.3; // 30% longer during peak hours
    }
    
    // Off-peak hours
    if (hour >= 22 || hour <= 6) {
        return 0.8; // 20% faster during off-peak
    }
    
    return 1.0; // Normal hours
};

/**
 * Calculate confidence level for ETA prediction
 */
const calculateConfidence = (trafficCondition) => {
    const confidenceMap = {
        light: 0.95,
        moderate: 0.85,
        heavy: 0.70,
        severe: 0.60,
        unknown: 0.50
    };
    
    return confidenceMap[trafficCondition] || 0.50;
};

module.exports = {
    calculateETA,
    getOptimizedRoute,
    updateBookingTracking,
    startLiveTracking,
    stopLiveTracking,
    getTrafficConditions,
    getNavigationInstructions,
    predictArrivalTime,
    calculateDistance
};
