import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, MapPin, Star, TrendingUp, CheckCircle2,
    Clock, ChevronRight, Bell, ToggleLeft, ToggleRight,
    Navigation, Shield, Car, ArrowRight, Sun, Moon
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const CaptainHome = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { getUser, bookings, updateBookingStatus } = useAuth();
    const user = getUser('captain') || { name: 'Captain', id: 'CPT-DEFAULT' };
    const [online, setOnline] = useState(true);

    // Dynamic Stats
    const completedJobs = bookings.filter(b => b.captainId === user.id && b.status === 'completed');
    const totalEarnings = completedJobs.reduce((acc, b) => acc + parseInt(b.price?.replace(/[^0-9]/g, '') || 0), 0);
    // Filter by type: 'captain' and status: 'pending'
    const pendingJobs = bookings.filter(b => b.status === 'pending' && b.type === 'captain');
    const liveJob = pendingJobs[0];

    const [acceptedJobId, setAcceptedJobId] = useState(null);

    const handleAccept = (jobId) => {
        setAcceptedJobId(jobId);
        updateBookingStatus(jobId, 'confirmed', { captainId: user.id });
        setTimeout(() => navigate(`/captain/job?id=${jobId}`), 800);
    };

    const handleDecline = (jobId) => {
        // Just ignore locally for now
    };

    return (
        <CaptainLayout>
            {/* ── Header ── */}
            <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-5 border-b sticky top-0 z-40 transition-colors duration-500`}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest`}>Captain App</p>
                        <h1 className={`${isDarkMode ? 'text-white' : 'text-content'} text-xl font-black tracking-tight mt-0.5`}>Good afternoon, {(user?.name || 'Captain').split(' ')[0]} 👋</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 text-brand' : 'bg-gray-50 border border-gray-100 text-brand'}`}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                            <Bell size={16} />
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOnline(!online)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${online
                                ? isDarkMode ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-green-500/10 border-green-200 text-green-600'
                                : isDarkMode ? 'bg-white/5 border-white/10 text-white/20' : 'bg-gray-50 border-gray-100 text-content-subtle'}`}>
                            {online ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            {online ? 'Online' : 'Offline'}
                        </motion.button>
                    </div>
                </div>

                {/* Today's Dynamic Stats */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Jobs', value: completedJobs.length.toString(), color: isDarkMode ? 'text-white' : 'text-content' },
                        { label: 'Earned', value: `₹${(totalEarnings / 1000).toFixed(1)}k`, color: isDarkMode ? 'text-green-400' : 'text-green-600' },
                        { label: 'Rating', value: '5.0★', color: 'text-amber-500' },
                        { label: 'Status', value: online ? 'ON' : 'OFF', color: 'text-brand' },
                    ].map(s => (
                        <div key={s.label} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'} border rounded-xl px-2 py-3 text-center transition-colors duration-500`}>
                            <p className={`font-black text-base leading-none ${s.color}`}>{s.value}</p>
                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[8px] font-black uppercase tracking-widest mt-1`}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Incoming Job Ping (Service Cart Style) ── */}
                <AnimatePresence>
                    {online && liveJob && (
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300 }}
                            className={`${isDarkMode ? 'bg-[#1E293B] border-brand/50 shadow-brand/10' : 'bg-white border-brand shadow-brand/15'} rounded-2xl border-2 shadow-xl overflow-hidden transition-all duration-500`}>
                            {/* Job Header */}
                            <div className="bg-brand px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                    <p className="text-white font-black text-[10px] uppercase tracking-[0.2em]">New Request Discovered</p>
                                </div>
                                <div className="bg-white/20 text-white px-2 py-1 rounded-lg">
                                    <span className="font-black text-[10px]">ETA: 8m</span>
                                </div>
                            </div>

                            {/* Service Summarized Cart */}
                            <div className="px-4 py-5 space-y-5">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest leading-none">Order Details</p>
                                        <h3 className={`font-black text-xl tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveJob.serviceName}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-400/20 text-indigo-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                                <Car size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-tight">{liveJob.vehicle}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>· {liveJob.userName}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Your Payout</p>
                                        <p className={`font-black text-2xl italic ${isDarkMode ? 'text-white' : 'text-content'}`}>{liveJob.price}</p>
                                        <p className="text-green-500 text-[9px] font-black uppercase tracking-widest">+₹50 Tip Included</p>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl flex items-start gap-3 border transition-colors ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                        <MapPin size={14} className="text-brand" fill="currentColor" strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-black text-xs leading-snug truncate ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{liveJob.address}</p>
                                        <p className={`text-[9px] font-bold mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>HSR Layout · 1.2 km away</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => handleDecline(liveJob.id)}
                                        className={`w-16 h-12 flex items-center justify-center rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-content-subtle'}`}>
                                        <ToggleLeft size={20} />
                                    </button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAccept(liveJob.id)}
                                        className={`flex-1 h-12 rounded-xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${acceptedJobId === liveJob.id ? 'bg-green-500 shadow-green-500/20' : 'bg-brand shadow-brand/30'}`}>
                                        {acceptedJobId === liveJob.id ? (
                                            <>Accepting... <Zap size={15} className="animate-pulse" /></>
                                        ) : (
                                            <>Accept Request <ArrowRight size={15} strokeWidth={3} /></>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Recent Jobs ── */}
                <section className="space-y-2">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Today's Completed Jobs</p>
                    <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-soft'}`}>
                        {completedJobs.length > 0 ? completedJobs.slice(0, 5).map((job, i, arr) => (
                            <div key={job.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                                    <CheckCircle2 size={17} className="text-green-500" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`font-black text-sm ${isDarkMode ? 'text-white/90' : 'text-content'}`}>{job.serviceName}</p>
                                        <span className={`text-[8px] font-black ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>· {job.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{(job.timestamp || 'Now')}</span>
                                        <span className="flex">{'★'.repeat(5)}</span>
                                    </div>
                                </div>
                                <p className="font-black text-sm text-green-500">{job.price}</p>
                            </div>
                        )) : (
                            <div className="px-4 py-10 text-center opacity-40">
                                <p className={`text-[10px] font-black uppercase tracking-widest italic ${isDarkMode ? 'text-white' : 'text-content'}`}>No jobs completed today</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Performance Card ── */}
                <div className={`${isDarkMode ? 'bg-brand shadow-brand/20' : 'bg-[#0F172A] shadow-content/20'} rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden shadow-xl transition-all duration-500`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-white/20' : 'bg-brand/20'}`}>
                        <TrendingUp size={22} className={isDarkMode ? 'text-white' : 'text-brand'} />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Weekly Earnings: ₹{(totalEarnings).toLocaleString()}</p>
                        <p className="text-white/40 text-[9px] font-bold mt-0.5">Top 5% of captains</p>
                    </div>
                    <ChevronRight size={14} strokeWidth={2.5} className="text-white/30" />
                    {!isDarkMode && <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand/10 rounded-full blur-xl" />}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHome;
