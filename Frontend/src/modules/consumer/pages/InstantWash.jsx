import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Clock, CheckCircle2, ShieldCheck,
    ArrowRight, MapPin, ChevronDown, Car,
    Timer, Rocket, Star, Shield, Navigation,
    Phone, MessageSquare, Droplets, Camera,
    AlertTriangle, History, Search, X, ChevronLeft,
    CreditCard, LayoutGrid, Check, Info, ChevronRight,
    Plus, Minus, Gift, Bike, Crown, Play, Calendar, Home, Loader2, Radar, Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

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

const HARDCODED_SERVICES = [
    {
        id: 'basic',
        tag: 'Bucket Wash',
        title: 'Bucket Wash - Basic',
        subtitle: 'Traditional hand wash with care',
        image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
        price: '299',
        monthlyPlans: [
            { id: 'm1', name: '2 Wash/Month', washes: 2, total: 458, perWash: 229 },
            { id: 'm2', name: '4 Times/Month', washes: 4, total: 756, perWash: 189 },
            { id: 'm3', name: '8 Times/Month', washes: 8, total: 1352, perWash: 169 },
            { id: 'm4', name: '12 Times/Month', washes: 12, total: 1948, perWash: 162 },
        ],
        original: '₹598',
        duration: '~40 min',
        features: ['External Hand Wash', 'Tyre Cleaning', 'Glass Polish', 'Basic Interior Cleaning', 'Microfiber Dry', 'Dash Dusting'],
        badge: 'Budget Choice',
        rating: 4.8,
        reviews: 7540,
        addons: [
            { id: 'a1', name: 'Exterior Polish', price: 199 },
            { id: 'a2', name: 'Interior Cleaning', price: 149 },
            { id: 'a3', name: 'Tyre Dressing', price: 99 },
            { id: 'a4', name: 'Glass Coating', price: 129 },
            { id: 'a5', name: 'Microfiber Wash', price: 49 },
            { id: 'a6', name: 'Dashboard Polish', price: 179 },
        ],
    },
    {
        id: 'premium',
        tag: 'Pressure Wash',
        title: 'Pressure Wash - Premium',
        subtitle: 'High pressure wash for deep clean',
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
        price: '469',
        monthlyPlans: [
            { id: 'p1', name: 'Starter Pass', washes: 4, price: 1499, tag: 'Best for Occasional' },
            { id: 'p2', name: 'Popular Pass', washes: 12, price: 3999, tag: 'Most Selected' },
            { id: 'p3', name: 'Platinum Pass', washes: 26, price: 6999, tag: 'Daily Care' },
        ],
        original: '₹938',
        duration: '~60 min',
        features: ['High Pressure Exterior', 'Underbody Wash', 'Foam Cleaning', 'Premium Interior Vacuum', 'Clay Bar Treatment', 'Tire Shine'],
        badge: 'Best Seller',
        rating: 4.9,
        reviews: 12540,
        addons: [
            { id: 'p1', name: 'Wax Coating', price: 299 },
            { id: 'p2', name: 'Engine Cleaning', price: 399 },
            { id: 'p3', name: 'Upholstery Cleaning', price: 499 },
            { id: 'p4', name: 'Odour Removal', price: 199 },
            { id: 'p5', name: 'Rain Repellent', price: 149 },
            { id: 'p6', name: 'Headlight Polish', price: 299 },
        ],
    },
    {
        id: 'deep',
        tag: '360 Cleaning',
        title: '360 Deep Cleaning',
        subtitle: 'Complete showroom-like transformation',
        image: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
        price: '1269',
        monthlyPlans: [
            { id: 'd1', name: 'Starter Pass', washes: 4, price: 3999, tag: 'Best for Occasional' },
            { id: 'd2', name: 'Popular Pass', washes: 12, price: 9999, tag: 'Most Selected' },
            { id: 'd3', name: 'Platinum Pass', washes: 26, price: 18999, tag: 'Daily Care' },
        ],
        original: '₹2538',
        duration: '~120 min',
        features: ['Full Interior Detailing', 'Paint Protection', 'Engine Bay Wash', 'Leather Conditioning'],
        badge: 'Premium Plus',
        rating: 4.9,
        reviews: 3250,
        addons: [
            { id: 'd1', name: 'Ceramic Coating', price: 1499 },
            { id: 'd2', name: 'Leather Polish', price: 599 },
            { id: 'd3', name: 'Mat Cleaning', price: 199 },
        ],
    }
];

const VEHICLE_TYPES = [
    { id: 'hatchback', label: 'Hatch', multiplier: 1.0 },
    { id: 'sedan', label: 'Sedan', multiplier: 1.2 },
    { id: 'suv', label: 'SUV', multiplier: 1.5 },
    { id: 'luxury', label: 'Luxury', multiplier: 2.0 },
    { id: 'muv', label: 'MUV', multiplier: 1.4 },
    { id: 'bike', label: 'Bike', multiplier: 0.6 },
    { id: 'scooter', label: 'Scooter', multiplier: 0.5 },
    { id: 'superbike', label: 'Super Bike', multiplier: 0.9 },
];

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
];

const JOB_STATES = [
    { id: 'ASSIGNED', label: 'Captain Found', icon: ShieldCheck, color: 'text-blue-500' },
    { id: 'EN_ROUTE', label: 'En Route', icon: Navigation, color: 'text-blue-600' },
    { id: 'ARRIVED', label: 'Arrived', icon: MapPin, color: 'text-brand' },
    { id: 'BEFORE_PHOTO', label: 'Before Photos', icon: Camera, color: 'text-orange-500' },
    { id: 'WASHING', label: 'Washing', icon: Droplets, color: 'text-sky-500' },
    { id: 'AFTER_PHOTO', label: 'After Photos', icon: Camera, color: 'text-emerald-500' },
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

const InstantWash = () => {
    const navigate = useNavigate();
    const { vehicles, addresses, addBooking, updateBookingStatus, bookings, userSubscription, setUserSubscription } = useAuth();

    const [phase, setPhase] = useState(PHASES.SERVICE_SELECTION);
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles.find(v => v.isPrimary) || vehicles[0]);
    const [selectedVehicleType, setSelectedVehicleType] = useState('sedan');
    const [activeServiceId, setActiveServiceId] = useState('eco');
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [jobStateIndex, setJobStateIndex] = useState(0);
    const [serviceAddons, setServiceAddons] = useState({});
    const [useSubscription, setUseSubscription] = useState(false);
    const [showDemoVideo, setShowDemoVideo] = useState(false);
    const [showAddServices, setShowAddServices] = useState(false);
    const [showServiceCoverage, setShowServiceCoverage] = useState(false);
    const [cart, setCart] = useState([]);
    const [selectedDate, setSelectedDate] = useState('Feb 27');
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Check if subscription can be used
    const canUseSubscription = useMemo(() => {
        if (!userSubscription || userSubscription.status !== 'Active' || userSubscription.washesLeft <= 0) return false;
        return (userSubscription.vehicleIds || []).includes(selectedVehicle?.id);
    }, [userSubscription, selectedVehicle]);

    useEffect(() => {
        if (!canUseSubscription) setUseSubscription(false);
    }, [canUseSubscription]);

    const activeBooking = bookings.find(b => b.id === activeBookingId);
    const activeService = HARDCODED_SERVICES.find(s => s.id === activeServiceId);

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
    }, [activeServiceId]);

    // Simulated Flow Logic
    useEffect(() => {
        if (phase === PHASES.FINDING) {
            const timer = setTimeout(() => {
                const addons = activeService.addons || [];
                const selectedAddons = serviceAddons[activeServiceId] || [];
                const addonTotal = addons
                    .filter(a => selectedAddons.includes(a.id) && !a.included)
                    .reduce((sum, a) => sum + a.price, 0);
                const basePrice = getPrice(activeService.price);
                const totalPrice = basePrice + addonTotal;

                if (useSubscription) {
                    setUserSubscription({
                        ...userSubscription,
                        washesLeft: userSubscription.washesLeft - 1
                    });
                }

                const newBooking = addBooking({
                    serviceName: activeService.title,
                    vehicle: `${selectedVehicle.brand} ${selectedVehicle.model}`,
                    vehicleImg: selectedVehicle.img,
                    price: useSubscription ? '₹0 (Pass Used)' : `₹${totalPrice}`,
                    type: 'instant',
                    status: 'ASSIGNED',
                    timestamp: new Date().toISOString(),
                    location: addresses.find(a => a.isPrimary)?.address || 'Current Location',
                    addons: selectedAddons,
                    vehicleType: selectedVehicleType,
                    isPassUsed: useSubscription
                });
                setActiveBookingId(newBooking.id);
                setPhase(PHASES.LIVE_TRACK);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [phase, activeServiceId, serviceAddons, selectedVehicleType]);

    useEffect(() => {
        if (phase === PHASES.LIVE_TRACK && jobStateIndex < JOB_STATES.length - 1) {
            const delays = [2000, 5000, 4000, 6000, 8000, 5000];
            const timer = setTimeout(() => {
                setJobStateIndex(prev => prev + 1);
                updateBookingStatus(activeBookingId, JOB_STATES[jobStateIndex + 1].id);
            }, delays[jobStateIndex]);
            return () => clearTimeout(timer);
        }
    }, [phase, jobStateIndex]);

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
            type: 'standard'
        };

        setCart(prev => [...prev, newItem]);
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
        setCart(prev => [...prev, newItem]);
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
                        Car Wash & Care
                    </h1>
                </div>

                <div className="flex items-center gap-3 text-right">
                    <button className="w-8 h-8 bg-gray-50/80 rounded-lg flex items-center justify-center border border-black/[0.02] active:scale-95 transition-transform">
                        <Image size={16} className="text-black/60" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div>
                            <h4 className="text-[13px] font-[1000] text-black leading-none">{selectedVehicle?.model || 'Baleno'}</h4>
                            <p className="text-[9px] font-black text-black/20 mt-1 uppercase leading-none tracking-widest">{selectedVehicle?.brand || 'Maruti Suzuki'}</p>
                        </div>
                        <div className="w-8 h-8 bg-gray-50/80 rounded-lg flex items-center justify-center border border-black/[0.02]">
                            <Car size={16} className="text-black/80" />
                        </div>
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
                                <span className="text-brand">30 MINS</span>
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
                            onClick={handleStartSearch}
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
                            { title: 'Response', desc: '< MINS', icon: Timer, color: 'text-brand' },
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
                {/* Promo Bar */}
                <div className="bg-[#F3DCCB] border-b border-[#DBC4B5]/40 py-2 px-6 flex items-center justify-center gap-2">
                    <p className="text-black/80 text-[11px] font-bold text-center">
                        Save upto <span className="text-brand font-black">40%</span> on every service with <span className="text-black font-[1000]">clean2wash BLACK</span>
                    </p>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                </div>

                {/* Selected Vehicle Context */}
                <div className="px-5 pt-4 pb-2">
                    <div className="bg-white rounded-[1.25rem] p-3 flex items-center justify-between border border-black/[0.04] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-black/[0.02]">
                                <Car size={18} className="text-black/80" />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-[1000] text-black tracking-tight leading-none mb-1 uppercase">{selectedVehicle?.model || 'Your Vehicle'}</h4>
                                <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">{selectedVehicle?.brand || 'Model'} • {selectedVehicle?.type || 'Sedan'}</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/vehicles')} className="text-[9px] font-[1000] text-brand uppercase tracking-widest bg-brand/5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
                            Change
                        </button>
                    </div>
                </div>

                {/* Wash Packages List */}
                <div className="px-4 py-2 space-y-4">
                    {HARDCODED_SERVICES.map((pkg) => {
                        const isExpanded = activeServiceId === pkg.id;
                        const pkgBasePrice = getPrice(pkg.price);

                        // Fake images for the diagonal split to match reference
                        const splitImages = [
                            pkg.image,
                            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
                            'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80'
                        ];

                        return (
                            <motion.div
                                key={pkg.id}
                                layout
                                className={`bg-white rounded-[2rem] border overflow-hidden transition-all duration-300 ${isExpanded ? 'border-brand/40 shadow-xl' : 'border-black/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.03)]'}`}
                            >
                                {/* Card Title Bar */}
                                <div
                                    onClick={() => setActiveServiceId(isExpanded ? null : pkg.id)}
                                    className={`px-6 py-2 flex items-center justify-between cursor-pointer ${isExpanded ? 'bg-[#222222] text-white' : 'bg-[#F3DCCB] text-black border-b border-[#DBC4B5]/40'}`}
                                >
                                    <h3 className="text-[13px] font-[1000] tracking-tight">{pkg.title}</h3>
                                    <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand' : 'opacity-40'}`} />
                                </div>

                                {/* Diagonal Image Split Section */}
                                <div className="relative h-[80px] flex overflow-hidden">
                                    <div className="flex-1 relative">
                                        <img src={splitImages[0]} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                                    </div>
                                    <div className="absolute left-[35%] top-0 bottom-0 w-[40%] skew-x-[-15deg] border-x-4 border-white overflow-hidden shadow-2xl z-10">
                                        <img src={splitImages[1]} className="w-full h-full object-cover skew-x-[15deg] scale-125" />
                                    </div>
                                    <div className="flex-1 relative">
                                        <img src={splitImages[2]} className="w-full h-full object-cover" />
                                    </div>
                                </div>



                                {/* Rating & Price Stats */}
                                <div className="px-6 py-2 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Star size={16} fill="#F29F05" className="text-brand" />
                                            <span className="text-[14px] font-[1000] text-black leading-none">{pkg.rating}</span>
                                            <div className="w-1 h-1 bg-black/10 rounded-full mx-1" />
                                            <span className="text-[12px] font-bold text-black/30">2,530 Ratings</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setActiveServiceId(pkg.id);
                                            setShowServiceCoverage(true);
                                        }}
                                        className="bg-[#F3DCCB] backdrop-blur-sm border border-[#DBC4B5]/40 px-6 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 shadow-sm active:scale-95 transition-transform"
                                    >
                                        <span className="text-[10px] font-bold text-black/60 uppercase leading-none">Starting</span>
                                        <span className="text-[18px] font-black text-black leading-none">₹{pkgBasePrice}</span>
                                    </button>
                                </div>

                                {/* Card Footer Promotion */}
                                <div className="bg-brand/10 px-6 py-3 border-t border-black/[0.03] flex items-center justify-center">
                                    <p className="text-[11px] font-bold text-black/60">
                                        Save upto <span className="font-black text-black">40%</span> on service with <span className="font-[1000] text-black">clean2wash BLACK</span>
                                    </p>
                                </div>

                                {/* Expandable Details (Keep original logic but style cleanly) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-black/[0.06] bg-white"
                                        >
                                            <div className="p-4 pt-1.5 space-y-2">
                                                <div className="flex items-start gap-4">
                                                    {/* Left Column: Labels + Addons List */}
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex flex-col gap-0.5 mb-1">
                                                            <h4 className="text-[11px] font-black text-black uppercase tracking-tight leading-none">Personalize Wash</h4>
                                                            <button
                                                                onClick={() => setShowServiceCoverage(true)}
                                                                className="text-brand text-[9px] font-black uppercase tracking-[0.2em] text-left hover:opacity-80 transition-opacity"
                                                            >
                                                                 View Details
                                                            </button>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {pkg.addons?.map(addon => {
                                                                const checked = (serviceAddons[pkg.id] || []).includes(addon.id);
                                                                return (
                                                                    <div key={addon.id} className="flex items-center gap-2 group py-0.5">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); toggleAddon(addon.id); }}
                                                                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${checked ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-300'}`}
                                                                        >
                                                                            {checked ? <Check size={10} strokeWidth={4} /> : <Plus size={10} strokeWidth={4} />}
                                                                        </button>

                                                                        <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                                                                            <span className="text-[12px] font-[1000] text-black flex-shrink-0">₹{addon.price}</span>
                                                                            <span className="text-[12px] font-bold text-black/80 truncate">{addon.name}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Pro Tip */}
                                                        <div className="bg-brand/5 rounded-lg p-2 mt-1 border border-brand/10">
                                                            <div className="flex items-start gap-2">
                                                                <Info size={10} className="text-brand mt-0.5" />
                                                                <p className="text-[9px] font-bold text-black/60 leading-tight">
                                                                    <span className="text-black">Pro Tip:</span> Add Interior Cleaning to remove deep-seated dust and allergens.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Vertical Integrated Promo (Fixed & Clean) */}
                                                    <div className="w-[115px] min-h-[240px] flex-shrink-0 bg-[#FAF1E8] rounded-[1.5rem] border border-[#E9DCCF]/50 p-3.5 flex flex-col items-center justify-between shadow-[0_6px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                                                        <div className="w-full h-28 rounded-2xl overflow-hidden shadow-sm border border-white flex-shrink-0">
                                                            <img
                                                                src="/car_wash_value_promo.png"
                                                                className="w-full h-full object-cover"
                                                                alt="Value"
                                                            />
                                                        </div>
                                                        <div className="text-center flex-1 flex flex-col justify-center gap-3 mt-5">
                                                            <h5 className="text-[#2D9944] font-[1000] text-[10px] leading-tight uppercase tracking-tight">
                                                                Service at <br />
                                                                <span className="text-[22px] leading-none">₹20</span> <br />
                                                                <span className="text-[7px] block -mt-0.5 font-black opacity-30">/ wash</span>
                                                            </h5>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setShowDemoVideo(true); }}
                                                                className="flex flex-col items-center gap-2 group w-full"
                                                            >
                                                                <div className="w-7 h-7 bg-[#FF4B91] rounded-full flex items-center justify-center shadow-md shadow-pink-500/30 group-hover:scale-110 transition-transform">
                                                                    <Play size={12} fill="currentColor" className="text-white ml-0.5" />
                                                                </div>
                                                                <span className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em] border-b border-black/5 group-hover:border-black/20 transition-all whitespace-nowrap">Learn More</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setActiveServiceId(pkg.id);
                                                        setShowServiceCoverage(true);
                                                    }}
                                                    className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-transform mt-2"
                                                >
                                                    Select Vehicle & Book
                                                </button>

                                                {/* Safety & Hygiene Highlight */}
                                                <div className="flex items-center justify-center gap-5 py-2 border-t border-black/[0.03] opacity-30 group-hover:opacity-50 transition-opacity">
                                                    <div className="flex items-center gap-1">
                                                        <ShieldCheck size={10} className="text-black" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Sanitized</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 size={10} className="text-black" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Timer size={10} className="text-black" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">On-Time</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
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
                                                <span className="text-[13px] font-[1000] text-black tracking-tight uppercase">clean2wash BLACK</span>
                                                <div className="w-4 h-4 rounded-full bg-black/5 flex items-center justify-center">
                                                    <Info size={10} className="text-black/40" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-none mt-1">12 Months Priority Access</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="text-right">
                                            <p className="text-[14px] font-black text-black leading-none tracking-tight">₹499</p>
                                            <p className="text-[10px] font-bold text-black/20 line-through">₹1200</p>
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

                                        {/* Table Rows (Improved visual rhythm) */}
                                        <div className="divide-y divide-black/[0.02] bg-white">
                                            {[
                                                { in: 'Exterior Ceramic Wash', out: 'Interior Deep Clean' },
                                                { in: 'Tyre Premium Polish', out: 'Leather Conditioning' },
                                                { in: 'Glass Streakless Wipe', out: 'Engine Bay Wash' },
                                                { in: 'Microfiber Drying', out: 'Dashboard Polish' },
                                                { in: '-', out: 'Upholstery Shampoo' }
                                            ].map((row, i) => (
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
                                                        <div className="w-1 h-1 rounded-full bg-black/10 shrink-0" />
                                                        <span className="text-[10px] font-bold text-black/30 leading-none tracking-tight uppercase">{row.out}</span>
                                                    </div>
                                                </div>
                                            ))}
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
                                                    included: ['Normal Interior Cleaning']
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
                <h2 className="text-[22px] font-[1000] text-white uppercase tracking-tighter">Initializing Link...</h2>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Establishing Captain Connection</p>
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
                            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] font-outfit shadow-black shadow-lg">Captain En Route</span>
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
                                    {!isCompleted && <span className="text-[8px] font-bold text-white/40 uppercase mt-0.5 tracking-tighter">Arriving in 13m</span>}
                                </div>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[10px] font-black text-brand uppercase">{activeBooking?.status.replace('_', ' ')}</span>
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

                        {/* Captain Status Timeline */}
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-black/[0.06]/50">
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                                    className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm grayscale"
                                    alt="Captain"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Check size={7} className="text-white" strokeWidth={4} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Rahul Sharma</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-black/[0.06]">
                                        <Star size={8} fill="#F29F05" className="text-brand mr-1" />
                                        <span className="text-[9px] font-black text-black">4.9</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-black/20 uppercase tracking-tighter">ID: CW-891</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => alert('Calling Captain...')} className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-black border border-gray-200 shadow-sm"><Phone size={14} /></motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => alert('Opening Chat...')} className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-black border border-gray-200 shadow-sm"><MessageSquare size={14} /></motion.button>
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
                                onClick={() => alert('Emergency SOS Triggered! Support is on the way.')}
                                className="flex items-center justify-center gap-3 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                            >
                                <AlertTriangle size={12} />
                                SOS Help
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => alert('Security PIN: 4821')}
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
        const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0);
        const totalDuration = cart.length * 18;

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
                                                <span className="text-[7.5px] font-bold text-black/40 uppercase tracking-tighter">18 Mins</span>
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
                                            <Zap size={7} fill="currentColor" /> SAVED ₹49
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
                    </div>

                    {/* Add Another Promo (High-End CTA) */}
                    <button
                        onClick={() => setPhase(PHASES.SERVICE_SELECTION)}
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

                    {/* Monthly Packages (Premium Grid) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Monthly Subscription</h3>
                            <span className="text-emerald-600 text-[8px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-sm">Upto 50% Savings</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            {[
                                { title: '2 Wash/Month', total: '458', perWash: '229', color: 'bg-white' },
                                { title: '4 Times/Month', total: '756', perWash: '189', color: 'bg-white' },
                                { title: '8 Times/Month', total: '1352', perWash: '169', color: 'bg-white' }
                            ].map((pkg, i) => (
                                <div key={i} className={`${pkg.color} rounded-2xl border border-black/[0.03] p-3.5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-brand/40 transition-all duration-300`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                                    <div className="absolute top-0 left-0 bg-[#F3DCCB] text-black px-3 py-1 text-[7.5px] font-[1000] rounded-br-xl uppercase tracking-widest shadow-sm">
                                        Total ₹{pkg.total}
                                    </div>

                                    <div className="pt-4 flex-1">
                                        <h4 className="text-[12px] font-black text-black tracking-tight uppercase leading-none mb-1.5 group-hover:text-brand transition-colors">{pkg.title}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-[1000] text-emerald-600 leading-none tracking-tighter">₹{pkg.perWash}/WASH</span>
                                            <div className="w-1 h-1 rounded-full bg-black/5" />
                                            <span className="text-[9px] font-bold text-black/10 line-through tracking-tighter">WAS ₹{parseInt(pkg.perWash) * 2}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectMonthly(pkg)}
                                        className="bg-[#F3DCCB] text-black px-5 py-2.5 rounded-xl text-[10px] font-[1000] uppercase tracking-widest shadow-md active:scale-95 transition-all relative z-10 hover:bg-black hover:text-white"
                                    >
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Address (Premium Integration) */}
                    <div className="bg-white rounded-2xl p-3.5 border border-black/[0.05] shadow-sm mt-1">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPin size={11} className="text-black/30" />
                                <h4 className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] leading-none">Service Address</h4>
                            </div>
                            <button className="text-brand text-[9px] font-black uppercase tracking-widest hover:bg-brand/5 px-2 py-1 rounded-lg transition-colors">Change</button>
                        </div>
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                <Home size={16} />
                            </div>
                            <div className="leading-tight">
                                <h5 className="text-[13px] font-black text-black uppercase">Home</h5>
                                <p className="text-[10px] font-bold text-black/30 truncate max-w-[180px]">Homejggkfy, Sector 45, Gurugram</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-[9px] font-bold text-black/15 uppercase tracking-[0.2em] pt-4">
                        Quality guaranteed — cancel anytime
                    </p>
                </div>

                {/* Cart Footer (Ultra Modern) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.04] px-4 py-2.5 pb-5 z-50 shadow-[0_-12px_35px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between max-w-lg mx-auto gap-3 transition-all">
                        <div className="flex-1">
                            <p className="text-[6.5px] font-black text-black/20 uppercase tracking-[0.25em] mb-0.5 leading-none">Final Estimate</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[22px] font-[1000] text-black tracking-tighter leading-none">₹{totalCartPrice}</span>
                                <span className="px-1 py-0.5 bg-black/[0.03] text-black/40 text-[7px] font-black rounded text-center uppercase tracking-tighter leading-none">In Cart</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Clock size={9} className="text-brand" strokeWidth={3} />
                                    <span className="text-[7.5px] font-black text-black/40 uppercase tracking-widest leading-none">{totalDuration} Mins</span>
                                </div>
                                <div className="w-0.5 h-0.5 rounded-full bg-black/5" />
                                <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none">Home Delivery</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setPhase(PHASES.SELECT_SLOT)}
                            className="flex-1 max-w-[145px] bg-black text-white flex items-center justify-center gap-2 h-12 rounded-xl font-[1000] text-[12px] uppercase tracking-widest active:scale-[0.97] transition-all shadow-lg shadow-black/5 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">Next Step</span>
                            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSelectSlot = () => {
        const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0);
        const totalDurationMins = cart.length * 39;
        const hours = Math.floor(totalDurationMins / 60);
        const mins = totalDurationMins % 60;

        const dates = [
            { month: 'FEB', day: '27', weekday: 'FRI', trend: 'down' },
            { month: 'FEB', day: '28', weekday: 'SAT', trend: 'up' },
            { month: 'MAR', day: '1', weekday: 'SUN', trend: 'up' },
            { month: 'MAR', day: '2', weekday: 'MON', trend: 'down' },
            { month: 'MAR', day: '3', weekday: 'TUE', trend: null },
        ];

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
                    <p className="text-[13px] font-medium text-black">
                        Service at - <span className="text-black/40">Homejggkfy</span>
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
                            onClick={() => {
                                if (!paymentMethod || isProcessing) return;
                                setIsProcessing(true);
                                // Simulate high-end payment gateway processing
                                setTimeout(() => {
                                    setIsProcessing(false);
                                    setPhase(PHASES.FINDING);
                                }, 2200);
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
                        onClick={() => { setSelectedVehicle(v); setPhase(PHASES.IDLE); }}
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

export default InstantWash;
