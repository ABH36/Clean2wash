const axios = require('axios');

/**
 * Forward search queries to Nominatim/OSM
 */
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ status: 'fail', message: 'Query string is required' });
        }

        // TODO: In production, switch to Google Places API or implement Redis caching
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q,
                format: 'json',
                addressdetails: 1,
                limit: 5,
                countrycodes: 'in' // Restrict to India by default for this app
            },
            headers: {
                'User-Agent': 'Clean-2-Wash-Backend/1.0'
            }
        });

        res.status(200).json({
            status: 'success',
            data: response.data
        });
    } catch (error) {
        console.error('Map Search Proxy Error:', error.message);
        res.status(502).json({
            status: 'error',
            message: 'Failed to contact geocoding service'
        });
    }
};

/**
 * Forward reverse geocoding queries (coords to address)
 */
exports.reverse = async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ status: 'fail', message: 'Latitude and Longitude are required' });
        }

        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                lat,
                lon,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'Clean-2-Wash-Backend/1.0'
            }
        });

        res.status(200).json({
            status: 'success',
            data: response.data
        });
    } catch (error) {
        console.error('Reverse Geocode Proxy Error:', error.message);
        res.status(502).json({
            status: 'error',
            message: 'Failed to contact reverse geocoding service'
        });
    }
};
