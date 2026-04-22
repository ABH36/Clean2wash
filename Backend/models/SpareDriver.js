const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const spareDriverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    driverId: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [4, 'Password must be at least 4 characters'],
        select: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'BLOCKED', 'REJECTED', 'verified_pending_kit', 'kit_payment_pending', 'suspended', 'kit_payment_under_review'],
        default: 'PENDING'
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    kitStatus: {
        type: String,
        enum: ['NOT_PURCHASED', 'PENDING', 'COMPLETED'],
        default: 'NOT_PURCHASED'
    },
    kitFee: {
        type: Number,
        default: null
    },
    kitPayment: {
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
            default: 'PENDING'
        }
    },
    onboardingStep: {
        type: Number,
        default: 1
    },
    policeVerification: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    criminalDeclaration: {
        type: Boolean,
        default: false
    },
    documents: {
        aadhaarCard: {
            url: { type: String, default: '' },
            frontUrl: { type: String, default: '' },
            backUrl: { type: String, default: '' }
        },
        panCard: { url: { type: String, default: '' } },
        drivingLicense: { url: { type: String, default: '' } },
        selfie: { url: { type: String, default: '' } },
        policeVerification: {
            url: { type: String, default: '' },
            number: { type: String, default: '' },
            expiryDate: Date
        }
    },
    verification: {
        isPremium: {
            type: Boolean,
            default: false
        }
    },
    kit: {
        required: {
            type: Boolean,
            default: true
        },
        price: {
            type: Number,
            default: 1499
        },
        paymentStatus: {
            type: String,
            enum: ['not_required', 'pending', 'under_review', 'verified', 'rejected'],
            default: 'pending'
        },
        paymentProofUrl: {
            type: String,
            default: ''
        },
        paymentReference: {
            type: String,
            default: ''
        },
        razorpayOrderId: {
            type: String,
            default: ''
        },
        razorpayPaymentId: {
            type: String,
            default: ''
        },
        paidAt: Date,
        verifiedAt: Date
    },
    onboardingRecovery: {
        enabled: {
            type: Boolean,
            default: true
        },
        monthlyDeductionAmount: {
            type: Number,
            default: 199
        },
        totalMonths: {
            type: Number,
            default: 2
        },
        monthsDeducted: {
            type: Number,
            default: 0
        },
        pendingAmount: {
            type: Number,
            default: 0
        },
        startedAt: Date,
        lastDeductedAt: Date,
        nextDeductionAt: Date
    },
    inquiries: [{
        category: {
            type: String,
            enum: ['activation', 'payment', 'booking', 'earnings', 'technical', 'general'],
            default: 'general'
        },
        subject: {
            type: String,
            trim: true,
            default: ''
        },
        message: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['open', 'reviewed', 'resolved'],
            default: 'open'
        },
        adminReply: {
            type: String,
            trim: true,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        resolvedAt: Date
    }],
    adminNote: {
        type: String,
        default: ''
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: String,
        zone: {
            type: String,
            index: true
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    wallet: {
        balance: { type: Number, default: 0 },
        holdAmount: { type: Number, default: 0 }, // Amount held for pending bookings
        availableBalance: { type: Number, default: 0 }, // balance - holdAmount
        lastWithdrawAt: Date
    },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        upiId: String
    },
    profile: {
        languages: [{ type: String }],
        city: { type: String, default: '' },
        experience: { type: Number, default: 0 },
        availability: { type: String, enum: ['Full-time', 'Part-time'], default: 'Full-time' },
        education: { type: String, default: '' },
        profilePhoto: { type: String, default: '' }
    },
    
    // ─── DRIVER-SERVICE MAPPING ───────────────────────────────────────
    
    // Services this driver can provide
    allowedServices: [{
        type: {
            type: String,
            enum: ['point', 'hourly', 'full_day', 'outstation'],
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        customRate: {
            type: Number,
            default: null  // Optional driver-specific rate override
        },
        completedTrips: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5
        },
        lastTripAt: Date
    }],
    
    // Driver's preferred services (for smart matching)
    preferredServices: [{
        type: String,
        enum: ['point', 'hourly', 'full_day', 'outstation']
    }],
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        country: { type: String, default: 'India' },
        coordinates: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null }
        }
    },
    fcmTokens: [{
        token: String,
        platform: String,
        lastUsed: { type: Date, default: Date.now }
    }],
    
    // ─── PHASE 1: DRIVER OPERATIONS UPGRADE ───────────────────────────
    
    // Availability Scheduling
    availabilitySlots: [{
        date: {
            type: Date,
            required: true
        },
        timeSlots: [{
            start: String, // "09:00"
            end: String,   // "17:00"
            isBooked: {
                type: Boolean,
                default: false
            },
            bookingId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Booking'
            }
        }],
        isAvailable: {
            type: Boolean,
            default: true
        }
    }],
    
    // Reliability Score (0-100)
    reliabilityScore: {
        score: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        },
        metrics: {
            totalTrips: {
                type: Number,
                default: 0
            },
            completedTrips: {
                type: Number,
                default: 0
            },
            cancelledTrips: {
                type: Number,
                default: 0
            },
            acceptedBookings: {
                type: Number,
                default: 0
            },
            rejectedBookings: {
                type: Number,
                default: 0
            },
            completionRate: {
                type: Number,
                default: 100
            },
            acceptanceRate: {
                type: Number,
                default: 100
            },
            avgRating: {
                type: Number,
                default: 5.0
            }
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    },
    
    // Utilization Tracking
    utilization: {
        today: {
            tripsCompleted: {
                type: Number,
                default: 0
            },
            activeTime: {
                type: Number,
                default: 0 // minutes
            },
            idleTime: {
                type: Number,
                default: 0 // minutes
            },
            onlineTime: {
                type: Number,
                default: 0 // minutes
            },
            lastReset: {
                type: Date,
                default: Date.now
            }
        },
        weekly: {
            tripsCompleted: {
                type: Number,
                default: 0
            },
            totalActiveTime: {
                type: Number,
                default: 0 // minutes
            },
            lastReset: {
                type: Date,
                default: Date.now
            }
        }
    },
    
    // Online/Offline Tracking
    lastActive: {
        type: Date,
        default: Date.now
    },
    onlineStatus: {
        isOnline: {
            type: Boolean,
            default: false
        },
        lastOnlineAt: Date,
        lastOfflineAt: Date,
        sessionStart: Date
    },
    
    // ─── PHASE 2: FATIGUE & DUTY CONTROL ─────────────────────────────
    
    // Duty Hours Tracking
    dutyHours: {
        // Daily Tracking
        today: {
            totalMinutes: {
                type: Number,
                default: 0 // Total duty minutes today
            },
            startTime: Date, // First login time today
            endTime: Date,   // Last logout time today
            sessions: [{
                startTime: Date,
                endTime: Date,
                durationMinutes: Number
            }],
            lastReset: {
                type: Date,
                default: Date.now
            }
        },
        // Weekly Tracking
        weekly: {
            totalMinutes: {
                type: Number,
                default: 0
            },
            lastReset: {
                type: Date,
                default: Date.now
            }
        },
        // Limits Configuration
        limits: {
            dailyMaxMinutes: {
                type: Number,
                default: 600 // 10 hours default
            },
            weeklyMaxMinutes: {
                type: Number,
                default: 3600 // 60 hours default
            },
            mandatoryBreakAfterMinutes: {
                type: Number,
                default: 240 // 4 hours continuous work
            },
            minimumBreakMinutes: {
                type: Number,
                default: 30 // 30 minutes break
            }
        },
        // Current Status
        status: {
            isOverworked: {
                type: Boolean,
                default: false
            },
            needsBreak: {
                type: Boolean,
                default: false
            },
            canAcceptBookings: {
                type: Boolean,
                default: true
            },
            blockedReason: {
                type: String,
                default: ''
            },
            blockedUntil: Date
        }
    },
    
    // Break Management
    breaks: {
        lastBreakTime: Date,
        lastBreakDuration: Number, // minutes
        totalBreaksToday: {
            type: Number,
            default: 0
        },
        currentContinuousWorkMinutes: {
            type: Number,
            default: 0
        }
    },
    
    // Fatigue Alerts History
    fatigueAlerts: [{
        type: {
            type: String,
            enum: ['DAILY_LIMIT_REACHED', 'WEEKLY_LIMIT_REACHED', 'BREAK_REQUIRED', 'OVERWORK_WARNING'],
            required: true
        },
        triggeredAt: {
            type: Date,
            default: Date.now
        },
        dutyMinutes: Number,
        message: String,
        acknowledged: {
            type: Boolean,
            default: false
        },
        acknowledgedAt: Date
    }]
}, {
    timestamps: true
});

// Index for geo-spatial queries
spareDriverSchema.index({ currentLocation: '2dsphere' });
spareDriverSchema.index({ phone: 1 });
spareDriverSchema.index({ status: 1 });
spareDriverSchema.index({ verificationStatus: 1 });
spareDriverSchema.index({ 'onlineStatus.isOnline': 1 });
spareDriverSchema.index({ 'reliabilityScore.score': -1 });
spareDriverSchema.index({ lastActive: -1 });
// Phase 2 indexes
spareDriverSchema.index({ 'dutyHours.status.isOverworked': 1 });
spareDriverSchema.index({ 'dutyHours.status.needsBreak': 1 });
spareDriverSchema.index({ 'dutyHours.status.canAcceptBookings': 1 });


// Hash password before saving
spareDriverSchema.pre('save', async function () {
    // 1. Generate unique Driver ID if missing
    if (!this.driverId) {
        const randomPart = Math.floor(10000 + Math.random() * 90000);
        this.driverId = `C2W-DR-${Date.now()}-${randomPart}`;
    }

    // 2. Hash password
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
spareDriverSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// ─── PHASE 1: HELPER METHODS ─────────────────────────────────────────

// Calculate Reliability Score
spareDriverSchema.methods.calculateReliabilityScore = function() {
    const metrics = this.reliabilityScore.metrics;
    
    // Completion Rate (40% weight)
    const completionRate = metrics.totalTrips > 0 
        ? (metrics.completedTrips / metrics.totalTrips) * 100 
        : 100;
    
    // Acceptance Rate (30% weight)
    const totalRequests = metrics.acceptedBookings + metrics.rejectedBookings;
    const acceptanceRate = totalRequests > 0 
        ? (metrics.acceptedBookings / totalRequests) * 100 
        : 100;
    
    // Cancellation Penalty (20% weight)
    const cancellationPenalty = metrics.totalTrips > 0
        ? (metrics.cancelledTrips / metrics.totalTrips) * 100
        : 0;
    
    // Rating Score (10% weight)
    const ratingScore = (metrics.avgRating / 5) * 100;
    
    // Calculate weighted score
    const score = (
        (completionRate * 0.4) +
        (acceptanceRate * 0.3) +
        ((100 - cancellationPenalty) * 0.2) +
        (ratingScore * 0.1)
    );
    
    this.reliabilityScore.score = Math.round(Math.max(0, Math.min(100, score)));
    this.reliabilityScore.metrics.completionRate = Math.round(completionRate);
    this.reliabilityScore.metrics.acceptanceRate = Math.round(acceptanceRate);
    this.reliabilityScore.lastCalculated = new Date();
    
    return this.reliabilityScore.score;
};

// Update Utilization
spareDriverSchema.methods.updateUtilization = function(type, value) {
    if (type === 'tripCompleted') {
        this.utilization.today.tripsCompleted += 1;
        this.utilization.weekly.tripsCompleted += 1;
    } else if (type === 'activeTime') {
        this.utilization.today.activeTime += value;
        this.utilization.weekly.totalActiveTime += value;
    } else if (type === 'idleTime') {
        this.utilization.today.idleTime += value;
    } else if (type === 'onlineTime') {
        this.utilization.today.onlineTime += value;
    }
};

// Reset Daily Utilization
spareDriverSchema.methods.resetDailyUtilization = function() {
    this.utilization.today = {
        tripsCompleted: 0,
        activeTime: 0,
        idleTime: 0,
        onlineTime: 0,
        lastReset: new Date()
    };
};

// Reset Weekly Utilization
spareDriverSchema.methods.resetWeeklyUtilization = function() {
    this.utilization.weekly = {
        tripsCompleted: 0,
        totalActiveTime: 0,
        lastReset: new Date()
    };
};

// Check Availability for Date/Time
spareDriverSchema.methods.isAvailableAt = function(date, timeSlot) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const slot = this.availabilitySlots.find(s => 
        new Date(s.date).toISOString().split('T')[0] === dateStr
    );
    
    if (!slot || !slot.isAvailable) return false;
    
    if (timeSlot) {
        return slot.timeSlots.some(ts => 
            ts.start === timeSlot.start && 
            ts.end === timeSlot.end && 
            !ts.isBooked
        );
    }
    
    return true;
};

// ─── SERVICE MANAGEMENT METHODS ───────────────────────────────────────

// Check if driver can provide service
spareDriverSchema.methods.canProvideService = function(serviceType) {
    const service = this.allowedServices.find(s => s.type === serviceType);
    return service && service.isActive;
};

// Add service to driver
spareDriverSchema.methods.addService = function(serviceType) {
    const existing = this.allowedServices.find(s => s.type === serviceType);
    if (!existing) {
        this.allowedServices.push({
            type: serviceType,
            isActive: true,
            completedTrips: 0,
            rating: 5.0
        });
    }
    return this;
};

// Remove service from driver
spareDriverSchema.methods.removeService = function(serviceType) {
    this.allowedServices = this.allowedServices.filter(s => s.type !== serviceType);
    return this;
};

// Toggle service active status
spareDriverSchema.methods.toggleService = function(serviceType) {
    const service = this.allowedServices.find(s => s.type === serviceType);
    if (service) {
        service.isActive = !service.isActive;
    }
    return this;
};

// Update service stats after trip completion
spareDriverSchema.methods.updateServiceStats = function(serviceType, rating) {
    const service = this.allowedServices.find(s => s.type === serviceType);
    if (service) {
        service.completedTrips += 1;
        service.rating = ((service.rating * (service.completedTrips - 1)) + rating) / service.completedTrips;
        service.lastTripAt = new Date();
    }
    return this;
};

// Get driver's best performing service
spareDriverSchema.methods.getBestService = function() {
    if (!this.allowedServices.length) return null;
    
    return this.allowedServices.reduce((best, current) => {
        if (!best) return current;
        const bestScore = best.rating * best.completedTrips;
        const currentScore = current.rating * current.completedTrips;
        return currentScore > bestScore ? current : best;
    }, null);
};

// ─── PHASE 2: FATIGUE & DUTY CONTROL METHODS ─────────────────────────

// Start Duty Session
spareDriverSchema.methods.startDutySession = function() {
    const now = new Date();
    
    // Initialize today's tracking if needed
    if (!this.dutyHours.today.startTime) {
        this.dutyHours.today.startTime = now;
    }
    
    // Add new session
    this.dutyHours.today.sessions.push({
        startTime: now,
        endTime: null,
        durationMinutes: 0
    });
    
    return this;
};

// End Duty Session
spareDriverSchema.methods.endDutySession = function() {
    const now = new Date();
    
    // Find the last open session
    const lastSession = this.dutyHours.today.sessions[this.dutyHours.today.sessions.length - 1];
    
    if (lastSession && !lastSession.endTime) {
        lastSession.endTime = now;
        const durationMinutes = Math.floor((now - lastSession.startTime) / 60000);
        lastSession.durationMinutes = durationMinutes;
        
        // Update total minutes
        this.dutyHours.today.totalMinutes += durationMinutes;
        this.dutyHours.weekly.totalMinutes += durationMinutes;
        this.dutyHours.today.endTime = now;
        
        // Update continuous work time
        this.breaks.currentContinuousWorkMinutes += durationMinutes;
    }
    
    return this;
};

// Check if Driver Can Accept Bookings
spareDriverSchema.methods.canAcceptBooking = function() {
    const limits = this.dutyHours.limits;
    const today = this.dutyHours.today;
    const weekly = this.dutyHours.weekly;
    const status = this.dutyHours.status;
    
    // Check if manually blocked
    if (!status.canAcceptBookings) {
        return {
            canAccept: false,
            reason: status.blockedReason || 'Driver is currently blocked from accepting bookings',
            blockedUntil: status.blockedUntil
        };
    }
    
    // Check daily limit
    if (today.totalMinutes >= limits.dailyMaxMinutes) {
        return {
            canAccept: false,
            reason: `Daily duty limit reached (${Math.floor(limits.dailyMaxMinutes / 60)} hours)`,
            currentMinutes: today.totalMinutes,
            limitMinutes: limits.dailyMaxMinutes
        };
    }
    
    // Check weekly limit
    if (weekly.totalMinutes >= limits.weeklyMaxMinutes) {
        return {
            canAccept: false,
            reason: `Weekly duty limit reached (${Math.floor(limits.weeklyMaxMinutes / 60)} hours)`,
            currentMinutes: weekly.totalMinutes,
            limitMinutes: limits.weeklyMaxMinutes
        };
    }
    
    // Check if break is required
    if (this.breaks.currentContinuousWorkMinutes >= limits.mandatoryBreakAfterMinutes) {
        return {
            canAccept: false,
            reason: `Mandatory break required after ${Math.floor(limits.mandatoryBreakAfterMinutes / 60)} hours of continuous work`,
            continuousWorkMinutes: this.breaks.currentContinuousWorkMinutes,
            requiredBreakMinutes: limits.minimumBreakMinutes
        };
    }
    
    return {
        canAccept: true,
        remainingDailyMinutes: limits.dailyMaxMinutes - today.totalMinutes,
        remainingWeeklyMinutes: limits.weeklyMaxMinutes - weekly.totalMinutes
    };
};

// Record Break
spareDriverSchema.methods.recordBreak = function(durationMinutes) {
    const now = new Date();
    
    this.breaks.lastBreakTime = now;
    this.breaks.lastBreakDuration = durationMinutes;
    this.breaks.totalBreaksToday += 1;
    
    // Reset continuous work time if break is sufficient
    if (durationMinutes >= this.dutyHours.limits.minimumBreakMinutes) {
        this.breaks.currentContinuousWorkMinutes = 0;
        this.dutyHours.status.needsBreak = false;
    }
    
    return this;
};

// Check and Update Duty Status
spareDriverSchema.methods.updateDutyStatus = function() {
    const limits = this.dutyHours.limits;
    const today = this.dutyHours.today;
    const weekly = this.dutyHours.weekly;
    
    // Check daily limit
    if (today.totalMinutes >= limits.dailyMaxMinutes) {
        this.dutyHours.status.isOverworked = true;
        this.dutyHours.status.canAcceptBookings = false;
        this.dutyHours.status.blockedReason = 'Daily duty limit exceeded';
        
        // Calculate when they can work again (next day)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        this.dutyHours.status.blockedUntil = tomorrow;
        
        // Create alert if not already exists
        this.addFatigueAlert('DAILY_LIMIT_REACHED', today.totalMinutes, 
            `Daily duty limit of ${Math.floor(limits.dailyMaxMinutes / 60)} hours reached`);
    }
    // Check weekly limit
    else if (weekly.totalMinutes >= limits.weeklyMaxMinutes) {
        this.dutyHours.status.isOverworked = true;
        this.dutyHours.status.canAcceptBookings = false;
        this.dutyHours.status.blockedReason = 'Weekly duty limit exceeded';
        
        // Calculate when they can work again (next week)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        this.dutyHours.status.blockedUntil = nextWeek;
        
        this.addFatigueAlert('WEEKLY_LIMIT_REACHED', weekly.totalMinutes,
            `Weekly duty limit of ${Math.floor(limits.weeklyMaxMinutes / 60)} hours reached`);
    }
    // Check if break is needed
    else if (this.breaks.currentContinuousWorkMinutes >= limits.mandatoryBreakAfterMinutes) {
        this.dutyHours.status.needsBreak = true;
        this.dutyHours.status.canAcceptBookings = false;
        this.dutyHours.status.blockedReason = 'Mandatory break required';
        
        this.addFatigueAlert('BREAK_REQUIRED', this.breaks.currentContinuousWorkMinutes,
            `Mandatory break required after ${Math.floor(limits.mandatoryBreakAfterMinutes / 60)} hours of continuous work`);
    }
    // Check if approaching limit (warning at 80%)
    else if (today.totalMinutes >= limits.dailyMaxMinutes * 0.8) {
        this.addFatigueAlert('OVERWORK_WARNING', today.totalMinutes,
            `Approaching daily duty limit (${Math.floor(today.totalMinutes / 60)} hours worked)`);
    }
    else {
        // Reset status if within limits
        this.dutyHours.status.isOverworked = false;
        this.dutyHours.status.needsBreak = false;
        this.dutyHours.status.canAcceptBookings = true;
        this.dutyHours.status.blockedReason = '';
        this.dutyHours.status.blockedUntil = null;
    }
    
    return this;
};

// Add Fatigue Alert
spareDriverSchema.methods.addFatigueAlert = function(type, dutyMinutes, message) {
    // Check if similar alert already exists today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAlert = this.fatigueAlerts.find(alert => 
        alert.type === type && 
        alert.triggeredAt >= today &&
        !alert.acknowledged
    );
    
    if (!existingAlert) {
        this.fatigueAlerts.push({
            type,
            triggeredAt: new Date(),
            dutyMinutes,
            message,
            acknowledged: false
        });
    }
    
    return this;
};

// Reset Daily Duty Hours
spareDriverSchema.methods.resetDailyDutyHours = function() {
    this.dutyHours.today = {
        totalMinutes: 0,
        startTime: null,
        endTime: null,
        sessions: [],
        lastReset: new Date()
    };
    
    this.breaks.totalBreaksToday = 0;
    this.breaks.currentContinuousWorkMinutes = 0;
    
    // Reset daily status
    this.dutyHours.status.isOverworked = false;
    this.dutyHours.status.needsBreak = false;
    this.dutyHours.status.canAcceptBookings = true;
    this.dutyHours.status.blockedReason = '';
    this.dutyHours.status.blockedUntil = null;
    
    return this;
};

// Reset Weekly Duty Hours
spareDriverSchema.methods.resetWeeklyDutyHours = function() {
    this.dutyHours.weekly = {
        totalMinutes: 0,
        lastReset: new Date()
    };
    
    return this;
};

// Get Duty Summary
spareDriverSchema.methods.getDutySummary = function() {
    const limits = this.dutyHours.limits;
    const today = this.dutyHours.today;
    const weekly = this.dutyHours.weekly;
    
    return {
        today: {
            totalHours: (today.totalMinutes / 60).toFixed(1),
            totalMinutes: today.totalMinutes,
            maxHours: (limits.dailyMaxMinutes / 60).toFixed(1),
            remainingMinutes: Math.max(0, limits.dailyMaxMinutes - today.totalMinutes),
            percentageUsed: ((today.totalMinutes / limits.dailyMaxMinutes) * 100).toFixed(1),
            sessions: today.sessions.length
        },
        weekly: {
            totalHours: (weekly.totalMinutes / 60).toFixed(1),
            totalMinutes: weekly.totalMinutes,
            maxHours: (limits.weeklyMaxMinutes / 60).toFixed(1),
            remainingMinutes: Math.max(0, limits.weeklyMaxMinutes - weekly.totalMinutes),
            percentageUsed: ((weekly.totalMinutes / limits.weeklyMaxMinutes) * 100).toFixed(1)
        },
        breaks: {
            totalToday: this.breaks.totalBreaksToday,
            lastBreakDuration: this.breaks.lastBreakDuration,
            continuousWorkMinutes: this.breaks.currentContinuousWorkMinutes,
            needsBreak: this.dutyHours.status.needsBreak
        },
        status: {
            canAcceptBookings: this.dutyHours.status.canAcceptBookings,
            isOverworked: this.dutyHours.status.isOverworked,
            blockedReason: this.dutyHours.status.blockedReason,
            blockedUntil: this.dutyHours.status.blockedUntil
        }
    };
};

const SpareDriver = mongoose.model('SpareDriver', spareDriverSchema);

module.exports = SpareDriver;
