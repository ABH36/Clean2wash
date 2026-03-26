import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Phone,
    MessageSquare,
    ShieldCheck,
    MapPin,
    HelpCircle,
    ArrowUpRight,
    HeadphonesIcon
} from 'lucide-react';
import StaffLayout from '../components/StaffLayout';
import { useTheme } from '../../../context/ThemeContext';

const StaffSupport = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const SUPPORT_CHANNELS = [
        {
            icon: <Phone size={20} />,
            label: 'Emergency Line',
            sub: 'Operational accidents/theft protocol',
            action: 'Push to Call',
            color: isDarkMode ? 'text-red-400' : 'text-red-500',
            bg: isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
        },
        {
            icon: <MessageSquare size={20} />,
            label: 'Manager Direct',
            sub: 'Sync route or task discrepancies',
            action: 'Open Message Hub',
            color: 'text-brand',
            bg: 'bg-brand/5'
        },
        {
            icon: <MapPin size={20} />,
            label: 'Central Hub',
            sub: 'Sector 15, Enterprise Road',
            action: 'Route to GPS',
            color: isDarkMode ? 'text-blue-400' : 'text-blue-500',
            bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
        }
    ];

    return (
        <StaffLayout title="Assistance" subtitle="Resource Node">
            <div className="space-y-6">
                {/* Main Support Card - Compact Version */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border border-white/5' : 'bg-content'} rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-content/20 group transition-all duration-500`}>
                    <div className="relative z-10">
                        <p className="text-[8px] font-black text-brand-light uppercase tracking-[0.25em] mb-1.5">Operational Node</p>
                        <h2 className={`text-2xl font-black tracking-tighter leading-tight mb-4 uppercase ${isDarkMode ? 'text-white' : 'text-white'}`}>Support <br /> Terminal</h2>
                        <p className={`${isDarkMode ? 'text-white/30' : 'text-white/40'} text-[9px] font-bold leading-relaxed mb-6 uppercase tracking-widest max-w-[200px]`}>
                            Authorized personnel only. Encrypted channel for protocol sync.
                        </p>
                        <button className="flex items-center gap-2.5 bg-brand px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
                            <HeadphonesIcon size={14} /> Contact Command
                        </button>
                    </div>
                    <HelpCircle size={120} className={`absolute -bottom-6 -right-6 rotate-12 transition-all duration-700 group-hover:rotate-45 ${isDarkMode ? 'text-white/5' : 'text-white/5'}`} />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="space-y-3">
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Communication Channels</p>
                    {SUPPORT_CHANNELS.map((channel, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} w-full p-4 rounded-[1.8rem] border flex items-center gap-5 text-left group hover:border-brand/20 transition-all duration-500`}
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:bg-brand group-hover:text-white ${channel.bg} ${channel.color}`}>
                                {React.cloneElement(channel.icon, { size: 18 })}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-xs font-black uppercase leading-none mb-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{channel.label}</h3>
                                <p className={`text-[8px] font-bold uppercase mb-2 tracking-widest leading-none ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{channel.sub}</p>
                                <div className="flex items-center gap-1.5 text-brand">
                                    <span className="text-[8px] font-black uppercase tracking-[0.15em]">{channel.action}</span>
                                    <ArrowUpRight size={12} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className={`p-6 rounded-[1.8rem] border border-dashed text-center opacity-30 group hover:opacity-100 transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50/50 border-gray-100'}`}>
                    <ShieldCheck size={20} className={`mx-auto mb-2 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`} />
                    <p className={`text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                        Ver: 2.4.0-STF · Encrypted Node-092 <br />
                        Last Sync: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffSupport;
