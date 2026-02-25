import React from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, ChevronDown, ChevronRight, Car,
    Zap, Shield, Clock, CheckCircle2, Sparkles, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';

const WashAndCare = () => {
    const navigate = useNavigate();

    const renderHeader = () => (
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F29F05] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <MapPin size={20} className="text-white" />
                </div>
                <div className="text-left">
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] font-black text-black uppercase tracking-tight">Rajshree Apollo</span>
                        <ChevronDown size={14} className="text-[#F29F05]" />
                    </div>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">Indore</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <div className="text-right">
                    <span className="text-[11px] font-black text-black leading-none uppercase">Baleno</span>
                    <p className="text-[8px] font-bold text-black/40 uppercase mt-1">Maruti Suzuki</p>
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Car size={18} className="text-black" />
                </div>
            </div>
        </header>
    );

    const renderHero = () => (
        <section className="px-5 py-6">
            <div className="bg-[#FFF6E9] rounded-2xl overflow-hidden relative h-[320px] shadow-2xl shadow-orange-100/50 group">
                {/* Visual Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl -mr-10 -mt-10" />

                <div className="absolute top-10 left-8 z-20 max-w-[70%]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-[18px] font-black text-black leading-none uppercase italic tracking-tighter opacity-40 mb-1">
                            Premium Clean
                        </h2>
                        <h1 className="text-[36px] font-black text-black leading-[0.85] uppercase italic tracking-tighter">
                            DOORSTEP<br />
                            <span className="text-[#F29F05] text-[42px] text-stroke-black">WASHING</span>
                        </h1>
                    </motion.div>
                </div>

                {/* Savings Badge - Floating */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="absolute top-8 right-8 z-30 w-20 h-20 bg-white rounded-full p-1 shadow-2xl border-4 border-[#F29F05]/10 flex flex-col items-center justify-center rotate-12"
                >
                    <div className="bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full mb-1 uppercase tracking-widest">ECO SAVE</div>
                    <span className="text-[18px] font-black text-black leading-none italic">75%</span>
                    <span className="text-[8px] font-black text-black/40 uppercase leading-none mt-1 font-outfit">Less Water</span>
                </motion.div>

                {/* Main Illustration */}
                <motion.img
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    src="/assets/carcleaning/3.png"
                    className="absolute bottom-[-2%] right-[-15%] h-[65%] object-contain z-10 drop-shadow-[0_20px_30px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-700"
                    alt="Wash Illustration"
                />

                {/* FEATURE TAGS - Moved to extreme left to clear car overlap */}
                <div className="absolute left-3 top-[140px] flex flex-col gap-1.5 z-20">
                    {[
                        { label: 'Pressure Foam', icon: Zap },
                        { label: 'Deep Interior', icon: Shield },
                        { label: 'Ceramic Shine', icon: Sparkles }
                    ].map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md text-black px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md border border-white w-fit"
                        >
                            <feat.icon size={11} className="text-[#F29F05]" />
                            {feat.label}
                        </motion.div>
                    ))}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .text-stroke-black {
                        -webkit-text-stroke: 1.5px black;
                        color: transparent;
                    }
                `}} />
            </div>
        </section>
    );

    const renderServiceGrid = () => (
        <section className="px-5 space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-5">
                {/* Car Wash & Care */}
                <motion.div
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/services')}
                    className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 h-[195px] flex flex-col justify-between group overflow-hidden relative"
                >
                    <div className="z-10">
                        <div className="bg-orange-50 w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-[#F29F05] group-hover:bg-[#F29F05] group-hover:text-white transition-all duration-300">
                            <Car size={18} />
                        </div>
                        <h3 className="text-[13px] font-[900] text-black uppercase leading-tight tracking-tight">
                            PREMIUM<br />WASH & CARE
                        </h3>
                    </div>
                    <div className="relative h-20 w-full mt-auto flex items-end">
                        <img src="/assets/carwash/2.png" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out z-10 relative" alt="car wash" />
                    </div>

                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-50 rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                {/* Monthly Subscription */}
                <motion.div
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/subscriptions')}
                    className="bg-black p-5 rounded-2xl shadow-xl h-[195px] flex flex-col justify-between group relative overflow-hidden"
                >
                    <div className="z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-[#F29F05] w-9 h-9 rounded-xl flex items-center justify-center text-black">
                                <Clock size={18} />
                            </div>
                            <span className="bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest leading-none">Save 50%</span>
                        </div>
                        <h3 className="text-[13px] font-[900] text-white uppercase leading-tight tracking-tight">
                            MONTHLY<br />SHINE PLAN
                        </h3>
                    </div>
                    <div className="relative h-20 w-full mt-auto flex items-end">
                        <img src="/assets/carcleaning/4.png" className="w-full h-full object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ease-out" alt="subscription" />
                    </div>

                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F29F05]/10 rounded-full blur-3xl shadow-2xl" />
                </motion.div>
            </div>

            {/* Bike Wash - Elegant Section */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/services')}
                className="bg-white p-7 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-between h-[130px] group overflow-hidden relative"
            >
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#F29F05] animate-ping" />
                        <span className="text-[10px] font-black text-[#F29F05] uppercase tracking-[0.2em] italic">Instant Connect</span>
                    </div>
                    <h3 className="text-[20px] font-[900] text-black uppercase leading-none tracking-tight">BIKE WASH & CARE</h3>
                    <p className="text-[10px] font-black text-black/20 mt-2 uppercase tracking-widest">Prices starting at ₹149 only</p>
                </div>
                <div className="w-32 h-full z-10">
                    <img src="/assets/carwash/1.png" className="w-full h-full object-contain group-hover:rotate-6 transition-transform duration-500" alt="bike wash" />
                </div>

                {/* Background Text */}
                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[120px] font-black italic opacity-[0.03] select-none pointer-events-none">BIKE</span>
            </motion.div>
        </section>
    );

    const renderHooraAdvantage = () => (
        <div className="px-5 mt-12 mb-8">
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-950 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                {/* Accent Decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F29F05]/10 to-transparent" />

                <div className="relative z-10 text-center mb-10">
                    <div className="inline-block bg-[#F29F05] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.3em] mb-4">The Advantage</div>
                    <h3 className="text-white text-[24px] font-black uppercase italic tracking-tighter leading-none">HOORA VS. LOCAL</h3>
                </div>

                <div className="grid grid-cols-3 gap-6 relative z-10 border-b border-white/5 pb-10">
                    <div className="text-center group">
                        <div className="w-12 h-12 bg-[#F29F05] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                            <Zap size={20} className="text-black" />
                        </div>
                        <p className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest">High Tech<br />Solutions</p>
                    </div>

                    <div className="flex flex-center items-center justify-center text-white/10 font-black italic text-4xl">/</div>

                    <div className="text-center group opacity-40">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Clock size={20} className="text-white" />
                        </div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Slow<br />Service</p>
                    </div>
                </div>

                <div className="mt-10 space-y-4 relative z-10">
                    {[
                        { label: '95% Water Saving Tech', icon: ShieldCheck },
                        { label: 'Certified Pro Captains', icon: ShieldCheck },
                        { label: 'Premium Quality Foam', icon: ShieldCheck }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/5 py-4 px-6 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                            <item.icon size={18} className="text-[#F29F05]" />
                            <span className="text-white/80 text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Bottom Trigger */}
                <button
                    onClick={() => navigate('/services')}
                    className="mt-8 w-full bg-[#F29F05] text-black py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                    Compare Detailed Features
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-[#F8F9FB] min-h-screen font-outfit">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                    .font-outfit { font-family: 'Outfit', sans-serif; }
                    .shadow-card { box-shadow: 0 15px 40px -15px rgba(0,0,0,0.06); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />

                {renderHeader()}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {renderHero()}
                    {renderServiceGrid()}
                    {renderHooraAdvantage()}

                    {/* Bottom Padding */}
                    <div className="h-32" />
                </div>
            </div>
        </MobileLayout>
    );
};

export default WashAndCare;
