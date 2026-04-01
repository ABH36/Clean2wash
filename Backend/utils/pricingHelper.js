const Setting = require('../models/Setting');
const Promotion = require('../models/Promotion');
const Subscription = require('../models/Subscription');
const AppError = require('./AppError');

/**
 * Industry-Grade Pricing Engine
 * Handles multi-layered discounts, memberships, and loyalty rewards.
 */
class PricingEngine {
    /**
     * Calculate final pricing for a booking
     * @param {Object} data - Booking data
     * @param {Object} user - Consumer user object
     * @returns {Object} Calculated pricing details
     */
    static async calculate(data, user) {
        const { 
            servicePrice, 
            vehicleMultiplier = 1.0, 
            addonAmount = 0, 
            couponCode, 
            paymentMethod,
            isCombo = false
        } = data;

        // Extract duration from schedule for hourly calculations
        let hours = 1;
        const durationStr = String(data.service?.schedule?.estimatedDuration || '1 Hour');
        if (durationStr) {
            const match = durationStr.match(/(\d+)/);
            if (match) hours = parseInt(match[1]);
        }

        const isChauffeur = data.service?.category === 'Chauffeur' || data.service?.type === 'sparedriver' || data.service?.name?.toLowerCase().includes('driver') || data.service?.title?.toLowerCase().includes('driver');
        const isHourly = isChauffeur && (
            data.service?.name?.toLowerCase().includes('hourly') || 
            data.service?.title?.toLowerCase().includes('hourly') ||
            data.service?.name?.toLowerCase().includes('full day') ||
            data.service?.name?.toLowerCase().includes('outstation')
        );

        const isTrueHourly = isChauffeur && (
            data.service?.name?.toLowerCase().includes('hourly') || 
            data.service?.title?.toLowerCase().includes('hourly')
        );

        let baseAmount = Math.round(servicePrice * vehicleMultiplier) + addonAmount;
        
        // Multiplier for True Hourly Chauffeur (Package rates like Full Day/Outstation are excluded from base multiplication)
        if (isTrueHourly && hours > 1) {
            baseAmount = Math.round((servicePrice * hours) * vehicleMultiplier) + addonAmount;
        }

        let totalAmount = baseAmount;
        let discounts = {
            blackPass: 0,
            coupon: 0,
            combo: 0,
            loyalty: 0
        };

        let breakdown = [];
        
        // 0. LAYER ZERO: Specific Spare Driver (Chauffeur) Rate Mapping
        if (isChauffeur) {
            const activeChauffeurSub = await Subscription.findOne({
                user: user._id || user.id,
                status: 'active',
                $or: [
                    { plan: /chauffeur/i },
                    { plan: /driver/i },
                    { 'service.title': /driver/i }
                ],
                endDate: { $gt: new Date() }
            });

            if (activeChauffeurSub) {
                // SOP Override: Subscriber rate ₹150 vs Standard ₹180 (or provided base)
                // We apply a targeted discount to reach the ₹150/hr target if it's an hourly service
                if (data.service?.name?.toLowerCase().includes('hourly')) {
                    const sopTargetRate = 150;
                    const sopDiscount = Math.max(0, baseAmount - sopTargetRate);
                    if (sopDiscount > 0) {
                        totalAmount -= sopDiscount;
                        breakdown.push({ name: 'Chauffeur Member Rate', amount: sopDiscount, type: 'subscription' });
                    }
                }
            }

            // 🌙 Phase 7 Hardening: Night Allowance (11 PM - 5 AM)
            const scheduleTime = data.schedule?.timeSlot?.start;
            const isOutstation = data.service?.name?.toLowerCase().includes('outstation');
            
            if (scheduleTime) {
                const hour = parseInt(scheduleTime.split(':')[0]);
                const isNightStart = hour >= 23 || hour < 5;
                
                // standard duration from data.schedule or durationStr
                const estEndHour = (hour + hours) % 24;
                const isNightEnd = (estEndHour >= 23 || estEndHour < 5) && hours > 0;

                if (isNightStart || isNightEnd) {
                    const nightAllowance = 300; 
                    totalAmount += nightAllowance;
                    breakdown.push({ name: 'Night Shift Allowance', amount: nightAllowance, type: 'surcharge' });
                }
            }

            // 🏨 Real-World: Outstation Stay & Food Allowance
            if (isOutstation) {
                const allowance = 500; // Standard daily subsistence for driver
                totalAmount += allowance;
                breakdown.push({ name: 'Stay & Food Allowance', amount: allowance, type: 'surcharge' });
            }
        }

        // 1. LAYER ONE: Subscription Credit (Zero Pricing)
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
                        totalAmount: 0,
                        discounts: { ...discounts, subscriptionUsed: true },
                        appliedBenefit: 'SUBSCRIPTION_CREDIT',
                        breakdown: [{ name: 'Subscription Credit', amount: baseAmount, type: 'subscription' }]
                    };
                }
            }
        }

        // 2. LAYER TWO: Loyalty Reward (Free 11th Wash)
        if (paymentMethod === 'loyalty_reward') {
            if (user.loyalty?.rewardsAvailable > 0) {
                return {
                    baseAmount,
                    totalAmount: 0,
                    discounts: { ...discounts, loyalty: baseAmount },
                    appliedBenefit: 'LOYALTY_REWARD',
                    breakdown: [{ name: 'Loyalty Reward', amount: baseAmount, type: 'loyalty' }]
                };
            }
            throw new AppError('No loyalty rewards available', 400);
        }

        // 3. LAYER THREE: Combo Discount (Multiple Services)
        if (isCombo) {
            const settings = await Setting.findOne({ key: 'GLOBAL_OFFERS' });
            const comboPct = settings?.value?.combo_discount_pct || 5; 
            const comboAmt = Math.round(baseAmount * (comboPct / 100));
            discounts.combo = comboAmt;
            totalAmount -= comboAmt;
            breakdown.push({ name: 'Combo Discount', amount: comboAmt, type: 'combo' });
        }

        // 4. LAYER FOUR: Black Pass Membership (Partial Discount)
        const activeBlackPass = await Subscription.findOne({
            user: user._id || user.id,
            status: 'active',
            plan: /black/i,
            endDate: { $gt: new Date() }
        });

        if (activeBlackPass) {
            const bookingData = { 
                service: data.service || {}, 
                hub: data.hub || null, 
                location: data.location || {},
                schedule: data.schedule || {}
            };

            // Only apply 30% discount if the service is eligible for this pass
            if (activeBlackPass.isServiceEligible(bookingData)) {
                const passConfig = await Setting.findOne({ key: 'WASH_PASS_CONFIG' });
                const passDiscountPct = passConfig?.value?.discount_pct || 30;
                const passAmt = Math.round(totalAmount * (passDiscountPct / 100));
                discounts.blackPass = passAmt;
                totalAmount -= passAmt;
                breakdown.push({ name: 'Black Pass Membership', amount: passAmt, type: 'blackpass' });
            }
        }

        // 5. LAYER FIVE: Coupons/Promotions
        if (couponCode) {
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
                couponAmt = Math.round(totalAmount * (promo.val / 100));
            } else {
                couponAmt = promo.val;
            }
            
            couponAmt = Math.min(couponAmt, totalAmount);
            discounts.coupon = couponAmt;
            totalAmount -= couponAmt;
            breakdown.push({ name: `Coupon (${couponCode})`, amount: couponAmt, type: 'coupon' });
        }

        return {
            baseAmount,
            totalAmount: Math.max(0, totalAmount),
            discounts,
            appliedBenefit: activeBlackPass ? 'BLACK_PASS' : (couponCode ? 'COUPON' : null),
            breakdown
        };
    }

    /**
     * Process Loyalty increment after completion
     * @param {Object} user - Consumer user object
     * @returns {Object} Updated loyalty status
     */
    static async processLoyaltyCompletion(user) {
        if (!user.loyalty) {
            user.loyalty = { completedBookingsCount: 0, rewardsAvailable: 0 };
        }

        user.loyalty.completedBookingsCount += 1;

        // Reward every 10 bookings
        if (user.loyalty.completedBookingsCount > 0 && user.loyalty.completedBookingsCount % 10 === 0) {
            user.loyalty.rewardsAvailable += 1;
        }

        await user.save();
        return user.loyalty;
    }
}

module.exports = PricingEngine;
