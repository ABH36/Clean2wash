import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook for checking service zone availability
 * Validates if a service is available at a specific location
 */
export const useZoneCheck = () => {
    const [checking, setChecking] = useState(false);
    const [zoneInfo, setZoneInfo] = useState(null);

    const checkZone = useCallback(async (latitude, longitude, serviceType = 'spareDriver') => {
        if (!latitude || !longitude) {
            toast.error('Location coordinates are required');
            return { available: false, reason: 'Invalid location' };
        }

        setChecking(true);
        try {
            const response = await fetch(
                `/api/zones/check-location?latitude=${latitude}&longitude=${longitude}&service=${serviceType}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (data.status === 'success') {
                if (data.data.available) {
                    setZoneInfo(data.data.zone);
                    return { 
                        available: true, 
                        zone: data.data.zone,
                        message: `Service available in ${data.data.zone.displayName || data.data.zone.name}`
                    };
                } else {
                    setZoneInfo(null);
                    const reason = data.data.reason || 'Service not available in this area';
                    toast.error(reason);
                    return { 
                        available: false, 
                        reason,
                        zone: data.data.zone
                    };
                }
            } else {
                throw new Error(data.message || 'Failed to check zone availability');
            }
        } catch (error) {
            console.error('Zone check failed:', error);
            const errorMessage = 'Unable to verify service availability. Please try again.';
            toast.error(errorMessage);
            setZoneInfo(null);
            return { 
                available: false, 
                reason: errorMessage,
                error: error.message
            };
        } finally {
            setChecking(false);
        }
    }, []);

    const clearZoneInfo = useCallback(() => {
        setZoneInfo(null);
    }, []);

    return { 
        checkZone, 
        checking, 
        zoneInfo, 
        clearZoneInfo 
    };
};

export default useZoneCheck;