import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star,
    Home as HomeIcon, Gift, User, Car, ShoppingBag,
    Shield, FileText, Search, Zap, ShieldCheck, CreditCard, Sparkles,
    Instagram, Twitter, Facebook, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const Home = () => {
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const user = getUser('consumer');

    const renderHeader = () => (
        <header className="px-6 pt-7 pb-3 flex items-center justify-between bg-[#FFF6E9]">
            <div className="flex items-center gap-2">
                <MapPin size={22} className="text-black" />
                <div className="text-left">
                    <div className="flex items-center gap-1">
                        <span className="text-[14px] font-black text-black">Other- Rajshre...</span>
                        <ChevronDown size={14} className="text-black/60" />
                    </div>
                    <p className="text-[11px] font-medium text-black/40 leading-none">Indore</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right">
                    <span className="text-[12px] font-black text-black block mb-0 leading-none uppercase">Bike</span>
                    <span className="text-[10px] font-bold text-black/40">2-Wheeler</span>
                </div>
                <div className="w-9 h-9 bg-black/5 rounded-xl flex items-center justify-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/3198/3198336.png" className="w-5.5 h-5.5 object-contain opacity-80" alt="bike" />
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
                    <span className="text-[#F29F05] text-[64px] font-black leading-[0.8] tracking-tighter italic -skew-x-12">
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

    const renderServiceGrid = () => (
        <section className="px-5 pt-0 pb-6 space-y-5 -mt-8 relative z-20">
            <div className="grid grid-cols-2 gap-4">
                {/* Wash & Care */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/wash-and-care')}
                    className="bg-orange-50/50 p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between h-[150px] relative transition-all"
                >
                    <div>
                        <h3 className="text-[13px] font-black text-black leading-tight uppercase">CAR/ BIKE<br />WASH & CARE</h3>
                        <div className="mt-2 inline-block bg-[#FFF9E5] px-2.5 py-0.5 rounded-full">
                            <span className="text-[#F29F05] text-[9px] font-black">100% Cashback!</span>
                        </div>
                    </div>
                    <img src="/assets/carwash/2.png" className="w-full h-16 object-contain mt-1" alt="wash" />
                </motion.div>

                {/* Products */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/shop')}
                    className="bg-blue-50/50 p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between h-[150px] relative transition-all"
                >
                    <div>
                        <h3 className="text-[13px] font-black text-black leading-tight uppercase">PRODUCTS &<br />ACCESSORIES</h3>
                        <div className="mt-2 inline-block bg-[#FFF9E5] px-2.5 py-0.5 rounded-full">
                            <span className="text-[#F29F05] text-[9px] font-black italic">Upto 50% Off</span>
                        </div>
                    </div>
                    <img src="/assets/carwash/1.png" className="w-full h-16 object-contain mt-1" alt="products" />
                </motion.div>
            </div>

            {/* Insurance Banner */}
            <motion.div
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/insurance')}
                className="bg-gray-50/50 p-5 rounded-2xl shadow-sm border border-gray-100 relative h-[150px] overflow-hidden"
            >
                <div className="relative z-10">
                    <h3 className="text-[14px] font-black text-black uppercase">CAR / BIKE INSURANCE</h3>
                    <p className="text-[10px] font-bold text-black/30 uppercase mt-0.5 tracking-widest">EXPLORE OUR PARTNERS</p>

                    <div className="mt-3 inline-block bg-[#FFF9E5] px-3.5 py-1 rounded-full">
                        <span className="text-[#F29F05] text-[9px] font-black uppercase">Get Reward Points</span>
                    </div>
                    <p className="text-[#B48512] font-black text-[16px] mt-1.5 italic">Upto 5000</p>
                </div>
                <img src="/assets/carinsurance/5.png" className="absolute right-[-2%] bottom-[-5%] h-[115%] object-contain" alt="insurance" />
            </motion.div>

            {/* Horizontal Quick Services - Ultra Compact */}
            <div className="relative -mx-5 px-5">
                <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar scroll-smooth">
                    {[
                        {
                            label: 'My Bookings', sub: 'Status', icon: FileText, color: 'purple', to: '/bookings',
                            bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-600',
                            cardBorder: 'border-purple-100/50'
                        },
                        {
                            label: 'My Vehicles', sub: 'Manage', icon: Car, color: 'blue', to: '/vehicles',
                            bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-600',
                            cardBorder: 'border-blue-100/50'
                        },
                        {
                            label: 'Offers', sub: 'Coupons', icon: Gift, color: 'brand', to: '/offers',
                            bg: 'bg-orange-50', border: 'border-orange-100', iconColor: 'text-orange-600',
                            cardBorder: 'border-orange-100/50'
                        },
                        {
                            label: 'Support', sub: '24/7 Assist', icon: Shield, color: 'green', to: '/help',
                            bg: 'bg-green-50', border: 'border-green-100', iconColor: 'text-green-600',
                            cardBorder: 'border-green-100/50'
                        }
                    ].map((svc, i) => (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(svc.to)}
                            className={`flex-shrink-0 w-[170px] bg-white px-4 rounded-xl shadow-sm border ${svc.cardBorder} flex items-center gap-3 h-[80px]`}
                        >
                            <div className={`w-10 h-10 ${svc.bg} ${svc.border} rounded-xl flex items-center justify-center flex-shrink-0 border`}>
                                <svc.icon size={18} className={svc.iconColor} />
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-[12px] font-black text-black uppercase truncate leading-none">{svc.label}</h3>
                                <p className="text-[9px] font-bold text-black/30 mt-1 uppercase tracking-widest leading-none truncate">{svc.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
            </div>
        </section>
    );

    const renderFooter = () => (
        <section className="px-5 pt-0 pb-8">
            <div className="flex items-center justify-center gap-4 mb-5 opacity-30">
                <div className="h-px bg-black flex-1" />
                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-black">Explore</span>
                <div className="h-px bg-black flex-1" />
            </div>

            {/* Monthly Shine Subscription Card */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/subscriptions')}
                className="bg-gradient-to-br from-[#EEF2FF] to-white rounded-2xl overflow-hidden shadow-card border border-indigo-50 relative h-44 group cursor-pointer"
            >
                <div className="absolute right-[-5%] bottom-[-10%] w-1/2 h-full z-0 opacity-80 group-hover:scale-110 transition-transform duration-700">
                    <img src="/assets/carwashsubscription/7.png" className="w-full h-full object-contain" alt="Monthly Shine" />
                </div>

                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Best Seller</span>
                            <span className="text-indigo-600/40 text-[9px] font-black uppercase tracking-widest italic">Subscription</span>
                        </div>
                        <h3 className="text-[18px] font-black text-indigo-950 uppercase leading-none tracking-tight">MONTHLY<br />SHINE</h3>
                        <p className="text-indigo-900/40 text-[9px] font-bold uppercase mt-1 tracking-widest">Hassle-free car care</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-950 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                            View Plans
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-indigo-900/30 uppercase leading-none">Starting at</span>
                            <span className="text-indigo-950 font-black text-2xl italic tracking-tighter leading-none mt-1">₹299</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Refer & Earn Banner */}
            <motion.div
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/refer')}
                className="mt-5 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-5 relative overflow-hidden shadow-lg group cursor-pointer"
            >
                <div className="relative z-10 flex items-center justify-between">
                    <div className="max-w-[65%]">
                        <div className="bg-white/20 w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white mb-2 leading-none">Invite Friends</div>
                        <h3 className="text-white text-[17px] font-black leading-tight uppercase italic">GIFT YOUR FRIENDS<br />₹100 REWARD</h3>
                        <p className="text-white/70 text-[9px] font-bold mt-2 uppercase tracking-widest leading-none">Share the shine & earn together</p>
                    </div>
                    <div className="bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                        Invite
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                <Gift className="absolute right-4 bottom-[-10px] w-24 h-24 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </motion.div>

            {/* Premium Guarantee Section */}
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-1 bg-[#F29F05] rounded-full" />
                    <h3 className="text-[13px] font-black text-black uppercase tracking-widest italic">Clean2Wash Promise</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-2.5">
                        <div className="w-8 h-8 bg-green-100/50 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-black uppercase leading-none">Eco-Friendly</h4>
                            <p className="text-[8px] font-[900] text-black/30 mt-1.5 uppercase leading-[1.2] tracking-tighter italic">95% LESS WATER THAN TRADITIONAL WASH</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-2.5">
                        <div className="w-8 h-8 bg-blue-100/50 rounded-lg flex items-center justify-center">
                            <Shield size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-black uppercase leading-none">Studio Care</h4>
                            <p className="text-[8px] font-[900] text-black/30 mt-1.5 uppercase leading-[1.2] tracking-tighter italic">CERTIFIED EQUIPMENT & PREMIUM CHEMICALS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it Works - Minimalist Steps */}
            <div className="mt-6 bg-white/40 p-5 rounded-2xl border border-black/5">
                <h3 className="text-[11px] font-black text-black uppercase tracking-widest mb-5 text-center italic opacity-60">Professional Process</h3>
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
                <h2 className="text-[20px] font-black text-black/40 tracking-tighter uppercase italic leading-[0.9] mb-8">
                    India's #1<br />Car & Bike Care App
                </h2>

                <div className="grid grid-cols-3 gap-4 border-b border-black/5 pb-8 mb-8">
                    <div>
                        <p className="text-[16px] font-black text-black leading-none uppercase">1 Lac+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest italic">Users</p>
                    </div>
                    <div className="border-x border-black/10">
                        <p className="text-[16px] font-black text-black leading-none uppercase">5 Yrs+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest italic">Legacy</p>
                    </div>
                    <div>
                        <p className="text-[16px] font-black text-black leading-none uppercase">60+</p>
                        <p className="text-[8px] font-black text-black/50 uppercase mt-2 tracking-widest italic">Cities</p>
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

                <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.3em] font-outfit italic">Designed in India 🇮🇳</p>
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
                        <span className="text-[9px] font-black text-black uppercase tracking-tighter italic">MADE WITH</span>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-black uppercase tracking-tighter italic">IN INDIA</span>
                    </div>
                </div>
            </footer>

            {/* Tight Spacing for Floating UI */}

            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250]">
                <div className="bg-[#FFCC00] text-black px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl border-2 border-white">
                    Free Dashcam
                </div>
            </div>
        </section>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-[#F8F9FB] min-h-screen">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                    .font-outfit { font-family: 'Outfit', sans-serif; }
                    .shadow-card { box-shadow: 0 15px 40px -15px rgba(0,0,0,0.06); }
                    .text-stroke-black { -webkit-text-stroke: 1.5px black; }
                `}} />
                <div className="font-outfit">
                    {renderHeader()}
                    {renderHero()}
                    <div className="px-1 space-y-0">
                        {renderServiceGrid()}
                        {renderFooter()}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Home;
