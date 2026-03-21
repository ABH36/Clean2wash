import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ShieldCheck, Lock } from 'lucide-react';

const BeforeAfterSlider = ({ before, after, title = "Service Evidence", showPrivacyShield = true }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef(null);

    const handleMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const position = ((x - rect.left) / rect.width) * 100;
        setSliderPos(Math.min(Math.max(position, 0), 100));
    };

    // Handle array or string inputs
    const beforeImg = Array.isArray(before) ? before[0] : before;
    const afterImg = Array.isArray(after) ? after[0] : after;

    if (!beforeImg && !afterImg) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">{title}</span>
                <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded-md">
                    <ShieldCheck size={10} className="text-content-subtle" />
                    <span className="text-[7px] font-black text-content-subtle uppercase tracking-widest">Visual Chain Secured</span>
                </div>
            </div>

            <div 
                ref={containerRef}
                className="relative w-full aspect-[4/3] overflow-hidden group/slider cursor-col-resize select-none bg-gray-900 rounded-2xl shadow-xl border border-gray-100/10"
                onMouseMove={handleMove}
                onTouchMove={handleMove}
            >
                {/* After Image (Background) */}
                <div className="absolute inset-0">
                    <img
                        src={afterImg || 'https://images.unsplash.com/photo-1621905230591-d35d39d949ad?auto=format&fit=crop&q=80&w=800'}
                        alt="After service"
                        className="w-full h-full object-cover brightness-105 contrast-105"
                    />
                    <div className="absolute bottom-3 right-3 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-white uppercase tracking-widest shadow-lg z-30">AFTER</div>
                </div>

                {/* Before Image (Foreground with Clip-path) */}
                <div 
                    className="absolute inset-0 z-10"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                    <img
                        src={beforeImg || 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800'}
                        alt="Before service"
                        className="w-full h-full object-cover grayscale-[0.2] contrast-90 brightness-90"
                    />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-white uppercase tracking-widest shadow-lg">BEFORE</div>
                    
                    {/* Privacy Shield Overlay */}
                    {showPrivacyShield && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[45%] h-[15%] mt-[25%] bg-black/30 backdrop-blur-2xl rounded-lg border border-white/10 flex flex-col items-center justify-center opacity-60">
                                <Lock size={10} className="text-white/60 mb-0.5" />
                                <span className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em]">Privacy Mask Active</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Slider Handle */}
                <div 
                    className="absolute inset-y-0 z-40 w-0.5 bg-white shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-black/5 group-hover/slider:scale-110 transition-all duration-300">
                        <ArrowLeftRight size={16} className="text-black/40" strokeWidth={3} />
                    </div>
                </div>

                {/* Hint Overlay (Auto-hides) */}
                <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/30 backdrop-blur-sm"
                >
                    <div className="flex flex-col items-center">
                        <motion.div 
                            animate={{ x: [-15, 15, -15] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <ArrowLeftRight size={32} className="text-white drop-shadow-2xl" />
                        </motion.div>
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] mt-3 italic">Slide to Witness</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BeforeAfterSlider;
