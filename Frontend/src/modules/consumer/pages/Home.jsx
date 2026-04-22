import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star,
    Home as HomeIcon, Gift, User, Car, ShoppingBag, Image,
    Shield, FileText, Search, Zap, ShieldCheck, CreditCard, Sparkles,
    Instagram, Twitter, Facebook, Heart, Truck, Building, Briefcase, Wallet,
    AlertTriangle, BatteryCharging, ArrowRight, Activity, BellRing, MoreHorizontal, X, LayoutGrid, Calendar, ShieldAlert, Clock, Plus, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { serviceAPI } from '../../../utils/api';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import MobileLayout from '../components/layout/MobileLayout';
import { useTheme } from '../../../context/ThemeContext';
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
    const { isDarkMode } = useTheme();
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
            subtitle: "Book trained chauffeurs for your personal car anytime",
            image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200',
            theme: 'dark',
            cta: 'Book Now',
            path: '/spare-driver'
        },
        {
            id: 'def-2',
            category: 'driver',
            title: 'Late Night Safe Returns',
            subtitle: "Don't Drink & Drive. Let our pro chauffeurs take you home.",
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200',
            theme: 'dark',
            cta: 'Secure Ride',
            path: '/spare-driver'
        },
        {
            id: 'def-3',
            category: 'driver',
            title: 'Outstation Road Trips',
            subtitle: 'Expert highway drivers for your weekend getaways.',
            image: 'https://images.unsplash.com/photo-1603584173870-7f30df065471?auto=format&fit=crop&q=80&w=1200',
            theme: 'dark',
            cta: 'Plan Trip',
            path: '/spare-driver'
        },
        {
            id: 'def-4',
            category: 'driver',
            title: 'Monthly Personal Driver',
            subtitle: 'Get a dedicated executive chauffeur monthly.',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c34b?auto=format&fit=crop&q=80&w=1200',
            theme: 'dark',
            cta: 'Inquire',
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
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };



    const renderHero = () => (
        <section className="relative px-5 pt-4 pb-2">
            <div className={`relative h-[210px] w-full overflow-hidden rounded-[2rem] transition-all duration-300 group shadow-2xl ${
                isDarkMode ? 'bg-[#0A0C10] shadow-black/10' : 'bg-white shadow-black/5'
            }`}>
                {loadingServices ? (
                    <div className={`absolute inset-0 flex items-center px-8 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <div className={`absolute inset-0 shimmer-effect ${isDarkMode ? 'bg-gradient-to-r from-transparent via-white/[0.03] to-transparent' : 'bg-gradient-to-r from-transparent via-black/[0.03] to-transparent'}`} />
                        <div className="space-y-4 w-full relative z-10">
                            <div className={`h-4 w-24 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                            <div className={`h-12 w-2/3 rounded-xl ${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`} />
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
                                    {/* Ken Burns Effect */}
                                    <motion.div
                                        initial={{ scale: 1.1, x: 0 }}
                                        animate={{ scale: 1, x: 4 }}
                                        transition={{ duration: BANNER_DURATION / 1000, ease: "linear" }}
                                        className="absolute inset-0"
                                    >
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-full object-cover select-none"
                                            style={{ opacity: 0.6 }}
                                        />
                                    </motion.div>

                                    {/* Luxury Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />

                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col justify-center px-7 z-20 select-none">
                                        <motion.div
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="mb-3"
                                        >
                                            <span className="text-[9px] font-black tracking-[0.3em] text-[#F59E0B]">
                                                {getGreeting()}
                                            </span>
                                        </motion.div>
                                        
                                        <motion.h2
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-xl font-black leading-tight text-white keep-white mb-2 max-w-[200px]"
                                        >
                                            {banner.title}
                                        </motion.h2>

                                        <motion.div
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="mt-1 flex"
                                        >
                                            <div className="bg-[#F59E0B] text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 shadow-lg shadow-[#F59E0B]/20">
                                                <span>{banner.cta || 'Details'}</span>
                                                <ArrowRight size={14} strokeWidth={3} />
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Progress Indicators */}
                        <div className="absolute bottom-5 left-7 flex gap-1.5 z-30">
                            {displayBanners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setActiveBanner(i); setProgress(0); }}
                                    className={`h-1.5 rounded-full transition-all duration-700 !min-h-0 !min-w-0 ${
                                        i === activeBanner 
                                            ? 'w-6 bg-[#F59E0B]' 
                                            : (isDarkMode ? 'w-1.5 bg-white/40' : 'w-1.5 bg-black/20')
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
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
                    className={`fixed inset-0 z-[2000] flex flex-col pt-8 transition-colors duration-300 ${
                        isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'
                    }`}
                >
                    {/* Search Header */}
                    <div className="px-5 mb-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-[#F59E0B]" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search chauffeur services, bookings, support..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full h-12 border rounded-2xl pl-12 pr-10 text-[14px] font-bold outline-none focus:border-[#F59E0B]/30 transition-all font-sans ${
                                    isDarkMode ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-black/[0.03] border-black/10 text-black'
                                }`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 px-4 flex items-center"
                                >
                                    <X size={16} className={isDarkMode ? 'text-white/30' : 'text-black/30'} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsSearching(false);
                                setSearchQuery('');
                            }}
                            className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Quick Tags when no query */}
                    {!searchQuery && (
                        <div className="px-5 mb-8">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Popular Searches</p>
                            <div className="flex flex-wrap gap-2">
                                {['Point to Point', 'Hourly Driver', 'Full Day', 'Outstation', 'SOS'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSearchQuery(tag)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${
                                            isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/60' : 'bg-black/[0.03] border-black/5 text-black/60'
                                        }`}
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
                                    className="w-10 h-10 border-4 border-[#F59E0B]/20 border-t-[#F59E0B] rounded-full mb-4"
                                />
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Searching Ecosystem...</p>
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
                                        className={`group p-4 border rounded-2xl flex items-center gap-4 transition-all cursor-pointer active:scale-[0.98] shadow-sm ${
                                            isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.05] border-white/5' : 'bg-black/[0.02] hover:bg-black/[0.04] border-black/5'
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm overflow-hidden flex-shrink-0 relative ${
                                            isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/5'
                                        }`}>
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover p-1" alt="" />
                                            ) : (
                                                <Search size={24} className={isDarkMode ? 'text-white/10' : 'text-black/10'} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <h4 className={`text-[14px] font-[1000] tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.title}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider ${item.type === 'SERVICE' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                                        item.type === 'PRODUCT' ? 'bg-blue-500/10 text-blue-400' :
                                                            isDarkMode ? 'bg-white/10 text-white/40' : 'bg-black/10 text-black/40'
                                                        }`}>
                                                        {item.cat || item.type}
                                                    </span>
                                                    {item.price && (
                                                        <span className={`text-[12px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{item.price}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={`text-[11px] font-bold truncate leading-none ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{item.desc}</p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                            isDarkMode ? 'bg-white/[0.03] text-white/20' : 'bg-black/[0.03] text-black/20'
                                        } group-hover:bg-[#F59E0B] group-hover:text-white`}>
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
                                <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 border border-white/10">
                                    <Search size={32} className="text-white/5" />
                                </div>
                                <h3 className={`text-lg font-[1000] uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>No results found</h3>
                                <p className={`text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                    We couldn't find anything matching <span className="text-[#F59E0B]">"{searchQuery}"</span> in our ecosystem.
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-8 text-[10px] font-black text-[#F59E0B] uppercase tracking-widest border-b-2 border-[#F59E0B] pb-1"
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
                        className={`fixed bottom-0 left-0 right-0 rounded-t-[2rem] z-[2101] px-5 pt-1 pb-32 shadow-3xl safe-area-bottom border-t transition-colors duration-300 ${
                            isDarkMode ? 'bg-[#0F1412] border-white/10' : 'bg-white border-black/10'
                        }`}
                    >
                        <div className={`w-10 h-1 rounded-full mx-auto mt-2 mb-4 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} onClick={() => setShowVehicleModal(false)} />

                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-lg font-[1000] tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>Select vehicle</h2>
                            <button
                                onClick={() => navigate('/vehicles?mode=add')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 active:scale-95 transition-all border ${
                                    isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
                                }`}
                            >
                                <Plus size={12} strokeWidth={4} /> Add
                            </button>
                        </div>

                        <div className="space-y-3 mb-2">
                            <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Garage</h3>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {vehicles?.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <p className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>No vehicles</p>
                                    </div>
                                ) : (
                                    vehicles?.map((vehicle, idx) => (
                                        <button
                                            key={vehicle.id || vehicle._id || idx}
                                            onClick={() => {
                                                setShowVehicleModal(false);
                                                navigate(`/spare-driver?type=${selectedServiceForBooking?.id}&vehicleId=${vehicle.id || vehicle._id}`);
                                            }}
                                            className={`w-full border px-3 py-2 rounded-xl flex items-center justify-between group transition-all ${
                                                isDarkMode ? 'bg-white/[0.03] border-white/5 active:bg-white/[0.05]' : 'bg-black/[0.02] border-black/5 active:bg-black/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/[0.01] rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
                                                    <img 
                                                        src={vehicle.image || "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&q=80&w=200"} 
                                                        className="w-[90%] h-full object-contain" 
                                                        alt="" 
                                                    />
                                                </div>
                                                <div className="text-left leading-tight">
                                                    <h4 className={`text-[12px] font-[1000] uppercase truncate max-w-[120px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {vehicle.brand} <span className={isDarkMode ? 'text-white/30' : 'text-black/30'}>{vehicle.model}</span>
                                                    </h4>
                                                    <p className="text-[9px] font-bold text-[#F59E0B] mt-0.5 tracking-wider">{vehicle.plate || vehicle.regNo || 'NO PLATE'}</p>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${idx === 0 ? 'border-[#F59E0B] bg-[#F59E0B]' : 'border-white/10'}`}>
                                                {idx === 0 && <Check size={10} className="text-white" strokeWidth={5} />}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const viewMoreServices = [
        { title: 'Spare drivers', icon: User, color: '#FF8533', path: '/spare-driver' },
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
                                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white keep-white text-4xl font-black shadow-2xl shadow-red-600/50">
                                    {sosCountdown}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white keep-white tracking-tight mb-2">Emergency SOS triggering</h2>
                            <p className="text-white/40 keep-white text-xs font-bold uppercase tracking-widest max-w-[240px]">Alerting nearest captains, vendors and trusted contacts in {sosCountdown}s</p>

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
                             <h2 className={`text-3xl font-black tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>SOS signal active</h2>
                            <div className={`border rounded-2xl p-6 w-full space-y-4 text-left transition-all ${
                                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/5'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Live GPS Packet Sent (HSR L8)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Contacting Policy Admin...</span>
                                </div>
                                <div className="flex items-center gap-4 text-[#FF9900]">
                                    <ShieldAlert size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Nearest Captain Headed to you</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSOS(false)}
                                className={`mt-12 w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                                    isDarkMode ? 'bg-white/5 text-white' : 'bg-black text-white shadow-lg'
                                }`}
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
                        className={`fixed bottom-0 left-0 right-0 rounded-t-[40px] z-[1101] px-6 pt-2 pb-12 shadow-2xl border-t transition-colors duration-300 ${
                            isDarkMode ? 'bg-[#0A0F0D] border-white/10' : 'bg-white border-black/10'
                        }`}
                    >
                        <div className={`w-12 h-1.5 rounded-full mx-auto mt-2 mb-8 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} onClick={() => setShowAllServices(false)} />

                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-2xl font-[1000] uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>All Services</h2>
                            <button
                                onClick={() => setShowAllServices(false)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                                    isDarkMode ? 'bg-white/5 text-white' : 'bg-black/5 text-black'
                                }`}
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
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm relative overflow-hidden group transition-all ${
                                        isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/5'
                                    }`}>
                                        <div className={`absolute inset-0 bg-gradient-to-br from-transparent ${isDarkMode ? 'to-white/[0.02]' : 'to-black/[0.02]'}`} />
                                        <item.icon size={26} style={{ color: item.color }} strokeWidth={2.5} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight leading-tight text-center px-1 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`}>{item.title}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const renderQuickActions = () => (
        <section className="px-5 mb-3">
            <div className="flex items-center justify-between mb-2 px-1">
                <h3 className={`text-[10px] font-black tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Quick dashboard</h3>
                <div className={`h-[1px] flex-1 ml-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/refer')}
                    className={`border p-4 rounded-[20px] flex flex-col gap-3 transition-all text-left relative overflow-hidden group ${
                        isDarkMode ? 'bg-white/5 border-white/5 active:bg-white/[0.02]' : 'bg-white border-black/5 active:bg-black/[0.01] shadow-sm'
                    }`}
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#FF9900]/5 rounded-bl-[30px] -mr-3 -mt-3 group-hover:scale-150 transition-all" />
                    <div className="w-8 h-8 rounded-xl bg-[#FF9900]/10 flex items-center justify-center text-[#FF9900] relative z-10">
                        <Gift size={16} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] font-[1000] tracking-tight leading-none mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Refer assets</p>
                        <p className={`text-[7.5px] font-bold tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>₹50 trip bonus</p>
                    </div>
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/wallet')}
                    className={`border p-4 rounded-[20px] flex flex-col gap-3 transition-all text-left relative overflow-hidden group ${
                        isDarkMode ? 'bg-white/5 border-white/5 active:bg-white/[0.02]' : 'bg-white border-black/5 active:bg-black/[0.01] shadow-sm'
                    }`}
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-bl-[30px] -mr-3 -mt-3 group-hover:scale-150 transition-all" />
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative z-10 ${
                        isDarkMode ? 'bg-white/5 text-white/70' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                        <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] font-[1000] tracking-tight leading-none mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>E-wallet</p>
                        <p className={`text-[7.5px] font-bold tracking-widest ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Credits & payouts</p>
                    </div>
                </motion.button>
            </div>
        </section>
    );

    const renderDashboard = () => {
        return (
            <div className="pb-0 space-y-0 transition-colors">
                {/* Elite Service Grid - Dynamic & Premium */}
                <section className="px-5 -mt-8 relative z-30 mb-4">
                    <div className={`rounded-[2.5rem] p-6 shadow-2xl border relative overflow-hidden transition-all duration-300 ${
                        isDarkMode ? 'bg-[#0A0F0D] border-white/5 shadow-black/40' : 'bg-white border-black/5 shadow-black/5'
                    }`}>
                        {loadingServices ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#F59E0B]/20 rounded-full shimmer-effect" />
                                    <div className="h-4 w-32 bg-white/10 rounded-full shimmer-effect" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-[1/0.9] bg-white/5 rounded-[2rem] shimmer-effect opacity-50" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Title Hook */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-1.5 h-6 bg-[#F59E0B] rounded-full" />
                                    <h3 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Drivers on demand</h3>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                                    {[
                                        { id: 'point', icon: pImg, badge: 'Popular' },
                                        { id: 'hourly', icon: hImg, badge: 'Rental' },
                                        { id: 'full', icon: fImg, badge: 'Elite' },
                                        { id: 'outstation', icon: oImg, badge: 'Long Drive' }
                                    ].map((item, idx) => {
                                        // Find real service data from backend
                                        const apiService = services.find(s => 
                                            s.id === item.id || 
                                            s.title?.toLowerCase().includes(item.id) ||
                                            s.name?.toLowerCase().includes(item.id)
                                        );
                                        const serviceName = apiService?.title || apiService?.name || item.id.charAt(0).toUpperCase() + item.id.slice(1);

                                        return (
                                            <motion.button
                                                key={item.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (vehicles?.length === 0) {
                                                        navigate('/vehicles?mode=add');
                                                    } else {
                                                        setSelectedServiceForBooking(apiService || { id: item.id, title: serviceName });
                                                        setShowVehicleModal(true);
                                                    }
                                                }}
                                                className="flex flex-col items-center text-center group relative h-full"
                                            >
                                                {/* Visual Housing */}
                                                <div className={`w-full aspect-[1/0.9] rounded-[2rem] flex items-center justify-center relative overflow-hidden mb-3 border transition-all duration-500 group-hover:border-[#F59E0B]/40 group-hover:shadow-2xl group-hover:shadow-[#F59E0B]/10 ${
                                                    isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'
                                                }`}>
                                                    {/* Badge */}
                                                    <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest z-20 ${
                                                        isDarkMode ? 'bg-black text-[#F59E0B]' : 'bg-white shadow-sm text-[#F59E0B]'
                                                    }`}>
                                                        {item.badge}
                                                    </div>

                                                    {/* Decorative Elements */}
                                                    <motion.div 
                                                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 3 }}
                                                        className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" 
                                                    />
                                                    
                                                    <img 
                                                        src={item.icon} 
                                                        className="w-[85%] h-auto object-contain transform transition-all duration-500 group-hover:scale-110 drop-shadow-2xl relative z-10" 
                                                        alt={serviceName} 
                                                    />
                                                </div>

                                                <div className="space-y-1 w-full px-1">
                                                    <h4 className={`text-[12px] font-black tracking-tight leading-tight group-hover:text-[#F59E0B] transition-colors line-clamp-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {serviceName}
                                                    </h4>
                                                    <p className={`text-[8px] font-bold tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                                        Instant booking
                                                    </p>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* Quick Actions Injection */}
                {renderQuickActions()}

                {/* Upcoming Services Section - Compact Elite Layout */}
                <section className="px-5 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-[10px] font-black tracking-[0.2em] ${isDarkMode ? 'text-white/10' : 'text-black/20'}`}>Future ecosystem</h3>
                        <div className={`h-[0.5px] flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'instant', title: 'Instant Wash', image: '/assets/instantwash/carwash.png' },
                            { id: 'studio', title: 'Studio Wash', image: '/assets/studiowash/studio.png' },
                            { id: 'apartment', title: 'Apartment Wash', image: '/assets/appartment/appartment.png' }
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    toast('Synchronizing with your sector... 🚀', {
                                        style: { borderRadius: '20px', background: '#000', color: '#fff' }
                                    });
                                }}
                                className="flex flex-col items-center group relative cursor-default"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden mb-2 border transition-all ${
                                    isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/5'
                                }`}>
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-1">
                                        <span className="text-[5px] font-black text-white tracking-tighter leading-none">Coming</span>
                                        <span className="text-[5px] font-black text-white tracking-tighter leading-none whitespace-nowrap">soon</span>
                                    </div>
                                    <img 
                                        src={item.image} 
                                        className="w-[70%] h-auto object-contain opacity-30 grayscale" 
                                        alt={item.title} 
                                    />
                                </div>
                                <span className={`text-[10px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {item.title}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </section>


                {/* Professional Secondary Banners - Elite Carousel Style */}
                <section className="relative px-5 mb-4">
                    <div className={`relative h-[120px] w-full overflow-hidden rounded-[2rem] transition-all duration-300 ${
                        isDarkMode ? 'bg-black shadow-black/80' : 'bg-white border border-black/5 shadow-black/5'
                    }`}>
                        <motion.div 
                            className="flex h-full w-full"
                            animate={{ x: `-${activePromo * 100}%` }}
                            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }} 
                        >
                            {sliderCards.map((card, idx) => {
                                const isUpcoming = card.title?.toLowerCase().includes('wash') || card.title?.toLowerCase().includes('detailing');
                                
                                return (
                                    <motion.div
                                        key={card.id || idx}
                                        onClick={() => card.action ? card.action() : navigate(card.path)}
                                        className="flex-shrink-0 w-full h-full cursor-pointer group"
                                    >
                                        <div className="relative h-full flex items-center px-8">
                                            {/* Immersive Background Detail */}
                                            <div className="absolute right-[-10%] top-0 h-full w-[60%] opacity-20 transform skew-x-[-20deg]">
                                                <img 
                                                    src={card.image} 
                                                    className="h-full w-full object-cover" 
                                                    onError={(e) => { e.target.style.display = 'none'; }} 
                                                />
                                            </div>

                                            <div className="relative z-10 flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                     {isUpcoming ? (
                                                         <span className="bg-[#F59E0B] text-white text-[7px] font-black px-2 py-0.5 rounded-full tracking-widest">Upcoming</span>
                                                     ) : (
                                                         <>
                                                            <div className="w-1 h-1 bg-[#F59E0B] rounded-full animate-pulse" />
                                                            <span className="text-[9px] font-black text-[#F59E0B] tracking-[0.2em]">{card.badge || 'Promo'}</span>
                                                         </>
                                                     )}
                                                </div>
                                                <h3 className={`text-[17px] font-[1000] leading-tight tracking-tight max-w-[200px] ${
                                                    isDarkMode ? 'text-white' : 'text-black'
                                                }`}>
                                                    {card.title}
                                                </h3>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[9px] font-black tracking-widest text-[#F59E0B] border-b-2 border-[#F59E0B] pb-0.5">{card.cta || 'Details'}</span>
                                                    <ArrowRight size={12} className="text-[#F59E0B]" strokeWidth={3} />
                                                </div>
                                            </div>
                                            
                                            {/* Float Thumbnail */}
                                            <div className="relative h-[80%] aspect-square z-10 group-hover:scale-110 transition-transform duration-700">
                                                <img 
                                                    src={card.image} 
                                                    className="w-full h-full object-contain drop-shadow-2xl" 
                                                    onError={(e) => { e.target.src = '/assets/carwash/1.png'; }} 
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Minimalist Progress Indicators */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                            {sliderCards.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1.5 rounded-full transition-all duration-300 !min-h-0 !min-w-0 ${
                                        i === activePromo ? 'w-5 bg-[#F59E0B]' : (isDarkMode ? 'w-1.5 bg-white/40' : 'w-1.5 bg-black/20')
                                    }`} 
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        );
    };

    const renderKycNudge = () => {
        if (!user || user.isVerified) return null;
        return (
            <section className="px-5 mb-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => navigate('/compliance')}
                    className={`rounded-[24px] p-5 flex items-center justify-between shadow-2xl border relative overflow-hidden group transition-all duration-300 ${
                        isDarkMode ? 'bg-[#111827] border-white/5 shadow-black/50' : 'bg-white border-black/5 shadow-black/5'
                    }`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9900]/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[#FF9900] border ${
                            isDarkMode ? 'bg-white/10 border-white/5' : 'bg-black/5 border-black/5'
                        }`}>
                            <ShieldCheck size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className={`text-[13px] font-[1000] tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Identity trust protocol</h4>
                            <p className={`text-[9px] font-bold tracking-widest mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Complete KYC to unlock full access</p>
                        </div>
                    </div>
                </motion.div>
            </section>
        );
    };

    const renderFooter = () => (
        <section className="pb-6 pt-4">
            <div className="px-5">
                <div className={`p-5 rounded-2xl border text-center transition-all duration-300 ${
                    isDarkMode ? 'bg-[#0A0F0D] border-white/5 shadow-black/40' : 'bg-white border-black/5 shadow-sm'
                }`}>
                    <h2 className={`text-[18px] font-black tracking-tighter leading-[0.9] mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        India's #1<br />Elite chauffeur network
                    </h2>

                    <div className="grid grid-cols-3 gap-2 mb-1">
                        <div className="flex flex-col items-center gap-2">
                            <ShieldCheck size={18} className="text-[#F59E0B]" />
                            <p className={`text-[8px] font-black tracking-[0.2em] leading-none ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>Verified</p>
                        </div>
                        <div className={`flex flex-col items-center gap-2 border-x ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                            <User size={18} className="text-[#F59E0B]" />
                            <p className={`text-[8px] font-black tracking-[0.2em] leading-none ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>Professional</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Zap size={18} className="text-[#F59E0B]" />
                            <p className={`text-[8px] font-black tracking-[0.2em] leading-none ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>Rapid</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 bg-transparent`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .shadow-card { box-shadow: 0 15px 40px -15px rgba(0,0,0,0.5); }
                    .text-stroke-black { -webkit-text-stroke: 1.5px #F59E0B; }
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
