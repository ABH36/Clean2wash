/**
 * 🛰️ Global Geocoding Protocol (Nominatim Integration)
 * Standardizes reverse geocoding across Consumer, Captain, and Staff modules.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const geocodingService = {
    /**
     * Reverse Geocode: Coordinates -> Address Object
     */
    reverse: async (lat, lng) => {
        try {
            const res = await fetch(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                headers: {
                    'Accept-Language': 'en'
                }
            });
            const data = await res.json();
            
            if (!data || !data.address) throw new Error('Geocoding Failed');

            return {
                street: data.display_name.split(',').slice(0, 2).join(',').trim(),
                city: data.address.city || data.address.town || data.address.suburb || 'Unknown City',
                state: data.address.state || 'Unknown State',
                pincode: data.address.postcode || '000000',
                display_name: data.display_name,
                raw: data
            };
        } catch (err) {
            console.error('Reverse Geocoding Error:', err);
            return null;
        }
    },

    /**
     * Forward Geocode: Query -> Coordinates List
     */
    search: async (query) => {
        try {
            const res = await fetch(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
                headers: {
                    'Accept-Language': 'en'
                }
            });
            const data = await res.json();
            
            return data.map(item => ({
                label: item.display_name.split(',')[0],
                address: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                raw: item
            }));
        } catch (err) {
            console.error('Forward Geocoding Error:', err);
            return [];
        }
    }
};
