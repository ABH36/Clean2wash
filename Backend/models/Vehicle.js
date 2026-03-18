const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vehicle must belong to a user']
    },
    brand: {
        type: String,
        required: [true, 'Vehicle brand is required'],
        trim: true,
        enum: {
            values: ['Honda', 'Maruti', 'Hyundai', 'Toyota', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes', 'Audi', 'Skoda', 'Volkswagen', 'Nissan', 'Renault', 'MG', 'Jeep', 'Land Rover', 'Jaguar', 'Volvo', 'Porsche', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls Royce', 'Others'],
            message: 'Please select a valid vehicle brand'
        }
    },
    model: {
        type: String,
        required: [true, 'Vehicle model is required'],
        trim: true,
        maxlength: [50, 'Model name cannot exceed 50 characters']
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
        },
        default: 'Sedan'
    },
    color: {
        type: String,
        required: [true, 'Vehicle color is required'],
        trim: true
    },
    plate: {
        type: String,
        required: [true, 'Vehicle plate number is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/, 'Please provide a valid vehicle registration number']
    },
    image: {
        type: String,
        default: function () {
            const typeImages = {
                'Hatchback': 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
                'Sedan': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
                'SUV': 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
                'MUV': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
                'Compact SUV': 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
                'MPV': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
                'Pickup': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
                'Luxury Sedan': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'Luxury SUV': 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
                'Coupe': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'Convertible': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'Sports Car': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'Supercar': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'EV': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80',
                'Mini Truck': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
                'Truck': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
                'Van': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
                'Bus': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80',
                'Traveler': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
                'Tractor': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
                'Vintage': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
                'Bike': 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&q=80',
                'Scooter': 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=400&q=80',
                'Superbike': 'https://images.unsplash.com/photo-1571068316344-75bf43f5f9c2?w=400&q=80',
                // Legacy support
                'Luxury': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80'
            };
            return typeImages[this.type] || typeImages['Sedan'];
        }
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    compliance: {
        insuranceExpiry: {
            type: Date,
            required: false
        },
        pucExpiry: {
            type: Date,
            required: false
        },
        lastServiceDate: Date
    },
    specifications: {
        fuelType: {
            type: String,
            enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
            default: 'Petrol'
        },
        transmission: {
            type: String,
            enum: ['Manual', 'Automatic', 'CVT', 'DCT'],
            default: 'Manual'
        },
        year: {
            type: Number,
            min: [1900, 'Year cannot be before 1900'],
            max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
vehicleSchema.index({ owner: 1 });
// vehicleSchema.index({ plate: 1 });
vehicleSchema.index({ brand: 1, model: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ isActive: 1 });

// Virtual for insurance status
vehicleSchema.virtual('insuranceStatus').get(function () {
    if (!this.compliance.insuranceExpiry) return null;

    const now = new Date();
    const expiryDate = new Date(this.compliance.insuranceExpiry);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
        return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
    } else if (daysUntilExpiry <= 30) {
        return { status: 'expiring', days: daysUntilExpiry, color: 'orange' };
    } else {
        return { status: 'valid', days: daysUntilExpiry, color: 'green' };
    }
});

// Virtual for PUC status
vehicleSchema.virtual('pucStatus').get(function () {
    if (!this.compliance.pucExpiry) return null;

    const now = new Date();
    const expiryDate = new Date(this.compliance.pucExpiry);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
        return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
    } else if (daysUntilExpiry <= 30) {
        return { status: 'expiring', days: daysUntilExpiry, color: 'orange' };
    } else {
        return { status: 'valid', days: daysUntilExpiry, color: 'green' };
    }
});

// Pre-save middleware to ensure only one primary vehicle per owner
vehicleSchema.pre('save', async function () {
    if (!this.isModified('isPrimary') || !this.isPrimary) return;

    // Unset primary status from other vehicles of the same owner
    await this.constructor.updateMany(
        { owner: this.owner, _id: { $ne: this._id }, isPrimary: true },
        { isPrimary: false }
    );
});

// Static method to get vehicle type multiplier for pricing
vehicleSchema.statics.getTypeMultiplier = function (type) {
    const multipliers = {
        'Hatchback': 1.0,
        'Sedan': 1.2,
        'SUV': 1.5,
        'MUV': 1.4,
        'Compact SUV': 1.4,
        'MPV': 1.4,
        'Pickup': 1.6,
        'Luxury Sedan': 2.0,
        'Luxury SUV': 2.2,
        'Coupe': 1.8,
        'Convertible': 2.0,
        'Sports Car': 2.5,
        'Supercar': 3.0,
        'EV': 1.2,
        'Mini Truck': 1.8,
        'Truck': 2.5,
        'Van': 1.8,
        'Bus': 2.5,
        'Traveler': 1.8,
        'Tractor': 2.0,
        'Vintage': 2.5,
        'Bike': 0.6,
        'Scooter': 0.5,
        'Superbike': 0.9,
        // Legacy support
        'Luxury': 2.0
    };
    return multipliers[type] || 1.0;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
