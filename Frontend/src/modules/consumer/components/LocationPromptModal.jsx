import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LocationPromptModal = () => {
    const { 
        showLocationPrompt, 
        setShowLocationPrompt, 
        detectCurrentLocation, 
        saveLocation,
        loading: contextLoading 
    } = useGeoLocation();
    
    const [isDetecting, setIsDetecting] = useState(false);
    const navigate = useNavigate();

    const handleDetectLocation = async () => {
        try {
            setIsDetecting(true);
            const coords = await detectCurrentLocation();
            if (coords) {
                await saveLocation(coords.lat, coords.lng, 'My Sector');
                toast.success('Sector synchronized! ✨');
                setShowLocationPrompt(false);
            }
        } catch (error) {
            console.error('Detection failed:', error);
            toast.error('GSP Uplink Failed. Use manual entry.');
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <AnimatePresence>
            {showLocationPrompt && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center px-4 pb-10">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowLocationPrompt(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-[420px] bg-slate-900 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_-24px_60px_rgba(0,0,0,0.5)]"
                    >
                        {/* Interactive Swipe Indicator */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/10" />

                        <div className="p-10">
                            {/* Tactical Header */}
                            <div className="flex flex-col items-center text-center mb-10 pt-4">
                                <div className="w-20 h-20 rounded-[2rem] bg-brand/10 flex items-center justify-center text-brand mb-6 relative">
                                    <div className="absolute inset-0 bg-brand/20 rounded-[2rem] animate-ping opacity-30 pointer-events-none" />
                                    <MapPin size={40} strokeWidth={2.5} />
                                </div>
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-2 leading-none">Sector Discovery</p>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                                    Set Your <span className="text-brand">Service</span> Zone
                                </h2>
                                <p className="text-xs font-bold text-white/40 max-w-[280px] leading-relaxed">
                                    We need your precise coordinates to synchronize detailing experts in your sector.
                                </p>
                            </div>

                            {/* Action Controllers */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting || contextLoading}
                                    className="w-full h-18 bg-brand text-black rounded-3xl font-black text-[13px] uppercase tracking-widest flex items-center justify-between px-8 group active:scale-95 transition-all shadow-xl shadow-brand/10 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-4">
                                        {isDetecting ? <Loader2 size={24} className="animate-spin" /> : <Navigation size={22} fill="currentColor" />}
                                        <span>{isDetecting ? 'Syncing...' : 'Detect Sector'}</span>
                                    </div>
                                    <ChevronRight size={20} />
                                </button>

                                <button
                                    onClick={() => { setShowLocationPrompt(false); navigate('/addresses'); }}
                                    className="w-full h-16 bg-white/5 border border-white/5 text-white/80 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-white/10"
                                >
                                    <Search size={18} />
                                    <span>Manual Search</span>
                                </button>
                            </div>

                            {/* Trust Matrix */}
                            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full">
                                    <ShieldCheck size={14} className="text-brand" />
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">End-to-End Encrypted Sync</span>
                                </div>
                                <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">System Uplink // Active</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LocationPromptModal;

