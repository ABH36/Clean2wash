/**
 * 🛰️ Global Geocoding Protocol (Google Maps Native + Nominatim Fallback)
 * Standardizes reverse geocoding across Consumer, Captain, and Staff modules.
 * Includes: Memory Caching, Coordinate Rounding, and Silent Fallback.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// 💵 BILLING PROTECTION: Memory Cache to avoid hitting API for the same/nearby points
const GEO_CACHE = new Map();
const CACHE_LIMIT = 50;

/**
 * Rounding to 5 decimal places provides ~1.1 meter precision.
 * This prevents tiny GPS jitters from triggering new API bills.
 */
const roundCoord = (num) => Math.round(num * 100000) / 100000;

const addToCache = (lat, lng, data) => {
    const key = `${roundCoord(lat)},${roundCoord(lng)}`;
    if (GEO_CACHE.size >= CACHE_LIMIT) {
        const firstKey = GEO_CACHE.keys().next().value;
        GEO_CACHE.delete(firstKey);
    }
    GEO_CACHE.set(key, data);
};

export const geocodingService = {
    /**
     * Reverse Geocode: Coordinates -> Address Object
     * Logic: Cache -> Google Maps -> Nominatim Fallback
     */
    reverse: async (lat, lng) => {
        const rLat = roundCoord(lat);
        const rLng = roundCoord(lng);
        const cacheKey = `${rLat},${rLng}`;

        // 1. Check Cache (FREE & INSTANT)
        if (GEO_CACHE.has(cacheKey)) {
            console.log("🛰️ Geocoding Cache Hit:", cacheKey);
            return GEO_CACHE.get(cacheKey);
        }

        // 2. Try Google Maps Geocoding
        if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response && response.results && response.results[0]) {
                    const result = response.results[0];
                    const components = result.address_components;

                    const getComp = (types) => components.find(c => types.some(t => c.types.includes(t)))?.long_name || '';
                    
                    const house = getComp(['street_number', 'premise', 'subpremise']);
                    const building = getComp(['sublocality_level_3', 'sublocality_level_2']);
                    const street = getComp(['route']);
                    const area = getComp(['sublocality_level_1', 'sublocality_level_2', 'neighborhood']);
                    const city = getComp(['locality', 'administrative_area_level_2']);
                    const state = getComp(['administrative_area_level_1']);
                    const pincode = getComp(['postal_code']);

                    const cleanStreet = [house, building, street].filter(Boolean).join(', ').trim();

                    const parsedResult = {
                        street: cleanStreet || area || result.formatted_address.split(',')[0],
                        area: area || result.formatted_address.split(',')[0] || 'Unknown Area',
                        city: city || 'Unknown City',
                        state: state || 'Unknown State',
                        pincode: pincode || '000000',
                        display_name: result.formatted_address,
                        source: 'google'
                    };

                    addToCache(lat, lng, parsedResult);
                    return parsedResult;
                }
            } catch (err) {
                console.warn('Geocoding Protocol: Google Denied or Failed. Silently falling back...', err.message);
            }
        }

        // 3. Fallback to Nominatim (OSM)
        try {
            const res = await fetch(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await res.json();
            
            if (!data || !data.address) throw new Error('Geocoding Failed');

            const addr = data.address;
            const cleanStreet = [addr.house_number, addr.building, addr.road].filter(Boolean).join(', ').trim();
            const area = addr.suburb || addr.neighbourhood || addr.sublocality || addr.district;

            const parsedResult = {
                street: cleanStreet || area || data.display_name.split(',')[0],
                area: area || data.display_name.split(',')[0] || 'Unknown Area',
                city: addr.city || addr.town || addr.village || 'Unknown City',
                state: addr.state || 'Unknown State',
                pincode: addr.postcode || '000000',
                display_name: data.display_name,
                source: 'nominatim'
            };

            addToCache(lat, lng, parsedResult);
            return parsedResult;
        } catch (err) {
            console.error('Critical: All Geocoding protocols failed.', err);
            return null;
        }
    },

    /**
     * Forward Geocode: Query -> Coordinates List
     */
    search: async (query) => {
        if (!query) return [];

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
                        source: 'google'
                    }));
                }
            } catch (err) {
                console.warn('Google Forward Geocoding failed, falling back to Nominatim:', err);
            }
        }

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
                source: 'nominatim'
            }));
        } catch (err) {
            console.error('Forward Geocoding search failed:', err);
            return [];
        }
    }
};

