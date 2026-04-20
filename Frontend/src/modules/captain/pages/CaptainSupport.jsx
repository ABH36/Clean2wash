import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Phone,
    Mail,
    ChevronRight,
    ChevronLeft,
    LifeBuoy
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

import { useTheme } from '../../../context/ThemeContext';

const CaptainSupport = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();



    return (
        <CaptainLayout>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white/5'} pb-32 transition-colors duration-500`}>
                {/* ── Minimal Header ── */}
                <header className="px-6 pt-16 pb-6 sticky top-0 bg-inherit z-40">
                    <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-white/[0.05] text-content'}`}>
                        <ChevronLeft size={16} />
                    </button>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Support</h1>
                </header>

                <div className="px-6 mt-8 space-y-12">
                    {/* ── Quick Help Section ── */}
                    <section>
                        <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-4 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Assigned Hub Manager</p>
                        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5'} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[1.25rem] overflow-hidden border-white/5 transition-colors ${isDarkMode ? 'border-white/10' : 'border-white'}`}>
                                    <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&q=80" alt="Manager" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-content'}`}>Vikram Verma</p>
                                    <p className={`text-[10px] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Koramangala 4th Block Hub</p>
                                </div>
                            </div>
                            <button className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-brand text-white' : 'bg-brand text-white shadow-lg shadow-brand/20'}`}>
                                <Phone size={16} />
                            </button>
                        </div>
                    </section>

                    {/* ── Communication Channels ── */}
                    <section className="space-y-6">
                        <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Direct Contact</p>
                        <div className="space-y-8">
                            {[
                                { icon: MessageCircle, label: 'Live Chat', sub: 'Hub Manager · 9AM - 9PM', color: 'text-green-500' },
                                { icon: Phone, label: 'Emergency Ops', sub: 'Priority Support · 24/7', color: 'text-red-500' },
                                { icon: Mail, label: 'Email Ticket', sub: 'General inquiries · 12h Res', color: 'text-blue-500' }
                            ].map((ch, i) => (
                                <button key={i} className="w-full flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                                            <ch.icon size={18} className={ch.color} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-content'}`}>{ch.label}</p>
                                            <p className={`text-[10px] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{ch.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={`${isDarkMode ? 'text-white/10' : 'text-gray-300'} group-hover:translate-x-1 transition-transform`} />
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── Knowledge Base ── */}
                    <section className="pt-4">
                        <h3 className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-6 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Common Fixes</h3>
                        <div className="space-y-6">
                            {['Payment not received?', 'Earning level bonuses', 'Chemical safety guide', 'Cancellation policy'].map((txt, i) => (
                                <button key={i} className={`w-full flex items-center justify-between text-left group`}>
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white/60 group-hover:text-white' : 'text-content-subtle group-hover:text-content'} transition-colors`}>{txt}</p>
                                    <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── Floating Help Button ── */}
                <div className="fixed bottom-10 left-6 right-6">
                    <button className="w-full h-14 bg-brand text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-black/50 shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <LifeBuoy size={18} />
                        SOS Emergency
                    </button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSupport;
