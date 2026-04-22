import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, User, MapPin, Calendar, Clock, Car,
    ChevronRight, Star, Shield, Info, CheckCircle2,
    ShieldCheck, Lock,
    X, Timer, Navigation, Phone, MessageSquare,
    AlertTriangle, Search, CreditCard, Play,
    Loader2, Check, Map, Settings, Zap, ArrowRight,
    ShieldAlert, Plus
} from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
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
    'full': { icon: 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png', color: '#F59E0B', pulse: 'animate-pulse' }, // Brand
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

const createDriverMarkerIcon = (accent = '#F59E0B') => svgToDataUrl(`
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="2" result="offsetblur" />
      <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="white" filter="url(#shadow)" />
  <circle cx="32" cy="32" r="24" fill="${accent}" />
  {/* Steering Wheel Detail */}
  <circle cx="32" cy="32" r="14" fill="none" stroke="white" stroke-width="3" />
  <path d="M32 18v28M18 32h28M22 22l20 20M22 42l20-20" stroke="white" stroke-width="3" stroke-linecap="round" />
  <circle cx="32" cy="32" r="5" fill="white" />
</svg>
`);

const USER_AND_CAR_MARKER = svgToDataUrl(`
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow-u" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="2" result="offsetblur" />
      <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="white" filter="url(#shadow-u)" />
  <circle cx="32" cy="32" r="24" fill="#ef4444" />
  {/* Detailed Car + User Silhouette */}
  <path d="M46 42H18v-4.5c0-1.8 1.4-3.2 3.2-3.2h21.6c1.8 0 3.2 1.4 3.2 3.2V42z" fill="white" />
  <rect x="21" y="42" width="7" height="3" rx="1" fill="white" />
  <rect x="36" y="42" width="7" height="3" rx="1" fill="white" />
  <circle cx="32" cy="24" r="7" fill="white" />
  <path d="M40 33.5c0-2-3.6-3.5-8-3.5s-8 1.5-8 3.5" stroke="white" stroke-width="2.5" stroke-linecap="round" />
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
    const { isDarkMode, toggleTheme } = useTheme();

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
        const urlId = searchParams.get('bookingId');
        if (urlId) return urlId;
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

    // 🎯 NEW: Real-time Fare Estimation
    const [calculatedPricing, setCalculatedPricing] = useState(null);
    const [pricingError, setPricingError] = useState(null);

    // 🚀 NEW: Real-time Tracking Enhancements (Rapido-style)
    const [routePath, setRoutePath] = useState([]);
    const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '', durationValue: 0 });
    const [driverDistance, setDriverDistance] = useState(0);
    const [isSocketConnected, setIsSocketConnected] = useState(true);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const locationQueueRef = useRef([]);
    const routeCalculationTimerRef = useRef(null);

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

    // 🔒 Rapido-Style Navigation Lock - Prevent leaving during driver search
    useEffect(() => {
        const isSearchingPhase = phase === PHASES.FINDING_DRIVER && (!bookingDetails?.status || bookingDetails.status === 'pending');
        
        if (!isSearchingPhase) {
            return;
        }

        // Prevent browser back button during search
        const handlePopState = (event) => {
            event.preventDefault();
            window.history.pushState(null, '', window.location.href);
            toast.error('Please cancel the request or wait for timeout to go back', { 
                icon: '🔒',
                duration: 2000 
            });
        };

        // Prevent page refresh/close during search
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = 'Your driver search is in progress. Are you sure you want to leave?';
            return event.returnValue;
        };

        // Add history entry to prevent back navigation
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [phase, bookingDetails?.status]);

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
                // 🚀 NEW: Connection Status Monitoring
                socket.on('connect', () => {
                    console.log('[SpareDriver] Socket Connected');
                    setIsSocketConnected(true);

                    // Flush queued location updates
                    if (locationQueueRef.current.length > 0) {
                        console.log(`[SpareDriver] Flushing ${locationQueueRef.current.length} queued updates`);
                        locationQueueRef.current.forEach(update => {
                            socket.emit('update_consumer_location', update);
                        });
                        locationQueueRef.current = [];
                    }
                });

                socket.on('disconnect', () => {
                    console.log('[SpareDriver] Socket Disconnected');
                    setIsSocketConnected(false);
                });

                socket.on('connect_error', (error) => {
                    console.error('[SpareDriver] Connection Error:', error);
                    setIsSocketConnected(false);
                });

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
                
                socket.on('route_path_updated', (data) => {
                    if (data.path) {
                        setRoutePath(data.path);
                    }
                });

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
                    socket.off('connect');
                    socket.off('disconnect');
                    socket.off('connect_error');
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
                const locationUpdate = {
                    bookingId: activeBookingId,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                };

                // 🚀 NEW: Offline-aware location broadcasting
                if (isSocketConnected && socket.connected) {
                    socket.emit('update_consumer_location', locationUpdate);
                } else {
                    // Queue for later when connection restored
                    locationQueueRef.current.push(locationUpdate);
                    console.log('[SpareDriver] Location queued (offline)');
                }
            },
            (error) => console.error('Consumer live location pulse failed:', error),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [activeBookingId, phase, isSocketConnected]);

    // 🚀 NEW: Route Polyline & ETA Calculation (Rapido-style)
    useEffect(() => {
        // Only calculate route when driver location is available and we're in active phases
        if (!driverLocation || !userCoords || ![PHASES.BOOKING_CONFIRMED, PHASES.TRIP_ACTIVE].includes(phase)) {
            setRoutePath([]);
            setRouteInfo({ distance: '', duration: '', durationValue: 0 });
            return undefined;
        }

        // Debounce route calculation to avoid excessive API calls
        if (routeCalculationTimerRef.current) {
            clearTimeout(routeCalculationTimerRef.current);
        }

        routeCalculationTimerRef.current = setTimeout(() => {
            if (!window.google?.maps?.DirectionsService) {
                console.warn('[SpareDriver] Google Maps Directions API not loaded');
                return;
            }

            setIsCalculatingRoute(true);
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route({
                origin: driverLocation,
                destination: userCoords,
                travelMode: window.google.maps.TravelMode.DRIVING,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: 'bestguess' // Consider traffic for accurate ETA
                }
            }, (result, status) => {
                setIsCalculatingRoute(false);

                if (status === 'OK' && result.routes[0]) {
                    const route = result.routes[0];
                    const leg = route.legs[0];

                    // Extract polyline path
                    const path = route.overview_path.map(point => ({
                        lat: point.lat(),
                        lng: point.lng()
                    }));

                    setRoutePath(path);

                    // Get ETA with traffic consideration
                    const duration = leg.duration_in_traffic || leg.duration;
                    const durationMinutes = Math.ceil(duration.value / 60);

                    setRouteInfo({
                        distance: leg.distance.text,
                        duration: duration.text,
                        durationValue: durationMinutes
                    });

                    console.log('[SpareDriver] Route calculated:', {
                        distance: leg.distance.text,
                        duration: duration.text,
                        pathPoints: path.length
                    });
                } else {
                    console.error('[SpareDriver] Route calculation failed:', status);
                    // Fallback: Draw straight line
                    setRoutePath([driverLocation, userCoords]);
                }
            });
        }, 2000); // Debounce 2 seconds

        return () => {
            if (routeCalculationTimerRef.current) {
                clearTimeout(routeCalculationTimerRef.current);
            }
        };
    }, [driverLocation, userCoords, phase]);

    // 🚀 NEW: Distance Calculation (using existing function)
    useEffect(() => {
        if (!driverLocation || !userCoords) {
            setDriverDistance(0);
            return;
        }

        const distance = calculateDistanceKm(driverLocation, userCoords);
        setDriverDistance(distance);
    }, [driverLocation, userCoords]);

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
    }, [activeBookingId]);

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
                toast.error('Drivers are busy! Please try again later.', { 
                    icon: '🚗',
                    duration: 4000 
                });
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

        // Check if location is in serviceable zone
        if (userCoords?.lat && userCoords?.lng) {
            try {
                const zoneCheck = await fetch(
                    `/api/zones/check-location?latitude=${userCoords.lat}&longitude=${userCoords.lng}&service=spareDriver`
                );
                const zoneData = await zoneCheck.json();

                if (!zoneData.data?.available) {
                    toast.error(zoneData.data?.reason || 'Service not available in this area');
                    setIsProcessing(false);
                    return;
                }
            } catch (error) {
                console.error('Zone check failed:', error);
                // Continue with booking if zone check fails (graceful degradation)
            }
        }

        setIsProcessing(true);
        try {
            const multiplier = getVehicleMultiplier(selectedVehicle, vehicleTypes);

            // Use locally computed pricing (dynamicPricingBreakdown) — no FareEstimator API needed
            const amount = estimatedTotal;
            const baseFare = dynamicPricingBreakdown.baseAmount || selectedType.basePrice;

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
                    basePrice: baseFare,
                    duration: bookingDetails.duration
                },
                pricing: {
                    baseAmount: baseFare,
                    vehicleMultiplier: multiplier,
                    totalAmount: amount,
                    initialPaidAmount: amount,
                    currency: 'INR',
                    gst: dynamicPricingBreakdown.gstAmount || 0,
                    breakdown: dynamicPricingBreakdown.breakdown || []
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
                            const nextBooking = res.data.booking || res.data;
                            const bId = nextBooking?._id || nextBooking?.bookingId || res.data?.bookingId;
                            
                            if (!bId) throw new Error("Booking response was incomplete. Please check your history.");

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
                theme: { color: "#F59E0B" },
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

    const renderHeader = (title, showBack = true) => {
        const isSearchingPhase = phase === PHASES.FINDING_DRIVER && (!bookingDetails?.status || bookingDetails.status === 'pending');
        
        return (
            <Header
                title={title}
                showBack={showBack && !isSearchingPhase} // Disable back button during search
                onBackClick={() => {
                    if (isSearchingPhase) {
                        toast.error('Please cancel the request or wait for timeout to go back', { 
                            icon: '🔒',
                            duration: 2000 
                        });
                        return;
                    }
                    
                    if (phase === PHASES.BOOKING_DETAILS || phase === PHASES.SERVICE_TYPE) {
                        navigate(-1);
                    } else {
                        setPhase(prev => {
                            return PHASES.BOOKING_DETAILS;
                        });
                    }
                }}
            />
        );
    };

    const renderServiceType = () => (
        <div className={`flex-1 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
            <div className="px-5 py-6 space-y-6 pb-32">
                <div className="grid grid-cols-1 gap-4">
                    {SERVICE_TYPES.map((service) => {
                        const kind = service.kind || normalizeServiceKind(service);
                        const isSelected = selectedType?.id === service.id;

                        return (
                            <motion.button
                                key={service.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setSelectedType(buildSelectedType(service));
                                    setPhase(PHASES.BOOKING_DETAILS);
                                }}
                                className={`relative overflow-hidden rounded-[2rem] border p-5 text-left transition-all duration-500 ${isSelected
                                        ? isDarkMode ? 'bg-[#F59E0B]/10 border-[#F59E0B]/50 shadow-2xl shadow-[#F59E0B]/10' : 'bg-[#0F172A] border-[#0F172A] shadow-xl'
                                        : isDarkMode ? 'bg-white/05 border-white/05 hover:bg-white/[0.08]' : 'bg-white border-black/05 hover:border-black/10 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-[#F59E0B] text-[#0F172A]' : isDarkMode ? 'bg-white/10 text-white/40' : 'bg-black/05 text-black/40'
                                            }`}>
                                            {kind === 'point' ? <Navigation size={24} /> :
                                                kind === 'hourly' ? <Clock size={24} /> :
                                                    kind === 'full' ? <Star size={24} fill="currentColor" /> :
                                                        <MapPin size={24} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-[16px] font-[1000] uppercase tracking-tight leading-none mb-1.5 ${isSelected ? 'text-white' : isDarkMode ? 'text-white' : 'text-[#0F172A]'
                                                }`}>
                                                {service.title}
                                            </h4>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${isSelected ? 'text-white/40' : isDarkMode ? 'text-white/20' : 'text-[#0F172A]/30'
                                                }`}>
                                                {service.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isSelected ? 'text-[#F59E0B]' : isDarkMode ? 'text-white/20' : 'text-[#0F172A]/30'
                                            }`}>Starts from</span>
                                        <p className={`text-[20px] font-black leading-none ${isSelected ? 'text-white' : isDarkMode ? 'text-white' : 'text-[#0F172A]'
                                            }`}>
                                            ₹{service.basePrice}
                                        </p>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <div className={`rounded-[2rem] p-6 border relative overflow-hidden ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20' : 'bg-orange-50 border-[#F59E0B]/20'
                    }`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F59E0B]'}`}>Luxury Protocol</p>
                            <h3 className={`text-xl font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                Verified Elite<br />Chauffeurs
                            </h3>
                        </div>
                        <ShieldCheck size={48} className={`${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F59E0B]'} opacity-20`} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBookingDetails = () => (
        <div className={`flex-1 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
            <div className={`px-5 pt-6 pb-3 border-b sticky top-0 z-[100] backdrop-blur-md transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/05'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPhase(PHASES.SERVICE_TYPE)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/05 border-white/05 text-white' : 'bg-black/05 border-black/05 text-black'
                                }`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <h3 className={`text-[18px] font-black tracking-tighter leading-none uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Booking info</h3>
                            <p className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-1 ${isDarkMode ? 'text-white/20' : 'text-[#0F172A]/30'}`}>STEP 1/3 • PROTOCOL DETAILS</p>
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border shadow-sm transition-all ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20 text-[#F59E0B]' : 'bg-[#F59E0B]/05 border-transparent text-[#F59E0B]'
                            }`}
                    >
                        <Zap size={16} fill="currentColor" />
                    </motion.button>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6 pb-32 overflow-y-auto">
                {/* 1. Mode Selector */}
                <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 border shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                    }`}>
                    {['instant', 'scheduled'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setBookingDetails({ ...bookingDetails, bookingMode: mode })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${bookingMode === mode
                                    ? isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-[#0F172A] text-white shadow-lg'
                                    : isDarkMode ? 'text-white/20 hover:text-white/40' : 'text-black/30 hover:text-black/50'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* 2. Date/Time (Scheduled) */}
                <AnimatePresence>
                    {bookingMode === 'scheduled' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, scale: 0.95 }}
                            animate={{ height: 'auto', opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-2 gap-2 overflow-hidden"
                        >
                            <label className={`rounded-xl p-2 px-3 border flex flex-col gap-0.5 cursor-pointer transition-all ${isDarkMode ? 'bg-white/05 border-white/05 active:bg-white/[0.08]' : 'bg-black/05 border-black/05 active:bg-black/[0.08]'
                                }`}>
                                <span className={`text-[6px] font-black tracking-[0.2em] flex items-center gap-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                    <Calendar size={7} /> Select date
                                </span>
                                <input
                                    type="date"
                                    value={bookingDetails.date}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                                    className={`bg-transparent border-none p-0 outline-none text-[10px] font-bold w-full mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}
                                />
                            </label>
                            <label className={`rounded-xl p-2 px-3 border flex flex-col gap-0.5 cursor-pointer transition-all ${isDarkMode ? 'bg-white/05 border-white/05 active:bg-white/[0.08]' : 'bg-black/05 border-black/05 active:bg-black/[0.08]'
                                }`}>
                                <span className={`text-[6px] font-black tracking-[0.2em] flex items-center gap-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                    <Clock size={7} /> Select time
                                </span>
                                <input
                                    type="time"
                                    value={bookingDetails.time}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })}
                                    className={`bg-transparent border-none p-0 outline-none text-[10px] font-bold w-full mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}
                                />
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Address Picker */}
                <div className="relative">
                    <div className={`absolute left-[23px] top-[30px] bottom-[30px] w-[1px] border-r border-dashed ${isDarkMode ? 'bg-white/05 border-white/10' : 'bg-black/05 border-black/10'}`} />
                    <div className="space-y-2">
                        <div
                            onClick={() => navigate('/addresses?from=spare-driver')}
                            className={`rounded-2xl p-2.5 pl-4 flex items-center gap-3 border active:scale-[0.98] transition-all cursor-pointer ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                                }`}
                        >
                            <div className="w-6 h-6 rounded-full bg-[#0F172A] flex items-center justify-center text-white ring-4 ring-[#0F172A]/05">
                                <MapPin size={10} strokeWidth={3} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className={`text-[6px] font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Pickup</span>
                                <p className={`text-[11px] font-black truncate leading-none mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {selectedAddress?.street || addresses?.find(a => a.isPrimary)?.street || addresses?.[0]?.street || 'Current location'}
                                </p>
                            </div>
                            <ChevronRight size={10} className={`${isDarkMode ? 'text-white/20' : 'text-black/10'} mr-1`} />
                        </div>

                        {requiresDestination && (
                            <div
                                onClick={() => navigate('/addresses?from=spare-driver&type=destination')}
                                className={`rounded-2xl p-2.5 pl-4 flex items-center gap-3 border active:scale-[0.98] transition-all cursor-pointer ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                                    }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0F172A] ring-4 ring-[#F59E0B]/05">
                                    <Navigation size={10} strokeWidth={3} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className={`text-[6px] font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Destination</span>
                                    <p className={`text-[11px] font-black truncate leading-none mt-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {destination?.street || 'Select destination'}
                                    </p>
                                </div>
                                <ChevronRight size={10} className={`${isDarkMode ? 'text-white/20' : 'text-black/10'} mr-1`} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Duration Selector */}
                {durationOptions.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <span className={`text-[7px] font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Select duration</span>
                            <span className="text-[6px] font-bold text-[#F59E0B] tracking-widest">Base charge only</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {durationOptions.map((d) => (
                                <motion.button
                                    key={d}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setBookingDetails({ ...bookingDetails, duration: d })}
                                    className={`flex-shrink-0 px-5 h-10 rounded-xl text-[9px] font-black transition-all duration-300 border ${bookingDetails.duration === d
                                        ? isDarkMode ? 'bg-white/10 text-white border-white/20 shadow-xl' : 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg'
                                        : isDarkMode ? 'bg-white/05 text-white/40 border-white/05 hover:border-white/10' : 'bg-black/05 text-black/30 border-black/05 hover:border-black/10'}`}
                                >
                                    {d}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Split Policy Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl p-3.5 border space-y-1 group transition-colors ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                        }`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                <CreditCard size={10} />
                            </div>
                            <span className={`text-[6px] font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Wallet limit</span>
                        </div>
                        <p className={`text-[14px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(commercialRules.minimumWalletBalance)}</p>
                        <p className={`text-[6px] font-bold ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Entry threshold</p>
                    </div>

                    <div className={`rounded-2xl p-3.5 border space-y-1 group transition-colors ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                        }`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-orange-50 text-orange-600'}`}>
                                <Timer size={10} />
                            </div>
                            <span className={`text-[6px] font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Waiting</span>
                        </div>
                        <p className={`text-[14px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(commercialRules.waitChargePerMinute)}/m</p>
                        <p className={`text-[6px] font-bold ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Post {commercialRules.waitingGraceMinutes}m grace</p>
                    </div>
                </div>

                {/* 6. Night Protocol Banner */}
                <div className={`rounded-[1.2rem] p-3.5 shadow-2xl relative overflow-hidden transition-all duration-300 border ${isDarkMode ? 'bg-white/10 border-white/10 shadow-black/40' : 'bg-[#0F172A] text-white border-transparent'
                    }`}>
                    <div className="relative z-10 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[#F59E0B] ${isDarkMode ? 'bg-white/10 border border-white/05' : 'bg-white/10 border border-white/10'}`}>
                            <Clock size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className={`text-[12px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-white'}`}>Night allowance</h4>
                                <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-white/05'}`} />
                                <span className="text-[11px] font-black text-[#F59E0B]">+{formatInr(commercialRules.nightAllowance)}</span>
                            </div>
                            <p className={`text-[6px] font-bold tracking-widest mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-white/40'}`}>Active between 10:00 PM - 06:00 AM slots</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. Bottom Bar */}
            <div className={`fixed bottom-[76px] left-0 right-0 z-[1100] px-5 py-4 backdrop-blur-lg border-t safe-area-bottom transition-all ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/05' : 'bg-white/90 border-black/05'
                }`}>
                <div className="max-w-[430px] mx-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className={`text-[7px] font-black tracking-widest mb-0.5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Est. total</span>
                        <p className={`text-[20px] font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <span className="text-[#F59E0B] text-[12px] mr-1">₹</span>{estimatedTotal}
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                            if (selectedVehicle) {
                                setPhase(PHASES.CHECKOUT);
                            } else {
                                setPhase(PHASES.CONFIRM_VEHICLE);
                            }
                        }}
                        className="h-12 px-8 bg-[#F59E0B] rounded-xl flex items-center gap-3 shadow-lg active:shadow-none transition-all group/btn"
                    >
                        <span className="text-[11px] font-black text-[#0F172A] tracking-wider uppercase">Continue</span>
                        <ArrowRight size={14} className="text-[#0F172A]" strokeWidth={4} />
                    </motion.button>
                </div>
            </div>
        </div>
    );

    const renderConfirmVehicle = () => (
        <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
            <div className={`px-5 pt-6 pb-3 border-b transition-all ${isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/05'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-[18px] font-black tracking-tighter leading-none uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Garage Select</h3>
                        <p className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-1 ${isDarkMode ? 'text-white/20' : 'text-[#0F172A]/30'}`}>STEP 2/3 • VEHICLE MATCH</p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-4">
                <div className={`rounded-xl p-4 border space-y-3 ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'}`}>
                    <label className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                        <Car size={10} className="text-[#F59E0B]" />
                        MY VEHICLES
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                        {vehicles?.map((v) => {
                            const isSelected = (selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id);
                            return (
                                <button
                                    key={v._id || v.id}
                                    onClick={() => setSelectedVehicle(v)}
                                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${isSelected
                                            ? isDarkMode ? 'bg-white/10 border-[#F59E0B]/50 shadow-lg' : 'bg-[#0F172A] border-[#0F172A]'
                                            : isDarkMode ? 'bg-white/05 border-white/05 hover:border-white/10' : 'bg-white border-black/05 hover:border-black/10'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg overflow-hidden border ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-black/05 border-black/05'}`}>
                                        <img src={v.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-[12px] font-bold leading-none uppercase ${isSelected ? 'text-white' : isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{v.brand}</h4>
                                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-[#F59E0B]' : isDarkMode ? 'text-white/20' : 'text-black/20'}`}>{v.plate}</p>
                                    </div>
                                    {isSelected && (
                                        <Check size={14} strokeWidth={4} className="text-[#F59E0B]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`rounded-xl p-5 shadow-lg relative overflow-hidden border ${isDarkMode ? 'bg-white/10 border-white/10 shadow-black/40 text-white' : 'bg-[#0F172A] text-white border-transparent'
                    }`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-1 leading-none opacity-40">Trip Fee</p>
                            <p className="text-2xl font-black tracking-tighter leading-none">
                                <span className="text-[#F59E0B] mr-1">₹</span>{estimatedTotal}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                                <ShieldCheck size={12} className="text-[#F59E0B]" />
                                <span className="text-[9px] font-bold uppercase tracking-tight opacity-60">Verified Profile</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Sticky Footer */}
            <div className={`fixed bottom-[76px] left-0 right-0 z-[1100] px-5 py-4 backdrop-blur-lg border-t safe-area-bottom transition-all ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/05' : 'bg-white/90 border-black/05'
                }`}>
                <div className="max-w-[430px] mx-auto flex items-center gap-4 bg-[#0F172A] p-4 rounded-xl shadow-2xl shadow-black/50">
                    <div className="flex-shrink-0">
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">Estimated Total</p>
                        <p className="text-[18px] font-bold text-[#F59E0B] tracking-tight leading-none">₹{estimatedTotal}</p>
                    </div>
                    <button
                        onClick={() => setPhase(PHASES.CHECKOUT)}
                        disabled={!selectedVehicle}
                        className="flex-1 h-12 bg-white/10 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-20"
                    >
                        Review
                        <ChevronRight size={14} strokeWidth={3} className="text-[#F59E0B]" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderFindingDriver = () => {
        const driverAssigned = ['en_route', 'arrived'].includes(bookingDetails?.status);
        // 🏎️ Nearby simulated pulse markers
        const nearbyDrivers = [
            { id: 1, lat: userCoords.lat + 0.003, lng: userCoords.lng + 0.002, rot: 45 },
            { id: 2, lat: userCoords.lat - 0.002, lng: userCoords.lng + 0.004, rot: 120 },
            { id: 3, lat: userCoords.lat + 0.004, lng: userCoords.lng - 0.003, rot: 280 },
            { id: 4, lat: userCoords.lat - 0.004, lng: userCoords.lng - 0.002, rot: 15 },
        ];

        return (
            <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
                {/* 🗺️ Live Metadata Integration */}
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
                                }
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                position: animatedDriverLocation,
                                icon: {
                                    url: SERVICE_ASSETS[selectedServiceKind]?.icon || SERVICE_ASSETS.point.icon,
                                    scaledSize: { width: 34, height: 34 },
                                    anchor: { x: 17, y: 17 }
                                }
                            }] : nearbyDrivers.map(d => ({
                                position: { lat: d.lat, lng: d.lng },
                                icon: {
                                    url: SERVICE_ASSETS[selectedServiceKind]?.icon || SERVICE_ASSETS.point.icon,
                                    scaledSize: { width: 28, height: 28 },
                                    anchor: { x: 14, y: 14 }
                                }
                            })))
                        ]}
                        circles={[
                            {
                                center: userCoords,
                                radius: driverAssigned ? 90 : 160,
                                options: {
                                    strokeColor: '#F59E0B',
                                    strokeOpacity: 0.3,
                                    strokeWeight: 1,
                                    fillColor: '#F59E0B',
                                    fillOpacity: driverAssigned ? 0.08 : 0.12
                                }
                            }
                        ]}
                        darkMode={isDarkMode}
                    />
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-6 pb-12">
                    <div className="w-full flex items-center justify-between pt-4">
                        <button onClick={handleCancelRequest} className={`w-10 h-10 backdrop-blur-xl rounded-full flex items-center justify-center pointer-events-auto active:scale-90 shadow-lg ${isDarkMode ? 'bg-black/40 text-white border border-white/10' : 'bg-white/80 text-black border border-black/05'
                            }`}>
                            <X size={20} />
                        </button>
                        <div className={`px-4 py-2 backdrop-blur-xl border rounded-full flex items-center gap-2 shadow-lg ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-black/05'
                            }`}>
                            <div className="w-2 h-2 rounded-full animate-ping bg-[#F59E0B]" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {driverAssigned ? `${driverInfo?.name || 'Chauffeur'} matched` : `Scanning local network`}
                            </span>
                        </div>
                        <div className="w-10" />
                    </div>

                    <div className="text-center space-y-6">
                        <div className="relative inline-block">
                            <div className="absolute -inset-12 bg-[#F59E0B]/10 rounded-full animate-ping opacity-20" />
                            <div className={`relative w-32 h-32 backdrop-blur-2xl border rounded-full flex items-center justify-center shadow-2xl transition-all ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-black/10'
                                }`}>
                                {driverAssigned ? (
                                    <div className="flex flex-col items-center">
                                        <Navigation className="w-10 h-10 text-[#F59E0B] mb-2 animate-bounce" />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/30'}`}>
                                            {bookingDetails?.status === 'arrived' ? 'Matched' : 'Incoming'}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-4xl font-[1000] tabular-nums leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{lookingTime}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>SECONDS</span>
                                        </div>
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle cx="64" cy="64" r="60" fill="none" className="stroke-black/5" strokeWidth="4" />
                                            <motion.circle
                                                cx="64" cy="64" r="60" fill="none" stroke="#F59E0B" strokeWidth="4"
                                                strokeDasharray="377"
                                                animate={{ strokeDashoffset: 377 - (377 * (180 - lookingTime)) / 180 }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full mb-4 border transition-all ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20 text-[#F59E0B]' : 'bg-orange-50 border-[#F59E0B]/20 text-orange-600'
                                }`}>
                                <Radar className={`w-4 h-4 ${driverAssigned ? '' : 'animate-spin'}`} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                    {driverAssigned
                                        ? (bookingDetails?.status === 'arrived' ? 'Chauffeur at Pickup' : 'Establishing Secure Line')
                                        : (lookingTime > 120 ? 'Level 1: Local Grid (2.0km)' : 'Level 2: Network Expansion')}
                                </span>
                            </div>
                            <h3 className={`text-3xl font-[1000] uppercase tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {driverAssigned ? <>System<br />matched</> : <>Scanning for<br />chauffeurs</>}
                            </h3>
                            <p className={`text-[11px] font-bold uppercase tracking-widest leading-relaxed mt-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                {driverAssigned
                                    ? (bookingDetails?.status === 'arrived'
                                        ? 'Your elite chauffeur has arrived at the location.'
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

    const handleIncreaseTip = async (amount) => {
        if (!activeBookingId) return;
        try {
            setIsProcessing(true);
            const res = await bookingAPI.patch(`/bookings/${activeBookingId}/pricing`, { tipAmount: (bookingDetails?.pricing?.tipAmount || 0) + amount });
            if (res.status === 'success') {
                syncBookingSnapshot(res.data.booking);
                toast.success(`Fare increased by ${formatInr(amount)} to attract drivers!`, { icon: '💰' });
            }
        } catch (err) {
            console.error('Failed to increase tip:', err);
            toast.error(err.message || 'Could not update fare');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderFindingDriverLite = () => {
        const driverAssigned = ['en_route', 'arrived'].includes(bookingDetails?.status);
        const serviceAccent = SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color;
        const searchProgress = driverAssigned ? 1 : Math.min(1, (LOOKUP_WINDOW_SECONDS - lookingTime) / LOOKUP_WINDOW_SECONDS);
        
        const searchPhaseLabel = driverAssigned 
            ? (bookingDetails?.status === 'arrived' ? 'READY AT PICKUP' : 'CAPTAIN DISPATCHED')
            : (lookingTime > 150 ? 'Scanning Local Grid' : 
               lookingTime > 120 ? 'Connecting Telemetry' : 
               lookingTime > 90 ? 'Expanding Perimeter' : 
               lookingTime > 60 ? 'Analyzing Terminal Routes' : 
               lookingTime > 30 ? 'Near Final Match' : 'Establishing Secure Link');
        // nearby phantom drivers for visual scale
        const nearbyDrivers = [
            { id: 1, lat: userCoords.lat + 0.002, lng: userCoords.lng + 0.001 },
            { id: 2, lat: userCoords.lat - 0.0015, lng: userCoords.lng + 0.0025 },
        ];

        const liveSearchPolyline = driverAssigned && animatedDriverLocation
            ? [{
                path: [animatedDriverLocation, userCoords],
                options: { strokeColor: serviceAccent, strokeOpacity: 0.95, strokeWeight: 4, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, scale: 3 }, offset: '0', repeat: '12px' }] }
            }] : [];

        return (
            <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
                {/* 1. Full Screen Map with Glass Overlay */}
                <div className="relative flex-1 min-h-[300px] overflow-hidden">
                    <GoogleMapBox
                        center={userCoords}
                        zoom={15}
                        containerStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                        markers={[
                            {
                                position: userCoords,
                                icon: { url: USER_AND_CAR_MARKER, scaledSize: { width: 44, height: 50 }, anchor: { x: 22, y: 44 } }
                            },
                            ...(driverAssigned && animatedDriverLocation ? [{
                                position: animatedDriverLocation,
                                icon: { url: createDriverMarkerIcon(serviceAccent), scaledSize: { width: 40, height: 48 }, anchor: { x: 20, y: 40 } }
                            }] : nearbyDrivers.map((driver) => ({
                                position: { lat: driver.lat, lng: driver.lng },
                                icon: { url: createDriverMarkerIcon(serviceAccent), scaledSize: { width: 32, height: 40 }, anchor: { x: 16, y: 32 } }
                            })))
                        ]}
                        circles={[
                            { center: userCoords, radius: 150, options: { strokeColor: serviceAccent, strokeOpacity: 0.1, strokeWeight: 1, fillColor: serviceAccent, fillOpacity: 0.05 } }
                        ]}
                        polylines={liveSearchPolyline}
                        darkMode={isDarkMode}
                    />

                    {/* Map Header Overlay */}
                    <div className="absolute top-10 inset-x-4 z-50 flex items-center justify-between">
                        <button onClick={handleCancelRequest} className={`w-10 h-10 backdrop-blur-xl rounded-full shadow-lg flex items-center justify-center transition-all border ${isDarkMode ? 'bg-black/60 border-white/10 text-white' : 'bg-white/90 border-black/05 text-black'
                            }`}>
                            <X size={20} />
                        </button>
                        <div className={`backdrop-blur-xl px-5 py-2 rounded-full shadow-lg border flex items-center gap-2 ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-white/90 border-black/05'
                            }`}>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className={`text-[10px] font-black tracking-widest ${isDarkMode ? 'text-white/80' : 'text-black/60'}`}>SCANNING FOR CHAUFFEUR</span>
                        </div>
                        <button onClick={handleSOSNavigation} className="w-10 h-10 bg-black rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 border border-white/10">
                            <ShieldAlert size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Bottom Information Deck */}
                <div className={`h-auto rounded-t-[2.5rem] shadow-2xl relative z-10 -mt-8 flex flex-col overflow-hidden border-t transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D] border-white/05 shadow-black/80' : 'bg-white border-black/05 shadow-black/10'
                    }`}>
                    <div className={`w-12 h-1 rounded-full mx-auto mt-3 mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-black/05'}`} />

                    <div className="px-6 pb-2">
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className={`text-[22px] font-[1000] tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                    {driverAssigned ? 'Captain Linked' : 'Searching Grid'}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`w-2 h-2 rounded-full ${driverAssigned ? 'bg-emerald-500' : 'bg-[#F59E0B] animate-pulse'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>{searchPhaseLabel}</span>
                                </div>
                                {/* Broadcast Countdown Timer - Rapido Style */}
                                {!driverAssigned && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <Timer size={12} className="text-[#F59E0B]" />
                                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                            Broadcasting for {Math.floor(lookingTime / 60)}:{(lookingTime % 60).toString().padStart(2, '0')} mins
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className={`border rounded-2xl px-5 py-3 text-right ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-orange-50 border-[#F59E0B]/20'}`}>
                                <span className="text-[7px] font-black text-[#F59E0B] tracking-widest block mb-0.5 uppercase">Est. Amount</span>
                                <span className={`text-xl font-[1000] leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{formatInr(estimatedTotal + (bookingDetails?.pricing?.tipAmount || 0))}</span>
                            </div>
                        </div>

                        {/* Search Progress - Fast Pass */}
                        {!driverAssigned && (
                            <div className={`mb-6 p-5 rounded-[2rem] border relative overflow-hidden group ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/[0.03] border-black/05'
                                }`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Priority Dispatch</span>
                                        <div className="bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                                            <span className="text-[9px] font-black text-[#F59E0B]">EXPRESS MATCHING</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[20, 50, 100].map(tip => (
                                            <button
                                                key={tip}
                                                onClick={() => handleIncreaseTip(tip)}
                                                className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border ${isDarkMode ? 'bg-white/05 border-white/05 text-white hover:border-[#F59E0B]/40' : 'bg-white border-black/05 text-black hover:border-orange-200'
                                                    }`}
                                            >
                                                <span className="text-[14px] font-black">+{tip}</span>
                                                <Plus size={14} className="text-[#F59E0B]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className={`rounded-2xl p-4 border flex items-center gap-4 ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
                                    <MapPin size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className={`text-[7px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Pickup</span>
                                    <p className={`text-[11px] font-black truncate leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedAddress?.label || 'Pickup Terminal'}</p>
                                </div>
                            </div>
                            <div className={`rounded-2xl p-4 border flex items-center gap-4 ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-orange-50 text-[#F59E0B]'}`}>
                                    <Zap size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className={`text-[7px] font-black uppercase tracking-widest block mb-0.5 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Service</span>
                                    <p className={`text-[11px] font-black truncate leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedType?.title}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security OTP */}
                        {driverAssigned && (
                            <div className="bg-black rounded-[2rem] p-6 mb-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
                                <div className="absolute right-0 top-0 h-full w-[40%] bg-gradient-to-l from-orange-500/10 to-transparent" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest">Security ID</span>
                                        <h4 className="text-xl font-black tracking-tight mt-1">Pickup Pass</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        {visibleSecurityPin.split('').map((char, i) => (
                                            <div key={i} className="w-11 h-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-2xl font-black text-[#F59E0B] shadow-inner shadow-black/40">
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Area */}
                    <div className={`p-5 pb-10 border-t transition-colors ${isDarkMode ? 'bg-[#0A0F0D] border-white/05' : 'bg-[#FFFDF5] border-black/05'}`}>
                        <div className="flex gap-4">
                            <button
                                onClick={handleSOSNavigation}
                                className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-900/20 active:scale-95"
                            >
                                <AlertTriangle size={28} />
                            </button>
                            <button
                                onClick={driverAssigned ? () => navigate(`/spare-driver/support?bookingId=${activeBookingId}`) : handleCancelRequest}
                                className={`flex-1 h-16 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isDarkMode ? 'bg-white text-black shadow-black/80' : 'bg-[#0F172A] text-white shadow-black/30'
                                    }`}
                            >
                                {driverAssigned ? (
                                    <>Mission Support <ChevronRight size={18} className="text-[#F59E0B]" /></>
                                ) : (
                                    <>Cancel Probe <X size={18} className="text-red-500" /></>
                                )}
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
            <div className={`flex-1 flex flex-col p-6 space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
                <div className="flex flex-col items-center text-center py-6">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-all ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
                            }`}
                    >
                        <Calendar size={32} strokeWidth={2.5} />
                    </motion.div>
                    <h2 className={`text-2xl font-[1000] uppercase tracking-tight leading-none mb-3 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Booking scheduled</h2>
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl border transition-all ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">{bookingDetails.date} @ {bookingDetails.time}</span>
                    </div>
                </div>

                <div className={`rounded-[2rem] border p-6 shadow-2xl relative overflow-hidden transition-all ${isDarkMode ? 'bg-white/05 border-white/05 shadow-black/60' : 'bg-white border-black/05 shadow-black/10'
                    }`}>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-orange-500/10' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                            }`}>
                            <User size={28} />
                        </div>
                        <div>
                            <h4 className={`text-[16px] font-black uppercase tracking-tight leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Elite chauffeur</h4>
                            <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 leading-none ${isDarkMode ? 'text-white/40' : 'text-black/30'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" /> Final match incoming
                            </p>
                        </div>
                    </div>

                    <div className={`mt-8 pt-6 border-t grid grid-cols-2 gap-4 ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                        <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'}`}>
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-2 block ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Car assigned</span>
                            <div className="flex items-center gap-2">
                                <Car size={12} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                                <span className={`text-[11px] font-black uppercase leading-none truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedVehicle?.brand}</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'}`}>
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-2 block ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Est. fare</span>
                            <div className="flex items-center gap-2">
                                <CreditCard size={12} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                                <span className={`text-[11px] font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(bookingDetails?.pricing?.totalAmount || estimatedTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`rounded-[2rem] p-5 space-y-3 transition-colors ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                    }`}>
                    <p className={`text-[8px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Dispatch window</p>
                    <div className="flex items-center justify-between gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-blue-900/50'}`}>matching begins at</span>
                        <span className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                            {matchingWindow.toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <button
                        onClick={() => navigate(activeBookingId ? `/spare-driver/history?bookingId=${activeBookingId}` : '/spare-driver/history')}
                        className={`w-full h-16 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isDarkMode ? 'bg-white text-black shadow-black/80' : 'bg-black text-white shadow-black/30'
                            }`}
                    >
                        View in history
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    };

    const renderTripActive = () => (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
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
                                    scaledSize: { width: 24, height: 24 },
                                    anchor: { x: 12, y: 12 }
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
                                    <div className={`p-1 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        <p className="text-[8px] font-black uppercase text-[#F59E0B] tracking-widest">Your Captain</p>
                                        <p className="text-[10px] font-black leading-none mt-1">{driverInfo?.name || 'En Route'}</p>
                                    </div>
                                )
                            }] : [])
                        ]}
                        circles={[
                            {
                                center: userCoords,
                                radius: 85,
                                options: {
                                    strokeColor: '#F59E0B',
                                    strokeOpacity: 0.35,
                                    strokeWeight: 1,
                                    fillColor: '#F59E0B',
                                    fillOpacity: 0.08
                                }
                            }
                        ]}
                        polylines={routePath.length > 1 ? [{
                            path: routePath,
                            options: {
                                strokeColor: '#F59E0B',
                                strokeOpacity: 0.9,
                                strokeWeight: 5,
                                geodesic: true
                            }
                        }] : []}
                        darkMode={isDarkMode}
                    />
                </div>

                <div className="absolute top-10 left-4 right-4 z-20">
                    {/* Connection Status */}
                    {!isSocketConnected && (
                        <div className="mb-2 rounded-xl bg-red-500/95 backdrop-blur-xl border border-red-600/20 px-3 py-2 shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Reconnecting...</span>
                        </div>
                    )}

                    <div className={`backdrop-blur-2xl border rounded-[1.6rem] p-3.5 shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-black/60 border-white/10 shadow-black/40' : 'bg-white/80 border-black/05 shadow-black/10'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                                    <Navigation size={20} className={animatedDriverLocation ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <h4 className={`text-[12px] font-black uppercase tracking-tight leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Live telemetry</h4>
                                    <p className={`text-[8px] font-bold uppercase tracking-[0.2em] leading-none ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                        {driverLocation ? 'Mission in progress' : 'Establishing GPS pulse...'}
                                    </p>

                                    {driverLocation && driverDistance > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-black text-blue-500">
                                                {driverDistance < 1
                                                    ? `${Math.round(driverDistance * 1000)}m away`
                                                    : `${driverDistance.toFixed(1)}km away`}
                                            </span>
                                            {routeInfo.durationValue > 0 && (
                                                <>
                                                    <span className={`text-[9px] ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>•</span>
                                                    <span className="text-[10px] font-black text-emerald-500">
                                                        {routeInfo.durationValue} min arrival
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-orange-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {bookingDetails?.status === 'arrived' ? 'Arrived' : 'En Route'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-t-[2.75rem] p-6 space-y-6 shadow-2xl relative z-30 pb-10 border-t transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D] border-white/05 shadow-black/80' : 'bg-white border-black/05 shadow-black/10'
                }`}>
                <div className={`w-12 h-1 rounded-full mx-auto mb-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/05'}`} />

                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-[8px] font-black uppercase tracking-[0.25em] mb-2 leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Session duration</p>
                        <h4 className={`text-3xl font-[1000] tracking-tighter leading-none tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatTime(elapsedTime)}</h4>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[#F59E0B] font-black text-[9px] uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                            Live session
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-[1.75rem] flex items-center justify-between border transition-all ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-black/05'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-black/05'}`}>
                            <img src={driverInfo?.img} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className={`text-[13px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{driverInfo?.name}</p>
                                {driverInfo?.isPremium && (
                                    <div className="bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#F59E0B]/20">
                                        <ShieldCheck size={8} fill="currentColor" />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Elite</span>
                                    </div>
                                )}
                            </div>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                {driverInfo?.isPremium ? 'Hoora Master Chauffeur' : 'Verified Professional'}
                            </p>
                        </div>
                    </div>
                    {bookingDetails?.status === 'arrived' ? (
                        <div className="bg-brand/10 border border-brand/20 px-4 py-3 rounded-[1.5rem] text-center min-w-[118px] shadow-[0_12px_24px_rgba(242,159,5,0.12)]">
                            <p className="text-[7px] font-black text-brand uppercase tracking-widest mb-0.5">Start PIN</p>
                            <p className="text-lg font-[1000] text-white tracking-[0.35em] pl-1">{visibleSecurityPin}</p>
                            <p className="text-[7px] font-bold text-black/35 uppercase tracking-[0.15em] mt-1">share after arrival</p>
                        </div>
                    ) : (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white leading-none">{formatInr(bookingDetails?.pricing?.totalAmount)}</p>
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
                                <span className="text-[9px] font-bold text-white/40 uppercase">Waiting fee</span>
                                <span className="text-[9px] font-black text-white">Applied</span>
                            </div>
                        )}
                        {bookingDetails.notes?.internal?.includes('[ARREARS]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Trip extension</span>
                                <span className="text-[9px] font-black text-white">Active</span>
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
                        className="w-full bg-white/[0.02] text-white h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] border border-black/[0.03] shadow-[0_12px_24px_rgba(15,23,42,0.05)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
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
        <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
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
                            infoContent: <div className={`p-1 font-black text-[9px] uppercase tracking-widest ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F97316]'}`}>You + Vehicle</div>
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
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F97316]'}`}>Your {driverInfo?.isPremium ? 'Elite' : 'Verified'} Chauffeur</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <p className={`text-[10px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{driverInfo?.name || 'En Route'}</p>
                                        {driverInfo?.isPremium && <ShieldCheck size={10} className="text-[#F59E0B]" />}
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
                    polylines={routePath.length > 1 ? [{
                        path: routePath,
                        options: {
                            strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                            strokeOpacity: 0.95,
                            strokeWeight: 5,
                            geodesic: true,
                            icons: [{
                                icon: {
                                    path: 'M 0,-1 0,1',
                                    strokeOpacity: 0.7,
                                    scale: 3
                                },
                                offset: '0',
                                repeat: '15px'
                            }]
                        }
                    }] : (animatedDriverLocation ? [{
                        path: [animatedDriverLocation, userCoords],
                        options: {
                            strokeColor: SERVICE_ASSETS[selectedServiceKind]?.color || SERVICE_ASSETS.point.color,
                            strokeOpacity: 0.7,
                            strokeWeight: 4,
                            geodesic: true
                        }
                    }] : [])}
                    darkMode={isDarkMode}
                />

                <div className={`absolute inset-x-0 top-0 h-28 pointer-events-none ${isDarkMode ? 'bg-gradient-to-b from-black/60 via-black/20 to-transparent' : 'bg-gradient-to-b from-white/90 via-white/40 to-transparent'
                    }`} />
                <div className={`absolute inset-x-0 bottom-0 h-20 pointer-events-none ${isDarkMode ? 'bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D]/45 to-transparent' : 'bg-gradient-to-t from-[#f7f6f1] via-[#f7f6f1]/45 to-transparent'
                    }`} />

                <div className="absolute top-4 left-4 right-4 z-20">
                    {!isSocketConnected && (
                        <div className="mb-2 rounded-xl bg-red-500/95 backdrop-blur-xl border border-red-600/20 px-3 py-2 shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Reconnecting...</span>
                        </div>
                    )}

                    <div className={`rounded-[1.4rem] backdrop-blur-xl border px-4 py-3 shadow-2xl transition-all ${isDarkMode ? 'bg-black/60 border-white/10 shadow-black/80' : 'bg-white/92 border-black/05 shadow-black/10'
                        }`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20' : 'bg-[#FFF7ED] border-[#FED7AA]'
                                    }`}>
                                    <Navigation size={18} className={`text-[#F59E0B] ${animatedDriverLocation ? 'animate-pulse' : ''}`} />
                                </div>
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.24em] leading-none ${isDarkMode ? 'text-white/30' : 'text-black/25'}`}>Live Trip</p>
                                    <p className={`text-[11px] font-[1000] uppercase tracking-[0.08em] leading-none mt-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                        {driverLocation ? 'Mission active' : 'Syncing GPS pulse'}
                                    </p>
                                    {driverLocation && driverDistance > 0 && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[9px] font-bold text-blue-500">
                                                {driverDistance < 1
                                                    ? `${Math.round(driverDistance * 1000)}m away`
                                                    : `${driverDistance.toFixed(1)}km away`}
                                            </span>
                                            {routeInfo.durationValue > 0 && (
                                                <>
                                                    <span className={`text-[9px] ${isDarkMode ? 'text-white/20' : 'text-black/10'}`}>•</span>
                                                    <span className="text-[9px] font-bold text-emerald-500">
                                                        {routeInfo.durationValue} min arrival
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`rounded-full border px-3 py-2 transition-all ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20' : 'bg-orange-50 border-[#F59E0B]/20'
                                }`}>
                                <span className="text-[8px] font-black text-[#F97316] uppercase tracking-[0.24em]">
                                    {bookingDetails?.status === 'arrived' ? 'Arrived' : 'En Route'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`relative z-30 -mt-3 flex-1 rounded-t-[2.1rem] border-t shadow-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D] border-white/05 shadow-black/80' : 'bg-white border-black/04 shadow-black/10'
                }`}>
                <div className={`mx-auto mb-3 h-1.5 w-16 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/08'}`} />

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className={`text-[8px] font-black uppercase tracking-[0.28em] leading-none ${isDarkMode ? 'text-white/20' : 'text-black/25'}`}>Session duration</p>
                        <h4 className={`text-[2rem] font-[1000] tracking-tight leading-none tabular-nums ${isDarkMode ? 'text-white' : 'text-[#101828]'}`}>{formatTime(elapsedTime)}</h4>
                    </div>
                    <div className={`rounded-2xl border px-3 py-2 text-right min-w-[110px] ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-orange-50 border-[#F59E0B]/20'
                        }`}>
                        <p className="text-[8px] font-black text-[#F97316] uppercase tracking-[0.24em] leading-none">Trip status</p>
                        <p className={`text-[11px] font-[1000] uppercase tracking-[0.16em] leading-none mt-2 ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>Live Session</p>
                    </div>
                </div>

                <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/05' : 'bg-black/06'}`}>
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#F97316] via-[#F29F05] to-[#FACC15]"
                        animate={{ width: ['18%', '74%', '46%', '85%'] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <div className={`mt-3 rounded-[1.7rem] border p-4 shadow-xl transition-all ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-white border-black/05'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl overflow-hidden border ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-black/05 border-black/05'}`}>
                                <img src={driverInfo?.img} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className={`text-[11px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{driverInfo?.name}</p>
                                    {driverInfo?.isPremium && (
                                        <div className="bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-[#F59E0B]/20">
                                            <ShieldCheck size={8} fill="currentColor" />
                                            <span className="text-[6px] font-black uppercase tracking-tighter">Elite</span>
                                        </div>
                                    )}
                                </div>
                                <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                    {driverInfo?.isPremium ? 'Hoora Master Chauffeur' : 'Verified Professional'}
                                </p>
                            </div>
                        </div>
                        {bookingDetails?.status === 'arrived' ? (
                            <div className="rounded-[1.2rem] bg-[#111827] text-white px-4 py-3 text-center min-w-[122px] shadow-xl border border-white/10">
                                <p className="text-[7px] font-black text-[#F59E0B] uppercase tracking-widest mb-1">Start Pin</p>
                                <p className="text-lg font-[1000] tracking-[0.35em] pl-1">{visibleSecurityPin}</p>
                            </div>
                        ) : (
                            <div className="text-right">
                                <p className={`text-[11px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(bookingDetails?.pricing?.totalAmount)}</p>
                                <p className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/20' : 'text-black/25'}`}>Total fare</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🏷️ Phase 11: Real-time Surcharge Pulse 🏷️ */}
                {(bookingDetails?.pricing?.totalAmount > (selectedType?.basePrice || 0)) && (
                    <div className={`mt-3 px-4 py-3 border rounded-[1.4rem] space-y-1.5 transition-all anim-pulse-subtle ${isDarkMode ? 'bg-[#F59E0B]/05 border-orange-500/10' : 'bg-[#FFF7ED] border-[#FED7AA]'
                        }`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-60 ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F97316]'}`}>Surcharges applied</p>
                        {bookingDetails.notes?.internal?.includes('[WAITING]') && (
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Waiting Fee</span>
                                <span className={`text-[9px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Applied</span>
                            </div>
                        )}
                        {bookingDetails.notes?.internal?.includes('[ARREARS]') && (
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Trip Extension</span>
                                <span className={`text-[9px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Active</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🛡️ Outstation Safety & Allowance Context 🛡️ */}
                {isOutstationService && (
                    <div className={`mt-3 p-4 border rounded-[1.4rem] space-y-2 transition-all ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                        }`}>
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-blue-600" />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Outstation mission protocol</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-bold uppercase ${isDarkMode ? 'text-white/20' : 'text-blue-900/40'}`}>Stay & Food Allowance</span>
                                <span className={`text-[8px] font-black ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>₹500 / 24h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-bold uppercase ${isDarkMode ? 'text-white/20' : 'text-blue-900/40'}`}>Daily Driving Limit</span>
                                <span className={`text-[8px] font-black ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>9 Hours Max</span>
                            </div>
                        </div>
                        <p className={`text-[7px] font-bold uppercase leading-tight ${isDarkMode ? 'text-white/20' : 'text-blue-900/30'}`}>
                            Note: Tolls, State Taxes & Parking are to be paid by the customer directly.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                        onClick={() => navigate(`/spare-driver/support?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className={`w-full h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] border shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${isDarkMode ? 'bg-white/05 border-white/05 text-white' : 'bg-black/05 border-black/05 text-black'
                            }`}
                    >
                        <MessageSquare size={14} className="opacity-40" />
                        Help
                    </button>
                    <button
                        onClick={() => navigate(`/spare-driver/history?bookingId=${bookingDetails?._id || activeBookingId}`)}
                        className={`w-full h-12 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isDarkMode ? 'bg-white text-black' : 'bg-[#0F172A] text-white'
                            }`}
                    >
                        <Car size={14} className="opacity-40" />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTripCompleted = () => (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl mb-4 transition-all ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}
            >
                <CheckCircle2 size={44} strokeWidth={2.5} />
            </motion.div>

            <div className="space-y-3 max-w-[300px]">
                <h2 className={`text-3xl font-[1000] uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Session<br />Completed</h2>
                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>
                    Thank you for traveling with Spare Driver elite chauffeurs.
                </p>
            </div>

            <div className={`w-full border p-6 rounded-[2.5rem] space-y-4 shadow-2xl transition-all ${isDarkMode ? 'bg-white/05 border-white/05 shadow-black/80' : 'bg-white border-black/05 shadow-black/10'
                }`}>
                <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                    <div className="text-left">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Service</span>
                        <p className={`text-[14px] font-black uppercase mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedType?.title || 'Elite Mission'}</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Settlement</span>
                        <p className={`text-[13px] font-black uppercase mt-1 ${hasOutstandingSettlement ? 'text-[#F59E0B]' : 'text-emerald-500'}`}>
                            {hasOutstandingSettlement ? 'Balance Due' : (useSubscription ? 'Subscription' : (bookingDetails?.payment?.status || 'Authenticated'))}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Base Fare</span>
                        <span className={`text-[14px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(selectedType?.basePrice)}</span>
                    </div>

                    {bookingDetails?.pricing?.breakdown?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{item.name}</span>
                            <span className={`text-[12px] font-black ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>+{formatInr(item.amount)}</span>
                        </div>
                    ))}
                </div>

                <div className={`pt-4 border-t-2 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#F59E0B] uppercase tracking-widest">Grand Total</span>
                        <span className={`text-2xl font-[1000] tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatInr(bookingDetails?.pricing?.totalAmount)}</span>
                    </div>
                </div>

                <div className={`pt-4 border-t grid grid-cols-2 gap-4 ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                    <div className="text-left">
                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Session Time</span>
                        <span className={`text-[13px] font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Duration Class</span>
                        <span className={`text-[12px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>{serviceFlowMeta.durationLabel}</span>
                    </div>
                </div>
            </div>

            <div className={`w-full border rounded-2xl px-5 py-4 transition-colors ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                }`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Mission Summary</p>
                <p className={`text-[11px] font-bold uppercase mt-2 leading-relaxed ${isDarkMode ? 'text-blue-300/70' : 'text-blue-900/70'}`}>
                    {serviceFlowMeta.supportNote}
                </p>
            </div>

            {hasOutstandingSettlement && (
                <div className={`w-full border rounded-[2rem] p-6 text-left space-y-4 shadow-xl ${isDarkMode ? 'bg-[#F59E0B]/10 border-orange-500/20' : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#F59E0B]' : 'text-amber-700'}`}>Settlement Required</p>
                            <p className={`text-[11px] font-bold uppercase mt-2 leading-relaxed ${isDarkMode ? 'text-orange-300' : 'text-amber-900/70'}`}>
                                Additional usage fees are pending settlement.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#F59E0B]' : 'text-amber-700'}`}>Due</p>
                            <p className={`text-2xl font-black leading-none mt-1 ${isDarkMode ? 'text-white' : 'text-amber-950'}`}>{formatInr(outstandingSettlementAmount)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSettlementPayment('wallet')}
                            disabled={isSettlingPayment}
                            className={`h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 ${isDarkMode ? 'bg-[#F59E0B] text-white' : 'bg-amber-500 text-white'
                                }`}
                        >
                            {isSettlingPayment ? 'Processing...' : 'Wallet Pay'}
                        </button>
                        <button
                            onClick={() => handleSettlementPayment('online')}
                            disabled={isSettlingPayment}
                            className={`h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                                }`}
                        >
                            {isSettlingPayment ? 'Opening...' : 'Online Pay'}
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full space-y-4 pt-4">
                {!hasOutstandingSettlement && (
                    <button
                        onClick={() => navigate(`/rate?id=${bookingDetails?._id || activeBookingId}`)}
                        className={`w-full h-16 rounded-2xl font-black text-[13px] uppercase tracking-[0.15em] shadow-xl active:scale-[0.98] transition-all ${isDarkMode ? 'bg-[#F59E0B] text-white hover:bg-orange-600' : 'bg-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B]'
                            }`}
                    >
                        Rate Chauffeur Experience
                    </button>
                )}
                <button
                    onClick={() => {
                        resetChauffeurFlow(PHASES.SERVICE_TYPE);
                        navigate('/home');
                        refreshStats();
                    }}
                    className={`w-full h-16 rounded-2xl font-black text-[13px] uppercase tracking-[0.15em] shadow-lg active:scale-[0.98] transition-all ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-black text-white'
                        }`}
                >
                    {hasOutstandingSettlement ? 'Return Home (Pay Later)' : 'Dismiss Account'}
                </button>
                <button
                    onClick={() => navigate(`/spare-driver/history?bookingId=${bookingDetails?._id || activeBookingId}`)}
                    className={`w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all border ${isDarkMode ? 'border-white/10 text-white/40 shadow-black/20' : 'border-black/05 text-black/40 shadow-black/05'
                        }`}
                >
                    View Mission Record
                </button>
            </div>
        </div>
    );

    const renderCheckout = () => (
        <div className={`flex-1 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FFFDF5]'}`}>
            <div className={`px-5 pt-4 pb-2 border-b ${isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/05'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-[18px] font-black tracking-tighter leading-none uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Summary</h3>
                        <p className={`text-[8px] font-extrabold uppercase tracking-[0.2em] mt-0.5 ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F59E0B]'}`}>HOORA ELITE • 2/2</p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-4 pb-32 overflow-y-auto">
                <div className={`rounded-xl p-4 border space-y-3 ${isDarkMode ? 'bg-white/05 border-white/05' : 'bg-white border-black/05 shadow-sm'}`}>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0F172A]/05 text-[#0F172A]'}`}>
                                <MapPin size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-[7px] font-bold uppercase tracking-widest leading-none mb-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Base</p>
                                <p className={`text-[11px] font-black uppercase truncate ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{selectedAddress?.street || 'Pickup location'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                                <Navigation size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-[7px] font-bold uppercase tracking-widest leading-none mb-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Goal</p>
                                <p className={`text-[11px] font-black uppercase truncate ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                    {requiresDestination ? (destination?.street || 'Select destination') : (selectedType?.title || 'Standard Trip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`pt-3 border-t grid grid-cols-2 gap-3 ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                        <div>
                            <p className={`text-[7px] font-bold uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Category</p>
                            <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{bookingMode === 'instant' ? 'Rapid Dispatch' : 'Planned'}</p>
                        </div>
                        <div>
                            <p className={`text-[7px] font-bold uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Vehicle</p>
                            <p className="text-[10px] font-black text-[#F59E0B] uppercase truncate">{selectedVehicle ? `${selectedVehicle.brand} • ${selectedVehicle.plate}` : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* 🎯 FARE BREAKDOWN — uses local memo, no API loop */}
                <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#0F172A] border-white/08' : 'bg-white border-black/06 shadow-sm'}`}>
                    {/* Header */}
                    <div className={`px-5 py-3.5 flex items-center gap-3 border-b ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                        <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center shrink-0">
                            <span className="text-[#0F172A] text-[14px] font-[1000]">₹</span>
                        </div>
                        <div>
                            <p className={`text-[12px] font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Fare Estimate</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Pre-trip breakdown</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className={`text-[22px] font-[1000] tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>₹{estimatedTotal}</p>
                            <p className="text-[8px] font-black text-[#F59E0B] uppercase tracking-widest">Total Est.</p>
                        </div>
                    </div>

                    {/* Breakdown rows */}
                    <div className="px-5 py-3 space-y-2">
                        {dynamicPricingBreakdown.breakdown.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px]">{item.icon}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>{item.label}</span>
                                </div>
                                <span className={`text-[11px] font-black ${item.type === 'surcharge' ? 'text-[#F59E0B]' : isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                    {item.type === 'base' ? '' : '+'} ₹{item.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}
                        {/* GST row */}
                        {dynamicPricingBreakdown.gstAmount > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px]">🏛️</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>GST (5%)</span>
                                </div>
                                <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                    + ₹{dynamicPricingBreakdown.gstAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Total footer */}
                    <div className={`px-5 py-3 border-t flex items-center justify-between ${isDarkMode ? 'border-white/05 bg-white/03' : 'border-black/05 bg-black/02'}`}>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Grand Total</span>
                        <span className={`text-[16px] font-[1000] tracking-tight ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#0F172A]'}`}>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Reserve Info */}
                <div className={`rounded-xl p-4 border transition-colors ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
                            <Lock size={14} />
                        </div>
                        <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-wide leading-none mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                Wallet Reserve: ₹{estimatedReserveAmount}
                            </p>
                            <p className={`text-[8px] font-bold leading-tight ${isDarkMode ? 'text-blue-400/60' : 'text-blue-600/60'}`}>
                                Mandatory security hold for potential overtime sessions. Auto-released upon on-time mission completion.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl p-5 flex items-center gap-4 border transition-colors ${isDarkMode ? 'bg-white/05 border-white/05 text-white' : 'bg-[#0F172A] text-white border-transparent'
                    }`}>
                    <Shield size={20} className="text-[#F59E0B]" />
                    <div>
                        <p className="text-[11px] font-black uppercase leading-none mb-1">Insured Mission</p>
                        <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Global Safety Standard v4.2</p>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className={`fixed bottom-[76px] left-0 right-0 z-[1100] px-5 py-4 backdrop-blur-lg border-t safe-area-bottom transition-all ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/05' : 'bg-white/90 border-black/05'
                }`}>
                <div className="max-w-[430px] mx-auto flex items-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmBooking}
                        disabled={isProcessing}
                        className="flex-1 h-14 bg-[#F59E0B] hover:bg-[#F59E0B] text-[#0F172A] rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.1em] shadow-xl shadow-[#F59E0B]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? 'Establishing...' : 'Confirm Booking'}
                        <ArrowRight size={18} strokeWidth={4} />
                    </motion.button>
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

    if (!vehiclesLoading && vehicles && vehicles.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <Loader2 className="w-10 h-10 text-[#F59E0B] animate-spin mb-4" strokeWidth={3} />
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] animate-pulse ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>Initializing Direct Registry...</p>
            </div>
        );
    }

    return (
        <MobileLayout hideNav={phase === PHASES.TRIP_ACTIVE || phase === PHASES.FINDING_DRIVER || phase === PHASES.BOOKING_CONFIRMED || phase === PHASES.TRIP_COMPLETED}>
            <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
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
                            {phase === PHASES.SERVICE_TYPE && renderServiceType()}
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

