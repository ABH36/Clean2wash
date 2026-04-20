const axios = require('axios');
const Booking = require('../models/Booking');
const SpareDriver = require('../models/SpareDriver');
const socketService = require('../services/enhancedSocketService');
const { sendNotification } = require('../utils/notificationService');

/**
 * Advanced Tracking Service - Production-grade tracking with ETA, route optimization, and traffic awareness
 * Exactly like Rapido
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Calculate ETA with traffic data
 */
const calculateETA = async (origin, destination, mode = 'driving') => {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                origin: `${origin.lat},${origin.lng}`,
                destination: `${destination.lat},${destination.lng}`,
                mode,
                departure_time: 'now',
                traffic_model: 'best_guess',
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status !== 'OK' || !response.data.routes.length) {
            throw new Error('Unable to calculate route');
        }

        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
            distance: {
                value: leg.distance.value, // meters
                text: leg.distance.text
            },
            duration: {
                value: leg.duration.value, // seconds
                text: leg.duration.text
            },
            durationInTraffic: leg.duration_in_traffic ? {
                value: leg.duration_in_traffic.value,
                text: leg.duration_in_traffic.text
            } : null,
            eta: new Date(Date.now() + (leg.duration_in_traffic?.value || leg.duration.value) * 1000),
            route: {
                polyline: route.overview_polyline.points,
                bounds: route.bounds,
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                    distance: step.distance.text,
                    duration: step.duration.text,
                    startLocation: step.start_location,
                    endLocation: step.end_location
                }))
            },
            trafficCondition: getTrafficCondition(leg.duration.value, leg.duration_in_traffic?.value)
        };
    } catch (error) {
        console.error('Error calculating ETA:', error);
        throw error;
    }
};

/**
 * Get traffic condition based on duration comparison
 */
const getTrafficCondition = (normalDuration, trafficDuration) => {
    if (!trafficDuration) return 'unknown';
    
    const ratio = trafficDuration / normalDuration;
    
    if (ratio < 1.1) return 'light';
    if (ratio < 1.3) return 'moderate';
    if (ratio < 1.5) return 'heavy';
    return 'severe';
};

/**
 * Optimize route with multiple waypoints
 */
const optimizeRoute = async (origin, destination, waypoints = []) => {
    try {
        const waypointsParam = waypoints.length > 0
            ? waypoints.map(w => `${w.lat},${w.lng}`).join('|')
            : null;

        const params = {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            departure_time: 'now',
            traffic_model: 'best_guess',
            optimize: true,
            key: GOOGLE_MAPS_API_KEY
        };

        if (waypointsParam) {
            params.waypoints = `optimize:true|${waypointsParam}`;
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params
        });

        if (response.data.status !== 'OK' || !response.data.routes.length) {
            throw new Error('Unable to optimize route');
        }

        const route = response.data.routes[0];
        
        return {
            optimizedOrder: route.waypoint_order || [],
            totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
            totalDuration: route.legs.reduce((sum, leg) => sum + (leg.duration_in_traffic?.value || leg.duration.value), 0),
            route: {
                polyline: route.overview_polyline.points,
                bounds: route.bounds
            },
            legs: route.legs.map(leg => ({
                distance: leg.distance,
                duration: leg.duration,
                durationInTraffic: leg.duration_in_traffic,
                startAddress: leg.start_address,
                endAddress: leg.end_address
            }))
        };
    } catch (error) {
        console.error('Error optimizing route:', error);
        throw error;
    }
};

/**
 * Get real-time traffic data for a route
 */
const getTrafficData = async (origin, destination) => {
    try {
        const etaData = await calculateETA(origin, destination);
        
        return {
            condition: etaData.trafficCondition,
            normalDuration: etaData.duration.value,
            currentDuration: etaData.durationInTraffic?.value || etaData.duration.value,
            delay: (etaData.durationInTraffic?.value || etaData.duration.value) - etaData.duration.value,
            delayText: formatDelay((etaData.durationInTraffic?.value || etaData.duration.value) - etaData.duration.value),
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error getting traffic data:', error);
        throw error;
    }
};

/**
 * Format delay in human-readable format
 */
const formatDelay = (seconds) => {
    if (seconds <= 0) return 'No delay';
    if (seconds < 60) return `${seconds} sec delay`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min delay`;
};

/**
 * Update booking with real-time tracking data
 */
const updateBookingTracking = async (bookingId, driverLocation) => {
    try {
        const booking = await Booking.findById(bookingId)
            .populate('consumer')
            .populate('provider.id');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Calculate ETA to pickup (if not picked up yet)
        let pickupETA = null;
        if (booking.status === 'accepted' || booking.status === 'driver_assigned') {
            pickupETA = await calculateETA(
                driverLocation,
                booking.pickupLocation.coordinates
            );
        }

        // Calculate ETA to drop (if picked up)
        let dropETA = null;
        if (booking.status === 'in_progress' || booking.status === 'picked_up') {
            dropETA = await calculateETA(
                driverLocation,
                booking.dropLocation.coordinates
            );
        }

        // Update booking with tracking data
        booking.tracking = {
            currentLocation: driverLocation,
            pickupETA: pickupETA ? {
                duration: pickupETA.duration.value,
                durationText: pickupETA.duration.text,
                distance: pickupETA.distance.value,
                distanceText: pickupETA.distance.text,
                eta: pickupETA.eta,
                trafficCondition: pickupETA.trafficCondition
            } : null,
            dropETA: dropETA ? {
                duration: dropETA.duration.value,
                durationText: dropETA.duration.text,
                distance: dropETA.distance.value,
                distanceText: dropETA.distance.text,
                eta: dropETA.eta,
                trafficCondition: dropETA.trafficCondition
            } : null,
            lastUpdated: new Date()
        };

        await booking.save();

        // Emit real-time update via socket
        const io = socketService.getIO();
        if (io) {
            io.to(`booking_${bookingId}`).emit('tracking_update', {
                bookingId,
                tracking: booking.tracking,
                driverLocation
            });

            // Send to consumer's personal room
            io.to(`user_${booking.consumer._id}`).emit('tracking_update', {
                bookingId,
                tracking: booking.tracking,
                driverLocation
            });
        }

        // Check if driver is near pickup/drop and send notifications
        await checkProximityNotifications(booking, driverLocation);

        return booking.tracking;
    } catch (error) {
        console.error('Error updating booking tracking:', error);
        throw error;
    }
};

/**
 * Check proximity and send arrival notifications
 */
const checkProximityNotifications = async (booking, driverLocation) => {
    try {
        const NEAR_THRESHOLD = 500; // 500 meters
        const ARRIVING_THRESHOLD = 200; // 200 meters

        if (booking.status === 'accepted' || booking.status === 'driver_assigned') {
            // Check distance to pickup
            const distanceToPickup = calculateDistance(
                driverLocation,
                booking.pickupLocation.coordinates
            );

            // Send "arriving soon" notification
            if (distanceToPickup <= NEAR_THRESHOLD && distanceToPickup > ARRIVING_THRESHOLD) {
                if (!booking.notifications?.nearPickup) {
                    await sendNotification(booking.consumer._id, {
                        title: 'Driver is nearby',
                        message: `${booking.provider.id.name} is ${Math.round(distanceToPickup)}m away`,
                        type: 'tracking',
                        priority: 'high',
                        data: {
                            bookingId: booking._id.toString(),
                            distance: distanceToPickup,
                            eta: booking.tracking?.pickupETA?.durationText
                        }
                    });

                    booking.notifications = booking.notifications || {};
                    booking.notifications.nearPickup = true;
                    await booking.save();
                }
            }

            // Send "arriving now" notification
            if (distanceToPickup <= ARRIVING_THRESHOLD) {
                if (!booking.notifications?.arrivingPickup) {
                    await sendNotification(booking.consumer._id, {
                        title: 'Driver has arrived!',
                        message: `${booking.provider.id.name} is at your pickup location`,
                        type: 'tracking',
                        priority: 'urgent',
                        sound: 'arrival_sound',
                        data: {
                            bookingId: booking._id.toString(),
                            distance: distanceToPickup
                        }
                    });

                    booking.notifications = booking.notifications || {};
                    booking.notifications.arrivingPickup = true;
                    await booking.save();
                }
            }
        }

        if (booking.status === 'in_progress' || booking.status === 'picked_up') {
            // Check distance to drop
            const distanceToDrop = calculateDistance(
                driverLocation,
                booking.dropLocation.coordinates
            );

            // Send "arriving at destination" notification
            if (distanceToDrop <= NEAR_THRESHOLD && distanceToDrop > ARRIVING_THRESHOLD) {
                if (!booking.notifications?.nearDrop) {
                    await sendNotification(booking.consumer._id, {
                        title: 'Arriving at destination',
                        message: `You will reach in ${booking.tracking?.dropETA?.durationText || '2 minutes'}`,
                        type: 'tracking',
                        priority: 'normal',
                        data: {
                            bookingId: booking._id.toString(),
                            distance: distanceToDrop,
                            eta: booking.tracking?.dropETA?.durationText
                        }
                    });

                    booking.notifications = booking.notifications || {};
                    booking.notifications.nearDrop = true;
                    await booking.save();
                }
            }
        }
    } catch (error) {
        console.error('Error checking proximity notifications:', error);
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Get alternative routes
 */
const getAlternativeRoutes = async (origin, destination) => {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                origin: `${origin.lat},${origin.lng}`,
                destination: `${destination.lat},${destination.lng}`,
                mode: 'driving',
                departure_time: 'now',
                traffic_model: 'best_guess',
                alternatives: true,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status !== 'OK' || !response.data.routes.length) {
            throw new Error('Unable to get alternative routes');
        }

        return response.data.routes.map((route, index) => {
            const leg = route.legs[0];
            return {
                routeIndex: index,
                summary: route.summary,
                distance: leg.distance,
                duration: leg.duration,
                durationInTraffic: leg.duration_in_traffic,
                trafficCondition: getTrafficCondition(leg.duration.value, leg.duration_in_traffic?.value),
                polyline: route.overview_polyline.points,
                isFastest: index === 0
            };
        });
    } catch (error) {
        console.error('Error getting alternative routes:', error);
        throw error;
    }
};

/**
 * Get navigation instructions
 */
const getNavigationInstructions = async (origin, destination) => {
    try {
        const etaData = await calculateETA(origin, destination);
        
        return {
            steps: etaData.route.steps,
            totalDistance: etaData.distance,
            totalDuration: etaData.durationInTraffic || etaData.duration,
            eta: etaData.eta,
            polyline: etaData.route.polyline,
            trafficCondition: etaData.trafficCondition
        };
    } catch (error) {
        console.error('Error getting navigation instructions:', error);
        throw error;
    }
};

/**
 * Start live tracking for a booking
 */
const startLiveTracking = async (bookingId, driverId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        booking.liveTracking = {
            isActive: true,
            startedAt: new Date(),
            driverId
        };

        await booking.save();

        // Emit tracking started event
        const io = socketService.getIO();
        if (io) {
            io.to(`booking_${bookingId}`).emit('tracking_started', {
                bookingId,
                driverId
            });
        }

        return booking;
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
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        booking.liveTracking = {
            isActive: false,
            endedAt: new Date()
        };

        await booking.save();

        // Emit tracking stopped event
        const io = socketService.getIO();
        if (io) {
            io.to(`booking_${bookingId}`).emit('tracking_stopped', {
                bookingId
            });
        }

        return booking;
    } catch (error) {
        console.error('Error stopping live tracking:', error);
        throw error;
    }
};

module.exports = {
    calculateETA,
    optimizeRoute,
    getTrafficData,
    updateBookingTracking,
    getAlternativeRoutes,
    getNavigationInstructions,
    startLiveTracking,
    stopLiveTracking,
    calculateDistance
};
