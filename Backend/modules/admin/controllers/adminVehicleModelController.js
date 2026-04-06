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
// GET all unique brands in the catalog
exports.getUniqueBrands = async (req, res) => {
    try {
        const brands = await VehicleModel.distinct('brand', { isActive: true });
        res.status(200).json({
            status: 'success',
            data: { brands: brands.sort() }
        });
    } catch (error) {
        console.error('Error fetching unique brands:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch unique brands' });
    }
};

// GET all pending vehicle suggestions from users
exports.getPendingSuggestions = async (req, res) => {
    try {
        const pendingModels = await VehicleModel.find({ status: 'Pending' })
            .populate('suggestedBy', 'name phone email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: pendingModels.length,
            data: { pendingModels }
        });
    } catch (error) {
        console.error('Error fetching pending suggestions:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pending suggestions' });
    }
};

// Review (Approve/Reject) a user-suggested vehicle model
exports.reviewSuggestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, type, basePrice, difficulty, baseDuration, protocolSteps } = req.body;

        if (!['Verified', 'Rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status. Must be Verified or Rejected' });
        }

        const vehicleModel = await VehicleModel.findByIdAndUpdate(id, {
            status,
            type: type || undefined,
            basePrice: basePrice || undefined,
            difficulty: difficulty || undefined,
            baseDuration: baseDuration || undefined,
            protocolSteps: protocolSteps || undefined,
            userSuggested: false // Once reviewed, it's no longer just a "suggestion"
        }, { new: true, runValidators: true });

        if (!vehicleModel) {
            return res.status(404).json({ status: 'error', message: 'Suggested model not found' });
        }

        res.status(200).json({
            status: 'success',
            message: `Vehicle model ${status.toLowerCase()} successfully`,
            data: { vehicleModel }
        });
    } catch (error) {
        console.error('Error reviewing suggestion:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to review suggestion' });
    }
};
