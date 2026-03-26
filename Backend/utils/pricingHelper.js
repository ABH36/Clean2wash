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

        let baseAmount = Math.round(servicePrice * vehicleMultiplier) + addonAmount;
        let totalAmount = baseAmount;
        let discounts = {
            blackPass: 0,
            coupon: 0,
            combo: 0,
            loyalty: 0
        };

        let breakdown = [];

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
