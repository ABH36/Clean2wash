const ServiceConfig = require('../models/ServiceConfig');
const PricingConfig = require('../models/PricingConfig');

/**
 * CENTRAL PRICING ENGINE
 * Single source of truth for all pricing calculations
 * Follows Spare Driver business model (time-based, NOT distance-based)
 */

class PricingEngine {
    /**
     * Calculate final price for a booking
     * @param {Object} params - Pricing parameters
     * @param {String} params.serviceType - Service type (point, hourly, full_day, outstation)
     * @param {Number} params.duration - Duration in hours
     * @param {String} params.vehicleType - Vehicle type (hatchback, sedan, suv, luxury)
     * @param {Boolean} params.isScheduled - Is scheduled booking
     * @param {Boolean} params.isSubscriber - Is subscriber
     * @param {Date} params.scheduledTime - Scheduled time (for night/surge check)
     * @param {String} params.destination - Destination (for outstation)
     * @returns {Object} Complete pricing breakdown
     */
    async calculatePrice(params) {
        const {
            serviceType,
            duration,
            vehicleType = 'hatchback',
            isScheduled = false,
            isSubscriber = false,
            scheduledTime = new Date(),
            destination = null
        } = params;

        // Validate inputs
        if (!serviceType) {
            throw new Error('Service type is required');
        }
        if (!duration || duration <= 0) {
            throw new Error('Valid duration is required');
        }

        // Get service configuration
        const serviceConfig = await ServiceConfig.findOne({ type: serviceType, isActive: true });
        if (!serviceConfig) {
            throw new Error(`Service type '${serviceType}' not found or inactive`);
        }

        // Get pricing configuration
        const pricingConfig = await PricingConfig.getSingleton();

        // STEP 1: Calculate Base Amount
        const baseAmount = serviceConfig.calculateBaseAmount(duration, vehicleType, isSubscriber);

        // STEP 2: Calculate Overtime
        const overtimeAmount = serviceConfig.calculateOvertime(duration, vehicleType);

        // STEP 3: Calculate Add-ons
        const addons = this._calculateAddons(serviceConfig, pricingConfig, {
            serviceType,
            isScheduled,
            scheduledTime,
            duration
        });

        // STEP 4: Calculate Subtotal
        const subtotal = baseAmount + overtimeAmount + addons.total;

        // STEP 5: Apply Surge (if enabled and in surge hours)
        let surgeAmount = 0;
        let finalSubtotal = subtotal;
        
        if (pricingConfig.isSurgeEnabled && pricingConfig.isInSurgeHours()) {
            surgeAmount = subtotal * (pricingConfig.surgeMultiplier - 1);
            finalSubtotal = subtotal * pricingConfig.surgeMultiplier;
        }

        // STEP 6: Calculate GST
        let gstAmount = 0;
        if (pricingConfig.isGstEnabled) {
            gstAmount = (finalSubtotal * pricingConfig.gstPercent) / 100;
        }

        // STEP 7: Calculate Final Amount
        const finalAmount = finalSubtotal + gstAmount;

        // STEP 8: Calculate Platform Commission
        const platformCommission = (finalSubtotal * pricingConfig.platformCommissionPercent) / 100;

        // STEP 9: Calculate Driver Earning
        const driverEarning = finalSubtotal - platformCommission;

        // Return complete breakdown
        return {
            serviceType,
            serviceName: serviceConfig.name,
            duration,
            vehicleType,
            isSubscriber,
            isScheduled,
            
            // Pricing breakdown
            baseAmount: Math.round(baseAmount * 100) / 100,
            overtimeAmount: Math.round(overtimeAmount * 100) / 100,
            
            addons: {
                scheduledPremium: addons.scheduledPremium,
                nightCharge: addons.nightCharge,
                outstationAllowance: addons.outstationAllowance,
                total: addons.total
            },
            
            subtotal: Math.round(subtotal * 100) / 100,
            
            surge: {
                isApplied: surgeAmount > 0,
                multiplier: pricingConfig.surgeMultiplier,
                amount: Math.round(surgeAmount * 100) / 100
            },
            
            subtotalAfterSurge: Math.round(finalSubtotal * 100) / 100,
            
            gst: {
                isApplied: pricingConfig.isGstEnabled,
                percent: pricingConfig.gstPercent,
                amount: Math.round(gstAmount * 100) / 100
            },
            
            finalAmount: Math.round(finalAmount * 100) / 100,
            
            commission: {
                percent: pricingConfig.platformCommissionPercent,
                amount: Math.round(platformCommission * 100) / 100
            },
            
            driverEarning: Math.round(driverEarning * 100) / 100,
            
            // Wallet hold
            walletHold: pricingConfig.walletHoldAmount,
            
            // Metadata
            calculatedAt: new Date(),
            pricingVersion: '1.0'
        };
    }

    /**
     * Calculate add-ons (scheduled premium, night charge, outstation allowance)
     * @private
     */
    _calculateAddons(serviceConfig, pricingConfig, params) {
        const { serviceType, isScheduled, scheduledTime, duration } = params;
        
        let scheduledPremium = 0;
        let nightCharge = 0;
        let outstationAllowance = 0;

        // Scheduled Premium
        if (isScheduled && pricingConfig.isScheduledPremiumEnabled) {
            scheduledPremium = pricingConfig.scheduledPremium;
        }

        // Night Charge (check scheduled time)
        if (pricingConfig.isNightEnabled) {
            const hour = scheduledTime.getHours();
            const nightStart = parseInt(pricingConfig.nightHours.start.split(':')[0]);
            const nightEnd = parseInt(pricingConfig.nightHours.end.split(':')[0]);
            
            // Handle overnight periods
            const isNightTime = nightStart > nightEnd 
                ? (hour >= nightStart || hour < nightEnd)
                : (hour >= nightStart && hour < nightEnd);
            
            if (isNightTime) {
                nightCharge = pricingConfig.nightCharge;
            }
        }

        // Outstation Allowance
        if (serviceType === 'outstation') {
            const days = Math.ceil(duration / 24);
            outstationAllowance = pricingConfig.outstationAllowance * days;
        }

        return {
            scheduledPremium,
            nightCharge,
            outstationAllowance,
            total: scheduledPremium + nightCharge + outstationAllowance
        };
    }

    /**
     * Get cancellation charge
     * @param {String} cancelledBy - 'customer' or 'driver'
     * @param {Boolean} afterTripStart - Is trip already started
     * @param {Boolean} isNoShow - Is driver no-show
     */
    async getCancellationCharge(cancelledBy, afterTripStart = false, isNoShow = false) {
        const pricingConfig = await PricingConfig.getSingleton();
        
        if (cancelledBy === 'customer') {
            return afterTripStart 
                ? pricingConfig.cancellation.customer.afterTripStart
                : pricingConfig.cancellation.customer.beforeTrip;
        }
        
        if (cancelledBy === 'driver') {
            if (isNoShow) {
                return pricingConfig.cancellation.driver.noShow;
            }
            return afterTripStart
                ? pricingConfig.cancellation.driver.afterTripStart
                : pricingConfig.cancellation.driver.beforeTrip;
        }
        
        return 0;
    }

    /**
     * Validate pricing parameters
     */
    validateParams(params) {
        const errors = [];
        
        if (!params.serviceType) {
            errors.push('Service type is required');
        }
        
        if (!params.duration || params.duration <= 0) {
            errors.push('Valid duration is required');
        }
        
        if (params.serviceType === 'outstation' && !params.destination) {
            errors.push('Destination is required for outstation service');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new PricingEngine();
