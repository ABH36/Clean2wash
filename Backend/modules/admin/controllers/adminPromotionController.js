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
        const { code, val, valUnit, expiry } = req.body;

        // 1. Unique Code Validation
        if (code) {
            const existing = await Promotion.findOne({ code, isActive: true });
            if (existing) throw new Error(`Promotion code ${code} already exists.`);
        }

        // 2. Value Logic
        if (valUnit === 'PERCENT' && (val <= 0 || val > 100)) {
            throw new Error('Percentage value must be between 1 and 100.');
        }

        const promotion = await Promotion.create({
            ...req.body,
            expiry: expiry ? new Date(expiry) : null
        });

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

// GET promotion analytics
exports.getPromotionStats = async (req, res) => {
    try {
        const stats = await Promotion.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalUsage: { $sum: '$usage' },
                    averageValue: { $avg: '$val' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to generate analytics' });
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
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete promotion' });
    }
};
