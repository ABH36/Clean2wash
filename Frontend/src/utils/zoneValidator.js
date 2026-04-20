/**
 * Zone Validation Utility
 * Checks if a location is within serviceable zones
 */

/**
 * Check if service is available at given location
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} service - Service type (spareDriver, carWash, apartmentWash)
 * @returns {Promise<{available: boolean, reason: string, zone: object}>}
 */
export const checkServiceAvailability = async (latitude, longitude, service = 'spareDriver') => {
    try {
        const response = await fetch(
            `/api/zones/check-location?latitude=${latitude}&longitude=${longitude}&service=${service}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to check service availability');
        }
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Zone check error:', error);
        return {
            available: false,
            reason: 'Unable to verify service availability. Please try again.',
            zone: null
        };
    }
};

/**
 * Get nearby serviceable zones
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} maxDistance - Maximum distance in meters (default: 50km)
 * @returns {Promise<Array>}
 */
export const getNearbyZones = async (latitude, longitude, maxDistance = 50000) => {
    try {
        const response = await fetch(
            `/api/zones/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch nearby zones');
        }
        
        const data = await response.json();
        return data.data.zones || [];
    } catch (error) {
        console.error('Nearby zones error:', error);
        return [];
    }
};

/**
 * Get all active zones
 * @returns {Promise<Array>}
 */
export const getActiveZones = async () => {
    try {
        const response = await fetch('/api/zones/active');
        
        if (!response.ok) {
            throw new Error('Failed to fetch active zones');
        }
        
        const data = await response.json();
        return data.data.zones || [];
    } catch (error) {
        console.error('Active zones error:', error);
        return [];
    }
};

/**
 * Validate location before booking
 * Shows appropriate error message if not serviceable
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} service 
 * @param {Function} toastError - Toast error function
 * @returns {Promise<boolean>}
 */
export const validateLocationForBooking = async (latitude, longitude, service, toastError) => {
    const result = await checkServiceAvailability(latitude, longitude, service);
    
    if (!result.available) {
        if (toastError) {
            toastError(result.reason || 'Service not available in this area');
        }
        return false;
    }
    
    return true;
};

/**
 * Get zone information for display
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<object|null>}
 */
export const getZoneInfo = async (latitude, longitude) => {
    const result = await checkServiceAvailability(latitude, longitude);
    return result.zone;
};

export default {
    checkServiceAvailability,
    getNearbyZones,
    getActiveZones,
    validateLocationForBooking,
    getZoneInfo
};
