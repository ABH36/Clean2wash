import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, Shield, Droplets, CheckCircle2, Clock, Tag, Car } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

// Original hardcoded services
const HARDCODED_SERVICES = [
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
        badge: '100% Cashback',
        provider: 'captain',
        isHardcoded: true,
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
        badge: 'Premium',
        provider: 'vendor',
        isHardcoded: true,
    }
];

// Admin category → consumer provider
const CATEGORY_PROVIDER = {
    'Doorstep': 'captain',
    'Add-ons': 'captain',
    'Studio': 'vendor',
    'Prestige': 'vendor',
};

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
];

const STEPS = [
    { n: '01', title: 'Book Instantly', desc: 'Pick a service & time slot' },
    { n: '02', title: 'AI Matches', desc: 'Expert captain assigned in 60s' },
    { n: '03', title: 'Spotless Results', desc: 'CarWash-guaranteed clean car' },
];

const VEHICLE_TYPES = [
    { id: 'hatchback', label: 'Hatch', multiplier: 1.0 },
    { id: 'sedan', label: 'Sedan', multiplier: 1.2 },
    { id: 'suv', label: 'SUV', multiplier: 1.5 },
    { id: 'luxury', label: 'Luxury', multiplier: 2.0 },
];

const ServiceSelection = () => {
    const navigate = useNavigate();
    const [active, setActive] = useState('eco');
    const [mode, setMode] = useState('instant');
    const [serviceType, setServiceType] = useState('captain');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState('sedan');

    const SLOTS = [
        { id: 1, time: '09:00 AM', status: 'Available' },
        { id: 2, time: '11:00 AM', status: 'Fast Filling' },
        { id: 3, time: '01:00 PM', status: 'Available' },
        { id: 4, time: '03:00 PM', status: 'Available' },
        { id: 5, time: '05:00 PM', status: 'Available' },
    ];

    // Load admin services from localStorage
    const adminServices = useMemo(() => {
        try {
            const saved = localStorage.getItem('admin_services');
            if (!saved) return [];
            return JSON.parse(saved)
                .filter(s => s.status !== 'Draft')
                .map((s, i) => ({
                    id: s.id,
                    tag: s.type,
                    title: s.name,
                    subtitle: `${s.category} Service`,
                    image: FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
                    price: s.price,
                    original: null,
                    duration: s.time,
                    features: [`${s.type} Technology`, `${s.category} Service`, s.status === 'Featured' ? 'Featured Pick' : 'Available Now', 'CarWash Certified'],
                    badge: s.status,
                    provider: CATEGORY_PROVIDER[s.category] || 'captain',
                    isHardcoded: false,
                }));
        } catch {
            return [];
        }
    }, []);

    // Merge hardcoded + admin services, filter by active tab
    const allServices = [...HARDCODED_SERVICES, ...adminServices];
    const filteredServices = allServices.filter(s => s.provider === serviceType);

    const getPrice = (priceStr) => {
        const base = parseInt(priceStr.replace(/[^\d]/g, ''));
        const multiplier = VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.multiplier || 1;
        return Math.round(base * multiplier);
    };

    const formatPrice = (price) => {
        return `₹${price.toLocaleString()}`;
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-5 bg-white sticky top-0 z-50 border-b border-gray-50/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
                            className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                            <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                        </motion.button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-content leading-none">Choose Wash</h1>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="w-1 h-1 bg-brand rounded-full animate-pulse" />
                                <p className="text-[9px] text-brand font-black uppercase tracking-widest">Live in Faridabad</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-xl flex gap-0.5 border border-gray-200/20">
                        {['now', 'later'].map((m) => (
                            <button key={m} onClick={() => setMode(m === 'now' ? 'instant' : 'scheduled')}
                                className={`px-3.5 py-1.5 rounded-[9px] text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${(m === 'now' && mode === 'instant') || (m === 'later' && mode === 'scheduled')
                                    ? 'bg-white text-brand shadow-sm'
                                    : 'text-content-muted'
                                    }`}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Picker */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                            {['Today', 'Tomorrow', '23 Feb', '24 Feb'].map((d, i) => (
                                <button key={d} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${i === 0 ? 'bg-brand text-white border-brand shadow-md shadow-brand/20' : 'bg-gray-50 border-gray-100 text-content-muted'
                                    }`}>
                                    {d}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Service Type Switcher */}
                <div className="flex gap-2.5 mb-4">
                    {[
                        { id: 'captain', label: 'Car Wash', sub: 'At Home', icon: <Zap size={14} fill="currentColor" /> },
                        { id: 'vendor', label: 'Studio Wash', sub: 'Pickup', icon: <Shield size={14} /> }
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => { setServiceType(type.id); setActive(type.id === 'captain' ? 'eco' : 'full-wash'); }}
                            className={`flex-1 p-3 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${serviceType === type.id
                                ? 'border-brand bg-brand/[0.03] shadow-sm'
                                : 'border-gray-50 bg-gray-50/50 opacity-60 hover:opacity-100'
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 transition-colors ${serviceType === type.id ? 'bg-brand text-white shadow-md shadow-brand/20' : 'bg-white text-content-subtle'
                                }`}>
                                {type.icon}
                            </div>
                            <h3 className={`font-black text-[10px] uppercase tracking-tight leading-none ${serviceType === type.id ? 'text-brand' : 'text-content'}`}>
                                {type.label}
                            </h3>
                            <p className="text-[7.5px] font-bold text-content-subtle uppercase mt-1 opacity-70">{type.sub}</p>
                        </button>
                    ))}
                </div>

                {/* Vehicle Type Selector */}
                <div className="mb-4">
                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 px-1">Select Car Category</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {VEHICLE_TYPES.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVehicle(v.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${selectedVehicle === v.id
                                    ? 'bg-brand text-white border-brand shadow-md shadow-brand/20'
                                    : 'bg-white border-gray-100 text-content-muted hover:border-brand/30'
                                    }`}
                            >
                                <Car size={13} strokeWidth={selectedVehicle === v.id ? 3 : 2} />
                                <span className="text-[10px] font-black uppercase tracking-tight">{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Exterior', 'Interior', 'Deep Clean'].map((c, i) => (
                        <button key={c} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-content text-white shadow-md shadow-content/10' : 'bg-white border border-gray-100 text-content-subtle'
                            }`}>
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 pb-28 space-y-4 pt-4">

                {/* Slot Picker */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 mb-2">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Arrival Slot</p>
                                <span className="text-[8px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase">Fastest</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {SLOTS.map((s) => (
                                    <button key={s.id} onClick={() => setSelectedSlot(s.id)}
                                        className={`py-2 rounded-xl border transition-all ${selectedSlot === s.id ? 'bg-brand text-white border-brand shadow-md' : 'bg-gray-50 border-transparent text-content'
                                            }`}>
                                        <span className="text-[10px] font-black tracking-tight">{s.time}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Service Cards ── */}
                {filteredServices.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActive(s.id)}
                        className={`group rounded-3xl overflow-hidden border-2 transition-all relative ${active === s.id
                            ? 'border-brand bg-white shadow-lg'
                            : 'border-white bg-white shadow-soft hover:border-gray-100'
                            }`}
                    >
                        {/* Badges */}
                        <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                            <span className="bg-brand text-white text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-sm">
                                {s.tag}
                            </span>
                            <span className="bg-white/90 backdrop-blur-sm text-content text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-sm border border-gray-50">
                                {s.badge}
                            </span>
                        </div>

                        {/* Image */}
                        <div className="relative h-28 overflow-hidden">
                            <img src={s.image} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                <div>
                                    <h3 className="text-white text-base font-black tracking-tight leading-none mb-1">{s.title}</h3>
                                    <p className="text-white/60 text-[9px] font-bold line-clamp-1">{s.subtitle}</p>
                                </div>
                                {active === s.id && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                        <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-content italic tabular-nums tracking-tighter">
                                            {formatPrice(getPrice(s.price))}
                                        </span>
                                        {s.original && (
                                            <span className="text-xs line-through text-content-subtle font-black opacity-30">
                                                {formatPrice(getPrice(s.original))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={9} className="text-brand" />
                                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">{s.duration}</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(s.provider === 'vendor' ? '/studios' : `/map?type=${s.provider}&service=${s.id}`);
                                    }}
                                    className="h-10 bg-brand text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-1.5"
                                >
                                    Book <ChevronRight size={12} strokeWidth={4} />
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-gray-50">
                                {s.features.map((f) => (
                                    <div key={f} className="flex items-center gap-2">
                                        <CheckCircle2 size={10} className="text-brand opacity-50" strokeWidth={3} />
                                        <span className="text-[9px] font-bold text-content-subtle truncate">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* ── How it Works ── */}
                <div className="bg-gray-50/50 rounded-3xl p-6 mt-4">
                    <h2 className="text-sm font-black tracking-tight text-content mb-5 uppercase tracking-widest opacity-60">The CarWash Way</h2>
                    <div className="space-y-5">
                        {STEPS.map((step) => (
                            <div key={step.n} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center font-black text-[10px] text-brand shrink-0">
                                    {step.n}
                                </div>
                                <div>
                                    <h3 className="font-black text-xs text-content uppercase tracking-tight">{step.title}</h3>
                                    <p className="text-[10px] font-bold text-content-subtle mt-0.5 tracking-tight leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Trust Badges ── */}
                <div className="flex gap-2.5 pt-2 pb-6">
                    {[
                        { icon: <Shield size={14} className="text-green-500" />, text: 'Insured' },
                        { icon: <Droplets size={14} className="text-blue-500" />, text: 'Eco-Safe' },
                        { icon: <Zap size={14} className="text-brand" fill="currentColor" />, text: 'Instant' },
                    ].map((b) => (
                        <div key={b.text} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-100 rounded-2xl py-3 shadow-sm">
                            {b.icon}
                            <span className="text-[8px] font-black uppercase tracking-widest text-content-subtle">{b.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </MobileLayout>
    );
};

export default ServiceSelection;
