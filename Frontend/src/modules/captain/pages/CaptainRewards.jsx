import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Award,
    Star,
    Zap,
    TrendingUp,
    ChevronRight,
    ArrowLeft,
    Shield,
    CheckCircle2,
    Gift
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

import { useTheme } from '../../../context/ThemeContext';

const CaptainRewards = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const LEVELS = [
        { name: 'Rookie', range: '0 - 100 Washes', color: isDarkMode ? 'text-gray-400' : 'text-gray-500', bg: 'bg-gray-400/10', completed: true },
        { name: 'Pro', range: '101 - 500 Washes', color: 'text-blue-400', bg: 'bg-blue-400/10', completed: true },
        { name: 'Elite', range: 'text-brand', bg: 'bg-brand/10', current: true },
        { name: 'Legend', range: '2000+ Washes', color: 'text-yellow-400', bg: 'bg-yellow-400/10', locked: true },
    ];

    return (
        <CaptainLayout>
            <div className="pb-28 transition-colors duration-500">
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} px-4 pt-12 pb-6 sticky top-0 z-40 transition-colors border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white border border-gray-100 shadow-sm text-content'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={`text-xl font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Rewards & Levels</h1>
                    </div>
                </div>

                <div className="px-4 space-y-6 mt-6">
                    {/* Current Progress Hero */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-gray-100 shadow-soft'} border rounded-[2.5rem] p-8 relative overflow-hidden transition-all`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-brand/20 rounded-2xl text-brand shadow-lg">
                                    <Award size={28} />
                                </div>
                                <h2 className={`text-2xl font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>Elite Level</h2>
                            </div>

                            <div className="space-y-2 mb-8">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className={isDarkMode ? 'text-white/40' : 'text-content-subtle'}>Progress to Legend</span>
                                    <span className="text-brand">85%</span>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '85%' }}
                                        className="h-full bg-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.5)]"
                                    />
                                </div>
                                <p className={`text-[9px] font-bold text-right uppercase tracking-tighter ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>420 washes to go</p>
                            </div>

                            <button className="w-full py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/30 hover:brightness-110 active:scale-[0.98] transition-all">
                                Claim Weekly Bonus
                            </button>
                        </div>
                        <Star size={120} className={`absolute -bottom-10 -right-10 -rotate-12 transition-colors ${isDarkMode ? 'text-white/5' : 'text-gray-50'}`} />
                    </div>

                    {/* Level Roadmap */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-brand uppercase tracking-[0.2em]">Level Roadmap</p>
                        <div className="space-y-3">
                            {LEVELS.map((L, i) => (
                                <div key={i} className={`p-5 rounded-3xl border transition-all ${L.current
                                    ? (isDarkMode ? 'bg-brand/5 border-brand' : 'bg-brand/5 border-brand ring-1 ring-brand/20 shadow-sm')
                                    : (isDarkMode ? 'bg-[#1E293B]/50 border-white/5' : 'bg-white border-gray-100 shadow-soft')
                                    } flex items-center gap-4`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${L.bg} ${L.color}`}>
                                        <Award size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-black uppercase tracking-tight ${L.current ? 'text-brand' : (isDarkMode ? (L.color || 'text-white') : 'text-content')}`}>{L.name}</h4>
                                            {L.current && <span className="bg-brand text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Current</span>}
                                        </div>
                                        <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[9px] font-bold mt-0.5`}>{L.range}</p>
                                    </div>
                                    {L.completed ? (
                                        <CheckCircle2 size={20} className="text-green-500" />
                                    ) : L.locked ? (
                                        <Shield size={20} className={isDarkMode ? 'text-white/10' : 'text-gray-200'} />
                                    ) : (
                                        <TrendingUp size={20} className="text-brand" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Perks */}
                    <div className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-soft'} border rounded-[2.5rem] p-8 transition-all`}>
                        <h4 className={`font-black uppercase tracking-tight text-lg mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                            <Zap size={18} className="text-brand" />
                            Elite Perks
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: <TrendingUp />, label: '+10% Payout', sub: 'Per mission' },
                                { icon: <Gift />, label: 'Priority Jobs', sub: 'Elite exclusive' },
                                { icon: <Shield />, label: 'Zero Penalty', sub: '1 cancel/month' },
                                { icon: <Star />, label: 'Badges', sub: 'VIP status' },
                            ].map((p, i) => (
                                <div key={i} className={`${isDarkMode ? 'bg-[#0F172A]/50 border-white/5' : 'bg-gray-50 border-gray-100'} p-4 rounded-2xl border transition-all hover:border-brand/30`}>
                                    <div className="text-brand mb-2">{React.cloneElement(p.icon, { size: 16 })}</div>
                                    <p className={`font-black text-[10px] uppercase leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{p.label}</p>
                                    <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[8px] font-bold mt-1`}>{p.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainRewards;
