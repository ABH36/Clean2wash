const Vehicle = require('../models/Vehicle');
const Consumer = require('../models/Consumer');

// Get all vehicles for a consumer
exports.getMyVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ 
            owner: req.consumer.id,
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
            owner: req.consumer.id,
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
            owner: req.consumer.id,
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
        const vehicleCount = await Vehicle.countDocuments({ owner: req.consumer.id, isActive: true });
        if (vehicleCount === 1) {
            newVehicle.isPrimary = true;
            await newVehicle.save();
            
            // Update consumer's primary vehicle
            await Consumer.findByIdAndUpdate(req.consumer.id, {
                primaryVehicle: newVehicle._id
            });
        }

        // Add vehicle to consumer's vehicles array
        await Consumer.findByIdAndUpdate(req.consumer.id, {
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
            owner: req.consumer.id,
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
            owner: req.consumer.id,
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
        await Consumer.findByIdAndUpdate(req.consumer.id, {
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
            owner: req.consumer.id,
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
            { owner: req.consumer.id, isActive: true },
            { isPrimary: false }
        );

        // Set this vehicle as primary
        vehicle.isPrimary = true;
        await vehicle.save();

        // Update consumer's primary vehicle
        await Consumer.findByIdAndUpdate(req.consumer.id, {
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

// Get vehicle types with pricing multipliers
exports.getVehicleTypes = async (req, res) => {
    try {
        const vehicleTypes = [
            { id: 'hatchback', label: 'Hatch', multiplier: 1.0 },
            { id: 'sedan', label: 'Sedan', multiplier: 1.2 },
            { id: 'suv', label: 'SUV', multiplier: 1.5 },
            { id: 'luxury', label: 'Luxury', multiplier: 2.0 },
            { id: 'muv', label: 'MUV', multiplier: 1.4 },
            { id: 'bike', label: 'Bike', multiplier: 0.6 },
            { id: 'scooter', label: 'Scooter', multiplier: 0.5 },
            { id: 'superbike', label: 'Super Bike', multiplier: 0.9 }
        ];

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
            owner: req.consumer.id,
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
