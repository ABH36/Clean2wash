const Booking = require('../../../models/Booking');
const Vehicle = require('../../../models/Vehicle');
const MasterData = require('../../../models/MasterData');
const Portfolio = require('../../../models/Portfolio');
const Hub = require('../../../models/Hub');
const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Promotion = require('../../../models/Promotion');
const VehicleModel = require('../../../models/VehicleModel');
const Product = require('../../../models/Product');
const Setting = require('../../../models/Setting');
const Service = require('../../../models/Service');
const Subscription = require('../../../models/Subscription');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

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

// Get available services (HARDENED: Real Feedback)
exports.getServices = catchAsync(async (req, res, next) => {
    const { type, category, vehicleType } = req.query;

    // Fetch active services from MasterData collection
    const dbServices = await MasterData.find({ type: 'SERVICE', isActive: true }).sort({ sortOrder: 1 });

    // Also fetch from Service collection
    const Service = require('../../../models/Service');
    const Review = require('../../../models/Review');
    const variants = await Service.find({ isActive: true });

    // 1. Fetch real review stats (Bulk Aggregation)
    const reviewStats = await Review.aggregate([
        { $group: { _id: '$targetId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const getStats = (id) => {
        const stats = reviewStats.find(s => s._id.toString() === id.toString());
        return {
            rating: stats ? parseFloat(stats.avg.toFixed(1)) : 5.0,
            reviews: stats ? stats.count : 0
        };
    };

    // Map DB document to frontend-expected format
    let allServices = dbServices.map(doc => {
        const stats = getStats(doc._id);
        return {
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
            rating: stats.rating,
            reviews: stats.reviews,
            category: doc.metadata?.category || 'General',
            basePrice: doc.price,
            addons: doc.metadata?.addons || [],
            subscriptionOffer: doc.metadata?.subscriptionOffer || null,
            metadata: doc.metadata || {}
        };
    });

    // Map Variants from Service collection
    const mappedVariants = variants.map(v => {
        const stats = getStats(v._id);
        return {
            id: v._id.toString(),
            _id: v._id,
            tag: v.type || '',
            title: v.name,
            subtitle: v.description || '',
            image: v.image || v.thumbnail || '',
            price: `₹${v.price}`,
            original: '',
            duration: v.time,
            features: v.detailedCoverage || [],
            badge: '',
            provider: (v.category === 'Studio' || v.category === 'Studio Detailing' || v.category === 'Detailing') ? 'vendor' : 'captain',
            isHardcoded: false,
            rating: stats.rating,
            reviews: stats.reviews,
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
        };
    });

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
});

// Get active banners
exports.getBanners = catchAsync(async (req, res, next) => {
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
});

// Get service details
exports.getServiceDetails = catchAsync(async (req, res, next) => {
    const { serviceId } = req.params;
    const { vehicleType } = req.query;

    // Get all services from data layer (not Express handler)
    const services = await getServiceCatalog({ vehicleType });

    const service = services.find(s => s.id === serviceId);

    if (!service) {
        return next(new AppError('Service not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            service
        }
    });
});

// Calculate service pricing
exports.calculatePricing = catchAsync(async (req, res, next) => {
    const { serviceId, vehicleType, addons } = req.body;

    if (!serviceId || !vehicleType) {
        return next(new AppError('Service ID and vehicle type are required', 400));
    }

    // Get service details from data layer (not Express handler)
    const services = await getServiceCatalog();

    const service = services.find(s => s.id === serviceId);

    if (!service) {
        return next(new AppError('Service not found', 404));
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
});

// Get available time slots
// Get available time slots (HARDENED: Hub-Aware Capacity Engine)
exports.getTimeSlots = catchAsync(async (req, res, next) => {
    const { date, serviceId, hubId, city } = req.query;

    if (!date) {
        return next(new AppError('Date is required for availability synchronization.', 400));
    }

    // 1. Resolve Hub & Capacity
    let targetHub;
    if (hubId) {
        targetHub = await Hub.findById(hubId);
    } else if (city) {
        targetHub = await Hub.findOne({ city, isActive: true });
    }

    // Default capacity if no hub found (System fallback)
    const totalCapacity = targetHub ? (targetHub.captains || 5) : 3;

    // 2. Define Standard Slots (09:00 AM to 07:00 PM)
    const baseSlots = [
        { id: 1, start: '09:00 AM', end: '11:00 AM' },
        { id: 2, start: '11:00 AM', end: '01:00 PM' },
        { id: 3, start: '01:00 PM', end: '03:00 PM' },
        { id: 4, start: '03:00 PM', end: '05:00 PM' },
        { id: 5, start: '05:00 PM', end: '07:00 PM' },
    ];

    // 3. Fetch Service Duration (Realism)
    let serviceDuration = 60; // Default
    if (serviceId) {
        const service = await MasterData.findOne({ 'metadata.id': serviceId, type: 'SERVICE' });
        if (service) serviceDuration = service.estimatedTime || 60;
    }

    // 4. Query Real-time Bookings for the Hub and Date
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const bookingFilter = {
        'schedule.date': requestedDate,
        status: { $in: ['pending', 'confirmed', 'assigned', 'en_route', 'in_progress'] }
    };

    if (targetHub) {
        bookingFilter['location.hub'] = targetHub.name;
    } else if (city) {
        bookingFilter['location.address.city'] = new RegExp(city, 'i');
    }

    const existingBookings = await Booking.find(bookingFilter);

    // 5. Calculate Availability per Slot
    const timeSlots = baseSlots.map(slot => {
        const bookedCount = existingBookings.filter(b =>
            b.schedule.timeSlot && b.schedule.timeSlot.start === slot.start
        ).length;

        const remainingCapacity = totalCapacity - bookedCount;

        return {
            ...slot,
            capacity: totalCapacity,
            booked: bookedCount,
            available: remainingCapacity > 0,
            remaining: remainingCapacity
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            date,
            hub: targetHub ? targetHub.name : 'General',
            timeSlots: timeSlots.filter(slot => slot.available)
        }
    });
});

// Get service categories
exports.getServiceCategories = catchAsync(async (req, res, next) => {
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
});

// Get platform statistics (HARDENED: Real-time Aggregations)
exports.getPlatformStats = catchAsync(async (req, res, next) => {
    const [totalWashes, activeUsers, totalCities, avgRating] = await Promise.all([
        Booking.countDocuments({ status: 'completed' }),
        User.countDocuments({ role: 'consumer', isActive: true }),
        Hub.distinct('city').then(cities => cities.length),
        require('../../../models/Review').aggregate([
            { $group: { _id: null, avg: { $avg: '$rating' } } }
        ]).then(res => (res[0]?.avg || 4.9).toFixed(1))
    ]);

    const stats = [
        { label: 'Total Washes', value: `${totalWashes}+`, icon: 'droplets', subtext: 'Premium cleans delivered' },
        { label: 'Happy Users', value: `${activeUsers}+`, icon: 'users', subtext: 'Active community members' },
        { label: 'Urban Coverage', value: `${totalCities} Cities`, icon: 'map-pin', subtext: 'Expanding across India' },
        { label: 'Happiness Reg.', value: `${avgRating}/5`, icon: 'star', subtext: 'User satisfaction score' }
    ];

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

// Get portfolio items (Public Showcase + User's Own Transformation)
exports.getPortfolio = catchAsync(async (req, res, next) => {
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
            likes: 0, // Realism: Initializing at 0
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
});

// Get promotional cards for home page
exports.getPromotionalCards = catchAsync(async (req, res, next) => {
    const dbPromotions = await Promotion.find({
        type: { $in: ['Referrals', 'Offers', 'Expansion'] },
        status: 'Active',
        isActive: true
    }).sort({ createdAt: -1 });

    const usedPromoIds = req.user?.usedPromotions?.map(id => id.toString()) || [];
    const cards = dbPromotions
        .filter(doc => !usedPromoIds.includes(doc._id.toString()))
        .map(doc => ({
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
});

// Unified search for services, categories, and products
exports.search = catchAsync(async (req, res, next) => {
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
            results: combined.slice(0, 15)
        }
    });
});

// Get active referral promotion details
exports.getActiveReferral = catchAsync(async (req, res, next) => {
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
});

// Get general subscription plans for the Subscriptions page
exports.getPlans = catchAsync(async (req, res, next) => {
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
});

// Get subscription plans for services
exports.getServicePlans = catchAsync(async (req, res, next) => {
    const { serviceId } = req.params;
    const serviceDoc = await MasterData.findOne({
        type: 'SERVICE',
        isActive: true,
        $or: [
            { key: String(serviceId || '').toUpperCase() },
            { 'metadata.id': serviceId },
            ...(/^[a-f\d]{24}$/i.test(String(serviceId || '')) ? [{ _id: serviceId }] : [])
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
});

// Get available hubs/societies
exports.getHubs = catchAsync(async (req, res, next) => {
    const { type, city, q, lat, lng, radius = 10, limit = 100 } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    if (city) query.city = city;

    // Geospatial Radius Filtering
    if (lat && lng) {
        query['location.coordinates'] = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: parseInt(radius) * 1000 // Convert km to meters
            }
        };
    }

    if (q) {
        query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } },
            { 'location.address': { $regex: q, $options: 'i' } }
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
});

// Get apartment wash flow data in one payload
exports.getApartmentFlowData = catchAsync(async (req, res, next) => {
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
        return next(new AppError('Apartment Wash service configuration not found', 404));
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
});

// Validate service availability
exports.validateServiceAvailability = catchAsync(async (req, res, next) => {
    const { serviceId, vehicleType, date, timeSlot, location } = req.body;

    if (!serviceId || !vehicleType || !date) {
        return next(new AppError('Service ID, vehicle type, and date are required', 400));
    }

    // Check if service exists using data layer (not Express handler)
    const services = await getServiceCatalog();

    const service = services.find(s => s.id === serviceId);

    if (!service) {
        return next(new AppError('Service not found', 404));
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
});

// Validate Coupon
exports.validateCoupon = catchAsync(async (req, res, next) => {
    const { code, amount, serviceType } = req.body;

    // Anti-Stacking Check: If user has active Black Pass, prevent stacking
    const activeSub = await Subscription.findOne({ user: req.user.id, status: 'active', endDate: { $gt: new Date() } });

    if (activeSub && (activeSub.benefits.includes('discount_30_percent') || activeSub.benefits.includes('discount_20_percent'))) {
        return next(new AppError('Premium membership benefits are active. Non-stacking policy: Additional coupons cannot be combined with subscription discounts.', 400));
    }

    if (!code) {
        return next(new AppError('Coupon code is required', 400));
    }

    const coupon = await Promotion.findOne({
        type: 'Coupons',
        code: code.toUpperCase(),
        status: 'Active',
        isActive: true
    });

    if (!coupon) {
        return next(new AppError('Invalid or expired coupon code', 404));
    }

    // Check if user already used this coupon
    if (req.user?.usedPromotions && req.user.usedPromotions.includes(coupon._id)) {
        return next(new AppError('You have already used this coupon protocol once.', 400));
    }

    // Check for service applicability
    if (serviceType && coupon.applicableServices && coupon.applicableServices.length > 0) {
        if (!coupon.applicableServices.includes(serviceType)) {
            return next(new AppError(`This coupon is not applicable to ${serviceType}`, 400));
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
});

// Get consolidated home data for Consumer Home screen
exports.getHomeData = catchAsync(async (req, res, next) => {
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

    const fetchPassConfig = Setting.findOne({ key: 'WASH_PASS_CONFIG' });
    const fetchStats = MasterData.find({ type: 'PLATFORM_STAT', isActive: true }).sort({ sortOrder: 1 });

    const [dbBanners, dbServices, dbCategories, dbPromotions, dbStats, passConfig] = await Promise.all([
        fetchBanners,
        fetchServices,
        fetchCategories,
        fetchPromotions,
        fetchStats,
        fetchPassConfig
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

    const usedPromoIds = req.user?.usedPromotions?.map(id => id.toString()) || [];
    const cards = dbPromotions
        .filter(doc => !usedPromoIds.includes(doc._id.toString()))
        .map(doc => ({
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
            stats,
            passConfig: passConfig?.value || passConfig?.metadata || { discount: 0.3, marketingLine: '30% OFF ON ALL SERVICES' }
        }
    });
});

// Get specific vehicle models (Catalog)
exports.getVehicleModels = catchAsync(async (req, res, next) => {
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
});

// Like a portfolio item
exports.likePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const portfolioItem = await Portfolio.findByIdAndUpdate(
        id,
        { $inc: { likes: 1 } },
        { new: true }
    );

    if (!portfolioItem) {
        return next(new AppError('Portfolio item not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            likes: portfolioItem.likes
        }
    });
});

// --- Instant Wash Consumer Config ---
exports.getInstantWashConfig = catchAsync(async (req, res, next) => {
    const [services, plans, settings, passSetting] = await Promise.all([
        Service.find({ category: { $in: ['Cleaning', 'Doorstep', 'Wash', 'Express'] }, isActive: true }),
        SubscriptionPlan.find({ isActive: true, status: 'Live' }),
        Setting.find({ key: { $in: ['combo_discount_pct', 'multi_asset_discount_pct', 'studio_base_multiplier'] } }),
        Setting.findOne({ key: 'WASH_PASS_CONFIG' })
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
            settings: settingsMap,
            passConfig: passSetting?.value || passSetting?.metadata || { discount: 0.3, marketingLine: '30% OFF ON ALL SERVICES' }
        }
    });
});
