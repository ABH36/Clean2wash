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

const StaffSupport = () => {
    const navigate = useNavigate();

    const SUPPORT_CHANNELS = [
        {
            icon: <Phone size={20} />,
            label: 'Emergency Line',
            sub: 'Available 24/7 for accidents/theft',
            action: 'Call +91 80 6910 0000',
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            icon: <MessageSquare size={20} />,
            label: 'Hub Manager Chat',
            sub: 'For route or task issues',
            action: 'Start WhatsApp Chat',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            icon: <MapPin size={20} />,
            label: 'Hub Location',
            sub: 'Sector 15, Studio Road',
            action: 'Get Directions',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Support</h1>
                <div className="w-10" />
            </header>

            <div className="px-5 pt-8">
                <div className="bg-content rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-content/20 mb-8">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-2">Hoora Partners</p>
                        <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-4">Dedicated <br /> Staff Node</h2>
                        <p className="text-white/50 text-[11px] font-bold leading-relaxed mb-6">
                            You are connected to the Secure Staff Node. Our support team is here to assist you with any operational challenges.
                        </p>
                        <button className="flex items-center gap-2 bg-brand px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                            <HeadphonesIcon size={14} /> Help Center
                        </button>
                    </div>
                    <HelpCircle size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
                </div>

                <div className="space-y-4">
                    {SUPPORT_CHANNELS.map((channel, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft flex items-center gap-5 text-left group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${channel.bg} ${channel.color}`}>
                                {channel.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-content italic uppercase leading-none mb-1">{channel.label}</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase mb-2 tracking-tight">{channel.sub}</p>
                                <div className="flex items-center gap-1.5 text-brand">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{channel.action}</span>
                                    <ArrowUpRight size={12} strokeWidth={3} />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="mt-10 p-6 bg-white rounded-[2rem] border border-gray-100 border-dashed text-center">
                    <ShieldCheck size={24} className="text-content-subtle mx-auto mb-3" />
                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest leading-loose">
                        Version 2.4.0-STF <br />
                        Connection: Secure Node-092 <br />
                        Server Time: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffSupport;
