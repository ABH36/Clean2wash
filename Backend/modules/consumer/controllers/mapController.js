const AppError = require('../../../utils/AppError');

/**
 * @desc    Proxy reverse geocoding request to Nominatim
 * @route   GET /api/consumer/maps/proxy/reverse
 * @access  Public
 */
exports.reverseGeocodeProxy = async (req, res, next) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return next(new AppError('Please provide latitude and longitude', 400));
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Clean2Wash-App/1.0',
                'Accept-Language': 'en'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (err) {
        console.error('Map Proxy Error:', err);
        next(new AppError('Failed to fetch address from Nominatim', 500));
    }
};

/**
 * @desc    Proxy search request to Nominatim
 * @route   GET /api/consumer/maps/proxy/search
 * @access  Public
 */
exports.searchProxy = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q) {
            return next(new AppError('Please provide search query', 400));
        }

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Clean2Wash-App/1.0',
                'Accept-Language': 'en'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (err) {
        console.error('Map Proxy Error:', err);
        next(new AppError('Failed to search location from Nominatim', 500));
    }
};
