import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, Shield } from 'lucide-react';

const SLIDES = [
    {
        id: 0,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        tag: 'Smart Vehicle 360°',
        title: 'Spotless.\nAt Your\nDoorstep.',
        desc: 'AI-matched expert captains bring a 5-star wash to wherever your car is parked.',
    },
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
        tag: 'Eco-Certified',
        title: 'Clean Car.\nCleaner\nPlanet.',
        desc: 'OECD-approved, waterless & biodegradable formula. Zero runoff, zero guilt.',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
        tag: '₹5L Protection',
        title: 'Every Wash\nFully\nInsured.',
        desc: 'Hoora Ecosystem Guarantee covers your vehicle through every single service.',
    },
];

const Onboarding = () => {
    const navigate = useNavigate();
    const [idx, setIdx] = useState(0);
    const slide = SLIDES[idx];

    const next = () => {
        if (idx < SLIDES.length - 1) setIdx(idx + 1);
        else navigate('/login');
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">

            {/* Background image */}
            <AnimatePresence mode="wait">
                <motion.img
                    key={slide.image}
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between flex-1 p-6">

                {/* Top */}
                <div className="flex justify-between items-center pt-8">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                        <Shield size={12} className="text-brand" />
                        <span className="text-white/80 text-[9px] font-black uppercase tracking-widest">Hoora</span>
                    </div>
                    <button onClick={() => navigate('/login')} className="text-white/50 text-[10px] font-black uppercase tracking-widest">
                        Skip
                    </button>
                </div>

                {/* Body */}
                <div>
                    <AnimatePresence mode="wait">
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                            <span className="inline-block bg-brand/90 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-4">
                                {slide.tag}
                            </span>
                            <h1 className="text-white text-4xl font-black leading-none tracking-tighter mb-4 whitespace-pre-line">
                                {slide.title}
                            </h1>
                            <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">
                                {slide.desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots */}
                    <div className="flex gap-2 mt-6 mb-6">
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setIdx(i)}
                                className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-brand w-8' : 'bg-white/20 w-1.5'}`} />
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                        className="w-full h-14 bg-brand text-white rounded-2xl font-black text-base shadow-lg shadow-brand/30 flex items-center justify-between px-6">
                        <span>{idx < SLIDES.length - 1 ? 'Continue' : 'Get Started'}</span>
                        <div className="bg-white/20 p-2 rounded-xl">
                            <ChevronLeft size={16} strokeWidth={3} className="text-white rotate-180" />
                        </div>
                    </motion.button>

                    <div className="flex items-center gap-2 justify-center mt-4">
                        <Phone size={12} className="text-white/30" />
                        <p className="text-white/30 text-[10px] font-bold">Login with your phone number</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Onboarding;
