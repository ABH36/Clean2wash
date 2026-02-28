import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star,
    Home as HomeIcon, Gift, User, Car, ShoppingBag, Image,
    Shield, FileText, Search, Zap, ShieldCheck, CreditCard, Sparkles,
    Instagram, Twitter, Facebook, Heart, Truck, Building, Briefcase, Wallet,
    AlertTriangle, BatteryCharging, ArrowRight, Activity, BellRing, MoreHorizontal, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const Home = () => {
    const navigate = useNavigate();
    const { getUser, userSubscription } = useAuth();
    const user = getUser('consumer');

    const [showAllServices, setShowAllServices] = useState(false);

    const renderHeader = () => (
        <header className="px-5 pt-8 pb-4 bg-[#FFF6E9] flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black">CW</div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Clean2Wash</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[13px] font-black text-black">Indore</span>
                            <ChevronDown size={14} className="text-black/60" />
                        </div>
                    </div>
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
                    <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center overflow-hidden">
                        <User size={20} className="text-black" />
                    </button>
                </div>
            </div>
        </header>
    );

    const renderHero = () => (
        <section className="relative h-[290px] w-full bg-[#FFF6E9] overflow-hidden">
            <motion.img
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                src="/assets/carwash/6.png"
                alt="Car Wash Illustration"
                className="absolute right-[-5%] bottom-0 h-[85%] object-contain z-0"
            />

            <div className="absolute top-6 left-8 z-10 select-none">
                <h1 className="flex flex-col">
                    <span className="text-[#F29F05] text-[64px] font-black font-black leading-[0.8] tracking-tighter -skew-x-12">
                        100%
                    </span>
                    <span className="text-stroke-black text-transparent text-[58px] font-black leading-[0.8] tracking-tighter -mt-2">
                        CASHBACK
                    </span>
                </h1>
                <p className="text-black font-black text-[13px] mt-4 tracking-tight uppercase">
                    On Your First Service
                </p>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/services')}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-2xl active:bg-gray-900"
                >
                    <Car size={16} className="text-[#F29F05]" fill="currentColor" />
                    Book Now
                </motion.button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/5 to-transparent" />

            <style dangerouslySetInnerHTML={{
                __html: `
                .text-stroke-black {
                    -webkit-text-stroke: 1.5px black;
                }
            `}} />
        </section>
    );

    const [showSOS, setShowSOS] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(5);
    const [sosActive, setSosActive] = useState(false);

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

    const triggerSOS = () => {
        setShowSOS(true);
        setSosCountdown(5);
        setSosActive(false);
    };

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
                            {[
                                { title: 'Instant Wash', icon: Car, color: '#F29F05', path: '/instant-wash' },
                                { title: 'Alerts', icon: Bell, color: '#A855F7', path: '/notifications' },
                                { title: 'E-Shop', icon: ShoppingBag, color: '#10B981', path: '/e-shop' },
                                { title: 'Studio Wash', icon: HomeIcon, color: '#6366F1', path: '/full-wash-booking' },
                                { title: 'SOS', icon: AlertTriangle, color: '#EF4444', action: triggerSOS },
                                { title: 'Support', icon: Heart, color: '#EC4899', path: '/help' },
                                { title: 'Vehicle', icon: Truck, color: '#3B82F6', path: '/vehicles' },
                                { title: 'Wallet', icon: Wallet, color: '#F59E0B', path: '/wallet' }
                            ].map((item, idx) => (
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
                <section className="px-5">
                    <h3 className="text-[14px] font-black text-black opacity-40 uppercase tracking-widest mb-3">Everything In Minutes</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Instant Wash - Large Vertical Card */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate('/instant-wash')}
                            className="bg-white rounded-xl p-4 text-left flex flex-col justify-between h-[155px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)] border border-gray-100 relative overflow-hidden group"
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
                            className="bg-white rounded-xl p-4 text-left flex flex-col justify-between h-[155px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)] border border-gray-100 relative overflow-hidden group"
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

                {/* Explore Categories - Grid Icons */}
                <section className="px-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-black text-black opacity-40 uppercase tracking-widest">Explore</h3>
                        <button className="text-[11px] text-brand font-black uppercase tracking-widest flex items-center gap-1">
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { title: 'Products', image: '/assets/product-accessories/product.png', path: '/e-shop' },
                            { title: 'Insurance', icon: ShieldCheck, color: '#EF4444', path: '/insurance' },
                            { title: 'PUC', icon: Activity, color: '#F59E0B', action: () => alert('PUC Testing module active.') },
                            { title: 'SOS', icon: AlertTriangle, color: '#EF4444', action: triggerSOS },
                        ].map((item, idx) => (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => item.action ? item.action() : navigate(item.path)}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className={`w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100/50 shadow-sm overflow-hidden ${item.image ? '' : 'p-2'}`}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-contain scale-[1.5]" />
                                    ) : (
                                        <item.icon size={22} style={{ color: item.color }} strokeWidth={2.5} />
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-black/60 uppercase tracking-tight leading-tight">{item.title}</span>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Promotional Banner - FULL WIDTH */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/refer')}
                    className="bg-black relative overflow-hidden group h-[130px] shadow-2xl flex items-center px-10"
                >
                    <div className="absolute right-[-5%] top-[-20%] w-48 h-48 bg-brand/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                        <span className="text-[11px] font-black text-brand uppercase tracking-[0.3em] mb-2 block">Special Offer</span>
                        <h3 className="text-[22px] font-[1000] text-white uppercase leading-none tracking-tighter">Refer & Get<br />100% Cashback</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Limited Period Only</span>
                            <ArrowRight size={14} className="text-brand" />
                        </div>
                    </div>
                    <div className="absolute right-[-10%] bottom-[-20%] w-40 h-40 opacity-20 rotate-[15deg]">
                        <img src="/assets/carwash/6.png" className="w-full h-full object-contain" alt="" />
                    </div>
                </motion.div>
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

            {/* Monthly Shine Subscription Card - FULL WIDTH */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/subscriptions')}
                className="bg-gradient-to-br from-[#EEF2FF] to-white relative h-48 group cursor-pointer border-y border-indigo-50 shadow-inner"
            >
                <div className="absolute right-0 bottom-0 w-1/2 h-full z-0 opacity-100 group-hover:scale-105 transition-transform duration-700">
                    <img src="/assets/carwashsubscription/7.png" className="w-full h-full object-contain object-right-bottom" alt="Monthly Shine" />
                </div>

                <div className="absolute inset-0 px-10 py-8 flex flex-col justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-lg shadow-indigo-200">Best Seller</span>
                        </div>
                        <h3 className="text-[24px] font-[1000] text-indigo-950 uppercase leading-[0.85] tracking-tighter">MONTHLY<br />SHINE</h3>
                        <p className="text-indigo-900/40 text-[10px] font-bold uppercase mt-2 tracking-widest leading-none">Hassle-free elite care</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-950 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-transform">
                            View Plans
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-900/30 uppercase leading-none">From only</span>
                            <span className="text-indigo-950 font-black text-3xl tracking-tighter leading-none mt-1">₹299</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Refer & Earn Banner - FULL WIDTH */}
            <motion.div
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/refer')}
                className="bg-gradient-to-r from-orange-500 to-brand h-40 relative overflow-hidden shadow-2xl group cursor-pointer border-y border-orange-400/20 px-10 flex items-center"
            >
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="max-w-[70%]">
                        <div className="bg-white/30 backdrop-blur-md w-fit px-2 py-1 rounded-lg text-[9px] font-[1000] uppercase tracking-widest text-white mb-3 leading-none shadow-sm">Invite Rewards</div>
                        <h3 className="text-white text-[22px] font-black leading-[0.9] uppercase tracking-tighter">GIFT YOUR FRIENDS<br />₹100 REWARD</h3>
                        <p className="text-white/80 text-[10px] font-bold mt-3 uppercase tracking-widest leading-none">Share the shine & earn together</p>
                    </div>
                    <div className="bg-white text-brand px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all group-hover:bg-black group-hover:text-white">
                        Invite
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                <div className="absolute right-0 bottom-[-20px] opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-[-15deg]">
                    <Gift size={120} className="text-white" />
                </div>
            </motion.div>

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
                        {[
                            { name: 'Spare Drivers', icon: User, color: 'from-orange-500/25 to-brand/40', glow: 'shadow-orange-500/10', border: 'border-orange-500/20', desc: 'Professional Chauffeurs' },
                            { name: 'Apartments', icon: HomeIcon, color: 'from-blue-500/25 to-indigo-500/40', glow: 'shadow-blue-500/10', border: 'border-blue-500/20', desc: 'Residential slots' },
                            { name: 'Corporate', icon: Briefcase, color: 'from-emerald-500/25 to-teal-500/40', glow: 'shadow-emerald-500/10', border: 'border-emerald-500/20', desc: 'Workspace Care' }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-gradient-to-r ${item.color} backdrop-blur-xl border ${item.border} px-4 py-3 rounded-2xl flex items-center justify-between group/item transition-all duration-300 shadow-xl ${item.glow}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:bg-white/20">
                                        <item.icon size={22} className="text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-white text-[15px] font-[1000] uppercase tracking-tighter leading-none">{item.name}</h4>
                                        <span className="text-white/40 text-[8px] font-black uppercase mt-1 tracking-widest">{item.desc}</span>
                                    </div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] border border-white/20 group-hover/item:bg-white group-hover/item:text-black transition-colors duration-300">
                                    Soon
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
                    <div>
                        <p className="text-[16px] font-black text-black leading-none uppercase">1 Lac+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest">Users</p>
                    </div>
                    <div className="border-x border-black/10">
                        <p className="text-[16px] font-black text-black leading-none uppercase">5 Yrs+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest">Legacy</p>
                    </div>
                    <div>
                        <p className="text-[16px] font-black text-black leading-none uppercase">60+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest">Cities</p>
                    </div>
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
                    {renderSOSOverlay()}
                    {renderHeader()}
                    {renderHero()}

                    {/* Rapido Style Search Bar - Now between Hero and Dashboard */}
                    <div className="px-5 mb-2 -mt-8 relative z-30" onClick={() => navigate('/services')}>
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
