import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
    XCircle,
    MessageCircle,
    Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import VerificationSection from '../components/spareDrivers/VerificationSection';
import DriversSection from '../components/spareDrivers/DriversSection';
import OperationsSection from '../components/spareDrivers/OperationsSection';
import PricingSection from '../components/spareDrivers/PricingSection';
import SubscriptionsSection from '../components/spareDrivers/SubscriptionsSection';
import SupportTicketsSection from '../components/spareDrivers/SupportTicketsSection';

const STATUS_CONFIG = {
    pending_docs: { label: 'Pending docs', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
    pending_verification: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400' },
    verified_pending_kit: { label: 'Kit required', color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-400' },
    kit_payment_pending: { label: 'Kit review', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    active: { label: 'Active', color: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
    suspended: { label: 'Suspended', color: 'bg-white/[0.02] text-white/60', dot: 'bg-gray-400' },
};

const BOOKING_STATUS_CONFIG = {
    pending: { label: 'Awaiting driver', color: 'bg-yellow-50 text-yellow-700' },
    en_route: { label: 'Driver en route', color: 'bg-blue-50 text-blue-700' },
    arrived: { label: 'Driver arrived', color: 'bg-purple-50 text-purple-700' },
    active: { label: 'Trip active', color: 'bg-emerald-50 text-emerald-700' },
    completed: { label: 'Completed', color: 'bg-green-50 text-green-700' },
    cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
};

const ISSUE_STATUS_CONFIG = {
    open: 'bg-red-50 text-red-600',
    investigating: 'bg-yellow-50 text-yellow-700',
    resolved: 'bg-green-50 text-green-700',
    dismissed: 'bg-white/[0.05] text-white/60',
};

const TERMINAL_STATUSES = ['completed', 'cancelled', 'refunded'];

const DRIVER_LANES = [
    { id: 'all', label: 'All drivers' },
    { id: 'pending_docs', label: 'Docs missing' },
    { id: 'pending_verification', label: 'Verification' },
    { id: 'verified_pending_kit', label: 'Kit required' },
    { id: 'kit_payment_pending', label: 'Kit review' },
    { id: 'active', label: 'Active fleet' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'rejected', label: 'Rejected' }
];

const CHAUFFEUR_ADMIN_SECTIONS = ['verification', 'operations', 'drivers', 'pricing', 'kit', 'premium', 'subscriptions', 'support'];
const DEFAULT_KIT_MANAGEMENT = {
    title: 'Starter Driver Kit',
    subtitle: 'Complete payment to unlock your chauffeur dashboard.',
    kitPrice: 1499,
    monthlyDeductionAmount: 199,
    monthlyDeductionMonths: 2,
    imageUrls: [
        'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'
    ]
};
const DEFAULT_PREMIUM_MANAGEMENT = {
    title: 'Premium Driver Program',
    subtitle: 'Police-verified chauffeurs get premium trust and booking visibility.',
    benefits: [
        'Premium badge on profile and operational identity',
        'Priority visibility for high-trust customer trips',
        'Higher confidence score during manual assignment'
    ]
};

const normalizeDriverStatus = (status) => String(status || '').toLowerCase();
const normalizePoliceStatus = (status) => String(status || '').toLowerCase();

const ADMIN_SECTION_META = {
    verification: {
        title: 'Verification queue',
        description: 'Approve registrations, review KYC documents, and move drivers into kit activation.',
        icon: ShieldAlert
    },
    operations: {
        title: 'Live operations',
        description: 'Track active trips, support issues, manual assignment, and exception handling.',
        icon: ClipboardList
    },
    drivers: {
        title: 'Driver directory',
        description: 'Review all chauffeur accounts, lane filters, and account-level actions.',
        icon: User
    },
    pricing: {
        title: 'Pricing control',
        description: 'Manage service pricing, duration slots, commission, and GST settings.',
        icon: IndianRupee
    },
    kit: {
        title: 'Kit management',
        description: 'Control onboarding kit price, gallery visuals, and monthly wallet deductions.',
        icon: CarFront
    },
    premium: {
        title: 'Premium program',
        description: 'Manage police-verification premium rules, benefits, and driver badge eligibility.',
        icon: CheckCircle2
    },
    subscriptions: {
        title: 'Subscription desk',
        description: 'Control chauffeur plans, credits, and spare-driver-only subscriptions.',
        icon: Crown
    },
    support: {
        title: 'Support Desk',
        description: 'Manage specialized user issues, tickets, and resolution communication.',
        icon: MessageCircle
    }
};

const getAdminSpareDriverSection = (pathname = '') => {
    const matchedSection = CHAUFFEUR_ADMIN_SECTIONS.find((section) => pathname.endsWith(`/${section}`));
    return matchedSection || 'verification';
};

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

const normalizeApplicableValue = (value = '') => String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const AdminSpareDrivers = () => {
    const location = useLocation();
    const [allDrivers, setAllDrivers] = useState([]);
    const [liveBookings, setLiveBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(() => getAdminSpareDriverSection(location.pathname));
    const [driverLane, setDriverLane] = useState('all');
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
        accent: 'brand',
        applicableService: 'SPARE_DRIVER'
    });
    const [kitConfigLoading, setKitConfigLoading] = useState(true);
    const [kitConfigSaving, setKitConfigSaving] = useState(false);
    const [kitConfigForm, setKitConfigForm] = useState({
        title: DEFAULT_KIT_MANAGEMENT.title,
        subtitle: DEFAULT_KIT_MANAGEMENT.subtitle,
        kitPrice: DEFAULT_KIT_MANAGEMENT.kitPrice,
        monthlyDeductionAmount: DEFAULT_KIT_MANAGEMENT.monthlyDeductionAmount,
        monthlyDeductionMonths: DEFAULT_KIT_MANAGEMENT.monthlyDeductionMonths,
        imageUrlsText: ''
    });
    const [premiumConfigLoading, setPremiumConfigLoading] = useState(true);
    const [premiumConfigSaving, setPremiumConfigSaving] = useState(false);
    const [premiumConfigForm, setPremiumConfigForm] = useState({
        title: DEFAULT_PREMIUM_MANAGEMENT.title,
        subtitle: DEFAULT_PREMIUM_MANAGEMENT.subtitle,
        benefitsText: DEFAULT_PREMIUM_MANAGEMENT.benefits.join('\n')
    });
    const [livePulseMap, setLivePulseMap] = useState({});

    useEffect(() => {
        setActiveSection(getAdminSpareDriverSection(location.pathname));
    }, [location.pathname]);

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

    const fetchKitManagement = async () => {
        setKitConfigLoading(true);
        try {
            const res = await adminAPI.getSettings();
            const settingList = res?.data?.settings || [];
            const configuredValue = settingList.find((setting) => setting.key === 'sparedriver_kit_config')?.value || {};
            const merged = {
                ...DEFAULT_KIT_MANAGEMENT,
                ...configuredValue,
                imageUrls: Array.isArray(configuredValue?.imageUrls) ? configuredValue.imageUrls : []
            };

            setKitConfigForm({
                title: String(merged.title || DEFAULT_KIT_MANAGEMENT.title),
                subtitle: String(merged.subtitle || DEFAULT_KIT_MANAGEMENT.subtitle),
                kitPrice: Number(merged.kitPrice || DEFAULT_KIT_MANAGEMENT.kitPrice),
                monthlyDeductionAmount: Number(merged.monthlyDeductionAmount || DEFAULT_KIT_MANAGEMENT.monthlyDeductionAmount),
                monthlyDeductionMonths: Number(merged.monthlyDeductionMonths || DEFAULT_KIT_MANAGEMENT.monthlyDeductionMonths),
                imageUrlsText: merged.imageUrls.join('\n')
            });
        } catch (err) {
            console.error('Failed to fetch kit management config:', err.message);
            toast.error('Could not load kit management settings');
        } finally {
            setKitConfigLoading(false);
        }
    };

    const fetchPremiumManagement = async () => {
        setPremiumConfigLoading(true);
        try {
            const res = await adminAPI.getSettings();
            const settingList = res?.data?.settings || [];
            const configuredValue = settingList.find((setting) => setting.key === 'sparedriver_premium_config')?.value || {};
            const merged = {
                ...DEFAULT_PREMIUM_MANAGEMENT,
                ...configuredValue,
                benefits: Array.isArray(configuredValue?.benefits) ? configuredValue.benefits : DEFAULT_PREMIUM_MANAGEMENT.benefits
            };

            setPremiumConfigForm({
                title: String(merged.title || DEFAULT_PREMIUM_MANAGEMENT.title),
                subtitle: String(merged.subtitle || DEFAULT_PREMIUM_MANAGEMENT.subtitle),
                benefitsText: (merged.benefits || []).join('\n')
            });
        } catch (err) {
            console.error('Failed to fetch premium management config:', err.message);
            toast.error('Could not load premium program settings');
        } finally {
            setPremiumConfigLoading(false);
        }
    };

    const refreshAll = () => {
        fetchDrivers();
        fetchLiveBookings();
        fetchChauffeurServices();
        fetchChauffeurPlans();
        fetchKitManagement();
        fetchPremiumManagement();
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

    const verificationQueue = useMemo(() => (
        allDrivers.filter((driver) => (
            ['pending_docs', 'pending_verification', 'verified_pending_kit', 'kit_payment_pending', 'rejected', 'suspended'].includes(normalizeDriverStatus(driver.status))
            || (normalizeDriverStatus(driver.status) === 'active' && normalizePoliceStatus(driver.verification?.policeStatus) !== 'approved')
        ))
    ), [allDrivers]);

    const assignableDrivers = useMemo(() => (
        allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'active' && driver.isOnline)
    ), [allDrivers]);

    const laneCounts = useMemo(() => ({
        all: allDrivers.length,
        pending_docs: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'pending_docs').length,
        pending_verification: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'pending_verification').length,
        verified_pending_kit: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'verified_pending_kit').length,
        kit_payment_pending: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'kit_payment_pending').length,
        active: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'active').length,
        suspended: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'suspended').length,
        rejected: allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'rejected').length
    }), [allDrivers]);

    const verificationDrivers = useMemo(() => (
        verificationQueue.filter((driver) => driverLane === 'all' ? true : normalizeDriverStatus(driver.status) === driverLane)
    ), [driverLane, verificationQueue]);

    const directoryDrivers = useMemo(() => (
        allDrivers.filter((driver) => driverLane === 'all' ? true : normalizeDriverStatus(driver.status) === driverLane)
    ), [driverLane, allDrivers]);

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

    const pendingDocsCount = allDrivers.filter((driver) => normalizeDriverStatus(driver.status) === 'pending_docs').length;
    const pendingCount = allDrivers.filter((driver) => ['pending_verification', 'verified_pending_kit', 'kit_payment_pending'].includes(normalizeDriverStatus(driver.status))).length;
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

    const primaryDriverAction = useMemo(() => {
        if (!selectedDriver) return null;
        const selectedStatus = normalizeDriverStatus(selectedDriver.status);

        if (selectedStatus === 'pending_docs') {
            return null;
        }

        if (selectedStatus === 'pending_verification') {
            return { status: 'verified_pending_kit', label: 'Verify Docs' };
        }

        if (selectedStatus === 'kit_payment_pending') {
            return { status: 'active', label: 'Approve Kit' };
        }

        if (selectedStatus === 'verified_pending_kit') {
            return null;
        }

        return { status: 'active', label: 'Approve' };
    }, [selectedDriver]);

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
        const applicableServices = Array.isArray(plan?.applicableServices) ? plan.applicableServices : [];
        const specificService = applicableServices.find((entry) => {
            const normalized = normalizeApplicableValue(entry);
            return normalized && normalized !== 'SPARE_DRIVER' && normalized !== 'CHAUFFEUR';
        });

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
            accent: plan?.accent || 'brand',
            applicableService: specificService || 'SPARE_DRIVER'
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
                applicableServices: planForm.applicableService === 'SPARE_DRIVER'
                    ? ['SPARE_DRIVER']
                    : [planForm.applicableService]
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

    const handleKitConfigSave = async () => {
        setKitConfigSaving(true);
        try {
            const payload = {
                title: String(kitConfigForm.title || '').trim() || DEFAULT_KIT_MANAGEMENT.title,
                subtitle: String(kitConfigForm.subtitle || '').trim() || DEFAULT_KIT_MANAGEMENT.subtitle,
                kitPrice: Math.max(1, Math.round(Number(kitConfigForm.kitPrice || DEFAULT_KIT_MANAGEMENT.kitPrice))),
                monthlyDeductionAmount: Math.max(0, Math.round(Number(kitConfigForm.monthlyDeductionAmount || 0))),
                monthlyDeductionMonths: Math.max(0, Math.min(12, Math.round(Number(kitConfigForm.monthlyDeductionMonths || 0)))),
                imageUrls: String(kitConfigForm.imageUrlsText || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .slice(0, 8)
            };

            await adminAPI.updateSetting('sparedriver_kit_config', payload);
            toast.success('Kit management settings updated');
            await fetchKitManagement();
        } catch (err) {
            toast.error(err.message || 'Could not save kit settings');
        } finally {
            setKitConfigSaving(false);
        }
    };

    const handlePremiumConfigSave = async () => {
        setPremiumConfigSaving(true);
        try {
            const payload = {
                title: String(premiumConfigForm.title || '').trim() || DEFAULT_PREMIUM_MANAGEMENT.title,
                subtitle: String(premiumConfigForm.subtitle || '').trim() || DEFAULT_PREMIUM_MANAGEMENT.subtitle,
                benefits: String(premiumConfigForm.benefitsText || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .slice(0, 10)
            };

            if (!payload.benefits.length) {
                payload.benefits = DEFAULT_PREMIUM_MANAGEMENT.benefits;
            }

            await adminAPI.updateSetting('sparedriver_premium_config', payload);
            toast.success('Premium program settings updated');
            await fetchPremiumManagement();
        } catch (err) {
            toast.error(err.message || 'Could not save premium settings');
        } finally {
            setPremiumConfigSaving(false);
        }
    };

    const handlePremiumVerificationAction = async (action) => {
        if (!selectedDriver?._id) return;

        if (action === 'reject' && !String(driverActionNote || '').trim()) {
            toast.error('Please provide a rejection reason in admin note');
            return;
        }

        setDriverActioning(true);
        try {
            const res = await spareDriverAPI.adminUpdatePremiumVerification(
                selectedDriver._id,
                action,
                String(driverActionNote || '').trim()
            );
            const updatedDriver = res?.data?.driver;
            if (updatedDriver?._id) {
                setAllDrivers((current) => current.map((driver) => (
                    driver._id === updatedDriver._id ? updatedDriver : driver
                )));
                setSelectedDriver(updatedDriver);
            }
            toast.success(action === 'approve' ? 'Premium badge approved' : 'Premium verification rejected');
        } catch (err) {
            toast.error(err.message || 'Could not update premium verification');
        } finally {
            setDriverActioning(false);
        }
    };

    const activeSectionMeta = ADMIN_SECTION_META[activeSection] || ADMIN_SECTION_META.verification;
    const sectionStatMap = {
        verification: pendingDocsCount + pendingCount,
        operations: liveBookings.length,
        drivers: allDrivers.length,
        pricing: chauffeurServices.length,
        kit: Number(kitConfigForm.kitPrice || 0),
        premium: String(premiumConfigForm.benefitsText || '').split('\n').map((line) => line.trim()).filter(Boolean).length,
        subscriptions: chauffeurPlans.length
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Live Trips</p>
                    <p className="text-2xl font-black text-white">{liveBookings.length}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Online Drivers</p>
                    <p className="text-2xl font-black text-green-700">{onlineDrivers}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Waiting Trips</p>
                    <p className="text-2xl font-black text-yellow-700">{unassignedTrips}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Open Issues</p>
                    <p className="text-2xl font-black text-red-600">{openIssues}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Refund Watch</p>
                    <p className="text-2xl font-black text-purple-700">{refundAttention}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-[1rem] p-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black text-black/25 uppercase tracking-[0.24em] mb-2">Active Workspace</p>
                            <h3 className="text-[18px] font-black text-white uppercase">{activeSectionMeta.title}</h3>
                            <p className="text-[10px] font-bold text-white/40 mt-2 max-w-[38rem]">
                                {activeSectionMeta.description}
                            </p>
                        </div>
                        <div className="rounded-[1.2rem] border border-black/[0.04] bg-white/[0.02] px-4 py-3 text-right">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em]">Live Records</p>
                            <p className="text-[18px] font-black text-white mt-2">{sectionStatMap[activeSection]}</p>
                        </div>
                    </div>
                </div>

                {activeSection === 'verification' && (
                    <VerificationSection
                        lanes={DRIVER_LANES}
                        driverLane={driverLane}
                        laneCounts={laneCounts}
                        onSelectLane={setDriverLane}
                        loading={loading}
                        verificationDrivers={verificationDrivers}
                        statusConfig={STATUS_CONFIG}
                        openDriverReview={openDriverReview}
                    />
                )}

                {activeSection === 'drivers' && (
                    <DriversSection
                        lanes={DRIVER_LANES}
                        driverLane={driverLane}
                        laneCounts={laneCounts}
                        onSelectLane={setDriverLane}
                        refreshAll={refreshAll}
                        loading={loading}
                        directoryDrivers={directoryDrivers}
                        statusConfig={STATUS_CONFIG}
                        openDriverReview={openDriverReview}
                    />
                )}

                {activeSection === 'operations' && (
                    <OperationsSection
                        opsFilter={opsFilter}
                        setOpsFilter={setOpsFilter}
                        opsSearch={opsSearch}
                        setOpsSearch={setOpsSearch}
                        bookingsLoading={bookingsLoading}
                        filteredLiveBookings={filteredLiveBookings}
                        bookingStatusConfig={BOOKING_STATUS_CONFIG}
                        getAssignedDriver={getAssignedDriver}
                        getBookingDestination={getBookingDestination}
                        getOpenIssueCount={getOpenIssueCount}
                        livePulseMap={livePulseMap}
                        isRoundTripPointBooking={isRoundTripPointBooking}
                        getBookedDurationLabel={getBookedDurationLabel}
                        isFullDayBooking={isFullDayBooking}
                        isOutstationBooking={isOutstationBooking}
                        getBookingAddress={getBookingAddress}
                        getBookingAmount={getBookingAmount}
                        getBookingSchedule={getBookingSchedule}
                        openDriverReview={openDriverReview}
                        openBookingDesk={openBookingDesk}
                    />
                )}

                {activeSection === 'pricing' && (
                    <PricingSection
                        fetchChauffeurServices={fetchChauffeurServices}
                        pricingLoading={pricingLoading}
                        chauffeurServices={chauffeurServices}
                        openPricingEditor={openPricingEditor}
                    />
                )}

                {activeSection === 'kit' && (
                    <div className="bg-white/5 border border-white/5 rounded-[1rem] p-4 md:p-5 shadow-[0_14px_28px_rgba(15,23,42,0.05)] space-y-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Kit Management Desk</p>
                                <h3 className="text-[16px] font-black text-white uppercase">Onboarding Kit Config</h3>
                                <p className="text-[10px] font-bold text-black/45 mt-1.5">Driver app kit price, onboarding visuals, and wallet deductions are controlled here.</p>
                            </div>
                            <button
                                onClick={fetchKitManagement}
                                className="h-9 px-4 border border-white/10 rounded-lg text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-white transition-colors"
                            >
                                Refresh Config
                            </button>
                        </div>

                        {kitConfigLoading ? (
                            <div className="py-14 flex items-center justify-center">
                                <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Kit Title</label>
                                        <input
                                            value={kitConfigForm.title}
                                            onChange={(event) => setKitConfigForm((prev) => ({ ...prev, title: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Kit Subtitle</label>
                                        <input
                                            value={kitConfigForm.subtitle}
                                            onChange={(event) => setKitConfigForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Signup Kit Price</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={kitConfigForm.kitPrice}
                                            onChange={(event) => setKitConfigForm((prev) => ({ ...prev, kitPrice: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Monthly Wallet Deduction</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={kitConfigForm.monthlyDeductionAmount}
                                            onChange={(event) => setKitConfigForm((prev) => ({ ...prev, monthlyDeductionAmount: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Deduction Months</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="12"
                                            value={kitConfigForm.monthlyDeductionMonths}
                                            onChange={(event) => setKitConfigForm((prev) => ({ ...prev, monthlyDeductionMonths: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Kit Gallery Images</label>
                                    <textarea
                                        rows={5}
                                        value={kitConfigForm.imageUrlsText}
                                        onChange={(event) => setKitConfigForm((prev) => ({ ...prev, imageUrlsText: event.target.value }))}
                                        placeholder={'One image URL per line\nhttps://...'}
                                        className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-y outline-none focus:border-black"
                                    />
                                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mt-1.5">Driver app shows this as horizontal scrollable gallery.</p>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={handleKitConfigSave}
                                        disabled={kitConfigSaving}
                                        className="h-10 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
                                    >
                                        {kitConfigSaving ? 'Saving...' : 'Save Kit Config'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeSection === 'premium' && (
                    <div className="bg-white/5 border border-white/5 rounded-[1rem] p-4 md:p-5 shadow-[0_14px_28px_rgba(15,23,42,0.05)] space-y-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Premium Program Desk</p>
                                <h3 className="text-[16px] font-black text-white uppercase">Police Verification + Badge Benefits</h3>
                                <p className="text-[10px] font-bold text-black/45 mt-1.5">Manage premium badge messaging, benefits, and verification guidance visible in driver popup and profile page.</p>
                            </div>
                            <button
                                onClick={fetchPremiumManagement}
                                className="h-9 px-4 border border-white/10 rounded-lg text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-white transition-colors"
                            >
                                Refresh Config
                            </button>
                        </div>

                        {premiumConfigLoading ? (
                            <div className="py-14 flex items-center justify-center">
                                <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Popup / Page Title</label>
                                        <input
                                            value={premiumConfigForm.title}
                                            onChange={(event) => setPremiumConfigForm((prev) => ({ ...prev, title: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Subtitle</label>
                                        <input
                                            value={premiumConfigForm.subtitle}
                                            onChange={(event) => setPremiumConfigForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                                            className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Premium Benefits (one per line)</label>
                                    <textarea
                                        rows={6}
                                        value={premiumConfigForm.benefitsText}
                                        onChange={(event) => setPremiumConfigForm((prev) => ({ ...prev, benefitsText: event.target.value }))}
                                        placeholder={'Premium badge on profile\nPriority visibility for high-trust trips\nHigher confidence score during manual assignment'}
                                        className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-y outline-none focus:border-black"
                                    />
                                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mt-1.5">These benefits appear in driver dashboard popup and premium profile page.</p>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={handlePremiumConfigSave}
                                        disabled={premiumConfigSaving}
                                        className="h-10 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
                                    >
                                        {premiumConfigSaving ? 'Saving...' : 'Save Premium Config'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeSection === 'subscriptions' && (
                    <SubscriptionsSection
                        fetchChauffeurPlans={fetchChauffeurPlans}
                        openPlanEditor={openPlanEditor}
                        plansLoading={plansLoading}
                        chauffeurPlans={chauffeurPlans}
                        handlePlanDelete={handlePlanDelete}
                    />
                )}

                {activeSection === 'support' && (
                    <SupportTicketsSection />
                )}

                {/* Legacy duplicated blocks removed for cleaner admin flow
            <div className="bg-white/5 border border-black/[0.04] rounded-[1.6rem] overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Live Chauffeur Ops</p>
                        <h3 className="text-[14px] font-black text-white uppercase">Trips, support desk, and manual interventions</h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <select
                            value={opsFilter}
                            onChange={(event) => setOpsFilter(event.target.value)}
                            className="h-9 border border-white/10 rounded-md px-3 text-[11px] font-black text-white uppercase outline-none"
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
                            className="h-9 w-64 max-w-full border border-white/10 rounded-md px-3 text-[11px] font-bold text-white outline-none focus:border-black"
                        />
                    </div>
                </div>
                {bookingsLoading ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : filteredLiveBookings.length === 0 ? (
                    <div className="py-16 text-center">
                        <CarFront size={32} className="mx-auto text-black/10 mb-3" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No chauffeur trips match this filter</p>
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
                                            <p className="text-[11px] font-black text-white uppercase">
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
                                        <p className="text-[11px] font-black text-white uppercase">
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
                                                className="h-10 px-4 border border-white/10 text-[10px] font-black uppercase rounded-md hover:border-black transition-colors"
                                            >
                                                Review Driver
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openBookingDesk(booking)}
                                            className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
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
            */}

                {/*
            <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-lg px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Pricing Desk</p>
                        <h3 className="text-[14px] font-black text-white uppercase">Consumer spare driver services and live selling prices</h3>
                    </div>
                    <button
                        onClick={fetchChauffeurServices}
                        className="flex items-center gap-2 h-9 px-4 border border-white/10 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-white transition-colors"
                    >
                        <RefreshCw size={13} />
                        Refresh Pricing
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {pricingLoading ? (
                        <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 flex items-center justify-center">
                            <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : chauffeurServices.length === 0 ? (
                        <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 text-center">
                            <IndianRupee size={32} className="mx-auto text-black/10 mb-3" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No chauffeur services found in master data</p>
                        </div>
                    ) : chauffeurServices.map((service) => (
                        <div key={service._id} className="bg-white/5 border border-white/5 rounded-lg p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[12px] font-black text-white uppercase">{service.title}</p>
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-white/[0.05] text-white/60'}`}>
                                            {service.isActive ? 'Live' : 'Hidden'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white/40 mt-1">{service.description || 'No description set'}</p>
                                </div>
                                <button
                                    onClick={() => openPricingEditor(service)}
                                    className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
                                >
                                    Edit Config
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Base Price</p>
                                    <p className="text-[14px] font-black text-white">₹{service.price || 0}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Duration</p>
                                    <p className="text-[13px] font-black text-white">{service.estimatedTime || 0} min</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Service Key</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.id || service.key}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Badge</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.badge || 'None'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Consumer Features</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(service.metadata?.features || []).length ? (service.metadata.features || []).map((feature) => (
                                        <span key={feature} className="px-2 py-1 bg-white/[0.02] text-[9px] font-black text-white/60 uppercase rounded-md border border-white/5">
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
            */}

                {/*
            <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-lg px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Subscription Desk</p>
                        <h3 className="text-[14px] font-black text-white uppercase">Spare-driver-only plans for consumer subscription flow</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={fetchChauffeurPlans}
                            className="flex items-center gap-2 h-9 px-4 border border-white/10 rounded-md text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-white transition-colors"
                        >
                            <RefreshCw size={13} />
                            Refresh Plans
                        </button>
                        <button
                            onClick={() => openPlanEditor()}
                            className="flex items-center gap-2 h-9 px-4 bg-black text-white rounded-md text-[10px] font-black uppercase hover:bg-brand hover:text-white transition-colors"
                        >
                            <Plus size={13} />
                            New Plan
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {plansLoading ? (
                        <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 flex items-center justify-center">
                            <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : chauffeurPlans.length === 0 ? (
                        <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 text-center">
                            <Crown size={32} className="mx-auto text-black/10 mb-3" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No spare driver subscription plans configured yet</p>
                        </div>
                    ) : chauffeurPlans.map((plan) => (
                        <div key={plan._id} className="bg-white/5 border border-white/5 rounded-lg p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[12px] font-black text-white uppercase">{plan.name}</p>
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${plan.status === 'Live' ? 'bg-green-50 text-green-700' : 'bg-white/[0.05] text-white/60'}`}>
                                            {plan.status || 'Live'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white/40 mt-1">
                                        Scope: spare driver only
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openPlanEditor(plan)}
                                        className="h-10 w-10 bg-black text-white rounded-md flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
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
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Plan Price</p>
                                    <p className="text-[14px] font-black text-white">Rs {plan.price || 0}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Credits</p>
                                    <p className="text-[13px] font-black text-white">{plan.credits || 0}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Interval</p>
                                    <p className="text-[13px] font-black text-white">{plan.interval || 'Monthly'}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Max Vehicles</p>
                                    <p className="text-[13px] font-black text-white">{plan.maxVehicles || 1}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Rollover</p>
                                    <p className="text-[12px] font-black text-white">{plan.rollover || 0}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Applicable Services</p>
                                    <p className="text-[10px] font-black text-black/55 uppercase">
                                        {(plan.applicableServices || []).length === 0
                                            ? 'ALL SPARE DRIVER SERVICES'
                                            : (plan.applicableServices || []).map((entry) => {
                                                const normalized = normalizeApplicableValue(entry);
                                                if (normalized === 'SPARE_DRIVER' || normalized === 'CHAUFFEUR') {
                                                    return 'ALL SPARE DRIVER SERVICES';
                                                }

                                                const matchedService = chauffeurServices.find((service) => (
                                                    normalizeApplicableValue(service.metadata?.id || service.key || service.title) === normalized
                                                ));

                                                return matchedService?.title || normalized.replace(/_/g, ' ');
                                            }).join(', ')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Plan Features</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(plan.features || []).length ? plan.features.map((feature) => (
                                        <span key={feature} className="px-2 py-1 bg-white/[0.02] text-[9px] font-black text-white/60 uppercase rounded-md border border-white/5">
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
            */}

            </div>

            {selectedDriver && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white/5 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver Review</p>
                                <h3 className="text-lg font-black text-white uppercase">{selectedDriver.name}</h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${STATUS_CONFIG[normalizeDriverStatus(selectedDriver.status)]?.color || STATUS_CONFIG.pending_docs.color}`}>
                                {STATUS_CONFIG[normalizeDriverStatus(selectedDriver.status)]?.label || STATUS_CONFIG.pending_docs.label}
                            </span>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Phone</p>
                                    <p className="text-[11px] font-black text-white">{selectedDriver.phone || 'Not available'}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Email</p>
                                    <p className="text-[10px] font-black text-white truncate">{selectedDriver.email || 'Not available'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">Documents</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Aadhaar Front', url: selectedDriver.documents?.aadhaarCard?.frontUrl },
                                        { label: 'Aadhaar Back', url: selectedDriver.documents?.aadhaarCard?.backUrl },
                                        { label: 'PAN Card', url: selectedDriver.documents?.panCard?.url },
                                        { label: 'Driving License', url: selectedDriver.documents?.drivingLicense?.url },
                                        { label: 'Live Selfie', url: selectedDriver.documents?.selfie?.url },
                                        { label: 'Police Verification', url: selectedDriver.documents?.policeVerification?.url }
                                    ].map(({ label, url }) => (
                                        <div key={label} className="flex items-center justify-between px-3 py-2.5 border border-white/5 rounded-md">
                                            <span className="text-[10px] font-black text-white uppercase">{label}</span>
                                            {url ? (
                                                <a href={url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand uppercase underline">
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-[9px] font-black text-white/20 uppercase">Not uploaded</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Kit Status</p>
                                    <p className="text-[11px] font-black text-white uppercase">{selectedDriver.kit?.paymentStatus || 'pending'}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Premium Police Status</p>
                                    <p className="text-[11px] font-black text-white uppercase">{selectedDriver.verification?.policeStatus || 'pending'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Kit Price</p>
                                    <p className="text-[11px] font-black text-white">₹{selectedDriver.kit?.price || 1499}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Payment Ref</p>
                                    <p className="text-[11px] font-black text-white">{selectedDriver.kit?.paymentReference || 'Not submitted'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Police Ref Number</p>
                                    <p className="text-[11px] font-black text-white">{selectedDriver.documents?.policeVerification?.number || 'Not submitted'}</p>
                                </div>
                                <div className="border border-white/5 rounded-md p-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Police Verified At</p>
                                    <p className="text-[11px] font-black text-white">
                                        {selectedDriver.verification?.policeVerifiedAt
                                            ? new Date(selectedDriver.verification.policeVerifiedAt).toLocaleString('en-IN')
                                            : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            {selectedDriver.kit?.paymentProofUrl && (
                                <div className="flex items-center justify-between px-3 py-2.5 border border-white/5 rounded-md">
                                    <span className="text-[10px] font-black text-white uppercase">Kit Payment Proof</span>
                                    <a href={selectedDriver.kit.paymentProofUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand uppercase underline">
                                        View
                                    </a>
                                </div>
                            )}

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Admin Note</label>
                                <textarea
                                    rows={3}
                                    value={driverActionNote}
                                    onChange={(event) => setDriverActionNote(event.target.value)}
                                    placeholder="Reason for approval, rejection, suspension, or support note..."
                                    className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="px-6 pb-5 grid grid-cols-4 gap-3">
                            <button
                                onClick={() => setSelectedDriver(null)}
                                className="h-10 border border-white/10 text-white/40 text-[10px] font-black uppercase rounded-md hover:border-gray-400 transition-colors"
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
                                className="h-10 bg-white/[0.05] text-white/80 border border-white/10 text-[10px] font-black uppercase rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <AlertTriangle size={13} />
                                Suspend
                            </button>
                            {primaryDriverAction ? (
                                <button
                                    onClick={() => handleVerify(primaryDriverAction.status)}
                                    disabled={driverActioning}
                                    className="h-10 bg-black text-white text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5 hover:bg-brand hover:text-white transition-colors"
                                >
                                    <CheckCircle2 size={13} />
                                    {primaryDriverAction.label}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="h-10 bg-white/[0.05] text-gray-400 text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle2 size={13} />
                                    Waiting Kit
                                </button>
                            )}
                        </div>
                        <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handlePremiumVerificationAction('reject')}
                                disabled={driverActioning || !selectedDriver.documents?.policeVerification?.url}
                                className="h-10 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reject Premium
                            </button>
                            <button
                                onClick={() => handlePremiumVerificationAction('approve')}
                                disabled={driverActioning || !selectedDriver.documents?.policeVerification?.url}
                                className="h-10 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-md hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Approve Premium
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedPlan !== null && (
                <div className="fixed inset-0 z-[204] flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="bg-white/5 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Subscription Control</p>
                                <h3 className="text-lg font-black text-white uppercase">
                                    {selectedPlan?._id ? 'Edit Spare Driver Plan' : 'Create Spare Driver Plan'}
                                </h3>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-white/[0.05] text-white/60">
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Status</label>
                                    <select
                                        value={planForm.status}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, status: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Billing Interval</label>
                                    <select
                                        value={planForm.interval}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, interval: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Max Vehicles</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={planForm.maxVehicles}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, maxVehicles: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Rollover</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.rollover}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, rollover: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Accent</label>
                                    <input
                                        value={planForm.accent}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, accent: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Plan Applies To</label>
                                    <select
                                        value={planForm.applicableService}
                                        onChange={(event) => setPlanForm((prev) => ({ ...prev, applicableService: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    >
                                        <option value="SPARE_DRIVER">All Spare Driver Services</option>
                                        {chauffeurServices.map((service) => {
                                            const serviceToken = normalizeApplicableValue(service.metadata?.id || service.key || service.title);
                                            return (
                                                <option key={service._id} value={serviceToken}>
                                                    {service.title}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <p className="mt-2 text-[10px] font-bold text-black/35">
                                        Global wash passes will not be used here. This plan will stay inside the spare driver module only.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Plan Features</label>
                                <textarea
                                    rows={5}
                                    value={planForm.featuresText}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, featuresText: event.target.value }))}
                                    placeholder={'Priority chauffeur dispatch\nDiscounted spare-driver rates\nDedicated support'}
                                    className="w-full border border-white/10 rounded-md px-3 py-3 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="h-10 px-4 border border-white/10 text-white/40 text-[10px] font-black uppercase rounded-md hover:border-gray-400 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePlanSave}
                                disabled={planSaving}
                                className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase rounded-md flex items-center justify-center gap-1.5 hover:bg-brand hover:text-white transition-colors"
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
                    <div className="bg-white/5 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Pricing Control</p>
                                <h3 className="text-lg font-black text-white uppercase">{selectedPricingService.title}</h3>
                            </div>
                            <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-white/[0.05] text-white/60">
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Badge</label>
                                    <input
                                        value={pricingForm.badge}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, badge: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    value={pricingForm.description}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, description: event.target.value }))}
                                    className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.estimatedTime}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, estimatedTime: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Sort Order</label>
                                    <input
                                        type="number"
                                        value={pricingForm.sortOrder}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Visibility</label>
                                    <select
                                        value={pricingForm.isActive ? 'live' : 'hidden'}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, isActive: event.target.value === 'live' }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white uppercase outline-none focus:border-black"
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
                                    className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Slots</label>
                                <textarea
                                    rows={3}
                                    value={pricingForm.durationOptionsText}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, durationOptionsText: event.target.value }))}
                                    placeholder="One slot per line, for example 4 Hours"
                                    className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Duration Pricing</label>
                                <textarea
                                    rows={4}
                                    value={pricingForm.durationPricingText}
                                    onChange={(event) => setPricingForm((prev) => ({ ...prev, durationPricingText: event.target.value }))}
                                    placeholder={"One slot per line, for example 1 Hour=299"}
                                    className="w-full border border-white/10 rounded-md px-3 py-2 text-[11px] font-bold text-white resize-none outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Wait Charge/Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.waitChargePerMinute}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, waitChargePerMinute: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Overtime Grace Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.overtimeGraceMinutes}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, overtimeGraceMinutes: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Night Allowance</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.nightAllowance}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, nightAllowance: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Outstation / Day</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.outstationAllowancePerDay}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, outstationAllowancePerDay: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Sub Hourly Rate</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pricingForm.subscriptionHourlyRate}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, subscriptionHourlyRate: event.target.value }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
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
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">GST Mode</label>
                                    <select
                                        value={pricingForm.gstInclusive ? 'inclusive' : 'exclusive'}
                                        onChange={(event) => setPricingForm((prev) => ({ ...prev, gstInclusive: event.target.value === 'inclusive' }))}
                                        className="w-full h-11 border border-white/10 rounded-md px-3 text-[11px] font-black text-white uppercase outline-none focus:border-black"
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
                                className="h-10 px-5 border border-white/10 text-black/50 text-[10px] font-black uppercase rounded-md hover:border-black hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePricingSave}
                                disabled={pricingSaving}
                                className="h-10 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
                            >
                                {pricingSaving ? 'Saving...' : 'Save Pricing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedBooking && (
                <div
                    className="fixed inset-0 z-[210] flex items-stretch justify-end bg-black/55 backdrop-blur-[2px]"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="h-full w-full max-w-[42rem] bg-[linear-gradient(180deg,#FFF9EF_0%,#FFFFFF_18%,#FFFFFF_100%)] dark:bg-slate-950 overflow-y-auto shadow-[-12px_0_40px_rgba(15,23,42,0.24)] border-l border-black/[0.04] dark:border-white/10"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 dark:border-white/10 bg-white/85 dark:bg-slate-950/90 backdrop-blur flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest mb-1">Operations Desk</p>
                                <h3 className="text-lg font-black text-white dark:text-white uppercase">
                                    {selectedBooking.serviceName || 'Chauffeur Service'} - {selectedBooking.bookingId || selectedBooking._id?.slice(-6)}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${(BOOKING_STATUS_CONFIG[selectedBooking.status] || BOOKING_STATUS_CONFIG.pending).color}`}>
                                    {(BOOKING_STATUS_CONFIG[selectedBooking.status] || BOOKING_STATUS_CONFIG.pending).label}
                                </span>
                                {selectedBooking.payment?.status && (
                                    <span className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-white/[0.05] dark:bg-white/10 text-white/60 dark:text-white/65">
                                        Payment {selectedBooking.payment.status}
                                    </span>
                                )}
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="h-8 px-3 border border-white/10 dark:border-white/15 rounded-md text-[10px] font-black uppercase text-black/55 dark:text-white/70 hover:border-black dark:hover:border-white/45 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border border-black/[0.04] dark:border-white/10 rounded-[1.1rem] p-4 space-y-2 bg-white/5 dark:bg-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.04)] dark:shadow-none">
                                    <p className="text-[8px] font-black text-black/25 dark:text-white/45 uppercase tracking-widest">Customer</p>
                                    <p className="text-[12px] font-black text-white dark:text-white uppercase">{selectedBooking.consumer?.name || 'Pending'}</p>
                                    <p className="text-[10px] font-bold text-black/45 dark:text-white/60">{selectedBooking.consumer?.phone || 'No phone'}</p>
                                    <p className="text-[10px] font-bold text-black/35 dark:text-white/55">{getBookingAddress(selectedBooking)}</p>
                                </div>
                                <div className="border border-white/5 dark:border-white/10 rounded-[1.1rem] p-4 space-y-2 bg-white/5 dark:bg-slate-900">
                                    <p className="text-[8px] font-black text-black/25 dark:text-white/45 uppercase tracking-widest">Trip Snapshot</p>
                                    <p className="text-[12px] font-black text-white dark:text-white uppercase">{getBookingAmount(selectedBooking)}</p>
                                    <p className="text-[10px] font-bold text-black/45 dark:text-white/60">Schedule: {getBookingSchedule(selectedBooking)}</p>
                                    {getBookedDurationLabel(selectedBooking) && (
                                        <p className="text-[10px] font-bold text-black/45 dark:text-white/60">
                                            Booked Window: {getBookedDurationLabel(selectedBooking)}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold text-black/35 dark:text-white/55">
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
                                <div className="border border-white/5 dark:border-white/10 rounded-[1.1rem] p-4 space-y-2 bg-white/5 dark:bg-slate-900">
                                    <p className="text-[8px] font-black text-black/25 dark:text-white/45 uppercase tracking-widest">Current Driver</p>
                                    <p className="text-[12px] font-black text-white dark:text-white uppercase">
                                        {getAssignedDriver(selectedBooking)?.name || 'Not assigned'}
                                    </p>
                                    <p className="text-[10px] font-bold text-black/45 dark:text-white/60">
                                        {getAssignedDriver(selectedBooking)?.phone || 'No driver linked yet'}
                                    </p>
                                    <p className="text-[10px] font-bold text-black/35 dark:text-white/55">
                                        Open issues: {getOpenIssueCount(selectedBooking)}
                                    </p>
                                    {livePulseMap[selectedBooking._id]?.driver?.at && (
                                        <p className="text-[10px] font-bold text-emerald-600">
                                            Driver pulse: {new Date(livePulseMap[selectedBooking._id].driver.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Tactical Map View */}
                            <div className="border border-white/5 dark:border-white/10 rounded-[1.1rem] overflow-hidden bg-white/5 dark:bg-slate-900 shadow-soft h-[300px] relative">
                                <TacticalMapView 
                                    booking={selectedBooking} 
                                    pulses={livePulseMap[selectedBooking._id]} 
                                />
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-white/20 pointer-events-none">
                                    <h4 className="text-[9px] font-black text-brand uppercase tracking-widest">Live Tactical Grid</h4>
                                    <p className="text-[8px] font-bold text-content-subtle uppercase">Proximity & Route Sync</p>
                                </div>
                            </div>

                            <div className="border border-white/5 dark:border-white/10 rounded-[1.1rem] p-4 space-y-4 bg-white/5 dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-[#F29F05]" />
                                    <p className="text-[11px] font-black text-white dark:text-white uppercase">Manual Dispatch & Support Controls</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                                    <div>
                                        <label className="block text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest mb-1.5">Select Verified Online Driver</label>
                                        <select
                                            value={selectedAssignDriverId}
                                            onChange={(event) => setSelectedAssignDriverId(event.target.value)}
                                            className="w-full h-11 border border-white/10 dark:border-white/15 rounded-md px-3 text-[11px] font-black text-white dark:text-white uppercase outline-none bg-white/5 dark:bg-slate-800"
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
                                        className="h-11 px-5 bg-black text-white text-[10px] font-black uppercase rounded-md hover:bg-brand hover:text-white transition-colors"
                                    >
                                        {getAssignedDriver(selectedBooking) ? 'Reassign Driver' : 'Assign Driver'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest mb-1.5">Operations Note</label>
                                    <textarea
                                        rows={3}
                                        value={bookingActionNote}
                                        onChange={(event) => setBookingActionNote(event.target.value)}
                                        placeholder="Explain why you are reassigning, releasing, cancelling, or updating support status..."
                                        className="w-full border border-white/10 dark:border-white/15 rounded-md px-3 py-2 text-[11px] font-bold text-white dark:text-white resize-none outline-none focus:border-black dark:bg-slate-800"
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
                                            className="h-10 px-4 border border-white/10 dark:border-white/15 text-[10px] font-black uppercase rounded-md hover:border-black dark:hover:border-white/45 transition-colors text-white dark:text-white"
                                        >
                                            Review Current Driver
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border border-white/5 dark:border-white/10 rounded-[1.1rem] p-4 space-y-4 bg-white/5 dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={16} className="text-black/55 dark:text-white/70" />
                                    <p className="text-[11px] font-black text-white dark:text-white uppercase">Issue Resolution Desk</p>
                                </div>

                                {selectedBooking.issues?.length ? (
                                    <div className="space-y-3">
                                        {selectedBooking.issues.map((issue) => (
                                            <div key={issue._id} className="border border-white/5 dark:border-white/10 rounded-md p-3">
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-black text-white dark:text-white uppercase">{issue.type || 'Support'}</span>
                                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${ISSUE_STATUS_CONFIG[issue.status] || ISSUE_STATUS_CONFIG.open}`}>
                                                                {issue.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-black/55 dark:text-white/65">{issue.description || 'No issue description provided.'}</p>
                                                        <p className="text-[9px] font-black text-black/25 dark:text-white/45 uppercase">
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
                                                            className="h-9 px-3 bg-white/[0.05] text-white/80 text-[9px] font-black uppercase rounded-md hover:bg-gray-200 transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-white/10 dark:border-white/15 rounded-md p-6 text-center">
                                        <p className="text-[10px] font-black text-black/25 dark:text-white/45 uppercase tracking-widest">No support issues linked to this trip yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex items-center justify-end">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="h-10 px-5 border border-white/10 dark:border-white/15 text-black/50 dark:text-white/70 text-[10px] font-black uppercase rounded-md hover:border-black dark:hover:border-white/45 hover:text-white dark:hover:text-white transition-colors"
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

const TacticalMapView = ({ booking, pulses }) => {
    const pickup = booking.location?.address?.coordinates;
    const destination = booking.location?.destination?.coordinates;
    const driver = pulses?.driver;
    const consumer = pulses?.consumer;

    const markers = useMemo(() => {
        const list = [];
        
        // Pickup Marker (User + Car)
        if (pickup?.lat) {
            list.push({
                id: 'pickup',
                position: { lat: pickup.lat, lng: pickup.lng },
                title: 'User Vehicle',
                icon: {
                    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z M12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm2 5h-4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1z',
                    fillColor: '#ef4444',
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#ffffff',
                    scale: 1.2,
                    anchor: new window.google.maps.Point(12, 12)
                }
            });
        }

        // Destination Marker
        if (destination?.lat) {
            list.push({
                id: 'destination',
                position: { lat: destination.lat, lng: destination.lng },
                title: 'Destination',
                icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
        }

        // Driver Marker (Specialist)
        if (driver?.lat) {
            list.push({
                id: 'driver',
                position: { lat: driver.lat, lng: driver.lng },
                title: 'Driver Live',
                icon: {
                    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-15c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 12h-2v-2h2v2zm0-4h-2V7h2v6z',
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#ffffff',
                    scale: 1.5,
                    anchor: new window.google.maps.Point(12, 12)
                }
            });
        }

        // Consumer Marker (if pulse active)
        if (consumer?.lat && (!driver?.lat || Math.abs(consumer.lat - driver.lat) > 0.001)) {
            list.push({
                id: 'consumer',
                position: { lat: consumer.lat, lng: consumer.lng },
                title: 'Consumer Live',
                icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            });
        }

        return list;
    }, [pickup, destination, driver, consumer]);

    const center = driver || consumer || pickup || { lat: 28.6139, lng: 77.2090 };

    return (
        <GoogleMapBox 
            center={center}
            zoom={14}
            markers={markers}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
                    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] }
                ]
            }}
        />
    );
};

export default AdminSpareDrivers;
