import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Phone,
    Mail,
    Info,
    ChevronRight,
    ArrowLeft,
    LifeBuoy,
    HelpCircle,
    User,
    Navigation
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const CaptainSupport = () => {
    const navigate = useNavigate();

    const CONTACT_CHANNELS = [
        { icon: <MessageCircle />, label: 'Hub Manager Chat', sub: 'Available 09 AM - 09 PM', color: 'bg-green-500' },
        { icon: <Phone />, label: 'Emergency Ops Line', sub: '24/7 Priority Support', color: 'bg-red-500' },
        { icon: <Mail />, label: 'Email Ticket', sub: 'Resolution in 12 hours', color: 'bg-blue-500' }
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
                        <h1 className="text-xl font-black text-white italic tracking-tight uppercase">Support Hub</h1>
                    </div>
                </div>

                <div className="px-4 space-y-6">
                    {/* Hero Support Card */}
                    <div className="bg-brand rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand/20">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-2">Need Help, <br />Captain?</h3>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Our mission control is ready to assist you with any challenges.</p>

                            <button className="flex items-center gap-2 bg-white text-brand px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                                <LifeBuoy size={16} />
                                Start Quick Fix
                            </button>
                        </div>
                        <HelpCircle size={150} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                    </div>

                    {/* Contact Channels */}
                    <div className="space-y-3">
                        {CONTACT_CHANNELS.map((ch, i) => (
                            <button
                                key={i}
                                className="w-full flex items-center gap-4 p-5 bg-content border border-white/5 rounded-3xl hover:border-brand/30 transition-all group"
                            >
                                <div className={`w-12 h-12 ${ch.color} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                                    {React.cloneElement(ch.icon, { size: 24 })}
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-black italic uppercase tracking-tight text-base">{ch.label}</h4>
                                    <p className="text-white/40 text-[10px] font-bold mt-0.5">{ch.sub}</p>
                                </div>
                                <ChevronRight size={18} className="ml-auto text-white/20 group-hover:text-brand transition-all" />
                            </button>
                        ))}
                    </div>

                    {/* Hub Location Card */}
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                                <Navigation size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-black italic uppercase tracking-tight text-sm">Assigned Hub</h4>
                                <p className="text-white/40 text-[10px] font-bold">Koramangala 4th Block Hub</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10">
                                <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&q=80" alt="Manager" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-black italic text-xs uppercase">Vikram Verma</p>
                                <p className="text-brand text-[9px] font-black uppercase tracking-widest">Hub Manager</p>
                            </div>
                            <button className="p-3 bg-white/5 rounded-xl text-white hover:bg-brand transition-all">
                                <Phone size={16} />
                            </button>
                        </div>
                    </div>

                    {/* FAQ Links */}
                    <div className="space-y-2">
                        <p className="px-4 text-[10px] font-black text-brand uppercase tracking-[0.2em] italic mb-3">Popular Topics</p>
                        {['Payment issues?', 'How to earn level bonuses?', 'Chemical safety guide', 'Cancellation policy'].map((txt, i) => (
                            <button key={i} className="w-full flex items-center justify-between p-4 bg-transparent border-b border-white/5 text-white/60 text-xs font-bold hover:text-white transition-all">
                                {txt}
                                <ChevronRight size={14} className="opacity-40" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSupport;
