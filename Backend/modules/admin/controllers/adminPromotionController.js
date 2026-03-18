const Promotion = require('../../../models/Promotion');

// GET all promotions (optionally filtered by type)
exports.getPromotions = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = { isActive: true };
        if (type) filter.type = type;

        const promotions = await Promotion.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: promotions.length,
            data: { promotions }
        });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch promotions' });
    }
};

// POST create a new promotion
exports.createPromotion = async (req, res) => {
    try {
        const promotion = await Promotion.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { promotion }
        });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to create promotion' });
    }
};

// PATCH update promotion
exports.updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!promotion) {
            return res.status(404).json({ status: 'error', message: 'Promotion not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { promotion }
        });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update promotion' });
    }
};

// DELETE promotion
exports.deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!promotion) {
            return res.status(404).json({ status: 'error', message: 'Promotion not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Promotion protocol terminated successfully'
        });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete promotion' });
    }
};
