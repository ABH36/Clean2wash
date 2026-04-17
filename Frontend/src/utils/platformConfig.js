import { adminAPI } from './adminApi';

/**
 * Platform Configuration & Feature Flags
 * Controls the overall mode of the application and visibility of modules.
 */

// Local defaults (used until sync with backend)
let currentConfig = {
    mode: 'SPARE_DRIVER',
    flags: {
        OVERVIEW: true,
        OPERATIONS: true,
        USERS: true,
        FINANCE: true,
        SERVICES: true,
        SAFETY_SUPPORT: true,
        SYSTEM_CONTROL: true,
        MARKETING: true,
        
        // Legacy Modules (Hidden by default in Spare Driver Mode)
        APARTMENT_WASH: false,
        STUDIO_WASH: false,
        PRODUCT_ECOSYSTEM: false,
        CAMPAIGN_DESK: false,
    }
};

/**
 * Sync platform configuration with the backend
 */
export const syncPlatformConfig = async () => {
    try {
        const response = await adminAPI.get('/platform-config');
        if (response.data?.status === 'success') {
            currentConfig.mode = response.data.data.mode;
            currentConfig.flags = response.data.data.flags;
            console.log(`[SYNC] Platform Config Updated: ${currentConfig.mode}`);
            return true;
        }
    } catch (error) {
        console.error('[SYNC] Failed to fetch platform config from backend, using defaults.', error);
    }
    return false;
};

export const getPlatformMode = () => currentConfig.mode;
export const getFeatureFlags = () => currentConfig.flags;

/**
 * Helper to check if a feature is enabled
 */
export const isFeatureEnabled = (featureKey) => {
    return !!currentConfig.flags[featureKey];
};
