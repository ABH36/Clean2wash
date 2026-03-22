const Product = require('../../../models/Product');
const Promotion = require('../../../models/Promotion');
const MasterData = require('../../../models/MasterData');
const Setting = require('../../../models/Setting');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * @desc    Get all approved products with optional filtering
 * @route   GET /api/consumer/products
 * @access  Public
 */
exports.getProducts = catchAsync(async (req, res, next) => {
    const { category, search, sort } = req.query;
    let query = { status: 'Approved' };

    // Category filter (Case-insensitive)
    if (category && category !== 'All') {
        query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    // Search filter
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    let productsQuery = Product.find(query);

    // Sorting
    if (sort === 'price_low') {
        productsQuery = productsQuery.sort('salePrice');
    } else if (sort === 'price_high') {
        productsQuery = productsQuery.sort('-salePrice');
    } else if (sort === 'rating') {
        productsQuery = productsQuery.sort('-rating');
    } else {
        productsQuery = productsQuery.sort('-createdAt');
    }

    const products = await productsQuery;

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products
        }
    });
});

/**
 * @desc    Get single product details
 * @route   GET /api/consumer/products/:id
 * @access  Public
 */
exports.getProductDetails = catchAsync(async (req, res, next) => {
    const product = await Product.findOne({
        _id: req.params.id,
        status: 'Approved'
    }).populate('vendor', 'profile.studioName profile.city');

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    });
});

/**
 * @desc    Get E-Shop metadata (banners, categories, settings)
 * @route   GET /api/consumer/eshop/metadata
 * @access  Public
 */
exports.getEshopMetadata = catchAsync(async (req, res, next) => {
    // 1. Fetch Categories (MasterData type: CATEGORY, metadata.portal: eshop)
    const dbCategories = await MasterData.find({
        type: 'CATEGORY',
        isActive: true,
        'metadata.portal': 'eshop'
    }).sort({ sortOrder: 1 });

    const categories = dbCategories.map(doc => ({
        title: doc.title,
        key: doc.key,
        image: doc.iconUrl || doc.bannerUrl
    }));

    // 2. Fetch Banners (Promotion type: Banners, status: Active, metadata.portal: eshop)
    const dbBanners = await Promotion.find({
        type: 'Banners',
        status: 'Active',
        isActive: true,
        'metadata.portal': 'eshop'
    }).sort({ createdAt: -1 });

    const banners = dbBanners.map(doc => ({
        id: doc._id,
        title: doc.title,
        subtitle: doc.subtitle,
        image: doc.image,
        cta: doc.cta || 'Shop Now',
        path: doc.path || '/e-shop',
        theme: doc.theme || 'light'
    }));

    // 3. Fetch E-Shop Settings (Newsletter, YouTube, etc.)
    const eshopSettings = await Setting.findOne({ key: 'eshop_config' });

    res.status(200).json({
        status: 'success',
        data: {
            categories: categories.length > 0 ? categories : undefined,
            banners: banners.length > 0 ? banners : undefined,
            settings: eshopSettings ? eshopSettings.value : undefined
        }
    });
});
