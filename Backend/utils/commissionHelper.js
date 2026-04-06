const Setting = require('../models/Setting');

/**
 * Dynamically calculates commission and payout amounts based on platform settings.
 * @param {number} totalAmount Total booking amount
 * @param {string} role Role of the provider ('captain' or 'vendor')
 * @param {Object} options Optional payout overrides
 * @returns {Promise<{adminCut: number, providerPayout: number, rate: number}>}
 */
exports.calculatePayout = async (totalAmount, role = 'captain', options = {}) => {
    try {
        const overrideRate = Number(options?.overrideRate);

        // 1. Fetch Dynamic Commission Rate
        // If specific rates exist per role, they could be added here (e.g., 'vendor_commission')
        const settingKey = role === 'vendor' ? 'vendor_commission' : 'platform_commission';
        let commissionSetting = await Setting.findOne({ key: settingKey });

        // Fallback to general if role-specific not found
        if (!commissionSetting) {
            commissionSetting = await Setting.findOne({ key: 'platform_commission' });
        }

        const rate = Number.isFinite(overrideRate) && overrideRate >= 0
            ? overrideRate
            : (commissionSetting ? parseFloat(commissionSetting.value) : 15); // Default 15%

        const adminCut = (totalAmount * rate) / 100;
        const providerPayout = totalAmount - adminCut;

        return {
            adminCut: Math.round(adminCut * 100) / 100, // Round to 2 decimal places
            providerPayout: Math.round(providerPayout * 100) / 100,
            rate
        };
    } catch (error) {
        console.error('Commission Calculation Error:', error);
        // Fail-safe default
        return {
            adminCut: totalAmount * 0.15,
            providerPayout: totalAmount * 0.85,
            rate: 15
        };
    }
};
