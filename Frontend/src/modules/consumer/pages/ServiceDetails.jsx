import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Star,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Zap,
    Gift,
    ChevronRight,
    Plus,
    Minus
} from 'lucide-react';

const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedVehicle, setSelectedVehicle] = useState('sedan');
    const [checkedAddons, setCheckedAddons] = useState([]);

    // Logic to find service (Matching ServiceSelection.jsx logic)
    const service = useMemo(() => {
        const HARDCODED_SERVICES = [
            {
                id: 'eco',
                tag: 'Instant Choice',
                title: 'Doorstep Eco Wash',
                subtitle: 'Captain washes at your location',
                image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
                price: 299,
                duration: '~45 min',
                description: 'Our signature eco-friendly waterless wash. We use specialized polymers to encapsulate dirt and lift it away safely, leaving a high-gloss finish without wasting a drop of water.',
                features: ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
                rating: 4.6,
                reviews: 6780,
                addons: [
                    { id: 'a1', name: 'Exterior Wash & Tyre Polish', price: 249, included: true },
                    { id: 'a2', name: 'Interior Cleaning', price: 119 },
                    { id: 'a3', name: 'Dashboard Polish', price: 39 },
                    { id: 'a4', name: 'Air Freshener (30 days)', price: 89 },
                ],
                subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 1, label: 'Buy 10 Washes, Get 1 Free' }
            },
            {
                id: 'full-wash',
                tag: 'Clinical Treatment',
                title: 'Full Studio Clean',
                subtitle: 'Vendor pick-up & drop service',
                image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
                price: 1299,
                duration: '~3-4 hrs',
                description: 'A comprehensive clinical treatment for your vehicle. We pick up your car, take it to our professional studio for deep steam cleaning and sanitization, and deliver it back to you in pristine condition.',
                features: ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured'],
                rating: 4.4,
                reviews: 3218,
                addons: [
                    { id: 'b1', name: 'Full Exterior Deep Wash', price: 799, included: true },
                    { id: 'b2', name: '360° Interior Cleaning', price: 499, included: true },
                    { id: 'b3', name: 'Engine Bay Cleaning', price: 299 },
                ],
                subscriptionOffer: { enabled: true, washCount: 10, freeWashes: 2, label: 'Buy 10 Full Washes, Get 2 Free' }
            }
        ];

        const saved = localStorage.getItem('CarWash_services');
        const adminServices = saved ? JSON.parse(saved).map(s => ({
            id: s.id,
            tag: s.type,
            title: s.name,
            subtitle: `${s.category} Service`,
            image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80',
            price: parseInt(s.price),
            duration: s.time,
            description: `Professional ${s.name} service managed by our certified experts. Includes high-quality ${s.type} treatment tailored for your vehicle.`,
            features: s.category === 'Studio'
                ? ['Pickup from home', 'Professional studio', 'Sanitized delivery', 'Damage insured']
                : ['Captain arrives in 20m', 'At-home service', 'Eco-friendly', 'No pickup needed'],
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
                ],
            subscriptionOffer: s.subscriptionOffer || { enabled: false },
            plans: s.plans || []
        })) : [];

        return [...HARDCODED_SERVICES, ...adminServices].find(s => s.id === id);
    }, [id]);

    if (!service) return <div className="p-10 text-center">Service not found</div>;

    const toggleAddon = (aid) => {
        setCheckedAddons(prev => prev.includes(aid) ? prev.filter(x => x !== aid) : [...prev, aid]);
    };

    const totalPrice = useMemo(() => {
        const addonTotal = service.addons
            .filter(a => !a.included && checkedAddons.includes(a.id))
            .reduce((sum, a) => sum + a.price, 0);
        return service.price + addonTotal;
    }, [service, checkedAddons]);

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* ── Header ── */}
            <div className="relative h-72">
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-10 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="absolute bottom-6 left-6 right-6">
                    <span className="bg-brand text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg shadow-brand/20">
                        {service.tag}
                    </span>
                    <h1 className="text-white text-2xl font-[1000] mt-2 tracking-tight uppercase">{service.title}</h1>
                    <p className="text-white/80 text-xs font-bold">{service.subtitle}</p>
                </div>
            </div>

            <div className="px-5 -mt-4 relative z-10 space-y-6">
                {/* ── Quick Stats ── */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-content-subtle uppercase tracking-wider opacity-50 leading-none mb-1">Price</span>
                            <span className="text-lg font-[1000] text-content leading-none italic">₹{service.price}</span>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-content-subtle uppercase tracking-wider opacity-50 leading-none mb-1">Time</span>
                            <span className="text-sm font-black text-content leading-none">{service.duration}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                            <Star size={14} fill="#FBBF24" className="text-amber-400" />
                            <span className="text-sm font-[1000] text-content">{service.rating}</span>
                        </div>
                        <span className="text-[10px] font-bold text-content-subtle lowercase">{service.reviews.toLocaleString()} reviews</span>
                    </div>
                </div>

                {/* ── Description ── */}
                <div className="space-y-2 px-1">
                    <p className="text-[10px] font-black text-content uppercase tracking-[0.2em] opacity-40 italic">Overview</p>
                    <p className="text-[13px] font-semibold text-content-subtle leading-relaxed">
                        {service.description}
                    </p>
                </div>

                {/* ── Features List ── */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-brand" />
                        <h3 className="text-[11px] font-[1000] text-content uppercase tracking-widest">Service Guarantees</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {service.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                                <CheckCircle2 size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
                                <span className="text-[12px] font-bold text-content">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Add-ons / Customization ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <p className="text-[10px] font-black text-content uppercase tracking-[0.2em] opacity-40 italic">Extra Protection</p>
                            <h3 className="text-sm font-[1000] text-content uppercase tracking-tight">Make Your Service</h3>
                        </div>
                        <span className="text-[9px] font-black text-brand bg-brand/5 px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest">
                            <Zap size={10} fill="currentColor" /> Boost
                        </span>
                    </div>

                    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                        <div className="divide-y divide-gray-50">
                            {service.addons.map(addon => {
                                const isChecked = checkedAddons.includes(addon.id) || addon.included;
                                return (
                                    <div key={addon.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => !addon.included && toggleAddon(addon.id)}
                                                disabled={addon.included}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-brand border-brand shadow-md shadow-brand/20' : 'border-gray-200'
                                                    }`}
                                            >
                                                {isChecked && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                                            </button>
                                            <div>
                                                <p className="text-[13px] font-black text-content leading-none">{addon.name}</p>
                                                <p className="text-[10px] font-bold text-content-subtle mt-1">{addon.included ? 'Included' : `+₹${addon.price}`}</p>
                                            </div>
                                        </div>
                                        {!addon.included && (
                                            <button
                                                onClick={() => toggleAddon(addon.id)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isChecked ? 'bg-orange-50 text-brand rotate-180' : 'bg-gray-50 text-content-subtle rotate-0'
                                                    }`}
                                            >
                                                {isChecked ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Loyalty Offer ── */}
                {service.subscriptionOffer?.enabled && (
                    <div className="bg-[#FFFBEB] border-2 border-amber-100 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Gift size={120} />
                        </div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#B45309] uppercase tracking-[0.2em] leading-none mb-1">Exlusive Benefit</p>
                                <h3 className="text-lg font-[1000] text-content leading-none tracking-tight">LOYALTY REWARDS</h3>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-50">
                                <Gift size={22} className="text-amber-600" strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4 mt-2">
                            <div className="bg-white/60 backdrop-blur-sm p-3.5 rounded-2xl border border-white/80">
                                <p className="text-[14px] font-[1000] text-[#111827] leading-tight italic">
                                    {service.subscriptionOffer.label}
                                </p>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => navigate('/subscriptions')}
                                className="w-full h-12 bg-[#FF7D00] text-white rounded-2xl font-[1000] text-[11px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                            >
                                Avail Loyalty Offer <ChevronRight size={14} strokeWidth={3} />
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Booking Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-6 py-5 flex items-center justify-between pb-[calc(20px+constant(safe-area-inset-bottom))] pb-[calc(20px+env(safe-area-inset-bottom))]">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest leading-none">Total Payable</p>
                    <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-2xl font-[1000] text-content tracking-tighter italic">₹{totalPrice}</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">All Taxes Incl.</span>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/map')}
                    className="h-14 px-10 bg-brand text-white rounded-2xl font-[1000] text-[12px] uppercase tracking-[0.1em] shadow-xl shadow-brand/30 flex items-center gap-2 relative overflow-hidden"
                >
                    <span>Proceed <span className="opacity-50">to Slot</span></span>
                    <ChevronRight size={16} strokeWidth={4} />
                    <motion.div
                        animate={{ x: ['100%', '-200%'] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                        className="absolute inset-y-0 w-8 bg-white/10 skew-x-12 pointer-events-none"
                    />
                </motion.button>
            </div>
        </div>
    );
};

export default ServiceDetails;
