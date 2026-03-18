const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'A product must have a price']
    },
    salePrice: {
        type: Number,
        required: [true, 'A product must have a sale price']
    },
    category: {
        type: String,
        required: [true, 'A product must have a category'],
        enum: ['Electronics', 'Accessories', 'Cleaning', 'Enhancement']
    },
    stock: {
        type: Number,
        required: [true, 'A product must have stock quantity'],
        default: 0
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80'
    },
    video: String,
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    badge: {
        type: String,
        enum: ['', 'Bestseller', 'Top Rated', 'Popular', 'New', 'Sale', 'Own Brand']
    },
    isPriority: {
        type: Boolean,
        default: false
    },
    isOwnBrand: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A product must belong to a vendor']
    },
    specifications: [{
        key: String,
        value: String
    }]
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
