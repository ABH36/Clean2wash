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

const CaptainRewards = () => {
    const navigate = useNavigate();

    const LEVELS = [
        { name: 'Rookie', range: '0 - 100 Washes', color: 'text-gray-400', bg: 'bg-gray-400/10', completed: true },
        { name: 'Pro', range: '101 - 500 Washes', color: 'text-blue-400', bg: 'bg-blue-400/10', completed: true },
        { name: 'Elite', range: '501 - 2000 Washes', color: 'text-brand', bg: 'bg-brand/10', current: true },
        { name: 'Legend', range: '2000+ Washes', color: 'text-yellow-400', bg: 'bg-yellow-400/10', locked: true },
    ];

    return (
        <CaptainLayout>
            <div className="pb-28">
                {/* Header */}
                <div className="bg-content px-4 pt-12 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-white italic tracking-tight uppercase">Rewards & Levels</h1>
                    </div>
                </div>

                <div className="px-4 space-y-6">
                    {/* Current Progress Hero */}
                    <div className="bg-content border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-brand/20 rounded-2xl text-brand shadow-lg">
                                    <Award size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Elite Level</h2>
                            </div>

                            <div className="space-y-2 mb-8">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                                    <span className="text-white/40">Progress to Legend</span>
                                    <span className="text-brand">85%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '85%' }}
                                        className="h-full bg-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.5)]"
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-white/30 text-right italic uppercase tracking-tighter">420 washes to go</p>
                            </div>

                            <button className="w-full py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/30">
                                Claim Weekly Bonus
                            </button>
                        </div>
                        <Star size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12" />
                    </div>

                    {/* Level Roadmap */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-brand uppercase tracking-[0.2em] italic">Level Roadmap</p>
                        <div className="space-y-3">
                            {LEVELS.map((L, i) => (
                                <div key={i} className={`p-5 rounded-3xl border ${L.current ? 'bg-brand/5 border-brand' : 'bg-content border-white/5'
                                    } flex items-center gap-4`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${L.bg} ${L.color} shrink-0`}>
                                        <Award size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-black italic uppercase tracking-tight ${L.color}`}>{L.name}</h4>
                                            {L.current && <span className="bg-brand text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Current</span>}
                                        </div>
                                        <p className="text-white/30 text-[9px] font-bold mt-0.5">{L.range}</p>
                                    </div>
                                    {L.completed ? (
                                        <CheckCircle2 size={20} className="text-green-500" />
                                    ) : L.locked ? (
                                        <Shield size={20} className="text-white/10" />
                                    ) : (
                                        <TrendingUp size={20} className="text-brand" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Perks */}
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
                        <h4 className="text-white font-black italic uppercase tracking-tight text-lg mb-6 flex items-center gap-2">
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
                                <div key={i} className="bg-content/50 p-4 rounded-2xl border border-white/5">
                                    <div className="text-brand mb-2">{React.cloneElement(p.icon, { size: 16 })}</div>
                                    <p className="text-white font-black text-[10px] uppercase italic leading-none">{p.label}</p>
                                    <p className="text-white/30 text-[8px] font-bold mt-1">{p.sub}</p>
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
