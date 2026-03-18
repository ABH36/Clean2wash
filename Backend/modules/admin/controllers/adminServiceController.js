const Service = require('../../../models/Service');

// GET all services (with optional category filter)
exports.getServices = async (req, res) => {
    try {
        const filter = { isActive: true };
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }

        const services = await Service.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: { services }
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch services' });
    }
};

// POST create a new service (Admin only)
exports.createService = async (req, res) => {
    try {
        const { name, category, type, price, time, status, color, description, subscriptionOffer, plans, tag } = req.body;

        const service = await Service.create({
            name,
            category,
            type,
            price: Number(price),
            time,
            status: status || 'Live',
            color: color || 'bg-brand',
            description: description || '',
            subscriptionOffer: subscriptionOffer || { enabled: false },
            plans: plans || [],
            tag: tag || ''
        });

        res.status(201).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to create service' });
    }
};

// PATCH update an existing service
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.price) updates.price = Number(updates.price);

        const service = await Service.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({ status: 'error', message: 'Service not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update service' });
    }
};

// DELETE (soft delete) a service
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ status: 'error', message: 'Service not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Service decommissioned successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete service' });
    }
};
// ── Instant Wash Configuration ──────────────────────────────────

// GET all relevant data for Instant Wash management
exports.getInstantWashConfig = async (req, res) => {
    try {
        const services = await Service.find({ category: { $in: ['Cleaning', 'Doorstep', 'Wash', 'Express'] }, isActive: true });
        
        // Fetch Banners (Promotions) and Plans for linking
        const Promotion = require('../../../models/Promotion');
        const SubscriptionPlan = require('../../../models/SubscriptionPlan');
        
        const Setting = require('../../../models/Setting');
        
        const [promotions, plans, settings] = await Promise.all([
            Promotion.find({ isActive: true }),
            SubscriptionPlan.find({ isActive: true }),
            Setting.find({ key: { $in: ['combo_discount_pct', 'multi_asset_discount_pct', 'studio_base_multiplier'] } })
        ]);

        // Default values if settings don't exist
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        if (!settingsMap.combo_discount_pct) settingsMap.combo_discount_pct = 20;
        if (!settingsMap.multi_asset_discount_pct) settingsMap.multi_asset_discount_pct = 20;

        res.status(200).json({
            status: 'success',
            data: {
                services,
                promotions,
                plans,
                settings: settingsMap
            }
        });
    } catch (error) {
        console.error('Error fetching Instant Wash config:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Instant Wash configuration' });
    }
};

// Update a specific service with granular Instant Wash details
exports.updateInstantWashService = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            detailedCoverage, 
            inclusions, 
            exclusions, 
            adminNote,
            linkedPromotions,
            linkedPlans,
            price,
            name,
            startingPrice,
            multiplierEnabled
        } = req.body;

        const service = await Service.findByIdAndUpdate(
            id,
            { 
                detailedCoverage, 
                inclusions, 
                exclusions, 
                adminNote,
                metadata: {
                    linkedPromotions,
                    linkedPlans
                },
                price,
                name,
                startingPrice,
                multiplierEnabled
            },
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({ status: 'error', message: 'Service not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error updating Instant Wash service:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update service' });
    }
};
