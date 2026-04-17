import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft, Building, MapPin, Car, ShieldCheck,
    Clock, Check, ChevronRight, ChevronDown, Info, Calendar, CreditCard, Search, X,
    ArrowRight, Loader2, PauseCircle, PlayCircle, RefreshCw, PencilLine, SkipForward
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { serviceAPI, subscriptionAPI } from '../../../utils/api';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { Map as MapIcon, List as ListIcon, Plus } from 'lucide-react';
import { geocodingService } from '../../../utils/geocoding';

const formatDate = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const computeNextApartmentWashWindow = (subscription, slots = []) => {
    if (!subscription || subscription.status === 'paused') {
        return { label: 'Paused', date: null };
    }

    if (subscription.status === 'pending') {
        return { label: 'Awaiting admin verification', date: null, time: 'Captain assignment pending' };
    }

    if (subscription.status === 'rejected') {
        return { label: 'Reconfigure request', date: null, time: 'Admin approval not granted' };
    }

    const slotMap = new Map((slots || []).map((slot) => [slot.id, slot]));
    const activeSlot = slotMap.get(subscription.slot) || {};
    const now = new Date();
    const skipDates = new Set((subscription.skipDates || []).map((value) => new Date(value).toISOString().split('T')[0]));
    const searchDate = new Date(now);

    for (let offset = 0; offset < 14; offset += 1) {
        const candidate = new Date(searchDate);
        candidate.setDate(now.getDate() + offset);
        candidate.setHours(0, 0, 0, 0);

        const key = candidate.toISOString().split('T')[0];
        if (skipDates.has(key)) continue;

        return {
            label: activeSlot.label || subscription.slot || 'Scheduled slot',
            time: activeSlot.time || '',
            date: candidate
        };
    }

    return {
        label: activeSlot.label || subscription.slot || 'Scheduled slot',
        time: activeSlot.time || '',
        date: null
    };
};

const toApartmentSearchCard = (result, index = 0) => ({
    _id: `search-${index}-${String(result.label || 'apartment').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
    name: result.label || 'Requested Apartment',
    city: '',
    location: {
        address: result.address || result.label || '',
        coordinates: { lat: result.lat, lng: result.lng }
    },
    metadata: {
        isSociety: true,
        pendingApproval: true,
        blocks: [],
        parkingLevels: [],
        pillarRange: { min: 1, max: 999 }
    },
    iconUrl: '',
    isSearchFallback: true
});

const getApartmentMarkerIcon = (variant = 'default') => {
    if (!window.google?.maps?.Size || !window.google?.maps?.Point) return undefined;
    const svg = variant === 'selected'
        ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="66" viewBox="0 0 56 66">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.22"/>
                    </filter>
                </defs>
                <g filter="url(#shadow)">
                    <path d="M28 3C18.2 3 10 11.2 10 21c0 13.7 18 34 18 34s18-20.3 18-34C46 11.2 37.8 3 28 3z" fill="#111827"/>
                    <circle cx="28" cy="21" r="13" fill="#F29F05"/>
                    <path d="M20 25V17.5c0-.8.7-1.5 1.5-1.5h13c.8 0 1.5.7 1.5 1.5V25M18 27h20M22 20h3M31 20h3M22 24h3M31 24h3" stroke="#111827" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </g>
            </svg>`
        : `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="58" viewBox="0 0 50 58">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.18"/>
                    </filter>
                </defs>
                <g filter="url(#shadow)">
                    <path d="M25 3C16.4 3 9 10.4 9 19c0 12.2 16 30 16 30s16-17.8 16-30C41 10.4 33.6 3 25 3z" fill="#ffffff"/>
                    <circle cx="25" cy="19" r="11.5" fill="#ECFDF5" stroke="#D1FAE5"/>
                    <path d="M18 23V16.5c0-.8.7-1.5 1.5-1.5h11c.8 0 1.5.7 1.5 1.5V23M16.5 24.5h17M20 18.5h2.4M27.6 18.5H30M20 22h2.4M27.6 22H30" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </g>
            </svg>`;

    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new window.google.maps.Size(variant === 'selected' ? 56 : 50, variant === 'selected' ? 66 : 58),
        anchor: new window.google.maps.Point(variant === 'selected' ? 28 : 25, variant === 'selected' ? 56 : 49)
    };
};

const ApartmentWash = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { vehicles, vehiclesLoading, user, refreshStats, getRazorpayKey, createPaymentOrder, verifyPayment } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [manageMode, setManageMode] = useState(false);
    const [managementSaving, setManagementSaving] = useState(false);
    const [slotLoading, setSlotLoading] = useState(false);
    const [activationSummary, setActivationSummary] = useState(location.state?.apartmentActivated || null);

    // 🛡️ Proactive Redirect: Force users with 0 vehicles to Garaj
    useEffect(() => {
        if (!vehiclesLoading && vehicles && vehicles.length === 0) {
            toast.error('Register your vehicle', { icon: '🚗', id: 'vehicle-registration-toast' });
            const timer = setTimeout(() => navigate('/vehicles?from=apartment-wash&mode=add'), 1200);
            return () => clearTimeout(timer);
        }
    }, [vehicles, vehiclesLoading, navigate]);



    // Dynamic Data State
    const [apartments, setApartments] = useState([]);
    const [plans, setPlans] = useState([]);
    const [slots, setSlots] = useState([]);
    const [businessRules, setBusinessRules] = useState([]);
    const [apartmentService, setApartmentService] = useState(null);
    const [fetchError, setFetchError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFallbackResults, setSearchFallbackResults] = useState([]);
    const [registeringApartment, setRegisteringApartment] = useState(false);
    const [viewMode, setViewMode] = useState('map'); // 'list' or 'map'

    // Form State
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [parkingDetails, setParkingDetails] = useState({
        basement: '',
        block: '',
        pillar: '',
        carNumber: '',
        carModel: '',
        vehicleId: ''
    });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [skipTodayDate, setSkipTodayDate] = useState(new Date().toISOString().split('T')[0]);

    const loadRazorpayScript = () => new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
        document.body.appendChild(script);
    });

    const apartmentSlots = useMemo(() => (
        slots.length > 0 ? slots : [
            { id: 'morning', time: '6:00 AM - 9:00 AM', label: 'Morning primary' },
            { id: 'evening', time: '6:00 PM - 8:00 PM', label: 'Evening optional' }
        ]
    ), [slots]);

    useEffect(() => {
        let mounted = true;
        const fetchActiveSubscription = async () => {
            try {
                setSubscriptionLoading(true);
                const res = await subscriptionAPI.getSubscription({ serviceKey: 'APARTMENT_WASH' });
                if (!mounted) return;
                const subscription = res?.data?.subscription || null;
                setActiveSubscription(subscription);
                setManageMode(Boolean(subscription));
            } catch (error) {
                console.error('Failed to load apartment subscription:', error);
            } finally {
                if (mounted) setSubscriptionLoading(false);
            }
        };

        fetchActiveSubscription();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (location.state?.apartmentActivated) {
            setActivationSummary(location.state.apartmentActivated);
        }
    }, [location.state]);

    // Fetch initial and searched data
    useEffect(() => {
        const primaryAddress = user?.profile?.addresses?.find(a => a.isPrimary) || user?.profile?.addresses?.[0];
        const currentCity = primaryAddress?.city || user?.profile?.address?.city || '';

        if (!currentCity && refreshStats && !searchQuery) {
            console.log('🔄 City missing on mount, triggering refreshStats...');
            refreshStats();
            return;
        }

        const fetchData = async () => {
            try {
                if (searchQuery) setFetching(true); // Only show subtle loading if searching
                else setFetching(true);

                setFetchError('');

                console.log('🏙️ ApartmentWash Discovery - City Hint:', currentCity, 'Search:', searchQuery);

                const response = await serviceAPI.getApartmentFlowData({
                    city: searchQuery ? '' : currentCity, // If searching, ignore user city preference
                    q: searchQuery,
                    serviceKey: 'APARTMENT_WASH'
                });

                if (response.status === 'success') {
                    setApartmentService(response.data?.service || null);
                    setApartments(response.data?.apartments || []);
                    setPlans(response.data?.plans || []);
                    setSlots(response.data?.slots || []);
                    setBusinessRules(response.data?.rules || []);
                }

                if (searchQuery.trim().length >= 3) {
                    const geoResults = await geocodingService.search(searchQuery.trim());
                    const mappedResults = (geoResults || [])
                        .filter((result) => typeof result.lat === 'number' && typeof result.lng === 'number')
                        .map((result, index) => toApartmentSearchCard(result, index));
                    setSearchFallbackResults(mappedResults);
                } else {
                    setSearchFallbackResults([]);
                }
            } catch (err) {
                console.error("Failed to fetch apartment data:", err);
                setFetchError(err.message || 'Failed to load apartment wash data');
            } finally {
                setFetching(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchData();
        }, searchQuery ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [user, user?.profile?.addresses, refreshStats, searchQuery]);

    useEffect(() => {
        let mounted = true;

        const syncApartmentSlots = async () => {
            if (!selectedApartment?._id || !apartmentService?.id) return;

            try {
                setSlotLoading(true);
                const response = await serviceAPI.getTimeSlots({
                    date: getTodayDateString(),
                    serviceId: apartmentService.id,
                    hubId: selectedApartment._id
                });

                if (!mounted) return;
                const liveSlots = response?.data?.timeSlots || [];
                if (liveSlots.length > 0) {
                    setSlots(liveSlots);
                }
            } catch (error) {
                console.error('Failed to sync apartment slots:', error);
            } finally {
                if (mounted) setSlotLoading(false);
            }
        };

        syncApartmentSlots();
        return () => {
            mounted = false;
        };
    }, [selectedApartment?._id, apartmentService?.id]);

    // Filtered apartments
    const filteredApartments = useMemo(() => {
        const combinedApartments = [...apartments];
        const existingKeys = new Set(
            apartments.map((apt) => `${String(apt.name || '').toLowerCase()}|${String(typeof apt.location === 'object' ? (apt.location.address || apt.location.full || '') : apt.location || '').toLowerCase()}`)
        );

        searchFallbackResults.forEach((apt) => {
            const key = `${String(apt.name || '').toLowerCase()}|${String(apt.location?.address || '').toLowerCase()}`;
            if (!existingKeys.has(key)) {
                combinedApartments.push(apt);
                existingKeys.add(key);
            }
        });

        if (!searchQuery) return combinedApartments;
        const q = searchQuery.toLowerCase();
        return combinedApartments.filter(apt => {
            const name = apt?.name?.toLowerCase() || '';
            const city = (typeof apt?.city === 'object' ? apt.city.name : apt?.city)?.toLowerCase() || '';
            const location = (typeof apt?.location === 'object' ? (apt.location.address || apt.location.full) : apt?.location)?.toLowerCase() || '';

            return name.includes(q) || city.includes(q) || location.includes(q);
        });
    }, [apartments, searchFallbackResults, searchQuery]);

    const normalizedApartmentSearch = searchQuery.trim().toLowerCase();

    const exactRegisteredApartmentResults = useMemo(() => {
        if (!normalizedApartmentSearch) return [];

        return apartments.filter((apt) => {
            const name = String(apt?.name || '').trim().toLowerCase();
            return name === normalizedApartmentSearch;
        });
    }, [apartments, normalizedApartmentSearch]);

    const step1SearchResults = useMemo(() => {
        if (!normalizedApartmentSearch || normalizedApartmentSearch.length < 3) return [];
        if (exactRegisteredApartmentResults.length > 0) return exactRegisteredApartmentResults;
        return filteredApartments.filter((apt) => apt.isSearchFallback);
    }, [normalizedApartmentSearch, exactRegisteredApartmentResults, filteredApartments]);

    useEffect(() => {
        if (!activeSubscription) return;

        const matchedApartment = apartments.find((apt) => apt._id === activeSubscription.hub?._id || apt._id === activeSubscription.hub);
        if (matchedApartment) {
            setSelectedApartment(matchedApartment);
        }

        setParkingDetails((current) => ({
            ...current,
            basement: activeSubscription.parkingDetails?.basement || current.basement,
            block: activeSubscription.parkingDetails?.block || current.block,
            pillar: activeSubscription.parkingDetails?.pillar || current.pillar,
            carNumber: activeSubscription.parkingDetails?.carNumber || activeSubscription.vehicle?.plate || activeSubscription.vehicle?.plateNumber || current.carNumber,
            carModel: activeSubscription.parkingDetails?.carModel || [activeSubscription.vehicle?.brand, activeSubscription.vehicle?.model].filter(Boolean).join(' ') || current.carModel,
            vehicleId: activeSubscription.vehicle?._id || activeSubscription.vehicle || current.vehicleId
        }));

        const matchedSlot = apartmentSlots.find((slot) => slot.id === activeSubscription.slot);
        if (matchedSlot) {
            setSelectedSlot(matchedSlot);
        }
    }, [activeSubscription, apartments, apartmentSlots]);

    const registerApartmentFromSearch = async (apt) => {
        setRegisteringApartment(true);
        try {
            const reverse = await geocodingService.reverse(apt.location.coordinates.lat, apt.location.coordinates.lng);
            const payload = {
                name: apt.name,
                address: apt.location?.address || reverse?.display_name || apt.name,
                city: reverse?.city || user?.profile?.address?.city || user?.profile?.addresses?.[0]?.city || 'Unknown City',
                coordinates: apt.location.coordinates
            };

            const response = await serviceAPI.requestApartmentLead(payload);
            const registeredApartment = response?.data?.apartment;
            if (!registeredApartment) {
                throw new Error('Failed to register apartment');
            }

            setApartments((current) => {
                const exists = current.some((entry) => String(entry._id) === String(registeredApartment._id));
                return exists ? current : [registeredApartment, ...current];
            });
            setSearchFallbackResults([]);
            toast.success(response?.message || 'Apartment registered. Continue with subscription setup.');
            return registeredApartment;
        } catch (error) {
            console.error('Failed to register searched apartment:', error);
            toast.error(error.message || 'Unable to register this apartment right now');
            return null;
        } finally {
            setRegisteringApartment(false);
        }
    };

    const handleApartmentClick = async (apt) => {
        let nextApartment = apt;
        if (apt?.isSearchFallback) {
            const registeredApartment = await registerApartmentFromSearch(apt);
            if (!registeredApartment) return;
            nextApartment = registeredApartment;
        }

        setSelectedApartment(nextApartment);

        // Auto-select or reset parking details based on metadata
        const metadata = nextApartment?.metadata || {};
        const levels = metadata.parkingLevels || [];
        const blocks = metadata.blocks || [];

        setParkingDetails({
            ...parkingDetails,
            basement: levels.length === 1 ? levels[0] : '',
            block: blocks.length === 1 ? blocks[0] : '',
            pillar: ''
        });

        setStep(2);
    };

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setStep(4);
        /*
            console.log('💎 Premium Plan Clicked - Launching Global Pass Modal');
                toast.success("Welcome back, Premium Member! 🕶️ Checking your status...");
            }
            setShowGoldPassModal(true);
            return;
        */
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        setStep(5);
    };

    const refreshApartmentSubscription = async () => {
        const res = await subscriptionAPI.getSubscription({ serviceKey: 'APARTMENT_WASH' });
        const subscription = res?.data?.subscription || null;
        setActiveSubscription(subscription);
        setManageMode(Boolean(subscription));
        return subscription;
    };

    const validateSelectedApartmentSlot = async () => {
        if (!selectedApartment?._id || !selectedSlot?.id || !apartmentService?.id) return true;

        const response = await serviceAPI.getTimeSlots({
            date: getTodayDateString(),
            serviceId: apartmentService.id,
            hubId: selectedApartment._id
        });

        const liveSlots = response?.data?.timeSlots || [];
        if (liveSlots.length > 0) {
            setSlots(liveSlots);
        }

        const matchedSlot = liveSlots.find((entry) => entry.id === selectedSlot.id);
        if (matchedSlot && matchedSlot.available === false) {
            throw new Error('Selected apartment slot is full. Please choose another slot.');
        }

        return true;
    };

    const handleUpdateSubscription = async (payload, successMessage) => {
        try {
            setManagementSaving(true);
            await subscriptionAPI.updateSubscription(payload, { serviceKey: 'APARTMENT_WASH' });
            await refreshApartmentSubscription();
            if (refreshStats) refreshStats();
            toast.success(successMessage);
        } catch (error) {
            console.error('Failed to update apartment subscription:', error);
            toast.error(error.message || 'Failed to update apartment wash settings');
        } finally {
            setManagementSaving(false);
        }
    };

    const handlePauseResume = async () => {
        if (!activeSubscription) return;
        try {
            setManagementSaving(true);
            if (activeSubscription.status === 'paused') {
                await subscriptionAPI.resumeSubscription({ serviceKey: 'APARTMENT_WASH' });
                toast.success('Apartment wash service resumed');
            } else {
                await subscriptionAPI.pauseSubscription({ serviceKey: 'APARTMENT_WASH' });
                toast.success('Apartment wash service paused');
            }
            await refreshApartmentSubscription();
            if (refreshStats) refreshStats();
        } catch (error) {
            console.error('Failed to toggle apartment subscription:', error);
            toast.error(error.message || 'Unable to update subscription status');
        } finally {
            setManagementSaving(false);
        }
    };

    const handleSkipToday = async () => {
        if (!activeSubscription) return;
        try {
            setManagementSaving(true);
            await subscriptionAPI.skipSubscription(skipTodayDate, { serviceKey: 'APARTMENT_WASH' });
            await refreshApartmentSubscription();
            toast.success('Today\'s apartment wash skipped');
        } catch (error) {
            console.error('Failed to skip apartment wash:', error);
            toast.error(error.message || 'Unable to skip service date');
        } finally {
            setManagementSaving(false);
        }
    };

    const handleStartRenewFlow = () => {
        setManageMode(false);
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPendingApprovalManager = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-4 space-y-6 pb-24"
        >
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.24em]">Request submitted</p>
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Admin verification pending</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">
                    Your payment is confirmed. The admin team will verify the apartment setup, confirm captain mapping, and then activate your daily wash service.
                </p>
            </div>

            <div className="rounded-[2rem] bg-black p-6 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Apartment request</p>
                        <h3 className="mt-2 text-2xl font-[1000] uppercase tracking-tighter">{activeSubscription?.plan || 'Apartment Wash'}</h3>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                            {(activeSubscription?.hub?.name || selectedApartment?.name || 'Apartment pending')}{' • '}{(activeSubscription?.slot || selectedSlot?.label || 'Slot pending')}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-yellow-400 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-black">
                        Pending
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Vehicle</p>
                        <p className="mt-2 text-sm font-[1000] tracking-tight">{getTodayDateString() ? (parkingDetails.carNumber || activeSubscription?.vehicle?.plate || activeSubscription?.vehicle?.plateNumber || 'Vehicle pending') : 'Vehicle pending'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Parking route</p>
                        <p className="mt-2 text-sm font-[1000] uppercase tracking-tight">{[parkingDetails.basement, parkingDetails.block, parkingDetails.pillar].filter(Boolean).join(' • ') || 'Parking pending'}</p>
                    </div>
                </div>

                <div className="mt-3 rounded-2xl bg-white/5 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">What happens next</p>
                    <div className="mt-3 space-y-2">
                        {[
                            'Your apartment request will be reviewed',
                            'A captain pool will be mapped to the apartment',
                            'Approved plans will start generating daily wash jobs'
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
                                <Check size={12} className="text-brand" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {activationSummary && (
                <div className="rounded-3xl border border-yellow-100 bg-yellow-50 px-5 py-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-yellow-700">Request logged</p>
                    <p className="mt-2 text-[11px] font-[1000] uppercase tracking-tight text-yellow-900">
                        {activationSummary.plan || activeSubscription?.plan || 'Apartment Wash'} has been submitted for admin review.
                    </p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-yellow-800/70">
                        {(activationSummary.apartment || activeSubscription?.hub?.name || 'Apartment')}{' • '}{(activationSummary.slot || activeSubscription?.slot || 'Slot pending')}
                    </p>
                </div>
            )}

            <div className="rounded-3xl border border-black/[0.04] bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-brand">
                        <PencilLine size={20} />
                    </div>
                    <div>
                        <p className="text-[12px] font-[1000] uppercase tracking-tight text-black">Update request details</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/30 mt-1">Update your vehicle, parking route, or slot before approval.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <select
                        value={parkingDetails.vehicleId}
                        onChange={(e) => {
                            const matchedVehicle = vehicles.find((v) => v._id === e.target.value);
                            setParkingDetails((current) => ({
                                ...current,
                                vehicleId: e.target.value,
                                carModel: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : current.carModel,
                                carNumber: matchedVehicle ? (matchedVehicle.plate || matchedVehicle.plateNumber) : current.carNumber
                            }));
                        }}
                        className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20"
                    >
                        <option value="">Select vehicle</option>
                        {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>{vehicle.brand} {vehicle.model} • {vehicle.plate || vehicle.plateNumber}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                        <input value={parkingDetails.basement} onChange={(e) => setParkingDetails((current) => ({ ...current, basement: e.target.value }))} placeholder="Basement / Level" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                        <input value={parkingDetails.block} onChange={(e) => setParkingDetails((current) => ({ ...current, block: e.target.value }))} placeholder="Block / Tower" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input value={parkingDetails.pillar} onChange={(e) => setParkingDetails((current) => ({ ...current, pillar: e.target.value }))} placeholder="Pillar / Slot" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                        <select value={selectedSlot?.id || activeSubscription?.slot || ''} onChange={(e) => {
                            const slot = apartmentSlots.find((entry) => entry.id === e.target.value);
                            setSelectedSlot(slot || null);
                        }} className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20">
                            <option value="">Select slot</option>
                            {apartmentSlots.map((slot) => (
                                <option key={slot.id} value={slot.id}>{slot.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => handleUpdateSubscription({
                            vehicleId: parkingDetails.vehicleId || undefined,
                            slot: selectedSlot?.id || activeSubscription?.slot,
                            hubId: selectedApartment?._id || activeSubscription?.hub?._id,
                            parkingDetails: {
                                basement: parkingDetails.basement,
                                block: parkingDetails.block,
                                pillar: parkingDetails.pillar,
                                carModel: parkingDetails.carModel,
                                carNumber: parkingDetails.carNumber
                            }
                        }, 'Apartment wash request updated')}
                        disabled={managementSaving}
                        className="w-full rounded-2xl bg-black py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
                    >
                        Save request details
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => navigate('/apartment-wash/history')}
                    className="w-full rounded-3xl border border-black/[0.05] bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black"
                >
                    View history
                </button>
                <button
                    onClick={() => navigate('/apartment-wash/support')}
                    className="w-full rounded-3xl border border-brand/20 bg-brand/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand"
                >
                    Contact support
                </button>
            </div>
        </motion.div>
    );

    const renderRejectedSubscriptionManager = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-4 space-y-6 pb-24"
        >
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.24em]">Approval required again</p>
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Request needs update</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">
                    This request was not approved. Update the apartment, slot, or parking details and submit it again.
                </p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-600">Request Not Approved</p>
                <p className="mt-2 text-[11px] font-[1000] uppercase tracking-tight text-red-900">
                    {(activeSubscription?.hub?.name || selectedApartment?.name || 'Apartment')}{' • '}{(activeSubscription?.slot || selectedSlot?.label || 'Slot pending')}
                </p>
                {activeSubscription?.review?.rejectionReason && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-white/70 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-600">Admin Reason</p>
                        <p className="mt-2 text-[11px] font-bold leading-relaxed text-red-900">
                            {activeSubscription.review.rejectionReason}
                        </p>
                    </div>
                )}
            </div>

            <button
                onClick={handleStartRenewFlow}
                className="w-full rounded-3xl bg-black px-5 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white"
            >
                Reconfigure request
            </button>
        </motion.div>
    );

    const renderActiveSubscriptionManager = () => {
        if (activeSubscription?.status === 'pending') {
            return renderPendingApprovalManager();
        }

        if (activeSubscription?.status === 'rejected') {
            return renderRejectedSubscriptionManager();
        }

        const todaySkipped = (activeSubscription?.skipDates || []).some((date) => {
            const normalized = new Date(date).toISOString().split('T')[0];
            return normalized === skipTodayDate;
        });
        const nextWash = computeNextApartmentWashWindow(activeSubscription, apartmentSlots);

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 pt-4 space-y-6 pb-24"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.24em]">Subscription active</p>
                    </div>
                    <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Manage apartment wash</h2>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">
                        Everything for your apartment wash stays here: parking, slot, pause, skip, renewal, history, and support.
                    </p>
                </div>

                <div className="rounded-[2rem] bg-black p-6 text-white shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Apartment pass</p>
                            <h3 className="mt-2 text-2xl font-[1000] uppercase tracking-tighter">{activeSubscription?.plan || 'Apartment Wash'}</h3>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                                {(activeSubscription?.hub?.name || selectedApartment?.name || 'Apartment pending')}{' • '}{(activeSubscription?.slot || selectedSlot?.label || 'Slot pending')}
                            </p>
                        </div>
                        <div className={`rounded-2xl px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] ${activeSubscription?.status === 'paused' ? 'bg-yellow-400 text-black' : 'bg-emerald-500 text-white'}`}>
                            {activeSubscription?.status || 'active'}
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Credits</p>
                            <p className="mt-2 text-xl font-[1000] tracking-tighter">{Math.max(0, (activeSubscription?.monthlyCredits || 0) - (activeSubscription?.usedCredits || 0))}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Valid till</p>
                            <p className="mt-2 text-sm font-[1000] uppercase tracking-tight">{formatDate(activeSubscription?.endDate)}</p>
                        </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white/5 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Next wash window</p>
                        <p className="mt-2 text-sm font-[1000] uppercase tracking-tight">
                            {nextWash?.date ? formatDate(nextWash.date) : nextWash?.label || 'Pending'}
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                            {nextWash?.time || nextWash?.label || 'Schedule pending'}
                        </p>
                    </div>
                </div>

                {activationSummary && (
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Subscription activated</p>
                        <p className="mt-2 text-[11px] font-[1000] uppercase tracking-tight text-emerald-900">
                            {activationSummary.plan || activeSubscription?.plan || 'Apartment Wash'} is now active.
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-800/70">
                            {(activationSummary.apartment || activeSubscription?.hub?.name || 'Apartment')}{' • '}{(activationSummary.slot || nextWash?.label || 'Slot pending')}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={handlePauseResume}
                        disabled={managementSaving}
                        className="w-full rounded-3xl border border-black/[0.04] bg-white px-5 py-4 text-left shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand">
                                {activeSubscription?.status === 'paused' ? <PlayCircle size={22} /> : <PauseCircle size={22} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[12px] font-[1000] uppercase tracking-tight text-black">
                                    {activeSubscription?.status === 'paused' ? 'Resume daily service' : 'Pause service'}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/30 mt-1">
                                    {activeSubscription?.status === 'paused' ? 'Reactivate regular apartment washes' : 'Temporarily stop future wash generation'}
                                </p>
                            </div>
                        </div>
                    </button>

                    <div className="rounded-3xl border border-black/[0.04] bg-white p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-brand">
                                <SkipForward size={20} />
                            </div>
                            <div>
                                <p className="text-[12px] font-[1000] uppercase tracking-tight text-black">Skip specific date</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/30 mt-1">Use this when the vehicle is unavailable or you are away.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="date"
                                value={skipTodayDate}
                                onChange={(e) => setSkipTodayDate(e.target.value)}
                                className="flex-1 rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-3 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20"
                            />
                            <button
                                onClick={handleSkipToday}
                                disabled={managementSaving || todaySkipped}
                                className="rounded-2xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
                            >
                                {todaySkipped ? 'Skipped' : 'Skip'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-black/[0.04] bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-brand">
                            <PencilLine size={20} />
                        </div>
                        <div>
                            <p className="text-[12px] font-[1000] uppercase tracking-tight text-black">Update parking & slot</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/30 mt-1">Save any vehicle, parking, or slot change for the apartment from here.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <select
                            value={parkingDetails.vehicleId}
                            onChange={(e) => {
                                const matchedVehicle = vehicles.find((v) => v._id === e.target.value);
                                setParkingDetails((current) => ({
                                    ...current,
                                    vehicleId: e.target.value,
                                    carModel: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : current.carModel,
                                    carNumber: matchedVehicle ? (matchedVehicle.plate || matchedVehicle.plateNumber) : current.carNumber
                                }));
                            }}
                            className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20"
                        >
                            <option value="">Select vehicle</option>
                            {vehicles.map((vehicle) => (
                                <option key={vehicle._id} value={vehicle._id}>{vehicle.brand} {vehicle.model} • {vehicle.plate || vehicle.plateNumber}</option>
                            ))}
                        </select>

                        <div className="grid grid-cols-2 gap-3">
                            <input value={parkingDetails.basement} onChange={(e) => setParkingDetails((current) => ({ ...current, basement: e.target.value }))} placeholder="Basement / Level" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                            <input value={parkingDetails.block} onChange={(e) => setParkingDetails((current) => ({ ...current, block: e.target.value }))} placeholder="Block / Tower" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input value={parkingDetails.pillar} onChange={(e) => setParkingDetails((current) => ({ ...current, pillar: e.target.value }))} placeholder="Pillar / Slot" className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20" />
                            <select value={selectedSlot?.id || activeSubscription?.slot || ''} onChange={(e) => {
                                const slot = apartmentSlots.find((entry) => entry.id === e.target.value);
                                setSelectedSlot(slot || null);
                            }} className="w-full rounded-2xl border border-black/[0.06] bg-gray-50 px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20">
                                <option value="">Select slot</option>
                                {apartmentSlots.map((slot) => (
                                    <option key={slot.id} value={slot.id}>{slot.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => handleUpdateSubscription({
                                vehicleId: parkingDetails.vehicleId || undefined,
                                slot: selectedSlot?.id || activeSubscription?.slot,
                                hubId: selectedApartment?._id || activeSubscription?.hub?._id,
                                parkingDetails: {
                                    basement: parkingDetails.basement,
                                    block: parkingDetails.block,
                                    pillar: parkingDetails.pillar,
                                    carModel: parkingDetails.carModel,
                                    carNumber: parkingDetails.carNumber
                                }
                            }, 'Apartment wash settings updated')}
                            disabled={managementSaving}
                            className="w-full rounded-2xl bg-black py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
                        >
                            Save parking & slot
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/apartment-wash/history')}
                        className="w-full rounded-3xl border border-black/[0.05] bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black"
                    >
                        Wash history
                    </button>
                    <button
                        onClick={() => navigate('/apartment-wash/support')}
                        className="w-full rounded-3xl border border-brand/20 bg-brand/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand"
                    >
                        Support
                    </button>
                </div>

                <button
                    onClick={handleStartRenewFlow}
                    className="w-full rounded-3xl border border-brand/20 bg-brand/5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-brand"
                >
                    Renew / change plan
                </button>
            </motion.div>
        );
    };

    const renderStep1_ApartmentSelection = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-3 pb-10 space-y-5"
        >
            <div className="space-y-1">
                <h2 className="text-[1.9rem] font-[1000] text-content uppercase tracking-tighter leading-none">
                    {filteredApartments.length > 0 ? 'Choose your apartment' : 'Search your apartment'}
                </h2>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">
                        {filteredApartments.length > 0
                            ? `Registered apartments are visible on the map in ${user?.profile?.address?.city || 'your area'}`
                            : 'Search any apartment and place it on the map to continue.'
                        }
                    </p>
                    {/* 🛠️ Temporary Debug Info */}
                </div>
            </div>

            <div className="relative group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-brand transition-colors" />
                <input
                    placeholder="Search apartment name, area, or landmark"
                    className="w-full bg-gray-50/70 border border-black/[0.03] px-14 py-5 rounded-3xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 transition-all shadow-sm placeholder:text-black/25 tracking-[0.08em] font-outfit"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {fetchError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{fetchError}</p>
                </div>
            )}

            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-brand' : 'text-content-muted hover:text-content'}`}
                >
                    <ListIcon size={16} /> List
                </button>
                <button
                    onClick={() => setViewMode('map')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white shadow-md text-brand' : 'text-content-muted hover:text-content'}`}
                >
                    <MapIcon size={16} /> Map
                </button>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'map' ? (
                    <motion.div
                        key="map"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-[2.2rem] overflow-hidden border border-black/[0.04] bg-white shadow-[0_24px_50px_rgba(15,23,42,0.08)] relative"
                    >
                        <div className="relative h-[56svh]">
                            <GoogleMapBox
                                center={selectedApartment?.location?.coordinates || filteredApartments[0]?.location?.coordinates || { lat: 28.6139, lng: 77.2090 }}
                                zoom={13}
                                darkMode={false}
                                markers={filteredApartments.filter(apt => apt.location?.coordinates?.lat).map(apt => ({
                                    position: apt.location.coordinates,
                                    icon: getApartmentMarkerIcon(String(selectedApartment?._id) === String(apt._id) ? 'selected' : 'default'),
                                    infoContent: (
                                        <div className="p-0 min-w-[180px] bg-white rounded-2xl overflow-hidden font-outfit shadow-2xl border border-gray-100">
                                            <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                                                <h4 className="font-black text-[11px] uppercase text-black leading-none">{apt.name}</h4>
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-center gap-1.5 mb-3 opacity-60">
                                                    <MapPin size={10} className="text-brand" />
                                                    <p className="text-[9px] font-bold uppercase truncate">{apt.location?.address || 'Premium Complex'}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleApartmentClick(apt)}
                                                    className="w-full bg-brand text-white text-[9px] h-9 rounded-lg font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2"
                                                >
                                                    {apt.isSearchFallback ? 'Register & Continue' : 'Select Apartment'} <ArrowRight size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                }))}
                                circles={selectedApartment?.location?.coordinates ? [{
                                    center: selectedApartment.location.coordinates,
                                    radius: 120,
                                    options: {
                                        fillColor: '#F29F05',
                                        fillOpacity: 0.16,
                                        strokeColor: '#F29F05',
                                        strokeOpacity: 0.55,
                                        strokeWeight: 1
                                    }
                                }] : []}
                            />
                            <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
                                <div className="mx-auto flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/92 px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-brand/70">Apartment Discovery Map</p>
                                        <p className="mt-1 text-[11px] font-black uppercase text-content">
                                            {searchQuery ? 'Showing search and registered results' : 'Registered apartment bases in your area'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30">Visible Pins</p>
                                        <p className="mt-1 text-lg font-[1000] tracking-tight text-content">{filteredApartments.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-black/[0.04] bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-brand/70">Visible Apartments</p>
                                    <p className="mt-1 text-[11px] font-bold text-content-subtle">Registered apartments remain visible while you search.</p>
                                </div>
                                <div className="rounded-full bg-gray-100 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-content-subtle">
                                    {filteredApartments.length} shown
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-3"
                    >
                        {fetching ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Loading apartments...</span>
                            </div>
                        ) : filteredApartments.length > 0 ? (
                            filteredApartments.map((apt) => (
                                <motion.button
                                    key={apt._id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApartmentClick(apt)}
                                    disabled={registeringApartment}
                                    className="bg-white border border-black/[0.03] rounded-3xl p-4 flex items-center gap-4 text-left shadow-sm active:bg-gray-50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-black/[0.03] flex items-center justify-center p-3">
                                        {apt.iconUrl ? (
                                            <img
                                                src={apt.iconUrl}
                                                onError={(e) => { e.target.src = '/assets/appartment/default.png'; }}
                                                alt={apt.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Building className="text-black/10" size={28} />
                                        )}
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <h3 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{apt.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <MapPin size={10} className="text-brand" strokeWidth={3} />
                                            <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.15em] leading-none font-outfit">
                                                {typeof apt.location === 'object' ? (apt.location.address || apt.location.full) : (apt.location || 'Premium Complex')}, {typeof apt.city === 'object' ? apt.city.name : (apt.city || 'City')}
                                            </span>
                                        </div>
                                        {apt.isSearchFallback && (
                                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-brand">
                                                {apt.isSearchFallback ? 'Search Result' : 'Registered Apartment'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                                        <ChevronRight size={14} strokeWidth={3} />
                                    </div>
                                </motion.button>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                    <Building className="text-gray-200" size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-content uppercase tracking-tight">No apartments found</h3>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest px-10 leading-relaxed">Search your apartment on the map and register it to continue.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!searchQuery.trim()) {
                                            toast.error('Search your apartment name or area first');
                                            return;
                                        }

                                        const results = await geocodingService.search(searchQuery.trim());
                                        if (!results?.length) {
                                            toast.error('Apartment location not found on map');
                                            return;
                                        }

                                        const mappedApartment = toApartmentSearchCard(results[0], 0);
                                        setSearchFallbackResults([mappedApartment]);
                                        setViewMode('map');
                                        toast.success('Search result added. Select it from map or list.');
                                    }}
                                    className="bg-black text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10"
                                >
                                    Search On Map
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-brand/5 border border-brand/10 p-5 rounded-[1.5rem] flex gap-4 items-start">
                <Info size={18} className="text-brand shrink-0" />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">Need a new apartment added?</p>
                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tight leading-relaxed">Search any apartment on the map, register it, and continue the same apartment wash flow from here.</p>
                </div>
            </div>
        </motion.div>
    );

    const renderStep1_ApartmentLookup = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-6 pb-12"
        >
            <div className="space-y-5">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-white px-3 py-2 shadow-sm">
                        <Search size={12} className="text-brand" />
                        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-black/40">Apartment search</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-[2rem] font-[1000] text-content uppercase tracking-tighter leading-none">
                            Find your apartment
                        </h2>
                        <p className="max-w-[22rem] text-[11px] font-bold leading-relaxed text-content-subtle">
                            Search your apartment by full name. If it is already registered, it will appear here instantly.
                        </p>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-black/[0.05] bg-white p-4 shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
                    <div className="relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" />
                        <input
                            placeholder="Enter full apartment name"
                            className="w-full rounded-[1.75rem] border border-black/[0.05] bg-gray-50 px-14 py-5 text-[12px] font-[1000] text-black outline-none transition-all placeholder:text-black/25 focus:border-brand/20 focus:bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#faf7f2] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                            {normalizedApartmentSearch.length < 3
                                ? 'Type at least 3 letters to search'
                                : exactRegisteredApartmentResults.length > 0
                                    ? 'Exact registered apartment found'
                                    : step1SearchResults.length > 0
                                        ? 'Search results ready'
                                        : 'No registered apartment matched yet'}
                        </p>
                        {normalizedApartmentSearch.length >= 3 && (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-black/60 shadow-sm">
                                {step1SearchResults.length} result{step1SearchResults.length === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>
                </div>

                {fetchError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">{fetchError}</p>
                    </div>
                )}

                {fetching && normalizedApartmentSearch.length >= 3 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Searching apartments...</span>
                    </div>
                ) : normalizedApartmentSearch.length < 3 ? (
                    <div className="rounded-[2rem] border border-dashed border-black/10 bg-gray-50/70 px-6 py-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
                            <Building className="text-black/15" size={30} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-content">Start with the apartment name</h3>
                        <p className="mt-2 text-[10px] font-bold leading-relaxed text-content-subtle">
                            This page is only for apartment search. Enter the apartment name to continue.
                        </p>
                    </div>
                ) : step1SearchResults.length > 0 ? (
                    <div className="space-y-3">
                        {step1SearchResults.map((apt) => (
                            <motion.button
                                key={apt._id}
                                whileTap={{ scale: 0.985 }}
                                onClick={() => handleApartmentClick(apt)}
                                disabled={registeringApartment}
                                className="w-full rounded-[2rem] border border-black/[0.05] bg-white p-4 text-left shadow-[0_18px_35px_rgba(15,23,42,0.05)] transition-all active:scale-[0.99] disabled:opacity-60"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#faf7f2] text-brand">
                                        {apt.iconUrl ? (
                                            <img
                                                src={apt.iconUrl}
                                                onError={(e) => { e.target.src = '/assets/appartment/default.png'; }}
                                                alt={apt.name}
                                                className="h-full w-full object-contain p-3"
                                            />
                                        ) : (
                                            <Building size={28} />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-[14px] font-[1000] uppercase tracking-tight text-black">{apt.name}</h3>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] ${apt.isSearchFallback ? 'bg-brand/10 text-brand' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {apt.isSearchFallback ? 'New result' : 'Registered'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-start gap-2">
                                            <MapPin size={12} className="mt-0.5 shrink-0 text-brand" />
                                            <p className="line-clamp-2 text-[10px] font-bold leading-relaxed text-black/45">
                                                {typeof apt.location === 'object' ? (apt.location.address || apt.location.full) : (apt.location || 'Apartment address not available yet')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                                        <ChevronRight size={15} strokeWidth={3} />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[2rem] border border-dashed border-brand/20 bg-brand/5 px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand shadow-sm">
                            <Building size={30} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-content">Apartment not found</h3>
                        <p className="mt-2 text-[10px] font-bold leading-relaxed text-content-subtle">
                            No registered apartment matched this name. You can still continue by adding it as a new apartment result.
                        </p>
                        <button
                            onClick={async () => {
                                if (!searchQuery.trim()) {
                                    toast.error('Enter the apartment name first');
                                    return;
                                }

                                const results = await geocodingService.search(searchQuery.trim());
                                if (!results?.length) {
                                    toast.error('Apartment location could not be found');
                                    return;
                                }

                                const mappedApartment = toApartmentSearchCard(results[0], 0);
                                setSearchFallbackResults([mappedApartment]);
                                toast.success('New apartment result added. Tap it to continue.');
                            }}
                            className="mt-5 rounded-2xl bg-black px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-black/10"
                        >
                            Add New Apartment Result
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderStep2_ParkingDetails = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6 pb-20"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <Building size={14} className="text-brand" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">{selectedApartment.name}</span>
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Identify your parking</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">Use the exact vehicle and parking route for reliable daily service.</p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Select your registered vehicle</label>
                    <div className="grid grid-cols-1 gap-2">
                        {vehicles && vehicles.length > 0 ? (
                            <>
                                {vehicles.map((v) => (
                                    <button
                                        key={v._id}
                                        type="button"
                                        onClick={() => setParkingDetails({
                                            ...parkingDetails,
                                            carModel: `${v.brand} ${v.model}`,
                                            carNumber: v.plate || v.plateNumber,
                                            vehicleId: v._id
                                        })}
                                        className={`p-4 rounded-3xl border flex items-center gap-4 transition-all active:scale-[0.98] ${parkingDetails.vehicleId === v._id ? 'border-brand bg-brand/5 shadow-lg shadow-brand/5' : 'border-black/[0.03] bg-white shadow-sm'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${parkingDetails.vehicleId === v._id ? 'bg-brand text-white' : 'bg-gray-50 text-black/20'}`}>
                                            <Car size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-[11px] font-[1000] text-black uppercase tracking-tight">{v.brand} {v.model}</p>
                                            <p className="text-[8.5px] font-black text-black/20 uppercase tracking-[0.2em] mt-1 font-outfit">{v.plate || v.plateNumber}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${parkingDetails.vehicleId === v._id ? 'border-brand bg-brand text-white' : 'border-black/[0.05] bg-transparent'}`}>
                                            {parkingDetails.vehicleId === v._id && <Check size={12} strokeWidth={4} />}
                                        </div>
                                    </button>
                                ))}
                                {/* Add New Option */}
                                <button
                                    type="button"
                                    onClick={() => navigate('/vehicles?from=apartment-wash')}
                                    className="p-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50 flex items-center gap-4 transition-all active:scale-[0.98] hover:border-brand hover:bg-brand/5"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                                        <Plus size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-[11px] font-[1000] text-gray-400 uppercase tracking-tight">Register new vehicle</p>
                                        <p className="text-[8.5px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Add a car to your garage</p>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => navigate('/vehicles?from=apartment-wash')}
                                className="p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-4 text-center group hover:border-brand hover:bg-brand/5 transition-all"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-black/10 group-hover:bg-brand group-hover:text-white transition-all">
                                    <Car size={32} />
                                </div>
                                <div>
                                    <p className="text-[12px] font-[1000] text-black uppercase tracking-tighter">No active vehicles</p>
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mt-1">Please register your vehicle to continue</p>
                                </div>
                                <div className="bg-black text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest mt-2">
                                    Register car
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Level / Floor</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm appearance-none font-outfit"
                                    value={parkingDetails.basement}
                                    onChange={(e) => setParkingDetails({ ...parkingDetails, basement: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    {selectedApartment.metadata?.parkingLevels && selectedApartment.metadata.parkingLevels.length > 0 ? (
                                        selectedApartment.metadata.parkingLevels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="B1">Basement 1</option>
                                            <option value="B2">Basement 2</option>
                                            <option value="Ground">Ground Floor</option>
                                        </>
                                    )}
                                </select>
                                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Block / Tower</label>
                            {selectedApartment.metadata?.blocks && selectedApartment.metadata.blocks.length > 0 ? (
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm appearance-none font-outfit"
                                        value={parkingDetails.block}
                                        onChange={(e) => setParkingDetails({ ...parkingDetails, block: e.target.value })}
                                    >
                                        <option value="">Select Block</option>
                                        {selectedApartment.metadata.blocks.map(block => (
                                            <option key={block} value={block}>{block}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20 pointer-events-none" />
                                </div>
                            ) : (
                                <input
                                    required placeholder="e.g. Tower A"
                                    className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/10 font-outfit"
                                    value={parkingDetails.block}
                                    onChange={(e) => setParkingDetails({ ...parkingDetails, block: e.target.value })}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Pillar / Slot No.</label>
                        <input
                            required
                            placeholder={selectedApartment.metadata?.pillarRange ? `Pillar Range: ${selectedApartment.metadata.pillarRange.min} - ${selectedApartment.metadata.pillarRange.max}` : "e.g. P-102"}
                            type={selectedApartment.metadata?.pillarRange ? "number" : "text"}
                            min={selectedApartment.metadata?.pillarRange?.min}
                            max={selectedApartment.metadata?.pillarRange?.max}
                            className="w-full bg-gray-50/50 border border-black/[0.03] px-5 py-4 rounded-2xl text-[11px] font-[1000] text-black outline-none focus:border-brand/20 shadow-sm uppercase placeholder:text-black/10 font-outfit"
                            value={parkingDetails.pillar}
                            onChange={(e) => setParkingDetails({ ...parkingDetails, pillar: e.target.value })}
                        />
                        {selectedApartment.metadata?.pillarRange && (
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest ml-2">
                                Valid Range: {selectedApartment.metadata.pillarRange.min} to {selectedApartment.metadata.pillarRange.max}
                            </p>
                        )}
                    </div>

                    {/* 🛡️ Protocol Security: Forced Garage Selection */}
                    {/* Manual bypass removed to ensure multiplier-safe bookings */}
                </div>

                <div className="fixed bottom-8 left-5 right-5 z-50">
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                    >
                        Save & continue
                        <ChevronRight size={16} />
                    </button>
                </div>
            </form>
        </motion.div >
    );

    const renderStep3_PlanSelection = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Choose a monthly plan</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">{apartmentService?.description || 'Recurring apartment wash plans for scheduled vehicle care.'}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {plans.length === 0 ? (
                    <div className="bg-white border border-dashed border-black/10 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-black/10">
                            <Calendar size={32} />
                        </div>
                        <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.2em]">No apartment plans are available yet</p>
                    </div>
                ) : plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            setSelectedPlan(plan);
                            setStep(4);
                        }}
                        className={`relative p-6 rounded-[32px] border-2 cursor-pointer transition-all ${plan.popular
                                ? 'bg-gradient-to-br from-neutral-900 via-black to-neutral-800 text-white border-white/5 shadow-2xl shadow-black/20'
                                : 'bg-white text-black border-black/[0.04] shadow-xl shadow-black/[0.02]'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-6 px-4 py-1.5 bg-brand text-black text-[9px] font-[1000] uppercase tracking-[0.2em] rounded-full shadow-lg z-20">
                                Elite choice
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-[1000] uppercase tracking-tighter leading-none">{plan.name}</h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${plan.popular ? 'bg-brand' : 'bg-brand/50'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/40' : 'text-black/30'}`}>
                                        {plan.type && String(plan.type).length < 20 ? plan.type : 'Apartment Plan'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-baseline justify-end gap-0.5">
                                    <span className="text-[32px] font-[1000] leading-none tracking-tighter">₹{plan.price}</span>
                                </div>
                                <p className={`text-[9px] font-[1000] uppercase tracking-widest mt-1.5 font-outfit ${plan.popular ? 'text-white/30' : 'text-black/20'}`}>
                                    PER {String(plan.interval || 'MONTH').toUpperCase().replace('LY', '')}
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-4 pt-5 border-t ${plan.popular ? 'border-white/10' : 'border-black/[0.05]'}`}>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${plan.popular ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <Calendar size={13} className="text-brand" strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-tight">{plan.washes || 10} washes</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className={`text-[11px] font-[1000] uppercase tracking-wide block truncate ${plan.popular ? 'text-white/80' : 'text-black/60'}`}>
                                    {plan.desc || 'Professional recurring apartment wash coverage'}
                                </span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${plan.popular ? 'bg-white/10 text-brand group-active:scale-90' : 'bg-black text-white'}`}>
                                <ArrowRight size={14} strokeWidth={3} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl flex gap-4 items-center">
                <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-tight">Dry-wash-first service protocol designed for clean, repeatable apartment operations.</p>
            </div>
        </motion.div>
    );

    const renderStep4_SlotSelection = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-5 pt-4 space-y-6"
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Choose service slot</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-relaxed">
                    {slotLoading ? 'Checking live slot capacity...' : 'Cluster efficiency target: 10 cars per slot per apartment'}
                </p>
            </div>

            <div className="space-y-3">
                {(slots.length > 0 ? slots : [
                    { id: 'morning', time: '6:00 AM - 9:00 AM', label: 'Morning primary' },
                    { id: 'evening', time: '6:00 PM - 8:00 PM', label: 'Evening optional' }
                ]).map((slot) => {
                    const SlotIcon = Clock
                    return (
                        <motion.button
                            key={slot.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => slot.available !== false && handleSlotSelect(slot)}
                            disabled={slot.available === false}
                            className="w-full bg-white border border-black/[0.03] rounded-3xl p-5 flex items-center justify-between shadow-sm active:bg-gray-50 transition-all text-left relative overflow-hidden group disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-black/20 group-hover:text-brand transition-colors">
                                    <SlotIcon size={26} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{slot.label}</h3>
                                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.15em] mt-1.5 font-outfit">{slot.time}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 relative z-10">
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-[1000] uppercase tracking-widest shadow-sm ${slot.available === false ? 'bg-red-50 text-red-600 shadow-red-500/5' : 'bg-emerald-50 text-emerald-600 shadow-emerald-500/5'}`}>
                                    {slot.available === false ? 'Full' : `${slot.remaining ?? 10} Left`}
                                </div>
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">{slot.time || 'Premium slot'}</span>
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            <div className="p-5 bg-black/95 rounded-2xl text-white space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand">Business rules</h4>
                <ul className="space-y-2">
                    {(businessRules.length > 0 ? businessRules : [
                        'Primary focus on morning 6-9 AM operations',
                        'Sorted workload by Basement -> Block -> Pillar',
                        'Max 10 cars per slot per apartment'
                    ]).map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight text-white/60">
                            <Check size={12} className="text-green-500" /> {rule}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );

    const renderStep5_Confirmation = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 pt-4 space-y-6 pb-32"
        >
            <div className="flex flex-col items-center text-center py-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 border border-green-100 shadow-sm">
                    <ShieldCheck size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-[1000] text-content uppercase tracking-tighter">Review subscription request</h2>
                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mt-1">Confirm your apartment, vehicle, plan, and slot before payment.</p>
            </div>

            <div className="bg-white border border-black/[0.03] rounded-[32px] overflow-hidden shadow-xl">
                <div className="bg-black p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-2 leading-none">Subscription request</p>
                            <h3 className="text-3xl font-[1000] text-white uppercase tracking-tighter leading-none">{selectedPlan.name}</h3>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-2xl font-[1000] text-white tracking-tighter">₹{selectedPlan.price}</span>
                            </div>
                            <p className="text-[9px] font-[1000] text-white/30 uppercase tracking-widest mt-1.5 font-outfit">PER MONTH</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-7 bg-white">
                    <div className="grid grid-cols-2 gap-y-7 gap-x-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Building size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Apartment</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-tight">{selectedApartment.name}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Car size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Vehicle</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{parkingDetails.carModel}</p>
                            <span className="text-[9px] font-black text-brand uppercase tracking-[0.15em] leading-none font-outfit">{parkingDetails.carNumber}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Parking</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{parkingDetails.basement}{' • '}{parkingDetails.block}</p>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none font-outfit">Pillar {parkingDetails.pillar}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-brand" strokeWidth={3} />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none font-outfit">Schedule</p>
                            </div>
                            <p className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none">{selectedSlot.label}</p>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none font-outfit">{selectedSlot.time}</span>
                        </div>
                    </div>

                    <div className="pt-7 border-t border-black/[0.03]">
                        <div className="flex justify-between items-center bg-gray-50/50 p-5 rounded-2xl border border-black/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.03] flex items-center justify-center text-black/20">
                                    <CreditCard size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-black/30 uppercase tracking-widest block leading-none mb-1 font-outfit">Payment Gateway</span>
                                    <span className="text-[11px] font-[1000] text-black uppercase tracking-tight">Razorpay secure</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <ShieldCheck size={14} strokeWidth={3} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-5 right-5 z-50">
                <button
                    onClick={async () => {
                        if (!selectedPlan || !selectedApartment || !selectedSlot) {
                            toast.error('Please complete all subscription steps first.');
                            return;
                        }

                        try {
                            setLoading(true);
                            await validateSelectedApartmentSlot();
                            const keyRes = await getRazorpayKey();
                            if (!keyRes.success) {
                                throw new Error(keyRes.error || 'Failed to load payment gateway');
                            }

                            const razorpayKey = keyRes.data?.key_id || keyRes.data?.key;
                            if (!razorpayKey) {
                                throw new Error('Payment key not available');
                            }

                            const orderRes = await createPaymentOrder(
                                selectedPlan.price,
                                'INR',
                                `apt_sub_${Date.now()}`
                            );
                            if (!orderRes.success) {
                                throw new Error(orderRes.error || 'Failed to create payment order');
                            }

                            const orderData = orderRes.data || {};
                            const orderId = orderData.order_id || orderData.id;
                            const amount = orderData.amount;
                            const currency = orderData.currency || 'INR';
                            if (!orderId || !amount) {
                                throw new Error('Invalid order details from payment gateway');
                            }

                            await loadRazorpayScript();

                            await new Promise((resolve, reject) => {
                                const options = {
                                    key: razorpayKey,
                                    amount,
                                    currency,
                                    name: 'Clean2Wash',
                                    description: `${selectedPlan.name} - Apartment Subscription`,
                                    image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                                    order_id: orderId,
                                    prefill: {
                                        name: user?.name,
                                        email: user?.email,
                                        contact: user?.phone
                                    },
                                    theme: { color: '#F29F05' },
                                    modal: {
                                        ondismiss: () => reject(new Error('Payment cancelled by user'))
                                    },
                                    handler: async (response) => {
                                        try {
                                            const verifyRes = await verifyPayment(
                                                response.razorpay_order_id,
                                                response.razorpay_payment_id,
                                                response.razorpay_signature
                                            );
                                            if (!verifyRes.success) {
                                                throw new Error(verifyRes.error || 'Payment verification failed');
                                            }

                                            const subscriptionPayload = {
                                                planId: selectedPlan._id || selectedPlan.id,
                                                plan: selectedPlan.planKey || selectedPlan.name,
                                                vehicleId: parkingDetails.vehicleId || undefined,
                                                hubId: selectedApartment._id,
                                                serviceKey: apartmentService?.key || 'APARTMENT_WASH',
                                                serviceId: apartmentService?.id || 'apartment-wash',
                                                parkingDetails: {
                                                    basement: parkingDetails.basement,
                                                    block: parkingDetails.block,
                                                    pillar: parkingDetails.pillar,
                                                    carModel: parkingDetails.carModel,
                                                    carNumber: parkingDetails.carNumber
                                                },
                                                slot: selectedSlot.id,
                                                paymentMethod: 'razorpay',
                                                paymentId: response.razorpay_payment_id,
                                                orderId: response.razorpay_order_id,
                                                signature: response.razorpay_signature,
                                                autoRenew: false
                                            };

                                            const subRes = await subscriptionAPI.createSubscription(subscriptionPayload);
                                            if (subRes?.status !== 'success') {
                                                throw new Error(subRes?.message || 'Subscription activation failed');
                                            }

                                            await refreshApartmentSubscription();
                                            if (refreshStats) refreshStats();
                                            toast.success('Apartment wash request sent to admin');
                                            navigate('/apartment-wash', {
                                                replace: true,
                                                state: {
                                                    apartmentActivated: {
                                                        plan: selectedPlan.name,
                                                        price: selectedPlan.price,
                                                        apartment: selectedApartment.name,
                                                        slot: selectedSlot.label,
                                                        status: 'pending'
                                                    }
                                                }
                                            });
                                            resolve(true);
                                        } catch (error) {
                                            reject(error);
                                        }
                                    }
                                };

                                new window.Razorpay(options).open();
                            });
                        } catch (err) {
                            console.error("Payment initialization failed:", err);
                            toast.error(err.message || 'Payment or subscription setup failed');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-3xl font-[1000] text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all overflow-hidden relative group"
                >
                    <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-brand border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span className="relative z-10">Pay & send request</span>
                            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );

    // 🛡️ Safe Render Guard: Never show Asset Management if redirect is imminent
    if (!vehiclesLoading && vehicles && vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" strokeWidth={3} />
                <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] animate-pulse">Initializing direct registry...</p>
            </div>
        );
    }

    return (
        <MobileLayout hideNav={manageMode ? false : step < 5}>
            <div className="bg-white min-h-screen font-sans">
                {/* Header */}
                <header className="px-5 pt-10 pb-6 bg-white sticky top-0 z-40 border-b border-black/[0.03]">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
                            className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                        >
                            <ArrowLeft size={20} className="text-black" strokeWidth={2.5} />
                        </button>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                                <span className="text-[9px] font-[1000] text-black/20 uppercase tracking-[0.3em] leading-none font-outfit">APARTMENT SERVICE</span>
                            </div>
                            <h1 className="text-[13px] font-[1000] text-black uppercase tracking-tight">{apartmentService?.title || 'Apartment Wash'}</h1>
                        </div>
                        <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10">
                            <Building size={20} strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Progress Bar (Apple-Style) */}
                    <div className="mt-8 px-2">
                        <div className="h-[3px] w-full bg-black/5 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <motion.div
                                    key={s}
                                    className="h-full flex-1 rounded-full bg-black"
                                    initial={{ opacity: 0.1, scaleX: 0 }}
                                    animate={{
                                        opacity: s <= step ? 1 : 0.1,
                                        scaleX: s <= step ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4 }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-3 px-0.5">
                            <span className="text-[8px] font-black text-brand uppercase tracking-widest leading-none">Step 0{step}</span>
                            <span className="text-[8px] font-[1000] text-black/20 uppercase tracking-widest leading-none">/ 05</span>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {subscriptionLoading ? (
                        <motion.div
                            key="subscription-loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="min-h-[50vh] flex flex-col items-center justify-center gap-4"
                        >
                            <Loader2 className="w-10 h-10 text-brand animate-spin" strokeWidth={3} />
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Syncing apartment pass...</p>
                        </motion.div>
                    ) : manageMode ? (
                        renderActiveSubscriptionManager()
                    ) : (
                        <>
                            {step === 1 && renderStep1_ApartmentLookup()}
                            {step === 2 && renderStep2_ParkingDetails()}
                            {step === 3 && renderStep3_PlanSelection()}
                            {step === 4 && renderStep4_SlotSelection()}
                            {step === 5 && renderStep5_Confirmation()}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default ApartmentWash;
