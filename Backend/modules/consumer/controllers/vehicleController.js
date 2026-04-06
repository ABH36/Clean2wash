const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');
const VehicleModel = require('../../../models/VehicleModel');
const VehicleType = require('../../../models/VehicleType');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Get all vehicles for a consumer
exports.getMyVehicles = catchAsync(async (req, res, next) => {
    const vehicles = await Vehicle.find({
        owner: req.user.id,
        isActive: true
    }).sort({ isPrimary: -1, createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: {
            vehicles
        }
    });
});

// Get single vehicle
exports.getVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            vehicle
        }
    });
});

// Add new vehicle
exports.addVehicle = catchAsync(async (req, res, next) => {
    const { brand, model, type, color, plate, compliance, specifications } = req.body;

    // Validate required fields
    if (!brand || !model || !type || !color || !plate) {
        return next(new AppError('Please provide all required fields: brand, model, type, color, plate', 400));
    }

    // 🔍 Step 1: Catalog Check/Growth Protocol
    let modelRef = await VehicleModel.findOne({ brand: new RegExp(`^${brand}$`, 'i'), model: new RegExp(`^${model}$`, 'i') });
    
    if (!modelRef) {
        // Create a 'Pending' suggestion for the Admin to verify
        modelRef = await VehicleModel.create({
            brand,
            model,
            type, // User's initial classification
            status: 'Pending',
            userSuggested: true,
            suggestedBy: req.user.id,
            isActive: true,
            image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80' // Default placeholder
        });
        console.log(`[Elite Growth] New vehicle suggestion recorded: ${brand} ${model} (Pending Verification)`);
    }

    // 🔍 Step 2: Protocol Type Reference Resolution
    const vehicleTypeDoc = await VehicleType.findOne({ type: new RegExp(`^${type}$`, 'i'), isActive: true });

    // Create new vehicle
    const newVehicle = await Vehicle.create({
        owner: req.user.id,
        brand: modelRef.brand,
        model: modelRef.model,
        type: type, // Store the string for legacy
        typeRef: vehicleTypeDoc ? vehicleTypeDoc._id : null, // Store the reference for modern pricing
        color,
        plate: plate.toUpperCase(),
        compliance: compliance || {},
        specifications: specifications || {},
        isPrimary: false
    });

    // If this is the first vehicle, make it primary
    const vehicleCount = await Vehicle.countDocuments({ owner: req.user.id, isActive: true });
    if (vehicleCount === 1) {
        newVehicle.isPrimary = true;
        await newVehicle.save();

        // Update consumer's primary vehicle
        await User.findByIdAndUpdate(req.user.id, {
            primaryVehicle: newVehicle._id
        });
    }

    // Add vehicle to consumer's vehicles array
    await User.findByIdAndUpdate(req.user.id, {
        $push: { vehicles: newVehicle._id }
    });

    res.status(201).json({
        status: 'success',
        message: 'Vehicle added successfully',
        data: {
            vehicle: newVehicle
        }
    });
});

// Update vehicle
exports.updateVehicle = catchAsync(async (req, res, next) => {
    const { brand, model, type, color, plate, compliance, specifications } = req.body;

    // Find vehicle
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // If plate number is being updated, check for duplicates
    if (plate && plate !== vehicle.plate) {
        const existingVehicle = await Vehicle.findOne({
            plate: plate.toUpperCase(),
            _id: { $ne: req.params.id }
        });

        if (existingVehicle) {
            return next(new AppError('A vehicle with this plate number already exists', 400));
        }
    }

    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        {
            brand: brand || vehicle.brand,
            model: model || vehicle.model,
            type: type || vehicle.type,
            color: color || vehicle.color,
            plate: plate ? plate.toUpperCase() : vehicle.plate,
            compliance: compliance || vehicle.compliance,
            specifications: specifications || vehicle.specifications
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Vehicle updated successfully',
        data: {
            vehicle: updatedVehicle
        }
    });
});

// Delete vehicle (soft delete)
exports.deleteVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // Check if it's the primary vehicle
    if (vehicle.isPrimary) {
        return next(new AppError('Cannot delete primary vehicle. Please set another vehicle as primary first.', 400));
    }

    // Soft delete (set isActive to false)
    await Vehicle.findByIdAndUpdate(req.params.id, { isActive: false });

    // Remove from consumer's vehicles array
    await User.findByIdAndUpdate(req.user.id, {
        $pull: { vehicles: req.params.id }
    });

    res.status(200).json({
        status: 'success',
        message: 'Vehicle deleted successfully'
    });
});

// Set vehicle as primary
exports.setPrimaryVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // Unset primary status from all vehicles of this consumer
    await Vehicle.updateMany(
        { owner: req.user.id, isActive: true },
        { isPrimary: false }
    );

    // Set this vehicle as primary
    vehicle.isPrimary = true;
    await vehicle.save();

    // Update consumer's primary vehicle
    await User.findByIdAndUpdate(req.user.id, {
        primaryVehicle: vehicle._id
    });

    res.status(200).json({
        status: 'success',
        message: 'Vehicle set as primary successfully',
        data: {
            vehicle
        }
    });
});

// Get vehicle types with pricing multipliers
exports.getVehicleTypes = catchAsync(async (req, res, next) => {
    const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ sortOrder: 1 });

    // If no types in DB, provide minimal safety defaults
    if (vehicleTypes.length === 0) {
        const defaults = [
            { name: 'Hatch', type: 'Hatchback', multiplier: 1.0, image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80' },
            { name: 'Sedan', type: 'Sedan', multiplier: 1.2, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
            { name: 'SUV', type: 'SUV', multiplier: 1.5, image: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80' }
        ];
        return res.status(200).json({ status: 'success', data: { vehicleTypes: defaults } });
    }

    res.status(200).json({
        status: 'success',
        data: {
            vehicleTypes
        }
    });
});

// Fetch vehicle details from VAHAN (mock implementation)
exports.fetchFromVAHAN = catchAsync(async (req, res, next) => {
    const { plate } = req.body;

    if (!plate) {
        return next(new AppError('Vehicle plate number is required', 400));
    }

    // Mock VAHAN API response
    // In production, integrate with actual VAHAN API
    const mockVAHANData = {
        plate: plate.toUpperCase(),
        brand: 'Maruti',
        model: 'Dzire VXI',
        type: 'Sedan',
        fuelType: 'Petrol',
        transmission: 'Manual',
        year: 2022,
        insuranceExpiry: '2025-12-10',
        pucExpiry: '2024-09-15',
        registrationDate: '2022-03-15'
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.status(200).json({
        status: 'success',
        message: 'Vehicle details fetched from VAHAN',
        data: {
            vehicle: mockVAHANData
        }
    });
});

// Get vehicle compliance status
exports.getComplianceStatus = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    const insuranceStatus = vehicle.insuranceStatus;
    const pucStatus = vehicle.pucStatus;

    res.status(200).json({
        status: 'success',
        data: {
            vehicleId: vehicle._id,
            plate: vehicle.plate,
            insurance: insuranceStatus,
            puc: pucStatus,
            lastServiceDate: vehicle.compliance.lastServiceDate
        }
    });
});

// Get all unique brands from catalog
exports.getUniqueBrands = catchAsync(async (req, res, next) => {
    const brands = await VehicleModel.distinct('brand', { isActive: true });
    
    res.status(200).json({
        status: 'success',
        data: {
            brands: brands.sort()
        }
    });
});
