import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Star, Camera, ShieldCheck, Play, ArrowRight, 
    Check, Loader2, Heart, Share2, Maximize2, X, Info, 
    Zap, Sparkles, Eye, Lock
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { serviceAPI } from '../../../utils/api';

const CATEGORIES = ['All', 'Exterior', 'Interior', 'Ceramic', 'PPF'];

// --- Sub-component: Interactive Before/After Slider ---
const BeforeAfterSlider = ({ item, index }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef(null);

    const handleMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const position = ((x - rect.left) / rect.width) * 100;
        setSliderPos(Math.min(Math.max(position, 0), 100));
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-[4/3] overflow-hidden group/slider cursor-col-resize select-none bg-gray-900 rounded-xl"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
        >
            {/* After Image (Background) */}
            <div className="absolute inset-0">
                <img
                    src={item.afterImg || item.img || 'https://images.unsplash.com/photo-1605515298946-d062f2e9da53?auto=format&fit=crop&q=80&w=800'}
                    alt="After service"
                    className="w-full h-full object-cover brightness-110 contrast-110"
                />
                <div className="absolute bottom-3 right-3 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-white uppercase tracking-widest shadow-lg">AFTER</div>
            </div>

            {/* Before Image (Foreground with Clip-path) */}
            <div 
                className="absolute inset-0 z-10"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img
                    src={item.beforeImg || item.img || 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800'}
                    alt="Before service"
                    className="w-full h-full object-cover grayscale-[0.2] contrast-75 brightness-90"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-white uppercase tracking-widest shadow-lg">BEFORE</div>
                
                {/* AI Masking Simulation Overlay for License Plates */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[40%] h-[15%] mt-[25%] bg-black/40 backdrop-blur-2xl rounded-lg border border-white/20 flex flex-col items-center justify-center opacity-80 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        <Lock size={12} className="text-white/60 mb-0.5" />
                        <span className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em]">Privacy Shield Active</span>
                    </div>
                </div>
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-col-resize"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-black/5 group-hover/slider:scale-110 transition-transform">
                    <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-black/20 rounded-full" />
                        <div className="w-0.5 h-3 bg-black/20 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Interactive hint overlay */}
            {index === 0 && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                >
                    <div className="flex flex-col items-center">
                        <motion.div 
                            animate={{ x: [-20, 20, -20] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <ArrowRight size={32} className="text-white drop-shadow-2xl" />
                        </motion.div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] mt-2">Slide to compare</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const Portfolio = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [likedItems, setLikedItems] = useState(new Set());

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                setLoading(true);
                const res = await serviceAPI.getPortfolio();
                if (res.status === 'success') {
                    setPortfolioItems(res.data.portfolio);
                }
            } catch (err) {
                console.error("Failed to fetch portfolio", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();

        // Load liked items from local storage
        const savedLikes = JSON.parse(localStorage.getItem('portfolio_likes') || '[]');
        setLikedItems(new Set(savedLikes));
    }, []);

    const handleLike = async (id, e) => {
        e.stopPropagation();
        if (likedItems.has(id)) return;

        try {
            await serviceAPI.likePortfolioItem(id);
            const newLikedItems = new Set(likedItems).add(id);
            setLikedItems(newLikedItems);
            localStorage.setItem('portfolio_likes', JSON.stringify(Array.from(newLikedItems)));
            
            // Update local state for immediate feedback
            setPortfolioItems(prev => prev.map(item => 
                item._id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
            ));
        } catch (err) {
            console.error("Failed to like item", err);
        }
    };

    const filteredItems = activeCategory === 'All'
        ? portfolioItems
        : portfolioItems.filter(item => item.category === activeCategory);

    return (
        <MobileLayout hideNav={false}>
            <div className="min-h-screen bg-[#F8F9FB] pb-24 font-outfit overflow-x-hidden">
                {/* Header */}
                <header className="px-5 pt-5 pb-3 bg-white/80 backdrop-blur-xl border-b border-black/[0.04] sticky top-0 z-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-black/[0.04] active:scale-90 transition-all">
                                <ChevronLeft size={18} className="text-black" strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className="text-[16px] font-[1000] text-black tracking-tight uppercase leading-none">Glass Gallery</h1>
                                <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mt-1">The Clean2Wash Difference</p>
                            </div>
                        </div>
                        <div className="bg-black/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 grayscale opacity-50">
                            <ShieldCheck size={12} className="text-black" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Privacy Protected</span>
                        </div>
                    </div>
                </header>

                <div className="py-2">
                    {/* Hero Showcase */}
                    <div className="px-5 mb-6">
                        <div className="relative bg-[#0A0A0A] rounded-2xl p-6 overflow-hidden shadow-2xl">
                            <div className="absolute right-[-10%] top-[-20%] w-48 h-48 bg-brand/30 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-1.5 bg-brand/20 text-brand px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 border border-brand/20">
                                    <Sparkles size={8} /> Pro Transformation
                                </span>
                                <h2 className="text-[22px] font-[1000] text-white uppercase tracking-tighter leading-[1] mb-2">Masterpiece<br />Collection</h2>
                                <p className="text-[10px] font-medium text-white/50 leading-relaxed max-w-[70%]">Explore the deep cleaning expertise and ceramic glow that defines our work.</p>
                            </div>
                            <Camera size={140} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 pointer-events-none" />
                        </div>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 px-5">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`flex-shrink-0 px-5 py-2 rounded-xl text-[10px] font-[1000] uppercase tracking-widest transition-all duration-300 ${activeCategory === category
                                    ? 'bg-black text-white shadow-xl shadow-black/20 translate-y-[-2px]'
                                    : 'bg-white text-black/40 border border-black/[0.04] hover:bg-gray-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Portfolio Items */}
                    <div className="px-5 space-y-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="p-1 rounded-full border-t-2 border-brand mb-4"
                                >
                                    <Loader2 size={32} className="text-brand opacity-20" />
                                </motion.div>
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">Processing Visuals...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-black/[0.04]">
                                <Eye size={40} className="text-black/5 mb-4" />
                                <p className="text-[11px] font-[1000] text-black/40 uppercase tracking-widest">No Masterpieces yet</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredItems.map((item, idx) => (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        viewport={{ once: true }}
                                        className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-black/[0.03]"
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-black/[0.02]">
                                                    <Zap size={18} className="text-brand" fill="currentColor" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">{item.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">{item.vehicle}</span>
                                                        <div className="w-1 h-1 rounded-full bg-black/10" />
                                                        <span className="text-[8px] font-black text-brand/60 uppercase tracking-widest">{item.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleLike(item._id, e)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                                                    likedItems.has(item._id) 
                                                        ? 'bg-rose-50 text-rose-500 border-rose-100 scale-105' 
                                                        : 'bg-white text-black/40 border-black/[0.05] active:scale-95'
                                                }`}
                                            >
                                                <Heart size={12} fill={likedItems.has(item._id) ? "currentColor" : "none"} />
                                                <span className="text-[10px] font-black">{item.likes || 0}</span>
                                            </button>
                                        </div>

                                        {/* Main Visual: Before/After Slider */}
                                        <BeforeAfterSlider item={item} index={idx} />

                                        {/* Card Footer / Metadata */}
                                        <div className="p-4 bg-gray-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-black/5 px-2 py-1 rounded-lg">
                                                    <ShieldCheck size={10} className="text-black/30" />
                                                    <span className="text-[7px] font-black text-black/30 uppercase tracking-widest">Privacy Mask Active</span>
                                                </div>
                                                <div className="text-[7px] font-black text-black/20 uppercase tracking-widest">
                                                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedItem(item)}
                                                className="w-8 h-8 rounded-lg bg-white border border-black/[0.05] flex items-center justify-center active:scale-90 transition-all text-black/40"
                                            >
                                                <Maximize2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* --- Lightbox Modal --- */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-5"
                        >
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-8 right-5 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"
                            >
                                <X size={24} />
                            </button>

                            <div className="w-full max-w-lg mb-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center">
                                        <Sparkles size={24} className="text-brand" />
                                    </div>
                                    <div>
                                        <h2 className="text-white text-xl font-[1000] uppercase tracking-tighter leading-none">{selectedItem.title}</h2>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{selectedItem.vehicle} • {selectedItem.category}</p>
                                    </div>
                                </div>
                                <BeforeAfterSlider item={selectedItem} index={1} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <Info size={16} className="text-brand mb-2" />
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Privacy Notice</p>
                                    <p className="text-white/70 text-[9px] leading-relaxed">This image uses Clean2Wash AI masking to protect the customer's identity.</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                                        <span className="text-white font-black text-xs">5.0 Rating</span>
                                    </div>
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">Verified Service</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx="true">{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2.5s infinite linear;
                }
            `}</style>
        </MobileLayout>
    );
};

export default Portfolio;
