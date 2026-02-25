const ErrorResponse = require('../../utils/errorResponse');
const Product = require('../../models/Product');
const Order = require('../../models/Order');

// @desc    Get all products
// @route   GET /api/v1/consumer/shop/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Place a shop order
// @route   POST /api/v1/consumer/shop/orders
// @access  Private
exports.placeOrder = async (req, res, next) => {
    try {
        req.body.consumer = req.user.id;

        // In real app, we would validate availability and prices from DB
        const order = await Order.create(req.body);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get my orders
// @route   GET /api/v1/consumer/shop/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ consumer: req.user.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (err) {
        next(err);
    }
};
