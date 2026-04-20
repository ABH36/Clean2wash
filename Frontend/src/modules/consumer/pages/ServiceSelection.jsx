import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Zap, Shield, Droplets, CheckCircle2, Clock, Car,
    Star, Plus, Minus, Gift, Sparkles
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

/* ─── Static Data (original — untouched) ──────────────────────────────────── */

const HARDCODED_SERVICES = [
    {
        id: 'eco',
        tag: 'Instant choice',
        title: 'Doorstep eco wash',
        subtitle: 'Captain washes at your location',
        image: '/assets/instantwash/carwash.png',
        price: '₹299',
        original: '₹599',
        duration: '~45 min',
        features: ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
        badge: '100% Cashback',
        provider: 'captain',
        isHardcoded: true,
        rating: 4.6,
        reviews: 6780,
        addons: [
            { id: 'a1', name: 'Exterior Wash & Tyre Polish', price: 249, included: true },
            { id: 'a2', name: 'Interior Cleaning', price: 119 },
            { id: 'a3', name: 'Dashboard Polish', price: 39 },
            { id: 'a4', name: 'Air Freshener (30 days)', price: 89 },
            { id: 'a5', name: 'Odour Eliminator', price: 199 },
        ],
        // loyalty offer hardcoded for this service (admin ones come from localStorage)
        subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: 'Buy 10 Washes, Get 1 Free' },
    },
    {
        id: 'full-wash',
        tag: 'Clinical treatment',
        title: 'Full studio clean',
        subtitle: 'Vendor pick-up & drop service',
        image: '/assets/studiowash/studio.png',
        price: '₹1,299',
        original: '₹2,499',
        duration: '~3-4 hrs',
        features: ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured'],
        badge: 'Premium',
        provider: 'vendor',
        isHardcoded: true,
        rating: 4.4,
        reviews: 3218,
        addons: [
            { id: 'b1', name: 'Full Exterior Deep Wash', price: 799, included: true },
            { id: 'b2', name: '360° Interior Cleaning', price: 499, included: true },
            { id: 'b3', name: 'Engine Bay Cleaning', price: 299 },
            { id: 'b4', name: 'Paint Protection Film', price: 999 },
            { id: 'b5', name: 'Ceramic Coating (1 Year)', price: 1499 },
        ],
        subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 2, label: 'Buy 10 Full Washes, Get 2 Free' },
    }
];

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
    { n: '01', title: 'Book instantly', desc: 'Pick a service & time slot' },
    { n: '02', title: 'AI matches', desc: 'Expert captain assigned in 60s' },
    { n: '03', title: 'Spotless results', desc: 'CarWash-guaranteed clean car' },
];

const VEHICLE_TYPES = [
    { id: 'hatchback', label: 'Hatch', multiplier: 1.0 },
    { id: 'sedan', label: 'Sedan', multiplier: 1.2 },
    { id: 'suv', label: 'SUV', multiplier: 1.5 },
    { id: 'muv', label: 'MUV', multiplier: 1.4 },
    { id: 'compact suv', label: 'Compact SUV', multiplier: 1.4 },
    { id: 'luxury sedan', label: 'Luxury Sedan', multiplier: 2.0 },
    { id: 'luxury suv', label: 'Luxury SUV', multiplier: 2.2 },
    { id: 'coupe', label: 'Coupe', multiplier: 1.8 },
    { id: 'convertible', label: 'Convertible', multiplier: 2.0 },
    { id: 'sports car', label: 'Sports Car', multiplier: 2.5 },
    { id: 'supercar', label: 'Super Car', multiplier: 3.0 },
    { id: 'ev', label: 'EV', multiplier: 1.2 },
    { id: 'mini truck', label: 'Mini Truck', multiplier: 1.8 },
    { id: 'truck', label: 'Truck', multiplier: 2.5 },
    { id: 'van', label: 'Van', multiplier: 1.8 },
    { id: 'tractor', label: 'Tractor', multiplier: 2.0 },
    { id: 'vintage', label: 'Vintage', multiplier: 2.5 },
    { id: 'bike', label: 'Bike', multiplier: 0.6 },
    { id: 'scooter', label: 'Scooter', multiplier: 0.5 },
    { id: 'superbike', label: 'Super Bike', multiplier: 0.9 },
    // Legacy support
    { id: 'luxury', label: 'Luxury', multiplier: 2.0 },
    { id: 'mpv', label: 'MUV', multiplier: 1.4 },
];

/* ─── ServiceCard ──────────────────────────────────────────────────────────── */

const ServiceCard = ({ s, isActive, getPrice, formatPrice, navigate }) => {
    const [open, setOpen] = useState(false);
    const [checkedAddons, setCheckedAddons] = useState(
        (s.addons || []).filter(a => a.included).map(a => a.id)
    );

    const toggle = (id) => {
        if ((s.addons || []).find(a => a.id === id)?.included) return;
        setCheckedAddons(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBook = (e) => {
        e.stopPropagation();
        if (s.provider === 'vendor') {
            // Navigate to full wash booking page for vendor services
            const price = s.price.replace('₹', '').replace(',', '');
            navigate(`/full-wash-booking?service=${encodeURIComponent(s.title)}&price=${price}&mode=scheduled`);
        } else {
            navigate(`/map?type=${s.provider}&service=${s.id}`);
        }
    };

    const startPrice = getPrice(s.price);
    const origPrice = s.original ? getPrice(s.original) : null;
    const offer = s.subscriptionOffer;
    const offerLabel = offer?.enabled
        ? (offer.label || `Buy ${offer.washCount} Washes, Get ${offer.freeWashes} Free`)
        : null;

    return (
        <div className={`rounded-xl overflow-hidden border transition-all duration-300 ${s.provider === 'vendor'
            ? (isActive
                ? 'border-purple-500/40 shadow-[0_4px_16px_-4px_rgba(168,85,247,0.16)]'
                : 'border-white/5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]')
            : (isActive
                ? 'border-brand/40 shadow-[0_4px_16px_-4px_rgba(255,107,0,0.16)]'
                : 'border-white/5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]')
            }`}>

            {/* ── Title Bar (Clean & Light) ── */}
            <button
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b group ${s.provider === 'vendor'
                    ? 'bg-white/[0.05] border-white/10'
                    : 'bg-white/[0.03] border-white/5'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)] ${s.provider === 'vendor' ? 'bg-purple-500' : 'bg-[#F59E0B]'
                        }`} />
                    <span className={`font-[1000] text-[13px] tracking-tight ${s.provider === 'vendor' ? 'text-purple-400' : 'text-white'
                        }`}>{s.title}</span>
                </div>
                <div className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} className={`text-white/20 group-hover:${s.provider === 'vendor' ? 'text-purple-400' : 'text-[#F59E0B]'}`} strokeWidth={3} />
                </div>
            </button>

            {/* ── Image (Sleek & Focused) ── */}
            <div className="relative h-20 overflow-hidden">
                <img src={s.image} alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* tag badge */}
                <div className="absolute bottom-2 left-4 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-md border border-white/10 ">
                    <p className={`text-[7px] font-black uppercase tracking-wider ${s.provider === 'vendor' ? 'text-purple-400' : 'text-[#F59E0B]'
                        }`}>{s.tag}</p>
                </div>

                {/* provider badge */}
                {s.provider === 'vendor' && (
                    <div className="absolute top-2 left-4 px-2 py-0.5 bg-purple-500 text-white rounded-md ">
                        <p className="text-[6px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Shield size={8} strokeWidth={2.5} />
                            Pickup
                        </p>
                    </div>
                )}

                {/* active status tick */}
                {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className={`absolute top-2 right-3 w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-lg ${s.provider === 'vendor' ? 'bg-purple-500' : 'bg-[#F59E0B]'
                            }`}
                    >
                        <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                    </motion.div>
                )}
            </div>

            {/* ── Info Row (Price/Quick CTA) ── */}
            <div className={`flex items-center justify-between px-4 py-4 ${s.provider === 'vendor' ? 'bg-white/[0.05]' : 'bg-white/[0.02]'
                }`}>
                <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-[20px] font-black text-white tracking-tighter">₹{startPrice}</span>
                        {origPrice && <span className="text-[11px] font-bold text-white/20 line-through">₹{origPrice}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 opacity-60">
                            <Clock size={9} className="text-[#F59E0B]" strokeWidth={3} />
                            <span className="text-[8.5px] font-black text-white/40 uppercase tracking-widest">{s.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={9} fill="#F59E0B" className="text-[#F59E0B]" />
                            <span className="text-[10px] font-black text-white">{s.rating ?? 4.5}</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest ml-1">({(s.reviews ?? 500).toLocaleString()})</span>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleBook}
                    className={`h-10 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${s.provider === 'vendor'
                        ? 'bg-purple-600 text-white shadow-purple-600/20'
                        : 'bg-[#F59E0B] text-black shadow-[#F59E0B]/20'
                        }`}
                >
                    {s.provider === 'vendor' ? (
                        <>
                            Book pickup <ArrowRight size={13} strokeWidth={4} />
                        </>
                    ) : (
                        <>
                            Book <ChevronRight size={13} strokeWidth={4} />
                        </>
                    )}
                </motion.button>
            </div>

            {/* ── Subtitle Membership Link (Subtle Hint) ── */}
            <div className="px-4 pb-3.5 pt-1 border-b border-white/5">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] leading-none text-center">
                    Enjoy up to 40% OFF with <span className="text-[#F59E0B] font-black italic underline decoration-[#F59E0B]/20">Black membership</span>
                </p>
            </div>
            {/* ── Expandable Body ── */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="px-4 pt-3 pb-4 space-y-4">

                            {/* Features 2-col grid */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                {s.features.map(f => (
                                    <div key={f} className="flex items-center gap-1.5">
                                        <CheckCircle2 size={9} className={`${s.provider === 'vendor' ? 'text-purple-500' : 'text-[#F59E0B]'} shrink-0`} strokeWidth={3} />
                                        <span className="text-[9px] font-black uppercase text-white/40 tracking-tight leading-tight">{f}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Add-ons */}
                            {s.addons && s.addons.length > 0 && (
                                <div className="rounded-xl border border-white/5 overflow-hidden">
                                    {/* section label */}
                                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.03] border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-white uppercase tracking-widest">Experience</p>
                                            <p className="text-[7.5px] font-black text-white/20 uppercase">Customization</p>
                                        </div>
                                        <motion.button whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/service/${s.id}`); }}
                                            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-2xl ${s.provider === 'vendor'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-[#F59E0B] text-black'
                                                }`}
                                        >
                                            View details
                                        </motion.button>
                                    </div>

                                    {/* rows */}
                                    <div className="divide-y divide-white/5 bg-white/[0.01]">
                                        {s.addons.map(addon => {
                                            const checked = checkedAddons.includes(addon.id);
                                            return (
                                                <div key={addon.id} className="flex items-center justify-between px-3.5 py-2.5">
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <button
                                                            onClick={() => toggle(addon.id)}
                                                            className={`w-4.5 h-[18px] w-[18px] rounded border flex-shrink-0 flex items-center justify-center transition-all ${checked
                                                                ? (s.provider === 'vendor' ? 'bg-purple-500 border-purple-500' : 'bg-[#F59E0B] border-[#F59E0B]')
                                                                : 'border-white/20 bg-white/5'
                                                                }`}
                                                        >
                                                            {checked && <CheckCircle2 size={10} className={s.provider === 'vendor' ? 'text-white' : 'text-black'} strokeWidth={3} />}
                                                        </button>
                                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-tight leading-snug truncate">{addon.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                                        <span className="text-[11px] font-black text-white italic">₹{addon.price}</span>
                                                        {addon.included ? (
                                                            <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                                <CheckCircle2 size={10} className="text-emerald-500" strokeWidth={2.5} />
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => toggle(addon.id)}
                                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checked
                                                                    ? (s.provider === 'vendor' ? 'bg-purple-500 border-purple-500 text-white' : 'bg-[#F59E0B] border-[#F59E0B] text-black')
                                                                    : 'border-white/10 text-white/20'
                                                                    }`}
                                                            >
                                                                {checked
                                                                    ? <Minus size={9} strokeWidth={3} />
                                                                    : <Plus size={9} strokeWidth={2.5} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}




                            {/* Monthly Subscription Plans (Per service) */}
                            {s.plans && s.plans.length > 0 && (
                                <div className="space-y-2 pb-1">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">Cycles & Payouts</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {s.plans.map(plan => (
                                            <div key={plan.id} className="bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-3 flex items-center justify-between group hover:border-[#F59E0B]/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[#F59E0B] border border-white/10 italic font-black text-[12px] shadow-lg">
                                                        {plan.label.match(/\d+/)?.[0] || '1'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{plan.label}</p>
                                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">₹{plan.perWash}/wash</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <span className="text-[14px] font-black text-white italic italic tracking-tighter">₹{plan.total}</span>
                                                    <button onClick={handleBook} className="w-6 h-6 bg-[#F59E0B] text-black rounded-lg flex items-center justify-center shadow-lg">
                                                        <ChevronRight size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Loyalty Offer Banner (Bottom of Detail Flow) ── */}
                            {offerLabel && (
                                <motion.div
                                    className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 "
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0  border border-white/10">
                                        <Gift size={22} className="text-[#F59E0B]" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mb-1.5 opacity-60 italic">Loyalty offer</p>
                                        <p className="text-[14px] font-black text-white italic tracking-tighter leading-none">{offerLabel}</p>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { e.stopPropagation(); navigate('/subscriptions'); }}
                                        className="h-11 px-7 bg-[#F59E0B] text-black rounded-xl font-black text-[10px] uppercase tracking-wider shadow-2xl shadow-[#F59E0B]/20 shrink-0 flex items-center justify-center transition-all active:scale-95"
                                    >
                                        Avail
                                    </motion.button>
                                </motion.div>
                            )}


                            {/* Full CTA */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleBook}
                                className="w-full h-11 bg-white text-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden"
                            >
                                <span>Book {s.title}</span>
                                <ChevronRight size={13} strokeWidth={3} />
                                <motion.div
                                    animate={{ x: ['100%', '-200%'] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                                    className="absolute inset-y-0 w-8 bg-black/5 skew-x-12 pointer-events-none"
                                />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

const ServiceSelection = () => {
    const navigate = useNavigate();
    const [active, setActive] = useState('eco');
    const [mode, setMode] = useState('instant');
    const [serviceType, setServiceType] = useState('captain');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState('sedan');

    const SLOTS = [
        { id: 1, time: '09:00 AM' },
        { id: 2, time: '11:00 AM' },
        { id: 3, time: '01:00 PM' },
        { id: 4, time: '03:00 PM' },
        { id: 5, time: '05:00 PM' },
    ];

    // Load admin services from localStorage  (originallogic — untouched)
    const adminServices = useMemo(() => {
        try {
            const saved = localStorage.getItem('CarWash_services');
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
                    features: s.category === 'Studio'
                        ? ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured']
                        : ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
                    badge: s.status,
                    provider: CATEGORY_PROVIDER[s.category] || 'captain',
                    isHardcoded: false,
                    rating: 4.3,
                    reviews: 520,
                    addons: s.category === 'Studio'
                        ? [
                            { id: 'sa1', name: 'Engine Bay Cleaning', price: 299 },
                            { id: 'sa2', name: 'Paint Protection Film', price: 999 },
                            { id: 'sa3', name: 'Ceramic Coating (1 Year)', price: 1499 },
                        ]
                        : [
                            { id: 'da1', name: 'Exterior Wash & Tyre Polish', price: 249, included: true },
                            { id: 'da2', name: 'Interior Cleaning', price: 119 },
                            { id: 'da3', name: 'Dashboard Polish', price: 39 },
                            { id: 'da4', name: 'Air Freshener (30 days)', price: 89 },
                        ],
                    // pass-through admin's subscription offer & plans
                    subscriptionOffer: (s.subscriptionOffer && s.subscriptionOffer.enabled)
                        ? s.subscriptionOffer
                        : { enabled: true, washCount: 10, freeWashes: 1, label: s.subscriptionOffer?.label || `Buy 10 ${s.name} Washes, Get 1 FREE` },
                    plans: s.plans || [],
                }));
        } catch {
            return [];
        }
    }, []);

    // Merge hardcoded + admin services, filter by active tab  (original logic)
    const allServices = [...HARDCODED_SERVICES, ...adminServices];
    const filteredServices = allServices.filter(s => s.provider === serviceType);

    // Original price helpers
    const getPrice = (priceStr) => {
        const base = parseInt(String(priceStr).replace(/[^\d]/g, ''));
        const multiplier = VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.multiplier || 1;
        return Math.round(base * multiplier);
    };
    const formatPrice = (price) => `₹${Number(price).toLocaleString()}`;

    return (
        <MobileLayout>
            <div className="bg-[#0A0F0D] min-h-screen">
                {/* ── Sticky Header ── */}
                <header className="px-4 pt-10 pb-4 bg-[#0A0F0D]/90 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
                    {/* Row 1: back + title + mode toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
                                className="w-10 h-10 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center">
                                <ChevronLeft size={20} strokeWidth={3} className="text-white" />
                            </motion.button>
                            <div>
                                <h1 className="text-lg font-[1000] tracking-tighter text-white leading-none">Choose wash</h1>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
                                    <p className="text-[8px] text-[#F59E0B] font-black uppercase tracking-widest leading-none">Faridabad protocol active</p>
                                </div>
                            </div>
                        </div>

                        {/* Now / Later */}
                        <div className="bg-white/[0.03] p-1 rounded-xl flex gap-1 border border-white/5">
                            {['now', 'later'].map(m => (
                                <button key={m}
                                    onClick={() => setMode(m === 'now' ? 'instant' : 'scheduled')}
                                    className={`px-3 py-1.5 rounded-[9px] text-[8.5px] font-black uppercase tracking-widest transition-all ${(m === 'now' && mode === 'instant') || (m === 'later' && mode === 'scheduled')
                                        ? 'bg-white text-black ' : 'text-white/20'
                                        }`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                {/* Date Picker (scheduled) */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 mb-3 overflow-x-auto pb-0.5 no-scrollbar">
                            {['Today', 'Tomorrow', '27 Feb', '28 Feb'].map((d, i) => (
                                <button key={d}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-[0.2em] border transition-all ${i === 0 ? 'bg-[#F29F05] text-black border-[#F29F05] ' : 'bg-white/[0.03] border-white/10 text-white/40'
                                        }`}>
                                    {d}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Service Type Switcher */}
                <div className="flex gap-2 mb-3">
                    {[
                        { id: 'captain', label: 'Car Wash', sub: 'At Home', icon: <Droplets size={12} fill="currentColor" /> },
                        { id: 'vendor', label: 'Studio wash', sub: 'Pickup & Drop', icon: <Shield size={12} /> }
                    ].map(type => (
                        <button key={type.id}
                            onClick={() => { setServiceType(type.id); setActive(type.id === 'captain' ? 'eco' : 'full-wash'); }}
                            className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${serviceType === type.id
                                ? 'border-[#F59E0B]/50 bg-[#F59E0B]/5 shadow-lg shadow-[#F59E0B]/5'
                                : 'border-white/5 bg-white/[0.02] opacity-40 hover:opacity-100'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${serviceType === type.id ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20' : 'bg-white/5 text-white/20 border border-white/10'
                                }`}>
                                {type.icon}
                            </div>
                            <div className="text-left leading-none">
                                <p className={`font-black text-[10px] uppercase tracking-tighter italic ${serviceType === type.id ? 'text-white' : 'text-white/40'}`}>
                                    {type.label}
                                </p>
                                <p className="text-[7.5px] font-black uppercase tracking-widest text-white/20 mt-1">{type.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Vehicle Type */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {VEHICLE_TYPES.map(v => (
                        <button key={v.id}
                            onClick={() => setSelectedVehicle(v.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${selectedVehicle === v.id
                                ? 'bg-white text-black border-white shadow-2xl'
                                : 'bg-white/[0.03] border-white/5 text-white/20'
                                }`}>
                            <Car size={11} strokeWidth={selectedVehicle === v.id ? 3 : 2} />
                            <span className="text-[9px] font-[1000] tracking-tighter">{v.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 pb-28 space-y-3 pt-3">

                {/* Slot Picker */}
                <AnimatePresence>
                    {mode === 'scheduled' && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] rounded-2xl border border-white/5 p-4 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[8.5px] font-black text-white/20 uppercase tracking-[0.2em] italic">Pick arrival slot</p>
                                <span className="text-[7.5px] font-[1000] text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#F59E0B]/20">Fastest</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {SLOTS.map(sl => (
                                    <button key={sl.id} onClick={() => setSelectedSlot(sl.id)}
                                        className={`py-2 rounded-xl text-[9.5px] font-black tracking-tight border transition-all ${selectedSlot === sl.id ? 'bg-[#F29F05] text-black border-[#F29F05] shadow-lg shadow-[#F29F05]/20' : 'bg-white/5 border-white/10 text-white/40'
                                            }`}>
                                        {sl.time}
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
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => setActive(s.id)}
                    >
                        <ServiceCard
                            s={s}
                            isActive={active === s.id}
                            getPrice={getPrice}
                            formatPrice={formatPrice}
                            navigate={navigate}
                        />
                    </motion.div>
                ))}

                {/* ── How it Works ── */}
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 italic">Platform Logic</p>
                    <div className="space-y-4">
                        {STEPS.map(step => (
                            <div key={step.n} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-[#F59E0B] shrink-0 shadow-lg italic">
                                    {step.n}
                                </div>
                                <div>
                                    <p className="font-black text-[11px] text-white italic uppercase tracking-tighter leading-none">{step.title}</p>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1 opacity-60 leading-none">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Trust Badges ── */}
                <div className="flex gap-2 pb-6">
                    {[
                        { icon: <Shield size={13} className="text-emerald-500" />, text: 'Insured' },
                        { icon: <Droplets size={13} className="text-blue-500" />, text: 'Eco-Safe' },
                        { icon: <Zap size={13} className="text-[#F59E0B]" fill="currentColor" />, text: 'Instant' },
                    ].map(b => (
                        <div key={b.text} className="flex-1 flex items-center justify-center gap-2 bg-white/[0.03] border border-white/5 rounded-2xl py-3 shadow-xl">
                            {b.icon}
                            <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/20">{b.text}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </MobileLayout>
    );
};

export default ServiceSelection;
