import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CarFront,
    CheckCircle2,
    ClipboardList,
    Crown,
    Edit2,
    Eye,
    IndianRupee,
    MapPin,
    Plus,
    RefreshCw,
    RotateCcw,
    ShieldAlert,
    Trash2,
    User,
    XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';

const STATUS_CONFIG = {
    pending_docs: { label: 'Pending Docs', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
    pending_verification: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400' },
    active: { label: 'Active', color: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
    suspended: { label: 'Suspended', color: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400' },
};

const BOOKING_STATUS_CONFIG = {
    pending: { label: 'Awaiting Driver', color: 'bg-yellow-50 text-yellow-700' },
    en_route: { label: 'Driver En Route', color: 'bg-blue-50 text-blue-700' },
    arrived: { label: 'Driver Arrived', color: 'bg-purple-50 text-purple-700' },
    active: { label: 'Trip Active', color: 'bg-emerald-50 text-emerald-700' },
    completed: { label: 'Completed', color: 'bg-green-50 text-green-700' },
    cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
};

const ISSUE_STATUS_CONFIG = {
    open: 'bg-red-50 text-red-600',
    investigating: 'bg-yellow-50 text-yellow-700',
    resolved: 'bg-green-50 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
};

const TERMINAL_STATUSES = ['completed', 'cancelled', 'refunded'];

const getBookingAddress = (booking) => (
    booking.location?.address?.street
    || booking.location?.address?.formattedAddress
    || booking.location?.address?.landmark
    || booking.location?.pickupAddress
    || 'Pickup location pending'
);

const getBookingDestination = (booking) => (
    booking.location?.destination?.street
    || booking.location?.destination?.formattedAddress
    || booking.location?.destination?.landmark
    || null
);

const isRoundTripPointBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.serviceName
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('point');
};

const isFullDayBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.serviceName
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('full day') || identity.includes('full-day') || identity.includes('fullday');
};

const getBookedDurationLabel = (booking) => (
    booking?.service?.duration || booking?.schedule?.estimatedDuration || null
);

const isOutstationBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.serviceName
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('outstation');
};

const getBookingSchedule = (booking) => {
    const dateValue = booking.schedule?.date || booking.bookingTime || booking.createdAt;
    return dateValue ? new Date(dateValue).toLocaleString('en-IN') : 'Instant request';
};

const getAssignedDriver = (booking) => (
    booking.provider?.id && typeof booking.provider.id === 'object'
        ? booking.provider.id
        : null
);

const getBookingAmount = (booking) => {
    if (typeof booking.price === 'string') {
        return booking.price.replace(/â‚¹|₹/g, 'Rs ');
    }
    return `Rs ${booking.pricing?.totalAmount || 0}`;
};

const getOpenIssueCount = (booking) => (
    (booking.issues || []).filter((issue) => ['open', 'investigating'].includes(issue.status)).length
);

const formatDurationPricingText = (durationPricing = {}) => {
    if (!durationPricing || typeof durationPricing !== 'object') return '';

    return Object.entries(durationPricing)
        .filter(([, amount]) => Number.isFinite(Number(amount)))
        .map(([label, amount]) => `${label}=${Number(amount)}`)
        .join('\n');
};

const parseDurationPricingText = (value = '') => (
    String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .reduce((accumulator, line) => {
            const [labelPart, amountPart] = line.split('=');
            const normalizedLabel = String(labelPart || '').trim();
            const parsedAmount = Number(String(amountPart || '').trim());

            if (normalizedLabel && Number.isFinite(parsedAmount) && parsedAmount >= 0) {
                accumulator[normalizedLabel] = parsedAmount;
            }

            return accumulator;
        }, {})
);

const AdminSpareDrivers = () => {
    const [allDrivers, setAllDrivers] = useState([]);
    const [liveBookings, setLiveBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('verification');
    const [filter, setFilter] = useState('');
    const [opsFilter, setOpsFilter] = useState('all');
    const [opsSearch, setOpsSearch] = useState('');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driverActionNote, setDriverActionNote] = useState('');
    const [driverActioning, setDriverActioning] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedAssignDriverId, setSelectedAssignDriverId] = useState('');
    const [bookingActionNote, setBookingActionNote] = useState('');
    const [bookingActioning, setBookingActioning] = useState(false);
    const [chauffeurServices, setChauffeurServices] = useState([]);
    const [pricingLoading, setPricingLoading] = useState(true);
    const [pricingSaving, setPricingSaving] = useState(false);
    const [selectedPricingService, setSelectedPricingService] = useState(null);
    const [pricingForm, setPricingForm] = useState({
        title: '',
        description: '',
        price: '',
        estimatedTime: '',
        badge: '',
        sortOrder: 0,
        isActive: true,
        featuresText: '',
        durationOptionsText: '',
        durationPricingText: '',
        waitingGraceMinutes: 15,
        waitChargePerMinute: 2,
        overtimeGraceMinutes: 15,
        extensionRatePerHour: '',
        nightAllowance: 300,
        outstationAllowancePerDay: 500,
        subscriptionHourlyRate: 150,
        commissionPercent: 15,
        gstPercent: 0,
        gstInclusive: false
    });
    const [chauffeurPlans, setChauffeurPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [planSaving, setPlanSaving] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        name: '',
        price: '',
        interval: 'Monthly',
        status: 'Live',
        featuresText: '',
        credits: 4,
        maxVehicles: 1,
        rollover: 0,
        accent: 'brand'
    });
    const [livePulseMap, setLivePulseMap] = useState({});

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const res = await spareDriverAPI.adminGetDrivers();
            setAllDrivers(res?.data?.drivers || []);
        } catch (err) {
            console.error('Failed to fetch drivers:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveBookings = async () => {
        setBookingsLoading(true);
        try {
            const res = await adminAPI.getSpareDriverBookings();
            const bookings = res?.data?.bookings || [];
            setLiveBookings(bookings.filter((booking) => !TERMINAL_STATUSES.includes(booking.status)));
        } catch (err) {
            console.error('Failed to fetch chauffeur bookings:', err.message);
        } finally {
            setBookingsLoading(false);
        }
    };

    const fetchChauffeurServices = async () => {
        setPricingLoading(true);
        try {
            const res = await adminAPI.getChauffeurServicesConfig();
            setChauffeurServices(res?.data?.services || []);
        } catch (err) {
            console.error('Failed to fetch chauffeur service config:', err.message);
        } finally {
            setPricingLoading(false);
        }
    };

    const fetchChauffeurPlans = async () => {
        setPlansLoading(true);
        try {
            const res = await adminAPI.getChauffeurPlans();
            setChauffeurPlans(res?.data?.plans || []);
        } catch (err) {
            console.error('Failed to fetch chauffeur plans:', err.message);
        } finally {
            setPlansLoading(false);
        }
    };

    const refreshAll = () => {
        fetchDrivers();
        fetchLiveBookings();
        fetchChauffeurServices();
        fetchChauffeurPlans();
    };

    useEffect(() => {
        refreshAll();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_admin_token');
        if (!token) return undefined;

        socketService.connect(token);
        socketService.joinAdminRoom();

        const socket = socketService.getSocket();
        if (!socket) return undefined;

        const refreshOpsState = async (bookingId) => {
            try {
                const res = await adminAPI.getSpareDriverBookings();
                const bookings = (res?.data?.bookings || []).filter((booking) => !TERMINAL_STATUSES.includes(booking.status));
                setLiveBookings(bookings);

                if (bookingId) {
                    const latestBooking = bookings.find((booking) => booking._id === bookingId);
                    if (latestBooking) {
                        setSelectedBooking(latestBooking);
                        setSelectedAssignDriverId(
                            latestBooking.provider?.id?._id || latestBooking.provider?.id || ''
                        );
                    }
                }
            } catch (error) {
                console.error('Failed to refresh live chauffeur ops:', error.message);
            }
        };

        const handleGlobalStatusUpdate = (payload) => {
            if (payload?.type === 'new_booking' || payload?.type === 'spare_driver_booking_update') {
                refreshOpsState(payload?.bookingId);
            }
        };

        const buildPulseHandler = (pulseType) => (payload) => {
            if (!payload?.bookingId) return;

            setLivePulseMap((current) => ({
                ...current,
                [payload.bookingId]: {
                    ...(current[payload.bookingId] || {}),
                    [pulseType]: {
                        lat: payload.lat,
                        lng: payload.lng,
                        at: payload.timestamp || new Date().toISOString()
                    }
                }
            }));
        };

        const handleSpecialistPulse = buildPulseHandler('driver');
        const handleConsumerPulse = buildPulseHandler('consumer');

        socket.on('global_status_update', handleGlobalStatusUpdate);
        socket.on('specialist_location_pulse', handleSpecialistPulse);
        socket.on('consumer_location_pulse', handleConsumerPulse);

        return () => {
            socket.off('global_status_update', handleGlobalStatusUpdate);
            socket.off('specialist_location_pulse', handleSpecialistPulse);
            socket.off('consumer_location_pulse', handleConsumerPulse);
        };
    }, []);

    const filteredDrivers = useMemo(() => (
        filter ? allDrivers.filter((driver) => driver.status === filter) : allDrivers
    ), [allDrivers, filter]);

    const verificationQueue = useMemo(() => (
        allDrivers.filter((driver) => ['pending_docs', 'pending_verification', 'rejected', 'suspended'].includes(driver.status))
    ), [allDrivers]);

    const assignableDrivers = useMemo(() => (
        allDrivers.filter((driver) => driver.status === 'active' && driver.isOnline)
    ), [allDrivers]);

    const filteredLiveBookings = useMemo(() => {
        const query = opsSearch.trim().toLowerCase();

        return liveBookings.filter((booking) => {
            const issueCount = getOpenIssueCount(booking);
            const assignedDriver = getAssignedDriver(booking);
            const matchesFilter = (
                opsFilter === 'all'
                || (opsFilter === 'attention' && (issueCount > 0 || ['refund_pending', 'refund_failed'].includes(booking.payment?.status)))
                || (opsFilter === 'unassigned' && !assignedDriver)
                || booking.status === opsFilter
            );

            if (!matchesFilter) return false;
            if (!query) return true;

            const haystack = [
                booking.bookingId,
                booking._id,
                booking.consumer?.name,
                booking.consumer?.phone,
                booking.serviceName,
                assignedDriver?.name,
                assignedDriver?.phone
            ].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [liveBookings, opsFilter, opsSearch]);

    const pendingDocsCount = allDrivers.filter((driver) => driver.status === 'pending_docs').length;
    const pendingCount = allDrivers.filter((driver) => driver.status === 'pending_verification').length;
    const rejectedCount = allDrivers.filter((driver) => driver.status === 'rejected').length;
    const suspendedCount = allDrivers.filter((driver) => driver.status === 'suspended').length;
    const onlineDrivers = assignableDrivers.length;
    const unassignedTrips = liveBookings.filter((booking) => !booking.provider?.id).length;
    const refundAttention = liveBookings.filter((booking) => ['refund_pending', 'refund_failed'].includes(booking.payment?.status)).length;
    const openIssues = liveBookings.reduce((total, booking) => total + getOpenIssueCount(booking), 0);

    const syncBooking = (updatedBooking) => {
        if (!updatedBooking?._id) return;

        setLiveBookings((current) => {
            const exists = current.some((booking) => booking._id === updatedBooking._id);
            const next = exists
                ? current.map((booking) => (booking._id === updatedBooking._id ? updatedBooking : booking))
                : [updatedBooking, ...current];

            return next.filter((booking) => !TERMINAL_STATUSES.includes(booking.status));
        });

        if (TERMINAL_STATUSES.includes(updatedBooking.status)) {
            setSelectedBooking(null);
        } else {
            setSelectedBooking(updatedBooking);
            setSelectedAssignDriverId(
                updatedBooking.provider?.id?._id || updatedBooking.provider?.id || ''
            );
        }
    };

    const openDriverReview = (driver) => {
        if (!driver?._id) {
            toast.error('Assigned driver details are not available yet');
            return;
        }

        setSelectedDriver(driver);
        setDriverActionNote(driver.adminNote || '');
    };

    const openBookingDesk = (booking) => {
        setSelectedBooking(booking);
        setSelectedAssignDriverId(booking.provider?.id?._id || booking.provider?.id || '');
        setBookingActionNote('');
    };

    const handleVerify = async (status) => {
        if (!selectedDriver?._id) return;

        setDriverActioning(true);
        try {
            const res = await spareDriverAPI.adminVerifyDriver(selectedDriver._id, status, driverActionNote);
            const updatedDriver = res?.data?.driver;
            if (updatedDriver?._id) {
                setAllDrivers((current) => current.map((driver) => (
                    driver._id === updatedDriver._id ? updatedDriver : driver
                )));
            }
            setSelectedDriver(null);
            toast.success(`Driver status updated to ${status}`);
        } catch (err) {
            toast.error(`Action failed: ${err.message}`);
        } finally {
            setDriverActioning(false);
        }
    };

    const handleAssignBooking = async () => {
        if (!selectedBooking?._id) return;
        if (!selectedAssignDriverId) {
            toast.error('Select an online spare driver first');
            return;
        }

        setBookingActioning(true);
        try {
            const res = await spareDriverAPI.adminAssignBooking(
                selectedBooking._id,
                selectedAssignDriverId,
                bookingActionNote
            );
            syncBooking(res?.data?.booking);
            toast.success(res?.message || 'Driver reserved for booking');
            setBookingActionNote('');
        } catch (err) {
            toast.error(err.message || 'Could not assign driver');
        } finally {
            setBookingActioning(false);
        }
    };

    const handleReleaseBooking = async () => {
        if (!selectedBooking?._id) return;

        setBookingActioning(true);
        try {
            const res = await spareDriverAPI.adminReleaseBooking(selectedBooking._id, bookingActionNote);
            syncBooking(res?.data?.booking);
            toast.success(res?.message || 'Booking released back to pool');
            setSelectedAssignDriverId('');
            setBookingActionNote('');
        } catch (err) {
            toast.error(err.message || 'Could not release booking');
        } finally {
            setBookingActioning(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!selectedBooking?._id) return;

        setBookingActioning(true);
        try {
            const res = await spareDriverAPI.adminCancelBooking(selectedBooking._id, bookingActionNote);
            syncBooking(res?.data?.booking);
            toast.success(res?.message || 'Booking cancelled');
            setBookingActionNote('');
        } catch (err) {
            toast.error(err.message || 'Could not cancel booking');
        } finally {
            setBookingActioning(false);
        }
    };

    const handleIssueUpdate = async (issueId, status) => {
        if (!selectedBooking?._id || !issueId) return;

        setBookingActioning(true);
        try {
            const res = await spareDriverAPI.adminUpdateBookingIssue(
                selectedBooking._id,
                issueId,
                status,
                bookingActionNote
            );
            syncBooking(res?.data?.booking);
            toast.success(res?.message || 'Issue updated');
            setBookingActionNote('');
        } catch (err) {
            toast.error(err.message || 'Could not update issue');
        } finally {
            setBookingActioning(false);
        }
    };

    const openPricingEditor = (service) => {
        setSelectedPricingService(service);
        setPricingForm({
            title: service.title || '',
            description: service.description || '',
            price: service.price ?? '',
            estimatedTime: service.estimatedTime ?? '',
            badge: service.metadata?.badge || '',
            sortOrder: service.sortOrder ?? 0,
            isActive: service.isActive !== false,
            featuresText: Array.isArray(service.metadata?.features) ? service.metadata.features.join('\n') : '',
            durationOptionsText: Array.isArray(service.metadata?.durationOptions) ? service.metadata.durationOptions.join('\n') : '',
            durationPricingText: formatDurationPricingText(service.metadata?.durationPricing),
            waitingGraceMinutes: service.metadata?.commercialRules?.waitingGraceMinutes ?? 15,
            waitChargePerMinute: service.metadata?.commercialRules?.waitChargePerMinute ?? 2,
            overtimeGraceMinutes: service.metadata?.commercialRules?.overtimeGraceMinutes ?? 15,
            extensionRatePerHour: service.metadata?.commercialRules?.extensionRatePerHour ?? '',
            nightAllowance: service.metadata?.commercialRules?.nightAllowance ?? 300,
            outstationAllowancePerDay: service.metadata?.commercialRules?.outstationAllowancePerDay ?? 500,
            subscriptionHourlyRate: service.metadata?.commercialRules?.subscriptionHourlyRate ?? 150,
            commissionPercent: service.metadata?.commercialRules?.commissionPercent ?? 15,
            gstPercent: service.metadata?.commercialRules?.gstPercent ?? 0,
            gstInclusive: Boolean(service.metadata?.commercialRules?.gstInclusive)
        });
    };

    const openPlanEditor = (plan = {}) => {
        setSelectedPlan(plan);
        setPlanForm({
            name: plan?.name || '',
            price: plan?.price ?? '',
            interval: plan?.interval || 'Monthly',
            status: plan?.status || 'Live',
            featuresText: Array.isArray(plan?.features) ? plan.features.join('\n') : '',
            credits: plan?.credits ?? 4,
            maxVehicles: plan?.maxVehicles ?? 1,
            rollover: plan?.rollover ?? 0,
            accent: plan?.accent || 'brand'
        });
    };

    const handlePricingSave = async () => {
        if (!selectedPricingService?._id) return;

        setPricingSaving(true);
        try {
            const payload = {
                title: pricingForm.title,
                description: pricingForm.description,
                price: Number(pricingForm.price),
                estimatedTime: Number(pricingForm.estimatedTime),
                badge: pricingForm.badge,
                sortOrder: Number(pricingForm.sortOrder),
                isActive: Boolean(pricingForm.isActive),
                durationOptions: pricingForm.durationOptionsText
                    .split('\n')
                    .map((value) => value.trim())
                    .filter(Boolean),
                durationPricing: parseDurationPricingText(pricingForm.durationPricingText),
                commercialRules: {
                    waitingGraceMinutes: Number(pricingForm.waitingGraceMinutes),
                    waitChargePerMinute: Number(pricingForm.waitChargePerMinute),
                    overtimeGraceMinutes: Number(pricingForm.overtimeGraceMinutes),
                    extensionRatePerHour: pricingForm.extensionRatePerHour === '' ? null : Number(pricingForm.extensionRatePerHour),
                    nightAllowance: Number(pricingForm.nightAllowance),
                    outstationAllowancePerDay: Number(pricingForm.outstationAllowancePerDay),
                    subscriptionHourlyRate: Number(pricingForm.subscriptionHourlyRate),
                    commissionPercent: Number(pricingForm.commissionPercent),
                    gstPercent: Number(pricingForm.gstPercent),
                    gstInclusive: Boolean(pricingForm.gstInclusive)
                },
                features: pricingForm.featuresText
                    .split('\n')
                    .map((feature) => feature.trim())
                    .filter(Boolean)
            };

            const res = await adminAPI.updateChauffeurServiceConfig(selectedPricingService._id, payload);
            const updatedService = res?.data?.service;

            if (updatedService?._id) {
                setChauffeurServices((current) => current.map((service) => (
                    service._id === updatedService._id ? updatedService : service
                )));
            }

            setSelectedPricingService(null);
            toast.success('Chauffeur pricing updated');
        } catch (err) {
            toast.error(err.message || 'Could not update chauffeur pricing');
        } finally {
            setPricingSaving(false);
        }
    };

    const handlePlanSave = async () => {
        setPlanSaving(true);
        try {
            const payload = {
                name: planForm.name,
                price: Number(planForm.price),
                interval: planForm.interval,
                status: planForm.status,
                features: planForm.featuresText
                    .split('\n')
                    .map((feature) => feature.trim())
                    .filter(Boolean),
                credits: Number(planForm.credits),
                maxVehicles: Number(planForm.maxVehicles),
                rollover: Number(planForm.rollover),
                accent: planForm.accent,
                applicableServices: ['SPARE_DRIVER', 'CHAUFFEUR']
            };

            const res = selectedPlan?._id
                ? await adminAPI.updateChauffeurPlan(selectedPlan._id, payload)
                : await adminAPI.createChauffeurPlan(payload);

            const savedPlan = res?.data?.plan;
            if (savedPlan?._id) {
                setChauffeurPlans((current) => {
                    const exists = current.some((plan) => plan._id === savedPlan._id);
                    return exists
                        ? current.map((plan) => (plan._id === savedPlan._id ? savedPlan : plan))
                        : [...current, savedPlan].sort((a, b) => a.price - b.price);
                });
            }

            setSelectedPlan(null);
            toast.success(selectedPlan ? 'Chauffeur subscription updated' : 'Chauffeur subscription created');
        } catch (err) {
            toast.error(err.message || 'Could not save chauffeur subscription');
        } finally {
            setPlanSaving(false);
        }
    };

    const handlePlanDelete = async (planId) => {
        const confirmed = window.confirm('Delete this spare driver subscription plan?');
        if (!confirmed) return;

        try {
            await adminAPI.deleteChauffeurPlan(planId);
            setChauffeurPlans((current) => current.filter((plan) => plan._id !== planId));
            toast.success('Chauffeur subscription removed');
        } catch (err) {
            toast.error(err.message || 'Could not delete chauffeur subscription');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => {
                            if (key === 'pending_docs' || key === 'pending_verification') {
                                setActiveSection('verification');
                                return;
                            }

                            setActiveSection('drivers');
                            setFilter((current) => (current === key ? '' : key));
                        }}
                        className={`p-4 bg-white border rounded-lg text-left transition-all hover:shadow-sm ${filter === key ? 'border-brand' : 'border-gray-100'}`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">{cfg.label}</span>
                        </div>
                        <p className="text-xl font-black text-black">
                            {allDrivers.filter((driver) => driver.status === key).length}
                        </p>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Live Trips</p>
                    <p className="text-2xl font-black text-black">{liveBookings.length}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Online Drivers</p>
                    <p className="text-2xl font-black text-green-700">{onlineDrivers}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Waiting Trips</p>
                    <p className="text-2xl font-black text-yellow-700">{unassignedTrips}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Open Issues</p>
                    <p className="text-2xl font-black text-red-600">{openIssues}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Refund Watch</p>
                    <p className="text-2xl font-black text-purple-700">{refundAttention}</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <button
                        onClick={() => setActiveSection('verification')}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${activeSection === 'verification' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black'}`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${activeSection === 'verification' ? 'text-white/60' : 'text-black/30'}`}>Verification Queue</p>
                        <p className="mt-2 text-lg font-black">{pendingDocsCount + pendingCount}</p>
                        <p className={`text-[10px] font-bold ${activeSection === 'verification' ? 'text-white/70' : 'text-black/45'}`}>
                            New registrations, pending KYC, and approval actions
                        </p>
                    </button>
                    <button
                        onClick={() => setActiveSection('operations')}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${activeSection === 'operations' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black'}`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${activeSection === 'operations' ? 'text-white/60' : 'text-black/30'}`}>Live Ops</p>
                        <p className="mt-2 text-lg font-black">{liveBookings.length}</p>
                        <p className={`text-[10px] font-bold ${activeSection === 'operations' ? 'text-white/70' : 'text-black/45'}`}>
                            Running trips, support cases, reassignments, and refunds
                        </p>
                    </button>
                    <button
                        onClick={() => setActiveSection('drivers')}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${activeSection === 'drivers' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black'}`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${activeSection === 'drivers' ? 'text-white/60' : 'text-black/30'}`}>Driver Directory</p>
                        <p className="mt-2 text-lg font-black">{allDrivers.length}</p>
                        <p className={`text-[10px] font-bold ${activeSection === 'drivers' ? 'text-white/70' : 'text-black/45'}`}>
                            Full driver list with status filters and review access
                        </p>
                    </button>
                    <button
                        onClick={() => setActiveSection('pricing')}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${activeSection === 'pricing' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black'}`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${activeSection === 'pricing' ? 'text-white/60' : 'text-black/30'}`}>Pricing Control</p>
                        <p className="mt-2 text-lg font-black">{chauffeurServices.length}</p>
                        <p className={`text-[10px] font-bold ${activeSection === 'pricing' ? 'text-white/70' : 'text-black/45'}`}>
                            Manage the four chauffeur services used by the consumer app
                        </p>
                    </button>
                    <button
                        onClick={() => setActiveSection('subscriptions')}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${activeSection === 'subscriptions' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black'}`}
                    >
                        <p className={`text-[9px] font-black uppercase tracking-widest ${activeSection === 'subscriptions' ? 'text-white/60' : 'text-black/30'}`}>Subscription Desk</p>
                        <p className="mt-2 text-lg font-black">{chauffeurPlans.length}</p>
                        <p className={`text-[10px] font-bold ${activeSection === 'subscriptions' ? 'text-white/70' : 'text-black/45'}`}>
                            Manage spare-driver-only plans without affecting other services
                        </p>
                    </button>
                </div>
            </div>

            {activeSection === 'verification' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-100 rounded-lg p-4">
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Pending Docs</p>
                            <p className="text-2xl font-black text-blue-600">{pendingDocsCount}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-lg p-4">
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Pending Review</p>
                            <p className="text-2xl font-black text-yellow-700">{pendingCount}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-lg p-4">
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Rejected</p>
                            <p className="text-2xl font-black text-red-600">{rejectedCount}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-lg p-4">
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Suspended</p>
                            <p className="text-2xl font-black text-gray-700">{suspendedCount}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50">
                            <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver Verification Desk</p>
                            <h3 className="text-[14px] font-black text-black uppercase">Approve new spare drivers and review flagged accounts</h3>
                        </div>

                        {loading ? (
                            <div className="py-16 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                            </div>
                        ) : verificationQueue.length === 0 ? (
                            <div className="py-16 text-center">
                                <User size={32} className="mx-auto text-black/10 mb-3" />
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No drivers waiting for verification right now</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {verificationQueue.map((driver) => {
                                    const cfg = STATUS_CONFIG[driver.status] || STATUS_CONFIG.pending_docs;
                                    const docsCount = [
                                        driver.documents?.aadhaarCard?.url,
                                        driver.documents?.drivingLicense?.url,
                                        driver.documents?.selfie?.url,
                                    ].filter(Boolean).length;

                                    return (
                                        <div key={driver._id} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr_0.7fr_auto] gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-[11px] font-black text-black uppercase">{driver.name}</p>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-black/45">{driver.phone}</p>
                                                <p className="text-[10px] font-bold text-black/30 truncate">{driver.email || 'Email not available'}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">Documents</p>
                                                <p className={`text-[11px] font-black ${docsCount === 3 ? 'text-green-600' : 'text-black/35'}`}>
                                                    {docsCount}/3 uploaded
                                                </p>
                                                <p className="text-[9px] font-bold text-black/25">
                                                    Joined {new Date(driver.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">Status Note</p>
                                                <p className="text-[10px] font-bold text-black/45">
                                                    {driver.adminNote || (driver.status === 'pending_docs' ? 'Waiting for full documents upload' : 'Ready for admin action')}
                                                </p>
                                            </div>

                                            <div className="flex items-center xl:justify-end gap-2">
                                                <button
                                                    onClick={() => openDriverReview(driver)}
                                                    className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-black transition-colors"
                                                >
                                                    Review Driver
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'drivers' && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="h-9 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none"
                    >
                        <option value="">All Drivers</option>
                        <option value="pending_verification">Pending Review</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_docs">Pending Docs</option>
                    </select>
                    {pendingCount > 0 && (
                        <span className="px-2.5 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-md">
                            {pendingCount} need review
                        </span>
                    )}
                </div>
                <button
                    onClick={refreshAll}
                    className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-black transition-colors"
                >
                    <RefreshCw size={13} />
                    Refresh
                </button>
                </div>
            )}

            {activeSection === 'operations' && (
            <div className="bg-white border border-black/[0.04] rounded-[1.6rem] overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Live Chauffeur Ops</p>
                        <h3 className="text-[14px] font-black text-black uppercase">Trips, support desk, and manual interventions</h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <select
                            value={opsFilter}
                            onChange={(event) => setOpsFilter(event.target.value)}
                            className="h-9 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none"
                        >
                            <option value="all">All Trips</option>
                            <option value="attention">Needs Attention</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="pending">Awaiting Driver</option>
                            <option value="en_route">Driver En Route</option>
                            <option value="arrived">Driver Arrived</option>
                            <option value="active">Trip Active</option>
                        </select>
                        <input
                            type="text"
                            value={opsSearch}
                            onChange={(event) => setOpsSearch(event.target.value)}
                            placeholder="Search booking, customer, driver"
                            className="h-9 w-64 max-w-full border border-gray-200 rounded-md px-3 text-[11px] font-bold text-black outline-none focus:border-black"
                        />
                    </div>
                </div>
                {bookingsLoading ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : filteredLiveBookings.length === 0 ? (
                    <div className="py-16 text-center">
                        <CarFront size={32} className="mx-auto text-black/10 mb-3" />
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No chauffeur trips match this filter</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredLiveBookings.map((booking) => {
                            const bookingStatus = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending;
                            const assignedDriver = getAssignedDriver(booking);
                            const destination = getBookingDestination(booking);
                            const issueCount = getOpenIssueCount(booking);
                            const pulseState = livePulseMap[booking._id] || {};
                            const isRoundTrip = isRoundTripPointBooking(booking);
                            const bookedDuration = getBookedDurationLabel(booking);
                            const isFullDay = isFullDayBooking(booking);
                            const isOutstation = isOutstationBooking(booking);

                            return (
                                <div key={booking._id} className="px-5 py-4 grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr_0.95fr_auto] gap-4 items-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-[11px] font-black text-black uppercase">
                                                {booking.serviceName || 'Chauffeur Service'} - {booking.bookingId || booking._id?.slice(-6)}
                                            </p>
                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${bookingStatus.color}`}>
                                                {bookingStatus.label}
                                            </span>
                                            {issueCount > 0 && (
                                                <span className="px-2 py-1 rounded text-[8px] font-black uppercase bg-red-50 text-red-600">
                                                    {issueCount} issue{issueCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {['refund_pending', 'refund_failed'].includes(booking.payment?.status) && (
                                                <span className="px-2 py-1 rounded text-[8px] font-black uppercase bg-purple-50 text-purple-700">
                                                    {booking.payment.status === 'refund_failed' ? 'Refund Failed' : 'Refund Watch'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black text-black/50 uppercase">
                                            {booking.consumer?.name || 'Customer pending'} - {booking.consumer?.phone || 'No phone'}
                                        </p>
                                        <div className="flex items-start gap-2 text-[10px] font-bold text-black/50">
                                            <MapPin size={13} className="mt-0.5 shrink-0 text-[#F29F05]" />
                                            <div className="space-y-1">
                                                <p>{getBookingAddress(booking)}</p>
                                                {isRoundTrip
                                                    ? <p className="text-blue-600">Drop: same pickup point return</p>
                                                    : (destination && <p className="text-black/30">Drop: {destination}</p>)}
                                                {bookedDuration && (
                                                    <p className={isFullDay ? 'text-amber-700 font-black' : 'text-black/30'}>
                                                        Window: {bookedDuration}
                                                    </p>
                                                )}
                                                {isOutstation && (
                                                    <p className="text-blue-600 font-black">
                                                        Outstation: monitor destination, stay allowance and support coverage
                                                    </p>
                                                )}
                                                {(pulseState.driver?.at || pulseState.consumer?.at) && (
                                                    <p className="text-[9px] font-black text-black/25 uppercase">
                                                        {pulseState.driver?.at ? `Driver pulse ${new Date(pulseState.driver.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Driver pulse pending'}
                                                        {pulseState.consumer?.at ? ` · Consumer pulse ${new Date(pulseState.consumer.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">Assigned Driver</p>
                                        <p className="text-[11px] font-black text-black uppercase">
                                            {assignedDriver?.name || 'Waiting for driver'}
                                        </p>
                                        <p className="text-[10px] font-bold text-black/35">
                                            {assignedDriver?.phone || 'No driver accepted yet'}
                                        </p>
                                        {assignedDriver?.isOnline === false && (
                                            <p className="text-[9px] font-black text-red-500 uppercase">Driver offline</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-black/45">
                                            <IndianRupee size={13} className="text-green-600" />
                                            <span>{getBookingAmount(booking)}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-black/45">
                                            Schedule: {getBookingSchedule(booking)}
                                        </p>
                                        <p className="text-[10px] font-bold text-black/30">
                                            Vehicle: {[booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(' ') || 'Vehicle pending'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 xl:justify-end flex-wrap">
                                        {assignedDriver && (
                                            <button
                                                onClick={() => openDriverReview(assignedDriver)}
                                                className="h-10 px-4 border border-gray-200 text-[10px] font-black uppercase rounded-md hover:border-black transition-colors"
                                            >
                                                Review Driver
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openBookingDesk(booking)}
                                            className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-black transition-colors"
                                        >
                                            Manage Trip
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            )}

            {activeSection === 'pricing' && (
            <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Pricing Desk</p>
                        <h3 className="text-[14px] font-black text-black uppercase">Consumer spare driver services and live selling prices</h3>
                    </div>
                    <button
                        onClick={fetchChauffeurServices}
                        className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-black transition-colors"
                    >
                        <RefreshCw size={13} />
                        Refresh Pricing
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {pricingLoading ? (
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : chauffeurServices.length === 0 ? (
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 text-center">
                            <IndianRupee size={32} className="mx-auto text-black/10 mb-3" />
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No chauffeur services found in master data</p>
                        </div>
                    ) : chauffeurServices.map((service) => (
                        <div key={service._id} className="bg-white border border-gray-100 rounded-lg p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[12px] font-black text-black uppercase">{service.title}</p>
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {service.isActive ? 'Live' : 'Hidden'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-black/40 mt-1">{service.description || 'No description set'}</p>
                                </div>
                                <button
                                    onClick={() => openPricingEditor(service)}
                                    className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-black transition-colors"
                                >
                                    Edit Config
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Base Price</p>
                                    <p className="text-[14px] font-black text-black">₹{service.price || 0}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Duration</p>
                                    <p className="text-[13px] font-black text-black">{service.estimatedTime || 0} min</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Service Key</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.id || service.key}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Badge</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.badge || 'None'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Consumer Features</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(service.metadata?.features || []).length ? (service.metadata.features || []).map((feature) => (
                                        <span key={feature} className="px-2 py-1 bg-gray-50 text-[9px] font-black text-black/60 uppercase rounded-md border border-gray-100">
                                            {feature}
                                        </span>
                                    )) : (
                                        <span className="text-[10px] font-bold text-black/30">No features configured</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {activeSection === 'subscriptions' && (
            <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Subscription Desk</p>
                        <h3 className="text-[14px] font-black text-black uppercase">Spare-driver-only plans for consumer subscription flow</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={fetchChauffeurPlans}
                            className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-black transition-colors"
                        >
                            <RefreshCw size={13} />
                            Refresh Plans
                        </button>
                        <button
                            onClick={() => openPlanEditor()}
                            className="flex items-center gap-2 h-9 px-4 bg-black text-white rounded-md text-[10px] font-black uppercase hover:bg-brand hover:text-black transition-colors"
                        >
                            <Plus size={13} />
                            New Plan
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {plansLoading ? (
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : chauffeurPlans.length === 0 ? (
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 text-center">
                            <Crown size={32} className="mx-auto text-black/10 mb-3" />
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No spare driver subscription plans configured yet</p>
                        </div>
                    ) : chauffeurPlans.map((plan) => (
                        <div key={plan._id} className="bg-white border border-gray-100 rounded-lg p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[12px] font-black text-black uppercase">{plan.name}</p>
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${plan.status === 'Live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {plan.status || 'Live'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-black/40 mt-1">
                                        Scope: spare driver only
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openPlanEditor(plan)}
                                        className="h-10 w-10 bg-black text-white rounded-md flex items-center justify-center hover:bg-brand hover:text-black transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handlePlanDelete(plan._id)}
                                        className="h-10 w-10 border border-red-100 text-red-500 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Plan Price</p>
                                    <p className="text-[14px] font-black text-black">Rs {plan.price || 0}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Credits</p>
                                    <p className="text-[13px] font-black text-black">{plan.credits || 0}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Interval</p>
                                    <p className="text-[13px] font-black text-black">{plan.interval || 'Monthly'}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Max Vehicles</p>
                                    <p className="text-[13px] font-black text-black">{plan.maxVehicles || 1}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Rollover</p>
                                    <p className="text-[12px] font-black text-black">{plan.rollover || 0}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Applicable Services</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">
                                        {(plan.applicableServices || []).join(', ') || 'SPARE_DRIVER'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Plan Features</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(plan.features || []).length ? plan.features.map((feature) => (
                                        <span key={feature} className="px-2 py-1 bg-gray-50 text-[9px] font-black text-black/60 uppercase rounded-md border border-gray-100">
                                            {feature}
                                        </span>
                                    )) : (
                                        <span className="text-[10px] font-bold text-black/30">No features configured</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {activeSection === 'drivers' && (
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver Directory</p>
                    <h3 className="text-[14px] font-black text-black uppercase">All spare drivers with filterable status and review access</h3>
                </div>
                <div className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                    <span className="col-span-4 text-[9px] font-black text-black/30 uppercase tracking-widest">Driver</span>
                    <span className="col-span-3 text-[9px] font-black text-black/30 uppercase tracking-widest">Contact</span>
                    <span className="col-span-2 text-[9px] font-black text-black/30 uppercase tracking-widest">Status</span>
                    <span className="col-span-2 text-[9px] font-black text-black/30 uppercase tracking-widest">Docs</span>
                    <span className="col-span-1 text-[9px] font-black text-black/30 uppercase tracking-widest">Action</span>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="py-16 text-center">
                        <User size={32} className="mx-auto text-black/10 mb-3" />
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No drivers found for this filter</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredDrivers.map((driver) => {
                            const cfg = STATUS_CONFIG[driver.status] || STATUS_CONFIG.pending_docs;
                            const docsCount = [
                                driver.documents?.aadhaarCard?.url,
                                driver.documents?.drivingLicense?.url,
                                driver.documents?.selfie?.url,
                            ].filter(Boolean).length;

                            return (
                                <div key={driver._id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black/30">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-black uppercase">{driver.name}</p>
                                            <p className="text-[8px] font-bold text-black/25 uppercase mt-0.5">
                                                {new Date(driver.createdAt).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <p className="text-[10px] font-black text-black/60">{driver.phone}</p>
                                        <p className="text-[9px] font-bold text-black/25 truncate">{driver.email}</p>
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        <p className={`text-[8px] font-black uppercase ${driver.isOnline ? 'text-green-600' : 'text-black/25'}`}>
                                            {driver.isOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>

                                    <div className="col-span-2">
                                        <span className={`text-[10px] font-black ${docsCount === 3 ? 'text-green-600' : 'text-black/30'}`}>
                                            {docsCount}/3 uploaded
                                        </span>
                                    </div>

                                    <div className="col-span-1">
                                        <button
                                            onClick={() => openDriverReview(driver)}
                                            className="flex items-center gap-1 text-[9px] font-black text-black/40 uppercase hover:text-black transition-colors"
                                        >
                                            <Eye size={13} />
                                            Review
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            )}

            {selectedDriver && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver Review</p>
                                <h3 className="text-lg font-black text-black uppercase">{selectedDriver.name}</h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${STATUS_CONFIG[selectedDriver.status]?.color || STATUS_CONFIG.pending_docs.color}`}>
                                {STATUS_CONFIG[selectedDriver.status]?.label || STATUS_CONFIG.pending_docs.label}
                            </span>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Phone</p>
                                    <p className="text-[11px] font-black text-black">{selectedDriver.phone || 'Not available'}</p>
                                </div>
                                <div className="border border-gray-100 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Email</p>
                                    <p className="text-[10px] font-black text-black truncate">{selectedDriver.email || 'Not available'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Documents</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Aadhaar Card', url: selectedDriver.documents?.aadhaarCard?.url },
                                        { label: 'Driving License', url: selectedDriver.documents?.drivingLicense?.url },
                                        { label: 'Live Selfie', url: selectedDriver.documents?.selfie?.url },
                                    ].map(({ label, url }) => (
                                        <div key={label} className="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-md">
                                            <span className="text-[10px] font-black text-black uppercase">{label}</span>
                                            {url ? (
                                                <a href={url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand uppercase underline">
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-[9px] font-black text-black/20 uppercase">Not uploaded</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Admin Note</label>
                                <textarea
                                    rows={3}
                                    value={driverActionNote}
                                    onChange={(event) => setDriverActionNote(event.target.value)}
                                    placeholder="Reason for approval, rejection, suspension, or support note..."
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="px-6 pb-5 grid grid-cols-4 gap-3">
                            <button
                                onClick={() => setSelectedDriver(null)}
                                className="h-10 border border-gray-200 text-black/40 text-[10px] font-black uppercase rounded-md hover:border-gray-400 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleVerify('rejected')}
                                disabled={driverActioning}
                                className="h-10 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <XCircle size={13} />
                                Reject
                            </button>
                            <button
                                onClick={() => handleVerify('suspended')}
                                disabled={driverActioning}
                                className="h-10 bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-black uppercase rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <AlertTriangle size={13} />
                                Suspend
                            </button>
                            <button
                                onClick={() => handleVerify('active')}
                                disabled={driverActioning}
                                className="h-10 bg-black text-white text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5 hover:bg-brand hover:text-black transition-colors"
                            >
                                <CheckCircle2 size={13} />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedPlan !== null && (
                <div className="fixed inset-0 z-[204] flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Subscription Control</p>
                                <h3 className="text-lg font-black text-black uppercase">
                                    {selectedPlan?._id ? 'Edit Spare Driver Plan' : 'Create Spare Driver Plan'}
                                </h3>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-gray-100 text-black/60">
                                spare-driver only
                            </span>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Plan Name</label>
                                    <input
                                        value={planForm.name}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, name: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Status</label>
                                    <select
                                        value={planForm.status}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, status: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    >
                                        <option value="Live">Live</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.price}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, price: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Billing Interval</label>
                                    <select
                                        value={planForm.interval}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, interval: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Annual">Annual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Credits</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={planForm.credits}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, credits: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Max Vehicles</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={planForm.maxVehicles}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, maxVehicles: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Rollover</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.rollover}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, rollover: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Accent</label>
                                    <input
                                        value={planForm.accent}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, accent: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Plan Features</label>
                                <textarea
                                    rows={5}
                                    value={planForm.featuresText}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, featuresText: event.target.value }))}
                                    placeholder={'Priority chauffeur dispatch\nDiscounted spare-driver rates\nDedicated support'}
                                    className="w-full border border-gray-200 rounded-md px-3 py-3 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="h-10 px-4 border border-gray-200 text-black/40 text-[10px] font-black uppercase rounded-md hover:border-gray-400 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePlanSave}
                                disabled={planSaving}
                                className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5 hover:bg-brand hover:text-black transition-colors"
                            >
                                {planSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedPricingService && (
                <div className="fixed inset-0 z-[205] flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Pricing Control</p>
                                <h3 className="text-lg font-black text-black uppercase">{selectedPricingService.title}</h3>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-gray-100 text-black/60">
                                {selectedPricingService.metadata?.id || selectedPricingService.key}
                            </span>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Title</label>
                                    <input
                                        value={pricingForm.title}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, title: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Badge</label>
                                    <input
                                        value={pricingForm.badge}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, badge: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    value={pricingForm.description}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, description: event.target.value }))}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Base Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.price}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, price: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.estimatedTime}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, estimatedTime: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Sort Order</label>
                                    <input
                                        type="number"
                                        value={pricingForm.sortOrder}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Visibility</label>
                                    <select
                                        value={pricingForm.isActive ? 'live' : 'hidden'}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, isActive: event.target.value === 'live' }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none focus:border-black"
                                    >
                                        <option value="live">Live</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Features</label>
                                <textarea
                                    rows={4}
                                    value={pricingForm.featuresText}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, featuresText: event.target.value }))}
                                    placeholder="One feature per line"
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Slots</label>
                                <textarea
                                    rows={3}
                                    value={pricingForm.durationOptionsText}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, durationOptionsText: event.target.value }))}
                                    placeholder="One slot per line, for example 4 Hours"
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Pricing</label>
                                <textarea
                                    rows={4}
                                    value={pricingForm.durationPricingText}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, durationPricingText: event.target.value }))}
                                    placeholder={"One slot per line, for example 1 Hour=299"}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                />
                                <p className="mt-1 text-[9px] font-bold text-black/35">
                                    Leave blank to keep base price multiplier logic. Add explicit slot fares only when a service needs special pricing.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Wait Grace Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.waitingGraceMinutes}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, waitingGraceMinutes: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Wait Charge/Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.waitChargePerMinute}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, waitChargePerMinute: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Overtime Grace Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.overtimeGraceMinutes}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, overtimeGraceMinutes: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Extension / Hour</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.extensionRatePerHour}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, extensionRatePerHour: event.target.value }))}
                                        placeholder="Auto derive"
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Night Allowance</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.nightAllowance}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, nightAllowance: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Outstation / Day</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.outstationAllowancePerDay}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, outstationAllowancePerDay: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Sub Hourly Rate</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.subscriptionHourlyRate}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, subscriptionHourlyRate: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Commission %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pricingForm.commissionPercent}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, commissionPercent: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">GST %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pricingForm.gstPercent}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, gstPercent: event.target.value }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">GST Mode</label>
                                    <select
                                        value={pricingForm.gstInclusive ? 'inclusive' : 'exclusive'}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, gstInclusive: event.target.value === 'inclusive' }))}
                                        className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none focus:border-black"
                                    >
                                        <option value="exclusive">Add on top</option>
                                        <option value="inclusive">Included in fare</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedPricingService(null)}
                                className="h-10 px-5 border border-gray-200 text-black/50 text-[10px] font-black uppercase rounded-md hover:border-black hover:text-black transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePricingSave}
                                disabled={pricingSaving}
                                className="h-10 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-black transition-colors"
                            >
                                {pricingSaving ? 'Saving...' : 'Save Pricing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedBooking && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 px-4 py-6">
                    <div className="bg-[linear-gradient(180deg,#FFF9EF_0%,#FFFFFF_18%,#FFFFFF_100%)] rounded-[1.8rem] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-[0_28px_70px_rgba(15,23,42,0.18)] border border-black/[0.04]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Operations Desk</p>
                                <h3 className="text-lg font-black text-black uppercase">
                                    {selectedBooking.serviceName || 'Chauffeur Service'} - {selectedBooking.bookingId || selectedBooking._id?.slice(-6)}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${(BOOKING_STATUS_CONFIG[selectedBooking.status] || BOOKING_STATUS_CONFIG.pending).color}`}>
                                    {(BOOKING_STATUS_CONFIG[selectedBooking.status] || BOOKING_STATUS_CONFIG.pending).label}
                                </span>
                                {selectedBooking.payment?.status && (
                                    <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-gray-100 text-black/60">
                                        Payment {selectedBooking.payment.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border border-black/[0.04] rounded-[1.25rem] p-4 space-y-2 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Customer</p>
                                    <p className="text-[12px] font-black text-black uppercase">{selectedBooking.consumer?.name || 'Pending'}</p>
                                    <p className="text-[10px] font-bold text-black/45">{selectedBooking.consumer?.phone || 'No phone'}</p>
                                    <p className="text-[10px] font-bold text-black/35">{getBookingAddress(selectedBooking)}</p>
                                </div>
                                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Trip Snapshot</p>
                                    <p className="text-[12px] font-black text-black uppercase">{getBookingAmount(selectedBooking)}</p>
                                    <p className="text-[10px] font-bold text-black/45">Schedule: {getBookingSchedule(selectedBooking)}</p>
                                    {getBookedDurationLabel(selectedBooking) && (
                                        <p className="text-[10px] font-bold text-black/45">
                                            Booked Window: {getBookedDurationLabel(selectedBooking)}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold text-black/35">
                                        Vehicle: {[selectedBooking.vehicle?.brand, selectedBooking.vehicle?.model, selectedBooking.vehicle?.plate].filter(Boolean).join(' ') || 'Vehicle pending'}
                                    </p>
                                    {isRoundTripPointBooking(selectedBooking) && (
                                        <p className="text-[10px] font-bold text-blue-600">
                                            Round trip: customer must return to pickup point
                                        </p>
                                    )}
                                    {isFullDayBooking(selectedBooking) && (
                                        <p className="text-[10px] font-bold text-amber-700">
                                            Full day shift. Monitor overtime after booked window ends.
                                        </p>
                                    )}
                                    {isOutstationBooking(selectedBooking) && (
                                        <p className="text-[10px] font-bold text-blue-700">
                                            Outstation trip. Track destination progress, stay allowance and customer support carefully.
                                        </p>
                                    )}
                                    {livePulseMap[selectedBooking._id]?.consumer?.at && (
                                        <p className="text-[10px] font-bold text-brand">
                                            Consumer pulse: {new Date(livePulseMap[selectedBooking._id].consumer.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                                <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Current Driver</p>
                                    <p className="text-[12px] font-black text-black uppercase">
                                        {getAssignedDriver(selectedBooking)?.name || 'Not assigned'}
                                    </p>
                                    <p className="text-[10px] font-bold text-black/45">
                                        {getAssignedDriver(selectedBooking)?.phone || 'No driver linked yet'}
                                    </p>
                                    <p className="text-[10px] font-bold text-black/35">
                                        Open issues: {getOpenIssueCount(selectedBooking)}
                                    </p>
                                    {livePulseMap[selectedBooking._id]?.driver?.at && (
                                        <p className="text-[10px] font-bold text-emerald-600">
                                            Driver pulse: {new Date(livePulseMap[selectedBooking._id].driver.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-[#F29F05]" />
                                    <p className="text-[11px] font-black text-black uppercase">Manual Dispatch & Support Controls</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Select Verified Online Driver</label>
                                        <select
                                            value={selectedAssignDriverId}
                                            onChange={(event) => setSelectedAssignDriverId(event.target.value)}
                                            className="w-full h-11 border border-gray-200 rounded-md px-3 text-[11px] font-black text-black uppercase outline-none"
                                        >
                                            <option value="">Choose driver</option>
                                            {assignableDrivers.map((driver) => (
                                                <option key={driver._id} value={driver._id}>
                                                    {driver.name} - {driver.phone}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAssignBooking}
                                        disabled={bookingActioning}
                                        className="h-11 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-black transition-colors"
                                    >
                                        {getAssignedDriver(selectedBooking) ? 'Reassign Driver' : 'Assign Driver'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Operations Note</label>
                                    <textarea
                                        rows={3}
                                        value={bookingActionNote}
                                        onChange={(event) => setBookingActionNote(event.target.value)}
                                        placeholder="Explain why you are reassigning, releasing, cancelling, or updating support status..."
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] font-bold text-black resize-none outline-none focus:border-black"
                                    />
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={handleReleaseBooking}
                                        disabled={bookingActioning || selectedBooking.status === 'active'}
                                        className="h-10 px-4 border border-yellow-200 bg-yellow-50 text-yellow-800 text-[10px] font-black uppercase rounded-md hover:bg-yellow-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <RotateCcw size={13} />
                                        Return to Queue
                                    </button>
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={bookingActioning}
                                        className="h-10 px-4 border border-red-100 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-md hover:bg-red-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <XCircle size={13} />
                                        Cancel Trip
                                    </button>
                                    {getAssignedDriver(selectedBooking) && (
                                        <button
                                            onClick={() => openDriverReview(getAssignedDriver(selectedBooking))}
                                            className="h-10 px-4 border border-gray-200 text-[10px] font-black uppercase rounded-md hover:border-black transition-colors"
                                        >
                                            Review Current Driver
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={16} className="text-black/55" />
                                    <p className="text-[11px] font-black text-black uppercase">Issue Resolution Desk</p>
                                </div>

                                {selectedBooking.issues?.length ? (
                                    <div className="space-y-3">
                                        {selectedBooking.issues.map((issue) => (
                                            <div key={issue._id} className="border border-gray-100 rounded-md p-3">
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-black text-black uppercase">{issue.type || 'Support'}</span>
                                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${ISSUE_STATUS_CONFIG[issue.status] || ISSUE_STATUS_CONFIG.open}`}>
                                                                {issue.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-black/55">{issue.description || 'No issue description provided.'}</p>
                                                        <p className="text-[9px] font-black text-black/25 uppercase">
                                                            {issue.reportedAt ? new Date(issue.reportedAt).toLocaleString('en-IN') : 'Just now'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => handleIssueUpdate(issue._id, 'investigating')}
                                                            disabled={bookingActioning}
                                                            className="h-9 px-3 bg-yellow-50 text-yellow-700 text-[9px] font-black uppercase rounded-md hover:bg-yellow-100 transition-colors"
                                                        >
                                                            Investigating
                                                        </button>
                                                        <button
                                                            onClick={() => handleIssueUpdate(issue._id, 'resolved')}
                                                            disabled={bookingActioning}
                                                            className="h-9 px-3 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded-md hover:bg-green-100 transition-colors"
                                                        >
                                                            Resolve
                                                        </button>
                                                        <button
                                                            onClick={() => handleIssueUpdate(issue._id, 'dismissed')}
                                                            disabled={bookingActioning}
                                                            className="h-9 px-3 bg-gray-100 text-gray-700 text-[9px] font-black uppercase rounded-md hover:bg-gray-200 transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-gray-200 rounded-md p-6 text-center">
                                        <p className="text-[10px] font-black text-black/25 uppercase tracking-widest">No support issues linked to this trip yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex items-center justify-end">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="h-10 px-5 border border-gray-200 text-black/50 text-[10px] font-black uppercase rounded-md hover:border-black hover:text-black transition-colors"
                            >
                                Close Desk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSpareDrivers;
