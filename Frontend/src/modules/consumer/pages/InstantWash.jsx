import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Zap, Clock, CheckCircle2, ShieldCheck,
    ArrowRight, MapPin, ChevronDown, Car,
    Timer, Rocket, Star, Shield, Navigation,
    Phone, MessageSquare, Droplets, Camera,
    AlertTriangle, History, Search, X, ChevronLeft,
    Check, Info, ChevronRight, Edit3, Settings, Stars,
    Plus, Minus, Gift, Bike, Crown, Play, Calendar, Home, Loader2, Radar, Image, Wallet, ExternalLink, CreditCard, LayoutGrid, CheckCircle, ChevronUp, MinusCircle, AlertCircle, RotateCw
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { useCart } from '../../../context/CartContext';
import { serviceAPI, vehicleAPI, walletAPI, paymentAPI, subscriptionAPI, productAPI, bookingAPI } from '../../../utils/api';
import apiClient from '../../../utils/api';
import { socketService } from '../../../utils/socket';
import MobileLayout from '../components/layout/MobileLayout';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import AddressSelector from '../components/AddressSelector';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import BenefitBadge from '../../../components/common/BenefitBadge';

const PHASES = {
    IDLE: 'IDLE',
    SELECT_VEHICLE: 'SELECT_VEHICLE',
    SERVICE_SELECTION: 'SERVICE_SELECTION',
    FINDING: 'FINDING',
    LIVE_TRACK: 'LIVE_TRACK',
    CART: 'CART',
    SELECT_SLOT: 'SELECT_SLOT',
    PAYMENT: 'PAYMENT',
};

/* Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€ Static Data (from ServiceSelection) Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€Ã¢â‚¬â€ */

// Hardcoded services removed. Will fetch dynamically from DB.
// VEHICLE_TYPES will be fetched dynamically from DB

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
];

const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = FALLBACK_IMAGES[0];
};

const sanitizeUrl = (url) => {
    if (!url) return FALLBACK_IMAGES[0];
    if (typeof url === 'string' && (url.includes('localhost:') || url.includes('127.0.0.1:'))) {
        return FALLBACK_IMAGES[0];
    }
    return url;
};

const JOB_STATES = [
    { id: 'CONFIRMED', label: 'Booking Confirmed', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 'EN_ROUTE', label: 'Captain En Route', icon: Navigation, color: 'text-blue-500' },
    { id: 'WASHING', label: 'Wash In Progress', icon: Droplets, color: 'text-sky-500' },
    { id: 'QUALITY_CHECK', label: 'Quality Check', icon: ShieldCheck, color: 'text-brand' },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
];

const pkgAddonImages = {
    'a1': 'https://plus.unsplash.com/premium_photo-1664303350171-88f6c442cf89?w=400&q=80',
    'a2': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
    'a3': 'https://images.unsplash.com/photo-1599256621730-535171e28e50?w=400&q=80',
    'a4': 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&q=80',
    'p1': 'https://images.unsplash.com/photo-1485291571170-ef41b21fe929?w=400&q=80',
    'p2': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80',
    'p3': 'https://images.unsplash.com/photo-1485291571170-ef41b21fe929?w=400&q=80',
    'p4': 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&q=80',
    'd1': 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
    'd2': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
};

const InstantWash = () => {
    const navigate = useNavigate();
    const {
        vehicles, addBooking, updateBookingStatus, bookings,
        userSubscription, setUserSubscription, getRazorpayKey, createPaymentOrder,
        verifyPayment, getUser, walletBalance, updateBalance, loadWallet,
        isGoldPassMember, isBlackPassMember, globalCatalog, loadGlobalCatalog, catalogLoading,
        addVehicle, vehiclesLoading
    } = useAuth();
    const { savedAddresses: addresses, loading: addressesLoading, primaryAddress, selectedAddress, setSelectedAddress, currentLocation } = useGeoLocation();
    const [searchParams] = useSearchParams();
    const user = getUser('consumer');
    const { cartItems: cart, setCartItems: setCart } = useCart();

    // --- Core UI & Persistence States ---
    const [phase, setPhase] = useState(() => {
        const saved = sessionStorage.getItem('iw_phase');
        return saved || PHASES.SELECT_VEHICLE;
    });

    // --- Phase History Management ---
    const [phaseHistory, setPhaseHistory] = useState([]);

    const navigateToPhase = useCallback((newPhase) => {
        setPhaseHistory(prev => [...prev, phase]);
        setPhase(newPhase);
    }, [phase]);

    const handleBack = useCallback(() => {
        // Explicit phase transitions for robust back navigation (handles page refreshes)
        if (phase === PHASES.CART) {
            setPhase(PHASES.SERVICE_SELECTION);
            return;
        }
        if (phase === PHASES.SELECT_SLOT) {
            setPhase(PHASES.CART);
            return;
        }
        if (phase === PHASES.PAYMENT) {
            setPhase(PHASES.SELECT_SLOT);
            return;
        }

        if (phaseHistory.length > 0) {
            const prevPhase = phaseHistory[phaseHistory.length - 1];
            setPhaseHistory(prev => prev.slice(0, -1));
            setPhase(prevPhase);
        } else {
            // If on main service selection or any other root phase with no history, go home
            if (phase === PHASES.SERVICE_SELECTION || phase === PHASES.SELECT_VEHICLE) {
                navigate('/');
            } else {
                setPhase(PHASES.SERVICE_SELECTION);
            }
        }
    }, [phase, phaseHistory, navigate]);
    const [selectedVehicle, setSelectedVehicle] = useState(() => {
        const saved = sessionStorage.getItem('iw_vehicle');
        if (saved) return JSON.parse(saved);
        return null; // Don't auto-select to force awareness
    });

    // 🛡️ Proactive Redirect: Force users with 0 vehicles to Garaj
    useEffect(() => {
        if (!vehiclesLoading && vehicles && vehicles.length === 0) {
            toast.error('Register your vehicle', { icon: '🚗', id: 'vehicle-registration-toast' });
            const timer = setTimeout(() => navigate('/vehicles?from=instant-wash&mode=add'), 1200);
            return () => clearTimeout(timer);
        }
    }, [vehicles, vehiclesLoading, navigate]);

    // Auto-select first vehicle when vehicles list loads if none selected
    useEffect(() => {
        if (!selectedVehicle && vehicles && vehicles.length > 0) {
            const primary = vehicles.find(v => v.isPrimary) || vehicles[0];
            setSelectedVehicle(primary);
        }
    }, [vehicles, selectedVehicle]);
    const [selectedVehicleType, setSelectedVehicleType] = useState(() => selectedVehicle?.type?.toLowerCase() || 'sedan');

    useEffect(() => {
        if (selectedVehicle?.type) {
            setSelectedVehicleType(selectedVehicle.type.toLowerCase());
        }
    }, [selectedVehicle]);

    const [activeServiceId, setActiveServiceId] = useState('eco');
    const [activeBookingId, setActiveBookingId] = useState(() => {
        return sessionStorage.getItem('iw_active_booking_id') || null;
    });
    const [jobStateIndex, setJobStateIndex] = useState(0);
    const [activeBooking, setActiveBooking] = useState(null);
    const [showDemoVideo, setShowDemoVideo] = useState(false);
    const [showAddServices, setShowAddServices] = useState(false);
    const [showServiceCoverage, setShowServiceCoverage] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [expandedServiceId, setExpandedServiceId] = useState(null);
    const [loadingServices, setLoadingServices] = useState(true);
    const [lastWalletLoad, setLastWalletLoad] = useState(0);

    // Refresh wallet balance when entering Payment phase
    useEffect(() => {
        if (phase === PHASES.PAYMENT && Date.now() - lastWalletLoad > 30000) { // Throttle 30s
            loadWallet();
            setLastWalletLoad(Date.now());
        }
    }, [phase, loadWallet, lastWalletLoad]);
    const [activeVideoUrl, setActiveVideoUrl] = useState('');
    const [videoPlaying, setVideoPlaying] = useState(false);

    // --- Dynamic Data States ---
    const [dynamicServices, setDynamicServices] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [allVehicleModels, setAllVehicleModels] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loadingPromotions, setLoadingPromotions] = useState(true);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [passConfig, setPassConfig] = useState(null);
    const [globalSettings, setGlobalSettings] = useState({
        combo_discount_pct: 20,
        multi_asset_discount_pct: 20
    });

    // --- Booking & Cart States ---
    const [serviceAddons, setServiceAddons] = useState(() => {
        const saved = sessionStorage.getItem('iw_addons');
        return saved ? JSON.parse(saved) : {};
    });
    const [useSubscription, setUseSubscription] = useState(false);
    // Removed local selectedLocation state as it's now global in LocationContext

    const [bookingType, setBookingType] = useState(() => {
        const saved = sessionStorage.getItem('iw_booking_type');
        return saved || 'instant';
    });
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    });
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // --- Tracking & Assets States ---
    const [findingTime, setFindingTime] = useState(0);
    const [searchRetry, setSearchRetry] = useState(0);
    const [captainPos, setCaptainPos] = useState({ lat: 30, lng: 50 });
    const [selectedGlobalModel, setSelectedGlobalModel] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [banners, setBanners] = useState([]);
    const [loadingBanners, setLoadingBanners] = useState(false);

    // --- Helper Functions (Defined before memos/effects that use them) ---
    // --- Core Context Memos & State Dependencies ---
    // Persist critical booking flow state
    useEffect(() => {
        sessionStorage.setItem('iw_phase', phase);
    }, [phase]);

    useEffect(() => {
        if (selectedVehicle) {
            sessionStorage.setItem('iw_vehicle', JSON.stringify(selectedVehicle));
        } else {
            sessionStorage.removeItem('iw_vehicle');
        }
    }, [selectedVehicle]);

    const matchedModel = useMemo(() => {
        if (!selectedVehicle || allVehicleModels.length === 0) return null;
        return allVehicleModels.find(m =>
            m.brand?.toLowerCase() === selectedVehicle.brand?.toLowerCase() &&
            m.model?.toLowerCase() === selectedVehicle.model?.toLowerCase()
        );
    }, [selectedVehicle, allVehicleModels]);

    const getPrice = useCallback((prices, id) => {
        // 1. Calculate Standard Base Price for this Service
        const dynamicService = dynamicServices.find(s => s.id === id || s._id === id);
        let basePrice = 0;

        if (dynamicService?.adjustedPrice) {
            basePrice = dynamicService.adjustedPrice;
        } else if (typeof prices === 'number') {
            basePrice = prices;
        } else if (prices) {
            const type = (selectedVehicleType || selectedVehicle?.type || 'sedan').toLowerCase();
            basePrice = prices[type] || prices['sedan'] || 0;
        }

        // 2. Asset Specific Intelligence Check
        // If the admin has set a "Specific Valuation" (Base Price) for this car model,
        // we calculate a "Luxury Factor" based on the first Express service as reference.
        if (matchedModel?.basePrice > 0 && dynamicServices.length > 0) {
            const referenceService = dynamicServices.find(s => s.category === 'Express') || dynamicServices[0];
            const refPrices = referenceService.price;
            if (refPrices && typeof refPrices === 'object') {
                const type = (selectedVehicle?.type || selectedVehicleType || 'sedan').toLowerCase();
                const standardRefPrice = refPrices[type] || refPrices['sedan'] || 399; // Fallback to 399 if unknown

                // Calculate the multiplier (Factor)
                const assetFactor = matchedModel.basePrice / standardRefPrice;

                // If the service is the reference service itself, just use the set basePrice
                if (id === referenceService.id || id === referenceService._id) {
                    basePrice = matchedModel.basePrice;
                } else {
                    // For other services, apply the luxury asset factor to keep logic dynamic
                    basePrice = basePrice * assetFactor;
                }
            } else {
                // If no reference mapping, fall back to simple override for the main wash
                if (id === referenceService.id || id === referenceService._id) {
                    basePrice = matchedModel.basePrice;
                }
            }
        }

        // 3. Auto-apply Gold Pass discount
        if (isGoldPassMember && passConfig?.discount) {
            basePrice = basePrice * (1 - passConfig.discount);
        }

        return Math.floor(basePrice);
    }, [selectedVehicle, selectedVehicleType, dynamicServices, isGoldPassMember, passConfig, matchedModel]);

    const getEstimatedTime = useCallback((service, model) => {
        // High priority: Specific Session Time for this asset from Admin Catalog
        if (model?.sessionTime > 0) return model.sessionTime;

        // Dynamic Calculation: Service Base + Asset Complexity Multiplier
        // Ensuring base is parsed correctly from strings like "30 min"
        const baseContent = String(service?.duration || '30');
        const base = parseInt(baseContent.replace(/[^\d]/g, '')) || 30;
        const multiplier = model?.difficulty === 'Hard' ? 2 : (model?.difficulty === 'Medium' ? 1.5 : 1);
        return Math.floor(base * multiplier);
    }, []);

    const canUseSubscription = useCallback((serviceId, category, serviceType = 'instant') => {
        if (!isGoldPassMember || !userSubscription) return false;
        
        // Find current plan data
        const plan = subscriptionPlans.find(p => p.id === userSubscription.planId || p._id === userSubscription.planId);
        if (!plan) return false;

        const applicable = plan.applicableServices || [];
        if (applicable.includes('all')) return true;

        // Core Constraint: Hub vs Doorstep Identification
        const activeAddr = selectedAddress || (addresses || []).find(a => a.isPrimary) || (addresses || [])[0];
        const isApartment = !!activeAddr?.hubId || !!activeAddr?.hub;
        const isInstant = serviceType === 'instant';

        // Precise matching mirroring Backend protocol
        return applicable.some(serviceName => {
            if (serviceName === 'Instant wash' || serviceName === 'Studio wash') {
                return (category === 'Doorstep' || category === 'Express') && isInstant && !isApartment;
            }
            if (serviceName === 'Studio wash') {
                return category === 'Studio' || category === 'Studio Detailing';
            }
            if (serviceName === 'Spare driver') {
                return category === 'Chauffeur';
            }
            
            // Fallback: Check if category or serviceId is directly in list
            return category === serviceName || serviceId === serviceName;
        });
    }, [isGoldPassMember, userSubscription, subscriptionPlans, selectedAddress, addresses]);

    const activeService = useMemo(() => {
        if (!dynamicServices || dynamicServices.length === 0) return null;
        const found = dynamicServices.find(s => s.id === activeServiceId || s._id === activeServiceId);
        return found || dynamicServices[0];
    }, [dynamicServices, activeServiceId]);

    const activeServicePrice = useMemo(() => {
        if (!activeService) return 0;
        return getPrice(activeService.price, activeService.id || activeService._id);
    }, [activeService, getPrice]);

    const activeServiceDuration = useMemo(() => {
        if (!activeService) return 30;
        return getEstimatedTime(activeService, matchedModel);
    }, [activeService, matchedModel, getEstimatedTime]);

    const handleCancelBooking = useCallback(async () => {
        if (!activeBookingId) return;
        
        setIsProcessing(true);
        try {
            await bookingAPI.cancelBooking(activeBookingId, "User cancelled search");
            toast.success("Booking cancelled successfully");
            
            // Cleanup
            setActiveBookingId(null);
            setActiveBooking(null);
            sessionStorage.removeItem('iw_active_booking_id');
            setPhase(PHASES.SERVICE_SELECTION);
            setSearchRetry(0);
            setFindingTime(0);
        } catch (err) {
            console.error('Cancel booking error:', err);
            toast.error("Failed to cancel booking. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }, [activeBookingId]);

    const handleBookingSuccess = useCallback((booking) => {
        const newBookingId = booking._id || booking.id;
        setActiveBookingId(newBookingId);
        setActiveBooking(booking);
        addBooking(booking);

        // Persist active booking for session recovery
        sessionStorage.setItem('iw_active_booking_id', newBookingId);

        // Reset timer based on retry count
        setFindingTime(searchRetry === 0 ? 60 : 120);

        // Success state + cart cleanup
        setPhase(PHASES.FINDING);
        setCart([]);
        localStorage.removeItem('clean2wash_cart');
        toast.success("Booking successful!");

        try {
            socketService.connect();
            const userData = getUser('consumer');
            if (userData?._id || userData?.id) socketService.joinUserRoom(userData._id || userData.id);
            socketService.joinBookingRoom(newBookingId);
        } catch (err) {
            console.error('Socket join failed:', err);
        }
    }, [addBooking, getUser, setCart, searchRetry]);

    // --- Phase Recovery & UI Logic ---
    const displayModel = useMemo(() => selectedVehicle?.model || 'Select Vehicle', [selectedVehicle]);
    const displayBrand = useMemo(() => selectedVehicle?.brand || 'CLEAN-2-WASH', [selectedVehicle]);
    const isMatched = useMemo(() => !!matchedModel, [matchedModel]);

    const isVehicleBusy = useCallback(() => {
        if (!selectedVehicle || !bookings) return false;
        const vid = selectedVehicle._id || selectedVehicle.id;
        const today = new Date().toDateString();

        return bookings.some(b => {
             const bvid = b.vehicle?._id || b.vehicle?.id;
             if (bvid !== vid) return false;
             
             const isActive = ['pending', 'confirmed', 'assigned', 'en_route', 'washing', 'in_progress', 'arrived'].includes(b.status);
             if (!isActive) return false;

             if (b.schedule?.type === 'scheduled') {
                 return new Date(b.schedule.date).toDateString() === today;
             }

             return true;
        });
    }, [selectedVehicle, bookings]);

    const categories = useMemo(() => {
        if (!dynamicServices || dynamicServices.length === 0) return [];
        const uniqueCats = [...new Set(dynamicServices.map(s => s.category))];
        return uniqueCats.filter(Boolean);
    }, [dynamicServices]);

    useEffect(() => {
        if (dynamicServices.length > 0 && !expandedServiceId) {
            setExpandedServiceId(dynamicServices[0].id || dynamicServices[0]._id);
        }
    }, [dynamicServices, expandedServiceId]);



    const effectiveItems = useMemo(() => {
        // 🛡️ Data Isolation: ONLY show items currently in the cart for the summary.
        return [...cart];
    }, [cart]);

    const totalCartPrice = useMemo(() => effectiveItems.reduce((sum, item) => sum + Number(item.price || item.salePrice || 0), 0), [effectiveItems]);
    const totalCartDuration = useMemo(() => effectiveItems.reduce((sum, item) => sum + (item.duration || 0), 0), [effectiveItems]);
    const discountAmount = useMemo(() => appliedCoupon?.discountAmount || 0, [appliedCoupon]);

    const filteredPromotions = useMemo(() => {
        if (!promotions) return [];
        return promotions.filter(p =>
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [promotions, searchQuery]);

    const filteredSubscriptionPlans = useMemo(() => {
        if (!subscriptionPlans) return [];
        return subscriptionPlans.filter(p => {
            const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Only show plans relevant to Instant Wash (Daily/Express)
            const isInstantPlan = (p.category === 'Express' || p.category === 'Instant wash' || p.category === 'Doorstep');

            return matchesSearch && isInstantPlan;
        });
    }, [subscriptionPlans, searchQuery]);

    const goldPassPlan = useMemo(() =>
        subscriptionPlans?.find(p => (p.name || p.title || '').toLowerCase().includes('gold')),
        [subscriptionPlans]
    );
    const blackPassPlan = useMemo(() =>
        subscriptionPlans?.find(p => (p.name || p.title || '').toLowerCase().includes('black')),
        [subscriptionPlans]
    );
    const { finalPrice, pricingBreakdown } = useMemo(() => {
        const servicesAndSubs = effectiveItems.filter(item => item.type !== 'product' && item.type !== 'item');
        const productItems = effectiveItems.filter(item => item.type === 'product' || item.type === 'item');
        const subtotal = effectiveItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
        
        let breakdown = [];
        let currentPrice = subtotal;

        // 1. Subscription/Loyalty check
        if (paymentMethod === 'subscription' || paymentMethod === 'loyalty') {
            return { 
                finalPrice: 0, 
                pricingBreakdown: [{ type: 'loyalty', name: 'Loyalty Reward', amount: subtotal, description: '100% Free Wash Applied' }] 
            };
        }

        // 2. Already Subscribed / Active Credits
        const hasActiveCredits = userSubscription && (userSubscription.monthlyCredits > (userSubscription.usedCredits || 0));
        const hasSubscriptionInCart = effectiveItems.some(item => item.type === 'subscription');
        
        if (hasActiveCredits || hasSubscriptionInCart) {
            const qualifyingService = servicesAndSubs.find(item => 
                item.type === 'service' && 
                !item.isAddon && 
                canUseSubscription(item.serviceId, item.category, 'instant')
            );
            if (qualifyingService) {
                const creditSaving = Number(qualifyingService.price || 0);
                if (creditSaving > 0) {
                    currentPrice -= creditSaving;
                    breakdown.push({ 
                        type: 'subscription', 
                        name: hasActiveCredits ? 'Subscription Credit' : 'New Member Benefit', 
                        amount: creditSaving, 
                        description: 'Wash covered by plan' 
                    });
                }
            }
        }

        // 3. Combo Discount
        const washCount = servicesAndSubs.filter(item => item.type === 'service').length;
        if (washCount > 1) {
            const washesTotal = servicesAndSubs.filter(item => item.type === 'service').reduce((s, i) => s + (i.price || 0), 0);
            const comboPct = globalSettings.combo_discount_pct || 5;
            const comboSaving = Math.round(washesTotal * (comboPct / 100));
            currentPrice -= comboSaving;
            breakdown.push({ type: 'combo', name: 'Combo Deal', amount: comboSaving, description: `${comboPct}% Multi-service Discount` });
        }

        // 4. Gold Pass Membership
        const hasGoldPassInCart = effectiveItems.some(item =>
            item.type === 'subscription' && (item.serviceName?.toLowerCase().includes('gold') || item.name?.toLowerCase().includes('gold'))
        );
        const shouldApplyGlobalPass = hasGoldPassInCart || isGoldPassMember;
        const passDiscountRate = passConfig?.discount || 0.3;

        if (shouldApplyGlobalPass) {
            const passSaving = Math.round(currentPrice * passDiscountRate);
            currentPrice -= passSaving;
            if (passSaving > 0) {
                breakdown.push({ 
                    type: 'goldpass', 
                    name: 'Gold Pass', 
                    amount: passSaving, 
                    description: `${Math.round(passDiscountRate * 100)}% Member Discount` 
                });
            }
        }

        // 5. Coupons
        if (discountAmount > 0) {
            const couponSaving = Math.min(discountAmount, currentPrice);
            currentPrice -= couponSaving;
            breakdown.push({ type: 'coupon', name: 'Promo Applied', amount: couponSaving, description: 'Coupon Savings' });
        }

        return { 
            finalPrice: Math.max(0, Math.round(currentPrice)), 
            pricingBreakdown: breakdown 
        };
    }, [effectiveItems, isGoldPassMember, passConfig, userSubscription, globalSettings, paymentMethod, discountAmount]);

    // --- Side Effects ---

    // 1. Core Services Fetching (Depends on Vehicle Type for dynamic multiplier)
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoadingServices(true);
                const vType = selectedVehicle?.type || selectedVehicleType || 'sedan';
                const servRes = await serviceAPI.getServices({ type: 'captain', vehicleType: vType });

                if (servRes.status === 'success') {
                    const allServices = servRes.data.services || [];
                    const filtered = allServices.filter(s =>
                        s.category === 'Express'
                    );
                    setDynamicServices(filtered);

                    if (filtered[0] && !activeServiceId) {
                        setActiveServiceId(filtered[0].id || filtered[0]._id);
                    }
                }
            } catch (err) {
                console.error("InstantWash: Service fetch failed", err);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [selectedVehicle?.type, selectedVehicleType, activeServiceId]);

    // 2. Initial Static Data Fetching
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                setLoadingVehicles(true);
                setLoadingPlans(true);
                setLoadingPromotions(true);
                setLoadingProducts(true);
                setLoadingBanners(true);

                const [vTypeRes, vModelRes, planRes, promoRes, prodRes, bannerRes, homeRes] = await Promise.all([
                    vehicleAPI.getVehicleTypes(),
                    vehicleAPI.getVehicleModels(),
                    serviceAPI.getPlans(),
                    serviceAPI.getPromotions(),
                    productAPI.getProducts({ limit: 8 }),
                    serviceAPI.getBanners({ category: 'Instant Wash' }),
                    serviceAPI.getHomeData()
                ]);

                if (vTypeRes.status === 'success') {
                    setVehicleTypes(vTypeRes.data.vehicleTypes);
                    if (!selectedVehicleType) {
                        setSelectedVehicleType(vTypeRes.data.vehicleTypes[0]?.type?.toLowerCase() || 'sedan');
                    }
                }
                if (vModelRes.status === 'success') setAllVehicleModels(vModelRes.data.vehicleModels);
                if (planRes.status === 'success') setSubscriptionPlans(planRes.data.plans);
                if (promoRes.status === 'success') setPromotions(promoRes.data.cards);
                if (prodRes.status === 'success') setSuggestedProducts(prodRes.data.products);
                if (bannerRes && bannerRes.status === 'success') setBanners(bannerRes.data.banners || []);

                if (homeRes && homeRes.status === 'success' && homeRes.data?.stats) {
                    const passConf = homeRes.data.stats.find(s => s.key === 'WASH_PASS_CONFIG');
                    if (passConf) setPassConfig(passConf.metadata);
                }

                // Fetch Dynamic Instant Wash Config
                try {
                    const configRes = await serviceAPI.getInstantWashConfig();
                    if (configRes.status === 'success') {
                        setGlobalSettings(configRes.data.settings || {});
                        if (configRes.data.plans) setSubscriptionPlans(configRes.data.plans);
                        if (configRes.data.passConfig) setPassConfig(configRes.data.passConfig);
                    }
                } catch (configErr) {
                    console.error("InstantWash: Config fetch failed", configErr);
                }

                loadGlobalCatalog();
            } catch (err) {
                console.error("InstantWash: Static data fetch failed", err);
            } finally {
                setLoadingVehicles(false);
                setLoadingPlans(false);
                setLoadingPromotions(false);
                setLoadingProducts(false);
                setLoadingBanners(false);
                setLoadingConfig(false);
            }
        };
        fetchStaticData();
    }, []);

    // ⚡ Phase Recovery Protocol: Sync Active Booking on Mount ⚡
    useEffect(() => {
        const syncActiveBooking = async () => {
            if (!activeBookingId) return;
            try {
                const res = await serviceAPI.getBooking(activeBookingId);
                if (res.status === 'success' && res.data?.booking) {
                    const booking = res.data.booking;
                    setActiveBooking(booking);
                    
                    // 🚨 Isolated Recovery: Only transition phase if booking matches selected vehicle
                    const bookingVid = (booking.vehicle?._id || booking.vehicle?.id || booking.vehicle)?.toString();
                    const currentVid = (selectedVehicle?._id || selectedVehicle?.id)?.toString();

                    if (bookingVid && currentVid && bookingVid === currentVid) {
                        // Map DB status to UI Phase
                        const dbStatus = booking.status.toLowerCase();
                        if (['pending', 'confirmed', 'accepted'].includes(dbStatus)) {
                            setPhase(PHASES.FINDING);
                        } else if (['assigned', 'en_route', 'arrived', 'before_photo', 'washing', 'in_progress', 'after_photo', 'quality-check'].includes(dbStatus)) {
                            setPhase(PHASES.LIVE_TRACK);
                        } else if (['completed', 'cancelled'].includes(dbStatus)) {
                            // If already done, we just clear and stay on home
                            sessionStorage.removeItem('iw_active_booking_id');
                            setActiveBookingId(null);
                        }
                    } else {
                        console.log("InstantWash: Found active booking for different car, keeping isolated.");
                    }
                } else {
                    // Stale ID found, clear it
                    sessionStorage.removeItem('iw_active_booking_id');
                    setActiveBookingId(null);
                }
            } catch (err) {
                console.error("Failed to sync active booking:", err);
            }
        };
        
        // Connect socket immediately to listen for updates
        socketService.connect();
        if (user?.id) socketService.joinUserRoom(user.id);
        if (activeBookingId) {
            socketService.joinBookingRoom(activeBookingId);
            syncActiveBooking();
        }
    }, []);
    // 2. Auto-apply Coupon from URL
    useEffect(() => {
        const urlCoupon = searchParams.get('coupon');
        if (urlCoupon && !appliedCoupon) {
            handleApplyCoupon(urlCoupon);
        }
    }, [searchParams, dynamicServices, phase]);
    // 3. Real-time Tracking (Socket.IO)
    useEffect(() => {
        if (!activeBookingId) return;

        socketService.connect();
        socketService.joinBookingRoom(activeBookingId);
        if (user?.id) socketService.joinUserRoom(user.id);

        const handleStatusUpdate = (data) => {
            console.log('Spare Driver: Socket Status Update:', data);

            // Normalize status from data.status or data if directly passed
            const newStatus = data.status;

            if (newStatus) {
                // If backend sent the full booking (or updated parts), merge it
                if (data.booking) {
                    setActiveBooking(data.booking);
                } else {
                    // Manual merge of status and provider info if present
                    setActiveBooking(prev => ({
                        ...prev,
                        status: newStatus,
                        provider: data.captain ? { ...prev?.provider, ...data.captain } : prev?.provider,
                        securityPin: data.securityPin || prev?.securityPin
                    }));
                }

                updateBookingStatus(activeBookingId, newStatus);

                // Map DB status to 5-Phase UI State
                let uiStatusId = '';
                const dbStatus = newStatus.toLowerCase();

                if (['pending', 'confirmed', 'accepted'].includes(dbStatus)) {
                    uiStatusId = 'CONFIRMED';
                    // Auto-transition to tracking once confirmed
                    if (phase === PHASES.FINDING) setPhase(PHASES.LIVE_TRACK);
                }
                else if (['assigned', 'pickup-assigned', 'en_route', 'arrived'].includes(dbStatus)) uiStatusId = 'EN_ROUTE';
                else if (['before_photo', 'at-studio', 'washing', 'in_progress', 'after_photo'].includes(dbStatus)) uiStatusId = 'WASHING';
                else if (['quality-check'].includes(dbStatus)) uiStatusId = 'QUALITY_CHECK';
                else if (['ready-for-delivery', 'delivery-assigned', 'completed'].includes(dbStatus)) uiStatusId = 'COMPLETED';

                const idx = JOB_STATES.findIndex(s => s.id === uiStatusId);
                if (idx !== -1) setJobStateIndex(idx);

                if (['completed', 'cancelled'].includes(newStatus)) {
                    toast.success(`Booking ${newStatus}!`);
                    if (newStatus === 'completed') {
                        setTimeout(() => {
                            setPhase(PHASES.SERVICE_SELECTION);
                            setActiveBookingId(null);
                        }, 5000);
                    } else {
                        setPhase(PHASES.SERVICE_SELECTION);
                        setActiveBookingId(null);
                    }
                }
            }
        };

        const handleLocationUpdate = (data) => {
            const lat = data?.lat ?? data?.location?.lat;
            const lng = data?.lng ?? data?.location?.lng;
            if (lat && lng) {
                setCaptainPos({ lat: parseFloat(lat), lng: parseFloat(lng) });
            }
        };

        socketService.on('booking_status_updated', handleStatusUpdate);
        socketService.on('locationUpdate', handleLocationUpdate);
        socketService.on('location_updated', handleLocationUpdate);

        return () => {
            socketService.off('booking_status_updated', handleStatusUpdate);
            socketService.off('locationUpdate', handleLocationUpdate);
            socketService.off('location_updated', handleLocationUpdate);
            socketService.disconnect();
        };
    }, [activeBookingId, user?.id, updateBookingStatus]);

    // 3. Finding Phase Fallback Timer
    useEffect(() => {
        let timer;
        if (phase === PHASES.FINDING && activeBookingId) {
            // Initialize timer only if it's currently 0 to prevent reset on re-renders
            if (findingTime === 0 && !isProcessing) {
                setFindingTime(searchRetry === 0 ? 60 : 120);
            }

            timer = setInterval(() => {
                setFindingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        // If it was the second attempt (120s), redirect to home
                        if (searchRetry > 0) {
                            setTimeout(() => {
                                handleCancelBooking(); // Cleanup & sync
                                navigate('/');
                            }, 3000);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (phase !== PHASES.FINDING) {
            setFindingTime(0);
        }
        return () => clearInterval(timer);
    }, [phase, searchRetry, activeBookingId]);

    // 4. Persistence & Session Recovery
    useEffect(() => {
        sessionStorage.setItem('iw_phase', phase);
        if (selectedVehicle) sessionStorage.setItem('iw_vehicle', JSON.stringify(selectedVehicle));
        if (selectedAddress) sessionStorage.setItem('iw_location', JSON.stringify(selectedAddress));
        sessionStorage.setItem('iw_addons', JSON.stringify(serviceAddons));
        sessionStorage.setItem('iw_booking_type', bookingType);
        if (activeBookingId) sessionStorage.setItem('iw_active_booking_id', activeBookingId);
    }, [phase, selectedVehicle, selectedAddress, serviceAddons, bookingType, activeBookingId]);

    useEffect(() => {
        const recoverSession = async () => {
            const savedId = sessionStorage.getItem('iw_active_booking_id');
            if (savedId && !activeBookingId) {
                console.log('Spare Driver: Attempting session recovery for:', savedId);
                try {
                    const res = await apiClient.getBooking(savedId);
                    if (res?.status === 'success' && res?.data?.booking) {
                        const b = res.data.booking;
                        
                        // 💎 Isolated Recovery Logic: Only recover if it matches 'captain' (Instant/Express) type
                        if (b.service?.type !== 'captain') {
                            console.log('Spare Driver: Active booking is not an Instant/Express service, skipping recovery on this page.');
                            return;
                        }

                        setActiveBookingId(savedId);
                        setActiveBooking(b);
                        if (['pending'].includes(b.status)) setPhase(PHASES.FINDING);
                        else if (['confirmed', 'en_route', 'at-studio', 'in_progress'].includes(b.status)) setPhase(PHASES.LIVE_TRACK);
                    }
                } catch (err) {
                    console.error('Session recovery failed:', err);
                    // If the booking no longer exists, clear the stale session ID
                    if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
                        console.log('Spare Driver: Clearing stale booking session');
                        sessionStorage.removeItem('iw_active_booking_id');
                        sessionStorage.removeItem('iw_phase'); // Reset to root phase
                        setActiveBookingId(null);
                        setPhase(PHASES.SELECT_VEHICLE);
                    }
                }
            }
        };
        recoverSession();
    }, [activeBookingId]);

    // --- Action Handlers ---
    const handleInstantWash = () => {
        if (!selectedVehicle) {
            toast.error('Register your vehicle in Garaj first!');
            setTimeout(() => navigate('/vehicles?from=instant-wash'), 1000);
            return;
        }

        const basePrice = getPrice(activeService.price, activeService.id);
        const selectedAddonIds = serviceAddons[activeServiceId] || [];
        const addonsPrice = (activeService.addons || [])
            .filter(a => selectedAddonIds.includes(a.id) && !a.included)
            .reduce((sum, a) => sum + a.price, 0);

        const newItem = {
            id: Date.now(),
            serviceId: activeServiceId,
            serviceName: activeService.title,
            category: activeService.category,
            price: basePrice + addonsPrice,
            duration: getEstimatedTime(activeService, matchedModel),
            vehicleId: selectedVehicle?.id || selectedVehicle?._id,
            vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
            vehicleImg: selectedVehicle.img,
            type: 'service',
            addons: selectedAddonIds
        };

        // 🚀 Fresh Start: Clear previous services to avoid duplicates
        setCart([newItem]);
        setPhase(PHASES.CART);
    };



    const handleApplyCoupon = async (specificCode) => {
        const codeToApply = (specificCode || couponCode || '').trim().toUpperCase();
        if (!codeToApply) return;

        // Frontend Anti-Stacking Alert
        if (isBlackPassMember) {
            setCouponError("Premium member benefits are active. Non-stacking policy: Additional coupons cannot be combined with subscription discounts.");
            return;
        }
        try {
            const activeServiceName = effectiveItems.find(i => i.serviceId)?.serviceName || 'Instant Wash';
            const res = await serviceAPI.validateCoupon(codeToApply, totalCartPrice, activeServiceName);
            if (res.status === 'success') {
                setAppliedCoupon(res.data.coupon);
                setCouponCode(res.data.coupon.code);
                setCouponError('');
            } else {
                setCouponError(res.message || 'Invalid coupon code');
                setAppliedCoupon(null);
            }
        } catch (err) {
            setCouponError(err.message || 'Error validating coupon');
            setAppliedCoupon(null);
        }
    };



    const renderServiceSelection = () => {
        const currentAddons = serviceAddons[activeServiceId] || [];
        const basePrice = getPrice(activeService?.price, activeService?.id);
        const addonTotal = (activeService?.addons || [])
            .filter(a => currentAddons.includes(a.id) && !a.included)
            .reduce((sum, a) => sum + (a.price || 0), 0);
        const totalPrice = basePrice + addonTotal;

        return (
            <div className="bg-white/[0.05] min-h-screen pb-20 font-sans">
                {/* Personalized Header Section */}
                <div className="px-5 pt-10 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="w-11 h-11 rounded-2xl bg-white/5 border border-black/[0.04] shadow-lg flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
                        >
                            <ChevronLeft size={22} strokeWidth={3} />
                        </button>
                        <div>
                            <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em] mb-1.5">Station 01 / LIVE</p>
                            <h1 className="text-2xl font-[1000] text-white leading-none uppercase tracking-tighter">
                                Instant Wash
                            </h1>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-black/[0.03]  flex items-center justify-center">
                        <Stars size={18} className="text-brand" />
                    </div>
                </div>

                {/* Live Status Pulse */}
                <div className="px-5 pb-4">
                    <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-xl px-4 py-2.5 border border-black/[0.02] shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Live Ops Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Radar size={12} className="text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-[1000] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">6 Captains in 3km Radius</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Banner Section */}
                <div className="px-5 pt-2">
                    {banners && banners.length > 0 ? (
                        <div className="relative h-36 rounded-3xl overflow-hidden shadow-lg border border-white">
                            <img src={sanitizeUrl(banners[0].image)} className="w-full h-full object-cover" alt="Offers" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                                <h3 className="text-white text-base font-black uppercase leading-none">{banners[0].title || "Luxury Protocol"}</h3>
                                <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-1">{banners[0].subtitle || "Exclusive Studio Grade Experience"}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative h-36 rounded-3xl overflow-hidden shadow-lg bg-black group">
                            <img
                                src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80"
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                alt="Standard Banner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-end p-5">
                                <span className="w-6 h-1 bg-brand mb-2.5" />
                                <h3 className="text-white text-lg font-[1000] uppercase leading-none tracking-tighter">Instant Studio Wash</h3>
                                <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.3em] mt-2">Zero Wait Time Policy</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected Vehicle Context (Professional simplified) */}
                <div className="px-5 pt-6 pb-2">
                    <div className="bg-white/5 rounded-[2rem] p-4 flex items-center justify-between border-white/5 border-brand shadow-[0_15px_40px_rgba(242,159,5,0.12)] relative overflow-hidden group active:scale-[0.98] transition-all duration-300">
                        {selectedVehicle ? (
                            <div className="flex items-center gap-4 relative z-10 w-full">
                                <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-black/[0.05] shadow-inner overflow-hidden flex-shrink-0">
                                    <img 
                                        src={sanitizeUrl(selectedVehicle.img || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80')} 
                                        className="w-full h-full object-cover" 
                                        alt={selectedVehicle.model} 
                                        onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png'}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[17px] font-[1000] text-white tracking-tighter leading-none uppercase truncate">
                                        {selectedVehicle.brand} {selectedVehicle.model}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">{selectedVehicle.plate || 'No Plate'}</span>
                                        <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                                        <span className="text-[8px] font-[1000] text-emerald-500 uppercase tracking-tighter">Garaj Sync Active</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/vehicles?from=instant-wash')}
                                    className="bg-black text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] active:scale-90 transition-all shadow-2xl shadow-black/50 shadow-black/10 flex-shrink-0"
                                >
                                    CHANGE
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 relative z-10 w-full opacity-60">
                                <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-black/[0.02]">
                                    <Car size={32} className="text-white/20" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[15px] font-[1000] text-white tracking-tight leading-none uppercase">Select Asset</h4>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">No car selected</p>
                                </div>
                                <button
                                    onClick={() => navigate('/vehicles?from=instant-wash')}
                                    className="bg-brand text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20"
                                >
                                    SELECT
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wash Packages List (Individual Service Accordions) */}
                <div className="px-4 py-2 space-y-4">
                    {loadingServices && dynamicServices.length === 0 ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 size={32} className="text-brand animate-spin" />
                        </div>
                    ) : (
                        dynamicServices.filter(s => s.category === 'Express').map((pkg) => {
                            const pkgId = pkg.id || pkg._id;
                            const isServiceExpanded = expandedServiceId === pkgId;
                            const pkgBasePrice = getPrice(pkg.price, pkgId);
                            const splitImages = [
                                sanitizeUrl(pkg.image),
                                'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
                                'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80'
                            ];

                            return (
                                <div key={pkgId} className="space-y-4">
                                    <div
                                        onClick={() => setExpandedServiceId(isServiceExpanded ? null : pkgId)}
                                        className={`px-5 py-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isServiceExpanded ? 'bg-[#222222] text-white' : 'bg-white/5 text-white border border-black/[0.03] '}`}
                                    >
                                        <h3 className="text-[13px] font-[1000] tracking-tight uppercase">{pkg.title}</h3>
                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isServiceExpanded ? 'rotate-180 text-brand' : 'opacity-40'}`} />
                                    </div>

                                    <AnimatePresence>
                                        {isServiceExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-white/5 rounded-3xl border border-black/[0.03] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.05)] mb-4"
                                            >
                                                {/* Diagonal Image Split Section */}
                                                <div className="relative h-[110px] flex overflow-hidden">
                                                    <div className="flex-1 relative">
                                                        <img src={splitImages[0]} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                                                    </div>
                                                    <div className="absolute left-[35%] top-0 bottom-0 w-[40%] skew-x-[-15deg] border-x-[6px] border-white overflow-hidden shadow-2xl z-10 bg-white/5">
                                                        <img src={splitImages[1]} className="w-full h-full object-cover skew-x-[15deg] scale-150" alt="" />
                                                    </div>
                                                    <div className="flex-1 relative group">
                                                        <img src={splitImages[2]} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 rounded text-white text-[10px] font-black shadow-lg">
                                                            {selectedVehicle?.brand || 'BMW'}
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1 bg-brand" />)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rating & Price Stats */}
                                                <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.02]">
                                                    <div className="flex items-center gap-3">
                                                        <Star size={18} fill="#F29F05" className="text-brand" />
                                                        <span className="text-base font-[1000] text-white leading-none">{pkg.rating || "4.9"}</span>
                                                        <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                                                        <span className="text-xs font-bold text-black/30 tracking-tight">2,530 Ratings</span>
                                                        {pkg.tag && (
                                                            <span className="ml-2 px-2 py-0.5 bg-black text-white text-[7px] font-black rounded uppercase tracking-widest">{pkg.tag}</span>
                                                        )}
                                                    </div>

                                                    <div className="bg-[#FAF1E8] px-5 py-2 rounded-xl border border-[#EBE0D5] text-center ">
                                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Starting</p>
                                                        <span className="text-[20px] font-[1000] text-white leading-none">₹{pkgBasePrice}</span>
                                                    </div>
                                                </div>

                                                {/* BLACK Pass Upsell */}
                                                <div className="bg-brand/5 px-6 py-3 border-b border-black/[0.02] flex items-center justify-center">
                                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
                                                        {passConfig?.marketingLine || "Save up to 40% on every service"} with <span className="font-[1000] text-white">{passConfig?.title || 'clean2wash BLACK'}</span>
                                                    </p>
                                                </div>

                                                {/* Package Content */}
                                                <div className="p-5 pt-4 space-y-5">
                                                    {pkg.features && pkg.features.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {pkg.features.slice(0, 3).map((feat, i) => (
                                                                <div key={i} className="flex items-center gap-1.5 bg-white/[0.02] px-3 py-1.5 rounded-full border border-black/[0.02]">
                                                                    <div className="w-1 h-1 rounded-full bg-brand" />
                                                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-tight">{feat.text}</span>
                                                                </div>
                                                            ))}
                                                            {pkg.features.length > 3 && <span className="text-[9px] font-black text-brand self-center ml-1">+{pkg.features.length - 3} MORE</span>}
                                                        </div>
                                                    )}

                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1 space-y-4">
                                                            <div>
                                                                <h4 className="text-[12px] font-[1000] text-white uppercase tracking-widest leading-none mb-1">Personalize Wash</h4>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveServiceId(pkgId);
                                                                        setShowServiceCoverage(true);
                                                                    }}
                                                                    className="text-brand text-[10px] font-black uppercase tracking-[0.2em] border-b border-brand/20"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>

                                                            <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-100/30">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
                                                                    <p className="text-[10px] font-bold text-white/60 leading-relaxed">
                                                                        <span className="text-white font-black uppercase tracking-tight">Pro Tip:</span> {pkg.adminNote || 'Add Interior Cleaning to remove deep-seated dust and allergens.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Promo Card */}
                                                        <div className="w-[115px] flex-shrink-0 bg-[#FAF1E8] rounded-2xl border border-[#E9DCCF]/50 p-3.5 flex flex-col items-center gap-3.5  relative overflow-hidden group">
                                                            <img
                                                                src={sanitizeUrl(pkg.image)}
                                                                className="w-14 h-14 object-cover rounded-xl shadow-2xl shadow-black/40 border-white/5 border-white group-hover:scale-110 transition-transform"
                                                                alt={pkg.title}
                                                                onError={(e) => e.target.src = FALLBACK_IMAGES[0]}
                                                            />
                                                            <div className="text-center">
                                                                <p className="text-[#2D9944] font-black text-[10px] uppercase leading-tight">Service at</p>
                                                                <p className="text-[#2D9944] font-[1000] text-xl leading-none">₹20</p>
                                                                <p className="text-[7px] font-black text-black/30 uppercase tracking-widest leading-none mt-1">/ Wash</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (pkg.videoUrl) {
                                                                        setActiveVideoUrl(pkg.videoUrl);
                                                                        setVideoPlaying(true);
                                                                    } else {
                                                                        setShowDemoVideo(true);
                                                                    }
                                                                }}
                                                                className="w-10 h-10 bg-[#FF4B91] rounded-full flex items-center justify-center shadow-lg shadow-pink-200 active:scale-90 transition-transform"
                                                            >
                                                                <Play size={14} fill="white" className="text-white ml-0.5" />
                                                            </button>
                                                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Learn More</span>
                                                        </div>
                                                    </div>

                                                    {/* Main CTA */}
                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            if (!selectedVehicle) {
                                                                toast.error('Register your vehicle in Garaj first!');
                                                                setTimeout(() => navigate('/vehicles?from=instant-wash'), 1000);
                                                                return;
                                                            }

                                                            if (isVehicleBusy()) {
                                                                toast.error(`This vehicle already has an active booking for today. Please finish it first! 🚗`);
                                                                return;
                                                            }

                                                            setActiveServiceId(pkgId);
                                                            setShowServiceCoverage(true);
                                                        }}
                                                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 group/btn relative overflow-hidden transition-all ${selectedVehicle
                                                            ? 'bg-[#1A1A1A] text-white active:scale-95 shadow-2xl shadow-black/50 shadow-black/10'
                                                            : 'bg-brand text-white shadow-2xl shadow-black/50 shadow-brand/20'
                                                            }`}
                                                    >
                                                        {selectedVehicle ? (
                                                            <>
                                                                <div className="absolute inset-0 bg-brand opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                                                                <Zap size={16} className="text-brand" fill="currentColor" />
                                                                <span className="text-[13px] font-[1000] uppercase tracking-[0.1em]">Select Asset & Book</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Car size={16} className="animate-bounce" />
                                                                <span className="text-[13px] font-[1000] uppercase tracking-[0.1em]">Register Vehicle to Book</span>
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </div>

                                                {/* Footer Stats (Mini) */}
                                                <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-center gap-8 border-t border-black/[0.02]">
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={12} className="text-white/20" />
                                                        <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">Sanitized</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle size={12} className="text-white/20" />
                                                        <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">Verified</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-white/20" />
                                                        <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">On-Time</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}


                    {/* Studio Shorts - YouTube Shorts Style Video Grid (Full Width) */}
                    <div className="pt-8 pb-10 overflow-hidden">
                        <div className="flex items-center justify-between mb-5 px-4">
                            <div className="flex flex-col">
                                <h3 className="text-[17px] font-[1000] text-white uppercase tracking-tight leading-none mb-1.5">Instant Wash Stories</h3>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Elite detailing in motion</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
                                <Play size={14} fill="currentColor" className="ml-0.5" />
                            </div>
                        </div>
                        
                        <div className="flex gap-[6px] overflow-x-auto no-scrollbar snap-x snap-mandatory px-2">
                            {(dynamicServices && dynamicServices.length > 0 ? dynamicServices : [
                                { title: 'Premium Wash', videoUrl: 'https://assets.mixkit.io/videos/preview/mixkit-hand-washing-a-car-with-a-sponge-and-foam-1582-large.mp4', image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80' },
                                { title: 'Studio Detailing', videoUrl: 'https://assets.mixkit.io/videos/preview/mixkit-hand-washing-a-car-with-a-sponge-and-foam-1582-large.mp4', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80' },
                                { title: 'Eco Armor', videoUrl: 'https://assets.mixkit.io/videos/preview/mixkit-hand-washing-a-car-with-a-sponge-and-foam-1582-large.mp4', image: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80' }
                            ]).map((sv, idx) => (
                                <motion.div
                                    key={idx}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        if (sv.videoUrl) {
                                            setActiveVideoUrl(sv.videoUrl);
                                            setVideoPlaying(true);
                                        } else {
                                            setShowDemoVideo(true);
                                        }
                                    }}
                                    className="flex-shrink-0 w-[145px] aspect-[9/16] bg-black rounded-2xl relative overflow-hidden snap-start group shadow-2xl shadow-black/10 border border-black/[0.05]"
                                >
                                    {/* Auto-playing Preview (Consistent with YouTube Shorts) */}
                                    {sv.videoUrl && sv.videoUrl.includes('.mp4') ? (
                                        <video 
                                            autoPlay 
                                            muted 
                                            loop 
                                            playsInline 
                                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                        >
                                            <source src={sv.videoUrl} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img 
                                            src={sanitizeUrl(sv.image || sv.img || FALLBACK_IMAGES[0])} 
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" 
                                            alt={sv.title} 
                                        />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                    
                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[6px] font-black text-white uppercase tracking-widest leading-none">PREVIEW</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-4 left-3 right-3">
                                        <h4 className="text-white text-[12px] font-[1000] uppercase tracking-tight leading-tight mb-1 content-center line-clamp-2">{sv.title || sv.serviceName}</h4>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Play size={8} fill="white" className="text-white" />
                                            <span className="text-white text-[7px] font-black uppercase tracking-widest">Watch Full</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {/* Empty spacer to allow snapping to end correctly */}
                            <div className="flex-shrink-0 w-3" />
                        </div>
                    </div>

                    {/* Dynamic FAQ Section */}
                    {dynamicServices.some(s => s.faqs?.length > 0) && (
                        <div className="px-1 py-8 space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Protocol intelligence</h3>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-brand" />
                                    <div className="w-3 h-1 rounded-full bg-brand/20" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {dynamicServices.flatMap(s => s.faqs || []).slice(0, 4).map((faq, i) => (
                                    <details key={i} className="group bg-white/5 rounded-[1.5rem] border border-black/[0.02] overflow-hidden  transition-all duration-300 open:shadow-2xl shadow-black/40">
                                        <summary className="list-none px-6 py-4 flex items-center justify-between cursor-pointer active:bg-white/[0.02] transition-colors">
                                            <span className="text-[11px] font-black text-white tracking-tight">{faq.question}</span>
                                            <ChevronDown size={14} className="text-white/20 group-open:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="px-6 pb-6 pt-2">
                                            <div className="h-px w-full bg-black/[0.02] mb-4" />
                                            <p className="text-[11px] font-bold text-white/40 leading-relaxed tracking-tighter">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic 'Why Us' Section */}
                    <div className="px-1 py-6 space-y-6">
                        <div className="text-center space-y-1">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1.5">The studio standard</h3>
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-px w-8 bg-white/10" />
                                <Stars size={12} className="text-brand" />
                                <div className="h-px w-8 bg-white/10" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: Shield, label: "Studio grade", sub: "Premium protocol" },
                                { icon: Timer, label: "30 Min avg", sub: "Execution speed" },
                                { icon: Zap, label: "Live track", sub: "Real-time ops" },
                                { icon: CreditCard, label: "Secure pay", sub: "Protocol ensured" }
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 rounded-[1.5rem] p-4 border border-black/[0.02]  flex flex-col items-center text-center gap-3">
                                    <div className="w-9 h-9 bg-white/[0.02] rounded-xl flex items-center justify-center">
                                        <item.icon size={16} className="text-black/80" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white leading-none tracking-tight mb-1">{item.label}</p>
                                        <p className="text-[8px] font-bold text-black/30 uppercase tracking-widest">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Service Coverage Details Modal */}
                <AnimatePresence>
                    {showServiceCoverage && activeService && (
                        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowServiceCoverage(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-lg bg-white/5 rounded-t-3xl flex flex-col max-h-[95vh] shadow-2xl overflow-hidden font-sans"
                            >
                                {/* Modal Header */}
                                <div className="relative pt-2 pb-6">
                                    {/* Premium Offer Banner */}
                                    {activeService.offers?.length > 0 && (
                                        <div className="overflow-hidden bg-[#1A1A1A] relative h-8 flex items-center mb-5">
                                            <motion.div
                                                animate={{ x: [0, -500] }}
                                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                                className="flex whitespace-nowrap gap-10"
                                            >
                                                {[1, 2, 3].map(n => (
                                                    <div key={n} className="flex gap-10">
                                                        {activeService.offers.map((offer, idx) => (
                                                            <div key={idx} className="flex items-center gap-3">
                                                                <Star size={10} className="text-brand" fill="currentColor" />
                                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                                    {offer.text} {offer.code && <span className="text-brand ml-2">[{offer.code}]</span>}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </motion.div>
                                            <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10" />
                                            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10" />
                                        </div>
                                    )}

                                    <div className="px-6 relative">
                                        <button
                                            onClick={() => setShowServiceCoverage(false)}
                                            className="absolute -top-1 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all z-20"
                                        >
                                            <X size={18} strokeWidth={3} />
                                        </button>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-black text-white px-2 py-1 rounded-md flex items-center gap-1.5">
                                                <Zap size={10} className="text-brand" fill="currentColor" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{activeService.tag || 'Premium'}</span>
                                            </div>
                                            <div className="h-4 w-px bg-white/10" />
                                            <span className="text-[9px] font-[1000] text-white/40 uppercase tracking-widest">Protocol sync locked</span>
                                        </div>

                                        <h2 className="text-3xl font-[1000] text-white leading-[0.9] uppercase tracking-tighter mb-5 relative">
                                            {activeService.title}
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: 44 }}
                                                className="absolute -bottom-1.5 left-0 h-1 bg-brand"
                                            />
                                        </h2>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/[0.02]/80 backdrop-blur-sm rounded-[1.5rem] p-4 border border-black/[0.02] flex flex-col justify-between h-24">
                                                <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.15em] leading-none mb-1">Execution protocol</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[24px] font-[1000] text-white leading-none">{activeServiceDuration}</span>
                                                    <span className="text-[11px] font-black text-white/40 uppercase tracking-tighter">mins</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                    <span className="text-[7px] font-black text-black/30 uppercase tracking-widest">
                                                        {matchedModel?.difficulty ? `${matchedModel.difficulty} protocol` : 'Studio calibrated'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-brand/5 backdrop-blur-sm rounded-[1.5rem] p-4 border border-brand/10 flex flex-col justify-between h-24">
                                                <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.15em] leading-none mb-1">Session valuation</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[24px] font-[1000] text-white leading-none">₹{activeServicePrice}</span>
                                                    <span className="text-[9px] font-black text-brand uppercase tracking-tighter">Total</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={10} className="text-brand" />
                                                    <span className="text-[7px] font-black text-black/30 uppercase tracking-widest">Secured node</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Coverage Content */}
                                <div className="flex-1 overflow-y-auto px-6 pb-28 no-scrollbar space-y-8">
                                    {/* Vehicle Catalog Intelligence Integration */}
                                    {matchedModel && (
                                        <div className="mt-4 space-y-6">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Car size={13} className="text-brand" />
                                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Vehicle Intelligence</h3>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                                                    <LayoutGrid size={9} className="text-white/40" />
                                                    <span className="text-[7px] font-[1000] text-white/60 uppercase tracking-widest">{matchedModel.brand} Protocol</span>
                                                </div>
                                            </div>

                                            {/* Brand & Model Designation Card */}
                                            <div className="bg-black text-white p-5 rounded-3xl relative overflow-hidden shadow-2xl shadow-black/20 group">
                                                <div className="absolute right-[-10%] top-[-20%] w-40 h-40 bg-brand/10 rounded-full blur-3xl group-hover:bg-brand/20 transition-all duration-700" />
                                                <div className="relative z-10 flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shadow-inner shrink-0 scale-95 group-hover:scale-100 transition-transform duration-500">
                                                        <img
                                                            src={sanitizeUrl(matchedModel.image)}
                                                            className="w-full h-full object-cover"
                                                            alt={matchedModel.model}
                                                            onError={handleImageError}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Asset Identification</p>
                                                        <h4 className="text-[18px] font-[1000] uppercase leading-none tracking-tight">
                                                            {matchedModel.brand} <span className="text-brand">{matchedModel.model}</span>
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                                                                <Stars size={10} className="text-brand" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest">{matchedModel.type}</span>
                                                            </div>
                                                            <div className="h-3 w-px bg-white/10" />
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">ID: {matchedModel._id?.slice(-8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Complexity & Offer Matrix */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/[0.02] p-4 rounded-2xl border border-black/[0.02]">
                                                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest mb-2.5">Complexity Index</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${matchedModel.difficulty === 'Hard' ? 'bg-red-500' : matchedModel.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                                        <span className="text-[13px] font-[1000] text-white uppercase">{matchedModel.difficulty || 'Standard'}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white/[0.02] p-4 rounded-2xl border border-black/[0.02]">
                                                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest mb-2.5">Prep Protocol</p>
                                                    <div className="flex items-center gap-2">
                                                        <Timer size={13} className="text-white/40" />
                                                        <span className="text-[13px] font-[1000] text-white uppercase">{matchedModel.protocolSteps?.length || 0} Steps</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Identify Highlights */}
                                            {matchedModel.features?.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Identity Highlights</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {matchedModel.features.map((feat, idx) => (
                                                            <div key={idx} className="bg-[#FAF1E8] border border-[#E9DCCF] px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                                                                <CheckCircle2 size={11} className="text-brand" />
                                                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">{feat}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Offer Protocols & Coupons */}
                                            {(matchedModel.offers?.length > 0 || matchedModel.coupons?.length > 0) && (
                                                <div className="bg-brand/5 border border-brand/10 rounded-[2rem] p-5 space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Gift size={15} className="text-brand" />
                                                        <h4 className="text-[11px] font-[1000] text-white uppercase tracking-widest leading-none">Offer protocols</h4>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {matchedModel.offers?.map((offer, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-brand/5">
                                                                <div>
                                                                    <p className="text-[10px] font-[1000] text-white uppercase tracking-tight">{offer.title || 'Launch offer'}</p>
                                                                    <p className="text-[8px] font-bold text-black/30 uppercase tracking-widest">{offer.description || 'Dynamic discount applied'}</p>
                                                                </div>
                                                                <div className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black">
                                                                    -{offer.discountPercentage || 10}%
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {matchedModel.coupons?.map((coupon, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-black text-white p-3.5 rounded-[1.5rem] group active:scale-95 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center border border-brand/20">
                                                                        <Zap size={14} className="text-brand" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-[1000] uppercase tracking-widest">{coupon}</p>
                                                                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">Asset specific coupon</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setCouponCode(coupon);
                                                                        toast.success("Coupon protocol loaded");
                                                                    }}
                                                                    className="bg-brand text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Model Prep Protocol Steps */}
                                            {matchedModel.protocolSteps?.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <Shield size={14} className="text-emerald-500" />
                                                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Model Prep Protocol</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {matchedModel.protocolSteps.map((step, idx) => (
                                                            <div key={idx} className="bg-white/5 border border-black/[0.03] p-4 rounded-3xl flex items-center gap-4 group">
                                                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">
                                                                    {idx + 1}
                                                                </div>
                                                                <p className="text-[11px] font-[1000] text-white uppercase tracking-tight">{step}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Radar size={14} className="text-brand" />
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Scope of Maintenance</h3>
                                            </div>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">V.2.4 Analytics</span>
                                        </div>

                                        <div className="border border-black/[0.04] rounded-[2rem] overflow-hidden bg-white/[0.02]/20 backdrop-blur-xl">
                                            <div className="flex bg-white/40 border-b border-black/[0.04]">
                                                <div className="flex-1 py-4 px-6 flex items-center justify-center gap-2 border-r border-black/[0.04] bg-emerald-50/30">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.1em]">Verified Additions</span>
                                                </div>
                                                <div className="flex-1 py-4 px-6 flex items-center justify-center gap-2 bg-white/[0.02]/50">
                                                    <MinusCircle size={12} className="text-black/30" />
                                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">Protocol Limits</span>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-black/[0.02]">
                                                {(() => {
                                                    const inclusions = activeService.detailedCoverage?.length > 0 ? activeService.detailedCoverage : (activeService.metadata?.inclusions || ['Body Wash', 'Vacuum', 'Tyre Polish', 'Glass Wipe']);
                                                    const exclusions = activeService.exclusions?.length > 0 ? activeService.exclusions : (activeService.metadata?.exclusions || ['Engine Bay', 'Pet Hair', 'Deep Wax']);
                                                    const maxRows = Math.max(inclusions.length, exclusions.length);
                                                    const rows = [];
                                                    for (let i = 0; i < maxRows; i++) {
                                                        rows.push({ in: inclusions[i] || '-', out: exclusions[i] || '-' });
                                                    }
                                                    return rows.map((row, i) => (
                                                        <div key={i} className="flex min-h-[50px] transition-all hover:bg-white/5 group">
                                                            <div className="flex-1 py-3 px-6 border-r border-black/[0.03] flex items-center gap-3">
                                                                {row.in !== '-' ? (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                                ) : (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                                                                )}
                                                                <span className={`text-[12px] font-[1000] uppercase tracking-tight ${row.in !== '-' ? 'text-white' : 'text-black/10'}`}>{row.in}</span>
                                                            </div>
                                                            <div className="flex-1 py-3 px-6 flex items-center gap-3">
                                                                {row.out !== '-' ? (
                                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                                ) : (
                                                                    <div className="w-1 h-1 rounded-full bg-white/5" />
                                                                )}
                                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${row.out !== '-' ? 'text-white/40' : 'text-black/10'}`}>{row.out}</span>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Studio Execution Pipeline */}
                                    {activeService.protocolSteps && activeService.protocolSteps.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-1">
                                                <Zap size={14} className="text-brand" fill="currentColor" />
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Execution Pipeline</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {activeService.protocolSteps.map((step, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ x: -20, opacity: 0 }}
                                                        whileInView={{ x: 0, opacity: 1 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="flex items-center gap-4 bg-white/[0.02]/50 p-4 rounded-3xl border border-black/[0.02] hover:border-brand/20 transition-all hover:bg-white/5"
                                                    >
                                                        <div className="w-8 h-8 rounded-2xl bg-black text-white flex items-center justify-center text-[10px] font-[1000] shadow-lg shadow-black/20 shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[12px] font-[1000] text-white uppercase tracking-tight leading-none truncate">{step}</p>
                                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Verified Phase {idx + 1}</p>
                                                        </div>
                                                        <Check size={12} className="text-brand" strokeWidth={3} />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Security & Support Note */}
                                    <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center  shrink-0">
                                            <ShieldCheck size={20} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-[1000] text-emerald-900 uppercase tracking-tight leading-none mb-1.5">Studio Grade Warranty</p>
                                            <p className="text-[9px] font-bold text-emerald-700/60 leading-relaxed uppercase tracking-widest">
                                                This protocol includes 100% paint safety assurance and premium chemical usage.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-black/[0.03] animate-in slide-in-from-bottom duration-500">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        disabled={!selectedVehicle}
                                        onClick={() => {
                                            if (!selectedVehicle) {
                                                toast.error('Register your vehicle in Garaj first!');
                                                setTimeout(() => navigate('/vehicles?from=instant-wash'), 1000);
                                                return;
                                            }
                                            const newItem = {
                                                id: Date.now(),
                                                serviceId: activeService.id || activeService._id,
                                                serviceName: activeService.title,
                                                category: activeService.category,
                                                price: activeServicePrice,
                                                vehicleId: selectedVehicle?.id || selectedVehicle?._id,
                                                vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Premium asset",
                                                vehicleImg: selectedVehicle?.img || FALLBACK_IMAGES[0],
                                                duration: activeServiceDuration,
                                                type: 'service'
                                            };
                                            // 🛡️ User Focus: Ensure only ONE primary service is active
                                            setCart([newItem]);
                                            setShowServiceCoverage(false);
                                            navigateToPhase(PHASES.CART);
                                        }}
                                        className={`w-full py-5 rounded-[2rem] font-[1000] text-[15px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${!selectedVehicle
                                            ? 'bg-white/[0.05] text-black/10 cursor-not-allowed'
                                            : 'bg-[#1A1A1A] text-white active:scale-95 shadow-black/20'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-brand opacity-0 group-hover:opacity-10 transition-opacity" />
                                        <Zap size={18} className={selectedVehicle ? "text-brand" : "text-black/5"} fill="currentColor" />
                                        <span>Execute booking</span>
                                        <ChevronRight size={18} strokeWidth={4} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Video Player Modal */}
                <AnimatePresence>
                    {(videoPlaying || showDemoVideo) && (
                        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => { setVideoPlaying(false); setShowDemoVideo(false); }}
                                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                            >
                                <button
                                    onClick={() => { setVideoPlaying(false); setShowDemoVideo(false); }}
                                    className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <X size={24} />
                                </button>

                                {activeVideoUrl && (activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') || activeVideoUrl.includes('.mp4')) ? (
                                    <iframe
                                        src={activeVideoUrl}
                                        className="w-full h-full"
                                        title="Service Preview"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#0A0A0A]">
                                        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center border border-brand/20 animate-pulse">
                                            <Zap size={32} className="text-brand/40" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-white text-[16px] font-black uppercase tracking-[0.2em] leading-none mb-2">Protocol Stream Unavailable</h3>
                                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                                Currently identifying detailing assets • Network connection optimized
                                            </p>
                                            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                <div className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
                                                <span className="text-white/20 text-[7px] font-black uppercase tracking-widest">Awaiting Studio Upload</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const SEARCH_MESSAGES = [
        "Connecting to Bangalore Grid...",
        "Identifying nearby detailing experts...",
        "Optimizing technician proximity...",
        "Gold Pass Priority Enabled...",
        "Securing premium service slot..."
    ];

    const renderFinding = () => {
        const userCoords = selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 };
        const isTimeUp = findingTime === 0;

        // Rapido-style Ghost Captains (Visual Polish)
        const ghostCaptains = useMemo(() => {
            // Static offsets for ghost captains
            const offsets = [
                { lat: 0.0015, lng: 0.0025 },
                { lat: -0.0025, lng: 0.0015 },
                { lat: 0.0010, lng: -0.0035 },
                { lat: -0.0015, lng: -0.0020 }
            ];

            return offsets.map((off, idx) => ({
                position: {
                    lat: userCoords.lat + off.lat + (Math.sin(findingTime * 0.4 + idx) * 0.00015),
                    lng: userCoords.lng + off.lng + (Math.cos(findingTime * 0.4 + idx) * 0.00015)
                },
                type: 'captain',
                icon: {
                    url: 'https://cdn-icons-png.flaticon.com/128/3448/3448624.png',
                    scaledSize: { width: 32, height: 32 }
                }
            }));
        }, [userCoords, findingTime]);

        return (
            <div className="fixed inset-0 z-[1000] bg-white/5 flex flex-col font-sans">
                {/* Large Map View (Rapido Style) */}
                <div className="flex-[3] relative overflow-hidden">
                    <GoogleMapBox 
                        center={userCoords} 
                        zoom={16}
                        markers={[
                            { 
                                position: userCoords, 
                                type: 'car',
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/128/2330/2330453.png',
                                    scaledSize: { width: 38, height: 38 }
                                }
                            },
                            ...(!isTimeUp ? ghostCaptains : []),
                            ...(captainPos && captainPos.lat !== 30 ? [{
                                position: captainPos,
                                type: 'captain',
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/128/3448/3448624.png',
                                    scaledSize: { width: 40, height: 40 }
                                }
                            }] : [])
                        ]}
                    />
                    
                    {/* Native Overlay HUD */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-black/[0.05] pointer-events-auto">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Searching Captains...</span>
                            </div>
                        </div>
                    </div>

                    {/* Radar Pulse Effect */}
                    {!isTimeUp && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative">
                                <div className="absolute inset-0 w-32 h-32 bg-brand/20 rounded-full animate-ping" />
                                <div className="absolute inset-0 w-32 h-32 bg-brand/10 rounded-full animate-pulse blur-xl" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bottom HUD - Ultra Compact */}
                <div className="bg-white/5 px-5 pb-28 pt-3 rounded-t-[32px] shadow-[0_-15px_50px_rgba(0,0,0,0.08)] border-t border-black/[0.02] relative z-10 -mt-8">
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-3">
                            {isTimeUp ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-1"
                                >
                                    <h3 className="text-[18px] font-[1000] text-white tracking-tighter uppercase leading-none">
                                        {searchRetry > 0 ? "Captains are Busy" : "Demand is High"}
                                    </h3>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mt-1">
                                        {searchRetry > 0 ? "Try again after some time" : "Increasing search radius..."}
                                    </p>
                                    
                                    {searchRetry === 0 && (
                                        <div className="pt-2">
                                            <button 
                                                onClick={() => {
                                                    setSearchRetry(1);
                                                    setFindingTime(120);
                                                }}
                                                className="h-9 bg-black text-white px-6 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-black/50 active:scale-95 transition-all"
                                            >
                                                Try Again (Attempt 2)
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-left">
                                        <h3 className="text-[11px] font-[1000] text-white uppercase tracking-tight leading-none mb-1">Finding Expert</h3>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <div className="w-1 h-1 bg-brand rounded-full animate-pulse" />
                                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Awaiting Match...</p>
                                        </div>
                                    </div>
                                    <div className="h-6 w-px bg-white/5" />
                                    <div className="text-center">
                                        <div className="text-[20px] font-[1000] text-white tracking-tighter tabular-nums leading-none">
                                            {Math.floor(findingTime / 60)}:{(findingTime % 60).toString().padStart(2, '0')}
                                        </div>
                                        <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.3em]">SEC REMAINING</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancelBooking}
                                disabled={isProcessing}
                                className="flex-1 h-10 rounded-xl bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-red-100/50"
                            >
                                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={3} />}
                                Cancel
                            </motion.button>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/sos')}
                                className="flex-1 h-10 rounded-xl bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg"
                            >
                                <AlertCircle size={12} className="text-brand" strokeWidth={3} />
                                Help (SOS)
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLiveTrack = () => {
        const userCoords = selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 };
        // If captainPos is not set yet, mock it somewhere nearby initially
        const currentCaptainCoords = (captainPos.lat && captainPos.lng)
            ? [captainPos.lat, captainPos.lng]
            : [userCoords.lat + 0.015, userCoords.lng + 0.01];

        const isCompleted = activeBooking?.status === 'completed';

        return (

            <div className="fixed inset-0 bg-[#F8F9FB] z-[1000] flex flex-col overflow-hidden font-outfit">
                {/* Navigational Map Layer - Google Maps Style */}
                <div className="absolute inset-0 z-0">
                    <GoogleMapBox
                        center={userCoords}
                        zoom={15}
                        markers={[
                            {
                                id: 'user',
                                position: userCoords,
                                icon: {
                                    path: 'M 0,0 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0',
                                    fillColor: '#3B82F6',
                                    fillOpacity: 1,
                                    strokeWeight: 2,
                                    strokeColor: '#FFFFFF'
                                }
                            },
                            {
                                id: 'captain',
                                position: {
                                    lat: currentCaptainCoords[0],
                                    lng: currentCaptainCoords[1]
                                },
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                                    scaledSize: { width: 48, height: 48 }
                                },
                                animation: 'BOUNCE'
                            }
                        ]}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/20 via-transparent to-black/10 z-10" />
                </div>

                {/* Top Status - Rapido Style (Dynamic Island) */}
                <div className="relative z-10 px-5 pt-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/')}
                            className="w-10 h-10 bg-black/40 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10"
                        >
                            <ChevronLeft size={20} className="text-white" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 px-4 py-2.5 rounded-2xl border border-black/5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-brand animate-ping shadow-[0_0_12px_rgba(242,159,5,0.8)]" />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{isCompleted ? 'Completed' : 'Captain is Near'}</span>
                                    {!isCompleted && <span className="text-[8px] font-bold text-black/30 uppercase mt-0.5 tracking-tighter">Tracking Live Connection</span>}
                                </div>
                            </div>
                            <div className="w-px h-4 bg-white/5" />
                            <div className="flex flex-col items-end leading-none">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand text-white rounded-xl border border-brand/20 shadow-lg">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[6px] font-black uppercase tracking-tighter leading-none opacity-50">START PIN</span>
                                        <span className="text-[13px] font-[1000] tracking-[0.1em] leading-none mt-0.5">{activeBooking?.securityPin || '5310'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="w-10" />
                    </div>
                </div>

                {/* Bottom Sheet UI */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    className="mt-auto relative z-20 bg-white/5 rounded-t-[2.5rem] shadow-[0_-30px_60px_rgba(0,0,0,0.5)] pb-6 min-h-[45vh] max-h-[75vh] overflow-y-auto"
                >
                    {/* Pull Handle */}
                    <div className="w-12 h-1 bg-white/[0.05] rounded-full mx-auto my-3 sticky top-0 bg-white/5 z-30" />

                    <div className="px-6 space-y-4">
                        {/* Service Title & Pricing */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-[#FFF6E9] rounded-xl flex items-center justify-center border border-orange-100/50 overflow-hidden shadow-inner">
                                    <img
                                        src={sanitizeUrl(selectedVehicle?.image || selectedVehicle?.img || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80')}
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-[15px] font-[1000] text-white uppercase tracking-tighter leading-none">{activeBooking?.service?.name || activeBooking?.serviceName || activeService?.title}</h3>
                                        <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[6px] font-black rounded-full uppercase tracking-widest">Active</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest leading-none">{activeBooking?.bookingId || activeBookingId?.toString().slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[15px] font-[1000] text-white">₹{activeBooking?.pricing?.totalAmount || activeBooking?.price}</h4>
                            </div>
                        </div>

                        {/* Captain Status Timeline */}
                        <div className="bg-white/[0.02] rounded-xl p-3 flex items-center gap-3 border border-black/[0.06]/50">
                            <div className="relative">
                                <img
                                    src={sanitizeUrl(activeBooking?.provider?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80")}
                                    className="w-10 h-10 rounded-lg object-cover border-white/5 border-white "
                                    alt="Captain"
                                    onError={handleImageError}
                                />
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-white/5 border-white flex items-center justify-center">
                                    <Check size={7} className="text-white" strokeWidth={4} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-[1000] text-white uppercase tracking-tight leading-none mb-1">{activeBooking?.provider?.name || 'Finding Captain...'}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white/5 px-1.5 py-0.5 rounded-full  border border-black/[0.06]">
                                        <Star size={8} fill="#F29F05" className="text-brand mr-1" />
                                        <span className="text-[9px] font-black text-white">{activeBooking?.provider?.rating || '5.0'}</span>
                                    </div>
                                    {activeBooking?.provider?.id && (
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">ID: {activeBooking.provider.id.toString().slice(-6).toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toast.success(`Calling Captain: ${activeBooking?.provider?.phone || 'N/A'}`)} className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-white border border-white/10 "><Phone size={14} /></motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toast('Chat feature coming soon!')} className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-white border border-white/10 "><MessageSquare size={14} /></motion.button>
                            </div>
                        </div>

                        {/* Status List (Vertical Steps - Full Visibility) */}
                        <div className="space-y-3 px-2 py-1">
                            {JOB_STATES.map((state, idx) => {
                                const isCurrent = idx === jobStateIndex;
                                const isPassed = idx < jobStateIndex;

                                return (
                                    <div key={state.id} className={`flex items-center gap-3 transition-all duration-300 ${idx > jobStateIndex + 1 ? 'opacity-30' : 'opacity-100'}`}>
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full z-10 transition-colors ${isCurrent ? 'bg-brand' : isPassed ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            {idx < JOB_STATES.length - 1 && (
                                                <div className={`w-0.5 h-4 -my-0.5 transition-colors ${isPassed ? 'bg-green-500' : 'bg-white/[0.05]'}`} />
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-white' : isPassed ? 'text-green-600' : 'text-gray-300'}`}>
                                            {state.label}
                                        </span>
                                        {isCurrent && (
                                            <motion.div
                                                animate={{ x: [0, 5, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="px-2 py-0.5 bg-brand text-white text-[7px] font-black rounded-full uppercase"
                                            >
                                                Active
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigation Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => navigate(`/safety/sos?id=${activeBookingId}`)}
                                className="flex items-center justify-center gap-3 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                            >
                                <AlertTriangle size={12} />
                                SOS Help
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                    const pin = activeBooking?.securityPin || '----';
                                    const isApartment = activeBooking?.location?.type === 'Apartment' || !!activeBooking?.location?.hubId;
                                    if (isApartment) {
                                        toast.success("Apartment Unattended Protocol Active", {
                                            icon: '🛡️',
                                            description: 'No PIN verification required. Our captain will finalize the wash automatically.'
                                        });
                                        return;
                                    }
                                    toast.success(`SERVICE PIN: ${pin}`, {
                                        icon: 'Ã°Å¸â€Â',
                                        description: 'Provide this to the captain to start the wash. (Apartment protocol may bypass PIN)',
                                        duration: 6000
                                    });
                                }}
                                className="bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-black/50 shadow-black/20 flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-brand/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10">{ (activeBooking?.location?.type === 'Apartment' || !!activeBooking?.location?.hubId) ? 'Unattended' : 'Security PIN' }</span>
                                <span className="relative z-10 text-[12px] text-brand">{ (activeBooking?.location?.type === 'Apartment' || !!activeBooking?.location?.hubId) ? 'AUTO-SKIP' : (activeBooking?.securityPin || '----') }</span>
                            </motion.button>
                        </div>

                        {/* Bottom Sticky Button */}
                        <motion.button
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => isCompleted ? navigate('/') : null}
                            className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all ${isCompleted ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-brand text-white shadow-brand/20'
                                }`}
                        >
                            {isCompleted ? 'Service Finalized' : 'Track Deployment'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderCart = () => {
        const totalCartPrice = cart.reduce((sum, item) => sum + (item.price || 0), 0);
        const totalDuration = activeBooking?.duration || 18;

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32">
                {/* Cart Header */}
                <div className="bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-black/[0.03] sticky top-0 z-50">
                    <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <h2 className="text-[13px] font-black text-white uppercase tracking-tight">Booking Summary</h2>
                </div>

                <div className="p-4 space-y-4">
                    {/* Selected Service Assets (Premium Modern) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Selected Assets</h3>
                        </div>
                        {effectiveItems.filter(it => it.type !== 'product').map((item, idx) => {
                            const isProduct = item.type === 'product';
                            const isAddon = item.type === 'addon';
                            const isSubscription = item.type === 'subscription';

                            let itemIcon = selectedVehicle?.img;
                            if (isProduct) itemIcon = item.image;
                            if (isSubscription) itemIcon = '/assets/icons/black_pass.png';
                            if (isAddon) itemIcon = '/assets/icons/upgrade.png';

                            let typeTag = 'Instant Wash';
                            let tagColor = 'text-emerald-600';
                            let isSubscribedWash = false;

                            if (isProduct) { typeTag = 'E-Shop'; tagColor = 'text-brand'; }
                            if (isSubscription) { typeTag = 'Membership'; tagColor = 'text-amber-500'; }
                            if (isAddon) { typeTag = 'Upgrade'; tagColor = 'text-blue-500'; }

                            // Dynamic Subscription Coverage Logic
                            if (!isProduct && !isSubscription && !isAddon && userSubscription) {
                                const usedCount = userSubscription.usedCredits || 0;
                                const totalCount = userSubscription.monthlyCredits || 0;
                                const isEligible = canUseSubscription(item.serviceId, item.category, 'instant');
                                
                                if (usedCount < totalCount && isEligible) {
                                    isSubscribedWash = true;
                                    typeTag = 'Free with Pass';
                                    tagColor = 'text-brand font-black';
                                    item.isSubscribedWash = true; // Inject for finalPrice
                                }
                            }

                            return (
                                <div key={item.id || item._id || idx} className="bg-white/5 rounded-xl p-3  relative border border-black/[0.03] flex items-center justify-between group transition-all hover:border-brand/30">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-black/[0.05]  overflow-hidden flex-shrink-0">
                                            {isSubscription || isAddon ? (
                                                <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                                                    {isSubscription ? <Crown size={24} className="text-amber-500" /> : <Zap size={24} className="text-blue-500" />}
                                                </div>
                                            ) : (
                                                <img
                                                    src={sanitizeUrl(itemIcon)}
                                                    className="w-full h-full object-cover"
                                                    alt={item.serviceName}
                                                    onError={handleImageError}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[7.5px] font-black text-white/20 uppercase tracking-widest leading-none">
                                                    {isProduct ? 'Product' : (isSubscription ? 'Plan' : (isAddon ? 'Upgrade' : (selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : (selectedVehicleType ? selectedVehicleType : 'Vehicle'))))}
                                                </p>
                                            </div>
                                            <h4 className="text-[11px] font-[1000] text-white leading-none uppercase tracking-tight mb-1.5">
                                                {item.serviceName}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={9} className="text-black/30" />
                                                    <span className="text-[7.5px] font-bold text-white/40 uppercase tracking-tighter">
                                                        {isProduct || isSubscription ? 'Instant' : (item.duration || matchedModel?.sessionTime || 18) + ' Mins'}
                                                    </span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-white/5" />
                                                <span className={`text-[7.5px] font-black uppercase tracking-widest ${tagColor}`}>
                                                    {typeTag}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <div className="text-[17px] font-[1000] text-white tracking-tight leading-none mb-1">
                                            ₹{isSubscribedWash ? 0 : item.price}
                                        </div>
                                        {isSubscribedWash ? (
                                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand/10 rounded text-[6.5px] font-black text-brand uppercase tracking-tighter border border-brand/20">
                                                <Crown size={7} fill="currentColor" /> 1 CREDIT USED
                                            </div>
                                        ) : (!isProduct && !isSubscription && !isAddon && (
                                            <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-emerald-50 rounded text-[6.5px] font-black text-emerald-600 uppercase tracking-tighter border border-emerald-100/30">
                                                <Zap size={7} fill="currentColor" /> SAVED ₹49
                                            </div>
                                        ))}
                                        {(isProduct || isSubscription || isAddon) && (
                                            <button
                                                onClick={() => setCart(cart.filter(i => (i.id || i._id) !== (item.id || item._id)))}
                                                className="text-[8px] font-black text-red-500 uppercase tracking-widest py-1 px-2 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Active Subscription Summary (Dynamically shown if exists) */}
                        {userSubscription && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black text-white rounded-2xl p-4 shadow-2xl shadow-black/50 border border-brand/30 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-full bg-brand/[0.05] skew-x-[-20deg]" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 flex-shrink-0">
                                            <Crown size={20} className="text-white" fill="currentColor" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest">{userSubscription.planName || userSubscription.plan || 'Active Pass'}</h4>
                                            <p className="text-[9px] font-bold text-brand uppercase tracking-tighter mt-1">
                                                {(userSubscription.monthlyCredits || 0) - (userSubscription.usedCredits || 0)} Washes Remaining
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-[12px] font-black uppercase text-white/40 leading-none">Status</div>
                                            <div className="text-[10px] font-black text-[#00FF66] uppercase tracking-widest mt-1">Active</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Plan Usage Timeline</span>
                                        <span className="text-[8px] font-black text-brand uppercase tracking-widest">{userSubscription.usedCredits || 0} / {userSubscription.monthlyCredits || 0} Used</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((userSubscription.usedCredits || 0) / (userSubscription.monthlyCredits || 1)) * 100}%` }}
                                            className="h-full bg-brand"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Dynamic Promotions & Coupons Section (Added) */}
                    {filteredPromotions.filter(p => p.type === 'Coupons').length > 0 && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Available Protocols</h3>
                                <div className="flex items-center gap-1.5 bg-brand/5 px-2 py-1 rounded-full border border-brand/10">
                                    <Gift size={10} className="text-brand" />
                                    <span className="text-brand text-[7px] font-[1000] uppercase tracking-widest">Rewards Node</span>
                                </div>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                                {filteredPromotions.filter(p => p.type === 'Coupons').map((promo, idx) => (
                                    <motion.button
                                        key={promo.id || idx}
                                        onClick={() => promo.badge ? handleApplyCoupon(promo.badge) : null}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex-shrink-0 w-64 p-4 rounded-[2rem] border transition-all relative overflow-hidden snap-center ${appliedCoupon?.code === promo.badge
                                            ? 'bg-black border-black text-white shadow-lg shadow-black/20'
                                            : 'bg-white/5 border-black/[0.04] text-white  hover:border-brand/30'
                                            }`}
                                    >
                                        <div className="relative z-10 flex items-start gap-3 text-left">
                                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${appliedCoupon?.code === promo.badge ? 'bg-white/20' : 'bg-brand/5 text-brand'
                                                }`}>
                                                {promo.type === 'Coupons' ? <Percent size={18} /> : <Zap size={18} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[12px] font-black uppercase ${appliedCoupon?.code === promo.badge ? 'text-white' : 'text-white'}`}>
                                                        {promo.badge || 'PROMO'}
                                                    </span>
                                                    {appliedCoupon?.code === promo.badge && <Check size={12} className="text-brand" />}
                                                </div>
                                                <h4 className={`text-[9px] font-bold uppercase tracking-tight mt-0.5 opacity-80 line-clamp-1 ${appliedCoupon?.code === promo.badge ? 'text-white' : 'text-white/40'}`}>
                                                    {promo.title}
                                                </h4>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${appliedCoupon?.code === promo.badge ? 'text-brand' : 'text-brand/60'}`}>
                                                    {promo.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-current opacity-[0.03] rounded-full" />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Manual Coupon Input (Added) */}
                    <div className="mt-8 space-y-3 px-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Voucher Authorization</label>
                            {isBlackPassMember && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 bg-brand/[0.03] px-3 py-1.5 rounded-full border border-brand/10"
                                >
                                    <Crown size={10} className="text-brand" />
                                    <span className="text-brand text-[7px] font-black uppercase tracking-widest">Premium Active</span>
                                </motion.div>
                            )}
                        </div>
                        {isBlackPassMember && (
                            <p className="text-[8px] font-bold text-brand uppercase tracking-widest ml-1 mb-2 opacity-60">Membership privileges override standard coupons for maximum value.</p>
                        )}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter Promotional Code"
                                className="w-full bg-white/5 border border-black/[0.04] px-5 py-4 rounded-2xl text-[13px] font-[1000] text-white outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all uppercase placeholder:text-black/10 "
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                            />
                            <button
                                onClick={() => handleApplyCoupon()}
                                className="absolute right-2 top-2 bottom-2 px-5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand transition-all active:scale-95 shadow-lg"
                            >
                                Apply
                            </button>
                        </div>
                        {couponError && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] font-black text-red-500 uppercase ml-1 flex items-center gap-1"
                            >
                                <X size={10} strokeWidth={3} /> {couponError}
                            </motion.p>
                        )}
                        {appliedCoupon && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl "
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase leading-none">Protocol {appliedCoupon.code} Authorized</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setAppliedCoupon(null);
                                        setCouponCode('');
                                    }}
                                    className="text-[9px] font-black text-emerald-600/50 uppercase hover:text-red-500 transition-colors"
                                >
                                    Remove
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Express Upgrades (Service Addons) */}
                    {activeService?.addons?.length > 0 && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Express Upgrades</h3>
                                <div className="flex items-center gap-1.5 bg-brand/5 px-2 py-1 rounded-full border border-brand/10">
                                    <Stars size={8} className="text-brand" />
                                    <span className="text-brand text-[7px] font-[1000] uppercase tracking-widest">PRO CHOICE</span>
                                </div>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                {activeService.addons
                                    .filter(addon => !addon.included)
                                    .map((addon, i) => {
                                        const isAdded = cart.some(item => (item.id === addon.id || item.serviceId === addon.id) && item.type === 'addon');
                                        return (
                                            <motion.button
                                                key={addon.id || i}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (isAdded) {
                                                        setCart(cart.filter(item => !(item.type === 'addon' && (item.id === addon.id || item.serviceId === addon.id))));
                                                    } else {
                                                        const addonItem = {
                                                            id: addon.id || Date.now() + Math.random(),
                                                            serviceId: addon.id,
                                                            serviceName: addon.name,
                                                            price: getPrice(addon.price, addon.id),
                                                            duration: addon.duration || 10,
                                                            type: 'addon',
                                                            vehicleName: 'Express Upgrade',
                                                            image: '/assets/icons/upgrade.png'
                                                        };
                                                        setCart(prev => [...prev, addonItem]);
                                                    }
                                                }}
                                                className={`min-w-[125px] p-3 rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden ${isAdded
                                                    ? 'bg-black border-black text-white shadow-lg'
                                                    : 'bg-white/5 border-black/[0.04] text-white '}`}
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isAdded ? 'bg-white/10' : 'bg-white/[0.02]'}`}>
                                                    <Zap size={18} className={isAdded ? 'text-brand' : 'text-white/40'} />
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none mb-0.5 ${isAdded ? 'text-white' : 'text-white'}`}>
                                                        {addon.name}
                                                    </p>
                                                    <p className={`text-[11px] font-[1000] ${isAdded ? 'text-white' : 'text-emerald-600'}`}>
                                                        ₹{getPrice(addon.price, addon.id)}
                                                    </p>
                                                </div>
                                                {isAdded && (
                                                    <div className="absolute top-1 right-1">
                                                        <CheckCircle2 size={10} className="text-brand" fill="white" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Car & Bike Combo Card (From Studio Wash) */}
                    {(() => {
                        const bikeService = dynamicServices.find(s => s.id?.toLowerCase().includes('bike') || s.title?.toLowerCase().includes('bike'));
                        const carService = activeService;

                        const bikePrice = bikeService ? getPrice(bikeService.price, bikeService.id) : 199;
                        const carPrice = carService ? getPrice(carService.price, carService.id) : 399;
                        const combinedTotal = bikePrice + carPrice;
                        const comboPrice = Math.round(combinedTotal * 0.8);
                        const blackPassPlan = subscriptionPlans.find(p => p.name?.toLowerCase().includes('black') || p.title?.toLowerCase().includes('black'));
                        const blackPrice = blackPassPlan ? Math.round(comboPrice * 0.7) : 312;

                        return (
                            <div className="bg-[#FAF1E8]/60 rounded-3xl p-3.5 pt-9 relative overflow-hidden border border-[#E9DCCF] mt-1 group hover:bg-[#FAF1E8] transition-colors duration-500 ">
                                <div className="absolute top-0 left-0 bg-[#1A1A1A] text-white px-3 py-1.5 text-[8.5px] font-black rounded-br-2xl uppercase tracking-widest">
                                    <span className="text-[#2D9944]">{globalSettings.combo_discount_pct || 20}% OFF</span> ON COMBO
                                </div>

                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center  border border-black/[0.05]">
                                            <Bike size={18} className="text-black/80" />
                                        </div>
                                        <Plus size={12} className="text-black/10" strokeWidth={3} />
                                        <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center  border border-black/[0.05]">
                                            <Car size={18} className="text-black/80" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 leading-none">Combo Price</p>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-[20px] font-[1000] text-white leading-none tracking-tight">₹{comboPrice}</span>
                                            <span className="text-[10px] font-black text-black/10 line-through">₹{combinedTotal}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const comboMult = 1 - ((globalSettings.combo_discount_pct || 20) / 100);
                                            const bikeItem = {
                                                id: Date.now(),
                                                serviceId: bikeService?.id || 'bike_wash',
                                                serviceName: bikeService?.title || 'Bike Express Wash',
                                                price: Math.round(bikePrice * comboMult),
                                                duration: bikeService?.duration || 15,
                                                type: 'service',
                                                vehicleName: 'Motorbike'
                                            };
                                            const carItem = {
                                                id: Date.now() + 1,
                                                serviceId: carService?.id || 'car_wash',
                                                serviceName: carService?.title || 'Car Premium Wash',
                                                price: Math.round(carPrice * comboMult),
                                                duration: carService?.duration || 25,
                                                type: 'service',
                                                vehicleName: selectedVehicle?.model || 'Car'
                                            };
                                            setCart(prev => [...prev, bikeItem, carItem]);
                                            toast.success(`Combo added to cart! (${globalSettings.combo_discount_pct || 20}% Discount applied)`);
                                        }}
                                        className="flex-1 bg-white/5 border border-black/[0.06] text-white py-2.5 rounded-xl font-[1000] text-[10px] uppercase tracking-widest  active:scale-[0.98] transition-all hover:bg-black hover:text-white hover:border-black"
                                    >
                                        Book Combo
                                    </button>
                                    {!isBlackPassMember && (
                                        <button
                                            onClick={() => {
                                                if (!blackPassPlan) {
                                                    toast.error('Black Pass plan not found. Please select from Monthly Subscriptions.');
                                                    return;
                                                }
                                                const subscriptionItem = {
                                                    id: Date.now(),
                                                    serviceId: blackPassPlan.id || blackPassPlan._id,
                                                    serviceName: blackPassPlan.name || blackPassPlan.title,
                                                    price: blackPassPlan.price,
                                                    type: 'subscription',
                                                    vehicleName: 'Digital Membership'
                                                };
                                                setCart(prev => [...prev, subscriptionItem]);
                                                toast.success(`${blackPassPlan.name} added to cart!`);
                                            }}
                                            className="flex-[1.8] bg-[#1A1A1A] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-2xl shadow-black/50 shadow-black/10 group-hover:bg-black"
                                        >
                                            ₹{blackPrice} WITH <span className="text-brand">BLACK</span>
                                            <ChevronRight size={12} strokeWidth={3} className="text-brand/50" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Monthly Packages (Dynamic Mapping) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Monthly Subscription</h3>
                            <span className="text-emerald-600 text-[8px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 ">Upto 50% Savings</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            {(filteredSubscriptionPlans.length > 0 ? filteredSubscriptionPlans.filter(p => {
                                // Filter out already owned plan or Black Pass if isBlackPassMember
                                const isOwned = userSubscription?.planId === (p.id || p._id);
                                const isBlackPass = p.name?.toLowerCase().includes('black') || p.title?.toLowerCase().includes('black');
                                return !isOwned && (!isBlackPass || !isBlackPassMember);
                            }) : [
                                { title: '2 Wash/Month', price: 458, description: '229 per wash' },
                                { title: '4 Times/Month', price: 756, description: '189 per wash' },
                                { title: '8 Times/Month', price: 1352, description: '169 per wash' }
                            ]).map((pkg, i) => {
                                const perWash = pkg.perWash || Math.round((pkg.price || 499) / (parseInt(pkg.title) || 2));
                                const pkgId = pkg.id || pkg._id;
                                const pkgName = pkg.name || pkg.title;
                                const isAdded = cart.some(i =>
                                    i.type === 'subscription' && (pkgId ? (i.id === pkgId || i.serviceId === pkgId) : (i.name === pkgName))
                                );

                                return (
                                    <div key={pkgId || i} className={`bg-white/5 rounded-2xl border p-4  flex items-center justify-between relative overflow-hidden group transition-all duration-300 ${isAdded ? 'border-brand ring-1 ring-brand/20' : 'border-black/[0.03] hover:border-brand/40'}`}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />

                                        {/* Total Price Badge (Matching Screenshot) */}
                                        <div className="absolute top-0 left-0 bg-[#F3E8DF] text-white px-3 py-1.5 text-[8px] font-black rounded-br-2xl uppercase tracking-widest leading-none">
                                            Total ₹{pkg.price}
                                        </div>

                                        <div className="pt-5 flex-1 text-left">
                                            <h4 className="text-[14px] font-[1000] text-white tracking-tight uppercase leading-none mb-1.5">{pkg.title || pkg.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[16px] font-[1000] text-emerald-600 leading-none tracking-tighter">₹{perWash}/WASH</span>
                                                <span className="text-[9px] font-bold text-black/10 line-through tracking-tighter uppercase">Was ₹{perWash * 2}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (isAdded) {
                                                    setCart(prev => prev.filter(item => {
                                                        if (item.type !== 'subscription') return true;
                                                        return (item.id !== pkgId && item.serviceId !== pkgId && item.name !== pkgName);
                                                    }));
                                                } else {
                                                    const subscriptionItem = {
                                                        id: pkgId || Date.now(),
                                                        serviceId: pkgId,
                                                        serviceName: pkgName,
                                                        name: pkgName,
                                                        price: pkg.price,
                                                        type: 'subscription',
                                                        vehicleName: 'Monthly Pass'
                                                    };
                                                    setCart(prev => [...prev, subscriptionItem]);
                                                    toast.success(`${pkgName} added to your booking!`);
                                                }
                                            }}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-[1000] uppercase tracking-widest shadow-2xl shadow-black/40 active:scale-95 transition-all relative z-10 ${isAdded ? 'bg-black text-white' : 'bg-white/5 border border-black/[0.1] text-white hover:bg-black hover:text-white'}`}
                                        >
                                            {isAdded ? 'Added' : 'Select'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery Address (Premium Integration) */}
                    <div className="bg-white/5 rounded-3xl p-5 border border-black/[0.03]  relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                    <MapPin size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-black text-white uppercase tracking-widest leading-none">Service Address</h4>
                                    <p className="text-[7.5px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5 font-outfit">Precision Pin Verified</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/addresses?from=instant-wash')}
                                className="bg-brand/10 text-brand px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all active:scale-95  border border-brand/20"
                            >
                                Change
                            </button>
                        </div>
                        {(() => {
                            const activeAddr = selectedAddress || addresses.find(a => a.isPrimary) || addresses[0];
                            return activeAddr ? (
                                <div className="flex items-center gap-4 bg-white/[0.02]/50 p-4 rounded-2xl border border-black/[0.02] relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-black/[0.05] flex items-center justify-center text-white/40  flex-shrink-0">
                                        {activeAddr.label?.toLowerCase() === 'home' ? <Home size={22} strokeWidth={2.5} /> : <MapPin size={22} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h5 className="text-[11px] font-[1000] text-white uppercase tracking-tight truncate">{activeAddr.label || 'Home'}</h5>
                                        </div>
                                        <p className="text-[10px] font-bold text-black/30 truncate leading-tight font-outfit">
                                            {activeAddr.street || activeAddr.full || activeAddr.address || 'Pinned Location'}
                                        </p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                        <CheckCircle2 size={12} strokeWidth={3} />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/addresses?from=instant-wash')}
                                    className="w-full py-8 border-white/5 border-dashed border-black/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:bg-white/[0.02] hover:border-brand/20 transition-all group flex flex-col items-center justify-center gap-2"
                                >
                                    <Plus size={20} className="text-black/10 group-hover:text-brand transition-colors" strokeWidth={3} />
                                    Add Service Address
                                </button>
                            );
                        })()}
                    </div>
                </div>

                {/* Cart Footer (Ultra Modern - Matching Studio Wash) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/5 border-t border-black/[0.04] px-4 py-2.5 pb-5 z-50 shadow-[0_-12px_35px_rgba(0,0,0,0.02)]">
                    <div className="max-w-lg mx-auto mb-3">
                        {pricingBreakdown.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                                {pricingBreakdown.map((benefit, idx) => (
                                    <div key={idx} className="flex-shrink-0">
                                        <BenefitBadge {...benefit} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between max-w-lg mx-auto gap-3 transition-all">
                        <div className="flex-1">
                            <p className="text-[6.5px] font-black text-white/20 uppercase tracking-[0.25em] mb-0.5 leading-none">Net Payable</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[22px] font-[1000] text-white tracking-tighter leading-none">₹{finalPrice}</span>
                                <span className="px-1 py-0.5 bg-black/[0.03] text-white/40 text-[7px] font-black rounded text-center uppercase tracking-tighter leading-none">Instant</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Clock size={9} className="text-brand" strokeWidth={3} />
                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-widest leading-none">
                                        {totalCartDuration || 18} Mins
                                    </span>
                                </div>
                                <div className="w-0.5 h-0.5 rounded-full bg-white/5" />
                                <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none">Doorstep</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const activeAddr = selectedAddress || addresses.find(a => a.isPrimary) || addresses[0];
                                if (!activeAddr) {
                                    navigate('/map?from=instant-wash');
                                    toast.error('Please select a service address');
                                    return;
                                }
                                navigateToPhase(PHASES.SELECT_SLOT);
                            }}
                            className={`flex-1 max-w-[145px] flex items-center justify-center gap-2 h-12 rounded-xl font-[1000] text-[12px] uppercase tracking-widest active:scale-[0.97] transition-all shadow-lg group relative overflow-hidden bg-black text-white shadow-black/5 hover:bg-brand hover:text-white`}
                        >
                            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">{(selectedAddress || addresses.find(a => a.isPrimary) || addresses[0]) ? 'Next Step' : 'Set Address'}</span>
                            <ChevronRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSelectSlot = () => {
        const totalDurationMins = totalCartDuration;
        const hours = Math.floor(totalDurationMins / 60);
        const mins = totalDurationMins % 60;

        // Dynamically generate next 5 days from today
        const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const dates = Array.from({ length: 5 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0); // Normalize to start of day
            return {
                month: MONTHS[d.getMonth()],
                day: String(d.getDate()),
                weekday: WEEKDAYS[d.getDay()],
                trend: i === 0 ? 'down' : i < 3 ? 'up' : null,
                key: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
                fullDate: d.toISOString() // Store ISO string for backend
            };
        });

        // Set default date to today if not set
        const effectiveDateFull = selectedDate || dates[0].fullDate;
        const effectiveDateKey = dates.find(d => d.fullDate === effectiveDateFull)?.key || dates[0].key;

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32">
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-3 bg-white/5 border-b border-black/[0.04] sticky top-0 z-50">
                    <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center bg-white/[0.02] rounded-xl">
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-[14px] font-[1000] text-white uppercase tracking-tight">Select Slot</h2>
                </div>

                {/* Location Subheader */}
                <div className="px-6 py-4 flex items-center justify-between gap-2 bg-white/50 border-b border-black/[0.02]">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} fill="currentColor" className="text-white" />
                        <p className="text-[11px] font-[1000] text-white uppercase tracking-tight">
                            Service at - <span className="text-black/30">{(() => {
                                const a = selectedAddress || addresses.find(x => x.isPrimary) || addresses[0];
                                if (!a) return 'Address not saved';
                                return a.street || a.address || a.full || a.label || 'Your Address';
                            })()}</span>
                        </p>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Booking Mode Selector */}
                    <div className="bg-white/5 rounded-2xl border border-black/[0.06] p-1.5 flex gap-1.5  overflow-hidden">
                        <button
                            onClick={() => setBookingType('instant')}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl transition-all relative group ${bookingType === 'instant' ? 'bg-black text-white shadow-2xl shadow-black/50 shadow-black/10' : 'bg-transparent text-white/40 hover:bg-white/[0.02]'}`}
                        >
                            {bookingType === 'instant' && <motion.div layoutId="modebg" className="absolute inset-0 bg-black rounded-xl -z-10" />}
                            <Zap size={16} className={bookingType === 'instant' ? 'text-brand' : 'text-white/20'} fill="currentColor" />
                            <span className="text-[12px] font-black uppercase tracking-widest">Instant Match</span>
                        </button>
                        <button
                            onClick={() => setBookingType('schedule')}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl transition-all relative group ${bookingType === 'schedule' ? 'bg-black text-white shadow-2xl shadow-black/50 shadow-black/10' : 'bg-transparent text-white/40 hover:bg-white/[0.02]'}`}
                        >
                            {bookingType === 'schedule' && <motion.div layoutId="modebg" className="absolute inset-0 bg-black rounded-xl -z-10" />}
                            <Calendar size={16} className={bookingType === 'schedule' ? 'text-brand' : 'text-white/20'} />
                            <span className="text-[12px] font-black uppercase tracking-widest">Schedule</span>
                        </button>
                    </div>

                    <div className={`transition-all duration-500 relative ${bookingType === 'instant' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                        {bookingType === 'instant' && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center">
                                <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2">
                                    <Shield size={12} className="text-brand" />
                                    Choose 'Schedule' to unlock
                                </div>
                            </div>
                        )}

                        <div className="bg-white/5 rounded-3xl border border-black/[0.06] p-5  space-y-8">
                            <div>
                                <h3 className="text-[14px] font-black text-white mb-5 uppercase tracking-tight">Select Service Date</h3>
                                {/* Date Picker */}
                                <div className="flex justify-between mb-2 overflow-x-auto no-scrollbar gap-4 pb-2">
                                    {dates.map((d, i) => {
                                        const isSelected = effectiveDateFull === d.fullDate;
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                                <div className="relative">
                                                    {d.trend && (
                                                        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md flex items-center justify-center shadow-2xl shadow-black/40 z-10 ${d.trend === 'up' ? 'bg-[#FFD700]' : 'bg-emerald-500'}`}>
                                                            <Zap size={10} className={d.trend === 'up' ? 'text-white' : 'text-white'} fill="currentColor" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedDate(d.fullDate)}
                                                        className={`w-[58px] py-4 rounded-2xl flex flex-col items-center transition-all duration-300 border ${isSelected ? 'bg-black text-white border-black shadow-2xl shadow-black/50 scale-105' : 'bg-white/5 text-white/40 border-black/[0.05] hover:border-black/10'}`}
                                                    >
                                                        <span className="text-[8px] font-[1000] mb-1.5 uppercase tracking-widest leading-none">{d.month}</span>
                                                        <span className="text-[18px] font-[1000] mb-1 leading-none">{d.day}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-tighter leading-none opacity-40">{d.weekday}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-black/[0.03] pt-8">
                                <h3 className="text-[14px] font-black text-white uppercase tracking-tight">Select Start Time</h3>
                                <div className="flex items-center gap-1.5 mt-1.5 mb-6">
                                    <Clock size={11} className="text-black/30" />
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                                        Duration: <span className="text-white">{hours}H {mins}M</span>
                                    </p>
                                </div>

                                <div className="space-y-10">
                                    {/* Morning Slots */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-brand rounded-full" />
                                                Morning Slots
                                            </h4>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">08:00 - 12:00</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-3.5 rounded-xl text-[12px] font-black transition-all border ${selectedSlot === slot
                                                        ? 'bg-black text-white border-black shadow-lg scale-[0.98]'
                                                        : 'bg-white/5 text-black/50 border-black/[0.06] hover:border-black/20'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Afternoon Slots */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-orange-400 rounded-full" />
                                                Afternoon
                                            </h4>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">12:00 - 16:00</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'].map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-3.5 rounded-xl text-[12px] font-black transition-all border ${selectedSlot === slot
                                                        ? 'bg-black text-white border-black shadow-lg scale-[0.98]'
                                                        : 'bg-white/5 text-black/50 border-black/[0.06] hover:border-black/20'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Evening Slots */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                Evening
                                            </h4>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">16:00 - 20:00</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-3.5 rounded-xl text-[12px] font-black transition-all border ${selectedSlot === slot
                                                        ? 'bg-black text-white border-black shadow-lg scale-[0.98]'
                                                        : 'bg-white/5 text-black/50 border-black/[0.06] hover:border-black/20'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms Banner */}
                    <div className="px-5 mt-2">
                        <div className="bg-[#1A1A1A] rounded-2xl p-4 flex items-start gap-3 shadow-2xl shadow-black/50">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <Shield size={16} className="text-brand" />
                            </div>
                            <p className="text-[10px] font-bold text-white/60 leading-normal">
                                Strict 0-Cancellation Policy within 1 hour of service. <span className="text-white">Read full terms.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer (Dual Action - Premium) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/5 border-t border-black/[0.04] px-5 py-5 pb-9 z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Booking Mode</p>
                            <div className="flex items-center gap-2">
                                {bookingType === 'instant' ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[16px] font-[1000] text-white uppercase tracking-tighter">Instant Match</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-brand" />
                                        <span className="text-[16px] font-[1000] text-white uppercase tracking-tighter">{selectedSlot || 'Select Slot'}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (bookingType === 'schedule' && !selectedSlot) {
                                    toast.error('Please select a time slot or choose Instant Match');
                                    return;
                                }
                                setPhase(PHASES.PAYMENT);
                            }}
                            className={`flex-[1.5] h-14 rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.15em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${(bookingType === 'instant' || selectedSlot)
                                ? 'bg-black text-white shadow-black/20'
                                : 'bg-white/[0.05] text-white/20 pointer-events-none border border-black/[0.03]'
                                }`}
                        >
                            <span className="relative z-10">{bookingType === 'instant' ? 'Instant Booking' : 'Confirm & Schedule'}</span>
                            <ArrowRight size={18} strokeWidth={3} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPayment = () => {
        const paymentOptions = [
            ...(userSubscription && (userSubscription.monthlyCredits > userSubscription.usedCredits) ? [{ 
                id: 'subscription', 
                name: 'Subscription Credit', 
                icon: <Crown size={18} className="text-brand animate-pulse" fill="currentColor" />, 
                subtitle: `${userSubscription.monthlyCredits - userSubscription.usedCredits} ${userSubscription.plan || 'Premium'} WASH LEFT` 
            }] : []),
            ...(user?.loyalty?.rewardsAvailable > 0 ? [{ 
                id: 'subscription', 
                name: 'Loyalty Reward', 
                icon: <Crown size={18} className="text-brand" fill="currentColor" />, 
                subtitle: `${user.loyalty.rewardsAvailable} FREE WASH AVAILABLE` 
            }] : []),
            { id: 'wallet', name: 'Spare Driver Wallet', icon: <Wallet size={18} className="text-brand" strokeWidth={2.5} />, balance: walletBalance },
            { id: 'googlepay', name: 'Google Pay', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo_%282020%29.svg' },
            { id: 'phonepe', name: 'PhonePe', icon: 'https://seeklogo.com/images/P/phonepe-logo-DEB60AD14F-seeklogo.com.png' },
            { id: 'paytm', name: 'Paytm', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo.svg' },
            { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard size={18} strokeWidth={2.5} /> },
            { id: 'netbanking', name: 'Net Banking', icon: <LayoutGrid size={18} strokeWidth={2.5} /> },
        ];

        const discountPct = (passConfig?.discount || 0.3) * 100;
        const passPrice = goldPassPlan?.price || passConfig?.price || 499;

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32 font-sans">
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-3 bg-white/5 border-b border-black/[0.04] sticky top-0 z-50">
                    <button onClick={() => setPhase(PHASES.SELECT_SLOT)} className="w-8 h-8 flex items-center justify-center bg-white/[0.02] rounded-xl">
                        <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-[13px] font-[1000] text-white uppercase tracking-tight">Payment Selection</h2>
                </div>

                <div className="p-4 space-y-3.5">
                    {/* Security Badge - Compact & Pro */}
                    <div className="bg-emerald-50/80 rounded-2xl p-3 flex items-center gap-3 border border-emerald-100/50">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
                            <ShieldCheck size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-[1000] text-emerald-900 uppercase tracking-tighter leading-none mb-1">100% Encrypted Payment</h4>
                            <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">PCI-DSS Secure Network</p>
                        </div>
                    </div>

                    {/* Smart Conversion / FOMO Card (Added) */}
                    {!isBlackPassMember && (
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/subscription')}
                            className="bg-black rounded-3xl p-5 border border-brand/30 shadow-2xl relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute top-0 right-0 w-32 h-full bg-brand/[0.05] skew-x-[-20deg]" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                                    <Crown size={22} className="text-white" fill="currentColor" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-brand font-[1000] text-[13px] uppercase tracking-tight leading-none mb-1.5">Save ₹{Math.round(finalPrice * (discountPct / 100))} Right Now!</h3>
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-relaxed">
                                        Join {goldPassPlan?.name || 'Black Pass'} for ₹{passPrice} and unlock {discountPct}% OFF on this booking instantly.
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-brand">
                                    <ChevronRight size={18} strokeWidth={3} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] px-1">Select Payment Method</h3>

                    {/* Online Payment Options - Compacted */}
                    <div className="space-y-2.5">
                        {paymentOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setPaymentMethod(opt.id)}
                                className={`w-full bg-white/5 p-3.5 rounded-xl flex items-center justify-between transition-all border ${paymentMethod === opt.id ? 'border-brand shadow-2xl shadow-black/40 ring-1 ring-brand/10' : 'border-black/[0.03]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/[0.02]/50 rounded-xl flex items-center justify-center overflow-hidden border border-black/[0.04]">
                                        {typeof opt.icon === 'string' ? (
                                            <img 
                                                src={opt.icon} 
                                                className="w-[80%] h-[80%] object-contain" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = '<div class="text-white/20"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-white/60">{opt.icon}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-[1000] text-white tracking-tight leading-none">{opt.name}</span>
                                        {opt.subtitle && (
                                            <span className="text-[8px] font-black text-brand mt-1.5 uppercase tracking-widest">{opt.subtitle}</span>
                                        )}
                                        {opt.id === 'wallet' && (
                                            <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-widest ${opt.balance < finalPrice ? 'text-red-500' : 'text-emerald-600'}`}>
                                                Balance: ₹{opt.balance}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isBlackPassMember ? 'bg-gradient-to-tr from-brand to-amber-300 text-white shadow-lg shadow-brand/20 border-white/5 border-white/30 active:scale-95' : 'bg-white/[0.02] text-black/10'
                                        }`}>
                                        {isBlackPassMember ? <Crown size={14} className="animate-pulse" fill="currentColor" /> : <ShieldCheck size={14} />}
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-white/5 flex items-center justify-center transition-all ${paymentMethod === opt.id ? 'border-brand bg-brand animate-in zoom-in-50' : 'border-black/[0.1]'
                                        }`}>
                                        {paymentMethod === opt.id && <Check size={10} className="text-white" strokeWidth={5} />}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Restricted Warning - Compact */}
                    <div className="bg-[#FFF8F0] rounded-xl p-4 flex items-start gap-3 border border-orange-100/50">
                        <Info size={14} className="text-orange-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-black text-orange-900 leading-normal uppercase tracking-tight">
                            COD Restricted: Online confirmation required to secure priority booking.
                        </p>
                    </div>
                </div>

                {/* Refined Footer (Ultra Modern) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.03)] border-t border-black/[0.04] p-4 pb-8 z-50">
                    <div className="max-w-lg mx-auto mb-4">
                        {pricingBreakdown.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {pricingBreakdown.map((benefit, idx) => (
                                    <div key={idx} className="flex-shrink-0">
                                        <BenefitBadge {...benefit} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Total</span>
                                <div className="px-1.5 py-0.5 bg-emerald-50 rounded text-[7px] font-black text-emerald-600 uppercase tracking-tighter border border-emerald-100/30">
                                    Final Price
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <div className="text-[28px] font-[1000] text-white tracking-tighter leading-none">
                                    ₹{finalPrice}
                                </div>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">all incl.</span>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                if (!paymentMethod || isProcessing) return;
                                setIsProcessing(true);

                                try {
                                    const activeAddr = selectedAddress || addresses.find(a => a.isPrimary) || addresses[0];
                                    const addonObjects = (serviceAddons[activeServiceId] || [])
                                        .map(addonId => {
                                            const a = activeService?.addons?.find(x => x.id === addonId && !x.included);
                                            return a ? { id: a.id, name: a.name, price: a.price } : null;
                                        }).filter(Boolean);

                                    const firstService = effectiveItems.find(i => i.serviceId && i.type !== 'subscription' && i.type !== 'monthly');

                                    // Map category to a value accepted by Booking model enum
                                    const validCategories = ['Doorstep', 'Studio', 'Add-ons', 'Prestige', 'Chauffeur', 'Apartment'];
                                    const rawCategory = activeService?.category || firstService?.category || 'Doorstep';
                                    const category = validCategories.includes(rawCategory) ? rawCategory :
                                        (rawCategory === 'Express' ? 'Doorstep' : 'Doorstep');

                                    // Map location type to a value accepted by Booking model enum
                                    const validLocationTypes = ['home', 'office', 'other', 'studio', 'apartment', 'Apartment'];
                                    const rawLocationType = activeAddr?.label?.toLowerCase() || 'home';
                                    const locationType = validLocationTypes.includes(rawLocationType) ? (rawLocationType === 'apartment' ? 'Apartment' : rawLocationType) :
                                        (rawLocationType === 'work' ? 'office' : 'other');

                                    // Map payment method to a value accepted by Booking model enum
                                    const validPaymentMethods = ['cash', 'online', 'wallet', 'subscription'];
                                    const mappedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'online';

                                    const bookingPayload = {
                                        vehicleId: selectedVehicle?._id || selectedVehicle?.id,
                                        products: effectiveItems.filter(i => !i.serviceId).map(i => ({ id: i._id, quantity: 1 })),
                                        services: effectiveItems.filter(i => i.serviceId && i.type !== 'subscription' && i.type !== 'monthly').map(i => ({
                                            id: i.serviceId,
                                            addons: i.addons || []
                                        })),
                                        service: firstService ? {
                                            id: firstService.serviceId,
                                            name: firstService.serviceName,
                                            type: 'captain',
                                            category: category,
                                            basePrice: Number(firstService.price || 0),
                                            duration: firstService.duration || '40 min'
                                        } : undefined,
                                        addons: addonObjects,
                                        schedule: bookingType === 'instant'
                                            ? { type: 'instant', date: new Date().toISOString() }
                                            : {
                                                type: 'scheduled',
                                                date: selectedDate,
                                                timeSlot: selectedSlot ? { start: selectedSlot, end: '' } : null
                                            },
                                        location: activeAddr ? {
                                            type: locationType,
                                            hubId: activeAddr.hubId || activeAddr.hub,
                                            parkingDetails: activeAddr.parkingDetails,
                                            address: {
                                                street: activeAddr.street || activeAddr.full || activeAddr.address,
                                                city: activeAddr.city || user?.profile?.city || '',
                                                state: activeAddr.state || user?.profile?.state || '',
                                                pincode: activeAddr.pincode,
                                                coordinates: (activeAddr.coordinates || activeAddr.coords) ? {
                                                    lat: Number((activeAddr.coordinates || activeAddr.coords).lat || 0),
                                                    lng: Number((activeAddr.coordinates || activeAddr.coords).lng || 0)
                                                } : undefined
                                            }
                                        } : undefined,
                                        hubId: activeAddr?.hubId || activeAddr?.hub,
                                        paymentMethod: mappedPaymentMethod,
                                        couponCode: appliedCoupon?.code
                                    };

                                    if (paymentMethod === 'wallet' || paymentMethod === 'subscription') {
                                        if (paymentMethod === 'wallet' && walletBalance < finalPrice) {
                                            toast.error(`Insufficient wallet balance. You need ₹${finalPrice - walletBalance} more.`);
                                            setIsProcessing(false);
                                            return;
                                        }

                                        const res = await apiClient.createBooking(bookingPayload);
                                        if (res?.status === 'success' && res?.data?.booking) {
                                            handleBookingSuccess(res.data.booking);
                                            if (paymentMethod === 'wallet') await loadWallet(); 
                                            
                                            // Process subscriptions if any
                                            const subscriptionItems = effectiveItems.filter(i => i.type === 'monthly' || i.type === 'subscription');
                                            for (const sub of subscriptionItems) {
                                                try {
                                                    await subscriptionAPI.createSubscription({
                                                        planId: sub.serviceId || sub.planId,
                                                        plan: sub.serviceId || sub.planId,
                                                        paymentMethod: 'wallet',
                                                        vehicleId: selectedVehicle?._id || selectedVehicle?.id,
                                                        status: 'active'
                                                    });
                                                } catch (subErr) {
                                                    console.error('Wallet sub activation error:', subErr);
                                                }
                                            }
                                        } else {
                                            throw new Error(res?.message || 'Payment failed');
                                        }
                                    } else {
                                        const vehicleId = selectedVehicle?._id || selectedVehicle?.id;
                                        if (!vehicleId) {
                                            toast.error('Vehicle session lost. Please select your vehicle again.');
                                            setPhase(PHASES.SELECT_VEHICLE);
                                            setIsProcessing(false);
                                            return;
                                        }

                                        const keyRes = await getRazorpayKey();
                                        const orderRes = await createPaymentOrder(finalPrice);

                                        if (!keyRes?.data?.key_id || !orderRes?.data?.order_id) {
                                            throw new Error('Payment gateway configuration is invalid. Please try again.');
                                        }

                                        const { key_id } = keyRes.data;
                                        const { order_id, amount: orderAmount, currency } = orderRes.data;

                                        if (!window.Razorpay) {
                                            const script = document.createElement('script');
                                            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                                            script.async = true;
                                            document.body.appendChild(script);
                                            await new Promise((resolve, reject) => {
                                                script.onload = resolve;
                                                script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
                                            });
                                        }

                                        const options = {
                                            key: key_id,
                                            amount: orderAmount,
                                            currency: currency,
                                            name: 'Spare Driver',
                                            description: `${activeService?.title || 'Car Wash Service'}`,
                                            image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                                            order_id: order_id,
                                            handler: async function (response) {
                                                try {
                                                    setIsProcessing(true);
                                                    const verificationResult = await verifyPayment(
                                                        response.razorpay_order_id,
                                                        response.razorpay_payment_id,
                                                        response.razorpay_signature
                                                    );

                                                    if (verificationResult.success) {
                                                        const serviceItems = effectiveItems.filter(i => i.serviceId && i.type !== 'subscription');
                                                        if (serviceItems.length > 0) {
                                                            const res = await apiClient.createBooking({
                                                                ...bookingPayload,
                                                                paymentId: response.razorpay_payment_id,
                                                                orderId: response.razorpay_order_id
                                                            });

                                                            if (res?.status === 'success' && res?.data?.booking) {
                                                                handleBookingSuccess(res.data.booking);
                                                            }
                                                        }

                                                        const subscriptionItems = effectiveItems.filter(i => i.type === 'monthly' || i.type === 'subscription');
                                                        for (const sub of subscriptionItems) {
                                                            try {
                                                                await subscriptionAPI.createSubscription({
                                                                    planId: sub.serviceId || sub.planId,
                                                                    plan: sub.serviceId || sub.planId,
                                                                    paymentId: response.razorpay_payment_id,
                                                                    orderId: response.razorpay_order_id,
                                                                    signature: response.razorpay_signature,
                                                                    paymentMethod: 'online',
                                                                    vehicleId: selectedVehicle?._id || selectedVehicle?.id,
                                                                    status: 'active'
                                                                });
                                                            } catch (subErr) {
                                                                console.error('Failed to activate subscription:', subErr);
                                                            }
                                                        }

                                                        if (serviceItems.length === 0 && subscriptionItems.length > 0) {
                                                            toast.success('Subscription activated successfully!');
                                                            setCart([]);
                                                            navigate('/');
                                                        }
                                                    } else {
                                                        toast.error('Payment verification failed.');
                                                    }
                                                } catch (err) {
                                                    console.error('Handler error:', err);
                                                    toast.error('Error processing payment response.');
                                                } finally {
                                                    setIsProcessing(false);
                                                }
                                            },
                                            prefill: {
                                                name: user?.name || '',
                                                email: user?.email || '',
                                                contact: user?.phone || ''
                                            },
                                            theme: { color: '#FF6B00' },
                                            modal: {
                                                ondismiss: () => setIsProcessing(false)
                                            }
                                        };
                                        const rzp = new window.Razorpay(options);
                                        rzp.open();
                                    }
                                } catch (error) {
                                    console.error('Payment error:', error);
                                    toast.error(error.message || 'Payment failed. Please try again.');
                                    setIsProcessing(false);
                                }
                            }}
                            disabled={!paymentMethod || isProcessing}
                            className={`flex-1 max-w-[200px] h-11 rounded-xl font-[1000] text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-2xl shadow-black/50 ${!paymentMethod || isProcessing
                                ? 'bg-white/[0.05] text-white/20 cursor-not-allowed shadow-none'
                                : 'bg-[#1A1A1A] text-white active:scale-95 shadow-black/10'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Pay Securely</span>
                                    <Shield size={16} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderVehicleSelect = () => (
        <div className="p-4 space-y-4 font-sans">
            <h2 className="text-lg font-black text-white uppercase tracking-tight border-b border-black/[0.03] pb-2.5">Asset Management</h2>
            <div className="space-y-2.5">
                {vehicles.map(v => (
                    <motion.div
                        key={v.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedVehicle(v); setPhase(PHASES.SERVICE_SELECTION); }}
                        className={`p-4 rounded-xl border-white/5 transition-all ${selectedVehicle?.id === v.id ? 'bg-[#FFF6E9] border-brand shadow-lg' : 'bg-white/5 border-black/[0.03] opacity-60 hover:opacity-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-lg p-2 border border-orange-50 shadow-inner">
                                <img
                                    src={sanitizeUrl(v.img)}
                                    className="w-full h-full object-contain"
                                    onError={handleImageError}
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-black text-white uppercase tracking-tighter leading-none">{v.brand} {v.model}</h4>
                                <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest mt-1.5 leading-none">{v.plate}</p>
                            </div>
                            {selectedVehicle?.id === v.id && (
                                <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/20">
                                    <Check size={14} className="text-white" strokeWidth={4} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
            <button
                onClick={() => {
                    toast.success('Opening Garage...');
                    navigate('/vehicles?from=instant-wash');
                }}
                className="w-full border-white/5 border-dashed border-black/[0.06] rounded-xl p-6 text-black/30 font-black uppercase text-[10px] tracking-[0.3em] bg-white/[0.02]/50 hover:bg-white/[0.02] hover:border-white/10 transition-all flex flex-col items-center gap-2"
            >
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center  border border-black/[0.03]">
                    <Plus size={18} className="text-white/40" />
                </div>
                Register New Craft Asset
            </button>
        </div>
    );

    // 🛡️ Safe Render Guard: Never show Asset Management if redirect is imminent
    if (!vehiclesLoading && vehicles && vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F0D]">
                <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" strokeWidth={3} />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] animate-pulse">Initializing Direct Registry...</p>
            </div>
        );
    }

    return (
        <MobileLayout hideNav={phase === PHASES.LIVE_TRACK || phase === PHASES.CART || phase === PHASES.SELECT_SLOT || phase === PHASES.PAYMENT}>
            <div className="bg-[#FFFFFF] min-h-screen font-outfit relative">
                <style dangerouslySetInnerHTML={{ __html: `.font-outfit { font-family: 'Outfit', sans-serif; }` }} />
                
                {phase !== PHASES.CART && phase !== PHASES.SELECT_SLOT && phase !== PHASES.LIVE_TRACK && phase !== PHASES.PAYMENT}

                <AnimatePresence mode="wait">
                    {phase === PHASES.SELECT_VEHICLE && (
                        <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {renderVehicleSelect()}
                        </motion.div>
                    )}
                    {phase === PHASES.SERVICE_SELECTION && (
                        <motion.div key="service" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {renderServiceSelection()}
                        </motion.div>
                    )}
                    {phase === PHASES.FINDING && (
                        <motion.div key="finding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {renderFinding()}
                        </motion.div>
                    )}
                    {phase === PHASES.LIVE_TRACK && (
                        <motion.div key="track" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {renderLiveTrack()}
                        </motion.div>
                    )}
                    {phase === PHASES.CART && (
                        <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            {renderCart()}
                        </motion.div>
                    )}
                    {phase === PHASES.SELECT_SLOT && (
                        <motion.div key="slot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            {renderSelectSlot()}
                        </motion.div>
                    )}
                    {phase === PHASES.PAYMENT && (
                        <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            {renderPayment()}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Demo Modal (Shared) */}
                <AnimatePresence>
                    {showDemoVideo && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowDemoVideo(false)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
                            >
                                <button
                                    onClick={() => setShowDemoVideo(false)}
                                    className="absolute top-6 right-6 z-50 w-12 h-12 rounded-2xl bg-black/60 text-white flex items-center justify-center backdrop-blur-xl border border-white/10 active:scale-90 transition-transform"
                                >
                                    <X size={24} />
                                </button>
                                <video autoPlay controls playsInline className="w-full h-full object-cover">
                                    <source src="https://assets.mixkit.io/videos/preview/mixkit-hand-washing-a-car-with-a-sponge-and-foam-1582-large.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute bottom-8 left-8 right-8">
                                    <div className="bg-white/10 backdrop-blur-3xl rounded-2xl p-5 border border-white/10">
                                        <p className="text-white text-[13px] font-[1000] uppercase tracking-[0.2em]">Studio Detailing Protocol</p>
                                        <p className="text-white/50 text-[10px] font-bold mt-1 uppercase tracking-widest leading-relaxed">Experience precision-engineered car care delivered to your sanctuary.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>





                {/* Live tracking uses fullscreen overlay, nav bar hidden */}
            </div>
        </MobileLayout>
    );
};

export default InstantWash;

