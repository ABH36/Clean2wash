const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    category: {
        type: String,
        required: true,
        enum: ['Exterior', 'Interior', 'Ceramic', 'PPF', 'Detailing']
    },
    title: {
        type: String,
        required: true
    },
    vehicle: {
        type: String,
        required: true
    },
    description: String,
    img: String, // Main image URL (if single image)
    beforeImg: String,
    afterImg: String,
    singleImage: {
        type: Boolean,
        default: false
    },
    likes: {
        type: Number,
        default: 0
    },
    plateClass: String, // CSS class for plate blurring (optional)
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

portfolioSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
portfolioSchema.index({ bookingId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
