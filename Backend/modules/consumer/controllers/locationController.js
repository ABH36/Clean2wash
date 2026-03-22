const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Get all saved addresses for the authenticated user
 */
exports.getAddresses = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('profile.addresses');

    res.status(200).json({
        status: 'success',
        data: {
            addresses: user.profile.addresses || []
        }
    });
});

/**
 * Add a new address to the user's saved addresses
 */
exports.addAddress = catchAsync(async (req, res, next) => {
    const { label, street, city, state, pincode, coordinates, landmark, isPrimary } = req.body;

    if (!street || !city || !state || !pincode || !coordinates) {
        return next(new AppError('Please provide all required address fields including coordinates', 400));
    }

    const user = await User.findById(req.user.id);

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
