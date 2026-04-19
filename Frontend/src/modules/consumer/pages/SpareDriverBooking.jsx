import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, User, MapPin, Calendar, Clock, Car,
    ChevronRight, Star, Shield, Info, CheckCircle2,
    ShieldCheck, Lock,
    X, Timer, Navigation, Phone, MessageSquare,
    AlertTriangle, Search, CreditCard, Play,
    Loader2, Check, Map, Settings, Zap, ArrowRight
} from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import bookingAPI, { serviceAPI, spareDriverAPI, subscriptionAPI, vehicleAPI } from '../../../utils/api';
import { socketService } from '../../../utils/socket';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';
import Header from '../../../components/common/Header';

// 🏎️ Chauffeur Service Visuals
import pointImg from '../../../assets/chauffeur/point.png';
import hourlyImg from '../../../assets/chauffeur/hourly.png';
import fullImg from '../../../assets/chauffeur/full.png';
import outstationImg from '../../../assets/chauffeur/outstation.png';

const PHASES = {
    SERVICE_TYPE: 'SERVICE_TYPE',
    BOOKING_DETAILS: 'BOOKING_DETAILS',
    CONFIRM_VEHICLE: 'CONFIRM_VEHICLE',
    CHECKOUT: 'CHECKOUT',
    FINDING_DRIVER: 'FINDING_DRIVER',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    TRIP_ACTIVE: 'TRIP_ACTIVE',
    TRIP_COMPLETED: 'TRIP_COMPLETED'
};

// 🛠️ Asset Protocol: Unique Service Identities
const SERVICE_ASSETS = {
    'point': { icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', color: '#1E293B', pulse: 'animate-pulse' }, // Slate-800
    'hourly': { icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', color: '#1E293B', pulse: 'animate-bounce' }, 
    'full': { icon: 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png', color: '#FF9900', pulse: 'animate-pulse' }, // Brand
    'outstation': { icon: 'https://cdn-icons-png.flaticon.com/512/2330/2330453.png', color: '#334155', pulse: 'animate-pulse' },
    'user': 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png'
};

const SERVICE_CARD_IMAGES = {
    point: pointImg,
    hourly: hourlyImg,
    full: fullImg,
    outstation: outstationImg
};

const LOOKUP_WINDOW_SECONDS = 180;
const CHAUFFEUR_SEARCH_STARTED_KEY = 'chauffeur_search_started_at';

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createDriverMarkerIcon = (accent = '#FF9900') => svgToDataUrl(`
<svg width="64" height="78" viewBox="0 0 64 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="69" rx="15" ry="5" fill="rgba(15,23,42,0.18)"/>
  <path d="M32 4C20.954 4 12 12.954 12 24C12 39 32 58 32 58C32 58 52 39 52 24C52 12.954 43.046 4 32 4Z" fill="#101828"/>
  <path d="M32 7.5C22.887 7.5 15.5 14.887 15.5 24C15.5 36.173 32 52.166 32 52.166C32 52.166 48.5 36.173 48.5 24C48.5 14.887 41.113 7.5 32 7.5Z" fill="#111827" stroke="${accent}" stroke-width="2"/>
  <circle cx="32" cy="24" r="12.5" fill="white" fill-opacity="0.96"/>
  <rect x="23" y="23.5" width="18" height="5.2" rx="2.6" fill="${accent}"/>
  <rect x="26" y="19" width="12" height="4.8" rx="2.2" fill="${accent}" fill-opacity="0.82"/>
  <circle cx="27" cy="30.5" r="2.6" fill="#111827"/>
  <circle cx="37" cy="30.5" r="2.6" fill="#111827"/>
</svg>
`);

const USER_AND_CAR_MARKER = svgToDataUrl(`
<svg width="72" height="84" viewBox="0 0 72 84" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="36" cy="75" rx="18" ry="6" fill="rgba(15,23,42,0.16)"/>
  <path d="M36 5C23.85 5 14 14.85 14 27C14 43.5 36 64 36 64C36 64 58 43.5 58 27C58 14.85 48.15 5 36 5Z" fill="white" stroke="#FF9900" stroke-width="2.4"/>
  <circle cx="36" cy="24.5" r="12.5" fill="#FFF7ED"/>
  <circle cx="36" cy="20.2" r="4.6" fill="#F97316"/>
  <path d="M28 30.6C28 27.9 30.2 25.7 32.9 25.7H39.1C41.8 25.7 44 27.9 44 30.6V33H28V30.6Z" fill="#FF9900"/>
  <rect x="23" y="34.2" width="26" height="7" rx="3.5" fill="#111827"/>
  <rect x="27.5" y="28.8" width="17" height="6.1" rx="2.6" fill="#111827"/>
  <circle cx="29.5" cy="42.8" r="3.1" fill="#111827"/>
  <circle cx="42.5" cy="42.8" r="3.1" fill="#111827"/>
</svg>
`);

// 🏛️ Fallback Protocol: Static Service Reference
const SERVICE_TYPES = [
    { id: 'point', title: 'Point to point', subtitle: 'Round trip from your location', basePrice: 499 },
    { id: 'hourly', title: 'Hourly booking', subtitle: 'Flexible rental', basePrice: 799 },
    { id: 'full', title: 'Full day', subtitle: 'Dedicated city shift', basePrice: 999 },
    { id: 'outstation', title: 'Outstation', subtitle: 'Inter-city travel', basePrice: 2499 }
];

const SERVICE_FLOW_META = {
    point: {
        summaryLabel: 'Return trip driver',
        durationLabel: 'Time-based round trip',
        supportNote: 'Driver picks you up and drops you back at the same location.'
    },
    hourly: {
        summaryLabel: 'Flexible booking',
        durationLabel: '4 to 8 hour usage',
        supportNote: 'Ideal for multiple stops within the booked hourly window.'
    },
    full: {
        summaryLabel: 'Dedicated day shift',
        durationLabel: 'Dedicated chauffeur shift',
        supportNote: 'Designed for full-day office, family, or event movement.'
    },
    outstation: {
        summaryLabel: 'Inter-city mission',
        durationLabel: '24 hour travel block',
        supportNote: 'Supports longer routes with outstation safety and allowance rules.'
    }
};

const normalizeServiceKind = (service = {}) => {
    const identity = [
        service.kind,
        service.id,
        service.serviceId,
        service.key,
        service.title,
        service.name,
        service.subtitle,
        service.description,
        service.metadata?.id,
        service.metadata?.path,
        service.metadata?.category
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (identity.includes('outstation')) return 'outstation';
    if (identity.includes('full day') || identity.includes('full-day') || identity.includes('fullday')) return 'full';
    if (identity.includes('hourly') || identity.includes('hourly booking')) return 'hourly';
    if (identity.includes('point to point') || identity.includes('point-to-point') || identity.includes('point')) return 'point';
    return 'hourly';
};

const getDefaultDurationForKind = (kind) => {
    if (kind === 'full') return '8 Hours';
    if (kind === 'outstation') return '24 Hours';
    if (kind === 'point') return '1 Hour';
    return '4 Hours';
};

const getDurationOptionsForService = (service = {}) => {
    const kind = normalizeServiceKind(service);
    const configuredOptions = Array.isArray(service?.metadata?.durationOptions)
        ? service.metadata.durationOptions
        : [];

    const sanitizedOptions = configuredOptions
        .map((option) => String(option || '').trim())
        .filter(Boolean);

    if (sanitizedOptions.length > 0) {
        return [...new Set(sanitizedOptions)];
    }

    if (kind === 'hourly') return ['4 Hours', '8 Hours'];
    if (kind === 'full') return ['8 Hours'];
    if (kind === 'outstation') return ['24 Hours'];
    if (kind === 'point') return ['1 Hour', '2 Hours', '4 Hours'];
    return [getDefaultDurationForKind(kind)];
};

const calculateDurationMultiplier = (kind, durationLabel = '') => {
    const hours = parseInt(String(durationLabel).match(/\d+/)?.[0] || '1', 10);

    if (kind === 'point') {
        return Math.max(1, hours);
    }

    if (kind !== 'hourly') return 1;

    return Math.max(1, Math.round(hours / 4));
};

const normalizeDurationLabel = (value = '') => (
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
);

const normalizeApplicableValue = (value = '') => String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getChauffeurServiceTokens = (service = {}) => {
    const tokens = new Set();

    [
        service.id,
        service.key,
        service.title,
        service.name,
        service.metadata?.id,
        service.metadata?.path,
        service.metadata?.category,
        normalizeServiceKind(service)
    ].forEach((value) => {
        const normalized = normalizeApplicableValue(value);
        if (normalized) tokens.add(normalized);
    });

    return tokens;
};

const planAppliesToChauffeurService = (plan = {}, service = null) => {
    if (!service) return true;

    const applicableServices = Array.isArray(plan?.applicableServices) ? plan.applicableServices : [];
    if (applicableServices.length === 0) return false;

    const serviceTokens = getChauffeurServiceTokens(service);

    return applicableServices.some((entry) => {
        const normalized = normalizeApplicableValue(entry);
        if (!normalized) return false;
        if (normalized === 'SPARE_DRIVER' || normalized === 'CHAUFFEUR') return true;
        if (serviceTokens.has(normalized)) return true;
        return [...serviceTokens].some((token) => token.includes(normalized) || normalized.includes(token));
    });
};

const getDurationSlotPrice = (service = {}, durationLabel = '') => {
    const rawPricing = service?.metadata?.durationPricing;
    if (!rawPricing || typeof rawPricing !== 'object') return null;

    const normalizedLabel = normalizeDurationLabel(durationLabel);
    if (!normalizedLabel) return null;

    const directMatch = Object.entries(rawPricing).find(([label]) => normalizeDurationLabel(label) === normalizedLabel);
    const amount = directMatch ? Number(directMatch[1]) : NaN;
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const getDurationHours = (durationLabel = '', fallbackHours = 1) => {
    const hours = parseInt(String(durationLabel || '').match(/\d+/)?.[0] || `${fallbackHours}`, 10);
    return Number.isFinite(hours) && hours > 0 ? hours : fallbackHours;
};

const formatDateInputValue = (date = new Date()) => {
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

const formatTimeInputValue = (date = new Date()) => date.toTimeString().slice(0, 5);

const getDefaultScheduledSlot = () => ({
    date: formatDateInputValue(new Date(Date.now() + 86400000)),
    time: '10:00'
});

const getInstantScheduleSnapshot = () => {
    const instantTime = new Date(Date.now() + (5 * 60 * 1000));
    return {
        date: formatDateInputValue(instantTime),
        time: formatTimeInputValue(instantTime)
    };
};

const hasValidCoords = (location) => (
    location
    && typeof location.lat === 'number'
    && typeof location.lng === 'number'
    && Number.isFinite(location.lat)
    && Number.isFinite(location.lng)
);

const useSmoothedLocation = (targetLocation, duration = 900) => {
    const [displayLocation, setDisplayLocation] = useState(
        hasValidCoords(targetLocation) ? targetLocation : null
    );
    const frameRef = useRef(null);

    useEffect(() => {
        if (!hasValidCoords(targetLocation)) {
            return undefined;
        }

        const startLocation = hasValidCoords(displayLocation) ? displayLocation : targetLocation;
        const distance = Math.abs(startLocation.lat - targetLocation.lat) + Math.abs(startLocation.lng - targetLocation.lng);

        if (distance < 0.00001) {
            setDisplayLocation(targetLocation);
            return undefined;
        }

        const startedAt = Date.now();
        const tick = () => {
            const progress = Math.min(1, (Date.now() - startedAt) / duration);
            setDisplayLocation({
                lat: startLocation.lat + ((targetLocation.lat - startLocation.lat) * progress),
                lng: startLocation.lng + ((targetLocation.lng - startLocation.lng) * progress)
            });

            if (progress < 1) {
                frameRef.current = window.requestAnimationFrame(tick);
            }
        };

        frameRef.current = window.requestAnimationFrame(tick);

        return () => {
            if (frameRef.current) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, [targetLocation?.lat, targetLocation?.lng, duration]);

    return hasValidCoords(displayLocation) ? displayLocation : (hasValidCoords(targetLocation) ? targetLocation : null);
};

const calculateDistanceKm = (origin, target) => {
    if (!origin?.lat || !origin?.lng || !target?.lat || !target?.lng) return 0;

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(target.lat - origin.lat);
    const dLng = toRad(target.lng - origin.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(origin.lat)) * Math.cos(toRad(target.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.max(0, Math.round(earthRadiusKm * c));
};

const getLookupRemainingSeconds = (startedAt) => {
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
        return LOOKUP_WINDOW_SECONDS;
    }

    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, LOOKUP_WINDOW_SECONDS - elapsedSeconds);
};

const requiresDestinationForKind = (kind) => ['outstation'].includes(kind);

const sanitizePrice = (service = {}) => {
    if (typeof service.basePrice === 'number') return service.basePrice;
    if (typeof service.price === 'number') return service.price;
    const parsed = parseInt(String(service.price || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const buildSelectedType = (service = {}) => {
    const kind = normalizeServiceKind(service);
    return {
        kind,
        serviceId: service._id || service.id || kind,
        title: service.name || service.title || 'Chauffeur Service',
        subtitle: service.description || service.subtitle || '',
        img: service.image || service.img || SERVICE_CARD_IMAGES[kind] || SERVICE_CARD_IMAGES.point,
        basePrice: sanitizePrice(service),
        rating: service.rating || '4.9',
        metadata: service.metadata || {},
        durationOptions: getDurationOptionsForService(service)
    };
};

const formatInr = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const CHAUFFEUR_DISPATCH_LEAD_MINUTES = 15;

// 🛡️ Zero-Trust Multiplier Helper (For Estimation Only)
const getVehicleMultiplier = (vehicle, vehicleTypes) => {
    // Priority 1: Direct ref from vehicle object
    if (vehicle?.typeRef?.multiplier) return vehicle.typeRef.multiplier;
    
    // Priority 2: Lookup in fetched types
    const found = vehicleTypes.find(t => t.type === vehicle?.type || t.name === vehicle?.type);
    return found?.multiplier || 1.0;
};

const maskSecurityPin = (pin) => {
    const normalized = String(pin || '').trim().replace(/\D/g, '');
    if (!normalized) return '----';
    return normalized.slice(0, 4).padEnd(4, '-');
};

const getScheduledServiceTime = (schedule = {}) => {
    if (!schedule?.date) return new Date();

    const scheduledAt = new Date(schedule.date);
    if (schedule?.timeSlot?.start) {
        const [hours, minutes] = String(schedule.timeSlot.start).split(':').map(Number);
        scheduledAt.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    }

    return scheduledAt;
};

const isDispatchReadyBooking = (booking = {}, leadMinutes = CHAUFFEUR_DISPATCH_LEAD_MINUTES) => {
    const schedule = booking?.schedule || {};
    if (schedule.type !== 'scheduled') return true;
    return getScheduledServiceTime(schedule).getTime() <= (Date.now() + (leadMinutes * 60 * 1000));
};

const resolveChauffeurPhase = (booking = {}) => {
    const status = booking?.status;

    if (status === 'completed') return PHASES.TRIP_COMPLETED;
    if (status === 'active') return PHASES.TRIP_ACTIVE;
    if (['en_route', 'arrived'].includes(status)) return PHASES.BOOKING_CONFIRMED;
    if (status === 'pending' && !isDispatchReadyBooking(booking)) return PHASES.BOOKING_CONFIRMED;
    if (status === 'cancelled') return PHASES.SERVICE_TYPE;
    return PHASES.FINDING_DRIVER;
};

const SpareDriverBooking = () => {
    const navigate = useNavigate();
    const { 
        vehicles, vehiclesLoading, refreshStats, getUser,
        getRazorpayKey, createPaymentOrder, verifyPayment 
    } = useAuth();

    // 🛡️ Proactive Redirect: Force users with 0 vehicles to Garaj
    useEffect(() => {
        if (!vehiclesLoading && vehicles && vehicles.length === 0) {
            toast.error('Register your vehicle', { icon: '🚗', id: 'vehicle-registration-toast' });
            const timer = setTimeout(() => navigate('/vehicles?from=spare-driver&mode=add'), 1200);
            return () => clearTimeout(timer);
        }
    }, [vehicles, vehiclesLoading, navigate]);
    const { savedAddresses: addresses, selectedAddress, currentLocation } = useGeoLocation();
    const userCoords = useMemo(() => 
        selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 }
    , [selectedAddress, currentLocation]);
    const [searchParams] = useSearchParams();
    const typeFromUrl = searchParams.get('type');
    const vehicleIdFromUrl = searchParams.get('vehicleId');

    const [services, setServices] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [chauffeurPlans, setChauffeurPlans] = useState([]);
    const [chauffeurSubscription, setChauffeurSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    // State
    const [phase, setPhase] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_booking_phase');
        return saved || PHASES.SERVICE_TYPE;
    });

    useEffect(() => {
        sessionStorage.setItem('chauffeur_booking_phase', phase);
    }, [phase]);

    const [selectedType, setSelectedType] = useState(() => {
        if (typeFromUrl) {
            const found = SERVICE_TYPES.find(t => t.id === typeFromUrl);
            if (found) return found;
        }
        const saved = sessionStorage.getItem('chauffeur_selected_type');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (selectedType) {
            sessionStorage.setItem('chauffeur_selected_type', JSON.stringify(selectedType));
        }
    }, [selectedType]);

    useEffect(() => {
        if (!selectedType) return;
        if (selectedType.kind && selectedType.serviceId) return;

        setSelectedType((prev) => {
            if (!prev) return prev;
            const normalized = buildSelectedType(prev);
            return {
                ...prev,
                ...normalized
            };
        });
    }, [selectedType]);

    useEffect(() => {
        if (!selectedType) return;

        const nextOptions = getDurationOptionsForService(selectedType);
        const preferredDuration = nextOptions[0] || getDefaultDurationForKind(normalizeServiceKind(selectedType));

        setBookingDetails((prev) => {
            if (!prev) {
                const scheduledSlot = getDefaultScheduledSlot();
                return {
                    bookingMode: 'instant',
                    date: scheduledSlot.date,
                    time: scheduledSlot.time,
                    duration: preferredDuration
                };
            }

            if (nextOptions.includes(prev.duration)) {
                return prev;
            }

            return {
                ...prev,
                duration: preferredDuration
            };
        });
    }, [selectedType]);

    const [bookingDetails, setBookingDetails] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_booking_details');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                bookingMode: parsed.bookingMode || parsed.schedule?.type || 'instant',
                ...parsed
            };
        }

        const scheduledSlot = getDefaultScheduledSlot();
        return {
            bookingMode: 'instant',
            date: scheduledSlot.date,
            time: scheduledSlot.time,
            duration: '4 Hours',
            bookingFor: 'Own'
        };
    });

    useEffect(() => {
        if (!selectedType && [PHASES.BOOKING_DETAILS, PHASES.CONFIRM_VEHICLE, PHASES.FINDING_DRIVER, PHASES.BOOKING_CONFIRMED].includes(phase)) {
            setPhase(PHASES.SERVICE_TYPE);
        }
    }, [selectedType, phase]);

    useEffect(() => {
        sessionStorage.setItem('chauffeur_booking_details', JSON.stringify(bookingDetails));
    }, [bookingDetails]);

    const [selectedVehicle, setSelectedVehicle] = useState(() => {
        if (vehicleIdFromUrl && vehicles && vehicles.length > 0) {
            const found = vehicles.find(v => v.id === vehicleIdFromUrl);
            if (found) return found;
        }
        return vehicles?.[0] || null;
    });

    useEffect(() => {
        if (vehicleIdFromUrl && vehicles && vehicles.length > 0) {
            const found = vehicles.find(v => v.id === vehicleIdFromUrl);
            if (found) setSelectedVehicle(found);
        }
    }, [vehicleIdFromUrl, vehicles]);
    const [activeBookingId, setActiveBookingId] = useState(() => {
        return sessionStorage.getItem('chauffeur_active_booking_id') || null;
    });
    const [driverLocation, setDriverLocation] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [destination, setDestination] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_destination');
        return saved ? JSON.parse(saved) : null;
    });
    const [estimatedKm, setEstimatedKm] = useState(0);
    const [useSubscription, setUseSubscription] = useState(false);
    const [isSettlingPayment, setIsSettlingPayment] = useState(false);
    const [driverSweepTick, setDriverSweepTick] = useState(0);

    useEffect(() => {
        if (destination) {
            sessionStorage.setItem('chauffeur_destination', JSON.stringify(destination));
        }
    }, [destination]);
    useEffect(() => {
        if (!destination?.coordinates?.lat || !destination?.coordinates?.lng) {
            setEstimatedKm(0);
            return;
        }

        const originCoordinates =
            selectedAddress?.coordinates
            || currentLocation
            || addresses?.find((address) => address?.coordinates?.lat && address?.coordinates?.lng)?.coordinates
            || null;

        setEstimatedKm(calculateDistanceKm(originCoordinates, destination.coordinates));
    }, [addresses, currentLocation, destination, selectedAddress]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [lookingTime, setLookingTime] = useState(180);
    const searchTimeoutHandledRef = useRef(false);
    const selectedServiceKind = selectedType?.kind || normalizeServiceKind(selectedType || {});
    const bookingMode = bookingDetails?.bookingMode || bookingDetails?.schedule?.type || 'instant';
    const requiresDestination = requiresDestinationForKind(selectedServiceKind);
    const isHourlyService = selectedServiceKind === 'hourly';
    const isOutstationService = selectedServiceKind === 'outstation';
    const serviceFlowMeta = SERVICE_FLOW_META[selectedServiceKind] || SERVICE_FLOW_META.hourly;
    const visibleSecurityPin = maskSecurityPin(bookingDetails?.securityPin);
    const availableSubscriptionCredits = Math.max(
        0,
        (chauffeurSubscription?.monthlyCredits || 0) - (chauffeurSubscription?.usedCredits || 0)
    );
    const availableChauffeurPlans = chauffeurPlans.filter((plan) => planAppliesToChauffeurService(plan, selectedType));
    const canUseChauffeurSubscription = chauffeurSubscription?.status === 'active'
        && availableSubscriptionCredits > 0
        && planAppliesToChauffeurService(chauffeurSubscription, selectedType);
    const outstandingSettlementAmount = useMemo(() => {
        const explicitPending = Number(bookingDetails?.payment?.pendingAmount || 0);
        if (explicitPending > 0) return explicitPending;

        const totalAmount = Number(bookingDetails?.pricing?.totalAmount || 0);
        const initialPaidAmount = Number(bookingDetails?.pricing?.initialPaidAmount || totalAmount);
        const settledAmount = Number(bookingDetails?.payment?.settledAmount || 0);
        return Math.max(0, totalAmount - initialPaidAmount - settledAmount);
    }, [bookingDetails]);
    const hasOutstandingSettlement = bookingDetails?.payment?.status === 'settlement_pending' && outstandingSettlementAmount > 0;
    const durationOptions = useMemo(() => (
        getDurationOptionsForService(selectedType || {})
    ), [selectedType]);
    const commercialRules = useMemo(() => {
        const rules = selectedType?.metadata?.commercialRules || {};
        return {
            waitingGraceMinutes: Number.isFinite(Number(rules.waitingGraceMinutes)) ? Number(rules.waitingGraceMinutes) : 15,
            waitChargePerMinute: Number.isFinite(Number(rules.waitChargePerMinute)) ? Number(rules.waitChargePerMinute) : 2,
            nightAllowance: Number.isFinite(Number(rules.nightAllowance)) ? Number(rules.nightAllowance) : 300,
            outstationAllowancePerDay: Number.isFinite(Number(rules.outstationAllowancePerDay)) ? Number(rules.outstationAllowancePerDay) : 500,
            minimumWalletBalance: Number.isFinite(Number(rules.minimumWalletBalance)) ? Number(rules.minimumWalletBalance) : 1000,
            gstPercent: Number.isFinite(Number(rules.gstPercent)) ? Number(rules.gstPercent) : 0,
            gstInclusive: Boolean(rules.gstInclusive)
        };
    }, [selectedType]);
    useEffect(() => {
        if (bookingDetails?.securityPin) {
            sessionStorage.setItem('chauffeur_security_pin', bookingDetails.securityPin);
            return;
        }

        const storedPin = sessionStorage.getItem('chauffeur_security_pin');
        if (storedPin) {
            setBookingDetails((prev) => ({
                ...prev,
                securityPin: prev?.securityPin || storedPin
            }));
        }
    }, [bookingDetails?.securityPin]);

    useEffect(() => {
        if (activeBookingId) return;

        sessionStorage.removeItem('chauffeur_security_pin');
        setBookingDetails((prev) => {
            if (!prev?.securityPin) return prev;
            return {
                ...prev,
                securityPin: undefined
            };
        });
    }, [activeBookingId]);

    const destinationChoices = useMemo(() => {
        const options = [];

        if (currentLocation?.lat && currentLocation?.lng) {
            options.push({
                id: 'current-location',
                label: 'Current Location',
                street: selectedAddress?.street || 'Current Location',
                city: selectedAddress?.city || '',
                coordinates: currentLocation
            });
        }

        (addresses || []).forEach((address, index) => {
            if (!address?.coordinates?.lat || !address?.coordinates?.lng) return;
            options.push({
                id: address.id || address._id || `saved-${index}`,
                label: address.label || (address.isPrimary ? 'Primary Address' : 'Saved Address'),
                street: address.street,
                city: address.city,
                coordinates: address.coordinates
            });
        });

        return options;
    }, [addresses, currentLocation, selectedAddress]);
    // 🎯 RAPIDO-STYLE DYNAMIC PRICING PREVIEW WITH REAL-TIME BREAKDOWN
    const dynamicPricingBreakdown = useMemo(() => {
        if (!selectedType || !selectedVehicle) {
            return {
                baseAmount: 0,
                nightAllowance: 0,
                outstationAllowance: 0,
                subtotal: 0,
                gstAmount: 0,
                total: 0,
                breakdown: []
            };
        }

        const vehicleMultiplier = getVehicleMultiplier(selectedVehicle, vehicleTypes);
        const slotPrice = getDurationSlotPrice(selectedType, bookingDetails.duration);
        
        let baseAmount = 0;
        if (slotPrice !== null) {
            baseAmount = Math.round(slotPrice * vehicleMultiplier);
        } else {
            const durationMultiplier = calculateDurationMultiplier(selectedServiceKind, bookingDetails.duration);
            baseAmount = Math.round((selectedType.basePrice || 0) * vehicleMultiplier * durationMultiplier);
        }

        const breakdown = [];
        let subtotal = baseAmount;

        // Add base fare to breakdown
        breakdown.push({
            label: 'Base Fare',
            amount: baseAmount,
            type: 'base',
            icon: '🚗'
        });

        // 🌙 Night Allowance Detection (11 PM - 5 AM)
        let nightAllowance = 0;
        if (bookingDetails?.time) {
            const [hours] = bookingDetails.time.split(':').map(Number);
            const isNightSlot = hours >= 23 || hours < 5;
            if (isNightSlot && commercialRules.nightAllowance > 0) {
                nightAllowance = commercialRules.nightAllowance;
                subtotal += nightAllowance;
                breakdown.push({
                    label: 'Night Allowance',
                    amount: nightAllowance,
                    type: 'surcharge',
                    icon: '🌙',
                    description: '11 PM - 5 AM slot'
                });
            }
        }

        // 🏨 Outstation Allowance Detection
        let outstationAllowance = 0;
        if (selectedServiceKind === 'outstation' && commercialRules.outstationAllowancePerDay > 0) {
            const days = Math.max(1, Math.ceil(getDurationHours(bookingDetails.duration, 24) / 24));
            outstationAllowance = days * commercialRules.outstationAllowancePerDay;
            subtotal += outstationAllowance;
            breakdown.push({
                label: `Stay & Food Allowance (${days} day${days > 1 ? 's' : ''})`,
                amount: outstationAllowance,
                type: 'surcharge',
                icon: '🏨',
                description: 'Driver accommodation'
            });
        }

        // 💰 GST Calculation
        let gstAmount = 0;
        if (commercialRules.gstPercent > 0) {
            const rawGstAmount = commercialRules.gstInclusive
                ? (subtotal * commercialRules.gstPercent) / (100 + commercialRules.gstPercent)
                : (subtotal * commercialRules.gstPercent) / 100;
            gstAmount = Math.max(0, Math.round(rawGstAmount));

            if (gstAmount > 0) {
                breakdown.push({
                    label: `GST (${commercialRules.gstPercent}%)`,
                    amount: gstAmount,
                    type: 'tax',
                    icon: '📋',
                    description: commercialRules.gstInclusive ? 'Included in fare' : 'Added to fare'
                });
            }
        }

        const total = commercialRules.gstInclusive ? subtotal : subtotal + gstAmount;

        return {
            baseAmount,
            nightAllowance,
            outstationAllowance,
            subtotal,
            gstAmount,
            total,
            breakdown,
            hasExtraCharges: nightAllowance > 0 || outstationAllowance > 0
        };
    }, [selectedType, selectedVehicle, vehicleTypes, bookingDetails.duration, bookingDetails.time, selectedServiceKind, commercialRules]);

    const estimatedSubtotal = dynamicPricingBreakdown.subtotal;
    const estimatedGstAmount = dynamicPricingBreakdown.gstAmount;
    const estimatedTotal = dynamicPricingBreakdown.total;
    const estimatedReserveAmount = useMemo(() => {
        const bookedHours = getDurationHours(bookingDetails?.duration, 1);
        const effectiveHourlyRate = bookedHours > 0
            ? Math.max(1, Math.round(Number(estimatedTotal || 0) / bookedHours))
            : Math.max(1, Number(estimatedTotal || 0));
        return effectiveHourlyRate * 2;
    }, [bookingDetails?.duration, estimatedTotal]);
    const animatedDriverLocation = useSmoothedLocation(driverLocation, 850);

    const clearChauffeurSession = () => {
        [
            'chauffeur_active_booking_id',
            'chauffeur_booking_phase',
            'chauffeur_trip_start_time',
            CHAUFFEUR_SEARCH_STARTED_KEY,
            'chauffeur_destination',
            'chauffeur_security_pin'
        ].forEach((key) => sessionStorage.removeItem(key));
    };

    const resetChauffeurFlow = (nextPhase = PHASES.SERVICE_TYPE) => {
        clearChauffeurSession();
        setActiveBookingId(null);
        setDriverLocation(null);
        setDriverInfo(null);
        setDestination(null);
        setLookingTime(180);
        setElapsedTime(0);
        setPhase(nextPhase);
        setBookingDetails((prev) => ({
            ...prev,
            status: undefined,
            dispatchState: undefined,
            dispatchMessage: undefined,
            securityPin: undefined,
            pricing: undefined,
            notes: undefined,
            payment: undefined,
            issues: undefined,
            tracking: undefined
        }));
    };

    useEffect(() => {
        if (canUseChauffeurSubscription) return;
        if (useSubscription) {
            setUseSubscription(false);
        }
    }, [canUseChauffeurSubscription, useSubscription]);

    useEffect(() => {
        setBookingDetails((prev) => {
            if (!prev) return prev;

            if (bookingMode === 'instant') {
                const instantSlot = getInstantScheduleSnapshot();
                if (prev.date === instantSlot.date && prev.time === instantSlot.time) {
                    return prev;
                }

                return {
                    ...prev,
                    date: instantSlot.date,
                    time: instantSlot.time
                };
            }

            if (bookingMode === 'scheduled' && (!prev.date || !prev.time)) {
                const scheduledSlot = getDefaultScheduledSlot();
                return {
                    ...prev,
                    date: prev.date || scheduledSlot.date,
                    time: prev.time || scheduledSlot.time
                };
            }

            return prev;
        });
    }, [bookingMode]);

    // ── Looking Countdown ──
    useEffect(() => {
        const isWaiting = phase === PHASES.FINDING_DRIVER && (!bookingDetails?.status || bookingDetails.status === 'pending');
        if (!isWaiting) {
            return undefined;
        }

        const bookingCreatedAt = bookingDetails?.createdAt ? new Date(bookingDetails.createdAt).getTime() : null;
        const storedStartedAt = Number(sessionStorage.getItem(CHAUFFEUR_SEARCH_STARTED_KEY));
        const searchStartedAt = Number.isFinite(storedStartedAt) && storedStartedAt > 0
            ? storedStartedAt
            : (Number.isFinite(bookingCreatedAt) ? bookingCreatedAt : Date.now());

        if (!Number.isFinite(storedStartedAt) || storedStartedAt <= 0) {
            sessionStorage.setItem(CHAUFFEUR_SEARCH_STARTED_KEY, String(searchStartedAt));
        }

        const syncRemaining = () => {
            setLookingTime(getLookupRemainingSeconds(searchStartedAt));
        };

        syncRemaining();
        const timer = window.setInterval(syncRemaining, 1000);
        return () => window.clearInterval(timer);
    }, [phase, bookingDetails?.status, bookingDetails?.createdAt, activeBookingId]);

    useEffect(() => {
        if (lookingTime > 0) {
            searchTimeoutHandledRef.current = false;
        }
    }, [lookingTime]);

    useEffect(() => {
        const shouldAnimateNearbyDrivers =
            phase === PHASES.FINDING_DRIVER &&
            (!bookingDetails?.status || bookingDetails.status === 'pending');

        if (!shouldAnimateNearbyDrivers) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setDriverSweepTick((tick) => tick + 1);
        }, 2400);

        return () => window.clearInterval(interval);
    }, [phase, bookingDetails?.status]);

    // ── Session Timer ──
    useEffect(() => {
        let interval;
        if (phase === PHASES.TRIP_ACTIVE) {
            // Restore from session or start new
            const startTimeString = sessionStorage.getItem('chauffeur_trip_start_time');
            const startTime = startTimeString ? Number(startTimeString) : Date.now();
            
            if (!startTimeString) {
                sessionStorage.setItem('chauffeur_trip_start_time', startTime.toString());
            }

            interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((now - startTime) / 1000));
                setElapsedTime(diff);
            }, 1000);
        } else if (phase === PHASES.TRIP_COMPLETED) {
            const startTimeString = sessionStorage.getItem('chauffeur_trip_start_time');
            const endTime = Date.now();
            if (startTimeString) {
                const startTime = Number(startTimeString);
                setElapsedTime(Math.floor((endTime - startTime) / 1000));
            }
        }
        return () => clearInterval(interval);
    }, [phase]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const syncBookingSnapshot = (booking) => {
        if (!booking) return;

        setBookingDetails((prev) => ({
            ...prev,
            ...booking,
            securityPin: booking.securityPin || prev?.securityPin
        }));

        const provider = booking.provider?.id || {};
        const providerPhoto = provider.photo || booking.provider?.photo || SERVICE_ASSETS[selectedServiceKind || 'point']?.icon;
        if (provider?.name || booking.provider?.name) {
            setDriverInfo({
                name: provider.name || booking.provider?.name || 'Assigned Driver',
                phone: provider.phone || booking.provider?.phone || '',
                rating: provider.rating || booking.provider?.rating || 5.0,
                img: providerPhoto,
                isPremium: provider.verification?.policeStatus === 'approved'
            });
        }

        if (booking.tracking?.currentLocation?.lat && booking.tracking?.currentLocation?.lng) {
            setDriverLocation({
                lat: booking.tracking.currentLocation.lat,
                lng: booking.tracking.currentLocation.lng
            });
        } else if (Array.isArray(provider?.currentLocation?.coordinates) && provider.currentLocation.coordinates.length === 2) {
            setDriverLocation({
                lat: provider.currentLocation.coordinates[1],
                lng: provider.currentLocation.coordinates[0]
            });
        }
    };

    // ── WebSocket Telemetry ──
    useEffect(() => {
        if (activeBookingId && (phase === PHASES.TRIP_ACTIVE || phase === PHASES.FINDING_DRIVER || phase === PHASES.BOOKING_CONFIRMED)) {
            console.log(`[SpareDriver] Connecting Telemetry for Session: ${activeBookingId}`);

            socketService.connect(localStorage.getItem('auth_token'));
            socketService.joinBookingRoom(activeBookingId);

            const socket = socketService.getSocket();
            if (socket) {
                // Listen for driver pulses
                const handleLocationPulse = (data = {}) => {
                    console.log('[SpareDriver] Telemetry Pulse:', data);
                    if (data.location?.lat && data.location?.lng) {
                        setDriverLocation(data.location);
                        return;
                    }
                    if (Number.isFinite(Number(data.lat)) && Number.isFinite(Number(data.lng))) {
                        setDriverLocation({ lat: Number(data.lat), lng: Number(data.lng) });
                    }
                };

                socket.on('location_updated', handleLocationPulse);
                socket.on('locationUpdate', handleLocationPulse);

                // Listen for status changes
                socket.on('booking_status_updated', (data) => {
                    console.log('[SpareDriver] Status Update:', data.status);
                    setBookingDetails((prev) => ({
                        ...prev,
                        status: data.status,
                        securityPin: data.pin || prev?.securityPin,
                        dispatchState: data.dispatchState || prev?.dispatchState,
                        dispatchMessage: data.message || prev?.dispatchMessage
                    }));
                    if (['en_route', 'arrived', 'active', 'completed'].includes(data.status)) {
                        bookingAPI.getBooking(activeBookingId)
                            .then((res) => {
                                if (res?.status === 'success') {
                                    syncBookingSnapshot(res.data.booking);
                                }
                            })
                            .catch((error) => console.error('Failed to refresh chauffeur booking snapshot:', error));
                    }

                    if (data.pin) {
                        toast.success(`Trip PIN: ${data.pin}`, {
                            id: 'chauffeur-pin-sync'
                        });
                    }

                    if (data.message) {
                        toast(data.message, {
                            icon: data.dispatchState === 'reassigning' ? '🔄' : '🚗'
                        });
                    }

                    if (data.status === 'pending' && data.dispatchState === 'reassigning') {
                        setPhase(PHASES.FINDING_DRIVER);
                        setLookingTime((current) => {
                            const nextLookingTime = Math.max(current, 60);
                            const searchStartedAt = Date.now() - ((LOOKUP_WINDOW_SECONDS - nextLookingTime) * 1000);
                            sessionStorage.setItem(CHAUFFEUR_SEARCH_STARTED_KEY, String(searchStartedAt));
                            return nextLookingTime;
                        });
                    }
                    if (data.status === 'pending' && data.dispatchState === 'scheduled_hold') {
                        setPhase(PHASES.BOOKING_CONFIRMED);
                    }

                    if (data.status === 'completed') setPhase(PHASES.TRIP_COMPLETED);
                    if (data.status === 'active') setPhase(PHASES.TRIP_ACTIVE);
                    if (data.status === 'cancelled') {
                        resetChauffeurFlow(PHASES.SERVICE_TYPE);
                    }
                });

                socket.on('otp_revealed', (data) => {
                    if (data?.bookingId !== activeBookingId) return;
                    setBookingDetails((prev) => ({
                        ...prev,
                        securityPin: data.pin || prev?.securityPin
                    }));
                    if (data?.pin) {
                        toast.success(`Trip PIN: ${data.pin}`, {
                            id: 'chauffeur-pin-revealed'
                        });
                    }
                });
            }

            return () => {
                const socket = socketService.getSocket();
                if (socket) {
                    socket.off('location_updated');
                    socket.off('locationUpdate');
                    socket.off('booking_status_updated');
                    socket.off('otp_revealed');
                }
            };
        }
    }, [activeBookingId, phase, selectedServiceKind]);

    useEffect(() => {
        let watchId = null;
        if (!activeBookingId || ![PHASES.FINDING_DRIVER, PHASES.BOOKING_CONFIRMED, PHASES.TRIP_ACTIVE].includes(phase)) {
            return undefined;
        }

        const token = localStorage.getItem('auth_token');
        socketService.connect(token);
        socketService.joinBookingRoom(activeBookingId);

        const socket = socketService.getSocket();
        if (!socket || !('geolocation' in navigator)) {
            return undefined;
        }

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                socket.emit('update_consumer_location', {
                    bookingId: activeBookingId,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                });
            },
            (error) => console.error('Consumer live location pulse failed:', error),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [activeBookingId, phase]);

    // ── Session Restoration ──
    useEffect(() => {
        const restoreSession = async () => {
            if (activeBookingId && !bookingDetails?._id) {
                try {
                    console.log('[SpareDriver] Restoring Session:', activeBookingId);
                    const res = await bookingAPI.getBooking(activeBookingId);
                    if (res.status === 'success') {
                        syncBookingSnapshot(res.data.booking);
                        setPhase(resolveChauffeurPhase(res.data.booking));
                    }
                } catch (err) {
                    console.error("Session restoration failed:", err);
                    resetChauffeurFlow(PHASES.SERVICE_TYPE);
                }
            }
        };
        restoreSession();
    }, [activeBookingId, selectedServiceKind]);

    useEffect(() => {
        if (
            phase !== PHASES.FINDING_DRIVER ||
            !activeBookingId ||
            lookingTime !== 0 ||
            (bookingDetails?.status && bookingDetails.status !== 'pending') ||
            searchTimeoutHandledRef.current
        ) {
            return;
        }

        searchTimeoutHandledRef.current = true;

        const handleSearchTimeout = async () => {
            try {
                const res = await bookingAPI.getBooking(activeBookingId);
                const latestBooking = res?.data?.booking;

                if (!latestBooking) {
                    return;
                }

                syncBookingSnapshot(latestBooking);

                if (['en_route', 'arrived'].includes(latestBooking.status)) {
                    return;
                }

                if (latestBooking.status === 'active') {
                    setPhase(PHASES.TRIP_ACTIVE);
                    return;
                }

                if (latestBooking.status !== 'pending') {
                    return;
                }

                await bookingAPI.cancelBooking(activeBookingId, 'Search timed out - no spare driver found');
                resetChauffeurFlow(PHASES.SERVICE_TYPE);
                toast.error('No driver was available nearby right now. The booking has been closed.');
            } catch (error) {
                console.error('Search timeout handling failed:', error);
            }
        };

        handleSearchTimeout();
    }, [activeBookingId, bookingDetails?.status, lookingTime, phase]);


    // Fetch services and types
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [serviceRes, typeRes, plansRes, subscriptionRes] = await Promise.all([
                    serviceAPI.getChauffeurServices(),
                    vehicleAPI.getVehicleTypes(),
                    serviceAPI.getPlans({ category: 'Chauffeur', moduleScope: 'spare-driver' }),
                    subscriptionAPI.getSubscription({
                        moduleScope: 'spare-driver',
                        ...(selectedType ? { serviceKey: selectedType.metadata?.id || selectedType.key || selectedType.title } : {})
                    })
                ]);
                
                if (serviceRes.status === 'success') {
                    const fetchedServices = serviceRes.data.services || [];
                    setServices(fetchedServices);

                    // 🎯 Direct Deep-Linking Logic
                    if (typeFromUrl && fetchedServices.length > 0) {
                        const targetService = fetchedServices.find(s => 
                            normalizeServiceKind(s) === typeFromUrl || 
                            s.id === typeFromUrl || 
                            s.metadata?.id === typeFromUrl ||
                            s.title?.toLowerCase().includes(typeFromUrl.toLowerCase())
                        );
                        
                        if (targetService) {
                            const built = buildSelectedType(targetService);
                            setSelectedType(built);
                            setPhase(PHASES.BOOKING_DETAILS);
                            // Cleanup URL to avoid sticky param
                            navigate('/spare-driver', { replace: true });
                        }
                    }
                }
                if (typeRes.status === 'success') {
                    setVehicleTypes(typeRes.data.vehicleTypes);
                }
                if (plansRes?.status === 'success') {
                    setChauffeurPlans(plansRes.data.plans || []);
                }
                if (subscriptionRes?.status === 'success') {
                    setChauffeurSubscription(subscriptionRes.data.subscription || null);
                }
            } catch (err) {
                console.error("Failed to fetch dynamic chauffeur data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [typeFromUrl]); // Run when typeFromUrl changes

    // Initial check for vehicles
    useEffect(() => {
        if (vehicles?.length > 0 && !selectedVehicle) {
            setSelectedVehicle(vehicles[0]);
        }
    }, [vehicles, selectedVehicle]);
    
    // 🚨 SOS Handler 🚨
    const handleSOS = async () => {
        if (!activeBookingId) return;
        try {
            const res = await spareDriverAPI.reportEmergency({
                bookingId: activeBookingId,
                reason: 'User triggered SOS from Booking App',
                latitude: currentLocation?.lat || 0,
                longitude: currentLocation?.lng || 0
            });
            if (res.status === 'success') {
                alert('🚨 EMERGENCY PROTOCOL ACTIVATED: Admin has been notified of your location. Stay calm, help is being dispatched.');
            }
        } catch (err) {
            console.error('SOS Failure:', err);
            alert('Safety alert failed. Please call 100/112 immediately.');
        }
    };

    const handleSOSNavigation = () => {
        navigate(activeBookingId ? `/safety/sos?id=${activeBookingId}` : '/safety/sos');
    };

    const handleSettlementPayment = async (paymentMethod = 'wallet') => {
        const bookingId = bookingDetails?._id || activeBookingId;
        if (!bookingId || !hasOutstandingSettlement) return;

        setIsSettlingPayment(true);
        try {
            if (paymentMethod === 'wallet') {
                const res = await bookingAPI.settleBookingPayment(bookingId, { paymentMethod: 'wallet' });
                if (res?.status === 'success') {
                    syncBookingSnapshot(res.data.booking);
                    toast.success('Outstanding trip balance paid from wallet');
                    refreshStats();
                }
                return;
            }

            const razorKeyRes = await getRazorpayKey();
            if (!razorKeyRes.success) throw new Error('Could not fetch payment configuration');

            const orderRes = await createPaymentOrder(outstandingSettlementAmount, 'INR', `sd_settle_${bookingId}`);
            if (!orderRes.success) throw new Error('Settlement order creation failed');

            const options = {
                key: razorKeyRes.data.key_id,
                amount: orderRes.data.amount,
                currency: 'INR',
                name: 'Spare Driver Chauffeur Settlement',
                description: `Additional payment for ${selectedType?.title || 'chauffeur trip'}`,
                order_id: orderRes.data.order_id,
                handler: async (response) => {
                    try {
                        const res = await bookingAPI.settleBookingPayment(bookingId, {
                            paymentMethod: 'online',
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (res?.status === 'success') {
                            syncBookingSnapshot(res.data.booking);
                            toast.success('Additional trip amount settled successfully');
                            refreshStats();
                        }
                    } catch (error) {
                        console.error('Settlement payment failed:', error);
                        toast.error(error.message || 'Could not settle the remaining balance');
                    } finally {
                        setIsSettlingPayment(false);
                    }
                },
                prefill: {
                    name: getUser('consumer')?.name || '',
                    email: getUser('consumer')?.email || '',
                    contact: getUser('consumer')?.phone || ''
                },
                theme: { color: '#F29F05' },
                modal: {
                    ondismiss: () => setIsSettlingPayment(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Settlement initialization failed:', error);
            toast.error(error.message || 'Could not initialize settlement payment');
            setIsSettlingPayment(false);
        } finally {
            if (paymentMethod === 'wallet') {
                setIsSettlingPayment(false);
            }
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedVehicle) {
            alert("Please select a vehicle to continue");
            return;
        }
        if (requiresDestination && !destination) {
            alert("Please select your travel destination");
            return;
        }
        setIsProcessing(true);
        try {
            const multiplier = getVehicleMultiplier(selectedVehicle, vehicleTypes);
            const amount = estimatedTotal;
            const selectedVehicleId = selectedVehicle?._id || selectedVehicle?.id;
            const liveScheduleSnapshot = bookingMode === 'instant'
                ? getInstantScheduleSnapshot()
                : { date: bookingDetails.date, time: bookingDetails.time };

            const commonBookingData = {
                vehicleId: selectedVehicleId,
                service: {
                    id: selectedType.serviceId || selectedType.id,
                    name: selectedType.title,
                    category: 'Chauffeur',
                    type: 'sparedriver',
                    basePrice: selectedType.basePrice,
                    duration: bookingDetails.duration
                },
                pricing: {
                    baseAmount: selectedType.basePrice,
                    vehicleMultiplier: multiplier,
                    totalAmount: amount,
                    initialPaidAmount: amount,
                    currency: 'INR'
                },
                schedule: {
                    type: bookingMode,
                    date: liveScheduleSnapshot.date,
                    timeSlot: { start: liveScheduleSnapshot.time, end: liveScheduleSnapshot.time },
                    estimatedDuration: bookingDetails.duration
                },
                location: {
                    type: 'home',
                    address: {
                        street: selectedAddress?.street || addresses?.find(a => a.isPrimary)?.street || addresses?.[0]?.street || 'Current Location',
                        city: selectedAddress?.city || addresses?.find(a => a.isPrimary)?.city || addresses?.[0]?.city || '',
                        coordinates: selectedAddress?.coordinates || currentLocation || addresses?.[0]?.coordinates || { lat: 28.6139, lng: 77.2090 }
                    }
                },
                destination: requiresDestination ? destination : null,
                provider: { type: 'sparedriver' }
            };

            // ── Scenario A: Subscription Pass ──
            if (useSubscription) {
                const subBookingData = {
                    ...commonBookingData,
                    paymentMethod: 'subscription'
                };

                const res = await bookingAPI.createBooking(subBookingData);
                if (res.status === 'success') {
                    const nextBooking = res.data.booking;
                    const bId = nextBooking._id;
                    const nextPhase = resolveChauffeurPhase(nextBooking);
                    syncBookingSnapshot(nextBooking);
                    setActiveBookingId(bId);
                    setChauffeurSubscription((prev) => prev ? ({
                        ...prev,
                        usedCredits: (prev.usedCredits || 0) + 1
                    }) : prev);
                    sessionStorage.setItem('chauffeur_active_booking_id', bId);

                    if (nextPhase === PHASES.FINDING_DRIVER) {
                        const searchStartedAt = nextBooking?.createdAt ? new Date(nextBooking.createdAt).getTime() : Date.now();
                        sessionStorage.setItem(CHAUFFEUR_SEARCH_STARTED_KEY, String(searchStartedAt));
                        setLookingTime(getLookupRemainingSeconds(searchStartedAt));
                    }
                    setPhase(nextPhase);
                }
                return;
            }

            // ── Scenario B: Razorpay Online ──
            const razorKeyRes = await getRazorpayKey();
            if (!razorKeyRes.success) throw new Error("Could not fetch payment configuration");

            const orderRes = await createPaymentOrder(amount, 'INR', `sd_${Date.now()}`); 
            if (!orderRes.success) throw new Error("Payment order creation failed");

            const options = {
                key: razorKeyRes.data.key_id,
                amount: orderRes.data.amount,
                currency: "INR",
                name: "Spare Driver Chauffeur",
                description: `Booking for ${selectedType.title}`,
                order_id: orderRes.data.order_id,
                handler: async (response) => {
                    try {
                        setIsProcessing(true);
                        const verification = await verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature
                        );

                        if (verification?.success === false || verification?.status === 'error') {
                            throw new Error(verification?.message || 'Payment verification failed');
                        }

                        const bookingData = {
                            ...commonBookingData,
                            paymentMethod: 'online',
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature
                        };

                        const res = await bookingAPI.createBooking(bookingData);
                        if (res.status === 'success') {
                            const nextBooking = res.data.booking;
                            const bId = nextBooking._id;
                            const nextPhase = resolveChauffeurPhase(nextBooking);
                            syncBookingSnapshot(nextBooking);
                            setActiveBookingId(bId);
                            sessionStorage.setItem('chauffeur_active_booking_id', bId);

                            if (nextPhase === PHASES.FINDING_DRIVER) {
                                const searchStartedAt = nextBooking?.createdAt ? new Date(nextBooking.createdAt).getTime() : Date.now();
                                sessionStorage.setItem(CHAUFFEUR_SEARCH_STARTED_KEY, String(searchStartedAt));
                                setLookingTime(getLookupRemainingSeconds(searchStartedAt));
                            }
                            setPhase(nextPhase);
                        }
                    } catch (err) {
                        console.error("Booking Finalization Failed:", err);
                        alert(err.message || "Booking failed. Please try again.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: getUser('consumer')?.name || "",
                    email: getUser('consumer')?.email || "",
                    contact: getUser('consumer')?.phone || ""
                },
                theme: { color: "#FF9900" },
                modal: { ondismiss: () => setIsProcessing(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Booking initialization failed:", err);
            alert(err.message || "Could not initialize booking. Please try again.");
        } finally {
            if (!useSubscription) setIsProcessing(false);
        }
    };

    const handleStartTrip = () => {
        setPhase(PHASES.TRIP_ACTIVE);
        // Simulate trip ending after some time
        setTimeout(() => {
            setPhase(PHASES.TRIP_COMPLETED);
        }, 5000);
    };

    const handleCancelRequest = async () => {
        if (!activeBookingId) {
            setPhase(PHASES.CONFIRM_VEHICLE);
            return;
        }

        const confirmCancel = window.confirm("Are you sure you want to cancel this request?");
        if (!confirmCancel) return;

        try {
            await bookingAPI.cancelBooking(activeBookingId, "User cancelled during searching");
            resetChauffeurFlow(PHASES.SERVICE_TYPE);
        } catch (err) {
            console.error("Cancellation failed:", err);
            alert("Could not cancel. Please contact support.");
        }
    };

    const renderHeader = (title, showBack = true) => (
        <Header 
            title={title} 
            showBack={showBack} 
            onBackClick={() => {
                if (phase === PHASES.BOOKING_DETAILS || phase === PHASES.SERVICE_TYPE) {
                    navigate(-1);
                } else {
                    setPhase(prev => {
                        if (prev === PHASES.CONFIRM_VEHICLE) return PHASES.BOOKING_DETAILS;
                        if (prev === PHASES.CHECKOUT) {
                            // If we came from Home with a vehicle, go back to details, then Home
                            return PHASES.BOOKING_DETAILS;
                        }
                        return PHASES.BOOKING_DETAILS;
                    });
                }
            }}
        />
    );


    const renderBookingDetails = () => (
        <div className="flex-1 flex flex-col bg-[#FBF8EF] min-h-screen">
            {/* 1. Elite Service Header - Integrated & Compact */}
            <div className="px-4 py-3 bg-white border-b border-black/05 flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FBF8EF] rounded-2xl flex items-center justify-center border border-black/05 shadow-sm overflow-hidden p-1">
                    <img 
                        src={SERVICE_CARD_IMAGES[selectedServiceKind] || pointImg} 
                        className="w-full h-full object-contain" 
                        alt={selectedType?.title}
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-[18px] font-[1000] text-[#0F172A] tracking-tighter uppercase leading-none">
                        {selectedType?.title || 'Point To Point'}
                    </h3>
                    <p className="text-[9px] font-bold text-[#FF9900] uppercase tracking-widest mt-1">Premium Chauffeur Service</p>
                </div>
                <div className="px-2.5 py-1 bg-black/05 rounded-full border border-black/05">
                    <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">₹{selectedType?.basePrice} Start</span>
                </div>
            </div>

            <div className="px-4 py-4 space-y-5">
                {/* 2. Premium Booking Mode Toggle */}
                <div className="p-1 bg-white border border-black/05 rounded-xl flex gap-1 shadow-sm">
                    <button
                        onClick={() => setBookingDetails((prev) => ({ ...prev, bookingMode: 'instant' }))}
                        className={`flex-1 h-9 rounded-lg text-[9px] font-[1000] uppercase tracking-widest transition-all duration-300 ${bookingMode === 'instant' ? 'bg-[#0F172A] text-white shadow-md' : 'bg-transparent text-[#0F172A]/30'}`}
                    >
                        Book Now
                    </button>
                    <button
                        onClick={() => setBookingDetails((prev) => ({ ...prev, bookingMode: 'scheduled' }))}
                        className={`flex-1 h-9 rounded-lg text-[9px] font-[1000] uppercase tracking-widest transition-all duration-300 ${bookingMode === 'scheduled' ? 'bg-[#0F172A] text-white shadow-md' : 'bg-transparent text-[#0F172A]/30'}`}
                    >
                        Schedule
                    </button>
                </div>

                {/* 3. Date/Time Picker for Scheduled */}
                <AnimatePresence>
                    {bookingMode === 'scheduled' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-2 gap-3 overflow-hidden"
                        >
                            <div className="bg-white rounded-2xl p-4 border border-black/05 shadow-sm">
                                <span className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] block mb-1">Pick Date</span>
                                <input
                                    type="date"
                                    value={bookingDetails.date}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                                    className="w-full text-[13px] font-black bg-transparent border-none p-0 outline-none text-[#0F172A] cursor-pointer"
                                />
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-black/05 shadow-sm">
                                <span className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] block mb-1">Pick Time</span>
                                <input
                                    type="time"
                                    value={bookingDetails.time}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })}
                                    className="w-full text-[13px] font-black bg-transparent border-none p-0 outline-none text-[#0F172A] cursor-pointer"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Luxury Address Row */}
                <div className="bg-white rounded-[20px] border border-black/05 shadow-sm overflow-hidden">
                    <div 
                        onClick={() => navigate('/map')}
                        className="flex items-center gap-3 p-3.5 active:bg-black/02 transition-all cursor-pointer border-b border-black/05"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#0F172A]/05 flex items-center justify-center text-[#0F172A]">
                            <MapPin size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[7.5px] font-[1000] text-black/20 uppercase tracking-[0.2em] mb-0.5">Current Pickup</p>
                            <p className="text-[12px] font-black text-[#0F172A] truncate">
                                {selectedAddress?.street || addresses?.find(a => a.isPrimary)?.street || addresses?.[0]?.street || 'Current Location'}
                            </p>
                        </div>
                        <ChevronRight size={14} className="text-black/10" />
                    </div>

                    {requiresDestination && (
                        <div 
                            onClick={() => navigate('/map?from=chauffeur&type=destination')}
                            className="flex items-center gap-3 p-3.5 active:bg-black/02 transition-all cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#FF9900]/10 flex items-center justify-center text-[#FF9900]">
                                <Navigation size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[7.5px] font-[1000] text-black/20 uppercase tracking-[0.2em] mb-0.5">Set Destination</p>
                                <p className="text-[12px] font-black text-[#0F172A] truncate">
                                    {destination?.street || 'Where To?'}
                                </p>
                            </div>
                            <ChevronRight size={14} className="text-black/10" />
                        </div>
                    )}
                </div>

                {/* 5. Modern Duration Selector */}
                {durationOptions.length > 0 && (
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                            <Clock size={12} className="text-[#FF9900]" />
                            Select Chauffeur Duration
                        </label>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                            {durationOptions.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setBookingDetails({ ...bookingDetails, duration: d })}
                                    className={`flex-shrink-0 px-6 h-12 rounded-2xl text-[11px] font-[1000] uppercase transition-all duration-300 border ${bookingDetails.duration === d 
                                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg scale-[1.05]' 
                                        : 'bg-white text-black/30 border-black/05 hover:border-black/10'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. Booking Beneficiary Selector */}
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                        <User size={12} className="text-[#FF9900]" />
                        Who is this driver for?
                    </label>
                    <div className="flex gap-3 px-1">
                        {['Own', 'Family / Others'].map((option) => (
                            <button
                                key={option}
                                onClick={() => setBookingDetails(prev => ({ ...prev, bookingFor: option }))}
                                className={`flex-1 h-12 rounded-2xl text-[11px] font-[1000] uppercase transition-all duration-300 border flex items-center justify-center gap-2 ${bookingDetails.bookingFor === option 
                                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-[1.02]' 
                                    : 'bg-white text-black/30 border-black/05 hover:bg-black/02'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${bookingDetails.bookingFor === option ? 'bg-[#FF9900]' : 'bg-transparent border border-black/10'}`} />
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 6. Dynamic Service Insights & Price Engine Details */}
                <div className="space-y-4 pt-2">
                    <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                        <Info size={12} className="text-[#FF9900]" />
                        Service Policy & Insights
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {/* 💰 Wallet Requirement Card */}
                        <div className="bg-white rounded-[24px] p-4 border border-black/05 shadow-sm space-y-2 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-[30px] -mr-3 -mt-3" />
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CreditCard size={12} />
                                </div>
                                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">Entry Limit</span>
                             </div>
                             <p className="text-[14px] font-[1000] text-[#0F172A] uppercase tracking-tight">
                                Min {formatInr(commercialRules.minimumWalletBalance)}
                             </p>
                             <p className="text-[7.5px] font-bold text-black/30 uppercase leading-none">Min wallet balance required</p>
                        </div>

                        {/* ⏱️ Waiting Charge Card */}
                        <div className="bg-white rounded-[24px] p-4 border border-black/05 shadow-sm space-y-2 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-bl-[30px] -mr-3 -mt-3" />
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Timer size={12} />
                                </div>
                                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">Post-Grace</span>
                             </div>
                             <p className="text-[14px] font-[1000] text-[#0F172A] uppercase tracking-tight">
                                {formatInr(commercialRules.waitChargePerMinute)}/min
                             </p>
                             <p className="text-[7.5px] font-bold text-black/30 uppercase leading-none">After {commercialRules.waitingGraceMinutes}m grace</p>
                        </div>

                        {/* 🌙 Night Allowance Card */}
                        <div className="bg-white rounded-[24px] p-4 border border-black/05 shadow-sm space-y-2 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-bl-[30px] -mr-3 -mt-3" />
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Clock size={12} />
                                </div>
                                <span className="text-[8px] font-black text-black/30 uppercase tracking-widest leading-none">Night Fee</span>
                             </div>
                             <p className="text-[14px] font-[1000] text-[#0F172A] uppercase tracking-tight">
                                {formatInr(commercialRules.nightAllowance)}
                             </p>
                             <p className="text-[7.5px] font-bold text-black/30 uppercase leading-none">10 PM - 06 AM SLOTS</p>
                        </div>

                        {/* 🛣️ Outstation Allowance Card */}
                        {isOutstationService && (
                            <div className="bg-white rounded-[24px] p-4 border border-black/05 shadow-sm space-y-2 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-bl-[30px] -mr-3 -mt-3" />
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <MapPin size={12} />
                                </div>
                                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">Food & Stay</span>
                             </div>
                             <p className="text-[14px] font-[1000] text-[#0F172A] uppercase tracking-tight">
                                {formatInr(commercialRules.outstationAllowancePerDay)}/day
                             </p>
                             <p className="text-[7.5px] font-bold text-black/30 uppercase leading-none">Pilot Daily Allowance</p>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 6. Elite Bottom Checkout Bar */}
            {/* 7. Unified Slim Luxury Action Bar */}
            <div className="fixed bottom-[90px] left-0 right-0 z-[100] px-5">
                <div className="max-w-[430px] mx-auto">
                    <div className="bg-[#0F172A] rounded-[26px] p-2 pr-2 pl-6 shadow-[0_24px_48px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between overflow-hidden relative group">
                        {/* Interactive Sparkle Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/05 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Total Est.</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[#FF9900] text-[13px] font-[1000]">₹</span>
                                <span className="text-[22px] font-[1000] text-white tracking-tighter tabular-nums leading-none">
                                    {estimatedTotal}
                                </span>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                if (selectedVehicle) {
                                    setPhase(PHASES.CHECKOUT);
                                } else {
                                    setPhase(PHASES.CONFIRM_VEHICLE);
                                }
                            }}
                            className="h-[52px] px-7 bg-[#FF9900] rounded-[20px] flex items-center gap-3 shadow-lg shadow-[#FF9900]/10 active:shadow-none transition-all"
                        >
                            <span className="text-[12px] font-[1000] text-[#0F172A] uppercase tracking-wider">Continue</span>
                            <div className="w-7 h-7 bg-[#0F172A]/10 rounded-full flex items-center justify-center">
                                <ArrowRight size={16} className="text-[#0F172A]" strokeWidth={3} />
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConfirmVehicle = () => (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#FFFDF5] to-[#FEF3C7] min-h-screen">
            <div className="px-5 pt-6 pb-3 border-b border-[#0F172A]/05">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[18px] font-black text-[#0F172A] tracking-tighter leading-none uppercase">Garage Select</h3>
                        <p className="text-[8px] font-bold text-[#0F172A]/30 uppercase tracking-[0.2em] mt-1">STEP 2/3 • VEHICLE MATCH</p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 space-y-3">
                <div className="bg-white rounded-xl p-4 border border-[#0F172A]/05 shadow-sm space-y-2">
                    <label className="text-[8px] font-bold text-[#0F172A]/30 uppercase tracking-widest flex items-center gap-2">
                        <Car size={10} className="text-[#FF9900]" />
                        MY VEHICLES
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {vehicles?.map((v) => (
                            <button
                                key={v._id || v.id}
                                onClick={() => setSelectedVehicle(v)}
                                className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) ? 'bg-[#0F172A] border-[#0F172A]' : 'bg-white border-[#0F172A]/05'}`}
                            >
                                <div className="w-10 h-10 bg-[#0F172A]/03 rounded-lg overflow-hidden border border-[#0F172A]/05">
                                    <img src={v.img} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-[12px] font-bold leading-none uppercase ${(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) ? 'text-white' : 'text-[#0F172A]/40'}`}>{v.brand}</h4>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) ? 'text-[#FF9900]' : 'text-[#0F172A]/20'}`}>{v.plate}</p>
                                </div>
                                {(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) && (
                                    <Check size={14} strokeWidth={4} className="text-[#FF9900]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0F172A] text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1 leading-none">Trip Fee</p>
                            <p className="text-2xl font-black text-white tracking-tighter leading-none">
                                <span className="text-[#FF9900] mr-1">₹</span>{estimatedTotal}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                                <ShieldCheck size={12} className="text-[#FF9900]" />
                                <span className="text-[9px] font-bold uppercase tracking-tight text-white/60">Verified Profile</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Sticky Footer */}
            <div className="fixed bottom-[80px] left-0 right-0 z-50 px-5 px-safe">
                <div className="max-w-[430px] mx-auto flex items-center gap-3 bg-[#0F172A] p-4 rounded-xl shadow-xl">
                    <div className="flex-shrink-0">
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">Estimated Total</p>
                        <p className="text-[18px] font-bold text-[#FF9900] tracking-tight leading-none">₹{estimatedTotal}</p>
                    </div>
                    <button
                        onClick={() => setPhase(PHASES.CHECKOUT)}
                        disabled={!selectedVehicle}
                        className="flex-1 h-12 bg-white text-[#0F172A] rounded-lg font-bold text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-20"
                    >
                        Review
                        <ChevronRight size={14} strokeWidth={3} className="text-[#FF9900]" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderFindingDriver = () => {
        const driverAssigned = ['en_route', 'arrived'].includes(bookingDetails?.status);
        // 🏎️ Simulated nearby drivers for Rapido vibe
        const nearbyDrivers = [
            { id: 1, lat: userCoords.lat + 0.003, lng: userCoords.lng + 0.002, rot: 45 },
            { id: 2, lat: userCoords.lat - 0.002, lng: userCoords.lng + 0.004, rot: 120 },
            { id: 3, lat: userCoords.lat + 0.004, lng: userCoords.lng - 0.003, rot: 280 },
            { id: 4, lat: userCoords.lat - 0.004, lng: userCoords.lng - 0.002, rot: 15 },
        ];

        return (
            <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
                {/* 🗺️ Live Metadata Integration: Service-specific Telemetry */}
                <div className="absolute inset-0 z-0">
                    <GoogleMapBox
                        center={userCoords}
                        zoom={15}
                        options={{ gestureHandling: 'greedy' }}
                        markers={[
                            {
                                position: userCoords,
                                icon: {
                                    url: SERVICE_ASSETS.user,
                                    scaledSize: { width: 32, height: 32 },
                                    anchor: { x: 16, y: 32 }
                                },
                                infoContent: <div className="p-1 font-[1000] text-[9px] uppercase text-[#FF9900] tracking-widest">Your Terminal</div>
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                position: animatedDriverLocation,
                                icon: {
                                    url: SERVICE_ASSETS[selectedServiceKind]?.icon || SERVICE_ASSETS.point.icon,
                                    scaledSize: { width: 34, height: 34 },
                                    anchor: { x: 17, y: 17 }
                                },
                                infoContent: <div className="p-1 font-black text-[9px] uppercase text-green-500 tracking-widest">Driver Live</div>
                            }] : nearbyDrivers.map(d => ({
                                position: { lat: d.lat, lng: d.lng },
                                icon: {
                                    url: SERVICE_ASSETS[selectedServiceKind]?.icon || SERVICE_ASSETS.point.icon,
                                    scaledSize: { width: 28, height: 28 },
                                    rotation: d.rot,
                                    anchor: { x: 14, y: 14 }
                                }
                            })))
                        ]}
                        circles={[
                            {
                                center: userCoords,
                                radius: driverAssigned ? 90 : 160,
                                options: {
                                    strokeColor: '#F29F05',
                                    strokeOpacity: 0.3,
                                    strokeWeight: 1,
                                    fillColor: '#F29F05',
                                    fillOpacity: driverAssigned ? 0.08 : 0.12
                                }
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                center: animatedDriverLocation,
                                radius: 110,
                                options: {
                                    strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                    strokeOpacity: 0.45,
                                    strokeWeight: 1.25,
                                    fillColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                    fillOpacity: 0.12
                                }
                            }] : [])
                        ]}
                        darkMode={true}
                    />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full animate-pulse blur-3xl opacity-30" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-6 pb-12">
                    <div className="w-full flex items-center justify-between pt-4">
                        <button onClick={handleCancelRequest} className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90">
                            <X size={16} />
                        </button>
                        <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-full flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-ping`} style={{ backgroundColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color }} />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                {driverAssigned ? `${driverInfo?.name || 'Driver'} assigned` : `Searching ${selectedType?.title} grid`}
                            </span>
                        </div>
                        <div className="w-8" />
                    </div>

                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                            <div className="absolute -inset-16 bg-brand/5 rounded-full animate-ping opacity-10" />
                            <div className="absolute -inset-8 bg-brand/10 rounded-full animate-ping opacity-20" />
                            <div className="relative w-28 h-28 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center">
                                {driverAssigned ? (
                                    <div className="flex flex-col items-center">
                                        <Navigation className="w-8 h-8 text-brand mb-2 animate-pulse" />
                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                                            {bookingDetails?.status === 'arrived' ? 'Driver arrived' : 'On the way'}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-[1000] text-brand tabular-nums leading-none">{lookingTime}</span>
                                            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">SECONDS</span>
                                        </div>
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                            <motion.circle
                                                cx="56" cy="56" r="52" fill="none" stroke="#F29F05" strokeWidth="4"
                                                strokeDasharray="327"
                                                animate={{ strokeDashoffset: 327 - (327 * (180 - lookingTime)) / 180 }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-full mb-3">
                                <Radar className={`w-3 h-3 text-[#FF9900] ${driverAssigned ? '' : 'animate-spin'}`} />
                                <span className="text-[8px] font-black text-[#FF9900] uppercase tracking-[0.2em]">
                                    {driverAssigned
                                        ? (bookingDetails?.status === 'arrived' ? 'Driver reached pickup' : 'Driver accepted request')
                                        : (lookingTime > 120 ? 'Phase 1: Local grid (1.0 km)' : 'Phase 2: Expanded network scan')}
                                </span>
                            </div>
                            <h3 className="text-2xl font-[1000] text-white uppercase tracking-tighter leading-none mb-2">
                                {driverAssigned ? <>Driver<br />assigned</> : <>Requesting<br />chauffeurs</>}
                            </h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed h-8">
                                {driverAssigned
                                    ? (bookingDetails?.status === 'arrived'
                                        ? 'Your chauffeur is waiting at the pickup point.'
                                        : 'Your chauffeur is on the way. Live telemetry is now active.')
                                    : (lookingTime > 150 ? 'Pinging nearby driver terminals...' :
                                        lookingTime > 120 ? 'Connecting to local telemetry...' :
                                        lookingTime > 90 ? 'Broadcasting to outer perimeter...' :
                                        lookingTime > 60 ? 'Optimizing route assignments...' :
                                        lookingTime > 30 ? 'Nearby chauffeurs notified...' :
                                        'Securely finalizing driver pulse...')}
                            </p>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex gap-3">
                            <button 
                                onClick={handleSOS}
                                className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20 active:scale-90 transition-transform pointer-events-auto"
                            >
                                <AlertTriangle size={24} />
                            </button>
                            <button 
                                onClick={driverAssigned ? () => navigate(`/spare-driver/support?bookingId=${activeBookingId}`) : handleCancelRequest}
                                className="flex-1 h-14 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform pointer-events-auto"
                            >
                                {driverAssigned ? <MessageSquare size={18} className="text-white/40" /> : <X size={18} className="text-white/40" />}
                                <span className="text-[13px] font-black text-white uppercase tracking-widest">
                                    {driverAssigned ? 'Need help' : 'Cancel request'}
                                </span>
                            </button>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                                        <ShieldCheck size={18} className="text-brand" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white leading-none mb-0.5">ELITE PROTOCOL</p>
                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Only 4.8★+ Rated Drivers</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-0.5 leading-none">Security PIN</p>
                                    <p className="text-sm font-[1000] text-white tracking-widest leading-none">
                                        {driverAssigned ? visibleSecurityPin : 'LOCKED'}
                                    </p>
                                </div>
                            </div>

                            {driverAssigned && (
                                <div className="rounded-[1.75rem] bg-brand/10 border border-brand/20 px-4 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[8px] font-black text-brand uppercase tracking-[0.25em] mb-2">
                                                Start trip PIN
                                            </p>
                                            <p className="text-3xl font-[1000] text-white tracking-[0.45em] leading-none">
                                                {visibleSecurityPin}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-white/80 uppercase tracking-widest mb-1">
                                                Share only at pickup
                                            </p>
                                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] max-w-[110px] leading-relaxed">
                                                Share this OTP only after the driver reaches your pickup point.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[8px] font-black text-white/10 uppercase tracking-[0.4em] animate-pulse">
                            {driverAssigned ? 'Live chauffeur link established' : 'Secure handshake in progress'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderFindingDriverLite = () => {
        const driverAssigned = ['en_route', 'arrived'].includes(bookingDetails?.status);
        const serviceAccent = SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color;
        const searchProgress = driverAssigned ? 1 : Math.min(1, (LOOKUP_WINDOW_SECONDS - lookingTime) / LOOKUP_WINDOW_SECONDS);
        const nearbyDrivers = Array.from({ length: 5 }, (_, index) => {
            const baseAngle = (driverSweepTick * 0.35) + (index * 1.2);
            const latOffset = Math.cos(baseAngle) * (0.0018 + (index * 0.00035));
            const lngOffset = Math.sin(baseAngle) * (0.0023 + (index * 0.0003));

            return {
                id: index + 1,
                lat: userCoords.lat + latOffset,
                lng: userCoords.lng + lngOffset
            };
        });

        const searchPhaseLabel = driverAssigned
            ? (bookingDetails?.status === 'arrived' ? 'Driver reached your pickup' : 'Driver matched and moving')
            : (lookingTime > 120
                ? 'Scanning nearby chauffeur ring'
                : lookingTime > 60
                    ? 'Expanding driver discovery'
                    : 'Locking the fastest nearby captain');

        const searchPhaseHint = driverAssigned
            ? (bookingDetails?.status === 'arrived'
                ? 'Your chauffeur has reached the pickup point. Share the OTP when ready.'
                : 'Live location is active now. Your chauffeur is approaching your pickup.')
            : (lookingTime > 120
                ? 'Nearby premium drivers are being matched around your pickup zone.'
                : lookingTime > 60
                    ? 'The network is checking the wider area for the best available driver.'
                    : 'Final availability sweep is running to secure your booking quickly.');
        const liveSearchPolyline = driverAssigned && animatedDriverLocation
            ? [{
                path: [animatedDriverLocation, userCoords],
                options: {
                    strokeColor: serviceAccent,
                    strokeOpacity: 0.95,
                    strokeWeight: 4,
                    geodesic: true,
                    icons: [{
                        icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 0.7,
                            scale: 3
                        },
                        offset: '0',
                        repeat: '12px'
                    }]
                }
            }]
            : [];

        return (
            <div className="min-h-screen bg-[#f7f6f1] flex flex-col relative overflow-hidden">
                <div className="relative h-[82svh] min-h-[34rem] overflow-hidden">
                    <GoogleMapBox
                        center={userCoords}
                        zoom={15}
                        markers={[
                            {
                                position: userCoords,
                                icon: {
                                    url: USER_AND_CAR_MARKER,
                                    scaledSize: { width: 50, height: 58 },
                                    anchor: { x: 25, y: 50 }
                                },
                                infoContent: <div className="p-1 font-black text-[9px] uppercase text-brand tracking-widest">You + Vehicle</div>
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                position: animatedDriverLocation,
                                icon: {
                                    url: createDriverMarkerIcon(serviceAccent),
                                    scaledSize: { width: 46, height: 56 },
                                    anchor: { x: 23, y: 46 }
                                },
                                infoContent: <div className="p-1 font-black text-[9px] uppercase text-green-500 tracking-widest">Driver Live</div>
                            }] : nearbyDrivers.map((driver) => ({
                                position: { lat: driver.lat, lng: driver.lng },
                                icon: {
                                    url: createDriverMarkerIcon(serviceAccent),
                                    scaledSize: { width: 36, height: 44 },
                                    anchor: { x: 18, y: 36 }
                                }
                            })))
                        ]}
                        circles={[
                            {
                                center: userCoords,
                                radius: driverAssigned ? 90 : 160,
                                options: {
                                    strokeColor: serviceAccent,
                                    strokeOpacity: 0.2,
                                    strokeWeight: 1,
                                    fillColor: serviceAccent,
                                    fillOpacity: driverAssigned ? 0.06 : 0.08
                                }
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                center: animatedDriverLocation,
                                radius: 110,
                                options: {
                                    strokeColor: serviceAccent,
                                    strokeOpacity: 0.25,
                                    strokeWeight: 1.25,
                                    fillColor: serviceAccent,
                                    fillOpacity: 0.08
                                }
                            }] : [])
                        ]}
                        polylines={liveSearchPolyline}
                        darkMode={false}
                    />

                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 via-white/40 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#f7f6f1] via-[#f7f6f1]/45 to-transparent pointer-events-none" />

                    <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4">
                        <div className="flex items-start justify-between gap-3">
                            <button
                                onClick={driverAssigned ? () => navigate(`/spare-driver/support?bookingId=${activeBookingId}`) : handleCancelRequest}
                                className="w-11 h-11 rounded-full bg-white/92 backdrop-blur-xl border border-black/[0.06] shadow-[0_14px_30px_rgba(15,23,42,0.12)] flex items-center justify-center text-black active:scale-95"
                            >
                                {driverAssigned ? <MessageSquare size={18} /> : <X size={18} />}
                            </button>

                            <div className="rounded-full bg-white/92 backdrop-blur-xl border border-black/[0.06] shadow-[0_18px_40px_rgba(15,23,42,0.12)] px-4 py-2.5 text-center">
                                <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.28em] leading-none">
                                    {driverAssigned ? 'Chauffeur locked' : 'Searching nearby'}
                                </p>
                                <p className="text-[11px] font-[1000] text-black uppercase tracking-[0.12em] leading-none mt-2">
                                    {driverAssigned ? `${driverInfo?.name || 'Driver'} assigned` : selectedType?.title || 'Spare driver'}
                                </p>
                            </div>

                            <button
                                onClick={handleSOSNavigation}
                                className="w-11 h-11 rounded-full bg-[#111827] text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] flex items-center justify-center active:scale-95"
                            >
                                <AlertTriangle size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 -mt-3 flex-1 rounded-t-[2.1rem] bg-white border-t border-black/[0.04] shadow-[0_-20px_50px_rgba(15,23,42,0.12)] px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)]">
                    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-black/[0.08]" />

                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.28em] leading-none">Booking status</p>
                            <h3 className="text-[1.35rem] font-[1000] text-[#101828] tracking-tight leading-none mt-2">
                                {driverAssigned ? 'Driver assigned' : 'Requesting chauffeurs'}
                            </h3>
                        </div>
                        <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] px-3 py-2 text-right min-w-[110px]">
                            <p className="text-[8px] font-black text-[#F97316] uppercase tracking-[0.24em] leading-none">Trip state</p>
                            <p className="text-[11px] font-[1000] text-[#111827] uppercase tracking-[0.16em] leading-none mt-2">
                                {driverAssigned ? (bookingDetails?.status === 'arrived' ? 'Arrived' : 'En route') : 'Searching'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[#F97316] via-[#F29F05] to-[#FACC15]"
                                animate={{ width: `${Math.max(12, searchProgress * 100)}%` }}
                                transition={{ duration: 0.9, ease: 'easeInOut' }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <div className="inline-flex items-center gap-2">
                                <Radar className={`w-3.5 h-3.5 ${driverAssigned ? '' : 'animate-spin'}`} style={{ color: serviceAccent }} />
                                <span className="text-[9px] font-black text-black/55 uppercase tracking-[0.22em]">
                                    {searchPhaseLabel}
                                </span>
                            </div>
                            {!driverAssigned && (
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.22em]">
                                    Live Search
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-black/45 leading-relaxed mt-3">
                            {searchPhaseHint}
                        </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-[1.35rem] border border-black/[0.05] bg-[#FCFCFD] px-3.5 py-3">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em] leading-none">Pickup base</p>
                            <p className="text-[11px] font-[1000] text-[#101828] uppercase tracking-[0.08em] leading-snug mt-2">
                                {selectedAddress?.label || bookingDetails?.pickupLocation?.address || 'Current pickup location'}
                            </p>
                        </div>
                        <div className="rounded-[1.35rem] border border-black/[0.05] bg-[#FCFCFD] px-3.5 py-3">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em] leading-none">
                                {driverAssigned ? 'Driver route' : 'Elite protocol'}
                            </p>
                            <p className="text-[11px] font-[1000] text-[#101828] uppercase tracking-[0.08em] leading-snug mt-2">
                                {driverAssigned ? 'Live route linked to your pickup' : 'Only verified drivers are being pinged'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 space-y-3">
                        {driverAssigned ? (
                            <div className="rounded-[1.6rem] bg-[#111827] text-white px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-white/45 uppercase tracking-[0.28em] leading-none">Share OTP at pickup</p>
                                        <p className="text-[1.7rem] font-[1000] tracking-[0.42em] leading-none mt-3 pl-1">
                                            {visibleSecurityPin}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-[#F29F05] uppercase tracking-[0.2em] leading-none">
                                            {driverInfo?.name || 'Assigned driver'}
                                        </p>
                                        <p className="text-[9px] font-bold text-white/55 leading-relaxed mt-3 max-w-[110px]">
                                            Your driver has accepted the request. Share the OTP only after pickup arrival.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleCancelRequest}
                                className="w-full h-14 rounded-[1.35rem] bg-[#111827] text-white flex items-center justify-center gap-3 font-[1000] text-[12px] uppercase tracking-[0.24em] active:scale-[0.99] transition-transform"
                            >
                                <X size={18} />
                                Cancel request
                            </button>
                        )}

                        <div className="grid grid-cols-[64px,1fr] gap-3">
                            <button
                                onClick={handleSOSNavigation}
                                className="h-14 rounded-[1.2rem] bg-[#EF4444] text-white flex items-center justify-center shadow-[0_18px_35px_rgba(239,68,68,0.22)] active:scale-95"
                            >
                                <AlertTriangle size={22} />
                            </button>
                            <button
                                onClick={driverAssigned ? () => navigate(`/spare-driver/support?bookingId=${activeBookingId}`) : () => navigate(activeBookingId ? `/spare-driver/support?bookingId=${activeBookingId}` : '/spare-driver/support')}
                                className="h-14 rounded-[1.2rem] border border-black/[0.06] bg-[#FCFCFD] flex items-center justify-between px-4 active:scale-[0.99] transition-transform"
                            >
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.22em] leading-none">
                                        {driverAssigned ? 'Need help' : 'Support'}
                                    </p>
                                    <p className="text-[12px] font-[1000] text-[#101828] uppercase tracking-[0.08em] leading-none mt-2">
                                        {driverAssigned ? 'Contact support' : 'Issue or emergency help'}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-black/35" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBookingConfirmed = () => {
        const isScheduledHoldView = bookingDetails?.status === 'pending' && !isDispatchReadyBooking(bookingDetails);
        const matchingWindow = getScheduledServiceTime(
            bookingDetails?.schedule || {
                date: bookingDetails?.date,
                timeSlot: { start: bookingDetails?.time }
            }
        );

        if (!isScheduledHoldView) {
            return renderFindingDriverLite();
        }

        return (
        <div className="p-5 space-y-5">
            <div className="flex flex-col items-center text-center py-4">
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-lg shadow-emerald-500/5"
                >
                    <Calendar size={28} strokeWidth={2} />
                </motion.div>
                <h2 className="text-xl font-[1000] text-black uppercase tracking-tight leading-none mb-2">Booking scheduled</h2>
                <div className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{bookingDetails.date} @ {bookingDetails.time}</span>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-black/[0.04] p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-[#FF9900]/10 rounded-xl flex items-center justify-center text-[#FF9900] border border-[#FF9900]/20">
                        <User size={24} />
                    </div>
                    <div>
                        <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Elite chauffeur</h4>
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <span className="w-1 h-1 rounded-full bg-brand" /> Driver Details arriving soon
                        </p>
                        <p className="text-[9px] font-bold text-black/35 uppercase tracking-[0.15em] mt-2 leading-relaxed">
                            Matching will begin about {CHAUFFEUR_DISPATCH_LEAD_MINUTES} minutes before departure.
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-black/[0.03] grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-black/[0.02] flex flex-col gap-1">
                        <span className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em] leading-none mb-0.5">Assigned car</span>
                        <div className="flex items-center gap-1.5">
                            <Car size={10} className="text-black/40" />
                            <span className="text-[10px] font-black text-black uppercase leading-none truncate">{selectedVehicle?.brand} {selectedVehicle?.model}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-black/[0.02] flex flex-col gap-1">
                        <span className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em] leading-none mb-0.5">Estimated fare</span>
                        <div className="flex items-center gap-1.5">
                            <CreditCard size={10} className="text-black/40" />
                            <span className="text-[10px] font-black text-black uppercase leading-none">{formatInr(bookingDetails?.pricing?.totalAmount || estimatedTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-4 space-y-2">
                <p className="text-[8px] font-black text-blue-700 uppercase tracking-[0.25em]">Dispatch window</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-blue-900/50 uppercase tracking-widest">Driver matching opens</span>
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-tight">
                        {matchingWindow.toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <p className="text-[8px] font-bold text-blue-900/40 uppercase tracking-[0.12em] leading-relaxed">
                    We will hold your slot, notify admin, and start live driver assignment closer to the service time.
                </p>
            </div>

            <button
                onClick={() => navigate(activeBookingId ? `/spare-driver/history?bookingId=${activeBookingId}` : '/spare-driver/history')}
                className="w-full bg-black text-white h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
            >
                View in history
                <ChevronRight size={18} strokeWidth={3} />
            </button>
        </div>
    );
    };


    const renderTripActive = () => (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            <div className="flex-1 relative">
                {/* 🗺️ Live Mission Overlay */}
                <div className="absolute inset-0 z-0">
                    <GoogleMapBox
                        center={animatedDriverLocation || userCoords}
                        zoom={15}
                        markers={[
                            {
                                position: userCoords,
                                icon: {
                                    url: SERVICE_ASSETS.user,
                                    scaledSize: { width: 20, height: 20 },
                                    anchor: { x: 10, y: 10 }
                                }
                            },
                            ...(animatedDriverLocation ? [{
                                position: animatedDriverLocation,
                                icon: {
                                    url: SERVICE_ASSETS[selectedServiceKind]?.icon || SERVICE_ASSETS.point.icon,
                                    scaledSize: { width: 42, height: 42 },
                                    anchor: { x: 21, y: 21 }
                                },
                                infoContent: (
                                    <div className="p-1 font-outfit text-center">
                                        <p className="text-[8px] font-black uppercase text-brand tracking-widest">Your Captain</p>
                                        <p className="text-[10px] font-black text-black leading-none mt-1">{driverInfo?.name || 'En Route'}</p>
                                    </div>
                                )
                            }] : [])
                        ]}
                        circles={[
                            {
                                center: userCoords,
                                radius: 85,
                                options: {
                                    strokeColor: '#F29F05',
                                    strokeOpacity: 0.35,
                                    strokeWeight: 1,
                                    fillColor: '#F29F05',
                                    fillOpacity: 0.08
                                }
                            },
                            ...(animatedDriverLocation ? [{
                                center: animatedDriverLocation,
                                radius: 120,
                                options: {
                                    strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                    strokeOpacity: 0.4,
                                    strokeWeight: 1.2,
                                    fillColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                    fillOpacity: 0.12
                                }
                            }] : [])
                        ]}
                        darkMode={true}
                    />
                </div>

                <div className="absolute top-10 left-4 right-4 z-20">
                    <div className="bg-black/45 backdrop-blur-2xl border border-white/8 rounded-[1.6rem] p-3.5 flex items-center justify-between shadow-[0_24px_45px_rgba(0,0,0,0.24)]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
                                <Navigation size={18} className={`text-brand ${animatedDriverLocation ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-white uppercase tracking-tight leading-none mb-1">Live telemetry</h4>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] leading-none">
                                    {driverLocation ? 'Driver is moving' : 'Waiting for GPS pulse...'}
                                </p>
                            </div>
                        </div>
                        <div className="px-2 py-1 bg-brand/20 text-brand border border-brand/20 rounded-md text-[8px] font-black uppercase tracking-widest leading-none">
                            {bookingDetails?.status === 'arrived' ? 'Arrived' : 'En Route'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-t-[2.75rem] p-6 space-y-5 shadow-[0_-24px_55px_rgba(15,23,42,0.1)] relative z-30 pb-8 border-t border-black/[0.04]">
                <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto mb-2" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.25em] mb-1.5 leading-none">Session duration</p>
                        <h4 className="text-3xl font-[1000] text-black tracking-tighter leading-none tabular-nums">{formatTime(elapsedTime)}</h4>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-brand font-black text-[9px] uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                            Live session
                        </div>
                    </div>
                </div>

                <div className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] border border-black/[0.04] p-4 rounded-[1.75rem] flex items-center justify-between shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shadow-sm border border-black/[0.03]">
                            <img src={driverInfo?.img} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-[11px] font-black text-black leading-none">{driverInfo?.name}</p>
                                {driverInfo?.isPremium && (
                                    <div className="bg-brand/10 text-brand px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-brand/20">
                                        <ShieldCheck size={7} fill="currentColor" />
                                        <span className="text-[6px] font-black uppercase tracking-tighter">Premium</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                                {driverInfo?.isPremium ? 'Elite Chauffeur' : 'Verified Chauffeur'}
                            </p>
                        </div>
                    </div>
                    {bookingDetails?.status === 'arrived' ? (
                        <div className="bg-brand/10 border border-brand/20 px-4 py-3 rounded-[1.5rem] text-center min-w-[118px] shadow-[0_12px_24px_rgba(242,159,5,0.12)]">
                            <p className="text-[7px] font-black text-brand uppercase tracking-widest mb-0.5">Start PIN</p>
                            <p className="text-lg font-[1000] text-black tracking-[0.35em] pl-1">{visibleSecurityPin}</p>
                            <p className="text-[7px] font-bold text-black/35 uppercase tracking-[0.15em] mt-1">share after arrival</p>
                        </div>
                    ) : (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-black leading-none">{formatInr(bookingDetails?.pricing?.totalAmount)}</p>
                            <p className="text-[7px] font-bold text-black/25 uppercase tracking-widest mt-1">Total Fare</p>
                        </div>
                    )}
                </div>

                {/* 🏷️ Phase 11: Real-time Surcharge Pulse 🏷️ */}
                {(bookingDetails?.pricing?.totalAmount > (selectedType?.basePrice || 0)) && (
                    <div className="px-5 py-3 bg-brand/[0.03] border border-brand/10 rounded-2xl space-y-1.5 anim-pulse-subtle">
                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1.5 opacity-60">Surcharges applied</p>
                        {bookingDetails.notes?.internal?.includes('[WAITING]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Waiting fee</span>
                                <span className="text-[9px] font-black text-black">Applied</span>
                            </div>
                        )}
                        {bookingDetails.notes?.internal?.includes('[ARREARS]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Trip extension</span>
                                <span className="text-[9px] font-black text-black">Active</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🛡️ Outstation Safety & Allowance Context 🛡️ */}
                {isOutstationService && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-blue-600" />
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Outstation mission protocol</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Stay & food allowance</span>
                                <span className="text-[8px] font-black text-blue-900">₹500 / 24h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Daily driving limit</span>
                                <span className="text-[8px] font-black text-blue-900">9 Hours Max</span>
                            </div>
                        </div>
                        <p className="text-[7px] font-bold text-blue-900/30 uppercase leading-tight">
                            Note: Tolls, State Taxes & Parking are to be paid by the customer directly.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate(`/spare-driver/support?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className="w-full bg-gray-50 text-black h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] border border-black/[0.03] shadow-[0_12px_24px_rgba(15,23,42,0.05)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <MessageSquare size={14} />
                        Help
                    </button>
                    <button
                        onClick={() => navigate(`/spare-driver/history?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className="w-full bg-black text-white h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_18px_35px_rgba(0,0,0,0.16)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Car size={14} />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTripActiveLite = () => (
        <div className="min-h-screen bg-[#f7f6f1] flex flex-col relative overflow-hidden">
            <div className="relative h-[82svh] min-h-[34rem] overflow-hidden">
                <GoogleMapBox
                    center={animatedDriverLocation || userCoords}
                    zoom={15}
                    options={{ gestureHandling: 'greedy' }}
                    markers={[
                        {
                            position: userCoords,
                            icon: {
                                url: USER_AND_CAR_MARKER,
                                scaledSize: { width: 50, height: 58 },
                                anchor: { x: 25, y: 50 }
                            },
                            infoContent: <div className="p-1 font-black text-[9px] uppercase text-brand tracking-widest">You + Vehicle</div>
                        },
                        ...(animatedDriverLocation ? [{
                            position: animatedDriverLocation,
                            icon: {
                                url: createDriverMarkerIcon(SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color),
                                scaledSize: { width: 46, height: 56 },
                                anchor: { x: 23, y: 46 }
                            },
                            infoContent: (
                                <div className="p-1 text-center">
                                    <p className="text-[8px] font-black uppercase text-brand tracking-widest">Your {driverInfo?.isPremium ? 'Elite' : 'Verified'} Chauffeur</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <p className="text-[10px] font-black text-black leading-none">{driverInfo?.name || 'En Route'}</p>
                                        {driverInfo?.isPremium && <ShieldCheck size={10} className="text-brand" />}
                                    </div>
                                </div>
                            )
                        }] : [])
                    ]}
                    circles={[
                        {
                            center: userCoords,
                            radius: 85,
                            options: {
                                strokeColor: '#F29F05',
                                strokeOpacity: 0.22,
                                strokeWeight: 1,
                                fillColor: '#F29F05',
                                fillOpacity: 0.08
                            }
                        },
                        ...(animatedDriverLocation ? [{
                            center: animatedDriverLocation,
                            radius: 120,
                            options: {
                                strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                strokeOpacity: 0.22,
                                strokeWeight: 1.2,
                                fillColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                                fillOpacity: 0.08
                            }
                        }] : [])
                    ]}
                    polylines={animatedDriverLocation ? [{
                        path: [animatedDriverLocation, userCoords],
                        options: {
                            strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                            strokeOpacity: 0.95,
                            strokeWeight: 4,
                            geodesic: true,
                            icons: [{
                                icon: {
                                    path: 'M 0,-1 0,1',
                                    strokeOpacity: 0.7,
                                    scale: 3
                                },
                                offset: '0',
                                repeat: '12px'
                            }]
                        }
                    }] : []}
                    darkMode={false}
                />

                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 via-white/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#f7f6f1] via-[#f7f6f1]/45 to-transparent pointer-events-none" />

                <div className="absolute top-4 left-4 right-4 z-20">
                    <div className="rounded-[1.4rem] bg-white/92 backdrop-blur-xl border border-black/[0.05] px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center">
                                <Navigation size={18} className={`text-brand ${animatedDriverLocation ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.24em] leading-none">Live Trip</p>
                                <p className="text-[11px] font-[1000] text-black uppercase tracking-[0.08em] leading-none mt-2">
                                    {driverLocation ? 'Driver is moving' : 'Waiting for GPS pulse'}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-2">
                            <span className="text-[8px] font-black text-[#F97316] uppercase tracking-[0.24em]">
                                {bookingDetails?.status === 'arrived' ? 'Arrived' : 'En Route'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-30 -mt-3 flex-1 rounded-t-[2.1rem] bg-white border-t border-black/[0.04] shadow-[0_-20px_50px_rgba(15,23,42,0.12)] px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)]">
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-black/[0.08]" />

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-[0.28em] leading-none">Session duration</p>
                        <h4 className="text-[2rem] font-[1000] text-[#101828] tracking-tight leading-none tabular-nums">{formatTime(elapsedTime)}</h4>
                    </div>
                    <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] px-3 py-2 text-right min-w-[110px]">
                        <p className="text-[8px] font-black text-[#F97316] uppercase tracking-[0.24em] leading-none">Trip status</p>
                        <p className="text-[11px] font-[1000] text-[#111827] uppercase tracking-[0.16em] leading-none mt-2">Live Session</p>
                    </div>
                </div>

                <div className="mt-3 h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#F97316] via-[#F29F05] to-[#FACC15]"
                        animate={{ width: ['18%', '74%', '46%', '85%'] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <div className="mt-3 rounded-[1.7rem] border border-black/[0.04] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-white rounded-xl overflow-hidden shadow-sm border border-black/[0.03]">
                                <img src={driverInfo?.img} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-[11px] font-black text-black leading-none">{driverInfo?.name}</p>
                                    {driverInfo?.isPremium && (
                                        <div className="bg-brand/10 text-brand px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-brand/20 shadow-[0_4px_10px_rgba(242,159,5,0.1)]">
                                            <Star size={7} fill="currentColor" />
                                            <span className="text-[6px] font-black uppercase tracking-tighter">Premium</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                                    {driverInfo?.isPremium ? 'Elite Assigned Chauffeur' : 'Assigned Chauffeur'}
                                </p>
                            </div>
                        </div>
                        {bookingDetails?.status === 'arrived' ? (
                            <div className="rounded-[1.2rem] bg-[#111827] text-white px-4 py-3 text-center min-w-[122px]">
                                <p className="text-[7px] font-black text-white/45 uppercase tracking-widest mb-1">Start Pin</p>
                                <p className="text-lg font-[1000] tracking-[0.35em] pl-1">{visibleSecurityPin}</p>
                            </div>
                        ) : (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-black leading-none">{formatInr(bookingDetails?.pricing?.totalAmount)}</p>
                                <p className="text-[7px] font-bold text-black/25 uppercase tracking-widest mt-1">Total fare</p>
                            </div>
                        )}
                    </div>
                </div>

                {(bookingDetails?.pricing?.totalAmount > (selectedType?.basePrice || 0)) && (
                    <div className="mt-3 px-4 py-3 bg-brand/[0.03] border border-brand/10 rounded-[1.4rem] space-y-1.5">
                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1.5 opacity-60">Surcharges applied</p>
                        {bookingDetails.notes?.internal?.includes('[WAITING]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Waiting Fee</span>
                                <span className="text-[9px] font-black text-black">Applied</span>
                            </div>
                        )}
                        {bookingDetails.notes?.internal?.includes('[ARREARS]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Trip Extension</span>
                                <span className="text-[9px] font-black text-black">Active</span>
                            </div>
                        )}
                    </div>
                )}

                {isOutstationService && (
                    <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-[1.4rem] space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-blue-600" />
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Outstation mission protocol</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Stay & Food Allowance</span>
                                <span className="text-[8px] font-black text-blue-900">₹500 / 24h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Daily Driving Limit</span>
                                <span className="text-[8px] font-black text-blue-900">9 Hours Max</span>
                            </div>
                        </div>
                        <p className="text-[7px] font-bold text-blue-900/30 uppercase leading-tight">
                            Note: Tolls, State Taxes & Parking are to be paid by the customer directly.
                        </p>
                    </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate(`/spare-driver/support?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className="w-full bg-gray-50 text-black h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] border border-black/[0.03] shadow-[0_12px_24px_rgba(15,23,42,0.05)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <MessageSquare size={14} />
                        Help
                    </button>
                    <button
                        onClick={() => navigate(`/spare-driver/history?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className="w-full bg-black text-white h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_18px_35px_rgba(0,0,0,0.16)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Car size={14} />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTripCompleted = () => (
        <div className="min-h-screen bg-[linear-gradient(180deg,#FFF9ED_0%,#FFFFFF_42%,#FFFFFF_100%)] flex flex-col items-center justify-center p-6 text-center space-y-5">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-lg shadow-emerald-500/5"
            >
                <CheckCircle2 size={36} strokeWidth={2.5} />
            </motion.div>

            <div className="space-y-2 max-w-[240px]">
                <h2 className="text-2xl font-[1000] text-black uppercase tracking-tight leading-none">Session<br />Completed</h2>
                <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.15em] leading-relaxed">Thank you for traveling with Spare Driver elite chauffeurs.</p>
            </div>

            <div className="w-full bg-white border border-black/[0.03] p-5 rounded-[2rem] space-y-3 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <div>
                        <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Service</span>
                        <p className="text-[12px] font-black text-black uppercase leading-none mt-1">{selectedType?.title || 'Chauffeur Service'}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Settlement</span>
                        <p className="text-[12px] font-black text-black uppercase leading-none mt-1">
                            {hasOutstandingSettlement ? 'balance due' : (useSubscription ? 'Pass Credit' : (bookingDetails?.payment?.status || 'paid'))}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Base Fare</span>
                    <span className="text-[12px] font-black text-black leading-none">{formatInr(selectedType?.basePrice)}</span>
                </div>
                
                {bookingDetails?.pricing?.breakdown?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between opacity-60">
                        <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">{item.name}</span>
                        <span className="text-[10px] font-black text-black leading-none">+{formatInr(item.amount)}</span>
                    </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] font-black text-[#FF9900] uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-[1000] text-black tracking-tight leading-none">{formatInr(bookingDetails?.pricing?.totalAmount)}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-black/5 pt-3">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Time In Session</span>
                    <span className="text-[12px] font-black text-black uppercase leading-none">{formatTime(elapsedTime)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-black/5 pt-3">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Service Flow</span>
                    <span className="text-[11px] font-black text-black uppercase leading-none">{serviceFlowMeta.durationLabel}</span>
                </div>
            </div>

            <div className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-4">
                <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Trip Summary Note</p>
                <p className="text-[10px] font-bold text-blue-900/70 uppercase mt-2 leading-relaxed">
                    {serviceFlowMeta.supportNote}
                </p>
                {['refund_pending', 'refund_failed'].includes(bookingDetails?.payment?.status) && (
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mt-3">
                        Refund review is still in progress. Support can help from trip history.
                    </p>
                )}
            </div>

            {hasOutstandingSettlement && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 text-left space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Additional Payable</p>
                            <p className="text-[10px] font-bold text-amber-900/70 uppercase mt-1 leading-relaxed">
                                Extra usage charges were added after trip completion.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Due Now</p>
                            <p className="text-xl font-[1000] text-amber-950 leading-none mt-1">{formatInr(outstandingSettlementAmount)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleSettlementPayment('wallet')}
                            disabled={isSettlingPayment}
                            className="w-full bg-amber-400 text-black h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.18em] active:scale-[0.98] transition-all disabled:opacity-60"
                        >
                            {isSettlingPayment ? 'Processing...' : 'Pay from Wallet'}
                        </button>
                        <button
                            onClick={() => handleSettlementPayment('online')}
                            disabled={isSettlingPayment}
                            className="w-full bg-black text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.18em] active:scale-[0.98] transition-all disabled:opacity-60"
                        >
                            {isSettlingPayment ? 'Opening...' : 'Pay Online'}
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full space-y-3 pt-2">
                {!hasOutstandingSettlement && (
                    <button
                        onClick={() => navigate(`/rate?id=${bookingDetails?._id || activeBookingId}`)}
                        className="w-full bg-brand text-black h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
                    >
                        Rate Driver
                    </button>
                )}
                <button
                    onClick={() => {
                        resetChauffeurFlow(PHASES.SERVICE_TYPE);
                        navigate('/home');
                        refreshStats();
                    }}
                    className="w-full bg-black text-white h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
                >
                    {hasOutstandingSettlement ? 'Return Home (Pay Later)' : 'Return Home'}
                </button>
                <button
                    onClick={() => navigate(`/spare-driver/history?bookingId=${bookingDetails?._id || activeBookingId}`)}
                    className="w-full border border-gray-100 text-black/40 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
                >
                    View Trip Details
                </button>
            </div>
        </div>
    );

    const renderCheckout = () => (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#FFFDF5] to-[#FEF3C7] min-h-screen">
            <div className="px-5 pt-4 pb-2 border-b border-[#0F172A]/05">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[18px] font-black text-[#0F172A] tracking-tighter leading-none uppercase">Summary</h3>
                        <p className="text-[8px] font-extrabold text-[#FF9900] uppercase tracking-[0.2em] mt-0.5">HOORA ELITE • 2/2</p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 space-y-3">
                <div className="bg-white rounded-xl p-4 border border-[#0F172A]/05 shadow-sm space-y-3">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#0F172A]/03 flex items-center justify-center text-[#0F172A]">
                                <MapPin size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[7px] font-bold text-[#0F172A]/30 uppercase tracking-widest leading-none mb-0.5">Base</p>
                                <p className="text-[10px] font-black text-[#0F172A] uppercase truncate">{selectedAddress?.street || 'Pickup'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#FF9900]/05 flex items-center justify-center text-[#FF9900]">
                                <Navigation size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[7px] font-bold text-[#0F172A]/30 uppercase tracking-widest leading-none mb-0.5">Goal</p>
                                <p className="text-[10px] font-black text-[#0F172A] uppercase truncate">
                                    {requiresDestination ? (destination?.street || 'Destination') : (selectedType?.title || 'Trip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#0F172A]/05 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[7px] font-bold text-[#0F172A]/30 uppercase tracking-widest mb-0.5">Category</p>
                            <p className="text-[9px] font-black text-[#0F172A] uppercase">{bookingMode === 'instant' ? 'Rapid' : 'Plan'}</p>
                        </div>
                        <div>
                            <p className="text-[7px] font-bold text-[#0F172A]/30 uppercase tracking-widest mb-0.5">Vehicle</p>
                            <p className="text-[9px] font-black text-[#FF9900] uppercase truncate">{selectedVehicle ? `${selectedVehicle.brand}` : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* 🎯 RAPIDO-STYLE DYNAMIC PRICING BREAKDOWN */}
                <div className="bg-white rounded-xl p-4 border border-[#0F172A]/05 shadow-sm space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-[#0F172A]/40 uppercase tracking-widest">Fare Breakdown</h4>
                        {dynamicPricingBreakdown.hasExtraCharges && (
                            <span className="px-2 py-0.5 bg-[#FF9900]/10 text-[#FF9900] text-[7px] font-black uppercase tracking-wider rounded-full">
                                Extra Charges Applied
                            </span>
                        )}
                    </div>

                    {/* Dynamic Breakdown Items */}
                    <div className="space-y-2.5">
                        {dynamicPricingBreakdown.breakdown.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center justify-between py-2 ${
                                    index < dynamicPricingBreakdown.breakdown.length - 1 ? 'border-b border-[#0F172A]/05' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{item.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#0F172A] uppercase leading-none">
                                            {item.label}
                                        </p>
                                        {item.description && (
                                            <p className="text-[7px] font-bold text-[#0F172A]/30 uppercase tracking-wider mt-0.5">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-[11px] font-black uppercase tracking-tight ${
                                    item.type === 'surcharge' ? 'text-[#FF9900]' : 
                                    item.type === 'tax' ? 'text-blue-600' : 
                                    'text-[#0F172A]'
                                }`}>
                                    {item.type === 'tax' && commercialRules.gstInclusive ? '' : '+'}₹{item.amount}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Total Section */}
                    <div className="pt-3 border-t-2 border-[#0F172A]/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[8px] font-bold text-[#0F172A]/30 uppercase tracking-widest mb-1">Total Payable</p>
                                <p className="text-[20px] font-black text-[#0F172A] tracking-tighter leading-none">
                                    ₹{dynamicPricingBreakdown.total}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 justify-end mb-1">
                                    <ShieldCheck size={10} className="text-emerald-500" />
                                    <span className="text-[7px] font-bold uppercase tracking-tight text-emerald-600">Transparent</span>
                                </div>
                                <p className="text-[7px] font-bold text-[#0F172A]/20 uppercase">No Hidden Fees</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reserve Amount Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Lock size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-blue-900 uppercase tracking-wide leading-none mb-1">
                                Wallet Reserve: ₹{estimatedReserveAmount}
                            </p>
                            <p className="text-[7px] font-bold text-blue-600/60 leading-tight">
                                2-hour reserve held for potential overtime. Released if trip ends on time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0F172A] text-white rounded-xl p-4 flex items-center gap-4 shadow-lg border border-[#0F172A]/05">
                    <Shield size={18} className="text-[#FF9900]" />
                    <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-wide leading-none mb-1">Premium Insurance</p>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">₹5L Cover Active</p>
                    </div>
                </div>
            </div>

            {/* Compact Final Footer */}
            <div className="fixed bottom-[80px] left-0 right-0 z-50 px-5 px-safe">
                <div className="max-w-[430px] mx-auto bg-[#0F172A] p-4 rounded-xl shadow-2xl">
                    <button
                        onClick={handleConfirmBooking}
                        disabled={isProcessing}
                        className="w-full h-12 bg-white text-[#0F172A] rounded-lg font-bold text-[12px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Processing...' : 'Confirm & Pay'}
                        <ChevronRight size={16} strokeWidth={3} className="text-[#FF9900]" />
                    </button>
                </div>
            </div>
        </div>
    );

    const getPhaseTitle = () => {
        const isScheduledHoldView = bookingDetails?.status === 'pending' && !isDispatchReadyBooking(bookingDetails);
        switch (phase) {
            case PHASES.SERVICE_TYPE: return 'Select Service';
            case PHASES.BOOKING_DETAILS: return 'Booking Details';
            case PHASES.CONFIRM_VEHICLE: return 'Confirm Vehicle';
            case PHASES.CHECKOUT: return 'Checkout Details';
            case PHASES.FINDING_DRIVER: return 'Finding Driver';
            case PHASES.BOOKING_CONFIRMED: return isScheduledHoldView ? 'Booking Scheduled' : 'Driver Assigned';
            case PHASES.TRIP_ACTIVE: return 'Trip Active';
            case PHASES.TRIP_COMPLETED: return 'Finished';
            default: return 'Spare Driver';
        }
    };

    const showTopHeader = ![
        PHASES.FINDING_DRIVER,
        PHASES.TRIP_ACTIVE,
        PHASES.TRIP_COMPLETED
    ].includes(phase) && !(phase === PHASES.BOOKING_CONFIRMED && bookingDetails?.status !== 'pending');

    // 🛡️ Safe Render Guard: Never show Asset Management if redirect is imminent
    if (!vehiclesLoading && vehicles && vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
                <Loader2 className="w-10 h-10 text-[#FF9900] animate-spin mb-4" strokeWidth={3} />
                <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] animate-pulse">Initializing Direct Registry...</p>
            </div>
        );
    }

    return (
        <MobileLayout hideNav={phase === PHASES.TRIP_ACTIVE || phase === PHASES.FINDING_DRIVER || phase === PHASES.BOOKING_CONFIRMED || phase === PHASES.TRIP_COMPLETED}>
            <div className="min-h-screen bg-[linear-gradient(180deg,#FFF9EF_0%,#FFFFFF_14%,#FFFFFF_100%)] font-sans flex flex-col">
                {showTopHeader &&
                    renderHeader(getPhaseTitle(), true)}

                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full"
                        >
                            {phase === PHASES.BOOKING_DETAILS && renderBookingDetails()}
                            {phase === PHASES.CONFIRM_VEHICLE && renderConfirmVehicle()}
                            {phase === PHASES.CHECKOUT && renderCheckout()}
                            {phase === PHASES.FINDING_DRIVER && renderFindingDriverLite()}
                            {phase === PHASES.BOOKING_CONFIRMED && renderBookingConfirmed()}
                            {phase === PHASES.TRIP_ACTIVE && renderTripActiveLite()}
                            {phase === PHASES.TRIP_COMPLETED && renderTripCompleted()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .font-black { font-weight: 900; }
                .tracking-tighter { letter-spacing: -0.05em; }
            `}} />
        </MobileLayout>
    );
};

function Radar(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 12L7.5 21" />
            <path d="M12 12l4.5 9" />
            <path d="M12 12L2 12" />
            <path d="M12 12l7.5-9" />
            <path d="M12 12l4.5-9" />
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

export default SpareDriverBooking;

