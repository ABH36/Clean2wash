const User = require('../../../models/User');

/**
 * Get all saved addresses for the authenticated user
 */
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('profile.addresses');

        res.status(200).json({
            status: 'success',
            data: {
                addresses: user.profile.addresses || []
            }
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch saved addresses'
        });
    }
};

/**
 * Add a new address to the user's saved addresses
 */
exports.addAddress = async (req, res) => {
    try {
        const { label, street, city, state, pincode, coordinates, landmark, isPrimary } = req.body;

        if (!street || !city || !state || !pincode || !coordinates) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide all required address fields including coordinates'
            });
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
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add address'
        });
    }
};

/**
 * Update an existing address
 */
exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updates = req.body;

        const user = await User.findById(req.user.id);
        const address = user.profile.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: 'fail',
                message: 'Address not found'
            });
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
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update address'
        });
    }
};

/**
 * Delete a saved address
 */
exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);
        const address = user.profile.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: 'fail',
                message: 'Address not found'
            });
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
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete address'
        });
    }
};

/**
 * Set an address as primary
 */
exports.setPrimaryAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);
        const address = user.profile.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: 'fail',
                message: 'Address not found'
            });
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
    } catch (error) {
        console.error('Error setting primary address:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update primary address'
        });
    }
};
