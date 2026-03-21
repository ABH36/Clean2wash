import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Star, TrendingUp, Settings, LogOut, ChevronRight,
    Shield, Award, Wallet, History, MessageCircle, Phone,
    Camera, MapPin, CheckCircle2
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const CaptainProfile = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { sessions } = useAuth();
    const { captainJobs, captainEarnings, captainLogout } = useCaptain();
    const user = sessions.captain || { name: 'Captain User', id: 'CPT-DEFAULT' };

    const myJobs = captainJobs.filter(job => job.status === 'completed');
    const totalEarned = captainEarnings.totalEarned || 0;

    const DYNAMIC_STATS = [
        { label: 'Rating', val: (captainEarnings.rating || user.rating || 5.0).toFixed(1), icon: Star, color: 'text-yellow-400' },
        { label: 'Jobs', val: myJobs.length, icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Revenue', val: `₹${totalEarned.toLocaleString()}`, icon: Wallet, color: 'text-brand' }
    ];

    const menuItems = [
        {
            group: 'Account',
            items: [
                { label: 'Personal Information', sub: user.isVerified ? '✅ Identity Verified' : '⚠️ Verification Pending', icon: User, route: '/captain/profile/personal' },
                { label: 'Wallet & Payouts', sub: `Current Balance: ₹${(captainEarnings.balance || 0).toLocaleString()}`, icon: Wallet, route: '/captain/earnings' },
                { label: 'Portfolio', sub: 'Showcase your best washes', icon: Camera, route: '/captain/portfolio' },
                { label: 'History', sub: 'Your past washes', icon: History, route: '/captain/history' },
            ]
        },
        {
            group: 'Preferences',
            items: [
                { label: 'Settings', sub: 'Privacy, Notifications', icon: Settings, route: '/captain/settings' },
                { label: 'Support', sub: 'Help center, Contact us', icon: MessageCircle, route: '/captain/support' },
            ]
        },
        {
            group: 'Danger Zone',
            items: [
                {
                    label: 'Logout',
                    sub: 'Exit your current session',
                    icon: LogOut,
                    danger: true,
                    onClick: async () => {
                        await captainLogout();
                        navigate('/captain/login');
                    }
                }
            ]
        }
    ];

    return (
        <CaptainLayout>
            <div className="pb-28 transition-colors duration-500">
                {/* ── Header / Hero ── */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} px-4 pt-12 pb-8 relative overflow-hidden transition-colors duration-500`}>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className={`w-24 h-24 rounded-3xl overflow-hidden border-4 shadow-2xl transition-all ${isDarkMode ? 'border-white/10 shadow-black/50' : 'border-white shadow-soft'}`}>
                                <img src={user.profile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"} alt="Profile" className="w-full h-full object-cover" />
                                {user.isVerified && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-lg z-10">
                                        <CheckCircle2 size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <button className={`absolute -bottom-2 -right-2 w-9 h-9 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg border-2 transition-colors ${isDarkMode ? 'border-[#0F172A]' : 'border-gray-50'}`}>
                                <Camera size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{user.name}</h2>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                            <MapPin size={12} className="text-brand" />
                            <span className={`${isDarkMode ? 'text-white' : 'text-content-subtle'} text-[10px] font-black uppercase tracking-[0.2em]`}>{user.profile?.city || 'Bengaluru'} | ID: {user.id || user._id}</span>
                        </div>

                        <div className="mt-6 flex gap-3 w-full max-w-xs">
                            {DYNAMIC_STATS.map(s => (
                                <div key={s.label} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'} flex-1 border rounded-2xl py-3 px-1 text-center backdrop-blur-sm transition-all`}>
                                    <div className="flex items-center justify-center mb-1">
                                        <s.icon size={12} className={s.color} fill={s.label === 'Rating' ? 'currentColor' : 'none'} />
                                    </div>
                                    <p className={`font-black text-sm leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{s.val}</p>
                                    <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[8px] font-black uppercase tracking-widest mt-1`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] transition-colors ${isDarkMode ? 'bg-brand/15' : 'bg-brand/10'}`} />
                    <div className={`absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-[80px] transition-colors ${isDarkMode ? 'bg-indigo-500/15' : 'bg-blue-500/10'}`} />
                </div>

                {/* ── Performance tracker ── */}
                <div className="px-4 -mt-4 relative z-20">
                    <div className={`${isDarkMode ? 'bg-[#1E293B]/80 border-white/10' : 'bg-white/90 border-gray-100 shadow-xl shadow-gray-200/50'} backdrop-blur-xl p-4 rounded-2xl border flex items-center justify-between transition-all duration-500`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                                <TrendingUp size={18} className="text-green-500" />
                            </div>
                            <div>
                                <p className={`font-black text-sm tracking-tight leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>Performance High</p>
                                <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[9px] font-bold`}>Top 1% of Captains this week</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className={isDarkMode ? 'text-white/30' : 'text-content-subtle'} strokeWidth={2.5} />
                    </div>
                </div>

                {/* ── Menu Groups ── */}
                <div className="px-4 mt-6 space-y-6">
                    {menuItems.map(group => (
                        <div key={group.group}>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 mb-3 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{group.group}</p>
                            <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-2xl border overflow-hidden transition-all duration-500`}>
                                {group.items.map((item, i, arr) => (
                                    <motion.button
                                        key={item.label}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => item.onClick ? item.onClick() : navigate(item.route)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${i < arr.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${item.danger
                                            ? 'bg-red-500/10 text-red-500'
                                            : isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-content-subtle'}`}>
                                            <item.icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={`font-black text-sm tracking-tight leading-none ${item.danger ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-content'}`}>{item.label}</p>
                                            <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[9px] font-bold mt-1.5 truncate`}>{item.sub}</p>
                                        </div>
                                        <ChevronRight size={14} strokeWidth={3} className={item.danger ? 'text-red-500/30' : isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Help / Version Bar ── */}
                <div className="px-4 mt-8">
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-gray-100/30 border-gray-100'} border rounded-2xl px-4 py-3 flex items-center justify-between transition-colors`}>
                        <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest`}>Version 2.4.1 (Stable)</p>
                        <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                            Encrypted Session
                        </p>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainProfile;
