import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, MapPin, Star, TrendingUp, CheckCircle2,
    Clock, ChevronRight, Bell, ToggleLeft, ToggleRight,
    Navigation, Shield
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const INCOMING_JOB = {
    id: 'HOORA-8821',
    customer: 'Aman Verma',
    service: 'Instant Eco Wash',
    vehicle: 'Honda City · KA 05 MR 7821',
    address: 'HSR Layout, Sector 2, Bengaluru 560102',
    distance: '1.4 km away',
    amount: '₹473',
    tip: '+₹50 tip',
    eta: '8 min',
    expiresIn: 28,
};

const CaptainHome = () => {
    const navigate = useNavigate();
    const [online, setOnline] = useState(true);
    const [jobPing, setJobPing] = useState(true);
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => { setAccepted(true); setTimeout(() => navigate('/captain/job'), 800); };
    const handleDecline = () => setJobPing(false);

    return (
        <CaptainLayout>
            {/* ── Header ── */}
            <header className="bg-content px-4 pt-10 pb-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Captain App</p>
                        <h1 className="text-white text-xl font-black tracking-tight mt-0.5">Good afternoon, Rahul 👋</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                            <Bell size={16} className="text-white/60" />
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOnline(!online)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${online ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                            {online ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            {online ? 'Online' : 'Offline'}
                        </motion.button>
                    </div>
                </div>

                {/* Today's Stats */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Jobs', value: '7', color: 'text-white' },
                        { label: 'Earned', value: '₹2.4k', color: 'text-green-400' },
                        { label: 'Rating', value: '4.9★', color: 'text-yellow-400' },
                        { label: 'Hrs', value: '6.2', color: 'text-brand' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/5 rounded-xl px-2 py-3 text-center">
                            <p className={`font-black text-base leading-none ${s.color}`}>{s.value}</p>
                            <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Incoming Job Ping ── */}
                <AnimatePresence>
                    {jobPing && !accepted && (
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300 }}
                            className="bg-white rounded-2xl border-2 border-brand shadow-xl shadow-brand/15 overflow-hidden">
                            {/* Job Header */}
                            <div className="bg-brand/10 px-4 py-3 flex items-center justify-between border-b border-brand/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-brand rounded-full animate-ping" />
                                    <p className="text-brand font-black text-xs uppercase tracking-widest">New Job Request</p>
                                </div>
                                <div className="flex items-center gap-1.5 bg-brand text-white px-2.5 py-1 rounded-lg">
                                    <Clock size={11} strokeWidth={3} />
                                    <span className="font-black text-xs">{INCOMING_JOB.expiresIn}s</span>
                                </div>
                            </div>

                            {/* Job Details */}
                            <div className="px-4 py-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-black text-lg text-content tracking-tight leading-none">{INCOMING_JOB.service}</h3>
                                        <p className="text-content-subtle text-[10px] font-bold mt-0.5">{INCOMING_JOB.vehicle}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-xl text-content">{INCOMING_JOB.amount}</p>
                                        <p className="text-green-600 text-[9px] font-black">{INCOMING_JOB.tip}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                                    <MapPin size={14} className="text-brand flex-shrink-0 mt-0.5" fill="currentColor" strokeWidth={1.5} />
                                    <div>
                                        <p className="font-black text-sm text-content leading-snug">{INCOMING_JOB.address}</p>
                                        <p className="text-[9px] font-black text-brand mt-0.5">{INCOMING_JOB.distance} · ETA {INCOMING_JOB.eta}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                                    <Shield size={13} className="text-green-600" />
                                    <p className="text-[9px] font-black text-green-700">Verified customer · 8 past washes · No incidents</p>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button onClick={handleDecline}
                                        className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm text-content-muted">
                                        Decline
                                    </button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAccept}
                                        className={`flex-1 h-12 rounded-xl font-black text-sm text-white shadow-md transition-all ${accepted ? 'bg-green-500' : 'bg-brand shadow-brand/25'}`}>
                                        {accepted ? '✓ Accepted!' : 'Accept Job'}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Recent Jobs ── */}
                <section className="space-y-2">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Today's Completed Jobs</p>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {[
                            { id: '#7101', service: 'Eco Wash', customer: 'Priya S.', amount: '₹354', time: '11:00 AM', rating: 5 },
                            { id: '#7092', service: 'Deep Clean', customer: 'Arjun M.', amount: '₹1,099', time: '8:30 AM', rating: 5 },
                            { id: '#7081', service: 'Eco Wash', customer: 'Nisha K.', amount: '₹299', time: '7:00 AM', rating: 4 },
                        ].map((job, i, arr) => (
                            <div key={job.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={17} className="text-green-500" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-black text-sm text-content">{job.service}</p>
                                        <span className="text-[8px] font-black text-content-subtle">· {job.customer}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-content-subtle">{job.time}</span>
                                        <span className="flex">{'★'.repeat(job.rating)}<span className="text-gray-200">{'★'.repeat(5 - job.rating)}</span></span>
                                    </div>
                                </div>
                                <p className="font-black text-sm text-green-600">{job.amount}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Performance Card ── */}
                <div className="bg-content rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-11 h-11 bg-brand/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={22} className="text-brand" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">This week: ₹14,200</p>
                        <p className="text-white/40 text-[9px] font-bold mt-0.5">Top 5% of Bengaluru captains</p>
                    </div>
                    <ChevronRight size={14} strokeWidth={2.5} className="text-white/30" />
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand/10 rounded-full blur-xl" />
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHome;
