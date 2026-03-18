const VehicleModel = require('../../../models/VehicleModel');

// GET all vehicle models
exports.getAllVehicleModels = async (req, res) => {
    try {
        const { brand, type, isActive } = req.query;
        const query = {};
        if (brand) query.brand = brand;
        if (type) query.type = type;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const vehicleModels = await VehicleModel.find(query).sort({ brand: 1, model: 1 });

        res.status(200).json({
            status: 'success',
            results: vehicleModels.length,
            data: { vehicleModels }
        });
    } catch (error) {
        console.error('Error fetching vehicle models:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch vehicle models' });
    }
};

// GET a specific vehicle model
exports.getVehicleModel = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleModel = await VehicleModel.findById(id);

        if (!vehicleModel) {
            return res.status(404).json({ status: 'error', message: 'Vehicle model not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { vehicleModel }
        });
    } catch (error) {
        console.error('Error fetching vehicle model:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch vehicle model' });
    }
};

// POST create a new vehicle model
exports.createVehicleModel = async (req, res) => {
    try {
        const vehicleModel = await VehicleModel.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { vehicleModel }
        });
    } catch (error) {
        console.error('Error creating vehicle model:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to create vehicle model' });
    }
};

// PATCH update a vehicle model
exports.updateVehicleModel = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleModel = await VehicleModel.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!vehicleModel) {
            return res.status(404).json({ status: 'error', message: 'Vehicle model not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { vehicleModel }
        });
    } catch (error) {
        console.error('Error updating vehicle model:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update vehicle model' });
    }
};

// DELETE (soft delete) a vehicle model
exports.deleteVehicleModel = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleModel = await VehicleModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!vehicleModel) {
            return res.status(404).json({ status: 'error', message: 'Vehicle model not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Vehicle model deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting vehicle model:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete vehicle model' });
    }
};
