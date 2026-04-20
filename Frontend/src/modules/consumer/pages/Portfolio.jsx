import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Star, Camera, ShieldCheck, Play, ArrowRight, 
    Check, Loader2, Heart, Share2, Maximize2, X, Info, 
    Zap, Sparkles, Eye, Lock, RefreshCw, Layers
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { serviceAPI } from '../../../utils/api';
import BeforeAfterSlider from '../../../components/BeforeAfterSlider';

const CATEGORIES = ['All', 'Exterior', 'Interior', 'Ceramic', 'PPF'];

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
            <div className="min-h-screen bg-slate-50 pb-24 font-sans overflow-x-hidden">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white/5 sticky top-0 z-[60] border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/5 active:scale-95 transition-all">
                                <ChevronLeft size={22} className="text-slate-900" />
                            </button>
                            <div>
                                <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Showcase</h1>
                                <p className="text-[11px] text-brand font-bold mt-1.5">Masterpiece collection</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <ShieldCheck size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400">Privacy active</span>
                        </div>
                    </div>
                </header>

                <div className="pt-5">
                    {/* ── Category Selectors ── */}
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-5 px-5">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`flex-shrink-0 px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${activeCategory === category
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/[0.02]'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* ── Gallery Feed ── */}
                    <div className="px-4 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="p-3 rounded-full bg-white/5 border border-white/5  mb-4"
                                >
                                    <RefreshCw size={24} className="text-brand" />
                                </motion.div>
                                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Loading visuals</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <Layers size={40} className="text-slate-100 mb-4" />
                                <p className="text-[12px] font-bold text-slate-400">No masterpieces recorded</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredItems.map((item, idx) => (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white/5 rounded-[1.8rem] overflow-hidden border border-white/5  group"
                                    >
                                        {/* Card Top - Compact */}
                                        <div className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-white/5">
                                                    <Zap size={18} className="text-brand" fill="currentColor" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[13px] font-bold text-slate-900 leading-none mb-1">{item.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400">{item.vehicle}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-[9px] font-bold text-slate-300">{item.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleLike(item._id, e)}
                                                className={`flex items-center gap-1 h-7 px-2.5 rounded-full transition-all ${
                                                    likedItems.has(item._id) 
                                                        ? 'bg-rose-50 text-rose-500' 
                                                        : 'bg-slate-50 text-slate-400'
                                                }`}
                                            >
                                                <Heart size={12} fill={likedItems.has(item._id) ? "currentColor" : "none"} />
                                                <span className="text-[10px] font-bold">{item.likes || 0}</span>
                                            </button>
                                        </div>

                                        {/* Before/After Slider */}
                                        <div className="relative">
                                            <BeforeAfterSlider 
                                                before={item.beforeImg || item.img} 
                                                after={item.afterImg || item.img} 
                                                title="Visual details" 
                                                maskPosition={item.plateClass || 'center'}
                                            />
                                        </div>

                                        {/* Card Footer - Compact */}
                                        <div className="p-3.5 flex items-center justify-between border-t border-gray-50 bg-white/50">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-lg">
                                                    <ShieldCheck size={10} className="text-brand" />
                                                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">Privacy on</span>
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-300">
                                                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedItem(item)}
                                                className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-slate-400 active:scale-90 transition-all"
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

                {/* ── Immersive Lightbox ── */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                        >
                            <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-6 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                                <X size={24} />
                            </button>

                            <div className="w-full max-w-lg mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                                        <Sparkles size={24} className="text-brand" />
                                    </div>
                                    <div>
                                        <h2 className="text-white text-xl font-bold leading-none">{selectedItem.title}</h2>
                                        <p className="text-white/40 text-[11px] font-medium mt-2">{selectedItem.vehicle} • {selectedItem.category}</p>
                                    </div>
                                </div>
                                <div className="rounded-[1.8rem] overflow-hidden border border-white/10 shadow-2xl">
                                    <BeforeAfterSlider 
                                        before={selectedItem.beforeImg || selectedItem.img} 
                                        after={selectedItem.afterImg || selectedItem.img} 
                                        maskPosition={selectedItem.plateClass || 'center'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                    <ShieldCheck size={18} className="text-brand mb-2" />
                                    <p className="text-white/30 text-[9px] font-bold tracking-widest mb-1 capitalize">Privacy Shield</p>
                                    <p className="text-white/60 text-[10px] leading-relaxed">Identity features are automatically masked by our AI.</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={14} className="text-yellow-400" fill="currentColor" />
                                        <span className="text-white font-bold text-sm">5.0 Star work</span>
                                    </div>
                                    <p className="text-white/30 text-[9px] font-bold tracking-widest capitalize">Verified results</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx="true">{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </MobileLayout>
    );
};

export default Portfolio;
