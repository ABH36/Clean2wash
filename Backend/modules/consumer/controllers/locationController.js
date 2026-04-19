const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// ─── VALIDATION HELPERS ───────────────────────────────────────────
const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

const validateCity = (city) => {
    // City should not contain numbers
    const cityRegex = /^[a-zA-Z\s]+$/;
    return cityRegex.test(city);
};

const validateCoordinates = (coordinates) => {
    if (!coordinates || !coordinates.lat || !coordinates.lng) return false;
    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const calculateDistance = (coord1, coord2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

const isDuplicateAddress = (addresses, newAddress) => {
    return addresses.some(addr => {
        // Check if coordinates are within 50 meters
        const distance = calculateDistance(addr.coordinates, newAddress.coordinates);
        if (distance < 50) return true;

        // Check if street and city match
        const streetMatch = addr.street.toLowerCase().trim() === newAddress.street.toLowerCase().trim();
        const cityMatch = addr.city.toLowerCase().trim() === newAddress.city.toLowerCase().trim();
        return streetMatch && cityMatch;
    });
};

/**
 * Get all saved addresses for the authenticated user
 */
exports.getAddresses = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('profile.addresses profile.recentAddresses');

    res.status(200).json({
        status: 'success',
        data: {
            addresses: user.profile.addresses || [],
            recentAddresses: (user.profile.recentAddresses || [])
                .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
                .slice(0, 5) // Return top 5 recent addresses
        }
    });
});

/**
 * Add a new address to the user's saved addresses
 */
exports.addAddress = catchAsync(async (req, res, next) => {
    const { label, street, city, state, pincode, coordinates, landmark, isPrimary } = req.body;

    // Enhanced validation
    if (!street || !city || !state || !pincode || !coordinates) {
        return next(new AppError('Please provide all required address fields including coordinates', 400));
    }

    // Validate pincode format
    if (!validatePincode(pincode)) {
        return next(new AppError('Invalid pincode format. Must be 6 digits starting with 1-9', 400));
    }

    // Validate city name
    if (!validateCity(city)) {
        return next(new AppError('Invalid city name. City should not contain numbers', 400));
    }

    // Validate coordinates
    if (!validateCoordinates(coordinates)) {
        return next(new AppError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180', 400));
    }

    const user = await User.findById(req.user.id);

    // Check for duplicate address
    if (isDuplicateAddress(user.profile.addresses, { street, city, coordinates })) {
        return next(new AppError('This address already exists in your saved addresses', 400));
    }

    // If this is the first address or set as primary, unmark others
    if (isPrimary || user.profile.addresses.length === 0) {
        user.profile.addresses.forEach(addr => addr.isPrimary = false);
    }

    const newAddress = {
        label: label || 'Home',
        street,
        city,
        state,
        pincode,
        coordinates,
        landmark,
        isPrimary: isPrimary || user.profile.addresses.length === 0
    };

    user.profile.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
        status: 'success',
        message: 'Address added successfully',
        data: {
            address: user.profile.addresses[user.profile.addresses.length - 1]
        }
    });
});

/**
 * Update an existing address
 */
exports.updateAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user.id);
    const address = user.profile.addresses.id(addressId);

    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    // If updating to primary, unmark others
    if (updates.isPrimary) {
        user.profile.addresses.forEach(addr => addr.isPrimary = false);
    }

    // Apply updates
    Object.assign(address, updates);
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: {
            address
        }
    });
});

/**
 * Delete a saved address
 */
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.profile.addresses.id(addressId);

    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    const wasPrimary = address.isPrimary;
    user.profile.addresses.pull(addressId);

    // If we deleted the primary address, make the first one primary
    if (wasPrimary && user.profile.addresses.length > 0) {
        user.profile.addresses[0].isPrimary = true;
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address deleted successfully'
    });
});

/**
 * Set an address as primary
 */
exports.setPrimaryAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.profile.addresses.id(addressId);

    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    user.profile.addresses.forEach(addr => {
        addr.isPrimary = addr._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Primary address updated',
        data: {
            address
        }
    });
});

/**
 * Track address usage (called when address is used in booking)
 */
exports.trackAddressUsage = catchAsync(async (req, res, next) => {
    const { street, city, state, pincode, coordinates, landmark, source } = req.body;

    if (!street || !city || !coordinates) {
        return next(new AppError('Street, city, and coordinates are required', 400));
    }

    const user = await User.findById(req.user.id);

    // Initialize recentAddresses if not exists
    if (!user.profile.recentAddresses) {
        user.profile.recentAddresses = [];
    }

    // Check if address already exists in recent
    const existingIndex = user.profile.recentAddresses.findIndex(addr => {
        const distance = calculateDistance(addr.coordinates, coordinates);
        return distance < 50; // Within 50 meters
    });

    if (existingIndex !== -1) {
        // Update existing recent address
        user.profile.recentAddresses[existingIndex].usageCount += 1;
        user.profile.recentAddresses[existingIndex].lastUsedAt = new Date();
    } else {
        // Add new recent address
        user.profile.recentAddresses.push({
            street,
            city,
            state,
            pincode,
            landmark,
            coordinates,
            usageCount: 1,
            lastUsedAt: new Date(),
            source: source || 'booking'
        });

        // Keep only last 10 recent addresses
        if (user.profile.recentAddresses.length > 10) {
            user.profile.recentAddresses.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
            user.profile.recentAddresses = user.profile.recentAddresses.slice(0, 10);
        }
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address usage tracked'
    });
});

/**
 * Get address suggestions based on user's location and usage patterns
 */
exports.getAddressSuggestions = catchAsync(async (req, res, next) => {
    const { lat, lng, city } = req.query;

    const user = await User.findById(req.user.id).select('profile.addresses profile.recentAddresses');

    const suggestions = [];

    // 1. Suggest saved addresses in the same city
    if (city) {
        const cityAddresses = user.profile.addresses.filter(addr => 
            addr.city.toLowerCase() === city.toLowerCase()
        );
        suggestions.push(...cityAddresses.map(addr => ({
            ...addr.toObject(),
            type: 'saved',
            relevance: 'high'
        })));
    }

    // 2. Suggest recent addresses sorted by usage
    const recentSorted = (user.profile.recentAddresses || [])
        .sort((a, b) => {
            // Sort by usage count first, then by recency
            if (b.usageCount !== a.usageCount) {
                return b.usageCount - a.usageCount;
            }
            return b.lastUsedAt - a.lastUsedAt;
        })
        .slice(0, 5);

    suggestions.push(...recentSorted.map(addr => ({
        ...addr.toObject(),
        type: 'recent',
        relevance: addr.usageCount > 3 ? 'high' : 'medium'
    })));

    // 3. If coordinates provided, suggest nearby addresses
    if (lat && lng) {
        const userCoords = { lat: Number(lat), lng: Number(lng) };
        const nearbyAddresses = user.profile.addresses.filter(addr => {
            const distance = calculateDistance(userCoords, addr.coordinates);
            return distance < 5000; // Within 5km
        }).map(addr => ({
            ...addr.toObject(),
            type: 'nearby',
            relevance: 'medium'
        }));

        suggestions.push(...nearbyAddresses);
    }

    // Remove duplicates based on coordinates
    const uniqueSuggestions = [];
    const seenCoords = new Set();

    for (const suggestion of suggestions) {
        const coordKey = `${suggestion.coordinates.lat.toFixed(4)},${suggestion.coordinates.lng.toFixed(4)}`;
        if (!seenCoords.has(coordKey)) {
            seenCoords.add(coordKey);
            uniqueSuggestions.push(suggestion);
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            suggestions: uniqueSuggestions.slice(0, 10) // Return top 10 suggestions
        }
    });
});
