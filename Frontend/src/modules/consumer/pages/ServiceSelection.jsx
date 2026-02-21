import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, Shield, Droplets, CheckCircle2 } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const SERVICES = [
    {
        id: 'eco',
        tag: 'Instant Choice',
        title: 'Doorstep Eco Wash',
        subtitle: 'Captain washes at your location',
        image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80',
        price: '₹299',
        original: '₹599',
        duration: '~45 min',
        features: ['Captain arrives in 20m', 'At-home service only', 'No pickup required', 'Eco-friendly waterless'],
        isDark: false,
        badge: '100% Cashback',
        provider: 'captain'
    },
    {
        id: 'full-wash',
        tag: 'Clinical Treatment',
        title: 'Full Studio Clean',
        subtitle: 'Vendor pick-up & drop service',
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
        price: '₹1,299',
        original: '₹2,499',
        duration: '~3-4 hrs',
        features: ['Vendor pick-up from home', 'Professional studio wash', 'Sanitized delivery', 'Damage Insurance'],
        isDark: true,
        badge: 'Premium',
        provider: 'vendor'
    }
];

const STEPS = [
    { n: '01', title: 'Book Instantly', desc: 'Pick a service & time slot' },
    { n: '02', title: 'AI Matches', desc: 'Expert captain assigned in 60s' },
    { n: '03', title: 'Spotless Results', desc: 'Hoora-guaranteed clean car' },
];

const ServiceSelection = () => {
    const navigate = useNavigate();
    const [active, setActive] = useState('eco');
    const [mode, setMode] = useState('instant'); // 'instant' or 'scheduled'
    const [serviceType, setServiceType] = useState('captain'); // 'captain' or 'vendor'
    const [selectedSlot, setSelectedSlot] = useState(null);

    const SLOTS = [
        { id: 1, time: '09:00 AM', status: 'Available' },
        { id: 2, time: '11:00 AM', status: 'Fast Filling' },
        { id: 3, time: '01:00 PM', status: 'Available' },
        { id: 4, time: '03:00 PM', status: 'Available' },
        { id: 5, time: '05:00 PM', status: 'Available' },
    ];

    const filteredServices = SERVICES.filter(s => s.provider === serviceType);

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                            <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-content leading-none">Choose Wash</h1>
                            <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Instant or Scheduled</p>
                        </div>
                    </div>

                    {/* Instant/Schedule Toggle */}
                    <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                        <button onClick={() => setMode('instant')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'instant' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            Now
                        </button>
                        <button onClick={() => setMode('scheduled')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'scheduled' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                            Later
                        </button>
                    </div>
                </div>

                {/* Date Picker (Only if scheduled) */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                            {['Today', 'Tomorrow', '23 Feb', '24 Feb', '25 Feb'].map((d, i) => (
                                <button key={d} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${i === 1 ? 'bg-brand text-white border-brand shadow-md' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                                    {d}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Service Type Selection (2 Buttons) */}
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => { setServiceType('captain'); setActive('eco'); }}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${serviceType === 'captain' ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white opacity-60'}`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${serviceType === 'captain' ? 'bg-brand text-white' : 'bg-gray-100 text-content-muted'}`}>
                            <Zap size={16} fill={serviceType === 'captain' ? 'currentColor' : 'none'} />
                        </div>
                        <h3 className={`font-black text-xs uppercase tracking-tight ${serviceType === 'captain' ? 'text-brand' : 'text-content'}`}>Car Wash</h3>
                        <p className="text-[8px] font-bold text-content-subtle uppercase mt-0.5">At Home</p>
                    </button>

                    <button
                        onClick={() => { setServiceType('vendor'); setActive('full-wash'); }}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${serviceType === 'vendor' ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white opacity-60'}`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${serviceType === 'vendor' ? 'bg-brand text-white' : 'bg-gray-100 text-content-muted'}`}>
                            <Shield size={16} />
                        </div>
                        <h3 className={`font-black text-xs uppercase tracking-tight ${serviceType === 'vendor' ? 'text-brand' : 'text-content'}`}>Full Car Wash</h3>
                        <p className="text-[8px] font-bold text-content-subtle uppercase mt-0.5">Studio + Pickup</p>
                    </button>
                </div>

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All', 'Exterior', 'Interior', 'Add-ons'].map((c, i) => (
                        <button key={c} className={`flex-shrink-0 border px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-content text-white border-content' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 pb-24 space-y-3 pt-4">

                {/* ── Slot Picker (Only if scheduled) ── */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 mb-4">
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-3">Available Slots</p>
                            <div className="grid grid-cols-2 gap-2">
                                {SLOTS.map((s) => (
                                    <button key={s.id} onClick={() => setSelectedSlot(s.id)}
                                        className={`px-3 py-2.5 rounded-xl border flex flex-col items-center transition-all ${selectedSlot === s.id ? 'bg-brand/5 border-brand' : 'bg-gray-50 border-transparent'}`}>
                                        <span className={`text-sm font-black ${selectedSlot === s.id ? 'text-brand' : 'text-content'}`}>{s.time}</span>
                                        <span className="text-[8px] font-bold text-content-subtle mt-0.5">{s.status}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Service Cards ── */}
                {filteredServices.map((s) => (
                    <motion.div key={s.id} whileTap={{ scale: 0.99 }} onClick={() => setActive(s.id)}
                        className={`rounded-2xl overflow-hidden border-2 transition-all shadow-soft cursor-pointer ${active === s.id
                            ? s.isDark ? 'border-content bg-content' : 'border-brand/30 bg-white'
                            : 'border-gray-100 bg-white'
                            }`}>

                        {/* Image */}
                        <div className="relative h-36 overflow-hidden">
                            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${s.isDark ? 'bg-white/20 text-white' : 'bg-brand text-white'}`}>{s.tag}</span>
                                    <span className="bg-accent-yellow text-black text-[8px] font-black px-2 py-1 rounded-lg">{s.badge}</span>
                                </div>
                                <div>
                                    <h3 className="text-white text-lg font-black tracking-tight leading-none">{s.title}</h3>
                                    <p className="text-white/60 text-[10px] font-bold mt-0.5">{s.subtitle}</p>
                                </div>
                            </div>
                            {active === s.id && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircle2 size={20} className="text-white" fill={s.isDark ? '#0F172A' : '#FF6B00'} strokeWidth={2} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-2xl font-black tracking-tight ${s.isDark ? 'text-white' : 'text-content'}`}>{s.price}</span>
                                        <span className={`text-sm line-through ${s.isDark ? 'text-white/30' : 'text-content-subtle'}`}>{s.original}</span>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${s.isDark ? 'text-white/40' : 'text-content-subtle'}`}>{s.duration}</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(s.provider === 'vendor' ? '/studios' : `/map?type=instant&service=${s.id}`)}
                                    className="flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-brand/30">
                                    Book <ChevronRight size={12} strokeWidth={3} />
                                </motion.button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {s.features.map((f) => (
                                    <div key={f} className="flex items-center gap-1.5">
                                        <CheckCircle2 size={11} className={`flex-shrink-0 ${s.isDark ? 'text-green-400' : 'text-brand'}`} strokeWidth={2.5} />
                                        <span className={`text-[10px] font-bold ${s.isDark ? 'text-white/60' : 'text-content-subtle'}`}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* ── How it Works ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                    <h2 className="text-base font-black tracking-tight text-content mb-4">The Hoora Way</h2>
                    <div className="space-y-4">
                        {STEPS.map((step, i) => (
                            <div key={step.n} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[9px] font-black text-brand">{step.n}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-sm text-content tracking-tight">{step.title}</h3>
                                    <p className="text-[10px] font-bold text-content-subtle mt-0.5">{step.desc}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="absolute ml-4 mt-10 w-px h-4 bg-gray-100" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Trust Badges ── */}
                <div className="flex gap-3">
                    {[
                        { icon: <Shield size={16} className="text-green-500" />, text: 'Insured' },
                        { icon: <Droplets size={16} className="text-blue-500" />, text: 'Eco-Safe' },
                        { icon: <Zap size={16} className="text-brand" fill="currentColor" />, text: 'Instant' },
                    ].map((b) => (
                        <div key={b.text} className="flex-1 flex flex-col items-center gap-1.5 bg-white border border-gray-100 rounded-xl py-3 shadow-soft">
                            {b.icon}
                            <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">{b.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </MobileLayout>
    );
};

export default ServiceSelection;
