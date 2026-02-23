import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Search, MapPin, Star, Clock,
    Filter, SlidersHorizontal, Navigation, ArrowRight,
    Briefcase, ShieldCheck, Zap, Droplets
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const STUDIOS = [
    {
        id: 'studio-1',
        name: 'Glow Auto Studio',
        location: 'Indiranagar · 2.4 km',
        rating: 4.9,
        reviews: 840,
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
        tags: ['Ceramic Pro', 'Eco Wash'],
        price: '₹1,299',
        isElite: true,
        features: ['Pickup Available', 'CCTV Monitor', 'Waiting Lounge']
    },
    {
        id: 'studio-2',
        name: 'CarWash Signature Hub',
        location: 'HSR Layout · 0.8 km',
        rating: 4.8,
        reviews: 1200,
        image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d59085?w=600&q=80',
        tags: ['Express Wash', 'Foam Detail'],
        price: '₹899',
        isElite: true,
        features: ['Pickup Available', 'Snack Bar', 'Fast Lane']
    },
    {
        id: 'studio-3',
        name: 'The Detailer Lab',
        location: 'Koramangala · 3.2 km',
        rating: 4.7,
        reviews: 450,
        image: 'https://images.unsplash.com/photo-1552933529-e359b247726e?w=600&q=80',
        tags: ['Interior Deep', 'Leather Care'],
        price: '₹1,499',
        isElite: false,
        features: ['Self-Drop only', 'Expert Polish']
    },
];

const StudioDiscovery = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    return (
        <MobileLayout hideNav>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Nearby Studios</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Top-rated centers near you</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                        <Search size={16} className="text-content-subtle" strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Search studios..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent text-xs font-bold text-content outline-none placeholder:font-medium placeholder:text-content-subtle"
                        />
                    </div>
                    <button className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-content">
                        <SlidersHorizontal size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pt-4 pb-1 scrollbar-hide">
                    {['All', 'Elite', 'Fastest', 'Budget-Friendly'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeFilter === f ? 'bg-brand text-white border-brand shadow-md' : 'bg-white border-gray-100 text-content-muted hover:bg-gray-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-6 pb-24">
                {/* ── Map Teaser ── */}
                <div className="bg-content rounded-2xl p-4 shadow-lg flex items-center justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-white font-black text-sm tracking-tight mb-1">View on Map</h3>
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">See studios around you</p>
                    </div>
                    <button onClick={() => navigate('/map?type=vendor')} className="relative z-10 w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Navigation size={18} fill="white" />
                    </button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full" />
                </div>

                {/* ── Studio List ── */}
                <div className="space-y-4">
                    {STUDIOS.map((studio, i) => (
                        <motion.div
                            key={studio.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/map?studio=${studio.id}&type=vendor&price=${studio.price}`)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden group cursor-pointer"
                        >
                            {/* Image Header */}
                            <div className="relative h-44 overflow-hidden">
                                <img src={studio.image} alt={studio.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                {studio.isElite && (
                                    <div className="absolute top-3 left-3 bg-brand px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <Zap size={10} className="text-white" fill="white" />
                                        <span className="text-white text-[8px] font-black uppercase tracking-widest">Elite Service</span>
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                    <div>
                                        <h3 className="text-white text-lg font-black tracking-tight leading-none mb-1">{studio.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                                                <Star size={10} className="text-amber-400" fill="currentColor" />
                                                <span className="text-white text-[10px] font-black">{studio.rating}</span>
                                            </div>
                                            <span className="text-white/60 text-[10px] font-bold">{studio.location}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl shadow-lg">
                                        <p className="text-[7px] font-black text-content-subtle uppercase tracking-widest leading-none mb-0.5">Starts at</p>
                                        <p className="text-brand font-black text-base leading-none italic">{studio.price}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Footer */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {studio.features.slice(0, 2).map(f => (
                                        <div key={f} className="flex items-center gap-1 text-[9px] font-black text-content-subtle uppercase tracking-wider">
                                            <ShieldCheck size={12} className="text-brand" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all">
                                    <ArrowRight size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Promotion ── */}
                <div className="bg-gray-100 rounded-2xl p-5 border border-dashed border-gray-300 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Droplets size={24} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black text-xs text-content uppercase tracking-widest">Become a Partner</h4>
                        <p className="text-[10px] font-bold text-content-subtle mt-1">List your studio on CarWash and reach 10x customers.</p>
                    </div>
                    <button onClick={() => navigate('/vendor/signup')} className="text-brand text-[8px] font-black uppercase tracking-widest border-b border-brand/30">Join Us</button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default StudioDiscovery;
