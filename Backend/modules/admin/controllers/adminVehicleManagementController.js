const CustomerVehicle = require('../../../models/CustomerVehicle');
const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');

// ─── PHASE 3: VEHICLE MANAGEMENT ─────────────────────────────────────

// Get All Customer Vehicles with Filters
exports.getAllVehicles = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        search,
        status,
        category,
        userId,
        isPrimary,
        isActive,
        needsRenewal,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    // Search by registration number, make, or model
    if (search) {
        query.$or = [
            { 'vehicleInfo.registrationNumber': { $regex: search, $options: 'i' } },
            { 'vehicleInfo.make': { $regex: search, $options: 'i' } },
            { 'vehicleInfo.model': { $regex: search, $options: 'i' } }
        ];
    }
    
    // Filters
    if (status) query.status = status;
    if (category) query['classification.category'] = category;
    if (userId) query.userId = userId;
    if (isPrimary !== undefined) query['flags.isPrimary'] = isPrimary === 'true';
    if (isActive !== undefined) query['flags.isActive'] = isActive === 'true';
    if (needsRenewal !== undefined) query['flags.needsDocumentRenewal'] = needsRenewal === 'true';
    
    const skip = (page - 1) * limit;
    
    // Dynamic sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const vehicles = await CustomerVehicle.find(query)
        .populate('userId', 'name email phone')
        .populate('classification.type', 'name category')
        .populate('verification.reviewedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await CustomerVehicle.countDocuments(query);
    
    res.status(200).json({
        status: 'success',
        data: {
            vehicles,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get Vehicle by ID
exports.getVehicleById = catchAsync(async (req, res) => {
    const vehicle = await CustomerVehicle.findById(req.params.id)
        .populate('userId', 'name email phone address')
        .populate('classification.type', 'name category')
        .populate('verification.reviewedBy', 'name email')
        .populate('serviceHistory.driverId', 'name driverId')
        .populate('serviceHistory.bookingId');
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    // Check booking eligibility
    const eligibility = vehicle.canBeUsedForBooking();
    
    // Check document renewal needs
    const renewalNeeds = vehicle.checkDocumentRenewal();
    
    res.status(200).json({
        status: 'success',
        data: {
            vehicle,
            eligibility,
            renewalNeeds
        }
    });
});

// Get Vehicles by User ID
exports.getVehiclesByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    
    const vehicles = await CustomerVehicle.find({ userId })
        .populate('classification.type', 'name category')
        .sort({ 'flags.isPrimary': -1, createdAt: -1 });
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: {
            vehicles
        }
    });
});

// Get Pending Vehicles (Awaiting Approval)
exports.getPendingVehicles = catchAsync(async (req, res) => {
    const vehicles = await CustomerVehicle.find({ status: 'PENDING' })
        .populate('userId', 'name email phone')
        .populate('classification.type', 'name category')
        .sort({ 'verification.submittedAt': 1 }); // Oldest first
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: {
            vehicles
        }
    });
});

// Approve Vehicle
exports.approveVehicle = catchAsync(async (req, res) => {
    const { verificationNotes, classification } = req.body;
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    // Update status
    vehicle.status = 'APPROVED';
    vehicle.verification.reviewedAt = new Date();
    vehicle.verification.approvedAt = new Date();
    vehicle.verification.reviewedBy = req.user._id;
    
    if (verificationNotes) {
        vehicle.verification.verificationNotes = verificationNotes;
    }
    
    // Update classification if provided
    if (classification) {
        if (classification.category) vehicle.classification.category = classification.category;
        if (classification.size) vehicle.classification.size = classification.size;
        if (classification.fuelType) vehicle.classification.fuelType = classification.fuelType;
        if (classification.type) vehicle.classification.type = classification.type;
    }
    
    // Mark documents as verified
    if (vehicle.documents.registrationCertificate?.url) {
        vehicle.documents.registrationCertificate.verified = true;
    }
    if (vehicle.documents.insurance?.url) {
        vehicle.documents.insurance.verified = true;
    }
    if (vehicle.documents.pollutionCertificate?.url) {
        vehicle.documents.pollutionCertificate.verified = true;
    }
    
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Vehicle approved successfully',
        data: {
            vehicle
        }
    });
});

// Reject Vehicle
exports.rejectVehicle = catchAsync(async (req, res) => {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
        return res.status(400).json({
            status: 'error',
            message: 'Rejection reason is required'
        });
    }
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    vehicle.status = 'REJECTED';
    vehicle.verification.reviewedAt = new Date();
    vehicle.verification.rejectedAt = new Date();
    vehicle.verification.reviewedBy = req.user._id;
    vehicle.verification.rejectionReason = rejectionReason;
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Vehicle rejected',
        data: {
            vehicle
        }
    });
});

// Update Vehicle Classification
exports.updateClassification = catchAsync(async (req, res) => {
    const { category, size, fuelType, type } = req.body;
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    if (category) vehicle.classification.category = category;
    if (size) vehicle.classification.size = size;
    if (fuelType) vehicle.classification.fuelType = fuelType;
    if (type) vehicle.classification.type = type;
    
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Vehicle classification updated',
        data: {
            vehicle
        }
    });
});

// Update Special Instructions
exports.updateSpecialInstructions = catchAsync(async (req, res) => {
    const { parkingInstructions, accessInstructions, handlingNotes, restrictions, preferences } = req.body;
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    if (parkingInstructions !== undefined) {
        vehicle.specialInstructions.parkingInstructions = parkingInstructions;
    }
    if (accessInstructions !== undefined) {
        vehicle.specialInstructions.accessInstructions = accessInstructions;
    }
    if (handlingNotes !== undefined) {
        vehicle.specialInstructions.handlingNotes = handlingNotes;
    }
    if (restrictions !== undefined) {
        vehicle.specialInstructions.restrictions = restrictions;
    }
    if (preferences !== undefined) {
        vehicle.specialInstructions.preferences = preferences;
    }
    
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Special instructions updated',
        data: {
            vehicle
        }
    });
});

// Update Admin Notes
exports.updateAdminNotes = catchAsync(async (req, res) => {
    const { adminNotes } = req.body;
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    vehicle.adminNotes = adminNotes;
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Admin notes updated',
        data: {
            vehicle
        }
    });
});

// Update Vehicle Status (Active/Inactive/Suspended)
exports.updateVehicleStatus = catchAsync(async (req, res) => {
    const { status, isActive } = req.body;
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    if (status && ['APPROVED', 'SUSPENDED'].includes(status)) {
        vehicle.status = status;
    }
    
    if (isActive !== undefined) {
        vehicle.flags.isActive = isActive;
    }
    
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Vehicle status updated',
        data: {
            vehicle
        }
    });
});

// Report Vehicle Issue
exports.reportIssue = catchAsync(async (req, res) => {
    const { issue, severity = 'MEDIUM' } = req.body;
    
    if (!issue) {
        return res.status(400).json({
            status: 'error',
            message: 'Issue description is required'
        });
    }
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    vehicle.reportIssue(issue, severity);
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Issue reported successfully',
        data: {
            vehicle
        }
    });
});

// Resolve Vehicle Issue
exports.resolveIssue = catchAsync(async (req, res) => {
    const { issueId } = req.body;
    
    if (!issueId) {
        return res.status(400).json({
            status: 'error',
            message: 'Issue ID is required'
        });
    }
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    vehicle.resolveIssue(issueId);
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Issue resolved successfully',
        data: {
            vehicle
        }
    });
});

// Get Vehicles Needing Document Renewal
exports.getVehiclesNeedingRenewal = catchAsync(async (req, res) => {
    const vehicles = await CustomerVehicle.find({
        'flags.needsDocumentRenewal': true,
        'flags.isActive': true
    })
        .populate('userId', 'name email phone')
        .sort({ 'documents.insurance.expiryDate': 1 });
    
    const vehiclesWithDetails = vehicles.map(vehicle => {
        const renewalNeeds = vehicle.checkDocumentRenewal();
        return {
            vehicle,
            renewalNeeds
        };
    });
    
    res.status(200).json({
        status: 'success',
        results: vehiclesWithDetails.length,
        data: {
            vehicles: vehiclesWithDetails
        }
    });
});

// Get Vehicle Statistics
exports.getVehicleStatistics = catchAsync(async (req, res) => {
    const stats = await CustomerVehicle.aggregate([
        {
            $facet: {
                statusBreakdown: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                categoryBreakdown: [
                    { $group: { _id: '$classification.category', count: { $sum: 1 } } }
                ],
                totalVehicles: [
                    { $count: 'count' }
                ],
                activeVehicles: [
                    { $match: { 'flags.isActive': true } },
                    { $count: 'count' }
                ],
                pendingApproval: [
                    { $match: { status: 'PENDING' } },
                    { $count: 'count' }
                ],
                needingRenewal: [
                    { $match: { 'flags.needsDocumentRenewal': true } },
                    { $count: 'count' }
                ],
                luxuryVehicles: [
                    { $match: { 'flags.isLuxury': true } },
                    { $count: 'count' }
                ]
            }
        }
    ]);
    
    res.status(200).json({
        status: 'success',
        data: {
            statistics: stats[0]
        }
    });
});

// Bulk Approve Vehicles
exports.bulkApprove = catchAsync(async (req, res) => {
    const { vehicleIds, verificationNotes } = req.body;
    
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Vehicle IDs array is required'
        });
    }
    
    const result = await CustomerVehicle.updateMany(
        { _id: { $in: vehicleIds }, status: 'PENDING' },
        {
            $set: {
                status: 'APPROVED',
                'verification.reviewedAt': new Date(),
                'verification.approvedAt': new Date(),
                'verification.reviewedBy': req.user._id,
                'verification.verificationNotes': verificationNotes || '',
                'documents.registrationCertificate.verified': true,
                'documents.insurance.verified': true,
                'documents.pollutionCertificate.verified': true,
                'metadata.lastUpdatedBy': req.user._id
            }
        }
    );
    
    res.status(200).json({
        status: 'success',
        message: `${result.modifiedCount} vehicles approved successfully`,
        data: {
            modifiedCount: result.modifiedCount
        }
    });
});

// Delete Vehicle (Soft Delete - Set Inactive)
exports.deleteVehicle = catchAsync(async (req, res) => {
    const vehicle = await CustomerVehicle.findById(req.params.id);
    
    if (!vehicle) {
        return res.status(404).json({
            status: 'error',
            message: 'Vehicle not found'
        });
    }
    
    vehicle.flags.isActive = false;
    vehicle.metadata.lastUpdatedBy = req.user._id;
    
    await vehicle.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Vehicle deactivated successfully'
    });
});
