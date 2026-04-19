const User = require('../models/User');

/**
 * Track address usage when user uses an address in booking
 * @param {String} userId - User ID
 * @param {Object} addressData - Address data from booking
 */
const trackAddressUsage = async (userId, addressData) => {
    try {
        if (!addressData || !addressData.street || !addressData.city || !addressData.coordinates) {
            return; // Skip if incomplete address data
        }

        const user = await User.findById(userId);
        if (!user) return;

        // Initialize recentAddresses if not exists
        if (!user.profile.recentAddresses) {
            user.profile.recentAddresses = [];
        }

        // Calculate distance helper
        const calculateDistance = (coord1, coord2) => {
            const R = 6371e3;
            const φ1 = coord1.lat * Math.PI / 180;
            const φ2 = coord2.lat * Math.PI / 180;
            const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
            const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c;
        };

        // Check if address already exists in recent
        const existingIndex = user.profile.recentAddresses.findIndex(addr => {
            const distance = calculateDistance(addr.coordinates, addressData.coordinates);
            return distance < 50; // Within 50 meters
        });

        if (existingIndex !== -1) {
            // Update existing recent address
            user.profile.recentAddresses[existingIndex].usageCount += 1;
            user.profile.recentAddresses[existingIndex].lastUsedAt = new Date();
        } else {
            // Add new recent address
            user.profile.recentAddresses.push({
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                landmark: addressData.landmark,
                coordinates: addressData.coordinates,
                usageCount: 1,
                lastUsedAt: new Date(),
                source: 'booking'
            });

            // Keep only last 10 recent addresses
            if (user.profile.recentAddresses.length > 10) {
                user.profile.recentAddresses.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
                user.profile.recentAddresses = user.profile.recentAddresses.slice(0, 10);
            }
        }

        await user.save();
    } catch (error) {
        console.error('Address tracking error:', error);
        // Don't throw error, just log it - address tracking is non-critical
    }
};

module.exports = { trackAddressUsage };
