import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Clock, CheckCircle2, ShieldCheck,
    ArrowRight, MapPin, ChevronDown, Car,
    Timer, Rocket, Star, Shield, Navigation,
    Phone, MessageSquare, Droplets, Camera,
    AlertTriangle, History, Search, X, ChevronLeft,
    CreditCard, LayoutGrid, Check, Info, ChevronRight,
    Plus, Minus, Gift, Bike, Crown, Play, Calendar, Home, Loader2, Radar, Image, Warehouse, CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { serviceAPI, productAPI, vehicleAPI } from '../../../utils/api';
import { socketService } from '../../../utils/socket';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';

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

/* â”€â”€â”€ Static Data (from ServiceSelection) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Hardcoded services removed. Will fetch dynamically from DB.
const VEHICLE_TYPES = [
    { id: 'hatchback', label: 'Hatch', multiplier: 1.0 },
    { id: 'sedan', label: 'Sedan', multiplier: 1.2 },
    { id: 'suv', label: 'SUV', multiplier: 1.5 },
    { id: 'muv', label: 'MUV', multiplier: 1.4 },
    { id: 'compact suv', label: 'Compact SUV', multiplier: 1.4 },
    { id: 'luxury sedan', label: 'Luxury Sedan', multiplier: 2.0 },
    { id: 'luxury suv', label: 'Luxury SUV', multiplier: 2.2 },
    { id: 'coupe', label: 'Coupe', multiplier: 1.8 },
    { id: 'convertible', label: 'Convertible', multiplier: 2.0 },
    { id: 'sports car', label: 'Sports Car', multiplier: 2.5 },
    { id: 'supercar', label: 'Super Car', multiplier: 3.0 },
    { id: 'ev', label: 'EV', multiplier: 1.2 },
    { id: 'mini truck', label: 'Mini Truck', multiplier: 1.8 },
    { id: 'truck', label: 'Truck', multiplier: 2.5 },
    { id: 'van', label: 'Van', multiplier: 1.8 },
    { id: 'tractor', label: 'Tractor', multiplier: 2.0 },
    { id: 'vintage', label: 'Vintage', multiplier: 2.5 },
    { id: 'bike', label: 'Bike', multiplier: 0.6 },
    { id: 'scooter', label: 'Scooter', multiplier: 0.5 },
    { id: 'superbike', label: 'Super Bike', multiplier: 0.9 },
    // Legacy support
    { id: 'luxury', label: 'Luxury', multiplier: 2.0 },
    { id: 'mpv', label: 'MUV', multiplier: 1.4 },
];

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
];

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
    'd3': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
};

const FullWashBooking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, vehicles, addresses, addBooking, updateBookingStatus, bookings, userSubscription, setUserSubscription, getRazorpayKey, createPaymentOrder, verifyPayment } = useAuth();
    const { cartItems: shopCart, removeFromCart, clearCart, addToCart } = useCart();

    const [phase, setPhase] = useState(PHASES.SERVICE_SELECTION);
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles.find(v => v.isPrimary) || vehicles[0]);
    const [selectedVehicleType, setSelectedVehicleType] = useState(vehicles.find(v => v.isPrimary)?.type?.toLowerCase() || vehicles[0]?.type?.toLowerCase() || 'sedan');
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [jobStateIndex, setJobStateIndex] = useState(0);
    const [serviceAddons, setServiceAddons] = useState({});
    const [useSubscription, setUseSubscription] = useState(false);
    const [showDemoVideo, setShowDemoVideo] = useState(false);
    const [showAddServices, setShowAddServices] = useState(false);
    const [showServiceCoverage, setShowServiceCoverage] = useState(false);
    const [cart, setCart] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync vehicle type when vehicle changes
    useEffect(() => {
        if (selectedVehicle?.type) {
            setSelectedVehicleType(selectedVehicle.type.toLowerCase());
        }
    }, [selectedVehicle]);

    // Dynamic Dates Generation
    const dates = useMemo(() => {
        const result = [];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            result.push({
                month: months[date.getMonth()],
                day: date.getDate().toString(),
                weekday: days[date.getDay()],
                trend: i < 3 ? 'up' : null
            });
        }
        return result;
    }, []);

    useEffect(() => {
        if (dates.length > 0 && !selectedDate) {
            setSelectedDate(`${dates[0].month} ${dates[0].day}`);
        }
    }, [dates]);

    // Dynamic Services State
    const [dynamicServices, setDynamicServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [passConfig, setPassConfig] = useState(null);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [expandedCategory, setExpandedCategory] = useState(null);

    const categories = useMemo(() => {
        const uniqueCats = [...new Set(dynamicServices.map(s => s.category))];
        return uniqueCats.filter(Boolean);
    }, [dynamicServices]);

    useEffect(() => {
        if (categories.length > 0 && !expandedCategory) {
            setExpandedCategory(categories[0]);
        }
    }, [categories]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingServices(true);
                // Fetch both services, home data (for config), and subscription plans
                const [servicesRes, homeRes, plansRes, prodRes] = await Promise.all([
                    serviceAPI.getServices(),
                    serviceAPI.getHomeData(),
                    serviceAPI.getPlans ? serviceAPI.getPlans() : Promise.resolve({ status: 'success', data: [] }),
                    productAPI.getProducts ? productAPI.getProducts({ limit: 4 }) : Promise.resolve({ status: 'success', data: { products: [] } })
                ]);

                console.log('Services Response:', servicesRes);
                console.log('Home Data Response:', homeRes);
                console.log('Plans Response:', plansRes);

                if (servicesRes.status === 'success' || Array.isArray(servicesRes.data)) {
                    const allServices = (servicesRes.data.services || servicesRes.data || []);
                    // Strictly filter for Studio Wash services (Studio/Vendor related)
                    const filtered = allServices.filter(s => {
                        const cat = (s.category || s.metadata?.category || '').toLowerCase();
                        const provider = (s.provider || s.metadata?.provider || '').toLowerCase();
                        const title = (s.title || '').toLowerCase();
                        
                        return (cat === 'studio' || provider === 'vendor' || cat.includes('detailing')) && 
                               !cat.includes('apartment') && 
                               !cat.includes('spare driver') &&
                               !title.includes('spare driver');
                    });
                    
                    setDynamicServices(filtered);
                    if (filtered[0]) {
                        setActiveServiceId(filtered[0].id || filtered[0]._id);
                    }
                }

                if (homeRes.status === 'success' && homeRes.data?.stats) {
                    const config = homeRes.data.stats.find(s => s.key === 'WASH_PASS_CONFIG');
                    if (config) {
                        setPassConfig(config.metadata);
                    }
                }

                if (plansRes.status === 'success' || Array.isArray(plansRes.data)) {
                    setSubscriptionPlans(plansRes.data.plans || plansRes.data || []);
                }

                if (prodRes.status === 'success' || prodRes.data?.products) {
                    setSuggestedProducts(prodRes.data?.products || []);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchInitialData();
    }, []);

    // Check if subscription can be used
    const canUseSubscription = useMemo(() => {
        if (!userSubscription || userSubscription.status !== 'Active' || userSubscription.washesLeft <= 0) return false;
        return (userSubscription.vehicleIds || []).includes(selectedVehicle?.id);
    }, [userSubscription, selectedVehicle]);

    useEffect(() => {
        if (!canUseSubscription) setUseSubscription(false);
    }, [canUseSubscription]);

    // Socket Integration for Live Tracking
    useEffect(() => {
        if (!activeBookingId) return;

        const handleUpdate = (data) => {
            if (data.bookingId === activeBookingId) {
                console.log('Studio Booking Update:', data);
                // Map DB status to 5-Phase UI State
                let uiStatusId = '';
                const dbStatus = data.status.toLowerCase();
                if(['pending', 'confirmed', 'accepted'].includes(dbStatus)) uiStatusId = 'CONFIRMED';
                else if(['assigned', 'pickup-assigned', 'en_route', 'arrived'].includes(dbStatus)) uiStatusId = 'EN_ROUTE';
                else if(['before_photo', 'at-studio', 'washing', 'in_progress', 'after_photo'].includes(dbStatus)) uiStatusId = 'WASHING';
                else if(['quality-check'].includes(dbStatus)) uiStatusId = 'QUALITY_CHECK';
                else if(['ready-for-delivery', 'delivery-assigned', 'completed'].includes(dbStatus)) uiStatusId = 'COMPLETED';

                const stateIdx = JOB_STATES.findIndex(s => s.id === uiStatusId);
                if (stateIdx !== -1) {
                    setJobStateIndex(stateIdx);
                }
            }
        };

        socketService.on('booking_status_updated', handleUpdate);
        return () => socketService.off('booking_status_updated', handleUpdate);
    }, [activeBookingId]);

    // Active Items
    const activeBooking = bookings.find(b => b.id === activeBookingId || b._id === activeBookingId);
    const activeService = dynamicServices.find(s => s.id === activeServiceId) || dynamicServices[0];

    // Price helpers from ServiceSelection
    const getPrice = (priceStr) => {
        const base = parseInt(String(priceStr).replace(/[^\d]/g, ''));
        const multiplier = VEHICLE_TYPES.find(v => v.id === selectedVehicleType)?.multiplier || 1;
        return Math.round(base * multiplier);
    };

    // Initialize service addons
    useEffect(() => {
        if (activeService) {
            const initialAddons = (activeService.addons || [])
                .filter(a => a.included)
                .map(a => a.id);
            setServiceAddons(prev => ({ ...prev, [activeServiceId]: initialAddons }));
        }
    }, [activeServiceId, activeService]);
    
    // Combined Pricing Logic (Unified for UI & Payment)
    const { totalCartPrice, discount, applyBlackDiscount, totalDuration, isBlackMember } = useMemo(() => {
        const bookingItemsTotal = (cart || []).reduce((sum, item) => sum + item.price, 0);
        const shopProductsTotal = (shopCart || []).reduce((sum, item) => sum + ((item.salePrice || item.price) * (item.qty || 1)), 0);
        const subscriptionPrice = selectedSubscription ? parseInt(selectedSubscription.price) || parseInt(selectedSubscription.total) : 0;
        
        let subtotal = bookingItemsTotal + shopProductsTotal + subscriptionPrice;
        
        // Black Pass Discount (30% if user is Black member or buying Black Pass)
        const isBlackMember = userSubscription?.planType === 'black' && userSubscription?.status === 'Active';
        const isBuyingBlack = selectedSubscription?.type === 'black' || 
                             (selectedSubscription?.title?.toLowerCase().includes('black')) ||
                             (selectedSubscription?.name?.toLowerCase().includes('black'));
        
        const applyBlackDiscount = isBlackMember || isBuyingBlack;
        const discount = applyBlackDiscount ? Math.round(subtotal * 0.3) : 0;
        const totalDuration = cart.reduce((sum, item) => sum + (item.duration || 120), 0);

        return {
            totalCartPrice: subtotal - discount,
            discount,
            applyBlackDiscount,
            totalDuration,
            isBlackMember
        };
    }, [cart, shopCart, selectedSubscription, userSubscription]);

    // Removed Simulated Flow Logic in favor of real API and Socket updates

    const handleStartSearch = () => {
        setPhase(PHASES.SERVICE_SELECTION);
    };

    const handleProceedToBooking = () => {
        const addons = activeService.addons || [];
        const selectedAddons = serviceAddons[activeServiceId] || [];
        const addonTotal = addons
            .filter(a => selectedAddons.includes(a.id) && !a.included)
            .reduce((sum, a) => sum + a.price, 0);
        const basePrice = getPrice(activeService.price);
        const totalPrice = basePrice + addonTotal;

        const newItem = {
            id: Date.now(),
            serviceId: activeServiceId,
            serviceName: activeService.title,
            price: totalPrice,
            vehicleId: selectedVehicle?.id,
            vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Your Car",
            vehicleImg: selectedVehicle?.img || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
            duration: activeService.estimatedTime || 120,
            type: 'standard'
        };

        setCart(prev => {
            const isDuplicate = prev.some(it => it.serviceId === newItem.serviceId && it.vehicleId === newItem.vehicleId);
            if (isDuplicate) return prev;
            return [...prev, newItem];
        });
        setPhase(PHASES.CART);
    };

    const handleSelectMonthly = (plan) => {
        const newItem = {
            id: Date.now(),
            planId: plan.id || 'monthly',
            serviceName: plan.title,
            price: parseInt(plan.total),
            vehicleId: selectedVehicle?.id,
            vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Your Car",
            vehicleImg: selectedVehicle?.img || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
            type: 'monthly'
        };
        setCart(prev => {
            const isDuplicate = prev.some(it => it.planId === newItem.planId && it.vehicleId === newItem.vehicleId);
            if (isDuplicate) return prev;
            return [...prev, newItem];
        });
        setPhase(PHASES.CART);
    };

    const toggleAddon = (addonId) => {
        const currentAddons = serviceAddons[activeServiceId] || [];
        const addon = activeService.addons?.find(a => a.id === addonId);
        if (addon?.included) return;

        setServiceAddons(prev => ({
            ...prev,
            [activeServiceId]: currentAddons.includes(addonId)
                ? currentAddons.filter(id => id !== addonId)
                : [...currentAddons, addonId]
        }));
    };

    const sanitizeUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80';
        if (url.startsWith('http')) return url;
        if (url.startsWith('assets')) return `/${url}`;
        return url;
    };

    const handleImageError = (e) => {
        e.target.src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80';
    };

    const renderHeader = () => {
        if (phase === PHASES.LIVE_TRACK) return null;
        return (
            <header className="px-5 pt-5 pb-3 flex items-center justify-between bg-white border-b border-black/[0.04] sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-1 -ml-1 text-black"
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[16px] font-[1000] text-black tracking-tight uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                        CAR WASH & CARE
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 flex items-center justify-center rounded-lg border border-black/[0.03]">
                        <Image size={16} className="text-black/40" />
                    </div>
                </div>
            </header>
        );
    };

    const renderIdle = () => {
        return (
            <div className="space-y-6 pt-6 pb-12">
                {/* Theme Hero Section */}
                <section className="px-5">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] p-6 relative overflow-hidden min-h-[130px] shadow-[0_20px_50px_rgba(242,159,5,0.15)] border border-brand/20"
                    >
                        <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-brand/30 rounded-full blur-[80px]" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center bg-brand/20 backdrop-blur-md border border-brand/10 px-3 py-1 rounded-lg mb-4">
                                <Zap size={10} fill="currentColor" className="text-brand mr-2" />
                                <span className="text-[9px] font-black text-brand uppercase tracking-[0.2em] leading-none">Instant Deployment</span>
                            </div>
                            <h2 className="text-[36px] font-[1000] text-black leading-[0.8] uppercase tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                WASH IN<br />
                                <span className="text-brand">{activeService?.estimatedTime || 120} MINS</span>
                            </h2>
                            <p className="text-black/40 text-[10px] font-bold uppercase tracking-[0.1em] max-w-[170px] leading-relaxed">
                                Experience studio-grade detailing <br />delivered to your exact location.
                            </p>
                        </div>

                        <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-auto drop-shadow-[0_20px_40px_rgba(242,159,5,0.4)] pointer-events-none">
                            <img src="/assets/carwash/6.png" className="w-full h-auto object-contain" />
                        </div>
                    </motion.div>
                </section>

                {/* Premium Vehicle Status */}
                <section className="px-5">
                    <div className="bg-white rounded-[2rem] border border-black/[0.06] p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-[#FDF8EE] rounded-xl flex items-center justify-center border border-orange-100/50 shadow-inner overflow-hidden">
                            <img src={selectedVehicle?.img} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-[15px] font-[1000] text-black leading-none">{selectedVehicle?.brand} {selectedVehicle?.model}</h4>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest leading-none">{selectedVehicle?.plate || 'Active Session'}</p>
                        </div>
                        <button
                            onClick={() => setPhase(PHASES.SELECT_VEHICLE)}
                            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black/40 hover:text-brand transition-colors"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </section>

                {/* Quick Pricing Brief */}
                <section className="px-5">
                    <div className="bg-[#F3DCCB] rounded-[2rem] p-6 border border-[#DBC4B5]/40 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-[1000] text-black leading-none">Starting Subscription</h3>
                            <h3 className="text-2xl font-[1000] text-black leading-none">₹{getPrice(activeService?.price || '299')} <span className="text-[11px] font-bold text-black/40 NOT-italic ml-1">per session</span></h3>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/10">
                                <Stars size={22} className="text-brand" fill="currentColor" />
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                setPhase(PHASES.FINDING);
                            }}
                            className="w-full bg-[#1A1A1A] text-white h-14 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform"
                        >
                            Confirm Service Protocol
                            <ChevronRight size={18} strokeWidth={3} />
                        </motion.button>
                    </div>
                </section>

                {/* Specs Grid */}
                <section className="px-5">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { title: 'Response', desc: `< ${activeService?.estimatedTime || 120} MINS`, icon: Timer, color: 'text-brand' },
                            { title: 'Quality', desc: 'STUDIO GRADE', icon: ShieldCheck, color: 'text-emerald-500' }
                        ].map((spec, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-black/[0.03] shadow-sm flex flex-col gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center ${spec.color}`}>
                                    <spec.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-black/20 uppercase tracking-widest">{spec.title}</p>
                                    <p className="text-[11px] font-black text-black mt-0.5">{spec.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    };

    const renderServiceSelection = () => {
        const currentAddons = serviceAddons[activeServiceId] || [];
        const basePrice = getPrice(activeService?.price || 299);
        const addonTotal = (activeService?.addons || [])
            .filter(a => currentAddons.includes(a.id) && !a.included)
            .reduce((sum, a) => sum + a.price, 0);
        const totalPrice = basePrice + addonTotal;

        return (
            <div className="bg-gray-100 min-h-screen pb-20">
                <div className="bg-[#FFFCE8] border-b border-yellow-100 py-2 px-6 flex items-center justify-center gap-2">
                    <p className="text-black/80 text-[11px] font-bold text-center">
                        {passConfig?.marketingLine || 'Save up to 40% on every service'} with <span className="text-black font-[1000]">{passConfig?.title || 'clean2wash BLACK'}</span>
                    </p>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                </div>

                {/* Selected Vehicle Context (Premium Redesign) */}
                <div className="px-5 pt-4 pb-2">
                    <div className="bg-white rounded-[1.25rem] p-4 flex items-center justify-between border border-black/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        {selectedVehicle ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/[0.02] shadow-inner">
                                    <Car size={20} className="text-black/80" />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-[1000] text-black tracking-tight leading-none mb-1.5 uppercase italic">{selectedVehicle.brand}</h4>
                                    <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none">{selectedVehicle.model} • {selectedVehicle.type}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/30 shadow-inner">
                                    <Car size={20} className="text-brand/40" />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-[1000] text-black tracking-tight leading-none mb-1.5 uppercase italic">Select Your Asset</h4>
                                    <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] leading-none">Registration Required</p>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate('/vehicles?from=full-wash')} 
                            className="text-[10px] font-black text-brand uppercase tracking-[0.15em] border border-orange-100 px-4 py-2 rounded-xl active:scale-95 transition-all"
                        >
                            {selectedVehicle ? 'CHANGE' : 'SELECT'}
                        </button>
                    </div>
                </div>

                {/* Wash Packages List (Grouped) */}
                <div className="px-4 py-2 space-y-4">
                    {console.log('Current dynamicServices:', dynamicServices)}
                    {loadingServices ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 size={32} className="text-brand animate-spin" />
                        </div>
                    ) : (
                        categories.map((cat) => {
                            const servicesInCat = dynamicServices.filter(s => s.category === cat);
                            const isCatExpanded = expandedCategory === cat;

                            return (
                                <div key={cat} className="space-y-4">
                                    <div
                                        onClick={() => setExpandedCategory(isCatExpanded ? null : cat)}
                                        className={`px-6 py-4 rounded-[1.5rem] flex items-center justify-between cursor-pointer transition-all ${isCatExpanded ? 'bg-[#222222] text-white' : 'bg-[#EBD3C1] text-black shadow-sm'}`}
                                    >
                                        <h3 className="text-[14px] font-[1000] tracking-tight uppercase italic">{cat}</h3>
                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isCatExpanded ? 'rotate-180 text-brand' : 'opacity-40'}`} />
                                    </div>

                                    <AnimatePresence>
                                        {isCatExpanded && servicesInCat.map((pkg) => {
                                            const isPkgActive = activeServiceId === pkg.id;
                                            const pkgBasePrice = getPrice(pkg.price);
                                            const splitImages = [
                                                pkg.image || '/assets/carwash/6.png',
                                                '/assets/carwash/7.png',
                                                '/assets/carwash/8.png'
                                            ];

                                            return (
                                                <motion.div
                                                    key={pkg.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-white rounded-[2.5rem] border border-black/[0.03] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.05)]"
                                                >
                                                    {/* Diagonal Image Split Section */}
                                                    <div className="relative h-[110px] flex overflow-hidden">
                                                        <div className="flex-1 relative">
                                                            <img src={splitImages[0]} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                                                        </div>
                                                        <div className="absolute left-[35%] top-0 bottom-0 w-[40%] skew-x-[-15deg] border-x-[6px] border-white overflow-hidden shadow-2xl z-10 bg-white">
                                                            <img src={splitImages[1]} className="w-full h-full object-cover skew-x-[15deg] scale-150" />
                                                        </div>
                                                        <div className="flex-1 relative group">
                                                            <img src={splitImages[2]} className="w-full h-full object-cover" />
                                                            <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 rounded text-white text-[10px] font-black italic shadow-lg">
                                                                {selectedVehicle?.brand || 'BMW'}
                                                                <div className="flex gap-0.5 mt-0.5">
                                                                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1 bg-brand" />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rating & Price Stats */}
                                                    <div className="px-6 py-5 flex items-center justify-between border-b border-black/[0.02]">
                                                        <div className="flex items-center gap-3">
                                                            <Star size={20} fill="#F29F05" className="text-brand" />
                                                            <span className="text-[16px] font-[1000] text-black leading-none">{pkg.rating}</span>
                                                            <div className="w-1.5 h-1.5 bg-black/10 rounded-full" />
                                                            <span className="text-[13px] font-bold text-black/30 tracking-tight">2,530 Ratings</span>
                                                        </div>

                                                        <div className="bg-[#FAF1E8] px-6 py-2.5 rounded-[1.5rem] border border-[#EBE0D5] text-center shadow-sm">
                                                            <p className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Starting</p>
                                                            <span className="text-[22px] font-[1000] text-black leading-none">₹{pkgBasePrice}</span>
                                                        </div>
                                                    </div>

                                                    {/* BLACK Pass Upsell */}
                                                    <div className="bg-brand/5 px-6 py-3 border-b border-black/[0.02] flex items-center justify-center">
                                                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-tight">
                                                            {passConfig?.marketingLine || 'Save up to 40% on every service'} with <span className="font-[1000] text-black">{passConfig?.title || 'clean2wash BLACK'}</span>
                                                        </p>
                                                    </div>

                                                    {/* Package Content */}
                                                    <div className="p-6 pt-5 space-y-6">
                                                        <div className="flex items-start gap-5">
                                                            <div className="flex-1 space-y-4">
                                                                <div>
                                                                    <h4 className="text-[13px] font-[1000] text-black uppercase tracking-widest leading-none mb-1">Personalize Wash</h4>
                                                                    <button onClick={() => setShowServiceCoverage(true)} className="text-brand text-[10px] font-black uppercase tracking-[0.2em] border-b border-brand/20">View Details</button>
                                                                </div>

                                                                <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/30">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
                                                                        <p className="text-[11px] font-bold text-black/60 leading-relaxed">
                                                                            <span className="text-black font-black uppercase tracking-tight">Pro Tip:</span> Add Interior Cleaning to remove deep-seated dust and allergens.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right Promo Card */}
                                                            <div className="w-[125px] flex-shrink-0 bg-[#FAF1E8] rounded-[2rem] border border-[#E9DCCF]/50 p-4 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden group">
                                                                <img src="/assets/carwash/6.png" className="w-16 h-16 object-cover rounded-2xl shadow-md border-2 border-white group-hover:scale-110 transition-transform" />
                                                                <div className="text-center">
                                                                    <p className="text-[#2D9944] font-black text-[10px] uppercase leading-tight">Service at</p>
                                                                    <p className="text-[#2D9944] font-[1000] text-[24px] leading-none">₹20</p>
                                                                    <p className="text-[7px] font-black text-black/30 uppercase tracking-widest leading-none mt-1">/ Wash</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setShowDemoVideo(true)}
                                                                    className="w-10 h-10 bg-[#FF4B91] rounded-full flex items-center justify-center shadow-lg shadow-pink-200 active:scale-90 transition-transform"
                                                                >
                                                                    <Play size={14} fill="white" className="text-white ml-0.5" />
                                                                </button>
                                                                <span className="text-[8px] font-bold text-black/40 uppercase tracking-[0.2em]">Learn More</span>
                                                            </div>
                                                        </div>

                                                        {/* Main Action Button */}
                                                        <button
                                                            onClick={() => {
                                                                setActiveServiceId(pkg.id || pkg._id);
                                                                if (selectedVehicle) {
                                                                    setShowServiceCoverage(true);
                                                                } else {
                                                                    navigate('/vehicles?from=full-wash');
                                                                }
                                                            }}
                                                            className={`w-full h-16 rounded-[1.5rem] font-[1000] text-[15px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all ${
                                                                selectedVehicle 
                                                                ? 'bg-[#1A1A1A] text-white' 
                                                                : 'bg-gray-100 text-black/30 shadow-none'
                                                            }`}
                                                        >
                                                            {selectedVehicle ? 'Select Vehicle & Book' : 'Select Vehicle to Book'}
                                                        </button>

                                                        {/* Trust Badges */}
                                                        <div className="flex items-center justify-between px-2 opacity-30">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Sanitized</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Timer size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">On-Time</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Vehicle Protocol Selector (New) */}
                <div className="px-5 pt-8 pb-12">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] mb-4 text-center">Vehicle Protocol</p>
                    <div className="flex items-center gap-3">
                        {['Hatch', 'Sedan', 'SUV'].map((type) => {
                            const isActive = selectedVehicleType === type.toLowerCase();
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedVehicleType(type.toLowerCase())}
                                    className={`flex-1 group relative ${isActive ? 'scale-105' : 'opacity-40'}`}
                                >
                                    <div className={`bg-white rounded-2xl p-5 border transition-all ${isActive ? 'border-brand shadow-xl ring-4 ring-brand/5' : 'border-black/[0.05]'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className={`text-[11px] font-[1000] uppercase tracking-tight ${isActive ? 'text-black' : 'text-gray-400'}`}>{type}</h4>
                                            {isActive && (
                                                <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center text-white shadow-sm">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-4">Protocol</p>
                                        <div className={`h-[2.5px] w-12 rounded-full transition-all ${isActive ? 'bg-brand' : 'bg-gray-100'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>


                {/* Service Coverage Details Modal (Exactly as image) */}
                < AnimatePresence >
                    {showServiceCoverage && (
                        <div className="fixed inset-0 z-[120] flex items-end justify-center">
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
                                className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] flex flex-col max-h-[95vh] shadow-2xl overflow-hidden"
                            >
                                {/* BLACK Pass Upsell (Premium Refinement) */}
                                <div className="bg-[#FFFCE8] px-6 py-4 flex items-center justify-between border-b border-yellow-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-full bg-yellow-400/5 skew-x-[-20deg] group-hover:bg-yellow-400/10 transition-colors" />
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-9 h-9 rounded-xl bg-black text-brand flex items-center justify-center font-black shadow-lg text-[14px]">H</div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[13px] font-[1000] text-black tracking-tight uppercase">{passConfig?.title || 'clean2wash BLACK'}</span>
                                                <div className="w-4 h-4 rounded-full bg-black/5 flex items-center justify-center">
                                                    <Info size={10} className="text-black/40" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-none mt-1">12 Months Priority Access</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="text-right">
                                            <p className="text-[14px] font-black text-black leading-none tracking-tight">₹{passConfig?.price || '499'}</p>
                                            <p className="text-[10px] font-bold text-black/20 line-through">₹{passConfig?.comparativePrice || '1200'}</p>
                                        </div>
                                        <button className="bg-brand text-black px-4 py-1.5 rounded-lg text-[10px] font-[1000] uppercase shadow-sm active:scale-95 transition-all">Add</button>
                                    </div>
                                    <button
                                        onClick={() => setShowServiceCoverage(false)}
                                        className="absolute -top-12 right-4 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border border-black/[0.03]"
                                    >
                                        <X size={22} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Modal Header Content (Professional Layout) */}
                                <div className="px-6 pt-6 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h2 className="text-[18px] font-[1000] text-black leading-tight tracking-tight uppercase">
                                                {activeService?.title}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="px-1.5 py-0.5 bg-black/[0.04] text-black/40 text-[8px] font-black rounded uppercase tracking-widest">{activeService?.tag}</span>
                                                <div className="w-1 h-1 rounded-full bg-brand" />
                                                <span className="text-[9px] font-black text-brand uppercase tracking-widest">Premium Care</span>
                                            </div>
                                        </div>
                                        <div className="bg-white px-2.5 py-1.5 rounded-xl border border-black/[0.06] text-center shadow-sm">
                                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                                <span className="text-[14px] font-[1000] text-black leading-none">{activeService?.rating || '3.9'}</span>
                                                <Star size={12} fill="#FFD100" strokeWidth={0} className="text-[#FFD100]" />
                                            </div>
                                            <p className="text-[7px] font-black text-black/20 uppercase tracking-tighter leading-none">Verified</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pt-2">
                                        <div>
                                            <p className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1 leading-none">Total Fee</p>
                                            <span className="text-[22px] font-[1000] text-black leading-none tracking-tight">₹{totalPrice}</span>
                                        </div>
                                        <div className="h-8 w-px bg-black/[0.06]" />
                                        <div>
                                            <p className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1 leading-none">Session Time</p>
                                            <div className="flex items-center gap-1.5 text-black font-[1000] text-[14px] leading-none">
                                                <Clock size={14} strokeWidth={3} className="text-brand" />
                                                <span>18 MINS</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Coverage Section Header */}
                                <div className="px-6 py-3 flex items-center justify-between mt-1">
                                    <h3 className="text-[11px] font-[1000] text-black uppercase tracking-widest leading-none">Detailed Coverage</h3>
                                    <button className="text-brand font-black text-[10px] uppercase tracking-[0.2em] leading-none">Explore All</button>
                                </div>

                                {/* Comparison Table (Premium Re-styled) */}
                                <div className="flex-1 overflow-y-auto px-5 pb-6">
                                    <div className="border border-black/[0.05] rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white">
                                        {/* Table Header (Refined) */}
                                        <div className="flex bg-gray-50/50 border-b border-black/[0.04]">
                                            <div className="flex-1 py-3 px-4 flex items-center gap-2 border-r border-black/[0.04]">
                                                <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 size={10} strokeWidth={3} />
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Included</span>
                                            </div>
                                            <div className="flex-1 py-3 px-4 flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-black/[0.04] flex items-center justify-center text-black/20">
                                                    <Info size={10} strokeWidth={3} />
                                                </div>
                                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Exclusions</span>
                                            </div>
                                        </div>

                                        {/* Table Rows (Dynamic from Metadata) */}
                                        <div className="divide-y divide-black/[0.02] bg-white">
                                            {(() => {
                                                const inclusions = activeService?.metadata?.inclusions || [];
                                                const exclusions = activeService?.metadata?.exclusions || [];
                                                const maxRows = Math.max(inclusions.length, exclusions.length);
                                                const rows = [];
                                                for (let i = 0; i < maxRows; i++) {
                                                    rows.push({
                                                        in: inclusions[i] || '-',
                                                        out: exclusions[i] || '-'
                                                    });
                                                }
                                                return rows.map((row, i) => (
                                                    <div key={i} className="flex min-h-[44px]">
                                                        <div className="flex-1 py-2.5 px-4 border-r border-black/[0.02] flex items-center gap-2.5">
                                                            {row.in !== '-' ? (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                            ) : (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-black/5 shrink-0" />
                                                            )}
                                                            <span className={`text-[10px] font-bold leading-none tracking-tight uppercase ${row.in !== '-' ? 'text-black/80' : 'text-black/10'}`}>{row.in}</span>
                                                        </div>
                                                        <div className="flex-1 py-2.5 px-4 flex items-center gap-2.5">
                                                            {row.out !== '-' ? (
                                                                <div className="w-1 h-1 rounded-full bg-black/10 shrink-0" />
                                                            ) : (
                                                                <div className="w-1 h-1 rounded-full bg-black/5 shrink-0" />
                                                            )}
                                                            <span className={`text-[10px] font-bold leading-none tracking-tight uppercase ${row.out !== '-' ? 'text-black/30' : 'text-black/10'}`}>{row.out}</span>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    <div className="mt-4 px-2 flex items-center gap-3 bg-brand/5 p-4 rounded-2xl border border-brand/10">
                                        <ShieldCheck size={18} className="text-brand shrink-0" />
                                        <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest leading-relaxed">Studio grade service guarantee included with every booking.</p>
                                    </div>
                                </div>

                                {/* Modal Footer (More Compact) */}
                                <div className="px-6 py-4 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] border-t border-black/[0.03]">
                                    <div className="flex items-center justify-between max-w-lg mx-auto">
                                        <div>
                                            <p className="text-[7px] font-[1000] text-black/20 uppercase tracking-[0.25em] mb-1">Value Amount</p>
                                            <div className="text-[20px] font-[1000] text-black leading-none tracking-tight">
                                                ₹{totalPrice}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newCartItem = {
                                                    id: Date.now(),
                                                    serviceId: activeServiceId,
                                                    serviceName: `(${activeService?.tag}) ${activeService?.title} Only`,
                                                    vehicleName: `${selectedVehicle?.brand} ${selectedVehicle?.model}`,
                                                    price: totalPrice,
                                                    vehicleImg: selectedVehicle?.img,
                                                    included: activeService?.metadata?.inclusions || []
                                                };
                                                setCart([...cart, newCartItem]);
                                                setShowServiceCoverage(false);
                                                setPhase(PHASES.CART);
                                            }}
                                            className="bg-black text-white flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl font-[1000] text-[12px] uppercase tracking-widest shadow-xl shadow-black/5 active:scale-95 transition-all group"
                                        >
                                            Add to Cart
                                            <ChevronRight size={16} strokeWidth={4} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence >

                {/* Video Demo Modal */}
                < AnimatePresence >
                    {showDemoVideo && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowDemoVideo(false)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-lg aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                            >
                                <button
                                    onClick={() => setShowDemoVideo(false)}
                                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10"
                                >
                                    <X size={20} />
                                </button>

                                <video
                                    autoPlay
                                    controls
                                    className="w-full h-full object-cover"
                                    src="https://assets.mixkit.io/videos/preview/mixkit-hand-washing-a-car-with-a-sponge-and-foam-1582-large.mp4"
                                />

                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-white text-[12px] font-black uppercase tracking-widest">clean2wash PRO DEMO</p>
                                        <p className="text-white/60 text-[10px] font-bold mt-1">See how our professional captains transform your vehicle.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence >

                {/* Add Services Bottom Sheet Modal */}
                < AnimatePresence >
                    {showAddServices && (
                        <div className="fixed inset-0 z-[110] flex items-end justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddServices(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-lg bg-[#F1F6FA] rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="px-6 py-5 flex items-center justify-between border-b border-white/50 bg-white/20 backdrop-blur-md sticky top-0 z-20">
                                    <h3 className="text-[18px] font-black text-black">Add Services</h3>
                                    <button
                                        onClick={() => setShowAddServices(false)}
                                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-90 transition-transform"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Modal Body (Scrollable) */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                    {(activeService?.addons || []).map((addon) => {
                                        const isSelected = (serviceAddons[activeServiceId] || []).includes(addon.id);
                                        return (
                                            <div key={addon.id} className="bg-white rounded-[1.25rem] p-3 flex items-center gap-3 shadow-soft border border-black/[0.03]/50">
                                                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                                    <img
                                                        src={pkgAddonImages[addon.id] || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[13px] font-black text-black leading-tight mb-0.5">{addon.name}</h4>
                                                    <div className="flex items-center gap-1.5 text-black/40 font-bold text-[11px]">
                                                        <span>₹{addon.price}</span>
                                                        <div className="w-1 h-1 bg-black/5 rounded-full" />
                                                        <span>10 mins</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleAddon(addon.id)}
                                                    className={`px-5 py-2 rounded-xl font-black text-[13px] shadow-sm transition-all active:scale-95 ${isSelected
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-brand text-black'
                                                        }`}
                                                >
                                                    {isSelected ? <Check size={16} strokeWidth={4} /> : 'Add'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-6 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-black/[0.03]">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[20px] font-black text-black">
                                            ₹ {totalPrice}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowAddServices(false);
                                                setShowServiceCoverage(true);
                                            }}
                                            className="bg-[#1A1A1A] text-white flex items-center justify-center gap-3 px-10 py-5 rounded-[1.5rem] font-black text-[15px] uppercase shadow-xl active:scale-95 transition-transform"
                                        >
                                            Continue
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence >


                {/* Vehicle Type Selection (KEPT AS IS AS REQUESTED) */}
                < section className="px-5 pb-20" >
                    <div className="bg-white rounded-xl border border-black/[0.03] p-3.5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[9px] font-black text-black/40 uppercase tracking-widest">Vehicle Type</h3>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                            {VEHICLE_TYPES.map(v => (
                                <button key={v.id}
                                    onClick={() => setSelectedVehicleType(v.id)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${selectedVehicleType === v.id
                                        ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                                        : 'bg-white border-black/[0.06] text-black/30'
                                        }`}>
                                    {(v.id === 'bike' || v.id === 'scooter') ? (
                                        <Bike size={11} strokeWidth={selectedVehicleType === v.id ? 3 : 2} />
                                    ) : (
                                        <Car size={11} strokeWidth={selectedVehicleType === v.id ? 3 : 2} />
                                    )}
                                    <span className="text-[9px] font-black uppercase tracking-tight">{v.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section >
            </div >
        );
    };

    const renderFinding = () => (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-[#0C0C0C] relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-brand/20 rounded-full animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-brand/10 rounded-full animate-pulse delay-75" />
            </div>

            <div className="relative w-72 h-72 mb-16 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-brand/30 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                    className="absolute inset-10 border border-brand/20 rounded-full"
                />

                <div className="relative z-10 w-28 h-28 bg-brand rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(242,159,5,0.4)]">
                    <Radar size={44} className="text-white animate-pulse" strokeWidth={2.5} />
                </div>

                {/* Satellite Beams */}
                {[0, 120, 240].map((angle, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 3, delay: i * 1 }}
                        className="absolute w-1 h-32 bg-gradient-to-t from-brand to-transparent origin-bottom"
                        style={{ rotate: `${angle}deg`, top: '-20%' }}
                    />
                ))}
            </div>

            <div className="space-y-4">
                <h2 className="text-[22px] font-[1000] text-white uppercase tracking-tighter">Securing Studio Bay...</h2>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Establishing Vendor Link</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest max-w-[280px] leading-relaxed mx-auto">
                        Sector: Bangalore South-04 | Grid-Status: Optimal
                    </p>
                </div>
            </div>

            <div className="mt-16 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-1/2 h-full bg-brand shadow-[0_0_15px_rgba(242,159,5,0.8)]"
                />
            </div>

            {/* Fallback Option */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3, duration: 0.8 }}
                className="absolute bottom-10 left-5 right-5"
            >
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center gap-2 justify-center text-white/50">
                        <AlertTriangle size={14} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Taking too long?</p>
                    </div>
                    <p className="text-[9px] font-bold text-white/40 mb-1 leading-relaxed">If no captains are available nearby right now, you can switch to scheduling it instead.</p>
                    <button
                        onClick={() => navigate('/full-wash-booking')}
                        className="w-full bg-brand text-black h-12 rounded-xl font-[1000] text-[11px] uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all"
                    >
                        Schedule Wash For Later
                    </button>
                    <button
                        onClick={() => { setPhase(PHASES.SERVICE_SELECTION); }}
                        className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 hover:text-white transition-colors"
                    >
                        Cancel Search
                    </button>
                </div>
            </motion.div>
        </div>
    );

    const renderLiveTrack = () => {
        const currentJobState = JOB_STATES[jobStateIndex];
        const isCompleted = jobStateIndex === JOB_STATES.length - 1;

        return (
            <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col overflow-hidden font-outfit">
                {/* Professional Map Background */}
                <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                    {/* Dark City Map Visual */}
                    <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80"
                        className="w-full h-full object-cover opacity-30 grayscale contrast-125"
                        alt="Tracking Map"
                    />

                    {/* Dark Overlay for better contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />

                    {/* Subtle Grid Overlay */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `linear-gradient(#F29F05 1px, transparent 1px), linear-gradient(90deg, #F29F05 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Radar Pulse Elements */}
                    <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: [0.5, 2.5], opacity: [0.3, 0] }}
                                transition={{ repeat: Infinity, duration: 4, delay: i * 1.3, ease: "easeOut" }}
                                className="absolute w-64 h-64 border border-brand/30 rounded-full"
                            />
                        ))}

                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative z-10 w-12 h-12 bg-brand rounded-2xl border-2 border-white/20 shadow-[0_0_30px_rgba(242,159,5,0.4)] flex items-center justify-center"
                        >
                            <Zap size={20} className="text-white" fill="currentColor" />
                        </motion.div>

                        <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] font-outfit shadow-black shadow-lg">
                                {JOB_STATES[jobStateIndex]?.label || 'Studio En Route'}
                            </span>
                        </div>
                    </div>

                    {/* Path Decorations */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#F29F05" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                        <path d="M 0 450 Q 200 350 400 450" stroke="url(#pathGradient)" strokeWidth="2" fill="transparent" strokeDasharray="5 5" />
                    </svg>
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
                            className="bg-black/90 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_12px_rgba(242,159,5,0.8)]" />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{isCompleted ? 'Completed' : 'Wash in Progress'}</span>
                                    {!isCompleted && <span className="text-[8px] font-bold text-white/40 uppercase mt-0.5 tracking-tighter">Arriving Soon</span>}
                                </div>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[10px] font-black text-brand uppercase">{activeBooking?.status?.replace('_', ' ') || 'PROCESSED'}</span>
                            </div>
                        </motion.div>

                        <div className="w-10" />
                    </div>
                </div>

                {/* Bottom Sheet UI */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    className="mt-auto relative z-20 bg-white rounded-t-[2.5rem] shadow-[0_-30px_60px_rgba(0,0,0,0.5)] pb-6 min-h-[45vh] max-h-[75vh] overflow-y-auto"
                >
                    {/* Pull Handle */}
                    <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto my-3 sticky top-0 bg-white z-30" />

                    <div className="px-6 space-y-4">
                        {/* Service Title & Pricing */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-[#FFF6E9] rounded-xl flex items-center justify-center border border-orange-100/50 overflow-hidden shadow-inner">
                                    <img src={selectedVehicle?.img} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-[15px] font-[1000] text-black uppercase tracking-tighter leading-none">{activeBooking?.serviceName}</h3>
                                        <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[6px] font-black rounded-full uppercase tracking-widest">Fastest</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest leading-none">Estimate: 11:40 AM</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[15px] font-[1000] text-black">{activeBooking?.price}</h4>
                            </div>
                        </div>

                        {/* Vendor Status Timeline */}
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-black/[0.06]/50">
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                                    className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm grayscale"
                                    alt="Vendor"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Check size={7} className="text-white" strokeWidth={4} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">{activeBooking?.vendorName || 'Auto Studio'}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-black/[0.06]">
                                        <Star size={8} fill="#F29F05" className="text-brand mr-1" />
                                        <span className="text-[9px] font-black text-black">4.9</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-black/20 uppercase tracking-tighter">ID: {activeBooking?.id || activeBooking?._id?.slice(-6) || 'CW-891'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toast.success('Calling Studio...')} className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-black border border-gray-200 shadow-sm"><Phone size={14} /></motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toast.success('Opening Chat...')} className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-black border border-gray-200 shadow-sm"><MessageSquare size={14} /></motion.button>
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
                                                <div className={`w-0.5 h-4 -my-0.5 transition-colors ${isPassed ? 'bg-green-500' : 'bg-gray-100'}`} />
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-black' : isPassed ? 'text-green-600' : 'text-gray-300'}`}>
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
                                onClick={() => toast.error('Emergency SOS Triggered! Support is on the way.', { duration: 6000 })}
                                className="flex items-center justify-center gap-3 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                            >
                                <AlertTriangle size={12} />
                                SOS Help
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => toast.success('Security PIN: 4821', { duration: 8000 })}
                                className="bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20"
                            >
                                Security PIN
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
        const primaryAddress = selectedLocation || addresses.find(a => a.isPrimary) || addresses[0];
        // Pricing handled by unified useMemo at top

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32">
                {/* Cart Header */}
                <div className="bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-black/[0.03] sticky top-0 z-50">
                    <button onClick={() => setPhase(PHASES.SERVICE_SELECTION)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <h2 className="text-[14px] font-black text-black uppercase tracking-tight">Booking Summary</h2>
                </div>

                <div className="p-4 space-y-4">
                    {/* Cart Items (Premium Modern) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Selected Assets</h3>
                        </div>
                        {cart.map(item => (
                            <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-sm relative border border-black/[0.03] flex items-center justify-between group transition-all hover:border-brand/30">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-black/[0.05] shadow-sm overflow-hidden flex-shrink-0">
                                        <img src={item.vehicleImg} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-[7.5px] font-black text-black/20 uppercase tracking-widest leading-none">{item.vehicleName}</p>
                                        </div>
                                        <h4 className="text-[11.5px] font-[1000] text-black leading-none uppercase tracking-tight mb-1.5">
                                            {item.serviceName}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Clock size={9} className="text-black/30" />
                                                <span className="text-[7.5px] font-bold text-black/40 uppercase tracking-tighter">{item.duration || 120} Mins</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-black/5" />
                                            <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest">Instant Wash Mode</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1.5">
                                    <div className="flex flex-col items-end">
                                        <div className="text-[17px] font-[1000] text-black tracking-tight leading-none mb-1">
                                            ₹{item.price}
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-emerald-50 rounded text-[6.5px] font-black text-emerald-600 uppercase tracking-tighter border border-emerald-100/30">
                                            <Zap size={7} fill="currentColor" /> SAVED ₹{Math.round(item.price * 0.1)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                                        className="text-[8px] font-black text-red-500 uppercase tracking-widest py-1 px-2 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Shop Products in Cart */}
                        {shopCart.length > 0 && (
                            <>
                                <div className="flex items-center justify-between px-1 pt-2">
                                    <h3 className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">E-Shop Products</h3>
                                </div>
                                {shopCart.map(item => (
                                    <div key={item._id} className="bg-white rounded-2xl p-3.5 shadow-sm relative border border-black/[0.03] flex items-center justify-between group transition-all hover:border-brand/30">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-black/[0.05] shadow-sm overflow-hidden flex-shrink-0">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11.5px] font-[1000] text-black leading-none uppercase tracking-tight mb-1.5">
                                                    {item.name}
                                                </h4>
                                                <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest">Qty: {item.qty || 1}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[17px] font-[1000] text-black tracking-tight leading-none mb-2">
                                                ₹{(item.salePrice || item.price) * (item.qty || 1)}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-[8px] font-black text-red-500 uppercase tracking-widest py-1 px-2 bg-red-50 rounded-lg"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Add Another Promo (High-End CTA) */}
                    <button
                        onClick={() => navigate('/e-shop?from=studio-wash')}
                        className="w-full bg-white border border-black/[0.03] rounded-2xl p-3.5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden shadow-sm hover:bg-gray-50"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand/10 transition-colors" />
                        <div className="flex items-center gap-3.5 relative z-10">
                            <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-transform duration-500">
                                <Plus size={16} strokeWidth={3} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[12px] font-black text-black uppercase tracking-widest">Add Another Asset</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[7.5px] font-bold text-emerald-600 uppercase tracking-tight leading-none">Auto-apply 20% Discount</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center shadow-sm relative z-10 group-hover:bg-brand transition-colors">
                            <ChevronRight size={12} className="text-black/30 group-hover:text-black transition-colors" strokeWidth={3} />
                        </div>
                    </button>

                    {/* Car & Bike Combo Card (Premium Transition) */}
                    <div className="bg-[#FAF1E8]/60 rounded-3xl p-3.5 pt-9 relative overflow-hidden border border-[#E9DCCF] mt-1 group hover:bg-[#FAF1E8] transition-colors duration-500 shadow-sm">
                        <div className="absolute top-0 left-0 bg-[#1A1A1A] text-white px-3 py-1.5 text-[8.5px] font-black rounded-br-2xl uppercase tracking-widest">
                            <span className="text-[#2D9944]">20% OFF</span> ON COMBO
                        </div>

                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.05]">
                                    <Bike size={18} className="text-black/80" />
                                </div>
                                <Plus size={12} className="text-black/10" strokeWidth={3} />
                                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.05]">
                                    <Car size={18} className="text-black/80" />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1 leading-none">Combo Price</p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-[20px] font-[1000] text-black leading-none tracking-tight">₹446</span>
                                    <span className="text-[10px] font-black text-black/10 line-through">₹558</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 bg-white border border-black/[0.06] text-black py-2.5 rounded-xl font-[1000] text-[10px] uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all hover:bg-black hover:text-white hover:border-black">
                                Book Combo
                            </button>
                            <button className="flex-[1.8] bg-[#1A1A1A] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl shadow-black/10 group-hover:bg-black">
                                ₹312 WITH <span className="text-brand">BLACK</span>
                                <ChevronRight size={12} strokeWidth={3} className="text-brand/50" />
                            </button>
                        </div>
                    </div>

                    {/* Monthly Packages (Dynamic Premium Grid) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Monthly Subscription</h3>
                            {isBlackMember ? (
                                <span className="text-emerald-600 text-[8px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-sm animate-pulse">Benefits Activated</span>
                            ) : (
                                <span className="text-emerald-600 text-[8px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-sm">Upto 50% Savings</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            {(subscriptionPlans.length > 0 ? subscriptionPlans : [
                                { title: '2 Wash/Month', price: '458', perWash: '229', color: 'bg-white' },
                                { title: '4 Times/Month', price: '756', perWash: '189', color: 'bg-white' },
                                { title: '8 Times/Month', price: '1352', perWash: '169', color: 'bg-white' }
                            ]).map((pkg, i) => {
                                const isSelected = selectedSubscription?._id === pkg._id || selectedSubscription?.id === pkg.id;
                                return (
                                    <div key={pkg._id || pkg.id || i}
                                        onClick={() => setSelectedSubscription(isSelected ? null : pkg)}
                                        className={`rounded-2xl border transition-all duration-300 p-3.5 shadow-sm flex items-center justify-between relative overflow-hidden group cursor-pointer ${isSelected ? 'border-brand ring-1 ring-brand bg-brand/5' : 'bg-white border-black/[0.03] hover:border-brand/40'}`}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                                        <div className="absolute top-0 left-0 bg-[#F3DCCB] text-black px-3 py-1 text-[7.5px] font-[1000] rounded-br-xl uppercase tracking-widest shadow-sm">
                                            Total ₹{pkg.price}
                                        </div>

                                        <div className="pt-4 flex-1">
                                            <h4 className="text-[12px] font-black text-black tracking-tight uppercase leading-none mb-1.5 group-hover:text-brand transition-colors">{pkg.title || pkg.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[15px] font-[1000] text-emerald-600 leading-none tracking-tighter">₹{Math.round(pkg.price / (pkg.washesCount || 2))}/WASH</span>
                                                <div className="w-1 h-1 rounded-full bg-black/5" />
                                                <span className="text-[9px] font-bold text-black/10 line-through tracking-tighter">WAS ₹{Math.round(pkg.price * 1.5)}</span>
                                            </div>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-brand bg-brand text-white' : 'border-black/10 bg-gray-50'}`}>
                                            {isSelected && <Check size={14} strokeWidth={4} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery Address (Premium Integration - Aligned with Instant Wash) */}
                    <div className="bg-white rounded-3xl p-5 border border-black/[0.03] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                    <MapPin size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-black text-black uppercase tracking-widest leading-none">Service Address</h4>
                                    <p className="text-[7.5px] font-black text-black/20 uppercase tracking-[0.2em] mt-1.5 font-outfit">Precision Pin Verified</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/addresses?from=full-wash')}
                                className="bg-brand/10 text-brand px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all active:scale-95 shadow-sm border border-brand/20"
                            >
                                {primaryAddress ? 'Change' : 'Add'}
                            </button>
                        </div>
                        {(() => {
                            const activeAddr = selectedLocation || addresses.find(a => a.isPrimary) || addresses[0];
                            return activeAddr ? (
                                <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-black/[0.02] relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-black/40 shadow-sm flex-shrink-0">
                                        {activeAddr.label?.toLowerCase() === 'home' ? <Home size={22} strokeWidth={2.5} /> : <MapPin size={22} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h5 className="text-[11px] font-[1000] text-black uppercase tracking-tight truncate">{activeAddr.label || 'Home'}</h5>
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
                                    onClick={() => navigate('/addresses?from=full-wash')}
                                    className="w-full py-8 border-2 border-dashed border-black/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-black/20 hover:bg-gray-50 hover:border-brand/20 transition-all group flex flex-col items-center justify-center gap-2"
                                >
                                    <Plus size={20} className="text-black/10 group-hover:text-brand transition-colors" strokeWidth={3} />
                                    Add Service Address
                                </button>
                            );
                        })()}
                    </div>

                    <p className="text-center text-[9px] font-bold text-black/15 uppercase tracking-[0.2em] pt-4 leading-none">
                        Quality guaranteed — cancel anytime
                    </p>

                    {/* E-Shop Recommendations (Matching Parity) */}
                    <div className="pt-8 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Craft Care Essentials</h3>
                            <button onClick={() => navigate('/eshop')} className="text-[8px] font-black text-brand uppercase tracking-widest flex items-center gap-1">
                                View Store <ArrowRight size={8} />
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {suggestedProducts.length > 0 ? suggestedProducts.map(product => (
                                <motion.div
                                    key={product._id}
                                    whileTap={{ scale: 0.98 }}
                                    className="min-w-[170px] bg-white rounded-3xl p-2.5 border border-black/[0.03] shadow-sm flex flex-col gap-3 group transition-all hover:border-brand/20"
                                >
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
                                        <img
                                            src={sanitizeUrl(product.image)}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={product.name}
                                            onError={handleImageError}
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                                            Premium
                                        </div>
                                    </div>
                                    <div className="px-1.5 pb-1">
                                        <h4 className="text-[10.5px] font-black text-black line-clamp-1 uppercase tracking-tight mb-1.5 group-hover:text-brand transition-colors">{product.name}</h4>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-[1000] text-black">₹{product.salePrice}</span>
                                                <span className="text-[7.5px] font-bold text-black/20 line-through">₹{product.price}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    addToCart(product);
                                                    toast.success(`${product.name} added to cart!`);
                                                }}
                                                className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center active:scale-90 transition-all hover:bg-brand hover:shadow-lg hover:shadow-brand/20"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="w-full py-12 text-center bg-white rounded-3xl border border-black/[0.03] border-dashed">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <Loader2 size={24} className="animate-spin" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Curating relevant products...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cart Footer (Ultra Modern) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.04] px-4 py-2.5 pb-5 z-50 shadow-[0_-12px_35px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between max-w-lg mx-auto gap-3 transition-all">
                        <div className="flex-1">
                            <p className="text-[6.5px] font-black text-black/20 uppercase tracking-[0.25em] mb-0.5 leading-none">Final Estimate</p>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[22px] font-[1000] text-black tracking-tighter leading-none">₹{totalCartPrice}</span>
                                    {discount > 0 && <span className="text-[10px] font-black text-emerald-600">(-₹{discount})</span>}
                                </div>
                                {applyBlackDiscount && (
                                    <span className="text-[7px] font-black text-brand uppercase tracking-tighter">BLACK PASS 30% DISCOUNT APPLIED</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Clock size={9} className="text-brand" strokeWidth={3} />
                                    <span className="text-[7.5px] font-black text-black/40 uppercase tracking-widest leading-none">{totalDuration} Mins</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (!primaryAddress) {
                                    toast.error('Please add/select a primary address first');
                                    return;
                                }
                                setPhase(PHASES.SELECT_SLOT);
                            }}
                            className={`flex-1 max-w-[145px] flex items-center justify-center gap-2 h-12 rounded-xl font-[1000] text-[12px] uppercase tracking-widest active:scale-[0.97] transition-all shadow-lg group relative overflow-hidden ${!primaryAddress ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white shadow-black/5'}`}
                        >
                            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">{!primaryAddress ? 'Select Address' : 'Next Step'}</span>
                            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSelectSlot = () => {
        const hours = Math.floor(totalDuration / 60);
        const mins = totalDuration % 60;

        // Dynamic dates used instead of hardcoded FEB/MAR ones

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32">
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-3 bg-white border-b border-black/[0.04] sticky top-0 z-50">
                    <button onClick={() => setPhase(PHASES.CART)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl">
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-[14px] font-[1000] text-black uppercase tracking-tight">Select Slot</h2>
                </div>

                {/* Location Subheader */}
                <div className="px-6 py-4 flex items-center gap-2">
                    <MapPin size={16} fill="currentColor" className="text-black" />
                    <p className="text-[11px] font-[1000] text-black uppercase tracking-tight">
                        Service at - <span className="text-black/30">{(() => {
                            const a = selectedLocation || addresses.find(x => x.isPrimary) || addresses[0];
                            return a ? (a.full || a.address || a.street || a.address?.street || a.label || 'Your Address') : 'Address not saved';
                        })()}</span>
                    </p>
                </div>

                <div className="px-4">
                    <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
                        <h3 className="text-[14px] font-black text-black mb-5">Select the Date for your Service</h3>

                        {/* Date Picker */}
                        <div className="flex justify-between mb-8 overflow-x-auto no-scrollbar gap-4">
                            {dates.map((d, i) => {
                                const isSelected = selectedDate === `${d.month} ${d.day}`;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                        <div className="relative">
                                            {d.trend && (
                                                <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md flex items-center justify-center shadow-sm ${d.trend === 'up' ? 'bg-[#FFD700]' : 'bg-[#DCFCE7]'
                                                    }`}>
                                                    <Zap size={10} className={d.trend === 'up' ? 'text-black' : 'text-emerald-600'} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setSelectedDate(`${d.month} ${d.day}`)}
                                                className={`w-[52px] py-3 rounded-xl flex flex-col items-center transition-all ${isSelected ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-black/40'
                                                    }`}
                                            >
                                                <span className="text-[9px] font-black mb-1 uppercase">{d.month}</span>
                                                <span className="text-[16px] font-black mb-1">{d.day}</span>
                                                <span className="text-[9px] font-black uppercase">{d.weekday}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-black/[0.03] pt-5">
                            <h3 className="text-[14px] font-black text-black">Select the start time for your service</h3>
                            <p className="text-[11px] font-bold text-black/20 mt-1">
                                Your service will take approximately {totalDurationMins} minutes
                            </p>

                            <div className="mt-6 space-y-8">
                                {/* Morning Slots */}
                                <div>
                                    <h4 className="text-[13px] font-black text-black flex items-center gap-2 mb-4">
                                        <div className="w-1 h-3 bg-brand rounded-full" />
                                        Morning <span className="text-black/30 font-bold ml-1">(08:00 AM - 12:00 PM)</span>
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-3 rounded-[1rem] text-[12px] font-black transition-all border ${selectedSlot === slot
                                                    ? 'bg-brand text-white border-brand shadow-lg'
                                                    : 'bg-white text-black/40 border-black/[0.06] hover:border-brand/20'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Afternoon Slots */}
                                <div>
                                    <h4 className="text-[13px] font-black text-black flex items-center gap-2 mb-4">
                                        <div className="w-1 h-3 bg-orange-400 rounded-full" />
                                        Afternoon <span className="text-black/30 font-bold ml-1">(12:00 PM - 04:00 PM)</span>
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'].map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-3 rounded-[1rem] text-[12px] font-black transition-all border ${selectedSlot === slot
                                                    ? 'bg-brand text-white border-brand shadow-lg'
                                                    : 'bg-white text-black/40 border-black/[0.06] hover:border-brand/20'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Evening Slots */}
                                <div>
                                    <h4 className="text-[13px] font-black text-black flex items-center gap-2 mb-4">
                                        <div className="w-1 h-3 bg-indigo-400 rounded-full" />
                                        Evening <span className="text-black/30 font-bold ml-1">(04:00 PM - 08:00 PM)</span>
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-3 rounded-[1rem] text-[12px] font-black transition-all border ${selectedSlot === slot
                                                    ? 'bg-brand text-white border-brand shadow-lg'
                                                    : 'bg-white text-black/40 border-black/[0.06] hover:border-brand/20'
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

                    {/* Terms Banner */}
                    <div className="mt-6 bg-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                        <Info size={14} className="text-black mt-0.5" />
                        <p className="text-[11px] font-bold text-black leading-tight">
                            By proceeding further you agree to our service Terms and Conditions
                        </p>
                    </div>
                </div>

                {/* Footer (Dual Action - Compact & Professional) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-12px_35px_rgba(0,0,0,0.03)] border-t border-black/[0.03] p-3 pb-5 z-50">
                    <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-3">
                        <div className="flex-1">
                            <div className="text-[20px] font-[1000] text-[#0066FF] tracking-tighter leading-none mb-0.5">
                                ₹{totalCartPrice + 500}
                            </div>
                            <p className="text-[9px] font-[1000] text-black/20 uppercase tracking-[0.2em] leading-none">
                                {hours} hr {mins} mins
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-[1.4]">
                            <button
                                onClick={() => setPhase(PHASES.PAYMENT)}
                                className="flex-1 bg-brand text-black h-10 rounded-lg font-[1000] text-[10px] uppercase tracking-widest shadow-md shadow-brand/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-black/5"
                            >
                                <Zap size={12} fill="currentColor" />
                                Instant
                            </button>
                            <button
                                onClick={() => setPhase(PHASES.PAYMENT)}
                                className="flex-[1.1] bg-[#1A1A1A] text-white h-10 rounded-lg font-[1000] text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPayment = () => {
        const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0) + 500;

        const paymentOptions = [
            { id: 'googlepay', name: 'Google Pay', icon: 'https://cdn-icons-png.flaticon.com/512/6124/6124998.png' },
            { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/color/480/phonepe.png' },
            { id: 'paytm', name: 'Paytm', icon: 'https://img.icons8.com/color/480/paytm.png' },
            { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard size={20} strokeWidth={2.5} /> },
            { id: 'netbanking', name: 'Net Banking', icon: <LayoutGrid size={20} strokeWidth={2.5} /> },
        ];

        return (
            <div className="min-h-screen bg-[#F8F9FB] pb-32 font-outfit">
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-3 bg-white border-b border-black/[0.04] sticky top-0 z-50">
                    <button onClick={() => setPhase(PHASES.SELECT_SLOT)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl">
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-[14px] font-[1000] text-black uppercase tracking-tight">Payment Selection</h2>
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

                    <h3 className="text-[9px] font-black text-black/20 uppercase tracking-[0.25em] px-1">Select Payment Method</h3>

                    {/* Online Payment Options - Compacted */}
                    <div className="space-y-2.5">
                        {paymentOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setPaymentMethod(opt.id)}
                                className={`w-full bg-white p-3.5 rounded-xl flex items-center justify-between transition-all border ${paymentMethod === opt.id ? 'border-brand shadow-md ring-1 ring-brand/10' : 'border-black/[0.03]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50/50 rounded-lg flex items-center justify-center overflow-hidden border border-black/[0.02]">
                                        {typeof opt.icon === 'string' ? (
                                            <img src={opt.icon} className="w-[70%] h-[70%] object-contain" />
                                        ) : (
                                            <div className="text-black/60">{opt.icon}</div>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-[1000] text-black tracking-tight leading-none">{opt.name}</span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === opt.id ? 'border-brand bg-brand animate-in zoom-in-50' : 'border-black/[0.1]'
                                    }`}>
                                    {paymentMethod === opt.id && <Check size={10} className="text-white" strokeWidth={5} />}
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

                {/* Refined Footer (Ultra Compact) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-12px_35px_rgba(0,0,0,0.03)] border-t border-black/[0.03] p-3 pb-5 z-50">
                    <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-3">
                        <div className="flex-1">
                            <div className="text-[20px] font-[1000] text-[#0066FF] tracking-tighter leading-none mb-0.5">
                                ₹{totalCartPrice}
                            </div>
                            <p className="text-[9px] font-[1000] text-black/20 uppercase tracking-[0.2em] leading-none">Incl. GST & Fees</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!paymentMethod || isProcessing) return;
                                setIsProcessing(true);

                                try {
                                    // Get Razorpay key
                                    const { data: { key_id } } = await getRazorpayKey();

                                    // Create payment order
                                    const { data: { order_id, amount, currency } } = await createPaymentOrder(
                                        totalCartPrice, 
                                        'INR',
                                        `receipt_${Date.now()}`
                                    );

                                    // Initialize Razorpay options
                                    const options = {
                                        key: key_id,
                                        amount: amount,
                                        currency: currency,
                                        name: 'Clean2Wash',
                                        description: `Studio Wash Booking - ${cart.length} Services`,
                                        image: 'https://cdn-icons-png.flaticon.com/512/3003/3003984.png',
                                        order_id: order_id,
                                        handler: async function (response) {
                                            try {
                                                // Verify payment
                                                const verificationResult = await verifyPayment(
                                                    response.razorpay_order_id,
                                                    response.razorpay_payment_id,
                                                    response.razorpay_signature
                                                );

                                                if (verificationResult.success) {
                                                    // Payment successful - create booking with full payload
                                                    const result = await addBooking({
                                                        services: cart.map(item => ({
                                                            id: item.serviceId,
                                                            name: item.serviceName,
                                                            price: item.price,
                                                            vehicleId: item.vehicleId,
                                                            addons: item.addons || []
                                                        })),
                                                        products: shopCart.map(item => ({
                                                            id: item._id,
                                                            name: item.name,
                                                            price: item.salePrice || item.price,
                                                            qty: item.qty || 1
                                                        })),
                                                        subscription: selectedSubscription ? {
                                                            id: selectedSubscription._id || selectedSubscription.id,
                                                            name: selectedSubscription.title || selectedSubscription.name,
                                                            price: selectedSubscription.price || selectedSubscription.total
                                                        } : null,
                                                        vehicle: selectedVehicle,
                                                        totalAmount: totalCartPrice,
                                                        paymentMethod: paymentMethod,
                                                        paymentId: response.razorpay_payment_id,
                                                        orderId: response.razorpay_order_id,
                                                        status: 'pending',
                                                        address: selectedLocation || addresses.find(a => a.isPrimary) || addresses[0],
                                                        scheduledTime: selectedDate && selectedSlot ? `${selectedDate} ${selectedSlot}` : null,
                                                        createdAt: new Date().toISOString()
                                                    });

                                                    if (result.success) {
                                                        setActiveBookingId(result.data.id || result.data._id);
                                                        // SUCCESS: Redirect or switch phase
                                                        toast.success('Booking Successful!');
                                                        // Redirect to tracking or success view
                                                        setPhase(PHASES.LIVE_TRACK);
                                                    } else {
                                                        toast.error('Booking creation failed. Please contact support.');
                                                    }
                                                } else {
                                                    toast.error('Payment verification failed.');
                                                }
                                            } catch (err) {
                                                console.error('Verification error:', err);
                                                toast.error('Verification failed.');
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        },
                                        prefill: {
                                            name: user?.name || 'Customer',
                                            email: user?.email || 'customer@carwash.in',
                                            contact: user?.phone || '9999999999'
                                        },
                                        theme: { color: '#F29F05' },
                                        modal: {
                                            ondismiss: function () {
                                                setIsProcessing(false);
                                            }
                                        }
                                    };

                                    const rzp = new window.Razorpay(options);
                                    rzp.open();

                                } catch (error) {
                                    console.error('Payment error:', error);
                                    toast.error('Payment system error. Please try again.');
                                    setIsProcessing(false);
                                }
                            }}
                            disabled={!paymentMethod || isProcessing}
                            className={`flex-1 max-w-[200px] h-11 rounded-xl font-[1000] text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-xl ${!paymentMethod || isProcessing
                                ? 'bg-gray-100 text-black/20 cursor-not-allowed shadow-none'
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
        <div className="p-4 space-y-4 font-outfit">
            <h2 className="text-lg font-black text-black uppercase tracking-tight border-b border-black/[0.03] pb-2.5">Asset Management</h2>
            <div className="space-y-2.5">
                {vehicles.map(v => (
                    <motion.div
                        key={v.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedVehicle(v); setPhase(PHASES.SERVICE_SELECTION); }}
                        className={`p-4 rounded-2xl border-2 transition-all ${selectedVehicle?.id === v.id ? 'bg-[#FFF6E9] border-brand shadow-lg' : 'bg-white border-black/[0.03] opacity-60 hover:opacity-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl p-2 border border-orange-50 shadow-inner">
                                <img src={v.img} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-black text-black uppercase tracking-tighter leading-none">{v.brand} {v.model}</h4>
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
                onClick={() => navigate('/add-vehicle')}
                className="w-full border-2 border-dashed border-black/[0.06] rounded-2xl p-6 text-black/30 font-black uppercase text-[10px] tracking-[0.3em] bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2"
            >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/[0.03]">
                    <X size={20} className="rotate-45 text-black/40" />
                </div>
                Register New Craft Asset
            </button>
        </div>
    );

    return (
        <MobileLayout hideNav={phase === PHASES.LIVE_TRACK || phase === PHASES.CART || phase === PHASES.SELECT_SLOT || phase === PHASES.PAYMENT}>
            <div className="bg-[#FFFFFF] min-h-screen font-outfit">
                <style dangerouslySetInnerHTML={{ __html: `.font-outfit { font-family: 'Outfit', sans-serif; }` }} />
                {phase !== PHASES.CART && phase !== PHASES.SELECT_SLOT && phase !== PHASES.LIVE_TRACK && phase !== PHASES.PAYMENT && renderHeader()}

                <AnimatePresence mode="wait">
                    {phase === PHASES.IDLE && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {renderIdle()}
                        </motion.div>
                    )}
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
                                className="relative w-full max-w-xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
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

export default FullWashBooking;
