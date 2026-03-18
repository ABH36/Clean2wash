const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vehicle name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        enum: {
            values: [
                'Hatchback', 'Sedan', 'SUV', 'MUV', 'Compact SUV', 'MPV', 'Pickup',
                'Luxury Sedan', 'Luxury SUV', 'Coupe', 'Convertible', 'Sports Car', 'Supercar',
                'EV', 'Mini Truck', 'Truck', 'Van', 'Bus', 'Traveler', 'Tractor', 'Vintage',
                'Bike', 'Scooter', 'Superbike'
            ],
            message: 'Please select a valid vehicle type'
        }
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: 0,
        default: 0
    },
    multiplier: {
        type: Number,
        required: [true, 'Price multiplier is required'],
        default: 1.0
    },
    image: {
        type: String,
        required: [true, 'Vehicle image URL is required']
    },
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

// Index for performance
vehicleTypeSchema.index({ isActive: 1, sortOrder: 1 });
vehicleTypeSchema.index({ type: 1 });

const VehicleType = mongoose.model('VehicleType', vehicleTypeSchema);

module.exports = VehicleType;
