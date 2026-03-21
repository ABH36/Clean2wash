import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Bell,
    Shield,
    Smartphone,
    Globe,
    Moon,
    Lock,
    ChevronRight,
    User,
    LogOut,
    Eye,
    ArrowLeft
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const CaptainSettings = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { sessions } = useAuth();
    const { captainLogout } = useCaptain();
    const user = sessions.captain || { name: 'Captain', id: '---' };

    const SETTINGS_GROUPS = [
        {
            title: 'Mission Configuration',
            items: [
                { icon: <Bell />, label: 'Job Alerts', sub: 'Instant wash notifications', toggle: true },
                { icon: <Globe />, label: 'Active Region', sub: user.profile?.city || user.city || 'Setting City...', arrow: true },
                { icon: <Smartphone />, label: 'Device Binding', sub: 'Secured Device', status: 'Secured' }
            ]
        },
        {
            title: 'Security & Privacy',
            items: [
                { icon: <Lock />, label: 'Passcode Unlock', sub: 'Reset your safety PIN', arrow: true },
                { icon: <Shield />, label: 'Background Tracking', sub: 'Essential for safety', toggle: true },
                { icon: <Eye />, label: 'Stealth Mode', sub: 'Hide last seen hub status', toggle: false }
            ]
        }
    ];

    return (
        <CaptainLayout>
            <div className={`pb-28 transition-colors duration-500`}>
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} px-4 pt-12 pb-6 sticky top-0 z-40 transition-colors border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white border border-gray-100 shadow-sm text-content'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={`text-xl font-black italic tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Settings</h1>
                    </div>
                </div>

                <div className="px-4 space-y-8 mt-6">
                    {/* Profile Summary */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-gray-100 shadow-soft'} border rounded-[2.5rem] p-6 flex items-center gap-4 transition-all hover:border-brand/30`}>
                        <div className={`w-16 h-16 rounded-3xl overflow-hidden border-2 transition-colors flex items-center justify-center bg-brand/5 ${isDarkMode ? 'border-brand/20' : 'border-brand/10 shadow-sm'}`}>
                            {user.profile?.avatar || user.photo ? (
                                <img src={user.profile?.avatar || user.photo} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} className="text-brand/30" />
                            )}
                        </div>
                        <div>
                            <h3 className={`font-black italic text-lg uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{user.name}</h3>
                            <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[10px] font-black uppercase tracking-widest leading-none`}>ID: {user.id || user._id}</p>
                        </div>
                        <button onClick={() => navigate('/captain/profile')} className="ml-auto w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 hover:brightness-110 active:scale-95 transition-all">
                            <User size={18} />
                        </button>
                    </div>

                    {/* Settings Groups */}
                    {SETTINGS_GROUPS.map((group, i) => (
                        <div key={i} className="space-y-4">
                            <h4 className="px-4 text-[10px] font-black text-brand uppercase tracking-[0.2em] italic">{group.title}</h4>
                            <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} border rounded-[2.5rem] overflow-hidden transition-all shadow-2xl shadow-black/5`}>
                                {group.items.map((item, j) => (
                                    <div
                                        key={j}
                                        className={`flex items-center justify-between p-5 transition-all cursor-pointer ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                            } ${j < group.items.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-hover:text-brand' : 'bg-gray-50 text-content-subtle group-hover:text-brand'}`}>
                                                {React.cloneElement(item.icon, { size: 18 })}
                                            </div>
                                            <div>
                                                <p className={`font-black text-sm italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.label}</p>
                                                <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[9px] font-bold mt-0.5`}>{item.sub}</p>
                                            </div>
                                        </div>

                                        {item.toggle !== undefined && (
                                            <button className={`w-10 h-5 rounded-full relative transition-all ${item.toggle ? 'bg-brand shadow-lg shadow-brand/20' : 'bg-gray-200'} ${isDarkMode && !item.toggle ? 'bg-white/10' : ''}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.toggle ? 'right-1 shadow-sm' : 'left-1'}`} />
                                            </button>
                                        )}

                                        {item.arrow && <ChevronRight size={16} className={isDarkMode ? 'text-white/20' : 'text-gray-300'} />}

                                        {item.status && (
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg italic ${isDarkMode ? 'bg-green-400/10 text-green-400' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* App Info & Logout */}
                    <div className="space-y-4 pt-4">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await captainLogout();
                                navigate('/captain/login');
                            }}
                            className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] italic border transition-all ${isDarkMode
                                ? 'bg-red-500/10 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-2xl shadow-red-500/10'
                                : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-600 hover:text-white shadow-soft shadow-red-500/5'
                                }`}
                        >
                            <LogOut size={16} strokeWidth={2.5} /> Sign Out Session
                        </motion.button>
                        <p className={`text-center text-[9px] font-black uppercase tracking-[0.3em] italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>CarWash Captain v2.4.1 Build 2201</p>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSettings;
