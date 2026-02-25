const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Electronics', 'Accessories', 'Cleaning', 'Interior', 'Exterior']
    },
    price: {
        type: Number,
        required: [true, 'Please add a base price']
    },
    salePrice: {
        type: Number,
        required: [true, 'Please add a sale price']
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    badge: {
        type: String,
        default: null
    },
    inStock: {
        type: Boolean,
        default: true
    },
    description: String,
    rating: {
        type: Number,
        default: 4.5
    },
    reviews: {
        type: Number,
        default: 0
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
