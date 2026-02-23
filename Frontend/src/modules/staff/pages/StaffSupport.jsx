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

const StaffSupport = () => {
    const navigate = useNavigate();

    const SUPPORT_CHANNELS = [
        {
            icon: <Phone size={20} />,
            label: 'Emergency Line',
            sub: 'Operational accidents/theft protocol',
            action: 'Push to Call',
            color: 'text-red-500',
            bg: 'bg-red-50'
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
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        }
    ];

    return (
        <StaffLayout title="Assistance" subtitle="Resource Node">
            <div className="space-y-8">
                <div className="bg-content rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-content/30 group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2 italic">CarWash Partners</p>
                        <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-6 uppercase">Secure <br /> Support Terminal</h2>
                        <p className="text-white/40 text-[10px] font-bold leading-relaxed mb-8 uppercase tracking-widest">
                            Authorized personnel only. All communications via this node are encrypted and logged for quality protocol.
                        </p>
                        <button className="flex items-center gap-3 bg-brand px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 transition-all">
                            <HeadphonesIcon size={16} /> Contact Command
                        </button>
                    </div>
                    <HelpCircle size={160} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 transition-transform duration-700 group-hover:rotate-45" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl" />
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] px-4 italic">Available Channels</p>
                    {SUPPORT_CHANNELS.map((channel, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft flex items-center gap-6 text-left group hover:border-brand/20 transition-all duration-500"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-brand group-hover:text-white ${channel.bg} ${channel.color}`}>
                                {channel.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-content italic uppercase leading-none mb-1.5 tracking-tight">{channel.label}</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase mb-3 tracking-widest leading-none">{channel.sub}</p>
                                <div className="flex items-center gap-2 text-brand">
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">{channel.action}</span>
                                    <ArrowUpRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 border-dashed text-center opacity-40 group hover:opacity-100 transition-opacity">
                    <ShieldCheck size={28} className="text-content-subtle mx-auto mb-4" />
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] leading-[2]">
                        Operational Ver: 2.4.0-STF <br />
                        Connection: Node-092 (Encrypted) <br />
                        System Time: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffSupport;
