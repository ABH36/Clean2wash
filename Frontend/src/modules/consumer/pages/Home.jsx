import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star,
    Home as HomeIcon, Gift, User, Car, ShoppingBag, Image,
    Shield, FileText, Search, Zap, ShieldCheck, CreditCard, Sparkles,
    Instagram, Twitter, Facebook, Heart, Truck, Building, Briefcase, Wallet,
    AlertTriangle, BatteryCharging, ArrowRight, Activity, BellRing, MoreHorizontal, X, LayoutGrid, Calendar, ShieldAlert, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { serviceAPI } from '../../../utils/api';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import MobileLayout from '../components/layout/MobileLayout';
import Header from '../../../components/common/Header';

// 🏎️ Chauffeur Service Visuals
import pImg from '../../../assets/chauffeur/point.png';
import hImg from '../../../assets/chauffeur/hourly.png';
import oImg from '../../../assets/chauffeur/outstation.png';
import fImg from '../../../assets/chauffeur/full.png';

const CountdownTimer = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!targetTime || !targetTime.timeSlot?.start) return;
        const calculateTime = () => {
            const now = new Date();
            const dateStr = new Date(targetTime.date).toDateString();
            const timeStr = targetTime.timeSlot.start;
            const fullDateStr = `${dateStr} ${timeStr}`;
            const target = new Date(fullDateStr);
            const diff = target - now;
            if (diff <= 0) { setTimeLeft('Starts soon!'); return; }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            let res = '';
            if (h > 0) res += `${h}h `;
            res += `${m}m ${s}s`;
            setTimeLeft(res);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);
    return <span>{timeLeft}</span>;
};

const Home = () => {
    const navigate = useNavigate();
    const [showSOS, setShowSOS] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(5);
    const [sosActive, setSosActive] = useState(false);
    const { getUser, bookings, dispatchSOS, vehicles } = useAuth();
    const user = getUser('consumer');
    const isSpareDriverBooking = (booking = {}) => (
        booking?.service?.type === 'sparedriver'
        || booking?.type === 'sparedriver'
        || booking?.service?.category === 'Chauffeur'
        || String(booking?.serviceName || '').toLowerCase().includes('chauffeur')
        || String(booking?.serviceName || '').toLowerCase().includes('spare driver')
    );

    // ═══════════════════════════════════════════════════════════════
    // 🚨 SPARE DRIVER ONLY MODE - FEATURE FLAGS
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════

    const triggerSOS = () => {
        setShowSOS(true);
        setSosCountdown(5);
        setSosActive(false);
    };

    // Unified state for Home content
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState([]);
    const [promotionalCards, setPromotionalCards] = useState([]);
    const [banners, setBanners] = useState([]);
    const [activeBanner, setActiveBanner] = useState(0);
    const [loadingServices, setLoadingServices] = useState(true);

    // Search Results State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingResults, setIsSearchingResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showAllServices, setShowAllServices] = useState(false);
    const [activePromo, setActivePromo] = useState(0);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

    /* --- Dynamic Content Fetching --- */

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoadingServices(true);
                const response = await serviceAPI.getHomeData();

                if (response.status === 'success') {
                    const { banners, services, categories, cards, stats } = response.data;
                    const spareServices = (services || []).filter((service) => {
                        const category = String(service?.metadata?.category || service?.category || '').toLowerCase();
                        const type = String(service?.type || service?.metadata?.type || '').toLowerCase();
                        const title = String(service?.title || service?.name || '').toLowerCase();
                        return category.includes('chauffeur')
                            || type.includes('sparedriver')
                            || title.includes('chauffeur')
                            || title.includes('driver');
                    });
                    const spareBanners = (banners || []).filter((banner) => {
                        const category = String(banner?.category || '').toLowerCase();
                        const title = String(banner?.title || '').toLowerCase();
                        const path = String(banner?.path || '').toLowerCase();
                        return category.includes('driver')
                            || title.includes('driver')
                            || path.includes('spare-driver');
                    });
                    setBanners(spareBanners);
                    setServices(spareServices);
                    setCategories(categories || []);
                    setPromotionalCards(cards || []);
                    setStats(stats || []);
                }
            } catch (err) {
                console.error("Failed to fetch dynamic home data", err);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchHomeData();
    }, []);

    // Backend Search Trigger
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                try {
                    setIsSearchingResults(true);
                    const res = await serviceAPI.search(searchQuery);
                    if (res.status === 'success') {
                        // Map backend results to UI icons
                        const results = res.data.results.map(item => ({
                            ...item,
                            icon: item.type === 'CATEGORY' ? LayoutGrid : Car
                        })).filter((item) => {
                            const title = String(item?.title || '').toLowerCase();
                            const desc = String(item?.desc || '').toLowerCase();
                            const path = String(item?.path || '').toLowerCase();
                            return title.includes('driver')
                                || title.includes('chauffeur')
                                || desc.includes('driver')
                                || path.includes('spare-driver')
                                || path === '/vehicles'
                                || path === '/wallet'
                                || path === '/help'
                                || path === '/notifications'
                                || path === '/safety/sos';
                        });
                        setSearchResults(results);
                    }
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearchingResults(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);


    // Redesigned Premium Header
    const renderHeader = () => (
        <Header />
    );

    const userBookings = bookings?.filter((b) =>
        (b.consumer === user?.id || b.consumer?.id === user?.id || b.userId === user?.id)
        && isSpareDriverBooking(b)
    ) || [];

    // Reserved for future spare-driver live card integration.
    const activeBooking = useMemo(() => {
        return userBookings.find((b) => ['pending', 'confirmed', 'assigned', 'en_route', 'arrived', 'active'].includes(b.status));
    }, [userBookings]);

    const DEFAULT_BANNERS = [
        {
            id: 'def-1',
            category: 'driver',
            title: "Professional Drivers On Demand",
            subtitle: "Book trained drivers for your own car anytime",
            image: '/assets/sparedriver/sparedriver.png',
            theme: 'dark',
            cta: 'Book Driver Now',
            path: '/spare-driver'
        },
        {
            id: 'def-2',
            category: 'driver',
            title: 'Late Night Safe Returns',
            subtitle: "Don't Drink & Drive. Let our pro chauffeurs take you home safely.",
            image: '/assets/carwash/6.png',
            theme: 'dark',
            path: '/spare-driver'
        },
        {
            id: 'def-3',
            category: 'driver',
            title: 'Outstation Road Trips',
            subtitle: 'Expert highway drivers for your long weekend getaways.',
            image: '/assets/carwash/7.png',
            theme: 'light',
            path: '/spare-driver'
        },
        {
            id: 'def-4',
            category: 'driver',
            title: 'Monthly Personal Driver',
            subtitle: 'Get a dedicated chauffeur starting from ₹15,000/month.',
            image: '/assets/carwash/8.png',
            theme: 'dark',
            path: '/spare-driver'
        },
        {
            id: 'def-5',
            category: 'driver',
            title: 'Premium Business Travel',
            subtitle: 'Arrive in style. Uniformed chauffeurs for your corporate needs.',
            image: '/assets/carwash/9.png',
            theme: 'light',
            path: '/spare-driver'
        }
    ];

    const displayBanners = (banners && banners.length > 0) ? banners : DEFAULT_BANNERS;

    // Auto-scroll banners with progress
    const [progress, setProgress] = useState(0);
    const BANNER_DURATION = 5000;

    useEffect(() => {
        if (displayBanners.length <= 1) return;

        const interval = 100; // Update progress every 100ms
        const step = (interval / BANNER_DURATION) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    setActiveBanner(curr => (curr + 1) % displayBanners.length);
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [displayBanners.length, activeBanner]);

    const handleBannerClick = (banner) => {
        navigate(banner.path || '/spare-driver');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };



    const renderHero = () => (
        <section className="relative h-[280px] w-full overflow-hidden bg-[#0A0C10] group">
            {loadingServices ? (
                <div className="absolute inset-0 bg-gray-900 flex items-center px-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent shimmer-effect" />
                    <div className="space-y-4 w-full relative z-10">
                        <div className="h-4 w-24 bg-white/10 rounded-full" />
                        <div className="h-12 w-2/3 bg-white/20 rounded-xl" />
                        <div className="h-3 w-1/3 bg-white/10 rounded-full" />
                    </div>
                </div>
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        {displayBanners.map((banner, idx) => idx === activeBanner && (
                            <motion.div
                                key={banner.id || idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                onClick={() => handleBannerClick(banner)}
                                className="absolute inset-0 cursor-pointer"
                            >
                                {/* Banner Image with Pro Ken Burns Effect */}
                                <motion.div
                                    initial={{ scale: 1.15, x: 0 }}
                                    animate={{ scale: 1, x: 5 }}
                                    transition={{ duration: BANNER_DURATION / 1000, ease: "linear" }}
                                    className="absolute inset-0"
                                >
                                    <img
                                        src={banner.image || "/assets/carwash/6.png"}
                                        alt={banner.title}
                                        className="w-full h-full object-cover select-none"
                                        style={{ opacity: banner.theme === 'dark' ? 0.5 : 0.85 }}
                                        onError={(e) => { e.target.src = "/assets/carwash/6.png"; }}
                                    />
                                </motion.div>

                                {/* Immersive Overlays */}
                                <div className={`absolute inset-0 ${banner.theme === 'dark'
                                    ? 'bg-gradient-to-tr from-black/95 via-black/40 to-transparent'
                                    : 'bg-gradient-to-tr from-white/95 via-white/60 to-transparent'
                                    }`} />
                                
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FBF8EF] to-transparent z-[5]" />

                                {/* Banner Content - Perfectly Aligned and Lifted */}
                                <div className="absolute inset-0 flex flex-col justify-center px-7 z-10 select-none pb-20">
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.5 }}
                                        className="mb-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-[2px] w-5 bg-[#FF9900] rounded-full" />
                                            <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${banner.theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                                                {getGreeting()}, {user?.name?.split(' ')[0] || 'Sir'}
                                            </span>
                                        </div>
                                    </motion.div>
                                    
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2, duration: 0.5 }}
                                    >
                                        <h2 className={`text-[26px] font-[1000] leading-[1.1] tracking-[-0.02em] uppercase mb-3 max-w-[280px] ${banner.category === 'driver' ? 'text-[#FF9900]' : (banner.theme === 'dark' ? 'text-white' : 'text-black')}`}>
                                            {banner.title}
                                        </h2>
                                        <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mb-10 leading-relaxed max-w-[240px] ${banner.theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
                                            {banner.subtitle}
                                        </p>

                                        <motion.div
                                            whileTap={{ scale: 0.94 }}
                                            className={`inline-flex items-center gap-3 px-7 py-3 rounded-[16px] shadow-2xl text-[10px] font-[1000] uppercase tracking-[0.2em] transition-all ${
                                                banner.category === 'driver' 
                                                    ? 'bg-[#FF9900] text-black shadow-[#FF9900]/30' 
                                                    : (banner.theme === 'dark' ? 'bg-white text-black shadow-white/10' : 'bg-black text-white shadow-black/20')
                                            }`}
                                        >
                                            <span>{banner.cta || 'Explore'}</span>
                                            <ArrowRight size={14} strokeWidth={4} />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Pro Pagination Indicators - Lowered to stay clear of content */}
                    <div className="absolute bottom-8 left-7 flex gap-1.5 z-20">
                        {displayBanners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setActiveBanner(i); setProgress(0); }}
                                className={`h-1 rounded-full transition-all duration-700 ${
                                    i === activeBanner 
                                        ? 'w-8 bg-[#FF9900]' 
                                        : 'w-1 bg-[#FF9900]/20 hover:bg-[#FF9900]/40'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );

    useEffect(() => {
        let timer;
        if (showSOS && sosCountdown > 0 && !sosActive) {
            timer = setTimeout(() => setSosCountdown(c => c - 1), 1000);
        } else if (showSOS && sosCountdown === 0 && !sosActive) {
            setSosActive(true);

            // Dispatch Real SOS
            const initiateSOS = async () => {
                let coords = [77.1025, 28.7041]; // Default

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        coords = [position.coords.longitude, position.coords.latitude];
                        const res = await dispatchSOS({
                            coordinates: coords,
                            address: "Emergency Location",
                            description: "Urgent SOS triggered from Home Dashboard"
                        });

                        if (res.success) {
                            setShowSOS(false);
                            navigate('/sos-active');
                        } else {
                            toast.error("Failed to dispatch SOS signal. Please call 100.");
                        }
                    }, async (err) => {
                        // If blocked, try dispatching with default or last known
                        const res = await dispatchSOS({
                            coordinates: coords,
                            address: "Unknown Location (GPS Blocked)",
                            description: "Urgent SOS triggered from Home Dashboard"
                        });
                        if (res.success) {
                            setShowSOS(false);
                            navigate('/sos-active');
                        }
                    });
                }
            };
            initiateSOS();
        }
        return () => clearTimeout(timer);
    }, [showSOS, sosCountdown, sosActive]);

    const renderSearchOverlay = () => (
        <AnimatePresence>
            {isSearching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] bg-white flex flex-col pt-8"
                >
                    {/* Search Header */}
                    <div className="px-5 mb-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-[#FF9900]" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search chauffeur services, bookings, support..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-10 text-[14px] font-bold text-black outline-none focus:border-[#FF9900]/30 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 px-4 flex items-center"
                                >
                                    <X size={16} className="text-black/30" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsSearching(false);
                                setSearchQuery('');
                            }}
                            className="text-[10px] font-black text-black/40 uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Quick Tags when no query */}
                    {!searchQuery && (
                        <div className="px-5 mb-8">
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] mb-4">Popular Searches</p>
                            <div className="flex flex-wrap gap-2">
                                {['Point to Point', 'Hourly Driver', 'Full Day', 'Outstation', 'SOS'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSearchQuery(tag)}
                                        className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-tight text-black/60"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto px-5 pb-10">
                        {isSearchingResults ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-10 h-10 border-4 border-[#FF9900]/20 border-t-brand rounded-full mb-4"
                                />
                                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Searching Ecosystem...</p>
                            </div>
                        ) : searchQuery && searchResults.length > 0 ? (
                            <div className="space-y-3">
                                {searchResults.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => {
                                            setIsSearching(false);
                                            setSearchQuery('');
                                            navigate(item.path);
                                        }}
                                        className="group p-4 bg-white hover:bg-[#FF9900]/5 border border-gray-100 rounded-2xl flex items-center gap-4 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                                    >
                                        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden flex-shrink-0 relative">
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover p-1" alt="" />
                                            ) : (
                                                <Search size={24} className="text-black/10" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <h4 className="text-[14px] font-[1000] text-black uppercase tracking-tight truncate">{item.title}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${item.type === 'SERVICE' ? 'bg-[#FF9900]/10 text-[#FF9900]' :
                                                        item.type === 'PRODUCT' ? 'bg-blue-500/10 text-blue-600' :
                                                            'bg-gray-100 text-black/40'
                                                        }`}>
                                                        {item.cat || item.type}
                                                    </span>
                                                    {item.price && (
                                                        <span className="text-[12px] font-black text-black">₹{item.price}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-black/40 uppercase truncate leading-none">{item.desc}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-black/20 group-hover:bg-[#FF9900] group-hover:text-white transition-colors">
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : searchQuery ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-80 flex flex-col items-center justify-center text-center px-10"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                                    <Search size={32} className="text-black/5" />
                                </div>
                                <h3 className="text-lg font-[1000] text-black uppercase tracking-tight mb-2">No results found</h3>
                                <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.2em] leading-relaxed">
                                    We couldn't find anything matching <span className="text-[#FF9900]">"{searchQuery}"</span> in our ecosystem.
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-8 text-[10px] font-black text-[#FF9900] uppercase tracking-widest border-b-2 border-[#FF9900] pb-1"
                                >
                                    Clear and try again
                                </button>
                            </motion.div>
                        ) : null}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Memoized Sections
    const sliderCards = useMemo(() => {
        const dbCards = [...promotionalCards];
        const cards = [];
        
        cards.push({
            id: 'static-refer-earn',
            title: 'Refer & Earn Rewards',
            subtitle: 'Share and get ₹50 credits',
            badge: 'REFERRAL',
            theme: 'light',
            cta: 'Invite Friends',
            image: '/assets/carwash/2.png',
            path: '/refer'
        });

        return [...cards, ...dbCards];
    }, [promotionalCards]);

    // Loop logic for the promotional cards carousel
    useEffect(() => {
        if (!sliderCards || sliderCards.length <= 1) return;
        const timer = setInterval(() => {
            setActivePromo(prev => (prev + 1) % sliderCards.length);
        }, 6000); 
        return () => clearInterval(timer);
    }, [sliderCards?.length]);

    const renderVehicleModal = () => (
        <AnimatePresence>
            {showVehicleModal && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowVehicleModal(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2100]"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[2101] px-6 pt-2 pb-8 shadow-2xl safe-area-bottom"
                    >
                        <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mt-2 mb-6" onClick={() => setShowVehicleModal(false)} />

                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-0.5">
                                <h2 className="text-[18px] font-black text-black">Select Vehicle</h2>
                                <p className="text-[10px] font-medium text-black/40 leading-none">Which car are we driving today?</p>
                            </div>
                            <button
                                onClick={() => setShowVehicleModal(false)}
                                className="w-8 h-8 flex items-center justify-center text-black/40 hover:text-black active:scale-90 transition-transform"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-50/80 border border-black/[0.03] rounded-2xl overflow-hidden mb-6">
                            {vehicles?.map((vehicle, idx) => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => {
                                        setShowVehicleModal(false);
                                        navigate(`/spare-driver?type=${selectedServiceForBooking?.id}&vehicleId=${vehicle.id}`);
                                    }}
                                    className={`w-full px-4 py-3.5 flex items-center justify-between group active:bg-black/[0.03] transition-colors ${idx !== 0 ? 'border-t border-black/[0.03]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-black/05 shadow-sm">
                                            <Car size={20} className="text-black/60" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-[13px] font-black text-black leading-none uppercase">{vehicle.brand} {vehicle.model}</h4>
                                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-tighter mt-1">{vehicle.regNo}</p>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-black/10 flex items-center justify-center group-hover:border-[#FF9900]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-[#FF9900] transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/vehicles?mode=add')}
                            className="w-full h-12 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-[1000] text-[11px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
                        >
                            <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                                <X size={12} className="rotate-45" />
                            </span>
                            Add New Vehicle
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const viewMoreServices = [
        { title: 'Spare Drivers', icon: User, color: '#FF8533', path: '/spare-driver' },
        { title: 'Alerts', icon: Bell, color: '#A855F7', path: '/notifications' },
        { title: 'SOS', icon: AlertTriangle, color: '#EF4444', path: '/safety/sos' },
        { title: 'Support', icon: Heart, color: '#EC4899', path: '/help' },
        { title: 'Vehicle', icon: Truck, color: '#3B82F6', path: '/vehicles' },
        { title: 'Wallet', icon: Wallet, color: '#FF9900', path: '/wallet' }
    ];

    const renderSOSOverlay = () => (
        <AnimatePresence>
            {showSOS && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center px-8 text-center"
                >
                    {!sosActive ? (
                        <>
                            <div className="relative mb-12">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-32 h-32 bg-red-500/20 rounded-full absolute -inset-4 blur-2xl"
                                />
                                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-red-600/50">
                                    {sosCountdown}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Emergency SOS Triggering</h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-[240px]">Alerting nearest captains, vendors and trusted contacts in {sosCountdown}s</p>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowSOS(false)}
                                className="mt-12 px-8 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-black text-sm uppercase tracking-widest"
                            >
                                Cancel Alert
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/30"
                            >
                                <ShieldCheck size={40} strokeWidth={3} />
                            </motion.div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">SOS Signal Active</h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full space-y-4 text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Live GPS Packet Sent (HSR L8)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Contacting Policy Admin...</span>
                                </div>
                                <div className="flex items-center gap-4 text-[#FF9900]">
                                    <ShieldAlert size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Nearest Captain Headed to you</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSOS(false)}
                                className="mt-12 w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest"
                            >
                                I am Safe Now
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderAllServicesSheet = () => (
        <AnimatePresence>
            {showAllServices && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAllServices(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[1101] px-6 pt-2 pb-12 shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-2 mb-8" onClick={() => setShowAllServices(false)} />

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-[1000] text-black uppercase tracking-tight">All Services</h2>
                            <button
                                onClick={() => setShowAllServices(false)}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-y-8 gap-x-4">
                            {viewMoreServices.map((item, idx) => (
                                <motion.button
                                    key={idx}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setShowAllServices(false);
                                        item.action ? item.action() : navigate(item.path);
                                    }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02]" />
                                        <item.icon size={26} style={{ color: item.color }} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-black text-black/60 uppercase tracking-tight leading-tight text-center px-1">{item.title}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const renderQuickActions = () => (
        <section className="px-5 mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Quick Dashboard</h3>
                <div className="h-[1px] flex-1 bg-black/[0.05] ml-4" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/refer')}
                    className="bg-white border border-black/[0.05] p-4 rounded-[20px] flex flex-col gap-3 active:bg-gray-50 transition-all text-left shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#FF9900]/5 rounded-bl-[30px] -mr-3 -mt-3 group-hover:scale-150 transition-all" />
                    <div className="w-8 h-8 rounded-xl bg-[#FF9900]/10 flex items-center justify-center text-[#FF9900] relative z-10">
                        <Gift size={16} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Refer Assets</p>
                        <p className="text-[7.5px] font-bold text-black/40 uppercase tracking-widest">₹50 Trip Bonus</p>
                    </div>
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/wallet')}
                    className="bg-white border border-black/[0.05] p-4 rounded-[20px] flex flex-col gap-3 active:bg-gray-50 transition-all text-left shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-bl-[30px] -mr-3 -mt-3 group-hover:scale-150 transition-all" />
                    <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black/70 relative z-10">
                        <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">E-Wallet</p>
                        <p className="text-[7.5px] font-bold text-black/40 uppercase tracking-widest">Credits & Payouts</p>
                    </div>
                </motion.button>
            </div>
        </section>
    );

    const renderDashboard = () => {
        return (
            <div className="pb-2 space-y-2 bg-[#FBF8EF]/40 transition-colors">
                {/* Professional Service Cards - Compact Luxury Design */}
                <section className="px-5 -mt-6 relative z-30 mb-8">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'point', title: 'Point to Point', desc: 'One way move', image: pImg, color: '#FF9900' },
                            { id: 'hourly', title: 'Hourly', desc: 'Rent by hour', image: hImg, color: '#FF9900' },
                            { id: 'full', title: 'Full Day', desc: '8hr city shift', image: fImg, color: '#FF9900' },
                            { id: 'outstation', title: 'Outstation', desc: 'Inter-city travel', image: oImg, color: '#FF9900' }
                        ].map((item, idx) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (vehicles?.length === 0) {
                                        navigate('/vehicles?mode=add');
                                    } else {
                                        setSelectedServiceForBooking(item);
                                        setShowVehicleModal(true);
                                    }
                                }}
                                className="bg-white rounded-[24px] p-3 text-left flex flex-col h-[200px] shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-black/[0.04] group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-14 h-14 bg-[#FF9900]/5 rounded-bl-[35px] -mr-4 -mt-4 transition-all group-hover:scale-150" />
                                
                                {/* Text Section */}
                                <div className="relative z-10">
                                    <h4 className="text-[12px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">{item.title}</h4>
                                    <p className="text-[7px] font-bold text-black/30 uppercase tracking-[0.2em] mb-1.5">{item.desc}</p>
                                    <div className="flex">
                                        <span className="bg-[#FF9900]/10 text-[#FF9900] px-2 py-0.5 rounded-full text-[8.5px] font-[1000] tracking-tighter">
                                            {services.find(s => s.id === item.id || s.title?.toLowerCase().includes(item.id))?.price || (item.id === 'point' ? '₹499' : item.id === 'hourly' ? '₹799' : item.id === 'full' ? '₹999' : '₹2499')}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Icon Section */}
                                <div className="flex-1 w-full flex items-center justify-center relative z-0">
                                    <motion.div 
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: idx * 0.3 }}
                                        className="w-full flex items-center justify-center p-2"
                                    >
                                        <img 
                                            src={item.image} 
                                            className="h-20 w-auto object-contain transform group-hover:scale-110 transition-all duration-700 drop-shadow-[0_15px_30px_rgba(0,0,0,0.1)] scale-[1.35]" 
                                            alt={item.title} 
                                        />
                                    </motion.div>
                                </div>
                                
                                {/* Action Button */}
                                <div className="relative z-10 w-full">
                                    <div className="w-full h-8 bg-black text-white rounded-[14px] flex items-center justify-center gap-2 text-[8px] font-[1000] uppercase tracking-[0.2em] group-hover:bg-[#FF9900] transition-colors duration-300">
                                        <span>Select Service</span>
                                        <ArrowRight size={10} strokeWidth={4} />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Quick Actions Injection */}
                {renderQuickActions()}

                {/* Studio Detailing - Premium Section */}
                {false && (
                    <section className="px-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-black text-black opacity-40 uppercase tracking-widest">Studio Detailing</h3>
                            <button onClick={() => navigate('/spare-driver')} className="text-[10px] font-black text-[#FF9900] uppercase tracking-widest">Show All</button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[].map((service) => (
                                <motion.div
                                    key={service.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(service.metadata?.path || `/service/${service.id}`)}
                                    className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-black/[0.05] shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-24 h-24 bg-[#FF9900]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-black/[0.03] overflow-hidden flex-shrink-0 z-10">
                                        <img src={service.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-[14px] font-[1000] text-black uppercase tracking-tight">{service.title}</h4>
                                            {service.badge && (
                                                <span className="bg-[#FF9900]/10 text-[#FF9900] text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">{service.badge}</span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest leading-none">
                                            Premium care • {service.price}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-black/20 group-hover:bg-[#FF9900] group-hover:text-white transition-all z-10">
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}


                {/* Dynamic Promotional Cards (Full-Width Continuous Loop) */}
                <section className="relative overflow-hidden h-[110px] mb-4">
                    <motion.div 
                        className="flex h-full w-full"
                        animate={{ x: `-${activePromo * 100}%` }}
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }} 
                    >
                        {sliderCards.map((card, idx) => (
                            <motion.div
                                key={card.id || idx}
                                whileTap={{ scale: 1 }} // No scaling for full-width banners
                                onClick={() => card.action ? card.action() : navigate(card.path)}
                                className={`flex-shrink-0 w-full h-full`}
                            >
                                <div className={`${card.theme === 'dark' ? 'bg-black' : 'bg-[#FBF8EF]'} relative overflow-hidden group w-full h-full flex items-center px-10 border-b border-black/[0.03] cursor-pointer`}>
                                     <div className={`absolute right-[-2%] top-[-20%] w-56 h-56 ${card.theme === 'dark' ? 'bg-[#FF9900]/10' : 'bg-[#FF9900]/5'} rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700`} />
                                     <div className="relative z-10 flex-1">
                                         <div className="flex items-center gap-2 mb-1.5">
                                             <div className="w-1 h-1 bg-[#FF9900] rounded-full animate-pulse" />
                                             <span className="text-[10px] font-black text-[#FF9900] uppercase tracking-[0.3em] block">{card.badge}</span>
                                         </div>
                                         <h3 className={`text-[20px] font-[1000] uppercase leading-none tracking-tighter ${card.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                             {card.title}
                                         </h3>
                                         <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 line-clamp-1 ${card.theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                                             {card.subtitle}
                                         </p>
                                         <div className="mt-3 flex items-center gap-2">
                                             <span className={`text-[9px] font-black uppercase tracking-tight ${card.theme === 'dark' ? 'text-[#FF9900]' : 'text-black'}`}>{card.cta}</span>
                                             <ArrowRight size={12} className={card.theme === 'dark' ? 'text-[#FF9900]' : 'text-black'} />
                                         </div>
                                     </div>
                                    <div className="absolute right-[8%] bottom-[-5%] w-32 h-32 opacity-30 rotate-[10deg] group-hover:rotate-0 transition-transform duration-700">
                                        <img src={card.image} className="w-full h-full object-contain" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Centered Pagination Dots Indicator */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {sliderCards.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-300 ${i === activePromo ? 'w-4 bg-[#FF9900]' : 'w-1 bg-white/20'}`} 
                            />
                        ))}
                    </div>
                </section>
            </div>
        );
    };

    const renderKycNudge = () => {
        if (!user || user.isVerified) return null;
        return (
            <section className="px-5 mb-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => navigate('/compliance')}
                    className="bg-[#111827] rounded-[24px] p-5 flex items-center justify-between shadow-xl shadow-[#111827]/30 border border-white/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9900]/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FF9900] border border-white/5">
                            <ShieldCheck size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-[1000] text-white uppercase italic tracking-tight">Identity Trust Protocol</h4>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Complete KYC to unlock priority rewards</p>
                        </div>
                    </div>
                    <button className="bg-[#FF9900] p-2 rounded-xl text-white active:scale-90 transition-transform relative z-10">
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </motion.div>
            </section>
        );
    };

    const renderFooter = () => (
        <section className="pb-12 pt-8">
            <div className="px-5">
                <div className="bg-white/80 p-6 rounded-2xl border border-black/10 text-center shadow-sm">
                    <h2 className="text-[18px] font-[1000] text-[#0F172A] tracking-tighter uppercase leading-[0.9] mb-8">
                        India's #1<br />Elite Chauffeur Network
                    </h2>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="flex flex-col items-center gap-2">
                            <ShieldCheck size={18} className="text-[#FF9900]" />
                            <p className="text-[8px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Verified</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 border-x border-black/05">
                            <User size={18} className="text-[#FF9900]" />
                            <p className="text-[8px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Professional</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Zap size={18} className="text-[#FF9900]" />
                            <p className="text-[8px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Rapid</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-white min-h-screen font-sans">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .shadow-card { box-shadow: 0 15px 40px -15px rgba(0,0,0,0.06); }
                    .text-stroke-black { -webkit-text-stroke: 1.5px black; }
                `}} />
                <div>
                    {renderAllServicesSheet()}
                    {renderSearchOverlay()}
                    {renderSOSOverlay()}
                    {renderVehicleModal()}
                    {renderHeader()}
                    {renderHero()}

                    <div className="space-y-0">
                        {renderKycNudge()}
                        {renderDashboard()}
                        {renderFooter()}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Home;
