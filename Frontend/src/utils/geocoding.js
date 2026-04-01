/**
 * 🛰️ Global Geocoding Protocol (Google Maps Native + Nominatim Fallback)
 * Standardizes reverse geocoding across Consumer, Captain, and Staff modules.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const geocodingService = {
    /**
     * Reverse Geocode: Coordinates -> Address Object
     */
    reverse: async (lat, lng) => {
        // 1. Try Google Maps Geocoding (Native / Faster / More Accurate)
        if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response && response.results && response.results[0]) {
                    const result = response.results[0];
                    const components = result.address_components;
                    
                    return {
                        street: result.formatted_address.split(',').slice(0, 2).join(',').trim(),
                        city: components.find(c => c.types.includes('locality'))?.long_name || 
                              components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || 'Unknown City',
                        state: components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || 'Unknown State',
                        pincode: components.find(c => c.types.includes('postal_code'))?.long_name || '000000',
                        display_name: result.formatted_address,
                        source: 'google',
                        raw: result
                    };
                }
            } catch (err) {
                console.warn('Google Reverse Geocoding failed, falling back to Nominatim:', err);
            }
        }

        // 2. Fallback to Nominatim (OSM)
        try {
            const res = await fetch(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await res.json();
            
            if (!data || !data.address) throw new Error('Geocoding Failed');

            return {
                street: data.display_name.split(',').slice(0, 2).join(',').trim(),
                city: data.address.city || data.address.town || data.address.suburb || 'Unknown City',
                state: data.address.state || 'Unknown State',
                pincode: data.address.postcode || '000000',
                display_name: data.display_name,
                source: 'nominatim',
                raw: data
            };
        } catch (err) {
            console.error('All Geocoding methods failed:', err);
            return null;
        }
    },

    /**
     * Forward Geocode: Query -> Coordinates List
     */
    search: async (query) => {
        // 1. Try Google Maps Geocoding
        if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ address: query });
                if (response && response.results) {
                    return response.results.map(item => ({
                        label: item.formatted_address.split(',')[0],
                        address: item.formatted_address,
                        lat: item.geometry.location.lat(),
                        lng: item.geometry.location.lng(),
                        source: 'google',
                        raw: item
                    }));
                }
            } catch (err) {
                console.warn('Google Forward Geocoding failed, falling back to Nominatim:', err);
            }
        }

        // 2. Fallback to Nominatim
        try {
            const res = await fetch(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await res.json();
            
            return data.map(item => ({
                label: item.display_name.split(',')[0],
                address: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                source: 'nominatim',
                raw: item
            }));
        } catch (err) {
            console.error('Forward Geocoding search failed:', err);
            return [];
        }
    }
};

