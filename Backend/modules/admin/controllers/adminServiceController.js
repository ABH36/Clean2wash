const Service = require('../../../models/Service');
const MasterData = require('../../../models/MasterData');

const DEFAULT_APARTMENT_WASH_SERVICE = {
    key: 'APARTMENT_WASH',
    title: 'Apartment Wash',
    description: 'Recurring apartment car wash service with parking-route based captain operations',
    price: 599,
    estimatedTime: 30,
    sortOrder: 2,
    metadata: {
        id: 'apartment-wash',
        path: '/apartments',
        category: 'Apartment',
        provider: 'captain',
        slots: [
            { id: 'morning', label: 'Morning Primary', time: '6:00 AM - 9:00 AM' },
            { id: 'evening', label: 'Evening Optional', time: '6:00 PM - 8:00 PM' }
        ],
        rules: [
            'Primary focus on morning 6-9 AM operations',
            'Maximum 10 cars per captain per apartment slot',
            'Sort captain route by Basement -> Block -> Pillar',
            'Use dry wash as default service'
        ],
        features: ['Dry Wash Default', 'Morning Slot First', 'Parking Route Sorted'],
        badge: 'Recurring'
    }
};

const DEFAULT_CHAUFFEUR_SERVICES = [
    {
        key: 'CHAUFFEUR_POINT',
        title: 'Point-to-Point',
        description: 'Round trip from pickup and back to the same point',
        price: 299,
        estimatedTime: 60,
        sortOrder: 1,
        metadata: {
            id: 'point',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            durationOptions: ['1 Hour', '2 Hours', '4 Hours'],
            commercialRules: {
                waitingGraceMinutes: 15,
                waitChargePerMinute: 2,
                overtimeGraceMinutes: 15,
                nightAllowance: 300,
                commissionPercent: 15,
                gstPercent: 0,
                gstInclusive: false
            },
            features: ['Verified Driver', 'Round Trip', 'Return To Pickup Point'],
            badge: 'Reliable'
        }
    },
    {
        key: 'CHAUFFEUR_HOURLY',
        title: 'Hourly Booking',
        description: 'Flexible local errands',
        price: 199,
        estimatedTime: 240,
        sortOrder: 2,
        metadata: {
            id: 'hourly',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            durationOptions: ['4 Hours', '8 Hours'],
            commercialRules: {
                waitingGraceMinutes: 15,
                waitChargePerMinute: 2,
                overtimeGraceMinutes: 15,
                nightAllowance: 300,
                subscriptionHourlyRate: 150,
                commissionPercent: 15,
                gstPercent: 0,
                gstInclusive: false
            },
            features: ['Expert Driver', '4h/8h/12h Slots', 'Background Verified'],
            badge: 'Flexible'
        }
    },
    {
        key: 'CHAUFFEUR_FULLDAY',
        title: 'Full Day',
        description: 'Dedicated city driver',
        price: 999,
        estimatedTime: 480,
        sortOrder: 3,
        metadata: {
            id: 'full',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            durationOptions: ['8 Hours'],
            commercialRules: {
                waitingGraceMinutes: 15,
                waitChargePerMinute: 2,
                overtimeGraceMinutes: 15,
                nightAllowance: 300,
                commissionPercent: 15,
                gstPercent: 0,
                gstInclusive: false
            },
            features: ['Private Driver', 'Local Travel', '8 Hours Service'],
            badge: 'Saves Time'
        }
    },
    {
        key: 'CHAUFFEUR_OUTSTATION',
        title: 'Outstation',
        description: 'Inter-city travel care',
        price: 1499,
        estimatedTime: 1440,
        sortOrder: 4,
        metadata: {
            id: 'outstation',
            tag: 'CHAUFFEUR',
            category: 'Chauffeur',
            provider: 'sparedriver',
            durationOptions: ['24 Hours'],
            commercialRules: {
                waitingGraceMinutes: 15,
                waitChargePerMinute: 2,
                overtimeGraceMinutes: 15,
                nightAllowance: 300,
                outstationAllowancePerDay: 500,
                commissionPercent: 15,
                gstPercent: 0,
                gstInclusive: false
            },
            features: ['Highway Expert', 'Inter-city Trip', 'Stay Included'],
            badge: 'Luxury'
        }
    }
];

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

// GET chauffeur / spare-driver services from MasterData
exports.getChauffeurServiceConfig = async (req, res) => {
    try {
        let services = await MasterData.find({
            type: 'SERVICE',
            $or: [
                { 'metadata.category': 'Chauffeur' },
                { 'metadata.provider': 'sparedriver' },
                { key: /^CHAUFFEUR_/ }
            ]
        }).sort({ sortOrder: 1, title: 1 });

        if (services.length === 0) {
            await Promise.all(
                DEFAULT_CHAUFFEUR_SERVICES.map((service) => (
                    MasterData.findOneAndUpdate(
                        { key: service.key },
                        {
                            type: 'SERVICE',
                            isActive: true,
                            ...service
                        },
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true
                        }
                    )
                ))
            );

            services = await MasterData.find({
                type: 'SERVICE',
                $or: [
                    { 'metadata.category': 'Chauffeur' },
                    { 'metadata.provider': 'sparedriver' },
                    { key: /^CHAUFFEUR_/ }
                ]
            }).sort({ sortOrder: 1, title: 1 });
        }

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: { services }
        });
    } catch (error) {
        console.error('Error fetching chauffeur service config:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch chauffeur service config' });
    }
};

exports.getApartmentWashConfig = async (req, res) => {
    try {
        let service = await MasterData.findOne({
            type: 'SERVICE',
            $or: [
                { key: 'APARTMENT_WASH' },
                { 'metadata.path': '/apartments' },
                { 'metadata.id': 'apartment-wash' }
            ]
        });

        if (!service) {
            service = await MasterData.findOneAndUpdate(
                { key: DEFAULT_APARTMENT_WASH_SERVICE.key },
                {
                    type: 'SERVICE',
                    isActive: true,
                    ...DEFAULT_APARTMENT_WASH_SERVICE
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        }

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error fetching apartment wash config:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch apartment wash configuration' });
    }
};

exports.updateApartmentWashServiceConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            price,
            estimatedTime,
            badge,
            features,
            slots,
            rules,
            isActive,
            sortOrder
        } = req.body;

        const service = await MasterData.findById(id);

        if (!service || service.type !== 'SERVICE') {
            return res.status(404).json({ status: 'error', message: 'Apartment wash service not found' });
        }

        const isApartmentService =
            service.key === 'APARTMENT_WASH' ||
            service.metadata?.path === '/apartments' ||
            service.metadata?.id === 'apartment-wash' ||
            service.metadata?.category === 'Apartment';

        if (!isApartmentService) {
            return res.status(400).json({ status: 'error', message: 'Selected record is not the apartment wash service' });
        }

        if (title !== undefined) service.title = title;
        if (description !== undefined) service.description = description;
        if (price !== undefined) service.price = Number(price);
        if (estimatedTime !== undefined) service.estimatedTime = Number(estimatedTime);
        if (isActive !== undefined) service.isActive = Boolean(isActive);
        if (sortOrder !== undefined) service.sortOrder = Number(sortOrder);

        const currentMetadata = service.metadata || {};
        service.metadata = {
            ...currentMetadata,
            id: 'apartment-wash',
            path: '/apartments',
            category: 'Apartment',
            provider: 'captain',
            badge: badge !== undefined ? badge : (currentMetadata.badge || 'Recurring'),
            features: Array.isArray(features) ? features.filter(Boolean) : (currentMetadata.features || []),
            slots: Array.isArray(slots) ? slots.filter(Boolean) : (currentMetadata.slots || []),
            rules: Array.isArray(rules) ? rules.filter(Boolean) : (currentMetadata.rules || [])
        };

        await service.save();

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error updating apartment wash config:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update apartment wash configuration' });
    }
};

// PATCH chauffeur / spare-driver service in MasterData
exports.updateChauffeurServiceConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            price,
            estimatedTime,
            badge,
            features,
            durationOptions,
            durationPricing,
            commercialRules,
            isActive,
            sortOrder
        } = req.body;

        const service = await MasterData.findById(id);

        if (!service || service.type !== 'SERVICE') {
            return res.status(404).json({ status: 'error', message: 'Chauffeur service not found' });
        }

        const isChauffeurService =
            service.metadata?.category === 'Chauffeur' ||
            service.metadata?.provider === 'sparedriver' ||
            String(service.key || '').startsWith('CHAUFFEUR_');

        if (!isChauffeurService) {
            return res.status(400).json({ status: 'error', message: 'Selected record is not a chauffeur service' });
        }

        if (title !== undefined) service.title = title;
        if (description !== undefined) service.description = description;
        if (price !== undefined) service.price = Number(price);
        if (estimatedTime !== undefined) service.estimatedTime = Number(estimatedTime);
        if (isActive !== undefined) service.isActive = Boolean(isActive);
        if (sortOrder !== undefined) service.sortOrder = Number(sortOrder);

        const currentMetadata = service.metadata || {};
        service.metadata = {
            ...currentMetadata,
            category: 'Chauffeur',
            provider: 'sparedriver',
            badge: badge !== undefined ? badge : currentMetadata.badge,
            durationOptions: Array.isArray(durationOptions)
                ? durationOptions.filter(Boolean)
                : currentMetadata.durationOptions || [],
            durationPricing: durationPricing && typeof durationPricing === 'object'
                ? durationPricing
                : (currentMetadata.durationPricing || {}),
            commercialRules: commercialRules && typeof commercialRules === 'object'
                ? {
                    ...(currentMetadata.commercialRules || {}),
                    ...commercialRules
                }
                : (currentMetadata.commercialRules || {}),
            features: Array.isArray(features)
                ? features.filter(Boolean)
                : currentMetadata.features || []
        };

        await service.save();

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error updating chauffeur service config:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to update chauffeur service config' });
    }
};
