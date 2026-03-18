const Vehicle = require('../../../models/Vehicle');
const User = require('../../../models/User');

// Get all vehicles for a consumer
exports.getMyVehicles = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Error in getMyVehicles:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get vehicles. Please try again.'
        });
    }
};

// Get single vehicle
exports.getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                vehicle
            }
        });

    } catch (error) {
        console.error('Error in getVehicle:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get vehicle. Please try again.'
        });
    }
};

// Add new vehicle
exports.addVehicle = async (req, res) => {
    try {
        const { brand, model, type, color, plate, compliance, specifications } = req.body;

        // Validate required fields
        if (!brand || !model || !type || !color || !plate) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide all required fields: brand, model, type, color, plate'
            });
        }

        // Check if plate number already exists
        const existingVehicle = await Vehicle.findOne({ plate: plate.toUpperCase() });
        if (existingVehicle) {
            return res.status(400).json({
                status: 'fail',
                message: 'A vehicle with this plate number already exists'
            });
        }

        // Create new vehicle
        const newVehicle = await Vehicle.create({
            owner: req.user.id,
            brand,
            model,
            type,
            color,
            plate: plate.toUpperCase(),
            compliance: compliance || {},
            specifications: specifications || {},
            isPrimary: false // Will be set to primary if it's the first vehicle
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

    } catch (error) {
        console.error('Error in addVehicle:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'fail',
                message: 'A vehicle with this plate number already exists'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to add vehicle. Please try again.'
        });
    }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
    try {
        const { brand, model, type, color, plate, compliance, specifications } = req.body;

        // Find vehicle
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found'
            });
        }

        // If plate number is being updated, check for duplicates
        if (plate && plate !== vehicle.plate) {
            const existingVehicle = await Vehicle.findOne({
                plate: plate.toUpperCase(),
                _id: { $ne: req.params.id }
            });

            if (existingVehicle) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'A vehicle with this plate number already exists'
                });
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

    } catch (error) {
        console.error('Error in updateVehicle:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to update vehicle. Please try again.'
        });
    }
};

// Delete vehicle (soft delete)
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found'
            });
        }

        // Check if it's the primary vehicle
        if (vehicle.isPrimary) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot delete primary vehicle. Please set another vehicle as primary first.'
            });
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

    } catch (error) {
        console.error('Error in deleteVehicle:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete vehicle. Please try again.'
        });
    }
};

// Set vehicle as primary
exports.setPrimaryVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found'
            });
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

    } catch (error) {
        console.error('Error in setPrimaryVehicle:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to set primary vehicle. Please try again.'
        });
    }
};

const VehicleType = require('../../../models/VehicleType');

// Get vehicle types with pricing multipliers
exports.getVehicleTypes = async (req, res) => {
    try {
        const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ sortOrder: 1 });

        // If no types in DB, provide basic defaults (safety net)
        if (vehicleTypes.length === 0) {
            const defaults = [
                { id: 'hatchback', name: 'Hatch', type: 'Hatchback', multiplier: 1.0, image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80' },
                { id: 'sedan', name: 'Sedan', type: 'Sedan', multiplier: 1.2, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
                { id: 'suv', name: 'SUV', type: 'SUV', multiplier: 1.5, image: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80' },
                { id: 'muv', name: 'MUV', type: 'MUV', multiplier: 1.4, image: 'https://images.unsplash.com/photo-1594731802111-07ee4940d995?w=400&q=80' },
                { id: 'compact suv', name: 'Compact SUV', type: 'Compact SUV', multiplier: 1.4, image: 'https://images.unsplash.com/photo-1517524008410-b44336d29a0c?w=400&q=80' },
                { id: 'luxury sedan', name: 'Luxury Sedan', type: 'Luxury Sedan', multiplier: 2.0, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80' },
                { id: 'luxury suv', name: 'Luxury SUV', type: 'Luxury SUV', multiplier: 2.2, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80' },
                { id: 'coupe', name: 'Coupe', type: 'Coupe', multiplier: 1.8, image: 'https://images.unsplash.com/photo-1502877338535-766e145cca6c?w=400&q=80' },
                { id: 'convertible', name: 'Convertible', type: 'Convertible', multiplier: 2.0, image: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80' },
                { id: 'sports car', name: 'Sports Car', type: 'Sports Car', multiplier: 2.5, image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80' },
                { id: 'supercar', name: 'Super Car', type: 'Supercar', multiplier: 3.0, image: 'https://images.unsplash.com/photo-1525609002952-7621bfea801d?w=400&q=80' },
                { id: 'ev', name: 'EV', type: 'EV', multiplier: 1.2, image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80' },
                { id: 'mini truck', name: 'Mini Truck', type: 'Mini Truck', multiplier: 1.8, image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&q=80' },
                { id: 'truck', name: 'Truck', type: 'Truck', multiplier: 2.5, image: 'https://images.unsplash.com/photo-1586191582056-a15cd11ec618?w=400&q=80' },
                { id: 'van', name: 'Van', type: 'Van', multiplier: 1.8, image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&q=80' },
                { id: 'tractor', name: 'Tractor', type: 'Tractor', multiplier: 2.0, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80' },
                { id: 'vintage', name: 'Vintage', type: 'Vintage', multiplier: 2.5, image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80' },
                { id: 'bike', name: 'Bike', type: 'Bike', multiplier: 0.6, image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&q=80' },
                { id: 'scooter', name: 'Scooter', type: 'Scooter', multiplier: 0.5, image: 'https://images.unsplash.com/photo-1449495940867-33d54ed0ec84?w=400&q=80' },
                { id: 'superbike', name: 'Super Bike', type: 'Superbike', multiplier: 0.9, image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80' },
                { id: 'luxury', name: 'Luxury', type: 'Luxury', multiplier: 2.0, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80' }
            ];
            return res.status(200).json({ status: 'success', data: { vehicleTypes: defaults } });
        }

        res.status(200).json({
            status: 'success',
            data: {
                vehicleTypes
            }
        });

    } catch (error) {
        console.error('Error in getVehicleTypes:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get vehicle types. Please try again.'
        });
    }
};

// Fetch vehicle details from VAHAN (mock implementation)
exports.fetchFromVAHAN = async (req, res) => {
    try {
        const { plate } = req.body;

        if (!plate) {
            return res.status(400).json({
                status: 'fail',
                message: 'Vehicle plate number is required'
            });
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

    } catch (error) {
        console.error('Error in fetchFromVAHAN:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch vehicle details from VAHAN. Please try again.'
        });
    }
};

// Get vehicle compliance status
exports.getComplianceStatus = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found'
            });
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

    } catch (error) {
        console.error('Error in getComplianceStatus:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get compliance status. Please try again.'
        });
    }
};
