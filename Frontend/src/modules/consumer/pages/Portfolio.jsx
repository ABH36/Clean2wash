import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Camera, ShieldCheck, Play, ArrowRight, Check } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const CATEGORIES = ['All', 'Exterior', 'Interior', 'Ceramic', 'PPF'];

const PORTFOLIO_ITEMS = [
    {
        id: 1,
        category: 'Exterior',
        img: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&q=80',
        title: 'Deep Chrome Restoration',
        vehicle: 'Mercedes S-Class',
        likes: 124,
        plateClass: 'bottom-[12%] left-1/2 -translate-x-1/2 w-[22%] h-[12%]'
    },
    {
        id: 2,
        category: 'Ceramic',
        img: 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=600&q=80',
        title: '9H Graphene Coating',
        vehicle: 'BMW M4',
        likes: 341,
        plateClass: 'bottom-[25%] left-1/2 -translate-x-1/2 w-[18%] h-[8%]'
    },
    {
        id: 3,
        category: 'Interior',
        beforeImg: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80', 
        afterImg: 'https://images.unsplash.com/photo-1503376711681-4202e86cc68a?w=600&q=80', 
        title: 'Leather Condition & Steam',
        vehicle: 'Audi Q7',
        likes: 89,
    },
    {
        id: 4,
        category: 'Exterior',
        img: 'https://images.unsplash.com/photo-1605164599901-aba17e7c003a?w=600&q=80',
        title: 'Foam Cannon Wash',
        vehicle: 'Porsche 911',
        likes: 412,
        singleImage: true,
        plateClass: 'bottom-[15%] left-1/2 -translate-x-1/2 w-[20%] h-[10%]'
    },
    {
        id: 5,
        category: 'PPF',
        img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        title: 'Matte PPF Installation',
        vehicle: 'Range Rover Velar',
        likes: 275,
        plateClass: 'bottom-[18%] left-1/2 -translate-x-1/2 w-[16%] h-[8%]'
    }
];

const Portfolio = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    
    const filteredItems = activeCategory === 'All' 
        ? PORTFOLIO_ITEMS 
        : PORTFOLIO_ITEMS.filter(item => item.category === activeCategory);

    return (
        <MobileLayout hideNav={false}>
            <div className="min-h-screen bg-[#F8F9FB] pb-24 font-outfit">
                {/* Header */}
                <header className="px-5 pt-5 pb-3 bg-white border-b border-black/[0.04] sticky top-0 z-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button onClick={() => navigate(-1)} className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-black/[0.02] active:scale-95 transition-transform">
                                <ChevronLeft size={16} className="text-black" strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className="text-[14px] font-[1000] text-black tracking-tight uppercase leading-none">Our Portfolio</h1>
                                <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em] mt-0.5 line-clamp-1">The clean2wash difference</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="py-4">
                    {/* Intro Banner */}
                    <div className="bg-[#1A1A1A] px-5 py-6 mb-5 relative overflow-hidden shadow-2xl">
                        <div className="absolute right-[-20%] top-[-20%] w-32 h-32 bg-brand/30 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-[18px] font-[1000] text-white uppercase tracking-tighter leading-[1.05] mb-1.5">Visual<br/>Transformation</h2>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-3">See the magic happen</p>
                            <button onClick={() => navigate('/services')} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-[1000] uppercase tracking-widest active:scale-95 transition-transform inline-flex items-center gap-2">
                                Book Now <ArrowRight size={10} strokeWidth={3} />
                            </button>
                        </div>
                        <Camera size={90} className="absolute -right-4 -bottom-4 text-white/5 rotate-12 pointer-events-none" />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 mb-5 px-5">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-[10px] text-[9px] font-[1000] uppercase tracking-widest transition-all ${
                                    activeCategory === category 
                                        ? 'bg-black text-white shadow-xl shadow-black/10' 
                                        : 'bg-white text-black/40 border border-black/[0.05]'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Gallery Grid */}
                    <div className="space-y-2.5">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white py-2.5 border-y border-black/[0.04] shadow-sm"
                                >
                                    <div className="mb-2 px-5 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-[13px] font-[1000] text-black uppercase tracking-tight leading-none">{item.title}</h3>
                                            <p className="text-[8px] font-black text-black/30 uppercase tracking-widest mt-0.5">{item.vehicle}</p>
                                        </div>
                                        <div className="bg-[#FFF6E9] px-2 py-0.5 rounded-[6px] flex items-center gap-1 border border-[#F29F05]/20">
                                            <Star size={8} className="text-[#F29F05]" fill="currentColor" />
                                            <span className="text-[8px] font-black text-[#F29F05]">{item.likes}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative w-full overflow-hidden group shadow-inner">
                                        {item.singleImage ? (
                                            <div className="relative aspect-[8/3] sm:aspect-[3/1] w-full">
                                                <img src={item.afterImg || item.img} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex w-full aspect-[8/3] sm:aspect-[3/1] relative">
                                                {/* Before */}
                                                <div className="w-1/2 h-full relative overflow-hidden border-r border-white z-10">
                                                    <img src={item.beforeImg || item.img} alt="Before" className={`absolute w-[200%] max-w-none h-full object-cover origin-top-left ${item.img ? 'sepia-[0.3] contrast-75 brightness-90 grayscale-[0.2] blur-[0.5px]' : 'grayscale-[0.8] contrast-125'}`} />
                                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[7px] font-black text-white uppercase tracking-widest shadow-lg shadow-black/20">Before</div>
                                                </div>
                                                {/* After */}
                                                <div className="w-1/2 h-full relative overflow-hidden">
                                                    <img src={item.afterImg || item.img} alt="After" className={`absolute right-0 w-[200%] max-w-none h-full object-cover origin-top-right ${item.img ? 'brightness-110 contrast-125 saturate-150' : 'brightness-110 contrast-125 saturate-150'}`} />
                                                    <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[7px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">After</div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Simulated Plate Blur for realism */}
                                        {item.plateClass && (
                                            <div className={`absolute ${item.plateClass} backdrop-blur-xl bg-black/20 rounded-sm shadow-inner overflow-hidden z-20 flex items-center justify-center border border-white/10`}>
                                                <div className="w-full h-full opacity-30 bg-[#000000] mosaic-effect" />
                                            </div>
                                        )}
                                        
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                        
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2 px-5">
                                        <span className="text-[8px] font-[1000] text-black/40 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border border-black/[0.03]">{item.category}</span>
                                        <button onClick={() => navigate('/services')} className="text-[9px] font-[1000] text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform bg-gray-100 px-2.5 py-1 rounded-[6px] border border-gray-200">
                                            Book<ArrowRight size={10} strokeWidth={3} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Portfolio;
