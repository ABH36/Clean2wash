const mongoose = require('mongoose');

const customerVehicleSchema = new mongoose.Schema({
    // Owner Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    
    // Vehicle Details
    vehicleInfo: {
        make: {
            type: String,
            required: [true, 'Vehicle make is required'],
            trim: true
        },
        model: {
            type: String,
            required: [true, 'Vehicle model is required'],
            trim: true
        },
        year: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear() + 1
        },
        color: {
            type: String,
            trim: true
        },
        registrationNumber: {
            type: String,
            required: [true, 'Registration number is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        vin: {
            type: String,
            uppercase: true,
            trim: true,
            sparse: true
        }
    },
    
    // Vehicle Classification
    classification: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VehicleType'
        },
        category: {
            type: String,
            enum: ['SEDAN', 'SUV', 'HATCHBACK', 'LUXURY', 'SPORTS', 'TRUCK', 'VAN', 'OTHER'],
            default: 'SEDAN'
        },
        size: {
            type: String,
            enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
            default: 'MEDIUM'
        },
        fuelType: {
            type: String,
            enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'],
            default: 'PETROL'
        }
    },
    
    // Approval Status
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING'
    },
    
    // Verification Details
    verification: {
        submittedAt: {
            type: Date,
            default: Date.now
        },
        reviewedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectedAt: Date,
        rejectionReason: {
            type: String,
            trim: true
        },
        verificationNotes: {
            type: String,
            trim: true
        }
    },
    
    // Documents
    documents: {
        registrationCertificate: {
            url: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        insurance: {
            url: String,
            uploadedAt: Date,
            expiryDate: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        pollutionCertificate: {
            url: String,
            uploadedAt: Date,
            expiryDate: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        photos: [{
            url: String,
            type: {
                type: String,
                enum: ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'INTERIOR', 'OTHER']
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Special Instructions & Notes
    specialInstructions: {
        parkingInstructions: {
            type: String,
            trim: true
        },
        accessInstructions: {
            type: String,
            trim: true
        },
        handlingNotes: {
            type: String,
            trim: true
        },
        restrictions: [{
            type: String,
            trim: true
        }],
        preferences: [{
            type: String,
            trim: true
        }]
    },
    
    // Admin Notes (Internal)
    adminNotes: {
        type: String,
        trim: true
    },
    
    // Service History
    serviceHistory: [{
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        serviceType: String,
        serviceDate: Date,
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SpareDriver'
        },
        notes: String,
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    
    // Vehicle Condition
    condition: {
        overallCondition: {
            type: String,
            enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
            default: 'GOOD'
        },
        lastInspectionDate: Date,
        inspectionNotes: String,
        knownIssues: [{
            issue: String,
            reportedAt: {
                type: Date,
                default: Date.now
            },
            severity: {
                type: String,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            resolved: {
                type: Boolean,
                default: false
            }
        }]
    },
    
    // Usage Statistics
    statistics: {
        totalBookings: {
            type: Number,
            default: 0
        },
        totalServiceHours: {
            type: Number,
            default: 0
        },
        lastServiceDate: Date,
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        }
    },
    
    // Flags
    flags: {
        isPrimary: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        requiresSpecialHandling: {
            type: Boolean,
            default: false
        },
        isLuxury: {
            type: Boolean,
            default: false
        },
        needsDocumentRenewal: {
            type: Boolean,
            default: false
        }
    },
    
    // Metadata
    metadata: {
        source: {
            type: String,
            enum: ['USER_APP', 'ADMIN_PANEL', 'IMPORT'],
            default: 'USER_APP'
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        tags: [String]
    }
}, {
    timestamps: true
});

// Indexes
customerVehicleSchema.index({ userId: 1 });
customerVehicleSchema.index({ 'vehicleInfo.registrationNumber': 1 });
customerVehicleSchema.index({ status: 1 });
customerVehicleSchema.index({ 'classification.category': 1 });
customerVehicleSchema.index({ 'flags.isPrimary': 1 });
customerVehicleSchema.index({ 'flags.isActive': 1 });
customerVehicleSchema.index({ createdAt: -1 });

// Virtual for full vehicle name
customerVehicleSchema.virtual('fullName').get(function() {
    return `${this.vehicleInfo.make} ${this.vehicleInfo.model} ${this.vehicleInfo.year || ''}`.trim();
});

// Virtual for document expiry status
customerVehicleSchema.virtual('documentStatus').get(function() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let status = 'VALID';
    
    // Check insurance expiry
    if (this.documents.insurance?.expiryDate) {
        if (this.documents.insurance.expiryDate < now) {
            status = 'EXPIRED';
        } else if (this.documents.insurance.expiryDate < thirtyDaysFromNow) {
            status = 'EXPIRING_SOON';
        }
    }
    
    // Check pollution certificate expiry
    if (this.documents.pollutionCertificate?.expiryDate) {
        if (this.documents.pollutionCertificate.expiryDate < now) {
            status = 'EXPIRED';
        } else if (this.documents.pollutionCertificate.expiryDate < thirtyDaysFromNow && status !== 'EXPIRED') {
            status = 'EXPIRING_SOON';
        }
    }
    
    return status;
});

// Method to check if vehicle can be used for booking
customerVehicleSchema.methods.canBeUsedForBooking = function() {
    const issues = [];
    
    // Check approval status
    if (this.status !== 'APPROVED') {
        issues.push(`Vehicle is ${this.status.toLowerCase()}`);
    }
    
    // Check active status
    if (!this.flags.isActive) {
        issues.push('Vehicle is inactive');
    }
    
    // Check document expiry
    const now = new Date();
    
    if (this.documents.insurance?.expiryDate && this.documents.insurance.expiryDate < now) {
        issues.push('Insurance expired');
    }
    
    if (this.documents.pollutionCertificate?.expiryDate && this.documents.pollutionCertificate.expiryDate < now) {
        issues.push('Pollution certificate expired');
    }
    
    // Check critical issues
    const criticalIssues = this.condition.knownIssues?.filter(
        issue => issue.severity === 'CRITICAL' && !issue.resolved
    );
    
    if (criticalIssues && criticalIssues.length > 0) {
        issues.push('Vehicle has unresolved critical issues');
    }
    
    return {
        canUse: issues.length === 0,
        issues
    };
};

// Method to update statistics
customerVehicleSchema.methods.updateStatistics = function(bookingData) {
    this.statistics.totalBookings += 1;
    
    if (bookingData.serviceHours) {
        this.statistics.totalServiceHours += bookingData.serviceHours;
    }
    
    this.statistics.lastServiceDate = new Date();
    
    // Update average rating if provided
    if (bookingData.rating) {
        const totalRatings = this.statistics.totalBookings;
        const currentAvg = this.statistics.averageRating || 0;
        this.statistics.averageRating = ((currentAvg * (totalRatings - 1)) + bookingData.rating) / totalRatings;
    }
    
    return this;
};

// Method to add service history entry
customerVehicleSchema.methods.addServiceHistory = function(serviceData) {
    this.serviceHistory.push({
        bookingId: serviceData.bookingId,
        serviceType: serviceData.serviceType,
        serviceDate: serviceData.serviceDate || new Date(),
        driverId: serviceData.driverId,
        notes: serviceData.notes,
        rating: serviceData.rating
    });
    
    // Update statistics
    this.updateStatistics({
        serviceHours: serviceData.serviceHours,
        rating: serviceData.rating
    });
    
    return this;
};

// Method to report issue
customerVehicleSchema.methods.reportIssue = function(issue, severity = 'MEDIUM') {
    this.condition.knownIssues.push({
        issue,
        reportedAt: new Date(),
        severity,
        resolved: false
    });
    
    return this;
};

// Method to resolve issue
customerVehicleSchema.methods.resolveIssue = function(issueId) {
    const issue = this.condition.knownIssues.id(issueId);
    if (issue) {
        issue.resolved = true;
    }
    return this;
};

// Method to check document renewal needs
customerVehicleSchema.methods.checkDocumentRenewal = function() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const renewalNeeded = [];
    
    // Check insurance
    if (this.documents.insurance?.expiryDate) {
        if (this.documents.insurance.expiryDate < thirtyDaysFromNow) {
            renewalNeeded.push({
                document: 'Insurance',
                expiryDate: this.documents.insurance.expiryDate,
                daysRemaining: Math.ceil((this.documents.insurance.expiryDate - now) / (1000 * 60 * 60 * 24))
            });
        }
    }
    
    // Check pollution certificate
    if (this.documents.pollutionCertificate?.expiryDate) {
        if (this.documents.pollutionCertificate.expiryDate < thirtyDaysFromNow) {
            renewalNeeded.push({
                document: 'Pollution Certificate',
                expiryDate: this.documents.pollutionCertificate.expiryDate,
                daysRemaining: Math.ceil((this.documents.pollutionCertificate.expiryDate - now) / (1000 * 60 * 60 * 24))
            });
        }
    }
    
    this.flags.needsDocumentRenewal = renewalNeeded.length > 0;
    
    return renewalNeeded;
};

// Pre-save middleware
customerVehicleSchema.pre('save', function(next) {
    // Check document renewal needs
    this.checkDocumentRenewal();
    
    // Set luxury flag based on category
    if (this.classification.category === 'LUXURY' || this.classification.category === 'SPORTS') {
        this.flags.isLuxury = true;
    }
    
    next();
});

const CustomerVehicle = mongoose.model('CustomerVehicle', customerVehicleSchema);

module.exports = CustomerVehicle;
