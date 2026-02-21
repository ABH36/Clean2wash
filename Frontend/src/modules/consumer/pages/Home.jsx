import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star, Clock,
    ShieldCheck, Droplets, Zap, ArrowRight, Phone, Car, Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';

const IMAGES = {
    heroCar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    foamWash: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80',
    interiorClean: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
    tireshine: 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=600&q=80',
    captain1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    captain2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    captain3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
};

const Home = () => {
    const navigate = useNavigate();

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-3 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <button className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                            <MapPin size={15} className="text-brand" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest leading-none">Delivering To</p>
                            <p className="text-sm font-black text-content flex items-center gap-1 mt-0.5">
                                HSR Layout <ChevronDown size={11} className="text-brand" strokeWidth={3} />
                            </p>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Bell size={16} className="text-content-muted" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
                        </button>
                        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-xl overflow-hidden border-2 border-brand/20">
                            <img src={IMAGES.captain1} alt="User" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="pb-24 px-4 space-y-4 pt-4">

                {/* ── Hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden relative shadow-soft border border-gray-100"
                    style={{ height: 280 }}
                >
                    <img src={IMAGES.heroCar} alt="Car Wash" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="self-start flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-[9px] font-black uppercase tracking-widest">Captains Nearby</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">Smart Vehicle 360°</p>
                            <h1 className="text-white text-3xl font-black leading-tight tracking-tighter mb-4">
                                Spotless.<br />At Your <span className="text-brand">Doorstep.</span>
                            </h1>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/services')}
                                className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg shadow-brand/30"
                            >
                                Book a Wash
                                <div className="bg-white/20 p-1 rounded-lg"><ArrowRight size={13} strokeWidth={3} /></div>
                            </motion.button>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5">
                        <Clock size={12} className="text-brand" />
                        <span className="text-[10px] font-black text-content">ETA 20 min</span>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: '2.5M+', sub: 'Downloads' },
                        { label: '4.8★', sub: 'Rating' },
                        { label: '60+', sub: 'Cities' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-soft">
                            <p className="text-lg font-black text-content tracking-tight leading-none">{s.label}</p>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-wider mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Services ── */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-black tracking-tight text-content">Our Services</h2>
                        <button onClick={() => navigate('/services')} className="flex items-center gap-1 text-brand text-[10px] font-black uppercase tracking-widest">
                            View All <ChevronRight size={11} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Hero service card */}
                    <motion.div
                        whileTap={{ scale: 0.98 }} onClick={() => navigate('/map?type=instant&service=eco')}
                        className="rounded-2xl overflow-hidden relative shadow-soft border border-gray-100 mb-3 cursor-pointer"
                        style={{ height: 160 }}
                    >
                        <img src={IMAGES.foamWash} alt="Eco Wash" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-1.5 bg-brand px-2.5 py-1 rounded-lg self-start mb-2">
                                <Zap size={11} className="text-white" fill="white" />
                                <span className="text-white text-[8px] font-black uppercase tracking-widest">Instant</span>
                            </div>
                            <h3 className="text-white text-xl font-black tracking-tight leading-none mb-1">Eco Doorstep Wash</h3>
                            <p className="text-white/60 text-[10px] font-bold italic mb-3">Captain in 30 min</p>
                            <div className="flex items-center justify-between">
                                <span className="text-white font-black text-base">Starts ₹299</span>
                                <div className="bg-white/20 p-2 rounded-lg"><ArrowRight size={14} className="text-white" strokeWidth={2.5} /></div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3">
                        <MiniCard image={IMAGES.interiorClean} label="Interior Deep Clean" price="₹699" badge="Popular" onClick={() => navigate('/services')} />
                        <MiniCard image={IMAGES.tireshine} label="Tire & Rim Shine" price="₹199" badge="New" onClick={() => navigate('/services')} />
                    </div>
                </div>

                {/* ── Offer Banner ── */}
                <div className="bg-content rounded-2xl p-5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Percent size={12} className="text-accent-yellow" strokeWidth={2.5} />
                            <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">New User Offer</span>
                        </div>
                        <h3 className="text-white text-2xl font-black tracking-tight leading-tight mb-1">
                            100% <span className="text-brand">Cashback</span> on First Wash
                        </h3>
                        <p className="text-white/40 text-[10px] font-bold mb-4">
                            Code: <span className="text-accent-yellow font-black">HOORAFIRST</span>
                        </p>
                        <button onClick={() => navigate('/services')} className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-lg">
                            Claim Now <ArrowRight size={13} strokeWidth={3} />
                        </button>
                    </div>
                    <Car size={120} className="absolute -right-6 top-1/2 -translate-y-1/2 text-white/5" />
                </div>

                {/* ── Captains ── */}
                <div>
                    <h2 className="text-lg font-black tracking-tight text-content mb-3">Top Captains Near You</h2>
                    <div className="space-y-2">
                        {[
                            { name: 'Rahul Sharma', rating: 4.9, washes: '2.4k', dist: '0.8 km', img: IMAGES.captain1, badge: 'Elite' },
                            { name: 'Amit Singh', rating: 4.8, washes: '1.8k', dist: '1.2 km', img: IMAGES.captain2, badge: 'Pro' },
                            { name: 'Vikram Das', rating: 4.7, washes: '1.1k', dist: '2.5 km', img: IMAGES.captain3, badge: null },
                        ].map((c) => <CaptainCard key={c.name} {...c} onClick={() => navigate('/map')} />)}
                    </div>
                </div>

                {/* ── Trust ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                    <h2 className="text-base font-black tracking-tight text-content mb-4">Why <span className="text-brand">Hoora?</span></h2>
                    <div className="space-y-4">
                        {[
                            { icon: <ShieldCheck size={18} className="text-green-500" />, title: 'Insured Washes', desc: "Covered under Hoora's ₹5L vehicle protection policy." },
                            { icon: <Droplets size={18} className="text-blue-500" />, title: 'Eco-Tech Formula', desc: 'Waterless, OECD-certified, 100% biodegradable products.' },
                            { icon: <Zap size={18} className="text-brand" fill="currentColor" />, title: 'Instant Dispatch', desc: 'AI matching gets a captain at your door in 30 mins.' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">{item.icon}</div>
                                <div>
                                    <h3 className="font-black text-sm text-content tracking-tight">{item.title}</h3>
                                    <p className="text-[10px] font-bold text-content-subtle leading-relaxed mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Support ── */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Phone size={17} className="text-white" fill="white" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">24/7 Support</p>
                        <p className="text-sm font-black text-content">+91 73509 82181</p>
                    </div>
                    <button className="ml-auto bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest text-content">Call</button>
                </div>

            </div>
        </MobileLayout>
    );
};

const MiniCard = ({ image, label, price, badge, onClick }) => (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
        className="rounded-xl overflow-hidden relative shadow-soft border border-gray-100 cursor-pointer" style={{ height: 130 }}>
        <img src={image} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
            {badge && <span className="self-start bg-accent-yellow text-black text-[8px] font-black px-2 py-0.5 rounded-lg">{badge}</span>}
            <div>
                <p className="text-white text-[11px] font-black leading-tight">{label}</p>
                <p className="text-brand-light text-sm font-black">{price}</p>
            </div>
        </div>
    </motion.div>
);

const CaptainCard = ({ name, rating, washes, dist, img, badge, onClick }) => (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
        className="w-full bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3 flex items-center gap-3 text-left group hover:border-brand/20 transition-colors">
        <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100">
                <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-sm text-content tracking-tight truncate">{name}</h3>
                {badge && <span className="bg-brand/10 text-brand text-[8px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">{badge}</span>}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><Star size={10} className="text-yellow-500" fill="currentColor" /><span className="text-[10px] font-black text-content">{rating}</span></div>
                <span className="text-content-subtle text-[9px] font-bold">{washes} washes</span>
                <span className="text-brand text-[9px] font-black">{dist}</span>
            </div>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} className="text-gray-300 group-hover:text-brand flex-shrink-0" />
    </motion.button>
);

export default Home;
