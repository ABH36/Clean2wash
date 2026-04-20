/**
 * 🚀 Dispatch Service - Smart Driver Assignment Engine
 * 
 * Features:
 * - Auto-assign drivers to pending bookings
 * - Smart matching algorithm (distance, rating, availability)
 * - Queue management for unassigned bookings
 * - Escalation for stuck bookings
 * - Driver availability tracking
 */

const Booking = require('../models/Booking');
const SpareDriver = require('../models/SpareDriver');
const socketService = require('../services/enhancedSocketService');

class DispatchService {
    constructor() {
        this.assignmentQueue = [];
        this.processingQueue = false;
        this.maxRetries = 3;
        this.retryDelay = 30000; // 30 seconds
        this.escalationThreshold = 180000; // 3 minutes
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * @param {Object} coord1 - { lat, lng }
     * @param {Object} coord2 - { lat, lng }
     * @returns {Number} Distance in kilometers
     */
    calculateDistance(coord1, coord2) {
        if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
            return Infinity;
        }

        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Find available drivers near booking location
     * @param {Object} booking - Booking document
     * @param {Number} radiusKm - Search radius in kilometers
     * @returns {Array} Available drivers with distance
     */
    async findNearbyDrivers(booking, radiusKm = 15) {
        try {
            const bookingLocation = booking.location?.address?.coordinates || 
                                   booking.location?.coordinates;

            if (!bookingLocation || !bookingLocation.lat || !bookingLocation.lng) {
                console.error('[Dispatch] Invalid booking location:', booking._id);
                return [];
            }

            // Find all active, approved, online drivers
            const drivers = await SpareDriver.find({
                status: 'ACTIVE',
                verificationStatus: 'APPROVED',
                'onlineStatus.isOnline': true
            }).select('name phone driverId currentLocation reliabilityScore onlineStatus');

            // Calculate distance for each driver and filter by radius
            const driversWithDistance = drivers
                .map(driver => {
                    const driverLocation = driver.currentLocation?.coordinates;
                    
                    if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
                        return null;
                    }

                    const distance = this.calculateDistance(bookingLocation, driverLocation);
                    
                    return {
                        driver,
                        distance,
                        reliabilityScore: driver.reliabilityScore?.score || 50,
                        rating: driver.reliabilityScore?.score || 50,
                        completionRate: driver.reliabilityScore?.metrics?.completionRate || 0,
                        isOnline: driver.onlineStatus?.isOnline || false
                    };
                })
                .filter(item => item !== null && item.distance <= radiusKm);

            console.log(`[Dispatch] Found ${driversWithDistance.length} drivers within ${radiusKm}km for booking ${booking._id}`);
            
            return driversWithDistance;
        } catch (error) {
            console.error('[Dispatch] Error finding nearby drivers:', error);
            return [];
        }
    }

    /**
     * Smart driver matching algorithm
     * Priority: Distance (40%) > Reliability (30%) > Completion Rate (30%)
     * @param {Array} driversWithDistance - Array of drivers with distance
     * @returns {Object} Best matched driver
     */
    selectBestDriver(driversWithDistance) {
        if (!driversWithDistance || driversWithDistance.length === 0) {
            return null;
        }

        // Sort by composite score
        const sortedDrivers = driversWithDistance.sort((a, b) => {
            // Normalize distance (0-15km to 0-100 score, lower is better)
            const distanceScoreA = Math.max(0, 100 - (a.distance / 15) * 100);
            const distanceScoreB = Math.max(0, 100 - (b.distance / 15) * 100);

            // Reliability score (0-100)
            const reliabilityScoreA = a.reliabilityScore || 50;
            const reliabilityScoreB = b.reliabilityScore || 50;

            // Completion rate (0-100)
            const completionScoreA = a.completionRate || 0;
            const completionScoreB = b.completionRate || 0;

            // Weighted composite score
            const compositeScoreA = (distanceScoreA * 0.4) + (reliabilityScoreA * 0.3) + (completionScoreA * 0.3);
            const compositeScoreB = (distanceScoreB * 0.4) + (reliabilityScoreB * 0.3) + (completionScoreB * 0.3);

            return compositeScoreB - compositeScoreA; // Higher score is better
        });

        const bestMatch = sortedDrivers[0];
        
        console.log(`[Dispatch] Best driver match: ${bestMatch.driver.name} (${bestMatch.distance.toFixed(2)}km away, score: ${bestMatch.reliabilityScore})`);
        
        return bestMatch;
    }

    /**
     * Check if driver can accept booking (duty hours, fatigue, etc.)
     * @param {Object} driver - SpareDriver document
     * @returns {Object} { canAccept: boolean, reason: string }
     */
    async checkDriverEligibility(driver) {
        try {
            // Check if driver has current booking
            const currentBooking = await Booking.findOne({
                'provider.id': driver._id,
                status: { $in: ['assigned', 'in_progress'] }
            });

            if (currentBooking) {
                return { 
                    canAccept: false, 
                    reason: 'Driver has active booking' 
                };
            }

            // Check duty hours
            const dutyStatus = driver.dutyHours?.status;
            if (dutyStatus?.isOverworked) {
                return { 
                    canAccept: false, 
                    reason: 'Driver exceeded duty hours limit' 
                };
            }

            if (dutyStatus?.needsBreak) {
                return { 
                    canAccept: false, 
                    reason: 'Driver needs mandatory break' 
                };
            }

            // Check if driver is blocked
            if (driver.status !== 'ACTIVE') {
                return { 
                    canAccept: false, 
                    reason: 'Driver is not active' 
                };
            }

            // Check if driver is online
            if (!driver.onlineStatus?.isOnline) {
                return { 
                    canAccept: false, 
                    reason: 'Driver is offline' 
                };
            }

            return { canAccept: true, reason: null };
        } catch (error) {
            console.error('[Dispatch] Error checking driver eligibility:', error);
            return { canAccept: false, reason: 'Error checking eligibility' };
        }
    }

    /**
     * Assign driver to booking
     * @param {String} bookingId - Booking ID
     * @param {String} driverId - Driver ID
     * @param {Boolean} autoAssigned - Whether assignment was automatic
     * @returns {Object} { success: boolean, booking: Object, message: string }
     */
    async assignDriver(bookingId, driverId, autoAssigned = false) {
        try {
            const driver = await SpareDriver.findById(driverId);
            if (!driver) {
                return { 
                    success: false, 
                    message: 'Driver not found' 
                };
            }

            // Check eligibility
            const eligibility = await this.checkDriverEligibility(driver);
            if (!eligibility.canAccept) {
                return { 
                    success: false, 
                    message: eligibility.reason 
                };
            }

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return { 
                    success: false, 
                    message: 'Booking not found' 
                };
            }

            // Update booking
            booking.provider = {
                type: 'sparedriver',
                id: driver._id,
                name: driver.name,
                phone: driver.phone,
                rating: driver.reliabilityScore?.score || 5.0,
                photo: driver.profile?.photo || ''
            };

            booking.status = 'assigned';
            booking.tracking = booking.tracking || {};
            booking.tracking.assignedAt = new Date();
            booking.tracking.autoAssigned = autoAssigned;

            await booking.save();

            // Emit socket events
            const io = socketService.getIO();
            
            // Notify driver
            io.to(driver._id.toString()).emit('booking_assigned', {
                bookingId: booking._id,
                bookingDetails: {
                    id: booking.bookingId || booking._id,
                    service: booking.service?.name,
                    location: booking.location?.address?.street,
                    scheduledTime: booking.schedule?.startTime,
                    amount: booking.pricing?.totalAmount
                },
                message: `You have been assigned to booking ${booking.bookingId || booking._id}`,
                autoAssigned
            });

            // Notify admin room
            io.to('admin_room').emit('driver_assigned', {
                bookingId: booking._id,
                driverId: driver._id,
                driverName: driver.name,
                autoAssigned
            });

            // Notify consumer
            if (booking.consumer) {
                io.to(booking.consumer.toString()).emit('driver_assigned_to_booking', {
                    bookingId: booking._id,
                    driver: {
                        name: driver.name,
                        phone: driver.phone,
                        rating: driver.reliabilityScore?.score || 5.0,
                        photo: driver.profile?.photo || ''
                    }
                });
            }

            console.log(`[Dispatch] ✅ Driver ${driver.name} assigned to booking ${booking._id} (${autoAssigned ? 'AUTO' : 'MANUAL'})`);

            return { 
                success: true, 
                booking, 
                driver,
                message: `Driver ${driver.name} assigned successfully` 
            };
        } catch (error) {
            console.error('[Dispatch] Error assigning driver:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to assign driver' 
            };
        }
    }

    /**
     * Auto-assign best driver to booking
     * @param {String} bookingId - Booking ID
     * @returns {Object} Assignment result
     */
    async autoAssignBooking(bookingId) {
        try {
            const booking = await Booking.findById(bookingId);
            
            if (!booking) {
                return { 
                    success: false, 
                    message: 'Booking not found' 
                };
            }

            // Check if already assigned
            if (booking.status !== 'pending') {
                return { 
                    success: false, 
                    message: 'Booking is not pending' 
                };
            }

            // Find nearby drivers
            const nearbyDrivers = await this.findNearbyDrivers(booking, 15);
            
            if (nearbyDrivers.length === 0) {
                console.log(`[Dispatch] ⚠️ No drivers available for booking ${booking._id}`);
                return { 
                    success: false, 
                    message: 'No drivers available within 15km radius' 
                };
            }

            // Filter eligible drivers
            const eligibleDrivers = [];
            for (const driverData of nearbyDrivers) {
                const eligibility = await this.checkDriverEligibility(driverData.driver);
                if (eligibility.canAccept) {
                    eligibleDrivers.push(driverData);
                }
            }

            if (eligibleDrivers.length === 0) {
                console.log(`[Dispatch] ⚠️ No eligible drivers for booking ${booking._id}`);
                return { 
                    success: false, 
                    message: 'No eligible drivers available' 
                };
            }

            // Select best driver
            const bestMatch = this.selectBestDriver(eligibleDrivers);
            
            if (!bestMatch) {
                return { 
                    success: false, 
                    message: 'Could not find suitable driver' 
                };
            }

            // Assign driver
            const result = await this.assignDriver(
                booking._id, 
                bestMatch.driver._id, 
                true // autoAssigned = true
            );

            return result;
        } catch (error) {
            console.error('[Dispatch] Error in auto-assign:', error);
            return { 
                success: false, 
                message: error.message || 'Auto-assignment failed' 
            };
        }
    }

    /**
     * Process dispatch queue - auto-assign pending bookings
     */
    async processQueue() {
        if (this.processingQueue) {
            return; // Already processing
        }

        this.processingQueue = true;

        try {
            // Find pending chauffeur bookings
            const pendingBookings = await Booking.find({
                'service.category': 'Chauffeur',
                status: 'pending',
                isActive: true,
                createdAt: { $gte: new Date(Date.now() - 600000) } // Last 10 minutes
            }).sort({ createdAt: 1 }); // Oldest first

            console.log(`[Dispatch Queue] Processing ${pendingBookings.length} pending bookings`);

            for (const booking of pendingBookings) {
                // Check if booking is stuck (older than 3 minutes)
                const bookingAge = Date.now() - new Date(booking.createdAt).getTime();
                const isStuck = bookingAge > this.escalationThreshold;

                if (isStuck) {
                    console.log(`[Dispatch Queue] ⚠️ ESCALATION: Booking ${booking._id} stuck for ${Math.floor(bookingAge / 1000)}s`);
                    
                    // Emit escalation alert to admin
                    const io = socketService.getIO();
                    io.to('admin_room').emit('booking_escalation', {
                        bookingId: booking._id,
                        age: bookingAge,
                        message: `Booking ${booking.bookingId || booking._id} has been pending for ${Math.floor(bookingAge / 60000)} minutes`
                    });
                }

                // Attempt auto-assignment
                const result = await this.autoAssignBooking(booking._id);
                
                if (result.success) {
                    console.log(`[Dispatch Queue] ✅ Auto-assigned booking ${booking._id}`);
                } else {
                    console.log(`[Dispatch Queue] ❌ Failed to assign booking ${booking._id}: ${result.message}`);
                }

                // Small delay between assignments
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('[Dispatch Queue] Error processing queue:', error);
        } finally {
            this.processingQueue = false;
        }
    }

    /**
     * Start dispatch queue processor (runs every 30 seconds)
     */
    startQueueProcessor() {
        console.log('[Dispatch] 🚀 Starting dispatch queue processor...');
        
        // Process immediately
        this.processQueue();
        
        // Then process every 30 seconds
        this.queueInterval = setInterval(() => {
            this.processQueue();
        }, 30000); // 30 seconds
    }

    /**
     * Stop dispatch queue processor
     */
    stopQueueProcessor() {
        if (this.queueInterval) {
            clearInterval(this.queueInterval);
            console.log('[Dispatch] 🛑 Stopped dispatch queue processor');
        }
    }

    /**
     * Get dispatch statistics
     */
    async getStats() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const [
                totalPending,
                totalAssigned,
                autoAssignedToday,
                manualAssignedToday,
                stuckBookings
            ] = await Promise.all([
                Booking.countDocuments({
                    'service.category': 'Chauffeur',
                    status: 'pending',
                    isActive: true
                }),
                Booking.countDocuments({
                    'service.category': 'Chauffeur',
                    status: 'assigned',
                    isActive: true
                }),
                Booking.countDocuments({
                    'service.category': 'Chauffeur',
                    'tracking.autoAssigned': true,
                    'tracking.assignedAt': { $gte: today }
                }),
                Booking.countDocuments({
                    'service.category': 'Chauffeur',
                    'tracking.autoAssigned': false,
                    'tracking.assignedAt': { $gte: today }
                }),
                Booking.countDocuments({
                    'service.category': 'Chauffeur',
                    status: 'pending',
                    isActive: true,
                    createdAt: { $lte: new Date(Date.now() - this.escalationThreshold) }
                })
            ]);

            const onlineDrivers = await SpareDriver.countDocuments({
                status: 'ACTIVE',
                verificationStatus: 'APPROVED',
                'onlineStatus.isOnline': true
            });

            return {
                pending: totalPending,
                assigned: totalAssigned,
                autoAssignedToday,
                manualAssignedToday,
                stuckBookings,
                onlineDrivers,
                queueActive: this.processingQueue
            };
        } catch (error) {
            console.error('[Dispatch] Error getting stats:', error);
            return null;
        }
    }
}

// Export singleton instance
const dispatchService = new DispatchService();
module.exports = dispatchService;
