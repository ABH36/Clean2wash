const mongoose = require('mongoose');

const vehicleModelSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: [true, 'Brand name is required'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Model name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        enum: [
            'Hatchback', 'Sedan', 'SUV', 'MUV', 'Compact SUV', 'MPV', 'Pickup',
            'Luxury Sedan', 'Luxury SUV', 'Coupe', 'Convertible', 'Sports Car', 'Supercar',
            'EV', 'Mini Truck', 'Truck', 'Van', 'Bus', 'Traveler', 'Tractor', 'Vintage',
            'Bike', 'Scooter', 'Superbike'
        ]
    },
    image: {
        type: String,
        required: [true, 'Vehicle model image is required']
    },
    basePrice: {
        type: Number,
        default: 0
    },
    sessionTime: {
        type: Number, // In minutes
        default: 45
    },
    offers: [{
        title: String,
        description: String,
        discountPercentage: Number
    }],
    coupons: [String],
    detailedCoverage: {
        exteriorCeramic: { type: Boolean, default: true },
        interiorDeepClean: { type: Boolean, default: true },
        tyrePolish: { type: Boolean, default: true },
        leatherConditioning: { type: Boolean, default: false },
        glassWipe: { type: Boolean, default: true },
        engineBayWash: { type: Boolean, default: false },
        microfiberDrying: { type: Boolean, default: true },
        dashboardPolish: { type: Boolean, default: true }
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    baseDuration: {
        type: Number,
        default: 45 // in minutes
    },
    isActive: {
        type: Boolean,
        default: true
    },
    features: [String],
    faqs: [
        {
            question: String,
            answer: String
        }
    ],
    protocolSteps: [String]
}, {
    timestamps: true
});

// Compound index to ensure uniqueness of Brand + Model
vehicleModelSchema.index({ brand: 1, model: 1 }, { unique: true });
vehicleModelSchema.index({ type: 1 });
vehicleModelSchema.index({ isActive: 1 });

const VehicleModel = mongoose.model('VehicleModel', vehicleModelSchema);

module.exports = VehicleModel;
