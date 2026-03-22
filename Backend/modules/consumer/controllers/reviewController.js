const Review = require('../../../models/Review');
const ProductOrder = require('../../../models/ProductOrder');
const Product = require('../../../models/Product');
const auditHelper = require('../../../utils/auditHelper');
const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');

/**
 * @desc    Submit a review for a product
 * @route   POST /api/consumer/products/:orderId/items/:productId/review
 */
exports.submitProductReview = catchAsync(async (req, res, next) => {
    const { rating, comment, images } = req.body;
    const { orderId, productId } = req.params;

    // 1. Verify the order exists and belongs to the user
    const order = await ProductOrder.findOne({
        _id: orderId,
        consumer: req.user.id,
        status: { $in: ['delivered', 'partially_delivered'] }
    });

    if (!order) {
        return next(new AppError('Order not found or not delivered yet.', 404));
    }

    // 2. Verify the product is part of that order
    const item = order.items.find(i => i.product.toString() === productId);
    if (!item) {
        return next(new AppError('Product not found in this order.', 404));
    }

    // 3. Create the review (Unified Schema)
    const newReview = await Review.create({
        user: req.user.id,
        refId: orderId,
        refModel: 'ProductOrder',
        targetId: productId,
        targetModel: 'Product',
        rating,
        comment,
        images,
        isVerifiedPurchase: true
    });

    // Audit Log
    await auditHelper.logAction({
        userId: req.user.id,
        action: 'PRODUCT_REVIEW_SUBMITTED',
        resource: 'Review',
        resourceId: newReview._id,
        newValue: newReview,
        req
    });

    res.status(201).json({
        status: 'success',
        data: { review: newReview }
    });
});

/**
 * @desc    Submit a review for a booking (Service)
 * @route   POST /api/consumer/bookings/:bookingId/review
 */
exports.submitBookingReview = catchAsync(async (req, res, next) => {
    const { rating, comment, images } = req.body;
    const { bookingId } = req.params;

    // 1. Verify the booking exists and belongs to the user
    const Booking = require('../../../models/Booking');
    const booking = await Booking.findOne({
        _id: bookingId,
        consumer: req.user.id,
        status: 'completed'
    });

    if (!booking) {
        return next(new AppError('Booking not found or not completed yet.', 404));
    }

    // 2. Determine provider details
    const providerId = booking.provider?.id;
    const providerModel = booking.provider?.model;

    // 3. Create the review (Unified Schema)
    const newReview = await Review.create({
        user: req.user.id,
        refId: bookingId,
        refModel: 'Booking',
        targetId: bookingId, // Link to booking itself or service ID
        targetModel: 'Booking', // For now, we rate the booking experience
        providerId,
        providerModel,
        rating,
        comment,
        images,
        isVerifiedPurchase: true
    });

    // Also update the legacy feedback field in Booking for backward compatibility
    booking.feedback = {
        rating,
        review: comment,
        photos: images,
        submittedAt: new Date()
    };
    await booking.save();

    // Audit Log
    await auditHelper.logAction({
        userId: req.user.id,
        action: 'BOOKING_REVIEW_SUBMITTED',
        resource: 'Review',
        resourceId: newReview._id,
        newValue: newReview,
        req
    });

    res.status(201).json({
        status: 'success',
        data: { review: newReview }
    });
});

/**
 * @desc    Get reviews for a product
 * @route   GET /api/consumer/products/:productId/reviews
 */
exports.getProductReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ targetId: req.params.productId })
        .populate('user', 'name profile.avatar')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: { reviews }
    });
});

/**
 * @desc    Get reviews for a provider (Captain or Vendor)
 * @route   GET /api/consumer/providers/:providerId/reviews
 */
exports.getProviderReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ providerId: req.params.providerId })
        .populate('user', 'name profile.avatar')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: { reviews }
    });
});
