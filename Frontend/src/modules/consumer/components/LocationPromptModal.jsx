import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, ShieldCheck, ChevronRight, LocateFixed } from 'lucide-react';
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
                // Here we usually fetch address from coordinates using reverse geocoding
                // For now, saveLocation handles the API call
                await saveLocation(coords.lat, coords.lng, 'Current Location');
                toast.success('Location synchronized! ✨');
                setShowLocationPrompt(false);
            }
        } catch (error) {
            console.error('Detection failed:', error);
            toast.error('Location Access Denied. Please search manually.');
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <AnimatePresence>
            {showLocationPrompt && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLocationPrompt(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[2501] px-6 pt-2 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] safe-area-bottom"
                    >
                        {/* Pull Bar */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-2 mb-8" onClick={() => setShowLocationPrompt(false)} />

                        <div className="flex flex-col items-center text-center">
                            {/* Animated Icon Header */}
                            <div className="relative mb-6">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-[#FF9900]/20 rounded-full blur-xl"
                                />
                                <div className="w-20 h-20 bg-[#FF9900]/10 rounded-[2.5rem] flex items-center justify-center text-[#FF9900] relative border border-[#FF9900]/10">
                                    <MapPin size={36} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-2 mb-10">
                                <h2 className="text-[24px] font-[1000] text-black uppercase tracking-tighter leading-none">
                                    Set Your <span className="text-[#FF9900]">Service</span> Zone
                                </h2>
                                <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest max-w-[280px] leading-relaxed">
                                    Help us find your sector to synchronize professional detailers near you.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full space-y-4">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting || contextLoading}
                                    className="w-full h-16 bg-[#FF9900] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-[0.15em] shadow-xl shadow-[#FF9900]/20 disabled:grayscale transition-all"
                                >
                                    {isDetecting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Syncing GPS...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LocateFixed size={20} />
                                            <span>Use Current Location</span>
                                        </>
                                    )}
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => { setShowLocationPrompt(false); navigate('/addresses'); }}
                                    className="w-full h-16 bg-white border-2 border-black/05 text-black rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.15em] hover:bg-gray-50 transition-all"
                                >
                                    <Search size={18} />
                                    <span>Search Location Manually</span>
                                </motion.button>
                            </div>

                            {/* Trust Indicator */}
                            <div className="mt-8 pt-6 border-t border-gray-100 w-full flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Encrypted Data Uplink</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">v2.0 Active</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LocationPromptModal;

