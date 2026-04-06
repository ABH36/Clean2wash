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
        trim: true
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
        trim: true,
        default: 'Sedan'
    },
    typeRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleType'
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
        default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
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

// Pre-save middleware: Link typeRef and ensure only one primary vehicle per owner
vehicleSchema.pre('save', async function () {
    // 1. Link typeRef if missing
    if (!this.typeRef && this.type) {
        const VehicleType = mongoose.model('VehicleType');
        const vType = await VehicleType.findOne({
            $or: [
                { type: this.type },
                { name: this.type }
            ]
        });
        if (vType) this.typeRef = vType._id;
    }

    // 2. Handle primary status
    if (this.isModified('isPrimary') && this.isPrimary) {
        // Unset primary status from other vehicles of the same owner
        await this.constructor.updateMany(
            { owner: this.owner, _id: { $ne: this._id }, isPrimary: true },
            { isPrimary: false }
        );
    }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
