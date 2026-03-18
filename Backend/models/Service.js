const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['Doorstep', 'Studio', 'Add-ons', 'Cleaning', 'Detailing', 'Protection', 'Maintenance', 'Enhancement', 'Express'],
        default: 'Cleaning'
    },
    type: {
        type: String,
        enum: ['Standard', 'Premium', 'Elite', 'Waterless', 'Steam', 'Chemical', 'Pro', 'Wash'],
        default: 'Standard'
    },
    price: {
        type: Number,
        required: [true, 'Service price is required'],
        min: 0
    },
    time: {
        type: String,  // e.g. "30m", "1h 30m"
        required: [true, 'Service duration is required']
    },
    status: {
        type: String,
        enum: ['Live', 'Featured', 'Paused', 'Draft'],
        default: 'Live'
    },
    color: {
        type: String,
        default: 'bg-brand'
    },
    description: {
        type: String,
        default: ''
    },
    subscriptionOffer: {
        enabled: { type: Boolean, default: false },
        washCount: { type: Number, default: 10 },
        freeWashes: { type: Number, default: 1 },
        label: { type: String, default: '' }
    },
    plans: [
        {
            label: String,     // e.g. "4 Times/Month"
            perWash: Number,   // price per wash in plan
            total: Number      // total plan price
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    detailedCoverage: [String],
    inclusions: [
        {
            id: { type: String, default: () => 'inc_' + Math.random().toString(36).substr(2, 9) },
            name: { type: String, required: true },
            price: { type: Number, default: 0 },
            icon: { type: String, default: 'Plus' },
            isRecommended: { type: Boolean, default: false }
        }
    ],
    exclusions: [String],
    adminNote: {
        type: String,
        default: ''
    },
    startingPrice: {
        type: Number,
        default: 0
    },
    multiplierEnabled: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 4.9
    },
    bannerImage: {
        type: String,
        default: ''
    },
    tag: {
        type: String,
        default: ''
    },
    features: [
        {
            icon: { type: String, default: 'CheckCircle2' },
            text: { type: String, required: true }
        }
    ],
    faqs: [
        {
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }
    ],
    protocolSteps: [String],
    offers: [
        {
            text: String,
            code: String,
            color: { type: String, default: 'brand' }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
