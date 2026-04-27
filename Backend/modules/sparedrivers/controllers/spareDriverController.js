const mongoose = require('mongoose');
const SpareDriver = require('../../../models/SpareDriver');
const Booking = require('../../../models/Booking');
const ServiceZone = require('../../../models/ServiceZone');
const User = require('../../../models/User');
const Setting = require('../../../models/Setting');
const Role = require('../../../models/Role');
const Admin = require('../../../models/Admin');
const WalletTransaction = require('../../../models/WalletTransaction');
const Notification = require('../../../models/Notification');
const AuditLog = require('../../../models/AuditLog');
const commissionHelper = require('../../../utils/commissionHelper');
const { getIO } = require('../../../socketService');
const cloudinary = require('../../../utils/cloudinary');
const razorpay = require('../../../config/razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendSpareDriverNotification, sendAdminNotification, sendNotification } = require('../../../utils/notificationService');
const {
    appendBookingActivityLog,
    broadcastBookingToDrivers,
    hasDriverRejectedBooking
} = require('../../../utils/spareDriverDispatch');
const { executeWalletTransaction, adjustWalletHold } = require('../../../utils/walletHelper');

const CHAUFFEUR_DISPATCH_LEAD_MINUTES = 15;
const spareDriverSignupOTPStore = new Map();
const validateSignupPhone = (phone = '') => /^[6-9]\d{9}$/.test(String(phone).trim());
const VERIFICATION_QUEUE_STATUSES = ['pending', 'pending_verification', 'kit_payment_pending', 'kit_payment_under_review', 'verified_pending_kit'];
const NON_QUEUE_DRIVER_STATUSES = ['active', 'rejected', 'suspended'];

const getScheduledDispatchTime = (schedule = {}) => {
    if (!schedule?.date) return new Date();

    const scheduledAt = new Date(schedule.date);

    if (schedule?.timeSlot?.start) {
        const [hours, minutes] = String(schedule.timeSlot.start).split(':').map(Number);
        scheduledAt.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    }

    return scheduledAt;
};

const getAdminRoleLevel = (admin = {}) => {
    const roleLevel = admin?.role?.level;
    if (Number.isFinite(Number(roleLevel))) return Number(roleLevel);
    return 99;
};

const hasReviewCapability = async (admin = {}) => {
    const roleId = admin?.role?._id || admin?.role;
    if (!roleId) return false;

    const role = await Role.findById(roleId).populate('permissions').lean();
    if (!role) return false;
    if (Number(role.level) === 1) return true;

    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    return permissions.some((permission) => {
        const moduleName = String(permission?.module || '').toLowerCase();
        const actionName = String(permission?.action || '').toLowerCase();
        return (
            moduleName === '*'
            || (moduleName === 'drivers' && (actionName === '*' || actionName === 'update' || actionName === 'manage'))
            || (moduleName === 'admins' && actionName === 'manage_roles')
        );
    });
};

const isVerificationQueueCandidate = (driver = {}) => {
    const normalizedStatus = String(driver.status || '').toLowerCase();
    const normalizedVerificationStatus = String(driver.verificationStatus || '').toLowerCase();
    const docs = driver.documents || {};
    const hasAllDocs = Boolean(
        docs?.aadhaarCard?.frontUrl
        && docs?.aadhaarCard?.backUrl
        && docs?.panCard?.url
        && docs?.drivingLicense?.url
        && docs?.selfie?.url
    );

    if (NON_QUEUE_DRIVER_STATUSES.includes(normalizedStatus)) {
        return false;
    }

    if (normalizedStatus === 'pending' && !hasAllDocs) {
        return true;
    }

    if (VERIFICATION_QUEUE_STATUSES.includes(normalizedStatus)) {
        return true;
    }

    return normalizedVerificationStatus === 'pending';
};

const getQueueScopeFilter = (status) => {
    if (!status) {
        return { status: { $nin: ['active', 'ACTIVE', 'rejected', 'REJECTED', 'suspended', 'SUSPENDED'] } };
    }

    const normalizedStatus = String(status).toLowerCase();
    if (normalizedStatus === 'all') {
        return {};
    }

    const isUpperPreferred = ['pending', 'active', 'blocked', 'rejected'].includes(normalizedStatus);
    const candidates = isUpperPreferred
        ? [normalizedStatus, normalizedStatus.toUpperCase()]
        : [normalizedStatus];

    return { status: { $in: candidates } };
};

const runVerificationQueueAutoAssignment = async () => {
    const activeAdmins = await Admin.find({ status: 'ACTIVE' }).populate({
        path: 'role',
        populate: { path: 'permissions', select: 'module action' }
    });

    if (!activeAdmins.length) return 0;

    const eligibleAdmins = activeAdmins.filter((admin) => {
        if (Number(admin?.role?.level) === 1) return true;
        const permissions = Array.isArray(admin?.role?.permissions) ? admin.role.permissions : [];
        return permissions.some((permission) => {
            const moduleName = String(permission?.module || '').toLowerCase();
            const actionName = String(permission?.action || '').toLowerCase();
            return moduleName === '*' || (moduleName === 'drivers' && (actionName === 'update' || actionName === 'manage' || actionName === '*'));
        });
    });

    if (!eligibleAdmins.length) return 0;

    const adminIds = eligibleAdmins.map((admin) => admin._id);
    const baseQueueFilter = {
        status: { $nin: ['active', 'ACTIVE', 'rejected', 'REJECTED', 'suspended', 'SUSPENDED'] }
    };
    const assignedDrivers = await SpareDriver.find({
        ...baseQueueFilter,
        'verificationQueue.assignedAdmin': { $in: adminIds }
    }).select('_id verificationQueue.assignedAdmin status verificationStatus documents').lean();

    const activeAssignedByAdmin = new Map();
    adminIds.forEach((id) => activeAssignedByAdmin.set(String(id), 0));

    const staleAssignments = [];
    assignedDrivers.forEach((driver) => {
        if (!isVerificationQueueCandidate(driver)) {
            staleAssignments.push(driver._id);
            return;
        }
        const key = String(driver.verificationQueue?.assignedAdmin || '');
        activeAssignedByAdmin.set(key, (activeAssignedByAdmin.get(key) || 0) + 1);
    });

    if (staleAssignments.length) {
        await SpareDriver.updateMany(
            { _id: { $in: staleAssignments } },
            {
                $set: {
                    'verificationQueue.assignedAdmin': null,
                    'verificationQueue.assignedAt': null,
                    'verificationQueue.releasedAt': new Date(),
                    'verificationQueue.assignmentSource': 'auto'
                }
            }
        );
    }

    const unassignedCandidates = await SpareDriver.find({
        ...baseQueueFilter,
        'verificationQueue.assignedAdmin': null
    }).select('_id status verificationStatus documents createdAt').sort({ createdAt: 1 }).lean();

    const eligibleCandidates = unassignedCandidates.filter(isVerificationQueueCandidate);
    if (!eligibleCandidates.length) return 0;

    const sortedAdminIds = [...adminIds].sort((a, b) => {
        const loadA = activeAssignedByAdmin.get(String(a)) || 0;
        const loadB = activeAssignedByAdmin.get(String(b)) || 0;
        if (loadA !== loadB) return loadA - loadB;
        return String(a).localeCompare(String(b));
    });

    const assignments = [];
    eligibleCandidates.forEach((driver, index) => {
        const adminId = sortedAdminIds[index % sortedAdminIds.length];
        const key = String(adminId);
        activeAssignedByAdmin.set(key, (activeAssignedByAdmin.get(key) || 0) + 1);
        assignments.push({
            updateOne: {
                filter: { _id: driver._id },
                update: {
                    $set: {
                        'verificationQueue.assignedAdmin': adminId,
                        'verificationQueue.assignedAt': new Date(),
                        'verificationQueue.releasedAt': null,
                        'verificationQueue.assignmentSource': 'auto'
                    }
                }
            }
        });
    });

    if (assignments.length) {
        await SpareDriver.bulkWrite(assignments);
    }

    return assignments.length;
};

const isDispatchReadySchedule = (schedule = {}, leadMinutes = CHAUFFEUR_DISPATCH_LEAD_MINUTES) => {
    if (!schedule || schedule.type !== 'scheduled') return true;
    return getScheduledDispatchTime(schedule).getTime() <= (Date.now() + (leadMinutes * 60 * 1000));
};

const getSocketIO = () => {
    try {
        return getIO();
    } catch (error) {
        return null;
    }
};

const getActorRole = (req) => req.auth?.role || req.user?.role || 'sparedriver';
const isDriverOperational = (driver) => driver?.status?.toLowerCase() === 'active';
const hasValidLatLng = (coordinates = {}) => (
    Number.isFinite(Number(coordinates?.lat))
    && Number.isFinite(Number(coordinates?.lng))
    && Number(coordinates.lat) !== 0
    && Number(coordinates.lng) !== 0
);
const DRIVER_KIT_PRICE = 1499;
const DEFAULT_SPARE_DRIVER_KIT_CONFIG = {
    title: 'Starter Driver Kit',
    subtitle: 'Complete payment to unlock your chauffeur dashboard.',
    kitPrice: DRIVER_KIT_PRICE,
    monthlyDeductionAmount: 199,
    monthlyDeductionMonths: 2,
    imageUrls: [
        'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'
    ]
};
const DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG = {
    title: 'Premium Driver Program',
    subtitle: 'Police-verified chauffeurs get premium trust and booking visibility.',
    benefits: [
        'Premium badge on profile and operational identity',
        'Priority visibility for high-trust customer trips',
        'Higher confidence score during manual assignment'
    ]
};

const normalizeSpareDriverKitConfig = (value = {}) => {
    const imageUrls = Array.isArray(value?.imageUrls)
        ? value.imageUrls.map((url) => String(url || '').trim()).filter(Boolean).slice(0, 8)
        : [];

    const kitPrice = Number(value?.kitPrice);
    const monthlyDeductionAmount = Number(value?.monthlyDeductionAmount);
    const monthlyDeductionMonths = Number(value?.monthlyDeductionMonths);

    return {
        title: String(value?.title || DEFAULT_SPARE_DRIVER_KIT_CONFIG.title).trim() || DEFAULT_SPARE_DRIVER_KIT_CONFIG.title,
        subtitle: String(value?.subtitle || DEFAULT_SPARE_DRIVER_KIT_CONFIG.subtitle).trim() || DEFAULT_SPARE_DRIVER_KIT_CONFIG.subtitle,
        kitPrice: Number.isFinite(kitPrice) && kitPrice > 0 ? Math.round(kitPrice) : DEFAULT_SPARE_DRIVER_KIT_CONFIG.kitPrice,
        monthlyDeductionAmount: Number.isFinite(monthlyDeductionAmount) && monthlyDeductionAmount >= 0
            ? Math.round(monthlyDeductionAmount)
            : DEFAULT_SPARE_DRIVER_KIT_CONFIG.monthlyDeductionAmount,
        monthlyDeductionMonths: Number.isFinite(monthlyDeductionMonths) && monthlyDeductionMonths >= 0
            ? Math.min(12, Math.round(monthlyDeductionMonths))
            : DEFAULT_SPARE_DRIVER_KIT_CONFIG.monthlyDeductionMonths,
        imageUrls: imageUrls.length ? imageUrls : DEFAULT_SPARE_DRIVER_KIT_CONFIG.imageUrls
    };
};

const getSpareDriverKitConfig = async () => {
    const setting = await Setting.findOne({ key: 'sparedriver_kit_config' }).select('value').lean();
    return normalizeSpareDriverKitConfig(setting?.value || {});
};

const normalizeSpareDriverPremiumConfig = (value = {}) => {
    const benefits = Array.isArray(value?.benefits)
        ? value.benefits.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 10)
        : [];

    return {
        title: String(value?.title || DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG.title).trim() || DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG.title,
        subtitle: String(value?.subtitle || DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG.subtitle).trim() || DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG.subtitle,
        benefits: benefits.length ? benefits : DEFAULT_SPARE_DRIVER_PREMIUM_CONFIG.benefits
    };
};

const getSpareDriverPremiumConfig = async () => {
    const setting = await Setting.findOne({ key: 'sparedriver_premium_config' }).select('value').lean();
    return normalizeSpareDriverPremiumConfig(setting?.value || {});
};

const addMonthsToDate = (date = new Date(), months = 1) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

const applyMonthlyKitRecovery = async (driver, bookingId = '') => {
    if (!driver) return null;
    if (driver.status !== 'active') return null;

    const recovery = driver.onboardingRecovery || {};
    if (!recovery.startedAt) return null;
    const enabled = Boolean(recovery.enabled);
    const monthlyAmount = Math.max(0, Number(recovery.monthlyDeductionAmount || 0));
    const totalMonths = Math.max(0, Number(recovery.totalMonths || 0));
    const monthsDeducted = Math.max(0, Number(recovery.monthsDeducted || 0));

    if (!enabled || !monthlyAmount || !totalMonths || monthsDeducted >= totalMonths) {
        return null;
    }

    const now = new Date();
    const dueAt = recovery.nextDeductionAt ? new Date(recovery.nextDeductionAt) : now;
    if (Number.isFinite(dueAt.getTime()) && dueAt.getTime() > now.getTime()) {
        return null;
    }

    const installmentNumber = monthsDeducted + 1;

    try {
        await executeWalletTransaction(
            driver._id,
            monthlyAmount,
            'debit',
            {
                category: 'SERVICE_CHARGE',
                description: `Starter kit monthly recovery installment ${installmentNumber}/${totalMonths}`,
                referenceId: `${driver._id.toString()}-kit-recovery-${installmentNumber}-${now.toISOString().slice(0, 10)}`,
                referenceType: 'sparedriver_kit_recovery',
                creditLimit: 0,
                metaData: {
                    bookingId: bookingId ? bookingId.toString() : '',
                    installmentNumber,
                    totalMonths
                }
            },
            null,
            SpareDriver
        );

        const completedInstallments = installmentNumber;
        driver.onboardingRecovery.monthsDeducted = completedInstallments;
        driver.onboardingRecovery.lastDeductedAt = now;
        driver.onboardingRecovery.pendingAmount = Math.max(0, Number(driver.onboardingRecovery.pendingAmount || 0) - monthlyAmount);
        driver.onboardingRecovery.nextDeductionAt = completedInstallments >= totalMonths ? null : addMonthsToDate(now, 1);
        driver.onboardingRecovery.enabled = completedInstallments < totalMonths;
        await driver.save({ validateBeforeSave: false });

        return {
            charged: true,
            amount: monthlyAmount,
            installmentNumber: completedInstallments,
            totalMonths
        };
    } catch (walletError) {
        driver.onboardingRecovery.pendingAmount = Number(driver.onboardingRecovery.pendingAmount || 0) + monthlyAmount;
        driver.onboardingRecovery.nextDeductionAt = addMonthsToDate(now, 1);
        await driver.save({ validateBeforeSave: false });
        console.warn('Monthly kit recovery skipped:', walletError.message);
        return {
            charged: false,
            error: walletError.message
        };
    }
};

const getChauffeurCommercialRules = (booking = {}) => {
    const rules = booking?.service?.metadata?.commercialRules || {};
    return {
        waitingGraceMinutes: Number.isFinite(Number(rules.waitingGraceMinutes)) ? Number(rules.waitingGraceMinutes) : 15,
        waitChargePerMinute: Number.isFinite(Number(rules.waitChargePerMinute)) ? Number(rules.waitChargePerMinute) : 2,
        overtimeGraceMinutes: Number.isFinite(Number(rules.overtimeGraceMinutes)) ? Number(rules.overtimeGraceMinutes) : 15,
        extensionRatePerHour: Number.isFinite(Number(rules.extensionRatePerHour)) ? Number(rules.extensionRatePerHour) : null,
        nightAllowance: Number.isFinite(Number(rules.nightAllowance)) ? Number(rules.nightAllowance) : 300,
        outstationAllowancePerDay: Number.isFinite(Number(rules.outstationAllowancePerDay)) ? Number(rules.outstationAllowancePerDay) : 500,
        commissionPercent: Number.isFinite(Number(rules.commissionPercent)) ? Number(rules.commissionPercent) : null
    };
};

const getChauffeurCommissionOverride = (booking = {}) => {
    const rate = Number(booking?.service?.metadata?.commercialRules?.commissionPercent);
    return Number.isFinite(rate) && rate >= 0 ? rate : null;
};

const parseBookedDurationHours = (durationValue = '', fallbackHours = 1) => {
    const matchedHours = String(durationValue || '').match(/(\d+)/);
    const hours = matchedHours ? parseInt(matchedHours[1], 10) : fallbackHours;
    return Number.isFinite(hours) && hours > 0 ? hours : fallbackHours;
};

const getHeldReserveAmount = (booking = {}) => Math.max(0, Number(booking.payment?.walletReserveHeldAmount || 0));

const releaseChauffeurReserve = async (booking, reason = 'reserve released') => {
    const heldAmount = getHeldReserveAmount(booking);
    if (!heldAmount || booking.service?.type !== 'sparedriver') {
        return 0;
    }

    await adjustWalletHold(
        booking.consumer?._id || booking.consumer,
        heldAmount,
        'release',
        {
            category: 'REFUND',
            description: `Wallet reserve released for chauffeur booking #${booking.bookingId || booking._id}`,
            referenceId: `${booking._id.toString()}-reserve-release-${booking.payment?.walletReserveReleasedAmount || 0}`,
            referenceType: 'booking_wallet_reserve_release',
            metaData: { reason }
        }
    );

    booking.payment.walletReserveHeldAmount = 0;
    booking.payment.walletReserveReleasedAmount = Number(booking.payment?.walletReserveReleasedAmount || 0) + heldAmount;
    booking.payment.walletReserveStatus = 'released';
    booking.payment.walletReserveReleasedAt = new Date();

    return heldAmount;
};

const consumeChauffeurReserve = async (booking, amount, reason = 'reserve consumed') => {
    const heldAmount = getHeldReserveAmount(booking);
    const captureAmount = Math.min(heldAmount, Math.max(0, Number(amount || 0)));

    if (!captureAmount || booking.service?.type !== 'sparedriver') {
        return 0;
    }

    await adjustWalletHold(
        booking.consumer?._id || booking.consumer,
        captureAmount,
        'consume',
        {
            category: 'SERVICE_BOOKING',
            description: `Wallet reserve consumed for chauffeur booking #${booking.bookingId || booking._id}`,
            referenceId: `${booking._id.toString()}-reserve-consume-${booking.payment?.walletReserveConsumedAmount || 0}`,
            referenceType: 'booking_wallet_reserve_consume',
            metaData: { reason }
        }
    );

    booking.payment.walletReserveHeldAmount = heldAmount - captureAmount;
    booking.payment.walletReserveConsumedAmount = Number(booking.payment?.walletReserveConsumedAmount || 0) + captureAmount;
    booking.payment.walletReserveStatus = booking.payment.walletReserveHeldAmount > 0 ? 'partially_consumed' : 'consumed';

    return captureAmount;
};
const clearDriverAssignment = (booking) => {
    booking.provider = {
        type: 'sparedriver',
        model: 'SpareDriver',
        id: null,
        name: '',
        phone: '',
        rating: undefined,
        photo: ''
    };
};

const releaseBookingBackToPool = async ({ booking, driverId, reason, releaseStatus }) => {
    const releaseMessage = reason || 'Driver is unavailable for this trip.';
    const dispatchReady = isDispatchReadySchedule(booking.schedule);

    booking.status = 'pending';
    clearDriverAssignment(booking);
    booking.notes = booking.notes || {};
    booking.notes.provider = releaseMessage;
    booking.tracking = booking.tracking || {};
    booking.tracking.assignedAt = null;
    booking.tracking.startedAt = null;
    booking.tracking.arrivedAt = null;

    appendBookingActivityLog(
        booking,
        releaseStatus,
        releaseMessage,
        {
            driverId: driverId.toString(),
            reason: releaseMessage
        }
    );

    const dispatch = dispatchReady
        ? await broadcastBookingToDrivers(booking, {
            excludeDriverIds: [driverId],
            reason: releaseStatus,
            notificationMessage: 'A chauffeur request has been reopened near your location.'
        })
        : {
            driverCount: 0,
            radiusMeters: 0,
            excludedDriverIds: [driverId.toString()],
            driverIds: []
        };

    const io = getSocketIO();
    if (io) {
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: 'pending',
            message: dispatchReady
                ? (dispatch.driverCount > 0
                    ? 'Finding another driver for your trip.'
                    : 'No alternate driver found yet. We are still searching nearby.')
                : 'Your trip is back in the scheduled queue. Driver matching will resume closer to departure.',
            dispatchState: dispatchReady ? 'reassigning' : 'scheduled_hold'
        });
    }

    await sendNotification(booking.consumer?._id || booking.consumer, {
        title: dispatchReady ? 'Searching Another Driver' : 'Trip Returned to Schedule',
        message: dispatchReady
            ? (dispatch.driverCount > 0
                ? 'Your current driver is unavailable. We are assigning another verified driver now.'
                : 'Your current driver is unavailable. We are still searching for another verified driver.')
            : 'Your current driver is unavailable. Your trip is safe in the scheduled queue and matching will resume closer to the start time.',
        type: 'booking',
        priority: 'high',
        actionUrl: '/spare-driver',
        actionText: 'Track Search',
        metaData: {
            bookingId: booking._id.toString(),
            status: 'pending',
            dispatchState: dispatchReady ? 'reassigning' : 'scheduled_hold'
        }
    });

    return dispatch;
};

const populateAdminBooking = (bookingQuery) => (
    bookingQuery
        .populate('consumer', 'name phone email profile')
        .populate('vehicle', 'brand model type plate')
        .populate('provider.id', 'name phone status isOnline currentLocation verification')
);

const emitAdminBookingRefresh = (booking, payload = {}) => {
    const io = getSocketIO();
    if (!io || !booking?._id) return;

    if (payload.message) {
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            message: payload.message,
            dispatchState: payload.dispatchState
        });
    }

    io.to('admin_room').emit('global_status_update', {
        type: 'spare_driver_booking_update',
        bookingId: booking._id,
        status: booking.status,
        providerId: booking.provider?.id?._id || booking.provider?.id || null,
        dispatchState: payload.dispatchState || null,
        adminAction: payload.adminAction || null
    });
};

const appendInternalAdminNote = (booking, note) => {
    if (!note || !note.trim()) return;
    booking.notes = booking.notes || {};
    booking.notes.internal = `${booking.notes.internal || ''}\n[ADMIN] ${note.trim()}`.trim();
};

const processAdminCancellationRefund = async (booking, reason) => {
    if (booking.service?.type === 'sparedriver') {
        await releaseChauffeurReserve(booking, reason || 'admin_cancelled');
    }

    if (booking.payment?.status !== 'paid') return;

    const refundAmount = booking.pricing?.totalAmount || 0;

    if (booking.payment.method === 'wallet') {
        await executeWalletTransaction(
            booking.consumer,
            refundAmount,
            'credit',
            {
                category: 'REFUND',
                description: `Admin refund for cancelled booking: #${booking.bookingId || booking._id}`,
                referenceId: booking._id,
                referenceType: 'booking'
            }
        );
        booking.payment.status = 'refunded';
    } else if (booking.payment.method === 'subscription') {
        const Subscription = require('../../../models/Subscription');
        const activeSubscription = await Subscription.getActiveSubscription(booking.consumer, {
            service: booking.service || {},
            hub: booking.location?.hubId || null,
            location: booking.location || {},
            destination: booking.location?.destination || null
        });
        if (activeSubscription) {
            await activeSubscription.addCredits(1);
        }
        booking.payment.status = 'refunded';
    } else {
        booking.payment.status = 'refund_pending';
    }

    booking.payment.refundAmount = refundAmount;
    booking.payment.refundedAt = new Date();
    appendInternalAdminNote(
        booking,
        reason
            ? `Refund prepared after admin cancellation. Reason: ${reason}`
            : 'Refund prepared after admin cancellation.'
    );
};
// 🚨 SOS Emergency Protocol (Phase 4 Hardening) 🚨
exports.reportEmergency = async (req, res) => {
    try {
        const { bookingId, reason, latitude, longitude } = req.body;
        const driverId = getDriverIdFromRequest(req);
        const actorRole = getActorRole(req);

        const booking = await Booking.findById(bookingId).populate('consumer', 'name phone');
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking context missing' });

        booking.issues = booking.issues || [];
        booking.issues.push({
            type: 'SOS',
            description: reason || `Emergency raised by ${actorRole}`,
            status: 'open'
        });
        appendBookingActivityLog(booking, 'sos_alert', 'Emergency alert raised from spare driver module.', {
            actorRole,
            reason: reason || 'Not specified',
            latitude,
            longitude,
            driverId: driverId ? driverId.toString() : ''
        });
        await booking.save({ validateBeforeSave: false });

        // 1. Log incident in audit & security log
        const securityNote = `SOS ALERT: Triggered by ${actorRole} for Booking #${bookingId}. Reason: ${reason || 'Not specified'}. Location: [${latitude}, ${longitude}]`;
        console.error(securityNote);

        // 2. Immediate Broadcast to Admin Room
        const io = getSocketIO();
        if (io) {
            io.to('admin_room').emit('SOS_EMERGENCY_ALERT', {
                bookingId,
                actor: actorRole,
                location: { lat: latitude, lng: longitude },
                consumer: booking.consumer?.name,
                phone: booking.consumer?.phone,
                timestamp: new Date()
            });
        }

        await sendAdminNotification({
            title: 'Spare Driver SOS Alert',
            message: `Emergency raised for booking ${booking.bookingId || bookingId}. Immediate review required.`,
            type: 'sos',
            priority: 'urgent',
            actionUrl: '/admin/spare-drivers',
            actionText: 'Open Driver Desk',
            metaData: {
                bookingId,
                actor: actorRole,
                consumer: booking.consumer?.name,
                latitude,
                longitude
            }
        });

        // 3. Notify Emergency Contacts (Future integration)
        // ... mailer or SMS integration here

        res.status(200).json({
            status: 'success',
            message: 'SOS Alert received. Emergency protocols activated.'
        });

    } catch (err) {
        console.error('SOS Protocol Failure:', err);
        res.status(500).json({ status: 'error', message: 'Emergency dispatch failed' });
    }
};

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getDriverIdFromRequest = (req) => req.spareDriver?.id || req.user?.id;

// ── Ensure upload directory exists ──
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/sparedrivers');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config: store locally, allow images only ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${getDriverIdFromRequest(req) || 'unknown'}_${file.fieldname}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const isOk = allowed.test(path.extname(file.originalname).toLowerCase()) &&
        allowed.test(file.mimetype);
    if (isOk) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp)'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB per file
});

exports.upload = upload; // expose for route use

// ── JWT helper ──
const signToken = (id) => jwt.sign(
    { id, role: 'sparedriver' },
    process.env.JWT_SECRET || 'secret-jwt-key-for-carwash',
    { expiresIn: '90d' }
);

// ── Register ──
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingDriver = await SpareDriver.findOne({ phone });
        if (existingDriver) {
            return res.status(409).json({
                status: 'fail',
                message: 'This phone number is already registered. Please sign in instead.'
            });
        }

        const newDriver = await SpareDriver.create({ name, email, phone, password });
        const token = signToken(newDriver._id);
        res.status(201).json({
            status: 'success',
            token,
            data: {
                driver: {
                    id: newDriver._id,
                    name: newDriver.name,
                    email: newDriver.email,
                    phone: newDriver.phone,
                    status: newDriver.status
                }
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Complete Registration (Single API Call with All Data + Documents) ──
exports.registerComplete = async (req, res) => {
    try {
        const {
            name, email, phone, password,
            city, availability,
            aadhaarNumber, panNumber,
            licenseNumber, licenseExpiry, experienceYears,
            bankDetails
        } = req.body;
        
        const files = req.files;
        
        console.log('📥 Complete registration request received');
        console.log('📋 Fields:', { name, phone, city, availability, licenseNumber });
        console.log('📎 Files:', files ? Object.keys(files) : 'none');
        
        // Debug Cloudinary config
        console.log('☁️ Cloudinary config check:');
        console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
        console.log('- API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
        console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
        
        // Normalize phone number FIRST (remove any non-digits)
        const normalizedPhone = String(phone || '').replace(/\D/g, '');
        console.log('📱 Phone Normalization:', { original: phone, normalized: normalizedPhone });
        console.log('📂 Total files received:', req.files ? Object.keys(req.files).length : 0);

        
        // Validate ALL required fields
        if (!name || !normalizedPhone || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Name, phone, and password are required'
            });
        }
        
        // Validate phone format
        if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid 10-digit phone number starting with 6-9'
            });
        }
        
        console.log('📞 Normalized phone:', normalizedPhone);
        
        if (!city || !availability) {
            return res.status(400).json({
                status: 'fail',
                message: 'City and availability are required'
            });
        }
        
        if (!licenseNumber || !licenseExpiry) {
            return res.status(400).json({
                status: 'fail',
                message: 'Driving license details are required'
            });
        }
        
        // Validate ALL required documents
        if (!files?.aadhaarFront || !files?.panCard || 
            !files?.drivingLicense || !files?.selfie) {
            return res.status(400).json({
                status: 'fail',
                message: 'All document photos are required (Aadhaar, PAN, License, Selfie)'
            });
        }
        
        // Check if phone already exists
        const existingDriver = await SpareDriver.findOne({ phone: normalizedPhone });
        if (existingDriver) {
            return res.status(409).json({
                status: 'fail',
                message: 'This phone number is already registered. Please sign in instead.'
            });
        }
        
        // Upload documents to Cloudinary FIRST
        const uploadFile = async (fileArray, docType) => {
            const filePath = fileArray[0].path;
            console.log(`📤 Uploading ${docType}:`, filePath);
            
            try {
                // Check if file exists
                const fs = require('fs');
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}`);
                }
                
                console.log(`📁 File exists, size: ${fs.statSync(filePath).size} bytes`);
                
                const result = await cloudinary.uploadImage(
                    filePath, 
                    `clean2wash/sparedrivers/pending/${normalizedPhone}`  // Use normalized phone
                );
                console.log(`✅ ${docType} uploaded to Cloudinary:`, result.secure_url);
                
                // Clean up temp file
                try { 
                    fs.unlinkSync(filePath); 
                    console.log(`🗑️ Temp file deleted: ${filePath}`);
                } catch (e) { 
                    console.warn('Could not delete temp file:', filePath);
                }
                
                return result.secure_url;
            } catch (uploadError) {
                console.error(`❌ ${docType} Cloudinary upload failed:`, uploadError.message);
                console.error('📋 Full error:', uploadError);
                
                // Fallback to local storage URL
                const path = require('path');
                const fileName = path.basename(filePath);
                const localUrl = `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${fileName}`;
                
                console.warn(`🔄 Using local storage fallback: ${localUrl}`);
                return localUrl;
            }
        };
        
        // Upload all documents
        const aadhaarFrontUrl = await uploadFile(files.aadhaarFront, 'Aadhaar Front');
        const aadhaarBackUrl = files.aadhaarBack 
            ? await uploadFile(files.aadhaarBack, 'Aadhaar Back') 
            : aadhaarFrontUrl;
        const panCardUrl = await uploadFile(files.panCard, 'PAN Card');
        const dlUrl = await uploadFile(files.drivingLicense, 'Driving License');
        const selfieUrl = await uploadFile(files.selfie, 'Selfie');
        
        // Optional police verification
        let policeVerificationUrl = '';
        if (files.policeVerification) {
            policeVerificationUrl = await uploadFile(files.policeVerification, 'Police Verification');
        }
        
        // Parse bank details
        const parsedBankDetails = typeof bankDetails === 'string' 
            ? JSON.parse(bankDetails) 
            : bankDetails || {};
        
        // Normalize availability to match model enum (Full-time, Part-time)
        let normalizedAvailability = 'Full-time'; // Default
        if (availability) {
            const lowerAvailability = availability.toLowerCase();
            console.log('🔍 Original availability:', availability);
            console.log('🔍 Lowercase availability:', lowerAvailability);
            
            if (lowerAvailability === 'full-time' || lowerAvailability === 'fulltime') {
                normalizedAvailability = 'Full-time';
            } else if (lowerAvailability === 'part-time' || lowerAvailability === 'parttime') {
                normalizedAvailability = 'Part-time';
            } else {
                console.warn('⚠️ Unknown availability value:', availability);
                normalizedAvailability = 'Full-time'; // Default fallback
            }
        }
        
        console.log('💾 Creating driver with complete data...');
        console.log('📋 Original availability:', availability);
        console.log('📋 Normalized availability:', normalizedAvailability);
        console.log('📋 Model expects: ["Full-time", "Part-time"]');
        
        // Get kit config
        const kitConfig = await getSpareDriverKitConfig();
        
        // Create driver with ALL data
        const newDriver = await SpareDriver.create({
            name,
            email: email || undefined,
            phone: normalizedPhone,  // Use normalized phone
            password,
            profile: {
                city,
                availability: normalizedAvailability,
                experience: experienceYears || 0,
            },
            bankDetails: {
                accountName: parsedBankDetails.accountName || '',
                accountNumber: parsedBankDetails.accountNumber || '',
                ifscCode: parsedBankDetails.ifscCode || '',
                bankName: parsedBankDetails.bankName || '',
                upiId: parsedBankDetails.upiId || ''
            },
            documents: {
                aadhaarCard: {
                    url: aadhaarFrontUrl,
                    frontUrl: aadhaarFrontUrl,
                    backUrl: aadhaarBackUrl,
                },
                panCard: { url: panCardUrl },
                drivingLicense: { url: dlUrl },
                selfie: { url: selfieUrl },
                policeVerification: { url: policeVerificationUrl }
            },
            // Set police verification status based on document upload
            policeVerification: policeVerificationUrl ? 'VERIFIED' : 'PENDING',
            status: 'PENDING',  // Ready for admin verification
            verificationStatus: 'PENDING',
            kit: {
                required: true,
                price: Number(kitConfig.kitPrice || 1499),
                paymentStatus: 'pending'
            }
        });

        
        console.log('✅ Driver created successfully:', newDriver._id);
        console.log('📋 Final driver data check:');
        console.log('- Phone:', newDriver.phone);
        console.log('- Availability:', newDriver.profile?.availability);
        console.log('- City:', newDriver.profile?.city);
        
        // Send notifications
        await Promise.all([
            sendSpareDriverNotification(newDriver._id, {
                title: 'Registration Submitted',
                message: 'Your application is under review. We will notify you within 24-48 hours.',
                type: 'verification',
                priority: 'high',
                actionUrl: '/spare-driver/dashboard',
                actionText: 'View Status'
            }),
            sendAdminNotification({
                title: 'New Driver Application',
                message: `${name} has submitted a complete application for verification.`,
                type: 'verification',
                priority: 'high',
                actionUrl: '/admin/drivers/verification',
                actionText: 'Review Application',
                metaData: { 
                    driverId: newDriver._id,
                    phone: normalizedPhone,  // Use normalized phone
                    city
                }
            })
        ]);
        
        const token = signToken(newDriver._id);
        
        res.status(201).json({
            status: 'success',
            message: 'Registration complete. Your application is under review.',
            token,
            data: {
                driver: {
                    ...newDriver.toObject(),
                    password: undefined
                }
            }
        });
    } catch (err) {
        console.error('❌ Complete registration error:', err);
        res.status(400).json({
            status: 'fail',
            message: err.message || 'Registration failed. Please try again.'
        });
    }
};

exports.sendSignupOTP = async (req, res) => {
    try {
        const { phone, userData = {} } = req.body || {};
        const normalizedPhone = String(phone || '').trim();

        if (!validateSignupPhone(normalizedPhone)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid 10-digit mobile number'
            });
        }

        if (!userData?.name || !userData?.password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Name and password are required before requesting OTP'
            });
        }

        const existingDriver = await SpareDriver.findOne({ phone: normalizedPhone });
        if (existingDriver) {
            return res.status(409).json({
                status: 'fail',
                message: 'This phone number is already registered. Please sign in instead.'
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        spareDriverSignupOTPStore.set(normalizedPhone, {
            otp,
            expiresAt: Date.now() + (10 * 60 * 1000),
            userData: {
                name: String(userData.name || '').trim(),
                email: String(userData.email || '').trim(),
                phone: normalizedPhone,
                password: String(userData.password || '')
            }
        });

        console.log(`🔢 Spare Driver Signup OTP for ${normalizedPhone}: ${otp}`);

        return res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully',
            data: {
                phone: normalizedPhone,
                otp,
                expiresInSeconds: 600
            }
        });
    } catch (err) {
        console.error('Spare driver sendSignupOTP error:', err);
        return res.status(500).json({ status: 'fail', message: 'Failed to send OTP. Please try again.' });
    }
};

exports.verifySignupOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body || {};
        const normalizedPhone = String(phone || '').trim();

        if (!validateSignupPhone(normalizedPhone) || !String(otp || '').trim()) {
            return res.status(400).json({
                status: 'fail',
                message: 'Phone number and OTP are required'
            });
        }

        const otpRecord = spareDriverSignupOTPStore.get(normalizedPhone);
        if (!otpRecord) {
            return res.status(400).json({
                status: 'fail',
                message: 'OTP expired or not requested. Please request a new OTP.'
            });
        }

        if (otpRecord.expiresAt < Date.now()) {
            spareDriverSignupOTPStore.delete(normalizedPhone);
            return res.status(400).json({
                status: 'fail',
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (String(otpRecord.otp) !== String(otp).trim()) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid OTP. Please try again.'
            });
        }

        const existingDriver = await SpareDriver.findOne({ phone: normalizedPhone });
        if (existingDriver) {
            spareDriverSignupOTPStore.delete(normalizedPhone);
            return res.status(409).json({
                status: 'fail',
                message: 'This phone number is already registered. Please sign in instead.'
            });
        }

        const pendingUserData = otpRecord.userData || {};
        const newDriver = await SpareDriver.create({
            name: pendingUserData.name,
            email: pendingUserData.email || undefined,
            phone: pendingUserData.phone,
            password: pendingUserData.password
        });

        spareDriverSignupOTPStore.delete(normalizedPhone);

        const token = signToken(newDriver._id);
        return res.status(201).json({
            status: 'success',
            message: 'Signup verified successfully',
            token,
            data: {
                token,
                driver: {
                    ...newDriver.toObject(),
                    password: undefined
                }
            }
        });
    } catch (err) {
        console.error('Spare driver verifySignupOTP error:', err);
        return res.status(500).json({ status: 'fail', message: 'Failed to verify OTP. Please try again.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Phone number and password are required'
            });
        }

        const driver = await SpareDriver.findOne({ phone }).select('+password');
        if (!driver) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid phone number or password'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, driver.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid phone number or password'
            });
        }

        if (['rejected', 'suspended'].includes(driver.status)) {
            return res.status(403).json({
                status: 'fail',
                message: driver.adminNote || 'Your account is not active. Please contact support.'
            });
        }

        const token = signToken(driver._id);
        driver.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: { driver }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Upload Documents (Cloudinary) ──
exports.uploadDocuments = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        if (!driverId) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized request' });
        }

        const files = req.files; // { aadhaarFront, aadhaarBack, panCard, drivingLicense, selfie }

        // Check required documents - allow aadhaarBack to fallback to aadhaarFront
        if (!files?.aadhaarFront || !files?.panCard || !files?.drivingLicense || !files?.selfie) {
            return res.status(400).json({
                status: 'fail',
                message: 'Required documents missing: aadhaarFront, panCard, drivingLicense, selfie'
            });
        }

        // Use aadhaarFront for both sides if aadhaarBack is missing
        if (!files.aadhaarBack && files.aadhaarFront) {
            files.aadhaarBack = files.aadhaarFront;
            console.log('📋 Using aadhaarFront for both sides (aadhaarBack missing)');
        }

        // Upload to Cloudinary
        const uploadFile = async (fileArray) => {
            const filePath = fileArray[0].path;
            console.log('🔍 Attempting Cloudinary upload for:', filePath);
            console.log('📁 File exists:', require('fs').existsSync(filePath));
            
            try {
                const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}`);
                console.log('✅ Cloudinary upload SUCCESS:', result.secure_url);
                try { fs.unlinkSync(filePath); } catch (e) { }
                return result.secure_url;
            } catch (uploadError) {
                console.error('❌ Cloudinary upload FAILED:', uploadError.message);
                console.error('📋 Full error:', uploadError);
                console.warn('🔄 Falling back to local spare driver document storage');
                return `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${path.basename(filePath)}`;
            }
        };

        const aadhaarFrontUrl = await uploadFile(files.aadhaarFront);
        const aadhaarBackUrl = await uploadFile(files.aadhaarBack);
        const panCardUrl = await uploadFile(files.panCard);
        const dlUrl = await uploadFile(files.drivingLicense);
        const selfieUrl = await uploadFile(files.selfie);

        const kitConfig = await getSpareDriverKitConfig();

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            {
                'documents.aadhaarCard.url': aadhaarFrontUrl,
                'documents.aadhaarCard.frontUrl': aadhaarFrontUrl,
                'documents.aadhaarCard.backUrl': aadhaarBackUrl,
                'documents.panCard.url': panCardUrl,
                'documents.drivingLicense.url': dlUrl,
                'documents.selfie.url': selfieUrl,
                'verification.policeStatus': 'pending',
                'kit.required': true,
                'kit.price': Number(kitConfig.kitPrice || DRIVER_KIT_PRICE),
                'kit.paymentStatus': 'pending',
                status: 'pending_verification'
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Documents uploaded to cloud. Pending admin verification.',
            data: { driver }
        });

        await Promise.all([
            sendSpareDriverNotification(driverId, {
                title: 'Documents Submitted',
                message: 'Your KYC documents are under review. We will notify you once verification is complete.',
                type: 'verification',
                priority: 'high',
                actionUrl: '/spare-driver/profile',
                actionText: 'View Profile',
                metaData: { status: 'pending_verification' }
            }),
            sendAdminNotification({
                title: 'Spare Driver Review Pending',
                message: `${driver?.name || 'A spare driver'} has submitted documents for verification.`,
                type: 'verification',
                priority: 'high',
                actionUrl: '/admin/spare-drivers',
                actionText: 'Review Driver',
                metaData: { driverId, status: 'pending_verification' }
            })
        ]);
    } catch (err) {
        console.error('Doc Upload Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get own profile ──
exports.getProfile = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        let driver = await SpareDriver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        await applyMonthlyKitRecovery(driver);
        driver = await SpareDriver.findById(driverId);

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(404).json({ status: 'fail', message: 'Driver not found' });
    }
};

exports.getDutyStats = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId).select('name driverId dutyHours onlineStatus breaks fatigueAlerts availabilitySlots');
        
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        // Calculate summary using model methods if available, otherwise manual
        const summary = typeof driver.getDutySummary === 'function' ? driver.getDutySummary() : {
            todayMinutes: driver.dutyHours?.today?.totalMinutes || 0,
            weeklyMinutes: driver.dutyHours?.weekly?.totalMinutes || 0,
            isOverworked: driver.dutyHours?.status?.isOverworked || false,
            needsBreak: driver.dutyHours?.status?.needsBreak || false,
            currentSessionMinutes: driver.onlineStatus?.isOnline && driver.onlineStatus?.sessionStart 
                ? Math.floor((Date.now() - driver.onlineStatus.sessionStart) / 60000)
                : 0
        };

        res.status(200).json({
            status: 'success',
            data: {
                summary,
                dutyHours: driver.dutyHours,
                onlineStatus: driver.onlineStatus,
                availabilitySlots: driver.availabilitySlots || [],
                fatigueAlerts: driver.fatigueAlerts?.filter(a => !a.acknowledged) || []
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.updateAvailability = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { availabilitySlots } = req.body;

        if (!Array.isArray(availabilitySlots)) {
            return res.status(400).json({ status: 'fail', message: 'Availability slots must be an array' });
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            { availabilitySlots },
            { new: true, runValidators: true }
        );

        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                availabilitySlots: driver.availabilitySlots
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getKitConfig = async (req, res) => {
    try {
        const kitConfig = await getSpareDriverKitConfig();
        return res.status(200).json({
            status: 'success',
            data: { kitConfig }
        });
    } catch (err) {
        return res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getPremiumConfig = async (req, res) => {
    try {
        const premiumConfig = await getSpareDriverPremiumConfig();
        return res.status(200).json({
            status: 'success',
            data: { premiumConfig }
        });
    } catch (err) {
        return res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getKitPaymentKey = async (req, res) => {
    try {
        if (!razorpay || !razorpay.key_id) {
            return res.status(500).json({ status: 'fail', message: 'Payment gateway not configured' });
        }

        return res.status(200).json({
            status: 'success',
            data: {
                key_id: razorpay.key_id
            }
        });
    } catch (err) {
        return res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.createKitPaymentOrder = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId);

        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const normalizedStatus = String(driver.status || '').toLowerCase();
        const normalizedKitPaymentStatus = String(driver?.kit?.paymentStatus || '').toLowerCase();
        const kitAlreadyCompleted = String(driver?.kitStatus || '').toUpperCase() === 'COMPLETED'
            || ['verified', 'under_review'].includes(normalizedKitPaymentStatus);

        if (kitAlreadyCompleted) {
            return res.status(400).json({ status: 'fail', message: 'Kit payment is already completed for this account' });
        }

        if (!['verified_pending_kit', 'kit_payment_pending', 'active'].includes(normalizedStatus)) {
            return res.status(400).json({ status: 'fail', message: 'Kit payment is available only after verification approval' });
        }

        if (!razorpay) {
            return res.status(500).json({ status: 'fail', message: 'Payment gateway not configured' });
        }

        const kitConfig = await getSpareDriverKitConfig();
        const amount = Number(kitConfig.kitPrice || DRIVER_KIT_PRICE);
        const safeReceipt = `sdk_${driver._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: safeReceipt,
            payment_capture: 1,
            notes: {
                driverId: driver._id.toString(),
                purpose: 'driver_kit'
            }
        });

        driver.kit = {
            ...(driver.kit || {}),
            required: true,
            price: amount,
            razorpayOrderId: order.id
        };
        await driver.save();

        return res.status(200).json({
            status: 'success',
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                kitPrice: amount
            }
        });
    } catch (err) {
        console.error('Create Kit Payment Order Error:', err);
        return res.status(400).json({
            status: 'fail',
            message: err?.error?.description || err?.description || err?.message || 'Could not create kit payment order'
        });
    }
};

exports.verifyKitPayment = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: 'fail', message: 'All payment details are required' });
        }

        const driver = await SpareDriver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || 'GkxKRQ2B0U63BKBoayuugS3D';
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ status: 'fail', message: 'Invalid payment signature' });
        }

        const kitConfig = await getSpareDriverKitConfig();

        driver.kit = {
            ...(driver.kit || {}),
            required: true,
            price: Number(driver.kit?.price || kitConfig.kitPrice || DRIVER_KIT_PRICE),
            paymentStatus: 'verified', // Automatically verify since signature is valid
            paymentReference: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            paidAt: new Date()
        };

        // Automatically activate the driver after payment
        driver.status = 'ACTIVE';
        driver.kitStatus = 'COMPLETED';
        driver.verificationStatus = 'APPROVED'; 
        driver.isVerified = true; 

        // ✅ AUTO-ASSIGN DEFAULT SERVICES
        // This ensures the driver doesn't have an empty portfolio after activation
        if (!driver.allowedServices || driver.allowedServices.length === 0) {
            driver.allowedServices = [
                { type: 'point', isActive: true, rating: 5.0 },
                { type: 'hourly', isActive: true, rating: 5.0 }
            ];
            driver.preferredServices = ['point', 'hourly'];
        }
        
        await driver.save();

        await Promise.all([
            sendSpareDriverNotification(driver._id, {
                title: '🎉 Account Activated!',
                message: 'Your kit payment was verified successfully. Your account is now ACTIVE and you can start accepting requests.',
                type: 'verification',
                priority: 'high',
                actionUrl: '/spare-driver/dashboard',
                actionText: 'Go Online',
                metaData: { status: 'ACTIVE', paymentId: razorpay_payment_id }
            }),
            sendAdminNotification({
                title: 'Kit Payment Received',
                message: `${driver.name || 'A spare driver'} completed kit payment and is waiting for final activation.`,
                type: 'payment',
                priority: 'high',
                actionUrl: '/admin/spare-drivers/verification',
                actionText: 'Approve Driver',
                metaData: { driverId, status: 'kit_payment_pending', paymentId: razorpay_payment_id }
            })
        ]);

        return res.status(200).json({
            status: 'success',
            message: 'Kit payment verified successfully',
            data: { driver }
        });
    } catch (err) {
        console.error('Verify Kit Payment Error:', err);
        return res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.submitKitPaymentProof = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { paymentReference } = req.body || {};
        const files = req.files || {};

        const driver = await SpareDriver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (driver.status !== 'verified_pending_kit' && driver.status !== 'kit_payment_pending') {
            return res.status(400).json({ status: 'fail', message: 'Kit payment can only be submitted after verification approval' });
        }

        if (!files?.paymentProof?.[0]) {
            return res.status(400).json({ status: 'fail', message: 'Upload kit payment proof to continue' });
        }

        const filePath = files.paymentProof[0].path;
        let paymentProofUrl = '';
        try {
            const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}/kit-payment`);
            try { fs.unlinkSync(filePath); } catch (e) {}
            paymentProofUrl = result.secure_url;
        } catch (uploadError) {
            console.warn('Falling back to local kit payment proof storage:', uploadError.message);
            paymentProofUrl = `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${path.basename(filePath)}`;
        }

        const kitConfig = await getSpareDriverKitConfig();

        driver.kit = {
            ...(driver.kit || {}),
            required: true,
            price: Number(driver.kit?.price || kitConfig.kitPrice || DRIVER_KIT_PRICE),
            paymentStatus: 'under_review',
            paymentProofUrl,
            paymentReference: paymentReference || '',
            paidAt: new Date()
        };
        driver.status = 'kit_payment_pending'; driver.kitStatus = 'PENDING';
        await driver.save();

        await Promise.all([
            sendSpareDriverNotification(driver._id, {
                title: 'Kit Payment Submitted',
                message: 'Your kit payment proof is under review. We will activate your dashboard after admin confirmation.',
                type: 'verification',
                priority: 'high',
                actionUrl: '/spare-driver/register',
                actionText: 'Track Status',
                metaData: { status: 'kit_payment_pending' }
            }),
            sendAdminNotification({
                title: 'Kit Payment Review Pending',
                message: `${driver.name || 'A spare driver'} submitted kit payment proof for activation.`,
                type: 'verification',
                priority: 'high',
                actionUrl: '/admin/spare-drivers',
                actionText: 'Review Driver',
                metaData: { driverId, status: 'kit_payment_pending' }
            })
        ]);

        return res.status(200).json({
            status: 'success',
            message: 'Kit payment proof submitted successfully',
            data: { driver }
        });
    } catch (err) {
        console.error('Kit Payment Proof Error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.submitInquiry = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { category = 'general', subject = '', message = '' } = req.body || {};

        if (!String(subject).trim() || !String(message).trim()) {
            return res.status(400).json({ status: 'fail', message: 'Subject and message are required' });
        }

        const driver = await SpareDriver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const inquiry = {
            category,
            subject: String(subject).trim(),
            message: String(message).trim(),
            status: 'open',
            createdAt: new Date()
        };

        driver.inquiries = [inquiry, ...(driver.inquiries || [])].slice(0, 20);
        await driver.save();

        const latestInquiry = driver.inquiries[0];

        await Promise.all([
            sendSpareDriverNotification(driver._id, {
                title: 'Inquiry Sent',
                message: 'Your inquiry has been shared with admin. We will notify you once there is an update.',
                type: 'system',
                priority: 'medium',
                actionUrl: '/spare-driver/inquiry',
                actionText: 'Open Inquiry Desk',
                metaData: { inquiryId: latestInquiry?._id?.toString?.() || '' }
            }),
            sendAdminNotification({
                title: 'Driver Inquiry Received',
                message: `${driver.name || 'A spare driver'} raised a ${category} inquiry: ${String(subject).trim()}`,
                type: 'system',
                priority: 'high',
                actionUrl: '/admin/spare-drivers/drivers',
                actionText: 'Open Driver Desk',
                metaData: { driverId: driver._id.toString(), inquiryId: latestInquiry?._id?.toString?.() || '' }
            })
        ]);

        return res.status(200).json({
            status: 'success',
            message: 'Inquiry submitted successfully',
            data: { inquiries: driver.inquiries || [] }
        });
    } catch (err) {
        console.error('Driver Inquiry Error:', err);
        return res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Admin: List all drivers (with optional status filter) ──
exports.adminListDrivers = async (req, res) => {
    try {
        const { status, scope = 'assigned' } = req.query;
        const adminId = req.admin?._id;
        const adminLevel = getAdminRoleLevel(req.admin);
        const isSuperAdmin = adminLevel === 1;

        await runVerificationQueueAutoAssignment();

        const filter = getQueueScopeFilter(status);
        const canReview = await hasReviewCapability(req.admin);

        if (canReview && !isSuperAdmin && scope !== 'all') {
            filter['verificationQueue.assignedAdmin'] = adminId;
        }

        const drivers = await SpareDriver.find(filter)
            .select('-password')
            .populate('verificationQueue.assignedAdmin', 'name email')
            .sort({ createdAt: -1 });

        const queuedDrivers = drivers.filter((driver) => isVerificationQueueCandidate(driver));
        const activeWorkload = await SpareDriver.countDocuments({
            status: { $nin: ['active', 'ACTIVE', 'rejected', 'REJECTED', 'suspended', 'SUSPENDED'] },
            'verificationQueue.assignedAdmin': adminId
        });

        res.status(200).json({
            status: 'success',
            results: drivers.length,
            data: {
                drivers,
                queue: {
                    queuedCount: queuedDrivers.length,
                    assignedToMe: activeWorkload,
                    canViewGlobal: isSuperAdmin
                }
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.adminRebalanceVerificationQueue = async (req, res) => {
    try {
        const assignedCount = await runVerificationQueueAutoAssignment();
        return res.status(200).json({
            status: 'success',
            message: assignedCount > 0
                ? `Verification queue rebalanced. ${assignedCount} driver(s) assigned.`
                : 'Verification queue already balanced.',
            data: { assignedCount }
        });
    } catch (err) {
        return res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Admin: Verify / Reject a driver ──
exports.adminVerifyDriver = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const kitConfig = await getSpareDriverKitConfig();
        const allowed = ['verified_pending_kit', 'active', 'rejected', 'suspended'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid status' });
        }

        const existingDriver = await SpareDriver.findById(req.params.id);
        if (!existingDriver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const adminLevel = getAdminRoleLevel(req.admin);
        const isSuperAdmin = adminLevel === 1;
        const assignedReviewerId = existingDriver.verificationQueue?.assignedAdmin?.toString?.() || '';
        const actingAdminId = req.admin?._id?.toString?.() || '';
        if (assignedReviewerId && !isSuperAdmin && assignedReviewerId !== actingAdminId) {
            return res.status(403).json({
                status: 'fail',
                message: 'This verification request is assigned to another admin.'
            });
        }

        if (
            status === 'verified_pending_kit'
            && (
                !existingDriver.documents?.aadhaarCard?.frontUrl
                || !existingDriver.documents?.aadhaarCard?.backUrl
                || !existingDriver.documents?.panCard?.url
                || !existingDriver.documents?.drivingLicense?.url
                || !existingDriver.documents?.selfie?.url
            )
        ) {
            return res.status(400).json({ status: 'fail', message: 'Driver documents are incomplete. Aadhaar, PAN, driving license and selfie are required before approval.' });
        }

        if (
            status === 'active'
            && existingDriver.kit?.required !== false
            && existingDriver.status !== 'active'
            && !['under_review', 'verified'].includes(existingDriver.kit?.paymentStatus)
        ) {
            return res.status(400).json({ status: 'fail', message: 'Kit payment must be submitted before final activation' });
        }

        const update = { status, adminNote };
        if (status !== 'active') {
            update.isOnline = false;
        }

        if (status === 'verified_pending_kit') {
            update['kit.required'] = true;
            update['kit.price'] = Number(kitConfig.kitPrice || DRIVER_KIT_PRICE);
            update['kit.paymentStatus'] = 'pending';
            update.verificationStatus = 'APPROVED';
            update['verificationQueue.assignedAdmin'] = req.admin?._id || null;
            update['verificationQueue.assignedAt'] = existingDriver.verificationQueue?.assignedAt || new Date();
            update['verificationQueue.releasedAt'] = null;
            update['verificationQueue.assignmentSource'] = existingDriver.verificationQueue?.assignmentSource || 'auto';
        }

        if (status === 'active') {
            const now = new Date();
            const existingRecovery = existingDriver.onboardingRecovery || {};
            update['kit.required'] = true;
            update['kit.paymentStatus'] = 'verified';
            update['kit.verifiedAt'] = now;
            update.kitStatus = 'COMPLETED';
            update.verificationStatus = 'APPROVED';
            update.isVerified = true;
            update['verificationQueue.assignedAdmin'] = null;
            update['verificationQueue.assignedAt'] = null;
            update['verificationQueue.releasedAt'] = new Date();
            update['verificationQueue.assignmentSource'] = 'auto';
            update.onboardingRecovery = {
                enabled: Number(kitConfig.monthlyDeductionAmount || 0) > 0 && Number(kitConfig.monthlyDeductionMonths || 0) > 0,
                monthlyDeductionAmount: Number(kitConfig.monthlyDeductionAmount || 0),
                totalMonths: Number(kitConfig.monthlyDeductionMonths || 0),
                monthsDeducted: Number(existingRecovery.monthsDeducted || 0),
                pendingAmount: Number(existingRecovery.pendingAmount || 0),
                lastDeductedAt: existingRecovery.lastDeductedAt || null,
                startedAt: existingRecovery.startedAt || now,
                nextDeductionAt: existingRecovery.nextDeductionAt || now
            };
        }

        if (status === 'rejected') {
            // Document rejection doesn't necessarily mean PVR is rejected
            update.verificationStatus = 'REJECTED';
            update.isVerified = false;
            update['verificationQueue.assignedAdmin'] = null;
            update['verificationQueue.assignedAt'] = null;
            update['verificationQueue.releasedAt'] = new Date();
            update['verificationQueue.assignmentSource'] = 'auto';
        }

        if (status === 'suspended') {
            update['verificationQueue.assignedAdmin'] = null;
            update['verificationQueue.assignedAt'] = null;
            update['verificationQueue.releasedAt'] = new Date();
            update['verificationQueue.assignmentSource'] = 'auto';
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        // 🛡️ Audit Log: Driver Verification
        try {
            await AuditLog.create({
                userId: req.user?._id || req.auth?.id,
                action: 'VERIFY_DRIVER',
                resource: 'SPAREDDRIVER',
                resourceId: driver._id,
                oldValue: { status: existingDriver.status },
                newValue: { status: driver.status },
                metadata: {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    adminNote: update.adminNote
                }
            });
        } catch (auditErr) {
            console.error('Audit Log failed:', auditErr.message);
        }

        const io = getSocketIO();
        if (io) {
            io.to(driver._id.toString()).emit('driver_verification_updated', {
                driverId: driver._id,
                status: driver.status,
                adminNote: driver.adminNote
            });
        }

        await sendSpareDriverNotification(driver._id, {
            title: status === 'active' ? 'Account Activated' : status === 'verified_pending_kit' ? 'Verification Approved' : 'Verification Updated',
            message: status === 'active'
                ? 'Your spare driver account is live now. Go online to receive bookings.'
                : status === 'verified_pending_kit'
                    ? `Your verification is complete. Pay ₹${driver.kit?.price || DRIVER_KIT_PRICE} for the starter kit to unlock your dashboard.`
                : (adminNote || `Your account status has been updated to ${status}.`),
            type: 'verification',
            priority: status === 'active' ? 'high' : 'medium',
            actionUrl: status === 'active' ? '/spare-driver/dashboard' : '/spare-driver/register',
            actionText: status === 'active' ? 'Open Dashboard' : 'Continue Activation',
            metaData: { status, adminNote: adminNote || '' }
        });

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get Bookings assigned to this spare driver ──
exports.getBookings = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId).select('status isOnline');
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        const bookingQuery = {
            isActive: true,
            status: { $nin: ['completed', 'cancelled', 'refunded'] },
            $or: [
                {
                    'provider.id': driverId,
                    'provider.type': 'sparedriver'
                }
            ]
        };

        if (driver.status === 'active' && driver.isOnline) {
            bookingQuery.$or.push({
                status: 'pending',
                'service.type': 'sparedriver',
                'provider.id': null
            });
        }

        const bookings = await Booking.find(bookingQuery)
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ createdAt: -1 });

        const filteredBookings = bookings.filter((booking) => {
            if (booking.status !== 'pending') return true;

            const assignedDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || '';
            if (assignedDriverId === driverId.toString()) return true;

            return !hasDriverRejectedBooking(booking, driverId) && isDispatchReadySchedule(booking.schedule);
        });

        res.status(200).json({
            status: 'success',
            data: { bookings: filteredBookings }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Get Trip History (Completed/Cancelled) ──
exports.getTripHistory = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const bookings = await Booking.find({
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['completed', 'cancelled'] }
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .sort({ updatedAt: -1 });

        // ✅ Format response to include customer reviews
        const formattedBookings = bookings.map(booking => ({
            ...booking.toObject(),
            customerReview: booking.feedback ? {
                rating: booking.feedback.rating,
                review: booking.feedback.review,
                photos: booking.feedback.photos,
                submittedAt: booking.feedback.submittedAt
            } : null
        }));

        res.status(200).json({
            status: 'success',
            data: { bookings: formattedBookings }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Accept a booking ──
// 🛡️ RACE CONDITION FIX: Atomic booking assignment with optimistic locking
exports.acceptBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const driverId = getDriverIdFromRequest(req);
        // ✅ ELITE SELECTION: Get all necessary driver details for the consumer
        const driver = await SpareDriver.findById(driverId)
            .select('name phone status isOnline selfie reliabilityScore driverId')
            .session(session);

        if (!driver) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (!isDriverOperational(driver)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                status: 'fail',
                message: 'Complete verification before accepting trips'
            });
        }

        if (!driver.isOnline) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                status: 'fail',
                message: 'Go online before accepting a booking'
            });
        }

        // 🛡️ ATOMIC UPDATE: Use findOneAndUpdate with strict conditions to prevent race conditions
        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                isActive: true,
                'service.type': 'sparedriver',
                status: 'pending',
                $or: [
                    { 'provider.id': null },
                    { 'provider.id': { $exists: false } }
                ]
            },
            {
                $set: {
                    status: 'en_route',
                    'provider.id': driverId,
                    'provider.type': 'sparedriver',
                    'provider.model': 'SpareDriver',
                    'provider.name': driver.name || '',
                    'provider.phone': driver.phone || '',
                    'provider.photo': driver.selfie || '', // ✅ Driver Photo revealed to Consumer
                    'provider.rating': (driver.reliabilityScore?.score / 20) || 5, // ✅ Convert 100-scale to 5-star
                    'tracking.assignedAt': new Date()
                },
                $inc: { __v: 1 }
            },
            { 
                new: true,
                session,
                runValidators: true
            }
        ).populate('consumer', 'name phone profilePicture'); // ✅ POPULATE: Give Consumer info to Driver

        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ 
                status: 'fail', 
                message: 'Booking not available - another driver has already accepted this trip' 
            });
        }

        appendBookingActivityLog(booking, 'sparedriver_accepted', 'Booking accepted by spare driver.', {
            driverId: driverId.toString()
        });
        await booking.save({ validateBeforeSave: false, session });

        // Commit transaction before socket/notification operations
        await session.commitTransaction();
        session.endSession();

        // 🛡️ Elite Handover Protocol: Reveal OTP to Consumer via Socket
        try {
            const io = getSocketIO();
            if (io) {
                // 1. Notify Consumer Room (Private)
                io.to(booking.consumer.toString()).emit('otp_revealed', {
                    bookingId: booking._id,
                    pin: booking.securityPin
                });

                // 2. Notify Booking Room (Sync UI)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: 'en_route',
                    pin: booking.securityPin // Also include in status update for immediate reveal
                });
            }
        } catch (socketErr) {
            console.error('Handover Pulse Failed:', socketErr.message);
        }

        await sendSpareDriverNotification(driverId, {
            title: 'Booking Accepted',
            message: `You accepted booking ${booking.bookingId || booking._id}. Head to the pickup point now.`,
            type: 'booking',
            priority: 'high',
            actionUrl: '/spare-driver/bookings',
            actionText: 'Open Booking',
            metaData: {
                bookingId: booking._id.toString(),
                status: 'en_route'
            }
        });

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Accept booking error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Update live location (Throttled for battery) ──
exports.rejectBooking = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { reason } = req.body || {};

        const driver = await SpareDriver.findById(driverId).select('status isOnline');
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (!isDriverOperational(driver) || !driver.isOnline) {
            return res.status(403).json({
                status: 'fail',
                message: 'Go online with an approved account before rejecting trip requests'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: 'pending'
        }).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found or no longer available' });
        }

        if (hasDriverRejectedBooking(booking, driverId)) {
            return res.status(200).json({
                status: 'success',
                message: 'Booking already rejected for this driver',
                data: { booking }
            });
        }

        appendBookingActivityLog(
            booking,
            'sparedriver_rejected',
            reason || 'Booking rejected by spare driver.',
            {
                driverId: driverId.toString(),
                reason: reason || 'Rejected by spare driver'
            }
        );

        const dispatch = await broadcastBookingToDrivers(booking, {
            excludeDriverIds: [driverId],
            reason: 'driver_rejected',
            notificationMessage: 'A chauffeur request has been reassigned near your location.'
        });

        const io = getSocketIO();
        if (io) {
            io.to(booking._id.toString()).emit('booking_status_updated', {
                bookingId: booking._id,
                status: 'pending',
                message: dispatch.driverCount > 0
                    ? 'Your driver request has been reassigned to another nearby driver.'
                    : 'A driver declined the request. We are still searching for another driver.',
                dispatchState: 'reassigning'
            });
        }

        await Promise.all([
            sendSpareDriverNotification(driverId, {
                title: 'Request Rejected',
                message: 'This request was removed from your queue.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View More Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'rejected'
                }
            }),
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Searching Another Driver',
                message: dispatch.driverCount > 0
                    ? 'A nearby driver is reviewing your request now.'
                    : 'One driver declined your request. We are still searching nearby.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Track Search',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'reassigning'
                }
            })
        ]);

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Booking rejected and reassigned successfully'
                : 'Booking rejected. No alternate drivers found yet.',
            data: {
                booking,
                dispatch
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminUpdatePremiumVerification = async (req, res) => {
    try {
        const { action, reason = '' } = req.body || {};
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid premium action' });
        }

        const driver = await SpareDriver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        if (!driver.documents?.policeVerification?.url) {
            return res.status(400).json({ status: 'fail', message: 'Police verification document is not uploaded yet' });
        }

        const oldPoliceStatus = driver.verification?.policeStatus || 'pending';
        driver.verification = driver.verification || {};
        driver.verification.policeStatus = action === 'approve' ? 'approved' : 'rejected';
        driver.verification.isPremium = action === 'approve';
        
        if (action === 'approve') {
            driver.verification.policeVerifiedAt = new Date();
        }
        driver.adminNote = reason || driver.adminNote || '';
        await driver.save({ validateBeforeSave: false });

        // 🛡️ Audit Log: Premium Status
        try {
            await AuditLog.create({
                userId: req.user?._id || req.auth?.id,
                action: 'UPDATE_PREMIUM_STATUS',
                resource: 'SPAREDDRIVER',
                resourceId: driver._id,
                oldValue: { policeStatus: oldPoliceStatus, isPremium: !driver.verification.isPremium },
                newValue: { policeStatus: driver.verification.policeStatus, isPremium: driver.verification.isPremium },
                metadata: {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    reason: reason
                }
            });
        } catch (auditErr) {
            console.error('Audit Log failed:', auditErr.message);
        }

        await sendSpareDriverNotification(driver._id, {
            title: action === 'approve' ? 'Premium Badge Approved' : 'Premium Verification Rejected',
            message: action === 'approve'
                ? 'Your police verification is approved. Premium badge is now active.'
                : (reason || 'Your premium verification was rejected. Please re-upload valid police documents.'),
            type: 'verification',
            priority: 'high',
            actionUrl: '/spare-driver/premium',
            actionText: 'Open Premium',
            metaData: {
                action,
                policeStatus: driver.verification.policeStatus
            }
        });

        return res.status(200).json({
            status: 'success',
            message: action === 'approve' ? 'Premium verification approved' : 'Premium verification rejected',
            data: { driver }
        });
    } catch (err) {
        return res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminAssignBooking = async (req, res) => {
    try {
        const { driverId, adminNote } = req.body || {};

        if (!driverId) {
            return res.status(400).json({ status: 'fail', message: 'A spare driver must be selected' });
        }

        const [booking, nextDriver] = await Promise.all([
            populateAdminBooking(Booking.findOne({
                _id: req.params.id,
                isActive: true,
                'service.type': 'sparedriver',
                status: { $nin: ['completed', 'cancelled', 'refunded'] }
            })),
            SpareDriver.findById(driverId).select('name phone status isOnline currentLocation')
        ]);

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        if (!nextDriver || nextDriver.status !== 'active' || !nextDriver.isOnline) {
            return res.status(400).json({
                status: 'fail',
                message: 'Only verified online spare drivers can be manually assigned'
            });
        }

        if (booking.status === 'active') {
            return res.status(400).json({
                status: 'fail',
                message: 'An active trip cannot be reassigned from admin desk'
            });
        }

        const previousDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || '';
        const isSameDriver = previousDriverId && previousDriverId === driverId.toString();

        booking.provider = {
            type: 'sparedriver',
            model: 'SpareDriver',
            id: nextDriver._id,
            name: nextDriver.name,
            phone: nextDriver.phone,
            photo: ''
        };
        booking.status = 'pending';
        booking.tracking = booking.tracking || {};
        booking.tracking.assignedAt = new Date();
        appendInternalAdminNote(booking, adminNote);
        appendBookingActivityLog(
            booking,
            isSameDriver ? 'admin_reconfirmed_driver' : 'admin_assigned_driver',
            isSameDriver
                ? 'Admin reconfirmed the current spare driver assignment.'
                : 'Admin manually assigned a spare driver to the booking.',
            {
                driverId: nextDriver._id.toString(),
                driverName: nextDriver.name,
                adminNote: adminNote || ''
            }
        );
        await booking.save({ validateBeforeSave: false });

        if (previousDriverId && previousDriverId !== nextDriver._id.toString()) {
            await sendSpareDriverNotification(previousDriverId, {
                title: 'Trip Reassigned',
                message: `Booking ${booking.bookingId || booking._id} has been reassigned by admin.`,
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'Open Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'reassigned'
                }
            });
        }

        await Promise.all([
            sendSpareDriverNotification(nextDriver._id, {
                title: 'Admin Assignment',
                message: 'A chauffeur trip has been reserved for you. Review and accept the booking.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver/bookings',
                actionText: 'Open Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'manual_assignment'
                }
            }),
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Driver Reserved',
                message: 'Our operations team has reserved a verified driver for your trip. Final acceptance is in progress.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Track Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'pending',
                    dispatchState: 'manual_assignment'
                }
            })
        ]);

        emitAdminBookingRefresh(booking, {
            message: 'Admin reserved a driver for this booking.',
            dispatchState: 'manual_assignment',
            adminAction: 'assign_driver'
        });

        const refreshedBooking = await populateAdminBooking(Booking.findById(booking._id));

        res.status(200).json({
            status: 'success',
            message: 'Driver assigned successfully',
            data: { booking: refreshedBooking }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminReleaseBooking = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        if (booking.status === 'active') {
            return res.status(400).json({
                status: 'fail',
                message: 'An active trip cannot be returned to the queue'
            });
        }

        const previousDriverId = booking.provider?.id?._id?.toString?.() || booking.provider?.id?.toString?.() || null;
        const dispatch = await releaseBookingBackToPool({
            booking,
            driverId: previousDriverId || 'admin',
            reason: reason || 'Admin released this trip back to the queue.',
            releaseStatus: 'admin_released'
        });
        appendInternalAdminNote(booking, reason);
        await booking.save({ validateBeforeSave: false });

        if (previousDriverId) {
            await sendSpareDriverNotification(previousDriverId, {
                title: 'Trip Released by Admin',
                message: 'Operations removed this booking from your active queue.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'released'
                }
            });
        }

        emitAdminBookingRefresh(booking, {
            message: dispatch.driverCount > 0
                ? 'Admin returned this trip to the nearby driver pool.'
                : 'Admin released this trip, but no alternate drivers are online right now.',
            dispatchState: 'reassigning',
            adminAction: 'release_booking'
        });

        const refreshedBooking = await populateAdminBooking(Booking.findById(booking._id));

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Booking released and reassignment started'
                : 'Booking released. No alternate drivers found yet.',
            data: { booking: refreshedBooking, dispatch }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminCancelBooking = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver',
            status: { $nin: ['completed', 'cancelled', 'refunded'] }
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        booking.status = 'cancelled';
        appendInternalAdminNote(booking, reason || 'Booking cancelled by admin operations.');
        appendBookingActivityLog(booking, 'admin_cancelled', 'Booking cancelled by admin desk.', {
            reason: reason || 'Cancelled by admin'
        });
        await processAdminCancellationRefund(booking, reason);
        await booking.save({ validateBeforeSave: false });

        await Promise.all([
            sendNotification(booking.consumer?._id || booking.consumer, {
                title: 'Trip Cancelled by Support',
                message: reason || 'Your spare driver booking was cancelled by our operations team.',
                type: 'booking',
                priority: 'high',
                actionUrl: '/spare-driver',
                actionText: 'Review Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'cancelled'
                }
            }),
            booking.provider?.id ? sendSpareDriverNotification(booking.provider.id._id || booking.provider.id, {
                title: 'Trip Cancelled',
                message: 'Operations cancelled this booking. No further action is needed.',
                type: 'booking',
                priority: 'medium',
                actionUrl: '/spare-driver/bookings',
                actionText: 'View Jobs',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: 'cancelled'
                }
            }) : Promise.resolve()
        ]);

        emitAdminBookingRefresh(booking, {
            message: reason || 'Booking cancelled by support.',
            adminAction: 'cancel_booking'
        });

        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully',
            data: { booking }
        });
    } catch (err) {
        console.error('Admin chauffeur cancellation failed:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.adminUpdateBookingIssue = async (req, res) => {
    try {
        const { issueId, status, adminNote } = req.body || {};
        const allowedStatuses = ['open', 'investigating', 'resolved', 'dismissed'];

        if (!issueId || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Issue id and a valid issue status are required'
            });
        }

        const booking = await populateAdminBooking(Booking.findOne({
            _id: req.params.id,
            isActive: true,
            'service.type': 'sparedriver'
        }));

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found' });
        }

        const issue = booking.issues?.id(issueId) || booking.issues?.find((entry) => entry._id?.toString() === issueId);
        if (!issue) {
            return res.status(404).json({ status: 'fail', message: 'Issue not found' });
        }

        issue.status = status;
        appendInternalAdminNote(
            booking,
            adminNote
                ? `Issue ${issueId.slice(-6)} marked ${status}. ${adminNote}`
                : `Issue ${issueId.slice(-6)} marked ${status}.`
        );
        appendBookingActivityLog(booking, 'admin_issue_updated', 'Admin updated a chauffeur booking issue.', {
            issueId,
            issueType: issue.type,
            status,
            adminNote: adminNote || ''
        });
        await booking.save({ validateBeforeSave: false });

        await sendNotification(booking.consumer?._id || booking.consumer, {
            title: status === 'resolved' ? 'Issue Resolved' : 'Support Ticket Updated',
            message: status === 'resolved'
                ? 'Our support team resolved your chauffeur trip issue.'
                : `Your chauffeur trip issue is now marked as ${status}.`,
            type: 'support',
            priority: 'medium',
            actionUrl: '/spare-driver/support',
            actionText: 'View Support',
            metaData: {
                bookingId: booking._id.toString(),
                issueId,
                status
            }
        });

        emitAdminBookingRefresh(booking, {
            adminAction: 'update_issue'
        });

        res.status(200).json({
            status: 'success',
            message: 'Issue updated successfully',
            data: { booking }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const driverId = getDriverIdFromRequest(req);

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ status: 'fail', message: 'Latitude and longitude are required' });
        }

        // Throttling: Check if driver exists and when they last updated
        const driver = await SpareDriver.findById(driverId);
        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        if (!isDriverOperational(driver)) {
            return res.status(403).json({ status: 'fail', message: 'Only verified drivers can share live location' });
        }

        // Throttling: Check status to determine frequency
        const activeTrip = await Booking.findOne({
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['en_route', 'arrived', 'active'] }
        });

        // SOP Protocol: 10s for active/en-route trips, 30s for idle online drivers
        const throttleLimit = activeTrip ? 10000 : 30000;
        
        const lastUpdate = driver.updatedAt || 0;
        const diff = Date.now() - new Date(lastUpdate).getTime();
        if (diff < throttleLimit) {
            return res.status(200).json({
                status: 'success',
                message: 'Update skipped (throttled)',
                data: { location: driver.currentLocation }
            });
        }

        // ✅ ZONE DETECTION - Auto-detect and update driver zone
        let driverZone = null;
        try {
            const zone = await ServiceZone.findZoneByPoint(parseFloat(lng), parseFloat(lat));
            if (zone) {
                driverZone = zone.code;
            }
        } catch (error) {
            console.log('Zone detection failed:', error.message);
            // Continue without zone - not critical for location update
        }

        driver.currentLocation = {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
            zone: driverZone,
            lastUpdated: new Date()
        };
        await driver.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            data: { location: driver.currentLocation }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Toggle online status ──
exports.toggleOnline = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const driver = await SpareDriver.findById(driverId);
        if (!driver) return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        if (isOnline && !isDriverOperational(driver)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Your account must be verified before going online'
            });
        }
        const currentCoordinates = Array.isArray(driver.currentLocation?.coordinates)
            ? driver.currentLocation.coordinates
            : [];
        const hasLiveLocation = currentCoordinates.length === 2
            && Number(currentCoordinates[0]) !== 0
            && Number(currentCoordinates[1]) !== 0;
        const hasAddressCoordinates = hasValidLatLng(driver.address?.coordinates);

        if (isOnline && !hasLiveLocation && hasAddressCoordinates) {
            driver.currentLocation = {
                type: 'Point',
                coordinates: [Number(driver.address.coordinates.lng), Number(driver.address.coordinates.lat)]
            };
        }

        driver.isOnline = Boolean(isOnline);
        await driver.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', data: { isOnline: driver.isOnline } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Cancel a booking ──
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const booking = await Booking.findOne({
            _id: id,
            isActive: true,
            'provider.id': driverId,
            'provider.type': 'sparedriver',
            status: { $in: ['en_route', 'arrived'] }
        }).populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({ status: 'fail', message: 'Booking not found or cannot be cancelled now' });
        }

        const dispatch = await releaseBookingBackToPool({
            booking,
            driverId,
            reason: reason || 'Driver cancelled before trip start.',
            releaseStatus: 'sparedriver_cancelled'
        });

        await sendSpareDriverNotification(driverId, {
            title: 'Trip Released',
            message: dispatch.driverCount > 0
                ? 'The trip has been returned to the queue and reassignment has started.'
                : 'The trip has been released. No alternate drivers were found yet.',
            type: 'booking',
            priority: 'medium',
            actionUrl: '/spare-driver/bookings',
            actionText: 'View Bookings',
            metaData: {
                bookingId: booking._id.toString(),
                status: 'pending',
                dispatchState: 'reassigning'
            }
        });

        res.status(200).json({
            status: 'success',
            message: dispatch.driverCount > 0
                ? 'Trip released and reassignment started'
                : 'Trip released. No alternate drivers found yet.',
            data: {
                booking,
                dispatch
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};


// ── Update booking status ──
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, pin } = req.body;
        const driverId = getDriverIdFromRequest(req);

        const booking = await Booking.findOne({
            _id: id,
            isActive: true,
            'provider.id': driverId,
            'provider.type': 'sparedriver'
        });
        if (!booking) return res.status(404).json({ status: 'fail', message: 'Booking not found or not assigned to you' });

        // 🛡️ Hardening: Transition Guards
        const currentStatus = booking.status;
        const validTransitions = {
            'en_route': ['arrived', 'cancelled'],
            'arrived': ['active', 'cancelled'],
            'active': ['completed'],
            'completed': [],
            'pending': ['en_route', 'cancelled']
        };

        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: `Invalid status transition: ${currentStatus} -> ${status}`
            });
        }

        // 🔐 Phase 2: Security Handover (PIN Verification)
        if (status === 'active') {
            if (!pin || pin !== booking.securityPin) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Invalid Security PIN. Please verify with the customer.'
                });
            }
            booking.tracking = booking.tracking || {};
            const commercialRules = getChauffeurCommercialRules(booking);
            
            // 🕊️ Phase 11: Waiting Charge Calculation 🕊️
            if (booking.tracking.arrivedAt) {
                const waitMs = new Date() - new Date(booking.tracking.arrivedAt);
                const waitMins = Math.floor(waitMs / (1000 * 60));
                const freeWaitMins = commercialRules.waitingGraceMinutes;
                if (waitMins > freeWaitMins) {
                    const extraWait = waitMins - freeWaitMins;
                    const waitCharge = extraWait * commercialRules.waitChargePerMinute;
                    booking.pricing.totalAmount += waitCharge;
                    booking.pricing.breakdown = booking.pricing.breakdown || [];
                    booking.pricing.breakdown.push({ name: 'Waiting Charge', amount: waitCharge, type: 'surcharge' });
                    booking.notes.internal = `${booking.notes.internal || ''}\n[WAITING] Client delayed by ${waitMins}m. Charge: ₹${waitCharge}`.trim();
                }
            }
            booking.tracking.startedAt = new Date();
        }

        if (status === 'arrived') {
            booking.tracking = booking.tracking || {};
            booking.tracking.arrivedAt = new Date();
        }

        if (status === 'completed') {
            booking.tracking = booking.tracking || {};
            booking.tracking.completedAt = new Date();
            const commercialRules = getChauffeurCommercialRules(booking);

            // 💎 Phase 8 Hardening: Trip Extension & Arrears Engine 💎
            let finalPrice = booking.pricing?.totalAmount || 0;
            const isChauffeur = booking.service?.category === 'Chauffeur' || booking.service?.type === 'sparedriver';
            const normalizedServiceName = (booking.service?.name || '').toLowerCase();
            const isHourly = isChauffeur && (
                normalizedServiceName.includes('hourly') ||
                normalizedServiceName.includes('full day') ||
                normalizedServiceName.includes('outstation') ||
                normalizedServiceName.includes('point')
            );
            
            if (isHourly && booking.tracking.startedAt) {
                const actualDurationMs = booking.tracking.completedAt - booking.tracking.startedAt;
                
                // Parse booked duration from string (e.g. "4 Hours" -> 4)
                let bookedDurationHrs = 1;
                const serviceName = normalizedServiceName;
                const durationStr = String(booking.service?.duration || '').toLowerCase();

                if (serviceName.includes('outstation')) {
                    bookedDurationHrs = parseBookedDurationHours(durationStr, 24);
                } else if (serviceName.includes('full day')) {
                    bookedDurationHrs = parseBookedDurationHours(durationStr, 8);
                } else {
                    const match = durationStr.match(/(\d+)/);
                    if (match) {
                        bookedDurationHrs = parseInt(match[1]);
                    }
                }

                // 🛡️ Phase 2 Hardening: 15-Minute Grace Period Pulse 🛡️
                const bookedDurationMs = bookedDurationHrs * 60 * 60 * 1000;
                const gracePeriodMs = commercialRules.overtimeGraceMinutes * 60 * 1000;

                if (actualDurationMs > (bookedDurationMs + gracePeriodMs)) {
                    const actualDurationHrs = Math.max(1, Math.ceil(actualDurationMs / (1000 * 60 * 60)));
                    const extraHrs = actualDurationHrs - bookedDurationHrs;
                    
                    // Derived hourly rate from the original total amount paid
                    const hourlyRate = commercialRules.extensionRatePerHour
                        || Math.round((booking.pricing.initialPaidAmount || booking.pricing.totalAmount) / bookedDurationHrs)
                        || 180;
                    const extensionFee = extraHrs * hourlyRate;
                    
                    // 🏨 Phase 12: Multi-Day Outstation Allowance Engine 🏨
                    if (normalizedServiceName.includes('outstation')) {
                        const extraDays = Math.floor(extraHrs / 24);
                        if (extraDays > 0) {
                            const extraAllowance = extraDays * commercialRules.outstationAllowancePerDay;
                            finalPrice += extraAllowance;
                            booking.pricing.breakdown.push({ name: `Stay & Food (Day ${extraDays + 1}+)`, amount: extraAllowance, type: 'arrears' });
                            booking.notes.internal = `${booking.notes.internal || ''}\n[AUTO-ALOWANCE] Multi-day outstation detected. Added ₹${extraAllowance} for ${extraDays} extra nights.`.trim();
                        }
                    }

                    finalPrice += extensionFee;
                    
                    booking.pricing.totalAmount = finalPrice;
                    booking.pricing.breakdown = booking.pricing.breakdown || [];
                    booking.pricing.breakdown.push({ name: `Trip Extension (${extraHrs}h)`, amount: extensionFee, type: 'arrears' });
                    booking.notes.internal = `${booking.notes.internal || ''}\n[ARREARS] Trip extended by ${extraHrs}h. Extension Fee: ₹${extensionFee} (Rate: ₹${hourlyRate}/h).`.trim();
                }
            }

            // 🌙 Phase 11: Real-World Night Allowance Sync 🌙
            // If trip ends in night hours (11 PM - 5 AM) and no Night Allowance was charged yet
            const completeHour = new Date(booking.tracking.completedAt).getHours();
            const isNightEnd = completeHour >= 23 || completeHour < 5;
            const hasNightAllowance = (booking.pricing.breakdown || []).some(b => b.name?.includes('Night Shift Allowance')) || 
                                     booking.notes.internal?.includes('Night Shift Allowance');

            if (isNightEnd && !hasNightAllowance) {
                const nightAllowance = commercialRules.nightAllowance;
                finalPrice += nightAllowance;
                booking.pricing.totalAmount = finalPrice;
                booking.notes.internal = `${booking.notes.internal || ''}\n[NIGHT] Trip ended late (${completeHour}:00). Night Shift Allowance added: ₹${nightAllowance}`.trim();
                booking.pricing.breakdown = booking.pricing.breakdown || [];
                booking.pricing.breakdown.push({ name: 'Night Shift Allowance (Sync)', amount: nightAllowance, type: 'surcharge' });
            }

            booking.payment = booking.payment || {};

            const initialPaidAmount = booking.pricing?.initialPaidAmount || finalPrice;
            const extraSettlementAmount = Math.max(0, finalPrice - initialPaidAmount);
            let settledAdditionalAmount = 0;
            let pendingSettlementAmount = 0;
            let settlementStatus = 'not_required';
            let settlementMethod = '';
            const driver = await SpareDriver.findById(driverId);
            const consumer = await User.findById(booking.consumer);

            if (extraSettlementAmount > 0 && consumer) {
                const reserveCapturedAmount = await consumeChauffeurReserve(
                    booking,
                    extraSettlementAmount,
                    'trip_extra_usage'
                );
                settledAdditionalAmount += reserveCapturedAmount;
                const remainingSettlementAmount = Math.max(0, extraSettlementAmount - reserveCapturedAmount);
                try {
                    if (remainingSettlementAmount > 0) {
                        await executeWalletTransaction(
                            consumer._id,
                            remainingSettlementAmount,
                            'debit',
                            {
                                category: 'SERVICE_CHARGE',
                                description: `Auto settlement for chauffeur overage on #${booking.bookingId || booking._id}`,
                                referenceId: `${booking._id.toString()}-wallet-settlement`,
                                referenceType: 'booking_settlement',
                                creditLimit: -500
                            }
                        );
                        settledAdditionalAmount += remainingSettlementAmount;
                    }
                    settlementStatus = 'auto_collected';
                    settlementMethod = reserveCapturedAmount > 0 && remainingSettlementAmount > 0
                        ? 'wallet+reserve'
                        : (reserveCapturedAmount > 0 ? 'reserve' : 'wallet');
                    booking.notes.internal = `${booking.notes.internal || ''}\n[AUTO-SETTLEMENT] Extra ₹${extraSettlementAmount} settled automatically.${reserveCapturedAmount > 0 ? ` Reserve used: ₹${reserveCapturedAmount}.` : ''}${remainingSettlementAmount > 0 ? ` Wallet debit: ₹${remainingSettlementAmount}.` : ''}`.trim();
                } catch (walletError) {
                    pendingSettlementAmount = Math.max(0, extraSettlementAmount - settledAdditionalAmount);
                    settlementStatus = pendingSettlementAmount > 0 ? 'pending' : 'auto_collected';
                    settlementMethod = settledAdditionalAmount > 0 ? 'reserve_partial' : '';
                    booking.notes.internal = `${booking.notes.internal || ''}\n[SETTLEMENT_PENDING] Auto wallet settlement could not recover the full extra amount of ₹${extraSettlementAmount}. ${walletError.message}`.trim();
                }
            } else if (getHeldReserveAmount(booking) > 0) {
                await releaseChauffeurReserve(booking, 'trip_completed_without_extra');
            }

            if (getHeldReserveAmount(booking) > 0) {
                await releaseChauffeurReserve(booking, 'unused_trip_reserve_release');
            }

            booking.payment.pendingAmount = pendingSettlementAmount;
            booking.payment.settledAmount = settledAdditionalAmount;
            booking.payment.settlementStatus = settlementStatus;
            booking.payment.settlementMethod = settlementMethod;
            booking.payment.status = pendingSettlementAmount > 0 ? 'settlement_pending' : 'paid';
            booking.payment.paidAt = booking.payment.paidAt || new Date();

            // 💰 Controlled payout: only release payout against collected revenue.
            const settledRevenueAmount = initialPaidAmount + settledAdditionalAmount;
            if (settledRevenueAmount > 0 && driver) {
                const { adminCut, providerPayout } = await commissionHelper.calculatePayout(
                    settledRevenueAmount,
                    'sparedriver',
                    { overrideRate: getChauffeurCommissionOverride(booking) }
                );

                await executeWalletTransaction(
                    driver._id,
                    providerPayout,
                    'credit',
                    {
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking ${booking.bookingId || booking._id} (Collected revenue: ₹${settledRevenueAmount})`,
                        referenceId: booking._id.toString(),
                        referenceType: 'booking_payout'
                    },
                    null,
                    SpareDriver
                );

                booking.payment.providerPayoutAmount = providerPayout;
                booking.payment.platformCommissionAmount = adminCut;

                const recoveryResult = await applyMonthlyKitRecovery(driver, booking._id);
                if (recoveryResult?.charged) {
                    booking.payment.recoveryDeductionAmount = Number(booking.payment.recoveryDeductionAmount || 0) + Number(recoveryResult.amount || 0);
                    booking.notes = booking.notes || {};
                    booking.notes.internal = `${booking.notes.internal || ''}\n[KIT_RECOVERY] Deducted ₹${recoveryResult.amount} (installment ${recoveryResult.installmentNumber}/${recoveryResult.totalMonths}) from driver wallet.`.trim();
                }
            }
        }

        booking.status = status;
        await booking.save();
        await booking.populate('consumer', 'name phone');

        // Notify via Socket
        try {
            const io = getSocketIO();
            if (io) {
                // 1. Notify Booking Room (Consumer & Driver)
                io.to(booking._id.toString()).emit('booking_status_updated', {
                    bookingId: booking._id,
                    status: booking.status,
                    paymentStatus: booking.payment?.status,
                    pendingAmount: booking.payment?.pendingAmount || 0
                });

                // 2. Notify Admin Control Tower
                io.to('admin_room').emit('global_status_update', {
                    type: 'task_update',
                    bookingId: booking._id,
                    status: booking.status,
                    userName: booking.consumer?.name || 'Customer',
                    serviceType: 'sparedriver',
                    paymentStatus: booking.payment?.status
                });
            }
        } catch (e) {
            console.error('Socket notification failed:', e.message);
        }

        const notificationMessages = {
            arrived: 'You have marked the driver trip as arrived.',
            active: 'Trip has started successfully.',
            completed: booking.payment?.status === 'settlement_pending'
                ? 'Trip completed. Base payout synced and the remaining balance is waiting for customer settlement.'
                : 'Trip completed and earnings synced to your wallet.'
        };

        if (notificationMessages[status]) {
            await sendSpareDriverNotification(driverId, {
                title: status === 'completed' ? 'Trip Completed' : 'Trip Updated',
                message: notificationMessages[status],
                type: status === 'completed' ? 'payout' : 'booking',
                priority: status === 'completed' ? 'high' : 'medium',
                actionUrl: status === 'completed' ? '/spare-driver/earnings' : '/spare-driver/bookings',
                actionText: status === 'completed' ? 'Open Earnings' : 'Open Booking',
                metaData: {
                    bookingId: booking._id.toString(),
                    status
                }
            });
        }

        if (status === 'completed') {
            await sendNotification(booking.consumer?._id || booking.consumer, {
                title: booking.payment?.status === 'settlement_pending' ? 'Additional Payment Required' : 'Trip Completed',
                message: booking.payment?.status === 'settlement_pending'
                    ? `Your trip is complete. Please settle the additional ${booking.payment?.pendingAmount || 0} to close billing.`
                    : 'Your chauffeur trip has been completed successfully.',
                type: 'payment',
                priority: booking.payment?.status === 'settlement_pending' ? 'high' : 'medium',
                actionUrl: '/spare-driver/history',
                actionText: booking.payment?.status === 'settlement_pending' ? 'Pay Balance' : 'View Trip',
                metaData: {
                    bookingId: booking._id.toString(),
                    status: booking.status,
                    paymentStatus: booking.payment?.status,
                    pendingAmount: booking.payment?.pendingAmount || 0
                }
            });
        }

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get financial transactions ──
exports.getTransactions = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { page = 1, limit = 20 } = req.query;

        const result = await WalletTransaction.getUserTransactions(driverId, {
            page,
            limit,
            category: 'SERVICE_BOOKING'
        });

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Notifications ──
exports.getNotifications = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            type: req.query.type,
            isRead: req.query.isRead
        };

        const result = await Notification.getSpareDriverNotifications(driverId, options);
        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = getDriverIdFromRequest(req);

        if (id === 'all') {
            await Notification.markAllAsReadForSpareDriver(driverId);
        } else {
            const notification = await Notification.findOne({ _id: id, spareDriver: driverId });
            if (!notification) return res.status(404).json({ status: 'fail', message: 'Notification not found' });
            await notification.markAsRead();
        }

        res.status(200).json({ status: 'success', message: 'Notification(s) marked as read' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        await Notification.clearAllForSpareDriver(driverId);
        res.status(200).json({ status: 'success', message: 'Notifications cleared successfully' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Toggle online status ──
// Update FCM Token for push notifications (Phase 2 Hardening)
exports.updateFCMToken = async (req, res) => {
    try {
        const { token, platform } = req.body;

        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'FCM token is required'
            });
        }

        const driverId = getDriverIdFromRequest(req);
        const driver = await SpareDriver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                status: 'fail',
                message: 'SpareDriver not found'
            });
        }

        if (!driver.fcmTokens) driver.fcmTokens = [];

        const existingTokenIndex = driver.fcmTokens.findIndex(t => t.token === token);

        if (existingTokenIndex > -1) {
            driver.fcmTokens[existingTokenIndex].lastUsed = new Date();
            if (platform) driver.fcmTokens[existingTokenIndex].platform = platform;
        } else {
            driver.fcmTokens.push({
                token,
                platform: platform || 'unknown',
                lastUsed: new Date()
            });
        }

        if (driver.fcmTokens.length > 3) {
            driver.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
            driver.fcmTokens = driver.fcmTokens.slice(0, 3);
        }

        await driver.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'FCM token registered successfully'
        });

    } catch (error) {
        console.error('Error updating SpareDriver FCM token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update FCM token'
        });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        if (!req.files?.selfie?.[0]) {
            return res.status(400).json({ status: 'fail', message: 'No image provided' });
        }

        const filePath = req.files.selfie[0].path;
        let selfieUrl = '';

        try {
            const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}/profile`);
            try { fs.unlinkSync(filePath); } catch (e) {}
            selfieUrl = result.secure_url;
        } catch (uploadError) {
            console.warn('Falling back to local storage for profile picture:', uploadError.message);
            selfieUrl = `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${path.basename(filePath)}`;
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            { 'documents.selfie.url': selfieUrl },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully',
            data: { selfie: selfieUrl }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.uploadPoliceVerification = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { pvrNumber } = req.body;
        
        if (!req.files?.pvrFile?.[0]) {
            return res.status(400).json({ status: 'fail', message: 'Verification document is required' });
        }

        const filePath = req.files.pvrFile[0].path;
        let pvrUrl = '';

        try {
            const result = await cloudinary.uploadImage(filePath, `clean2wash/sparedrivers/${driverId}/pvr`);
            try { fs.unlinkSync(filePath); } catch (e) {}
            pvrUrl = result.secure_url;
        } catch (uploadError) {
            console.warn('Falling back to local storage for PVR:', uploadError.message);
            pvrUrl = `${req.protocol}://${req.get('host')}/uploads/sparedrivers/${path.basename(filePath)}`;
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            {
                'documents.policeVerification.url': pvrUrl,
                'documents.policeVerification.number': pvrNumber || '',
                'verification.policeStatus': 'pending'
            },
            { new: true }
        );

        await sendAdminNotification({
            title: 'Police Verification Pending',
            message: `${driver.name} has submitted PVR for Premium Upgrade.`,
            type: 'verification',
            priority: 'high',
            actionUrl: '/admin/spare-drivers',
            metaData: { driverId, status: 'pvr_review' }
        });

        res.status(200).json({
            status: 'success',
            message: 'Verification dossier transmitted. Awaiting command review.',
            data: { driver }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const driverId = getDriverIdFromRequest(req);
        const { name, email, address } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (address) {
            const normalizedCoordinates = hasValidLatLng(address?.coordinates)
                ? {
                    lat: Number(address.coordinates.lat),
                    lng: Number(address.coordinates.lng)
                }
                : null;

            updateData.address = {
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country || 'India',
                coordinates: normalizedCoordinates
            };
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            driverId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Dossier updated successfully',
            data: { driver }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// 💬 Chat & Message Counter Dummies (To prevent 404 spam)
exports.getUnreadMessageCount = async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            count: 0,
            data: { unreadCount: 0 }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getActiveChats = async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            data: { chats: [] }
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

