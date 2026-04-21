import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Shield, Star, Check, Zap, Crown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import MobileLayout from '../components/layout/MobileLayout';

const MonthlySpareDriver = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const plans = [
        { id: 'silver', title: 'Silver pass', price: '₹4,999', washes: '10 sessions', tag: 'Best for work', color: '#94A3B8' },
        { id: 'gold', title: 'Gold pass', price: '₹8,999', washes: '22 sessions', tag: 'Most popular', color: '#F29F05' },
        { id: 'plat', title: 'Platinum pass', price: '₹14,999', washes: 'Unlimited', tag: 'Elite VIP', color: '#6366F1' }
    ];

    return (
        <MobileLayout>
            <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-5 pt-12 pb-4 flex items-center gap-4 border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-black/05'}`}>
                    <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/[0.02] text-white' : 'bg-black/[0.05] text-black'}`}>
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className={`text-xl font-black tracking-tight uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Monthly chauffeur</h1>
                </header>

                <div className="p-5 space-y-6">
                    <div className="bg-black rounded-[2.5rem] p-8 relative overflow-hidden text-center flex flex-col items-center">
                        <div className="absolute top-[-20%] left-[-20%] w-60 h-60 bg-brand/30 rounded-full blur-[80px]" />
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-black/50 relative z-10">
                            <Crown size={32} fill="currentColor" />
                        </div>
                        <h2 className="text-[28px] font-[1000] text-white uppercase tracking-tighter leading-none mb-3 relative z-10">Elite subscription</h2>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] max-w-[200px] relative z-10">Dedicated professional drivers for your daily commute</p>
                    </div>

                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <motion.div
                                key={plan.id}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white/5 border border-white/5 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="text-[9px] font-black uppercase bg-white/[0.02] px-2 py-1 rounded text-white/40">{plan.tag}</span>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border-white/5" style={{ borderColor: plan.color, color: plan.color }}>
                                        <User size={24} fill="currentColor" strokeWidth={0} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-white uppercase tracking-tight leading-none mb-1">{plan.title}</h3>
                                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none">{plan.washes}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[20px] font-black text-white tracking-tighter leading-none">{plan.price}</p>
                                    <p className="text-[8px] font-black text-brand uppercase mt-1">/ month</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-emerald-500" fill="currentColor" />
                            <h4 className="text-[14px] font-black text-white uppercase tracking-tight">Member benefits</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                'Same driver guaranteed everyday',
                                'Zero cancellation fee',
                                'Priority SOS & Support',
                                'Holiday travel discounts'
                            ].map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Check size={14} className="text-emerald-500" strokeWidth={4} />
                                    <span className="text-[11px] font-black text-white/60 uppercase">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default MonthlySpareDriver;
