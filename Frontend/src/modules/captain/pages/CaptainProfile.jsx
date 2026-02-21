import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Star, TrendingUp, Settings, LogOut, ChevronRight,
    Shield, Award, Wallet, History, MessageCircle, Phone,
    Camera, MapPin, CheckCircle2
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const STATS = [
    { label: 'Rating', val: '4.9', icon: Star, color: 'text-yellow-400' },
    { label: 'Jobs', val: '2,540', icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Level', val: 'Elite', icon: Award, color: 'text-brand' },
];

const CaptainProfile = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(true);

    const menuItems = [
        {
            group: 'Manage', items: [
                { icon: Wallet, label: 'Earnings & Payouts', sub: '₹14,200 this week', route: '/captain/earnings' },
                { icon: History, label: 'Work History', sub: 'View past washes', route: '/captain/history' },
                { icon: Shield, label: 'Safety & Insurance', sub: 'You are currently covered', route: '/captain/safety' },
            ]
        },
        {
            group: 'Account', items: [
                { icon: Settings, label: 'Settings', sub: 'Preferences & Security', route: '/captain/settings' },
                { icon: MessageCircle, label: 'Help & Support', sub: 'Chat with us 24/7', route: '/captain/support' },
                { icon: LogOut, label: 'Logout', sub: 'End session', route: '/login', danger: true },
            ]
        }
    ];

    return (
        <CaptainLayout>
            <div className="pb-28">
                {/* ── Header / Hero ── */}
                <div className="bg-content px-4 pt-12 pb-8 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl shadow-black/50">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-content">
                                <Camera size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        <h2 className="text-white text-2xl font-black tracking-tight">Rahul Sharma</h2>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                            <MapPin size={12} className="text-brand" />
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Koramangala, Bengaluru</span>
                        </div>

                        <div className="mt-6 flex gap-3 w-full max-w-xs">
                            {STATS.map(s => (
                                <div key={s.label} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-3 px-1 text-center backdrop-blur-sm">
                                    <div className="flex items-center justify-center mb-1">
                                        <s.icon size={12} className={s.color} fill={s.label === 'Rating' ? 'currentColor' : 'none'} />
                                    </div>
                                    <p className="text-white font-black text-sm leading-none">{s.val}</p>
                                    <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand/10 blur-[80px] rounded-full" />
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full" />
                </div>

                {/* ── Profile Completion ── */}
                <div className="px-4 -mt-4 relative z-20">
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 border border-green-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp size={18} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm tracking-tight leading-none mb-1">Performance High</p>
                                <p className="text-white/40 text-[9px] font-bold">Top 1% of Captains this week</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-white/30" strokeWidth={2.5} />
                    </div>
                </div>

                {/* ── Menu Groups ── */}
                <div className="px-4 mt-6 space-y-6">
                    {menuItems.map(group => (
                        <div key={group.group}>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-2 mb-3">{group.group}</p>
                            <div className="bg-content rounded-2xl border border-white/5 overflow-hidden">
                                {group.items.map((item, i) => (
                                    <motion.button
                                        key={item.label}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(item.route)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/5 ${i < group.items.length - 1 ? 'border-b border-white/5' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.danger ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/60'}`}>
                                            <item.icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={`font-black text-sm tracking-tight leading-none ${item.danger ? 'text-red-500' : 'text-white'}`}>{item.label}</p>
                                            <p className="text-white/30 text-[9px] font-bold mt-1 truncate">{item.sub}</p>
                                        </div>
                                        <ChevronRight size={14} strokeWidth={3} className={item.danger ? 'text-red-500/30' : 'text-white/20'} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Info Bar ── */}
                <div className="px-4 mt-8">
                    <div className="bg-content border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Version 2.4.1 (Stable)</p>
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            Encrypted Session
                        </p>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainProfile;
