const Penalty = require('../models/Penalty');
const Booking = require('../models/Booking');
const SpareDriver = require('../models/SpareDriver');
const PricingConfig = require('../models/PricingConfig');

class PenaltyService {
    
    /**
     * Auto-apply penalty based on booking cancellation
     */
    static async applyCancellationPenalty(bookingId, cancelledBy, cancellationTime) {
        try {
            const booking = await Booking.findById(bookingId)
                .populate('provider.id');
            
            if (!booking) {
                throw new Error('Booking not found');
            }
            
            const config = await PricingConfig.getSingleton();
            const tripStartTime = new Date(booking.scheduledTime || booking.createdAt);
            const timeDiff = tripStartTime - cancellationTime;
            const hoursBeforeTrip = timeDiff / (1000 * 60 * 60);
            
            let penaltyAmount = 0;
            let penaltyType = '';
            let reason = '';
            
            if (cancelledBy === 'customer') {
                if (hoursBeforeTrip > 1) {
                    penaltyAmount = config.cancellation.customer.beforeTrip;
                    penaltyType = 'CANCELLATION_BEFORE_TRIP';
                    reason = 'Customer cancelled booking before trip start';
                } else {
                    penaltyAmount = config.cancellation.customer.afterTripStart;
                    penaltyType = 'CANCELLATION_AFTER_START';
                    reason = 'Customer cancelled booking close to trip time';
                }
                
                // Apply to customer (not implemented in current model, but structure ready)
                // For now, we'll log this for future implementation
                console.log(`Customer penalty: ₹${penaltyAmount} for booking ${bookingId}`);
                
            } else if (cancelledBy === 'driver') {
                if (hoursBeforeTrip > 1) {
                    penaltyAmount = config.cancellation.driver.beforeTrip;
                    penaltyType = 'CANCELLATION_BEFORE_TRIP';
                    reason = 'Driver cancelled booking before trip start';
                } else {
                    penaltyAmount = config.cancellation.driver.afterTripStart;
                    penaltyType = 'CANCELLATION_AFTER_START';
                    reason = 'Driver cancelled booking close to trip time';
                }
                
                // Apply to driver
                const penalty = await Penalty.create({
                    driver: booking.provider.id._id,
                    booking: bookingId,
                    type: penaltyType,
                    amount: penaltyAmount,
                    reason,
                    description: `Auto-applied cancellation penalty`
                });
                
                // Auto-apply the penalty
                await penalty.apply(null); // System applied
                
                return penalty;
            }
            
        } catch (error) {
            console.error('Error applying cancellation penalty:', error);
            throw error;
        }
    }
    
    /**
     * Apply no-show penalty
     */
    static async applyNoShowPenalty(bookingId, noShowBy) {
        try {
            const booking = await Booking.findById(bookingId)
                .populate('provider.id');
            
            if (!booking) {
                throw new Error('Booking not found');
            }
            
            const config = await PricingConfig.getSingleton();
            
            if (noShowBy === 'driver') {
                const penalty = await Penalty.create({
                    driver: booking.provider.id._id,
                    booking: bookingId,
                    type: 'NO_SHOW',
                    amount: config.cancellation.driver.noShow,
                    reason: 'Driver did not show up for the booking',
                    description: 'Auto-applied no-show penalty'
                });
                
                await penalty.apply(null);
                return penalty;
            }
            
        } catch (error) {
            console.error('Error applying no-show penalty:', error);
            throw error;
        }
    }
    
    /**
     * Apply late arrival penalty
     */
    static async applyLateArrivalPenalty(bookingId, minutesLate) {
        try {
            const booking = await Booking.findById(bookingId)
                .populate('provider.id');
            
            if (!booking || minutesLate < 15) {
                return null; // No penalty for less than 15 minutes
            }
            
            let penaltyAmount = 50; // Base penalty
            if (minutesLate > 30) {
                penaltyAmount = 100;
            }
            if (minutesLate > 60) {
                penaltyAmount = 150;
            }
            
            const penalty = await Penalty.create({
                driver: booking.provider.id._id,
                booking: bookingId,
                type: 'LATE_ARRIVAL',
                amount: penaltyAmount,
                reason: `Driver arrived ${minutesLate} minutes late`,
                description: `Auto-applied late arrival penalty for ${minutesLate} minutes delay`
            });
            
            await penalty.apply(null);
            return penalty;
            
        } catch (error) {
            console.error('Error applying late arrival penalty:', error);
            throw error;
        }
    }
    
    /**
     * Apply rating-based penalty
     */
    static async applyRatingPenalty(bookingId, rating, feedback) {
        try {
            if (rating >= 3) {
                return null; // No penalty for ratings 3 and above
            }
            
            const booking = await Booking.findById(bookingId)
                .populate('provider.id');
            
            if (!booking) {
                throw new Error('Booking not found');
            }
            
            let penaltyAmount = 0;
            if (rating === 1) {
                penaltyAmount = 100;
            } else if (rating === 2) {
                penaltyAmount = 50;
            }
            
            const penalty = await Penalty.create({
                driver: booking.provider.id._id,
                booking: bookingId,
                type: 'CUSTOMER_COMPLAINT',
                amount: penaltyAmount,
                reason: `Poor customer rating: ${rating} stars`,
                description: `Auto-applied penalty for low rating. Feedback: ${feedback || 'No feedback provided'}`
            });
            
            await penalty.apply(null);
            return penalty;
            
        } catch (error) {
            console.error('Error applying rating penalty:', error);
            throw error;
        }
    }
    
    /**
     * Get driver's penalty summary
     */
    static async getDriverPenaltySummary(driverId, startDate, endDate) {
        try {
            const dateFilter = { driver: driverId };
            
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }
            
            const penalties = await Penalty.find(dateFilter);
            
            const summary = {
                totalPenalties: penalties.length,
                totalAmount: penalties.reduce((sum, p) => sum + p.amount, 0),
                appliedAmount: penalties
                    .filter(p => p.status === 'APPLIED')
                    .reduce((sum, p) => sum + p.amount, 0),
                pendingAmount: penalties
                    .filter(p => p.status === 'PENDING')
                    .reduce((sum, p) => sum + p.amount, 0),
                byType: {}
            };
            
            // Group by type
            penalties.forEach(penalty => {
                if (!summary.byType[penalty.type]) {
                    summary.byType[penalty.type] = {
                        count: 0,
                        amount: 0
                    };
                }
                summary.byType[penalty.type].count++;
                summary.byType[penalty.type].amount += penalty.amount;
            });
            
            return summary;
            
        } catch (error) {
            console.error('Error getting driver penalty summary:', error);
            throw error;
        }
    }
    
    /**
     * Check if driver has excessive penalties (for blocking)
     */
    static async checkExcessivePenalties(driverId) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentPenalties = await Penalty.find({
                driver: driverId,
                status: 'APPLIED',
                createdAt: { $gte: thirtyDaysAgo }
            });
            
            const totalAmount = recentPenalties.reduce((sum, p) => sum + p.amount, 0);
            const penaltyCount = recentPenalties.length;
            
            // Define thresholds
            const shouldBlock = totalAmount > 2000 || penaltyCount > 10;
            const shouldWarn = totalAmount > 1000 || penaltyCount > 5;
            
            return {
                shouldBlock,
                shouldWarn,
                totalAmount,
                penaltyCount,
                recentPenalties: recentPenalties.length
            };
            
        } catch (error) {
            console.error('Error checking excessive penalties:', error);
            throw error;
        }
    }
}

module.exports = PenaltyService;