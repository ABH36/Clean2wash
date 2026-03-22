const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');

/**
 * @desc    Proxy reverse geocoding request to Nominatim
 * @route   GET /api/consumer/maps/proxy/reverse
 * @access  Public
 */
exports.reverseGeocodeProxy = catchAsync(async (req, res, next) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            clearTimeout(timeout);
            return next(new AppError('Please provide latitude and longitude', 400));
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Clean2Wash-App/1.0',
                'Accept-Language': 'en'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (err) {
        clearTimeout(timeout);
        console.error('Map Proxy Error (Reverse):', err);

        // Graceful Fallback for UI
        res.status(200).json({
            status: 'success',
            isFallback: true,
            data: {
                display_name: `Location at ${req.query.lat}, ${req.query.lon}`,
                address: {
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    country: 'India'
                }
            }
        });
    }
});

/**
 * @desc    Proxy search request to Nominatim
 * @route   GET /api/consumer/maps/proxy/search
 * @access  Public
 */
exports.searchProxy = catchAsync(async (req, res, next) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
        const { q } = req.query;

        if (!q) {
            clearTimeout(timeout);
            return next(new AppError('Please provide search query', 400));
        }

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`;

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Clean2Wash-App/1.0',
                'Accept-Language': 'en'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (err) {
        clearTimeout(timeout);
        console.error('Map Proxy Error (Search):', err);

        // Return empty results instead of crashing
        res.status(200).json({
            status: 'success',
            isFallback: true,
            data: []
        });
    }
});
