const Booking = require('../../../models/Booking');
const Vehicle = require('../../../models/Vehicle');
const MasterData = require('../../../models/MasterData');
const Portfolio = require('../../../models/Portfolio');
const Hub = require('../../../models/Hub');
const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Promotion = require('../../../models/Promotion');
const VehicleModel = require('../../../models/VehicleModel');
const Product = require('../../../models/Product');

const normalizeToken = (value = '') => String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parsePlanMetrics = (plan = {}) => {
    const featureText = Array.isArray(plan.features) ? plan.features.join(' ') : '';
    const washesMatch = featureText.match(/(\d+)\s*(wash|washes|credit|credits)/i);
    const vehicleMatch = featureText.match(/(\d+)\s*(vehicle|vehicles|car|cars)/i);
    const rolloverMatch = featureText.match(/(\d+)\s*rollover/i);

    const washes = washesMatch ? Number(washesMatch[1]) : (plan.price >= 999 ? 10 : plan.price >= 599 ? 5 : 2);
    const maxVehicles = vehicleMatch ? Number(vehicleMatch[1]) : (plan.price >= 999 ? 3 : plan.price >= 599 ? 2 : 1);
    const rollover = rolloverMatch ? Number(rolloverMatch[1]) : (plan.price >= 999 ? 5 : plan.price >= 599 ? 2 : 0);

    return { washes, maxVehicles, rollover };
};

const buildServiceAliases = (service = {}) => {
    const aliases = new Set();
    const add = (value) => {
        const normalized = normalizeToken(value);
        if (normalized) aliases.add(normalized);
    };

    add(service.key);
    add(service.id);
    add(service.title);
    add(service.category);
    add(service.path);
    add(service?.metadata?.id);
    add(service?.metadata?.category);
    add(service?.metadata?.path);

    if (service?.metadata?.path) {
        add(String(service.metadata.path).replace(/\//g, ' '));
    }

    return aliases;
};

const isPlanApplicableToService = (plan = {}, serviceAliases = new Set()) => {
    const applicable = Array.isArray(plan.applicableServices) ? plan.applicableServices : [];
    if (applicable.length === 0 || serviceAliases.size === 0) return true;

    const normalizedApplicable = applicable
        .map(normalizeToken)
        .filter(Boolean);

    return normalizedApplicable.some((token) => {
        if (serviceAliases.has(token)) return true;
        for (const alias of serviceAliases) {
            if (alias.includes(token) || token.includes(alias)) return true;
        }
        return false;
    });
};

const mapPlanToClient = (plan = {}) => {
    const { washes, maxVehicles, rollover } = parsePlanMetrics(plan);
    const firstFeature = Array.isArray(plan.features) && plan.features.length > 0
        ? plan.features[0]
        : 'Recurring premium car care';

    return {
        id: plan._id?.toString() || plan.id,
        name: plan.name,
        planKey: normalizeToken(plan.name || plan._id),
        price: plan.price,
        interval: plan.interval,
        features: plan.features || [],
        status: plan.status,
        accent: plan.accent,
        applicableServices: plan.applicableServices || [],
        washes,
        maxVehicles,
        rollover,
        washesLabel: `${washes} Washes/Mo`,
        subtitle: firstFeature,
        desc: firstFeature,
        type: firstFeature,
        popular: /elite|black|premium/i.test(plan.name || '')
    };
};

const getServiceCatalog = async ({ type, category, vehicleType } = {}) => {
    const dbServices = await MasterData.find({ type: 'SERVICE', isActive: true }).sort({ sortOrder: 1 });

    let allServices = dbServices.map(doc => ({
        id: doc.metadata?.id || doc.key || doc._id.toString(),
        _id: doc._id,
        title: doc.title,
        subtitle: doc.description || '',
        provider: doc.metadata?.provider || 'captain',
        category: doc.metadata?.category || 'General',
        basePrice: doc.price,
        duration: `~${doc.estimatedTime} min`,
        addons: doc.metadata?.addons || [],
        features: doc.metadata?.features || []
    }));

    if (type) {
        allServices = allServices.filter(service => service.provider === type);
    }

    if (category) {
        allServices = allServices.filter(service => service.category === category);
    }

    if (vehicleType) {
        const multiplier = Vehicle.getTypeMultiplier(vehicleType);
        allServices = allServices.map(service => ({
            ...service,
            adjustedPrice: Math.round((service.basePrice || 0) * multiplier),
            multiplier
        }));
    }

    return allServices;
};

// Get available services
exports.getServices = async (req, res) => {
    try {
        const { type, category, vehicleType } = req.query;

        // Fetch active services from MasterData collection
        const dbServices = await MasterData.find({ type: 'SERVICE', isActive: true }).sort({ sortOrder: 1 });

        // Also fetch from Service collection (the variants/versions managed in InstantWashManagement)
        const Service = require('../../../models/Service');
        const variants = await Service.find({ isActive: true });

        // Map DB document to frontend-expected format
        let allServices = dbServices.map(doc => ({
            id: doc.metadata?.id || doc.key || doc._id.toString(),
            _id: doc._id,
            tag: doc.metadata?.tag || doc.tag || '',
            title: doc.title,
            subtitle: doc.description || '',
            image: doc.iconUrl || '',
            price: `₹${doc.price}`,
            original: doc.comparePrice ? `₹${doc.comparePrice}` : '',
            duration: `~${doc.estimatedTime} min`,
            features: doc.metadata?.features || [],
            badge: doc.metadata?.badge || '',
            provider: doc.metadata?.provider || 'captain',
            isHardcoded: false,
            rating: doc.metadata?.rating || 0,
            reviews: doc.metadata?.reviews || 0,
            category: doc.metadata?.category || 'General',
            basePrice: doc.price,
            addons: doc.metadata?.addons || [],
            subscriptionOffer: doc.metadata?.subscriptionOffer || null,
            metadata: doc.metadata || {}
        }));

        // Map Variants from Service collection
        const mappedVariants = variants.map(v => ({
            id: v._id.toString(),
            _id: v._id,
            tag: v.type || '',
            title: v.name,
            subtitle: v.description || '',
            image: '', // Needs a default or mapping
            price: `₹${v.price}`,
            original: '',
            duration: v.time,
            features: v.detailedCoverage || [],
            badge: '',
            provider: 'captain', // Default for these variants
            isHardcoded: false,
            rating: 4.8,
            reviews: 120,
            category: v.category,
            basePrice: v.price,
            addons: v.inclusions || [],
            subscriptionOffer: v.subscriptionOffer,
            startingPrice: v.startingPrice,
            multiplierEnabled: v.multiplierEnabled,
            metadata: {
                linkedPromotions: v.metadata?.linkedPromotions || [],
                linkedPlans: v.metadata?.linkedPlans || []
            }
        }));

        allServices = [...allServices, ...mappedVariants];

        // Apply filters
        if (type) {
            allServices = allServices.filter(service => service.provider === type);
        }

        if (category) {
            allServices = allServices.filter(service => service.category === category);
        }

        // Apply vehicle type pricing
        if (vehicleType) {
            const Vehicle = require('../../../models/Vehicle');
            const multiplier = Vehicle.getTypeMultiplier(vehicleType);
            allServices = allServices.map(service => {
                const effectiveMultiplier = service.multiplierEnabled !== false ? multiplier : 1;
                return {
                    ...service,
                    adjustedPrice: Math.round(service.basePrice * effectiveMultiplier),
                    multiplier: effectiveMultiplier
                };
            });
        }

        res.status(200).json({
            status: 'success',
            results: allServices.length,
            data: {
                services: allServices
            }
        });

    } catch (error) {
        console.error('Error in getServices:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get services. Please try again.'
        });
    }
};

// Get active banners
exports.getBanners = async (req, res) => {
    try {
        const Promotion = require('../../../models/Promotion');
        // Fetch active banners from Promotion collection
        const dbBanners = await Promotion.find({
            type: 'Banners',
            status: 'Active',
            isActive: true
        }).sort({ createdAt: -1 });

        // Map to frontend-expected format
        const banners = dbBanners.map(doc => ({
            id: doc._id.toString(),
            title: doc.title,
            subtitle: doc.subtitle || '',
            image: doc.image || '',
            cta: doc.cta || 'Book Now',
            path: doc.path || '/',
            theme: doc.theme || 'dark',
            applicableServices: doc.applicableServices || []
        }));

        res.status(200).json({
            status: 'success',
            results: banners.length,
            data: {
                banners
            }
        });

    } catch (error) {
        console.error('Error in getBanners:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get banners. Please try again.'
        });
    }
};

// Get service details
exports.getServiceDetails = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { vehicleType } = req.query;

        // Get all services from data layer (not Express handler)
        const services = await getServiceCatalog({ vehicleType });

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                service
            }
        });

    } catch (error) {
        console.error('Error in getServiceDetails:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service details. Please try again.'
        });
    }
};

// Calculate service pricing
exports.calculatePricing = async (req, res) => {
    try {
        const { serviceId, vehicleType, addons } = req.body;

        if (!serviceId || !vehicleType) {
            return res.status(400).json({
                status: 'fail',
                message: 'Service ID and vehicle type are required'
            });
        }

        // Get service details from data layer (not Express handler)
        const services = await getServiceCatalog();

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        // Calculate pricing
        const multiplier = Vehicle.getTypeMultiplier(vehicleType);
        const baseAmount = service.basePrice;
        const vehicleMultiplier = multiplier;

        let addonAmount = 0;
        const selectedAddons = [];

        if (addons && Array.isArray(addons)) {
            addons.forEach(addonId => {
                const addon = service.addons.find(a => a.id === addonId);
                if (addon && !addon.included) {
                    addonAmount += addon.price;
                    selectedAddons.push(addon);
                }
            });
        }

        const totalAmount = Math.round((baseAmount * vehicleMultiplier) + addonAmount);

        res.status(200).json({
            status: 'success',
            data: {
                pricing: {
                    baseAmount,
                    vehicleMultiplier,
                    addonAmount,
                    totalAmount,
                    currency: 'INR',
                    breakdown: {
                        service: baseAmount,
                        vehicleAdjustment: Math.round(baseAmount * (vehicleMultiplier - 1)),
                        addons: addonAmount
                    }
                },
                selectedAddons
            }
        });

    } catch (error) {
        console.error('Error in calculatePricing:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to calculate pricing. Please try again.'
        });
    }
};

// Get available time slots
exports.getTimeSlots = async (req, res) => {
    try {
        const { date, serviceType, serviceId } = req.query;

        if (!date) {
            return res.status(400).json({
                status: 'fail',
                message: 'Date is required'
            });
        }

        // Generate time slots (mock implementation)
        const timeSlots = [
            { id: 1, time: '09:00 AM', available: true },
            { id: 2, time: '11:00 AM', available: true },
            { id: 3, time: '01:00 PM', available: false }, // Example of unavailable slot
            { id: 4, time: '03:00 PM', available: true },
            { id: 5, time: '05:00 PM', available: true },
        ];

        // In production, check actual availability based on existing bookings
        const requestedDate = new Date(date);
        const existingBookings = await Booking.find({
            'schedule.date': requestedDate,
            status: { $in: ['pending', 'confirmed', 'assigned'] }
        });

        // Mark slots as unavailable based on existing bookings
        existingBookings.forEach(booking => {
            if (booking.schedule.timeSlot) {
                const slotIndex = timeSlots.findIndex(slot =>
                    slot.time === booking.schedule.timeSlot.start
                );
                if (slotIndex !== -1) {
                    timeSlots[slotIndex].available = false;
                }
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                date,
                timeSlots: timeSlots.filter(slot => slot.available)
            }
        });

    } catch (error) {
        console.error('Error in getTimeSlots:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get time slots. Please try again.'
        });
    }
};

// Get service categories
exports.getServiceCategories = async (req, res) => {
    try {
        const dbCategories = await MasterData.find({ type: 'CATEGORY', isActive: true, 'metadata.portal': { $ne: 'eshop' } }).sort({ sortOrder: 1 });

        const categories = dbCategories.map(doc => ({
            id: doc.key.toLowerCase(),
            name: doc.title,
            description: doc.description || '',
            icon: doc.iconUrl || 'zap',
            provider: doc.metadata?.provider || 'captain',
            path: doc.metadata?.path || '/services',
            metadata: doc.metadata || {}
        }));

        res.status(200).json({
            status: 'success',
            data: {
                categories
            }
        });

    } catch (error) {
        console.error('Error in getServiceCategories:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service categories. Please try again.'
        });
    }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
    try {
        const dbStats = await MasterData.find({ type: 'CONFIG', isActive: true }).sort({ sortOrder: 1 });

        const stats = dbStats.map(doc => ({
            label: doc.title,
            value: doc.metadata?.value || '0',
            icon: doc.iconUrl || 'activity',
            subtext: doc.description || ''
        }));

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });
    } catch (error) {
        console.error('Error in getPlatformStats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get platform stats.'
        });
    }
};

// Get portfolio items (Public Showcase + User's Own Transformation)
exports.getPortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        let userBookings = [];

        // 1. Fetch User's Specific Portfolio (from Bookings)
        if (userId) {
            const dbBookings = await Booking.find({
                consumer: userId,
                status: 'completed',
                'serviceImages.after': { $exists: true, $not: { $size: 0 } }
            })
                .populate('vehicle', 'brand model type plate image')
                .populate('provider.id', 'name photo rating')
                .sort({ updatedAt: -1 });

            userBookings = dbBookings.map(b => ({
                _id: b._id,
                title: b.service.name,
                vehicle: `${b.vehicle?.brand} ${b.vehicle?.model}`,
                category: b.service.category || 'Doorstep',
                beforeImg: b.serviceImages.before[0] || '',
                afterImg: b.serviceImages.after[0] || '',
                likes: Math.floor(Math.random() * 50) + 10, // Mock likes for UI
                isUserBooking: true,
                date: b.updatedAt,
                provider: b.provider.name
            }));
        }

        // 2. Fetch Public Showcase Portfolio
        const publicShowcase = await Portfolio.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });

        const formattedShowcase = publicShowcase.map(p => ({
            ...p.toObject(),
            isUserBooking: false
        }));

        // Combine: User's transformations first, then public showcase
        const consolidatedPortfolio = [...userBookings, ...formattedShowcase];

        res.status(200).json({
            status: 'success',
            data: {
                portfolio: consolidatedPortfolio
            }
        });
    } catch (error) {
        console.error('Error in getPortfolio:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get portfolio items.'
        });
    }
};

// Get promotional cards for home page
exports.getPromotionalCards = async (req, res) => {
    try {
        const Promotion = require('../../../models/Promotion');
        const dbPromotions = await Promotion.find({
            type: { $in: ['Referrals', 'Offers', 'Expansion'] },
            status: 'Active',
            isActive: true
        }).sort({ createdAt: -1 });

        const cards = dbPromotions.map(doc => ({
            id: doc._id,
            type: doc.type,
            title: doc.title || doc.name,
            subtitle: doc.subtitle || doc.userGets,
            image: doc.image || '',
            cta: doc.cta || 'Explore',
            path: doc.path || '/',
            theme: doc.theme || 'dark',
            badge: doc.val || 'NEW',
            val: doc.val || '', // Needed for gradient values in Expansion cards
            applicableServices: doc.applicableServices || []
        }));

        res.status(200).json({
            status: 'success',
            data: {
                cards
            }
        });
    } catch (error) {
        console.error('Error in getPromotionalCards:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get promotional cards.'
        });
    }
};

// Unified search for services, categories, and products
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ status: 'success', data: { results: [] } });
        }

        const regex = new RegExp(q, 'i');

        // Search in MasterData (Services & Categories)
        const masterDataQuery = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { key: { $regex: q, $options: 'i' } }
            ],
            isActive: true,
            type: { $in: ['SERVICE', 'CATEGORY'] }
        };

        // Search in Products
        const productQuery = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ],
            status: 'Approved' // Only approved products in global search
        };

        const [masterResults, productResults] = await Promise.all([
            MasterData.find(masterDataQuery).limit(10).lean(),
            Product.find(productQuery).limit(10).lean()
        ]);

        // Normalize MasterData results
        const normalizedMaster = masterResults.map(doc => ({
            id: doc._id,
            title: doc.title,
            desc: doc.description || '',
            cat: doc.type === 'SERVICE' ? (doc.metadata?.category || 'Service') : 'Category',
            image: doc.iconUrl || '',
            path: doc.metadata?.path || (doc.type === 'SERVICE' ? '/instant-wash' : '/services'),
            type: doc.type,
            isService: true
        }));

        // Normalize Product results
        const normalizedProducts = productResults.map(doc => ({
            id: doc._id,
            title: doc.name,
            desc: doc.description || '',
            cat: doc.category || 'Product',
            image: doc.image || '',
            path: `/eshop/product/${doc._id}`,
            type: 'PRODUCT',
            isService: false,
            price: doc.salePrice || doc.price
        }));

        // Combine and sort by relevance (exact matches on title/name first)
        let combined = [...normalizedMaster, ...normalizedProducts];
        
        combined.sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const query = q.toLowerCase();

            if (aTitle === query && bTitle !== query) return -1;
            if (bTitle === query && aTitle !== query) return 1;
            if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
            if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;
            
            return 0;
        });

        res.status(200).json({
            status: 'success',
            data: {
                results: combined.slice(0, 15) // Limit total results
            }
        });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({
            status: 'error',
            message: 'Search failed.'
        });
    }
};

// Get active referral promotion details
exports.getActiveReferral = async (req, res) => {
    try {
        const Promotion = require('../../../models/Promotion');
        const activeReferral = await Promotion.findOne({
            type: 'Referrals',
            status: 'Active',
            isActive: true
        }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                referral: activeReferral || {
                    userGets: '₹50',
                    friendGets: '₹50',
                    subtitle: 'Refer a friend and you both get ₹50 credits on the next premium wash!'
                }
            }
        });
    } catch (error) {
        console.error('Error in getActiveReferral:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch referral details.'
        });
    }
};

// Get general subscription plans for the Subscriptions page
exports.getPlans = async (req, res) => {
    try {
        const { serviceId, serviceKey, serviceSlug, category } = req.query;
        let dbPlans = await SubscriptionPlan.find({ isActive: true, status: 'Live' })
            .sort({ price: 1 })
            .lean();

        const filterHints = [serviceId, serviceKey, serviceSlug, category].filter(Boolean);
        if (filterHints.length > 0) {
            const serviceFilters = [];
            if (serviceId && /^[a-f\d]{24}$/i.test(serviceId)) {
                serviceFilters.push({ _id: serviceId });
            }
            if (serviceId) {
                serviceFilters.push({ 'metadata.id': serviceId });
            }
            if (serviceKey) {
                serviceFilters.push({ key: String(serviceKey).toUpperCase() });
                serviceFilters.push({ 'metadata.id': serviceKey });
            }
            if (serviceSlug) {
                serviceFilters.push({ 'metadata.id': serviceSlug });
                serviceFilters.push({ key: String(serviceSlug).toUpperCase() });
            }
            if (category) {
                serviceFilters.push({ title: new RegExp(category, 'i') });
                serviceFilters.push({ 'metadata.category': new RegExp(category, 'i') });
            }

            const serviceDoc = serviceFilters.length > 0
                ? await MasterData.findOne({
                    type: 'SERVICE',
                    isActive: true,
                    $or: serviceFilters
                }).lean()
                : null;

            const serviceAliases = buildServiceAliases({
                ...serviceDoc,
                id: serviceDoc?.metadata?.id || serviceDoc?.key || serviceId,
                key: serviceDoc?.key || serviceKey,
                category: serviceDoc?.metadata?.category || category,
                path: serviceDoc?.metadata?.path
            });

            filterHints.forEach((hint) => {
                const normalized = normalizeToken(hint);
                if (normalized) serviceAliases.add(normalized);
            });

            dbPlans = dbPlans.filter((plan) => isPlanApplicableToService(plan, serviceAliases));
        }

        const plans = dbPlans.map(mapPlanToClient);

        res.status(200).json({
            status: 'success',
            data: { plans }
        });
    } catch (error) {
        console.error('Error in getPlans:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription plans.' });
    }
};

// Get subscription plans for services
exports.getServicePlans = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const serviceDoc = await MasterData.findOne({
            type: 'SERVICE',
            isActive: true,
            $or: [
                { key: String(serviceId || '').toUpperCase() },
                { 'metadata.id': serviceId },
                ...( /^[a-f\d]{24}$/i.test(String(serviceId || '')) ? [{ _id: serviceId }] : [])
            ]
        }).lean();

        const serviceAliases = buildServiceAliases({
            ...serviceDoc,
            id: serviceDoc?.metadata?.id || serviceId,
            key: serviceDoc?.key || serviceId,
            category: serviceDoc?.metadata?.category,
            path: serviceDoc?.metadata?.path
        });
        const normalizedServiceId = normalizeToken(serviceId);
        if (normalizedServiceId) serviceAliases.add(normalizedServiceId);

        const dbPlans = await SubscriptionPlan.find({ isActive: true, status: 'Live' }).lean();
        const plans = dbPlans
            .filter((plan) => isPlanApplicableToService(plan, serviceAliases))
            .map((plan) => {
                const mapped = mapPlanToClient(plan);
                return {
                    id: mapped.id,
                    name: mapped.name,
                    price: mapped.price,
                    washes: mapped.washesLabel,
                    type: mapped.type,
                    desc: mapped.desc,
                    color: mapped.accent || 'bg-brand/5 text-brand border-brand/20',
                    popular: mapped.popular,
                    interval: mapped.interval,
                    applicableServices: mapped.applicableServices
                };
            });

        res.status(200).json({
            status: 'success',
            data: {
                plans: plans.length > 0 ? plans : [
                    {
                        id: 'basic',
                        name: 'Eco Shine',
                        price: 599,
                        washes: '24 Washes/Mo',
                        type: 'Primary Dry Wash',
                        desc: 'Daily dusting & cleaning',
                        color: 'bg-green-50 text-green-600 border-green-100'
                    }
                ]
            }
        });

    } catch (error) {
        console.error('Error in getServicePlans:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get service plans. Please try again.'
        });
    }
};

// Get available hubs/societies
exports.getHubs = async (req, res) => {
    try {
        const { type, city, q, limit = 100 } = req.query;
        const query = { isActive: true };
        if (type) query.type = type;
        if (city) query.city = city;
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { city: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ];
        }

        const hubs = await Hub.find(query)
            .populate('vendor', 'name profile.studioName profile.avatar rating')
            .limit(Math.min(Number(limit) || 100, 500))
            .sort({ name: 1 });

        const normalizedHubs = hubs.map((hub) => {
            const hubObj = hub.toObject ? hub.toObject() : hub;
            return {
                ...hubObj,
                location: hubObj.location || `${hubObj.name}, ${hubObj.city}`,
                iconUrl: hubObj.iconUrl || hubObj.metadata?.iconUrl || ''
            };
        });

        res.status(200).json({
            status: 'success',
            results: normalizedHubs.length,
            data: { hubs: normalizedHubs }
        });
    } catch (error) {
        console.error('Error in getHubs:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch hubs'
        });
    }
};

// Get apartment wash flow data in one payload
exports.getApartmentFlowData = async (req, res) => {
    try {
        const { city = '', serviceKey = 'APARTMENT_WASH' } = req.query;
        const serviceDoc = await MasterData.findOne({
            type: 'SERVICE',
            isActive: true,
            $or: [
                { key: String(serviceKey).toUpperCase() },
                { 'metadata.id': serviceKey },
                { 'metadata.path': '/apartments' },
                { title: /apartment/i }
            ]
        }).sort({ sortOrder: 1 }).lean();

        if (!serviceDoc) {
            return res.status(404).json({
                status: 'fail',
                message: 'Apartment Wash service configuration not found'
            });
        }

        const service = {
            id: serviceDoc.metadata?.id || serviceDoc.key,
            key: serviceDoc.key,
            title: serviceDoc.title,
            description: serviceDoc.description || '',
            image: serviceDoc.iconUrl || '',
            price: serviceDoc.price || 0,
            estimatedTime: serviceDoc.estimatedTime || 0,
            metadata: serviceDoc.metadata || {}
        };

        const serviceAliases = buildServiceAliases({
            ...serviceDoc,
            id: service.id,
            key: service.key,
            title: service.title,
            category: serviceDoc.metadata?.category,
            path: serviceDoc.metadata?.path
        });
        serviceAliases.add('apartment-wash');
        serviceAliases.add('apartments');

        const [dbPlans, dbHubs] = await Promise.all([
            SubscriptionPlan.find({ isActive: true, status: 'Live' }).sort({ price: 1 }).lean(),
            Hub.find({
                isActive: true,
                type: 'Hub',
                ...(city ? { city } : {})
            })
                .populate('vendor', 'name profile.studioName profile.avatar rating')
                .sort({ name: 1 })
                .lean()
        ]);

        const plans = dbPlans
            .filter((plan) => isPlanApplicableToService(plan, serviceAliases))
            .map(mapPlanToClient);

        const apartments = dbHubs.map((hub) => ({
            ...hub,
            location: hub.location || `${hub.name}, ${hub.city}`,
            iconUrl: hub.iconUrl || hub.metadata?.iconUrl || ''
        }));

        const defaultSlots = [
            { id: 'morning', time: '6:00 AM - 9:00 AM', label: 'Morning Primary' },
            { id: 'evening', time: '6:00 PM - 8:00 PM', label: 'Evening Optional' }
        ];

        const slots = Array.isArray(serviceDoc.metadata?.slots) && serviceDoc.metadata.slots.length > 0
            ? serviceDoc.metadata.slots
            : defaultSlots;

        const rules = Array.isArray(serviceDoc.metadata?.rules) && serviceDoc.metadata.rules.length > 0
            ? serviceDoc.metadata.rules
            : [
                'Primary focus on morning 6-9 AM operations',
                'Sorted workload by Basement -> Block -> Pillar',
                'Max 10 cars per slot per compartment'
            ];

        res.status(200).json({
            status: 'success',
            data: {
                service,
                apartments,
                plans,
                slots,
                rules
            }
        });
    } catch (error) {
        console.error('Error in getApartmentFlowData:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch apartment flow data'
        });
    }
};

// Validate service availability
exports.validateServiceAvailability = async (req, res) => {
    try {
        const { serviceId, vehicleType, date, timeSlot, location } = req.body;

        if (!serviceId || !vehicleType || !date) {
            return res.status(400).json({
                status: 'fail',
                message: 'Service ID, vehicle type, and date are required'
            });
        }

        // Check if service exists using data layer (not Express handler)
        const services = await getServiceCatalog();

        const service = services.find(s => s.id === serviceId);

        if (!service) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service not found'
            });
        }

        // Check time slot availability
        let isSlotAvailable = true;
        if (timeSlot) {
            const existingBooking = await Booking.findOne({
                'schedule.date': new Date(date),
                'schedule.timeSlot.start': timeSlot,
                status: { $in: ['pending', 'confirmed', 'assigned'] }
            });

            isSlotAvailable = !existingBooking;
        }

        // Check location serviceability (mock implementation)
        let isLocationServiceable = true;
        if (location && location.coordinates) {
            // In production, check if location is within service area
            isLocationServiceable = true;
        }

        const validation = {
            available: isSlotAvailable && isLocationServiceable,
            serviceAvailable: true,
            slotAvailable: isSlotAvailable,
            locationServiceable: isLocationServiceable,
            message: isSlotAvailable && isLocationServiceable
                ? 'Service is available'
                : 'Service not available for selected slot or location'
        };

        res.status(200).json({
            status: 'success',
            data: {
                validation
            }
        });

    } catch (error) {
        console.error('Error in validateServiceAvailability:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to validate service availability. Please try again.'
        });
    }
};

// Validate Coupon
exports.validateCoupon = async (req, res) => {
    try {
        const { code, amount, serviceType } = req.body;

        if (!code) {
            return res.status(400).json({
                status: 'fail',
                message: 'Coupon code is required'
            });
        }

        const coupon = await Promotion.findOne({
            type: 'Coupons',
            code: code.toUpperCase(),
            status: 'Active',
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({
                status: 'fail',
                message: 'Invalid or expired coupon code'
            });
        }

        // Check for service applicability
        if (serviceType && coupon.applicableServices && coupon.applicableServices.length > 0) {
            if (!coupon.applicableServices.includes(serviceType)) {
                return res.status(400).json({
                    status: 'fail',
                    message: `This coupon is not applicable to ${serviceType}`
                });
            }
        }

        // Logic for discount calculation
        let discountAmount = 0;
        const baseAmount = parseFloat(amount) || 0;

        if (coupon.reductionType === 'Percentage') {
            const percent = parseFloat(coupon.val.replace('%', '')) || 0;
            discountAmount = (baseAmount * percent) / 100;
        } else if (coupon.reductionType === 'Flat') {
            discountAmount = parseFloat(coupon.val.replace(/[^\d.]/g, '')) || 0;
        }

        res.status(200).json({
            status: 'success',
            data: {
                coupon: {
                    code: coupon.code,
                    reductionType: coupon.reductionType,
                    val: coupon.val,
                    discountAmount: Math.min(discountAmount, baseAmount)
                }
            }
        });

    } catch (error) {
        console.error('Error in validateCoupon:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to validate coupon. Please try again.'
        });
    }
};

// Get consolidated home data for Consumer Home screen
exports.getHomeData = async (req, res) => {
    try {
        const fetchBanners = Promotion.find({
            type: 'Banners',
            status: 'Active',
            isActive: true
        }).sort({ createdAt: -1 });

        const fetchServices = MasterData.find({ type: 'SERVICE', isActive: true }).sort({ sortOrder: 1 });

        const fetchCategories = MasterData.find({ 
            type: 'CATEGORY', 
            isActive: true, 
            'metadata.portal': { $ne: 'eshop' } 
        }).sort({ sortOrder: 1 });

        const fetchPromotions = Promotion.find({
            type: { $in: ['Referrals', 'Offers', 'Expansion'] },
            status: 'Active',
            isActive: true
        }).sort({ createdAt: -1 });

        const fetchStats = MasterData.find({ type: 'CONFIG', isActive: true }).sort({ sortOrder: 1 });

        const [dbBanners, dbServices, dbCategories, dbPromotions, dbStats] = await Promise.all([
            fetchBanners,
            fetchServices,
            fetchCategories,
            fetchPromotions,
            fetchStats
        ]);

        const banners = dbBanners.map(doc => ({
            id: doc._id.toString(),
            title: doc.title,
            subtitle: doc.subtitle || '',
            image: doc.image || '',
            cta: doc.cta || 'Book Now',
            path: doc.path || '/',
            theme: doc.theme || 'dark',
            applicableServices: doc.applicableServices || []
        }));

        const services = dbServices.map(doc => ({
            id: doc.metadata?.id || doc.key || doc._id.toString(),
            _id: doc._id,
            title: doc.title,
            image: doc.iconUrl || '',
            price: `₹${doc.price}`,
            badge: doc.metadata?.badge || '',
            metadata: doc.metadata || {}
        }));

        const categories = dbCategories.map(doc => ({
            id: doc.key.toLowerCase(),
            name: doc.title,
            icon: doc.iconUrl || 'zap',
            path: doc.metadata?.path || '/services',
            metadata: doc.metadata || {}
        }));

        const cards = dbPromotions.map(doc => ({
            id: doc._id,
            type: doc.type,
            title: doc.title || doc.name,
            subtitle: doc.subtitle || doc.userGets,
            image: doc.image || '',
            cta: doc.cta || 'Explore',
            path: doc.path || '/',
            theme: doc.theme || 'dark',
            badge: doc.val || 'NEW',
            val: doc.val || ''
        }));

        const stats = dbStats.map(doc => ({
            label: doc.title,
            value: doc.metadata?.value || '0',
            icon: doc.iconUrl || 'activity',
            key: doc.key,
            metadata: doc.metadata || {}
        }));

        res.status(200).json({
            status: 'success',
            data: {
                banners,
                services,
                categories,
                cards,
                stats
            }
        });

    } catch (error) {
        console.error('Error in getHomeData:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch home data'
        });
    }
};

// Get specific vehicle models (Catalog)
exports.getVehicleModels = async (req, res) => {
    try {
        const { type, brand } = req.query;
        const query = { isActive: true };
        if (type) query.type = type;
        if (brand) query.brand = brand;

        const vehicleModels = await VehicleModel.find(query).sort({ brand: 1, model: 1 });

        res.status(200).json({
            status: 'success',
            results: vehicleModels.length,
            data: { vehicleModels }
        });
    } catch (error) {
        console.error('Error in getVehicleModels:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch vehicle models'
        });
    }
};

// Like a portfolio item
exports.likePortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;
        const portfolioItem = await Portfolio.findByIdAndUpdate(
            id,
            { $inc: { likes: 1 } },
            { new: true }
        );

        if (!portfolioItem) {
            return res.status(404).json({
                status: 'fail',
                message: 'Portfolio item not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                likes: portfolioItem.likes
            }
        });
    } catch (error) {
        console.error('Error in likePortfolioItem:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to like image.'
        });
    }
};

// --- Instant Wash Consumer Config ---
exports.getInstantWashConfig = async (req, res) => {
    try {
        const Setting = require('../../../models/Setting');
        const [services, plans, settings] = await Promise.all([
            require('../../../models/Service').find({ category: { $in: ['Cleaning', 'Doorstep', 'Wash', 'Express'] }, isActive: true }),
            SubscriptionPlan.find({ isActive: true, status: 'Live' }),
            Setting.find({ key: { $in: ['combo_discount_pct', 'multi_asset_discount_pct', 'studio_base_multiplier'] } })
        ]);

        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        if (!settingsMap.combo_discount_pct) settingsMap.combo_discount_pct = 20;
        if (!settingsMap.multi_asset_discount_pct) settingsMap.multi_asset_discount_pct = 20;

        res.status(200).json({
            status: 'success',
            data: {
                services,
                plans,
                settings: settingsMap
            }
        });
    } catch (error) {
        console.error('Error fetching consumer Instant Wash config:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Instant Wash configuration' });
    }
};
