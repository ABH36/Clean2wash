const Penalty = require('../models/Penalty');
const PricingConfig = require('../models/PricingConfig');

/**
 * PENALTY HELPER
 * Auto-applies penalties based on booking events
 */

class PenaltyHelper {
    /**
     * Auto-apply penalty on driver cancellation
     * @param {Object} booking - Booking document
     * @param {String} cancelledBy - 'customer' or 'driver'
     * @param {ObjectId} adminUserId - Admin user ID for audit
     * @returns {Object} Penalty document or null
     */
    static async applyDriverCancellationPenalty(booking, cancelledBy, adminUserId = null) {
        // Only apply penalty if driver cancelled
        if (cancelledBy !== 'driver') {
            return null;
        }

        // Only for spare driver bookings
        if (booking.service?.type !== 'sparedriver' && booking.provider?.type !== 'sparedriver') {
            return null;
        }

        // Check if driver is assigned
        if (!booking.provider?.id) {
            return null;
        }

        try {
            // Get pricing config for penalty amounts
            const pricingConfig = await PricingConfig.getSingleton();
            
            // Determine penalty type and amount based on booking status
            let penaltyType = 'CANCELLATION_BEFORE_TRIP';
            let penaltyAmount = pricingConfig.cancellation.driver.beforeTrip;
            let reason = 'Driver cancelled booking before trip start';

            // Check if trip already started
            const tripStartedStatuses = ['in_progress', 'active', 'arrived', 'en_route'];
            if (tripStartedStatuses.includes(booking.status)) {
                penaltyType = 'CANCELLATION_AFTER_START';
                penaltyAmount = pricingConfig.cancellation.driver.afterTripStart;
                reason = 'Driver cancelled booking after trip started';
            }

            // Check if driver was no-show
            if (booking.status === 'confirmed' || booking.status === 'assigned') {
                const scheduledTime = new Date(booking.schedule?.date);
                if (booking.schedule?.timeSlot?.start) {
                    const [hours, minutes] = booking.schedule.timeSlot.start.split(':');
                    scheduledTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                }

                const now = new Date();
                const timeDiff = now - scheduledTime;
                const minutesDiff = timeDiff / (1000 * 60);

                // If more than 15 minutes past scheduled time and driver didn't show
                if (minutesDiff > 15) {
                    penaltyType = 'NO_SHOW';
                    penaltyAmount = pricingConfig.cancellation.driver.noShow;
                    reason = 'Driver no-show (did not arrive within 15 minutes of scheduled time)';
                }
            }

            // Create penalty
            const penalty = await Penalty.create({
                driver: booking.provider.id,
                booking: booking._id,
                type: penaltyType,
                amount: penaltyAmount,
                reason: reason,
                description: `Auto-applied penalty for booking #${booking.bookingId || booking._id}`,
                status: 'PENDING'
            });

            // Auto-apply penalty immediately
            if (adminUserId) {
                await penalty.apply(adminUserId);
            } else {
                // Apply without admin (system auto-apply)
                await penalty.apply(null);
            }

            console.log(`✅ Auto-applied penalty: ₹${penaltyAmount} to driver ${booking.provider.id} for ${penaltyType}`);

            return penalty;

        } catch (error) {
            console.error('❌ Failed to apply driver cancellation penalty:', error);
            return null;
        }
    }

    /**
     * Apply late arrival penalty
     * @param {Object} booking - Booking document
     * @param {Number} minutesLate - Minutes late
     * @param {ObjectId} adminUserId - Admin user ID
     */
    static async applyLateArrivalPenalty(booking, minutesLate, adminUserId = null) {
        if (booking.service?.type !== 'sparedriver' && booking.provider?.type !== 'sparedriver') {
            return null;
        }

        if (!booking.provider?.id) {
            return null;
        }

        // Only penalize if more than 15 minutes late
        if (minutesLate < 15) {
            return null;
        }

        try {
            // Calculate penalty: ₹10 per minute after 15 minutes grace period
            const penaltyMinutes = minutesLate - 15;
            const penaltyAmount = Math.min(penaltyMinutes * 10, 500); // Max ₹500

            const penalty = await Penalty.create({
                driver: booking.provider.id,
                booking: booking._id,
                type: 'LATE_ARRIVAL',
                amount: penaltyAmount,
                reason: `Driver arrived ${minutesLate} minutes late`,
                description: `Late arrival penalty: ${penaltyMinutes} minutes × ₹10/min`,
                status: 'PENDING'
            });

            if (adminUserId) {
                await penalty.apply(adminUserId);
            }

            console.log(`✅ Applied late arrival penalty: ₹${penaltyAmount} for ${minutesLate} minutes late`);

            return penalty;

        } catch (error) {
            console.error('❌ Failed to apply late arrival penalty:', error);
            return null;
        }
    }

    /**
     * Apply customer complaint penalty
     * @param {Object} booking - Booking document
     * @param {String} complaintType - Type of complaint
     * @param {Number} amount - Penalty amount
     * @param {ObjectId} adminUserId - Admin user ID
     */
    static async applyComplaintPenalty(booking, complaintType, amount, adminUserId) {
        if (booking.service?.type !== 'sparedriver' && booking.provider?.type !== 'sparedriver') {
            return null;
        }

        if (!booking.provider?.id) {
            return null;
        }

        try {
            const penalty = await Penalty.create({
                driver: booking.provider.id,
                booking: booking._id,
                type: 'CUSTOMER_COMPLAINT',
                amount: amount,
                reason: `Customer complaint: ${complaintType}`,
                description: `Manual penalty applied by admin for customer complaint`,
                status: 'PENDING'
            });

            if (adminUserId) {
                await penalty.apply(adminUserId);
            }

            console.log(`✅ Applied complaint penalty: ₹${amount} for ${complaintType}`);

            return penalty;

        } catch (error) {
            console.error('❌ Failed to apply complaint penalty:', error);
            return null;
        }
    }

    /**
     * Get pending penalties for driver
     * @param {ObjectId} driverId - Driver ID
     */
    static async getPendingPenalties(driverId) {
        return await Penalty.find({
            driver: driverId,
            status: 'PENDING'
        }).populate('booking', 'bookingId status service');
    }

    /**
     * Get total pending penalty amount for driver
     * @param {ObjectId} driverId - Driver ID
     */
    static async getTotalPendingAmount(driverId) {
        const penalties = await this.getPendingPenalties(driverId);
        return penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
    }

    /**
     * Waive penalty (admin action)
     * @param {ObjectId} penaltyId - Penalty ID
     * @param {ObjectId} adminUserId - Admin user ID
     * @param {String} reason - Waiver reason
     */
    static async waivePenalty(penaltyId, adminUserId, reason) {
        const penalty = await Penalty.findById(penaltyId);
        if (!penalty) {
            throw new Error('Penalty not found');
        }

        await penalty.waive(adminUserId, reason);
        console.log(`✅ Waived penalty: ₹${penalty.amount} - ${reason}`);

        return penalty;
    }
}

module.exports = PenaltyHelper;
