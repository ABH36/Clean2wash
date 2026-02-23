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

const CaptainSettings = () => {
    const navigate = useNavigate();

    const SETTINGS_GROUPS = [
        {
            title: 'Mission Configuration',
            items: [
                { icon: <Bell />, label: 'Job Alerts', sub: 'Instant wash notifications', toggle: true },
                { icon: <Globe />, label: 'Active Region', sub: 'Koramangala, Bengaluru', arrow: true },
                { icon: <Smartphone />, label: 'Device Binding', sub: 'iPhone 15 Pro Max', status: 'Secured' }
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
            <div className="pb-28">
                {/* Header */}
                <div className="bg-content px-4 pt-12 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-white italic tracking-tight uppercase">Settings</h1>
                    </div>
                </div>

                <div className="px-4 space-y-8">
                    {/* Profile Summary */}
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-brand/20">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-white font-black italic text-lg uppercase leading-none mb-1">Rahul Sharma</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-none">ID: CPT-9981-HS</p>
                        </div>
                        <button className="ml-auto w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                            <User size={18} />
                        </button>
                    </div>

                    {/* Settings Groups */}
                    {SETTINGS_GROUPS.map((group, i) => (
                        <div key={i} className="space-y-4">
                            <h4 className="px-4 text-[10px] font-black text-brand uppercase tracking-[0.2em] italic">{group.title}</h4>
                            <div className="bg-content border border-white/5 rounded-[2.5rem] overflow-hidden">
                                {group.items.map((item, j) => (
                                    <div
                                        key={j}
                                        className={`flex items-center justify-between p-5 hover:bg-white/5 transition-all ${j < group.items.length - 1 ? 'border-b border-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-brand transition-all">
                                                {React.cloneElement(item.icon, { size: 18 })}
                                            </div>
                                            <div>
                                                <p className="text-white font-black text-sm italic uppercase tracking-tight">{item.label}</p>
                                                <p className="text-white/30 text-[9px] font-bold mt-0.5">{item.sub}</p>
                                            </div>
                                        </div>

                                        {item.toggle !== undefined && (
                                            <button className={`w-10 h-5 rounded-full relative transition-all ${item.toggle ? 'bg-brand' : 'bg-white/10'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.toggle ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        )}

                                        {item.arrow && <ChevronRight size={16} className="text-white/20" />}

                                        {item.status && (
                                            <span className="text-[8px] font-black text-green-400 uppercase tracking-widest bg-green-400/10 px-2 py-1 rounded-lg italic">
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* App Info & Logout */}
                    <div className="space-y-3 pt-4">
                        <button
                            onClick={() => navigate('/captain/login')}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-red-500/10 border border-red-500/10 rounded-3xl text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                            <LogOut size={16} /> Sign Out Session
                        </button>
                        <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">Hoora Captain v2.4.1 Build 2201</p>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSettings;
