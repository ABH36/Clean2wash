const PricingEngine = require('./pricingEngine');
const ServiceConfig = require('../models/ServiceConfig');
const PricingConfig = require('../models/PricingConfig');
const Promotion = require('../models/Promotion');
const Subscription = require('../models/Subscription');
const Vehicle = require('../models/Vehicle');
const VehicleType = require('../models/VehicleType');
const VehicleModel = require('../models/VehicleModel');
const Setting = require('../models/Setting');
const AppError = require('../utils/AppError');

/**
 * PRICING ENGINE ADAPTER
 * 
 * This adapter bridges the old pricingHelper.js interface with the new pricingEngine.js
 * It maintains backward compatibility while using the new pricing engine under the hood.
 * 
 * MIGRATION STRATEGY:
 * 1. This adapter handles ALL pricing calculations
 * 2. For Spare Driver services: Use new time-based pricing engine
 * 3. For other services: Use legacy pricing logic (temporarily)
 * 4. Gradually migrate all services to new engine
 */

class PricingEngineAdapter {
    /**
     * Main pricing calculation method
     * Maintains compatibility with old interface while using new engine
     */
    static async calculate(data, user) {
        const { 
            servicePrice, 
            vehicleId,
            addonAmount = 0, 
            couponCode, 
            paymentMethod,
            isCombo = false,
            service = {}
        } = data;

        // Determine if this is a Spare Driver service
        const isChauffeur = this._isChauffeurService(service);

        // Route to appropriate pricing engine
        if (isChauffeur) {
            return await this._calculateChauffeurPricing(data, user);
        } else {
            return await this._calculateLegacyPricing(data, user);
        }
    }

    /**
     * Check if service is Spare Driver/Chauffeur
     */
    static _isChauffeurService(service) {
        return (
            service?.category === 'Chauffeur' ||
            service?.type === 'sparedriver' ||
            service?.name?.toLowerCase().includes('driver') ||
            service?.title?.toLowerCase().includes('driver')
        );
    }

    /**
     * NEW: Spare Driver Pricing (Time-based)
     */
    static async _calculateChauffeurPricing(data, user) {
        const { service, schedule, vehicleId, addonAmount = 0, couponCode, paymentMethod } = data;

        // Extract service type from service name
        let serviceType = 'hourly'; // default
        const serviceName = (service?.name || service?.title || '').toLowerCase();
        
        if (serviceName.includes('point')) {
            serviceType = 'point';
        } else if (serviceName.includes('full day')) {
            serviceType = 'full_day';
        } else if (serviceName.includes('outstation')) {
            serviceType = 'outstation';
        } else if (serviceName.includes('hourly')) {
            serviceType = 'hourly';
        }

        // Extract duration
        const durationStr = String(schedule?.estimatedDuration || service?.duration || '1 Hour');
        const match = durationStr.match(/(\d+)/);
        const duration = match ? parseInt(match[1]) : 1;

        // Get vehicle type
        let vehicleType = 'hatchback';
        if (vehicleId) {
            const vehicle = await Vehicle.findById(vehicleId).populate('typeRef');
            if (vehicle?.typeRef?.type) {
                vehicleType = vehicle.typeRef.type.toLowerCase();
            }
        }

        // Check if subscriber
        const isSubscriber = await this._checkSubscription(user, service);

        // Get scheduled time
        const scheduledTime = schedule?.date ? new Date(schedule.date) : new Date();
        if (schedule?.timeSlot?.start) {
            const [hours, minutes] = schedule.timeSlot.start.split(':');
            scheduledTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
        }

        // Check if scheduled booking
        const isScheduled = schedule?.type === 'scheduled';

        try {
            // Call new pricing engine
            const pricingResult = await PricingEngine.calculatePrice({
                serviceType,
                duration,
                vehicleType,
                isScheduled,
                isSubscriber,
                scheduledTime,
                destination: data.location?.destination
            });

            // Add addon amount
            pricingResult.subtotalAfterSurge += addonAmount;
            pricingResult.finalAmount += addonAmount;

            // Apply coupon if provided
            if (couponCode) {
                const couponDiscount = await this._applyCoupon(couponCode, pricingResult.finalAmount, user);
                pricingResult.finalAmount -= couponDiscount;
                pricingResult.addons.couponDiscount = couponDiscount;
            }

            // Handle subscription payment
            if (paymentMethod === 'subscription') {
                const canUseSubscription = await this._validateSubscription(user, service);
                if (canUseSubscription) {
                    return {
                        baseAmount: pricingResult.baseAmount,
                        vehicleMultiplier: 1.0,
                        totalAmount: 0,
                        discounts: { subscriptionUsed: true },
                        appliedBenefit: 'SUBSCRIPTION_CREDIT',
                        breakdown: [{ name: 'Subscription Credit', amount: pricingResult.finalAmount, type: 'subscription' }],
                        pricingDetails: pricingResult
                    };
                }
            }

            // Convert to legacy format for backward compatibility
            return {
                baseAmount: pricingResult.baseAmount,
                vehicleMultiplier: 1.0,
                totalAmount: pricingResult.finalAmount,
                subtotal: pricingResult.subtotal,
                gstAmount: pricingResult.gst.amount,
                gstPercent: pricingResult.gst.percent,
                platformCommission: pricingResult.commission.amount,
                driverEarning: pricingResult.driverEarning,
                discounts: {
                    goldPass: 0,
                    coupon: pricingResult.addons.couponDiscount || 0,
                    combo: 0,
                    loyalty: 0
                },
                appliedBenefit: couponCode ? 'COUPON' : null,
                breakdown: this._buildBreakdown(pricingResult),
                pricingDetails: pricingResult // Full new engine response
            };

        } catch (error) {
            console.error('New pricing engine error:', error);
            // Fallback to legacy pricing
            return await this._calculateLegacyPricing(data, user);
        }
    }

    /**
     * LEGACY: Old Pricing Logic (For non-chauffeur services)
     */
    static async _calculateLegacyPricing(data, user) {
        const { 
            servicePrice, 
            vehicleId,
            addonAmount = 0, 
            couponCode, 
            paymentMethod,
            isCombo = false
        } = data;

        // Get vehicle multiplier
        let vehicleMultiplier = 1.0;
        if (vehicleId) {
            const vehicle = await Vehicle.findById(vehicleId).populate('typeRef');
            if (vehicle?.typeRef?.multiplier) {
                vehicleMultiplier = vehicle.typeRef.multiplier;
            } else {
                const catalogModel = await VehicleModel.findOne({ 
                    brand: vehicle.brand, 
                    model: vehicle.model,
                    status: 'Verified'
                });
                
                if (catalogModel?.type) {
                    const vType = await VehicleType.findOne({ type: catalogModel.type });
                    if (vType) vehicleMultiplier = vType.multiplier;
                }
            }
        }

        let baseAmount = Math.round(servicePrice * vehicleMultiplier) + addonAmount;
        let totalAmount = baseAmount;
        let discounts = {
            goldPass: 0,
            coupon: 0,
            combo: 0,
            loyalty: 0
        };
        let breakdown = [];

        // Subscription credit
        if (paymentMethod === 'subscription') {
            const activeSub = await Subscription.getActiveSubscription(user._id || user.id);
            if (activeSub) {
                const bookingData = { 
                    service: data.service || {}, 
                    hub: data.hub || null, 
                    location: data.location || {},
                    schedule: data.schedule || {}
                };

                if (activeSub.isServiceEligible(bookingData)) {
                    return {
                        baseAmount,
                        vehicleMultiplier,
                        totalAmount: 0,
                        discounts: { ...discounts, subscriptionUsed: true },
                        appliedBenefit: 'SUBSCRIPTION_CREDIT',
                        breakdown: [{ name: 'Subscription Credit', amount: baseAmount, type: 'subscription' }]
                    };
                }
            }
        }

        // Loyalty reward
        if (paymentMethod === 'loyalty_reward') {
            if (user.loyalty?.rewardsAvailable > 0) {
                return {
                    baseAmount,
                    vehicleMultiplier,
                    totalAmount: 0,
                    discounts: { ...discounts, loyalty: baseAmount },
                    appliedBenefit: 'LOYALTY_REWARD',
                    breakdown: [{ name: 'Loyalty Reward', amount: baseAmount, type: 'loyalty' }]
                };
            }
            throw new AppError('No loyalty rewards available', 400);
        }

        // Combo discount
        if (isCombo) {
            const settings = await Setting.findOne({ key: 'GLOBAL_OFFERS' });
            const comboPct = settings?.value?.combo_discount_pct || 5;
            const comboAmt = Math.round(baseAmount * (comboPct / 100));
            discounts.combo = comboAmt;
            totalAmount -= comboAmt;
            breakdown.push({ name: 'Combo Discount', amount: comboAmt, type: 'combo' });
        }

        // Gold Pass
        const activeGoldPass = await Subscription.findOne({
            user: user._id || user.id,
            status: 'active',
            plan: /gold|black/i,
            endDate: { $gt: new Date() }
        });

        if (activeGoldPass) {
            const bookingData = { 
                service: data.service || {}, 
                hub: data.hub || null, 
                location: data.location || {},
                schedule: data.schedule || {}
            };

            if (activeGoldPass.isServiceEligible(bookingData)) {
                const passConfig = await Setting.findOne({ key: 'WASH_PASS_CONFIG' });
                const passDiscountPct = passConfig?.value?.discount_pct || 30;
                const passAmt = Math.round(totalAmount * (passDiscountPct / 100));
                discounts.goldPass = passAmt;
                totalAmount -= passAmt;
                breakdown.push({ name: 'Gold Pass Membership', amount: passAmt, type: 'goldpass' });
            }
        }

        // Coupon
        if (couponCode) {
            const couponAmt = await this._applyCoupon(couponCode, totalAmount, user);
            discounts.coupon = couponAmt;
            totalAmount -= couponAmt;
            breakdown.push({ name: `Coupon (${couponCode})`, amount: couponAmt, type: 'coupon' });
        }

        return {
            baseAmount,
            vehicleMultiplier,
            totalAmount: Math.max(0, totalAmount),
            discounts,
            appliedBenefit: activeGoldPass ? 'GOLD_PASS' : (couponCode ? 'COUPON' : null),
            breakdown
        };
    }

    /**
     * Apply coupon discount
     */
    static async _applyCoupon(couponCode, amount, user) {
        const promo = await Promotion.findOne({ 
            code: couponCode, 
            isActive: true,
            expiry: { $gt: new Date() }
        });

        if (!promo) throw new AppError('Invalid or expired coupon', 400);
        
        if (promo.usage?.limit && promo.usage?.count >= promo.usage?.limit) {
            throw new AppError('Coupon usage limit reached', 400);
        }

        let couponAmt = 0;
        const isPercentage = promo.valUnit === 'PERCENT' || (promo.reductionType && promo.reductionType.toUpperCase() === 'PERCENTAGE');
        
        if (isPercentage) {
            couponAmt = Math.round(amount * (promo.val / 100));
        } else {
            couponAmt = promo.val;
        }
        
        return Math.min(couponAmt, amount);
    }

    /**
     * Check if user has active subscription
     */
    static async _checkSubscription(user, service) {
        const activeSub = await Subscription.findOne({
            user: user._id || user.id,
            status: 'active',
            $or: [
                { plan: /chauffeur/i },
                { plan: /driver/i },
                { 'service.title': /driver/i }
            ],
            endDate: { $gt: new Date() }
        });

        return !!activeSub;
    }

    /**
     * Validate subscription can be used
     */
    static async _validateSubscription(user, service) {
        const activeSub = await Subscription.getActiveSubscription(user._id || user.id);
        if (!activeSub) return false;

        const bookingData = { 
            service: service || {}, 
            hub: null, 
            location: {},
            schedule: {}
        };

        return activeSub.isServiceEligible(bookingData) && activeSub.getAvailableCredits() > 0;
    }

    /**
     * Build breakdown array from new pricing result
     */
    static _buildBreakdown(pricingResult) {
        const breakdown = [];

        // Base amount
        breakdown.push({
            name: 'Base Amount',
            amount: pricingResult.baseAmount,
            type: 'base',
            description: `${pricingResult.serviceName} - ${pricingResult.duration}h`
        });

        // Overtime
        if (pricingResult.overtimeAmount > 0) {
            breakdown.push({
                name: 'Overtime Charges',
                amount: pricingResult.overtimeAmount,
                type: 'overtime'
            });
        }

        // Scheduled premium
        if (pricingResult.addons.scheduledPremium > 0) {
            breakdown.push({
                name: 'Scheduled Booking Premium',
                amount: pricingResult.addons.scheduledPremium,
                type: 'surcharge'
            });
        }

        // Night charge
        if (pricingResult.addons.nightCharge > 0) {
            breakdown.push({
                name: 'Night Shift Allowance',
                amount: pricingResult.addons.nightCharge,
                type: 'surcharge'
            });
        }

        // Outstation allowance
        if (pricingResult.addons.outstationAllowance > 0) {
            breakdown.push({
                name: 'Stay & Food Allowance',
                amount: pricingResult.addons.outstationAllowance,
                type: 'surcharge'
            });
        }

        // Surge
        if (pricingResult.surge.isApplied) {
            breakdown.push({
                name: `Surge Pricing (${pricingResult.surge.multiplier}x)`,
                amount: pricingResult.surge.amount,
                type: 'surge'
            });
        }

        // GST
        if (pricingResult.gst.isApplied) {
            breakdown.push({
                name: `GST (${pricingResult.gst.percent}%)`,
                amount: pricingResult.gst.amount,
                type: 'tax'
            });
        }

        return breakdown;
    }

    /**
     * Process loyalty completion (unchanged)
     */
    static async processLoyaltyCompletion(user) {
        if (!user.loyalty) {
            user.loyalty = { completedBookingsCount: 0, rewardsAvailable: 0 };
        }

        user.loyalty.completedBookingsCount += 1;

        if (user.loyalty.completedBookingsCount > 0 && user.loyalty.completedBookingsCount % 10 === 0) {
            user.loyalty.rewardsAvailable += 1;
        }

        await user.save();
        return user.loyalty;
    }
}

module.exports = PricingEngineAdapter;
