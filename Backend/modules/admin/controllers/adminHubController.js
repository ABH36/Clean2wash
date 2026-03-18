const Hub = require('../../../models/Hub');

// Get all hubs
exports.getHubs = async (req, res) => {
    try {
        const hubs = await Hub.find({ isActive: true })
            .populate('vendor', 'name email profile.studioName profile.avatar')
            .sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            results: hubs.length,
            data: { hubs }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Create a new hub
exports.createHub = async (req, res) => {
    try {
        const newHub = await Hub.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { hub: newHub }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// Update a hub
exports.updateHub = async (req, res) => {
    try {
        const hub = await Hub.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!hub) {
            return res.status(404).json({ status: 'fail', message: 'Hub not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { hub }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// Delete a hub (Soft Delete)
exports.deleteHub = async (req, res) => {
    try {
        const hub = await Hub.findByIdAndUpdate(req.params.id, { isActive: false });

        if (!hub) {
            return res.status(404).json({ status: 'fail', message: 'Hub not found' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
