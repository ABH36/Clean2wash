import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star,
    Home as HomeIcon, Gift, User, Car, ShoppingBag, Image,
    Shield, FileText, Search, Zap, ShieldCheck, CreditCard, Sparkles,
    Instagram, Twitter, Facebook, Heart, Truck, Building, Briefcase, Wallet,
    AlertTriangle, BatteryCharging, ArrowRight, Activity, BellRing, MoreHorizontal, X, LayoutGrid, Calendar, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { serviceAPI } from '../../../utils/api';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import MobileLayout from '../components/layout/MobileLayout';
import PremiumBadge from '../components/membership/PremiumBadge';
import BlackPassModal from '../components/membership/BlackPassModal';

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
    const [showBlackPassModal, setShowBlackPassModal] = useState(false);
    const { getUser, userSubscription, isBlackPassMember, bookings } = useAuth();
    const user = getUser('consumer');

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

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoadingServices(true);
                const response = await serviceAPI.getHomeData();

                if (response.status === 'success') {
                    const { banners, services, categories, cards, stats } = response.data;
                    setBanners(banners || []);
                    setServices(services || []);
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
                        }));
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


    const renderHeader = () => (
        <header className="px-5 pt-8 pb-4 bg-[#FFF6E9] flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black">CW</div>
                    <LocationIndicator variant="minimal" className="ml-1" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/wallet')} className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center relative">
                        <Wallet size={20} className="text-black" />
                    </button>
                    <button onClick={() => navigate('/portfolio')} className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center relative">
                        <Image size={20} className="text-black" />
                    </button>
                    <button onClick={() => navigate('/notifications')} className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center relative">
                        <Bell size={20} className="text-black" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-brand border-2 border-[#FFF6E9] rounded-full" />
                    </button>
                    <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                        <User size={20} className="text-black" />
                        {isBlackPassMember && (
                            <div className="absolute -top-1 -right-1 z-30 scale-[0.6]">
                                <PremiumBadge />
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );

    const userBookings = bookings?.filter(b => b.consumer === user?.id || b.consumer?.id === user?.id || b.userId === user?.id) || [];

    // Find active booking for live tracking banner
    const activeBooking = useMemo(() => {
        return userBookings.find(b =>
            ['pending', 'confirmed', 'assigned', 'en_route', 'arrived', 'before_photo', 'picked-up', 'in_progress', 'washing', 'after_photo', 'pickup-assigned', 'at-studio', 'quality-check', 'ready-for-delivery'].includes(b.status)
        );
    }, [userBookings]);

    const DEFAULT_BANNERS = [
        {
            id: 'def-1',
            title: '100% Doorstep Prep',
            subtitle: 'Professional car care at your location',
            image: '/assets/carwash/6.png',
            theme: 'dark',
            path: '/services'
        },
        {
            id: 'def-2',
            title: 'Studio Shine Level',
            subtitle: 'Ultra-premium detailing & coating',
            image: '/assets/carwash/3.png',
            theme: 'light',
            path: '/studios'
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
        navigate(banner.path || '/services');
    };

    const renderHero = () => (
        <section className="relative h-[250px] w-full overflow-hidden bg-black group">
            {loadingServices ? (
                <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center px-8">
                    <div className="space-y-4 w-full">
                        <div className="h-12 w-2/3 bg-white/10 rounded-xl" />
                        <div className="h-3 w-1/3 bg-white/5 rounded-full" />
                    </div>
                </div>
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        {displayBanners.map((banner, idx) => idx === activeBanner && (
                            <motion.div
                                key={banner.id || idx}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => handleBannerClick(banner)}
                                className="absolute inset-0 cursor-pointer"
                            >
                                {/* Banner Image with Ken Burns Effect */}
                                <motion.div
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 1.1 }}
                                    transition={{ duration: 6, ease: "linear" }}
                                    className="absolute inset-0"
                                >
                                    <img
                                        src={banner.image || "/assets/carwash/6.png"}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                        style={{ opacity: banner.theme === 'dark' ? 0.6 : 0.8 }}
                                        onError={(e) => { e.target.src = "/assets/carwash/6.png"; }}
                                    />
                                </motion.div>

                                <div className={`absolute inset-0 ${banner.theme === 'dark'
                                    ? 'bg-gradient-to-r from-black via-black/40 to-transparent'
                                    : 'bg-gradient-to-r from-white via-white/20 to-transparent'
                                    }`} />

                                {/* Banner Content */}
                                <div className="absolute inset-0 flex flex-col justify-center px-8 z-10 select-none">
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.6 }}
                                    >
                                        <h2 className={`text-[44px] font-[1000] leading-[0.8] tracking-[ -0.05em] uppercase mb-3 ${banner.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                            {banner.title.split(' ').map((word, i) => (
                                                <React.Fragment key={i}>
                                                    {word === '100%' ? <span className="text-brand">{word}</span> : word}
                                                    {i % 2 === 1 ? <br /> : ' '}
                                                </React.Fragment>
                                            ))}
                                        </h2>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-6 ${banner.theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                                            {banner.subtitle}
                                        </p>

                                        <motion.div
                                            whileHover={{ x: 5 }}
                                            className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] ${banner.theme === 'dark' ? 'text-brand' : 'text-black'}`}
                                        >
                                            <span className="border-b-2 border-current pb-0.5">{banner.cta || 'Explore Now'}</span>
                                            <ArrowRight size={16} strokeWidth={3} />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Banner Progress Indicators */}
                    <div className="absolute bottom-6 left-8 right-8 flex gap-2 z-20">
                        {displayBanners.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => { setActiveBanner(i); setProgress(0); }}
                                className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                            >
                                {i === activeBanner && (
                                    <motion.div
                                        className="h-full bg-brand"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ ease: "linear" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFF6E9] to-transparent z-10" />
        </section>
    );

    useEffect(() => {
        let timer;
        if (showSOS && sosCountdown > 0 && !sosActive) {
            timer = setTimeout(() => setSosCountdown(c => c - 1), 1000);
        } else if (showSOS && sosCountdown === 0 && !sosActive) {
            setSosActive(true);
            // Simulate SOS Signal Sent
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
                                <Search size={18} className="text-brand" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search car wash, products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-10 text-[14px] font-bold text-black outline-none focus:border-brand/30 transition-all"
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
                                {['Instant Wash', 'Polish', 'Shampoo', 'Driver', 'Subscription'].map(tag => (
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
                                    className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full mb-4"
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
                                        className="group p-4 bg-white hover:bg-brand/5 border border-gray-100 rounded-2xl flex items-center gap-4 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
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
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${item.type === 'SERVICE' ? 'bg-brand/10 text-brand' :
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
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-black/20 group-hover:bg-brand group-hover:text-white transition-colors">
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
                                    We couldn't find anything matching <span className="text-brand">"{searchQuery}"</span> in our ecosystem.
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-8 text-[10px] font-black text-brand uppercase tracking-widest border-b-2 border-brand pb-1"
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
    const studioServices = useMemo(() => services.filter(s => s.metadata?.category?.toLowerCase() === 'studio' || s.category?.toLowerCase() === 'studio').slice(0, 3), [services]);
    const expansionItems = useMemo(() => promotionalCards.filter(c => c.type === 'Expansion'), [promotionalCards]);
    const sliderCards = useMemo(() => {
        const dbCards = promotionalCards.filter(c => c.type !== 'Expansion');

        // Inject Premium Black Pass Card if user OR if not a member
        const blackCard = {
            id: 'static-black-pass',
            title: 'Black Pass Membership',
            subtitle: '30% OFF ON ALL SERVICES FOREVER',
            badge: 'PREMIUM',
            theme: 'dark',
            cta: 'Purchase Now',
            image: '/assets/carwash/7.png',
            action: () => setShowBlackPassModal(true)
        };

        return [blackCard, ...dbCards];
    }, [promotionalCards, isBlackPassMember]);

    const exploreItems = useMemo(() => {
        const dbExplore = categories.filter(c => c.metadata?.isExplore);
        // Add Products link if not present
        if (!dbExplore.find(i => i.title === 'Products' || i.name === 'Products')) {
            dbExplore.unshift({ title: 'Products', image: '/assets/product-accessories/product.png', path: '/e-shop' });
        }
        return dbExplore.map(item => ({
            ...item,
            title: item.title || item.name,
            icon: item.iconUrl || item.icon,
            image: item.image || (item.icon?.startsWith('/') ? item.icon : null),
            color: item.metadata?.color || item.color,
            action: item.metadata?.action || item.action
        }));
    }, [categories]);

    const viewMoreServices = [
        { title: 'Instant Wash', icon: Car, color: '#F29F05', path: '/instant-wash' },
        { title: 'Apartments', icon: Building, color: '#6366F1', path: '/apartment-wash' },
        { title: 'Appointment', icon: Calendar, color: '#3B82F6', path: '/full-wash-booking' },
        { title: 'Spare Drivers', icon: User, color: '#FF8533', path: '/spare-driver' },
        { title: 'Alerts', icon: Bell, color: '#A855F7', path: '/notifications' },
        { title: 'E-Shop', icon: ShoppingBag, color: '#10B981', path: '/e-shop' },
        { title: 'Studio Wash', icon: HomeIcon, color: '#6366F1', path: '/studios' },
        { title: 'SOS', icon: AlertTriangle, color: '#EF4444', action: triggerSOS },
        { title: 'Support', icon: Heart, color: '#EC4899', path: '/help' },
        { title: 'Vehicle', icon: Truck, color: '#3B82F6', path: '/vehicles' },
        { title: 'Wallet', icon: Wallet, color: '#F59E0B', path: '/wallet' }
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
                                <div className="flex items-center gap-4 text-brand">
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

    const renderDashboard = () => {
        return (
            <div className="pb-6 space-y-8">
                {/* Everything In Minutes - Rapido Style Bento Grid */}
                {/* Active Booking Live Tracker Card */}
                <AnimatePresence>
                    {activeBooking && (
                        <motion.section
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            className="px-5 pt-3"
                        >
                            <div
                                onClick={() => navigate(`/booking-status?id=${activeBooking._id || activeBooking.id}&type=${activeBooking.service?.type || activeBooking.type || 'captain'}`)}
                                className="bg-[#0F172A] rounded-3xl p-5 text-white flex flex-col gap-4 relative overflow-hidden shadow-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            >
                                {/* Decorative Blur */}
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand/30 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                                            <Zap size={20} className="text-brand" fill="currentColor" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-[1000] text-[15px] uppercase tracking-tighter leading-none">Live Mission</h3>
                                                <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-green-500/30">
                                                    <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" /> Active
                                                </span>
                                            </div>
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Tap to track status</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10">
                                        <ChevronRight size={20} className="text-white/40" />
                                    </div>
                                </div>

                                <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Service</p>
                                            <p className="text-[14px] font-black leading-tight tracking-snug">{activeBooking.service?.name || activeBooking.serviceName || 'Car Wash'}</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div className="flex-1">
                                            <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-[14px] font-black leading-tight tracking-snug text-green-400 capitalize">{(activeBooking.status || '').replace('_', ' ')}</p>
                                        </div>
                                    </div>

                                    {activeBooking.schedule?.type === 'scheduled' && activeBooking.status === 'confirmed' && (
                                        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-white/40">
                                                <Calendar size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{new Date(activeBooking.schedule.date).toLocaleDateString()} @ {activeBooking.schedule.timeSlot?.start}</span>
                                            </div>
                                            <div className="bg-brand/20 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-brand/30">
                                                <Clock size={10} className="text-brand" />
                                                <span className="text-[10px] font-black tabular-nums text-white">
                                                    <CountdownTimer targetTime={activeBooking.schedule} />
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
                <section className="px-5">
                    <h3 className="text-[14px] font-black text-black opacity-40 uppercase tracking-widest mb-3">Everything In Minutes</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Instant Wash - Large Vertical Card */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate('/instant-wash')}
                            className="bg-amber-50/50 rounded-xl p-4 text-left flex flex-col justify-between h-[155px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)] border border-amber-100/50 relative overflow-hidden group"
                        >
                            {/* Visual Asset - Shifted to avoid bottom pill overlap */}
                            <div className="absolute right-[-15%] top-[10%] w-[110%] h-[80%] transition-transform duration-700 group-hover:scale-105 pointer-events-none z-0">
                                <img src="/assets/instantwash/carwash.png" className="w-full h-full object-contain opacity-90" alt="" />
                            </div>

                            <div className="relative z-20">
                                <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1">Professional</p>
                                <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tighter leading-[0.9]">Instant<br />Car/Bike Wash</h4>
                            </div>

                            <div className="relative z-20 -ml-0.5">
                                <div className="bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded-lg inline-flex items-center shadow-xl shadow-black/10 border border-white/5">
                                    <span className="text-[6.5px] font-[1000] uppercase tracking-[0.05em] leading-none">Starts @ ₹299</span>
                                </div>
                            </div>
                        </motion.button>

                        {/* Studio Wash - Large Vertical Card */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate('/full-wash-booking')}
                            className="bg-blue-50/50 rounded-xl p-4 text-left flex flex-col justify-between h-[155px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)] border border-blue-100/50 relative overflow-hidden group"
                        >
                            {/* Visual Asset */}
                            <div className="absolute right-[-15%] top-[10%] w-[110%] h-[80%] transition-transform duration-700 group-hover:scale-105 pointer-events-none z-0">
                                <img src="/assets/studiowash/studio.png" className="w-full h-full object-contain opacity-90" alt="" />
                            </div>

                            <div className="relative z-20">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Premium</p>
                                <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tighter leading-[0.9]">Studio<br />Wash</h4>
                            </div>

                            <div className="relative z-20 -ml-0.5">
                                <div className="bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded-lg inline-flex items-center shadow-xl shadow-black/10 border border-white/5">
                                    <span className="text-[6.5px] font-[1000] uppercase tracking-[0.05em] leading-none">Book Schedule</span>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </section>

                <section className="flex gap-3 px-5 -mt-5">
                    {/* Apartment Wash */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/apartment-wash')}
                        className="flex-1 bg-indigo-50/50 p-3 text-left flex flex-col justify-between h-[85px] rounded-2xl relative overflow-hidden group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-indigo-100/50"
                    >
                        <div className="absolute right-[-15%] top-[15%] w-[100%] h-[95%] transition-transform duration-700 group-hover:scale-105 pointer-events-none z-0">
                            <img src="/assets/appartment/appartment.png" className="w-full h-full object-contain opacity-90" alt="" />
                        </div>
                        <div className="relative z-20">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Subscription</p>
                            <h4 className="text-[14px] font-[1000] text-black uppercase tracking-tighter leading-[0.9]">Apartment<br />Car Wash</h4>
                        </div>
                    </motion.button>

                    {/* Spare Driver */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/spare-driver')}
                        className="flex-1 bg-orange-50/40 p-3 text-left flex flex-col justify-between h-[85px] rounded-2xl relative overflow-hidden group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-100/50"
                    >
                        <div className="absolute right-[-15%] top-[15%] w-[100%] h-[95%] transition-transform duration-700 group-hover:scale-105 pointer-events-none z-0">
                            <img src="/assets/sparedriver/sparedriver.png" className="w-full h-full object-contain opacity-90" alt="" />
                        </div>
                        <div className="relative z-20">
                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">On-Demand</p>
                            <h4 className="text-[14px] font-[1000] text-black uppercase tracking-tighter leading-[0.9]">Spare<br />Driver</h4>
                        </div>
                    </motion.button>
                </section>

                {/* Studio Detailing - Premium Section */}
                {studioServices.length > 0 && (
                    <section className="px-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-black text-black opacity-40 uppercase tracking-widest">Studio Detailing</h3>
                            <button onClick={() => navigate('/studios')} className="text-[10px] font-black text-brand uppercase tracking-widest">Show All</button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {studioServices.map((service) => (
                                <motion.div
                                    key={service.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(service.metadata?.path || `/service/${service.id}`)}
                                    className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-black/[0.05] shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-black/[0.03] overflow-hidden flex-shrink-0 z-10">
                                        <img src={service.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-[14px] font-[1000] text-black uppercase tracking-tight">{service.title}</h4>
                                            {service.badge && (
                                                <span className="bg-brand/10 text-brand text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase italic">{service.badge}</span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest leading-none">
                                            Premium care • {service.price}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-black/20 group-hover:bg-brand group-hover:text-white transition-all z-10">
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Explore Categories - Grid Icons */}
                <section className="px-5 pt-0 -mt-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[15px] font-black text-black opacity-40 uppercase tracking-widest">Explore</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {loadingServices ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="w-14 h-14 bg-gray-50 animate-pulse rounded-xl mx-auto" />)
                        ) : [
                            ...exploreItems,
                            { title: 'View More', icon: LayoutGrid, color: '#6366F1', action: () => setShowAllServices(true) },
                        ].map((item, idx) => (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => item.action ? (typeof item.action === 'function' ? item.action() : (item.action === 'triggerSOS' ? triggerSOS() : null)) : navigate(item.path)}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className={`w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100/50 shadow-sm overflow-hidden ${item.image ? '' : 'p-2'}`}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-contain scale-[1.5]" />
                                    ) : (
                                        <div style={{ color: item.color }}>
                                            {item.icon === 'shield-check' ? <ShieldCheck size={22} strokeWidth={2.5} /> :
                                                item.icon === 'activity' ? <Activity size={22} strokeWidth={2.5} /> :
                                                    item.icon === 'alert-triangle' ? <AlertTriangle size={22} strokeWidth={2.5} /> :
                                                        <LayoutGrid size={22} strokeWidth={2.5} />}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-black/60 uppercase tracking-tight leading-tight">{item.title}</span>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Dynamic Promotional Cards (Slider) */}
                <section className="px-5 overflow-x-auto no-scrollbar flex gap-4">
                    {sliderCards.length > 0 ? sliderCards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => card.action ? card.action() : navigate(card.path)}
                            className={`${card.theme === 'dark' ? 'bg-black' : 'bg-brand/5'} relative overflow-hidden group min-w-[300px] h-[160px] rounded-3xl shadow-xl flex items-center px-8 border border-black/5`}
                        >
                            <div className={`absolute right-[-5%] top-[-20%] w-48 h-48 ${card.theme === 'dark' ? 'bg-brand/20' : 'bg-brand/10'} rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700`} />
                            <div className="relative z-10 flex-1">
                                <span className="text-[11px] font-black text-brand uppercase tracking-[0.3em] mb-2 block">{card.badge}</span>
                                <h3 className={`text-[20px] font-[1000] uppercase leading-none tracking-tighter ${card.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                    {card.title.split(' ').slice(0, 2).join(' ')}<br />{card.title.split(' ').slice(2).join(' ')}
                                </h3>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${card.theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                                    {card.subtitle}
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${card.theme === 'dark' ? 'text-brand' : 'text-black'}`}>{card.cta}</span>
                                    <ArrowRight size={14} className={card.theme === 'dark' ? 'text-brand' : 'text-black'} />
                                </div>
                            </div>
                            <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 opacity-20 rotate-[15deg]">
                                <img src={card.image} className="w-full h-full object-contain" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                        </motion.div>
                    )) : (
                        <div className="w-full h-32 bg-gray-50 rounded-3xl animate-pulse" />
                    )}
                </section>
            </div>
        );
    };

    const renderFooter = () => (
        <section className="pb-12 space-y-8">
            <div className="px-5">
                <div className="flex items-center justify-center gap-6">
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-black/10 to-black/20 flex-1" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">Hyper Drive Explore</span>
                    <div className="h-[2px] bg-gradient-to-l from-transparent via-black/10 to-black/20 flex-1" />
                </div>
            </div>

            {/* Premium Guarantee Section */}
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-1 bg-[#F29F05] rounded-full" />
                    <h3 className="text-[13px] font-black text-black uppercase tracking-widest">Clean2Wash Promise</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-2.5">
                        <div className="w-8 h-8 bg-green-100/50 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-black uppercase leading-none">Eco-Friendly</h4>
                            <p className="text-[8px] font-[900] text-black/30 mt-1.5 uppercase leading-[1.2] tracking-tighter">95% LESS WATER THAN TRADITIONAL WASH</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-2.5">
                        <div className="w-8 h-8 bg-blue-100/50 rounded-lg flex items-center justify-center">
                            <Shield size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-black uppercase leading-none">Studio Care</h4>
                            <p className="text-[8px] font-[900] text-black/30 mt-1.5 uppercase leading-[1.2] tracking-tighter">CERTIFIED EQUIPMENT & PREMIUM CHEMICALS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expansion Hype Banner - Showroom, Apartment, Corporate Coming Soon */}
            <div className="bg-black py-14 relative overflow-hidden group">
                {/* High-Intensity Radial Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-brand/30 rounded-full blur-[120px] z-0 animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-indigo-600/30 rounded-full blur-[120px] z-0" />

                <div className="relative z-10 px-4">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-[1px] w-8 bg-brand" />
                            <span className="text-brand text-[10px] font-black uppercase tracking-[0.5em]">Building Success</span>
                            <div className="h-[1px] w-8 bg-brand" />
                        </div>
                        <h2 className="text-white text-[32px] font-[1000] leading-[0.8] uppercase tracking-tighter mb-4">
                            WE ARE<br />EXPANDING
                        </h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[200px]">Next-gen care arriving at new horizons</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        {expansionItems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => item.path && navigate(item.path)}
                                className={`bg-gradient-to-r ${item.val} backdrop-blur-xl border border-white/20 px-4 py-3 rounded-2xl flex items-center justify-between group/item transition-all duration-300 shadow-xl cursor-pointer`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:bg-white/20">
                                        <div className="text-white">
                                            {item.title === 'Spare Drivers' ? <User size={22} /> :
                                                item.title === 'Apartments' ? <HomeIcon size={22} /> :
                                                    <Briefcase size={22} />}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-white text-[15px] font-[1000] uppercase tracking-tighter leading-none">{item.title}</h4>
                                        <span className="text-white/40 text-[8px] font-black uppercase mt-1 tracking-widest">{item.subtitle}</span>
                                    </div>
                                </div>
                                <div className={`bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] border border-white/20 group-hover/item:bg-white group-hover/item:text-black transition-colors duration-300 ${item.cta === 'Join Now' ? 'bg-white text-black' : ''}`}>
                                    {item.cta}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* How it Works - Minimalist Steps */}
            <div className="mt-8 bg-white/40 p-5 rounded-2xl border border-black/5">
                <h3 className="text-[11px] font-black text-black uppercase tracking-widest mb-5 text-center opacity-60">Professional Process</h3>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col items-center text-center flex-1">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black mb-3">1</div>
                        <p className="text-[10px] font-black text-black uppercase leading-tight">Book a<br />Service</p>
                    </div>
                    <div className="h-px bg-black/10 flex-1 mt-4" />
                    <div className="flex flex-col items-center text-center flex-1">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black mb-3">2</div>
                        <p className="text-[10px] font-black text-black uppercase leading-tight">Expert<br />Pickup</p>
                    </div>
                    <div className="h-px bg-black/10 flex-1 mt-4" />
                    <div className="flex flex-col items-center text-center flex-1">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black mb-3">3</div>
                        <p className="text-[10px] font-black text-black uppercase leading-tight">Studio<br />Shine</p>
                    </div>
                </div>
            </div>

            {/* Consolidated Brand Identity Card */}
            <div className="mt-8 bg-white/80 p-8 rounded-2xl border border-black/10 text-center shadow-sm">
                <h2 className="text-[20px] font-black text-black/40 tracking-tighter uppercase leading-[0.9] mb-8">
                    India's #1<br />Car & Bike Care App
                </h2>

                <div className="grid grid-cols-3 gap-4 border-b border-black/5 pb-8 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className={i === 1 ? "border-x border-black/10" : ""}>
                            <p className="text-[16px] font-black text-black leading-none uppercase">{stat.value}</p>
                            <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                    {stats.length === 0 && (
                        [1, 2, 3].map(i => <div key={i} className="h-10 bg-black/5 animate-pulse rounded-lg" />)
                    )}
                </div>

                {/* Compact Trust Badges */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                    <div className="flex flex-col items-center gap-3">
                        <ShieldCheck size={18} className="text-black/60" />
                        <p className="text-[7px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Secure</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <Sparkles size={18} className="text-black/60" />
                        <p className="text-[7px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Premium</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <CreditCard size={18} className="text-black/60" />
                        <p className="text-[7px] font-black text-black/70 uppercase tracking-[0.2em] leading-none">Fair</p>
                    </div>
                </div>

                <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.3em] font-sans">Designed in India 🇮🇳</p>
            </div>

            {/* Premium Footer Section - Ultra Compact & Professional */}
            <footer className="mt-4 pb-4 border-t border-black/[0.03] pt-6">
                <div className="flex flex-col items-center">
                    {/* Socials - Minimalist */}
                    <div className="flex items-center gap-5 mb-6">
                        {['Instagram', 'Twitter', 'Facebook'].map((social) => (
                            <div key={social} className="w-8 h-8 bg-black/[0.02] rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer active:scale-90">
                                {social === 'Instagram' && <Instagram size={14} className="text-black/40" />}
                                {social === 'Twitter' && <Twitter size={14} className="text-black/40" />}
                                {social === 'Facebook' && <Facebook size={14} className="text-black/40" />}
                            </div>
                        ))}
                    </div>

                    {/* Links - Unified Row */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 px-8">
                        {['About', 'Services', 'Studios', 'Terms', 'Privacy', 'Support'].map((link) => (
                            <span key={link} className="text-[9px] font-black text-black/30 uppercase tracking-[0.15em] hover:text-black transition-colors cursor-pointer">
                                {link}
                            </span>
                        ))}
                    </div>

                    {/* Legal & Local - Tightened */}
                    <div className="text-center space-y-1.5 px-10 mb-6">
                        <p className="text-[8px] font-[900] text-black/25 uppercase tracking-widest leading-none">
                            contact@clean2wash.com  •  +91 98765 43210
                        </p>
                        <p className="text-[8px] font-bold text-black/15 uppercase tracking-[0.1em] leading-none">
                            © 2026 CLEAN2WASH TECHNOLOGIES PVT LTD
                        </p>
                    </div>

                    {/* Signature - Sleek */}
                    <div className="flex items-center gap-2.5 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <span className="text-[9px] font-black text-black uppercase tracking-tighter">MADE WITH</span>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-black uppercase tracking-tighter">IN INDIA</span>
                    </div>
                </div>
            </footer>

            {/* Tight Spacing for Floating UI */}


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
                    <BlackPassModal
                        isOpen={showBlackPassModal}
                        onClose={() => setShowBlackPassModal(false)}
                    />
                    {renderHeader()}
                    {renderHero()}

                    {/* Rapido Style Search Bar - Now triggers the Search Overlay */}
                    <div className="px-5 mb-2 -mt-8 relative z-30" onClick={() => setIsSearching(true)}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-black opacity-30" />
                            </div>
                            <input
                                type="text"
                                readOnly
                                placeholder="Search for car wash, products..."
                                className="w-full h-13 bg-white border border-gray-100 rounded-3xl pl-12 pr-4 text-[14px] font-semibold text-black placeholder:text-black/30 outline-none cursor-pointer shadow-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-0">
                        {renderDashboard()}
                        {renderFooter()}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Home;
