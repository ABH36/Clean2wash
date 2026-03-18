const VehicleType = require('../../../models/VehicleType');

// Get all vehicle types
exports.getVehicleTypes = async (req, res) => {
    try {
        const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ sortOrder: 1 });
        res.status(200).json({
            status: 'success',
            results: vehicleTypes.length,
            data: { vehicleTypes }
        });
    } catch (error) {
        console.error('Error fetching vehicle types:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch vehicle types' });
    }
};

// Create a new vehicle type
exports.createVehicleType = async (req, res) => {
    try {
        const vehicleType = await VehicleType.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { vehicleType }
        });
    } catch (error) {
        console.error('Error creating vehicle type:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to create vehicle type' });
    }
};

// Update an existing vehicle type
exports.updateVehicleType = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleType = await VehicleType.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!vehicleType) {
            return res.status(404).json({ status: 'error', message: 'Vehicle type not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { vehicleType }
        });
    } catch (error) {
        console.error('Error updating vehicle type:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update vehicle type' });
    }
};

// Delete (soft delete) a vehicle type
exports.deleteVehicleType = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleType = await VehicleType.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!vehicleType) {
            return res.status(404).json({ status: 'error', message: 'Vehicle type not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Vehicle type deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting vehicle type:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete vehicle type' });
    }
};
