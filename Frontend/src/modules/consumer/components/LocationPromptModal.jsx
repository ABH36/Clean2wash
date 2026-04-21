import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, ShieldCheck, LocateFixed, ChevronRight } from 'lucide-react';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { useTheme } from '../../../context/ThemeContext';
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

    const { isDarkMode } = useTheme();
    const [isDetecting, setIsDetecting] = useState(false);
    const navigate = useNavigate();

    const handleDetectLocation = async () => {
        try {
            setIsDetecting(true);
            const coords = await detectCurrentLocation();
            if (coords) {
                await saveLocation(coords.lat, coords.lng, 'Current Location');
                toast.success('Location set!', {
                    style: { borderRadius: '20px', background: '#000', color: '#fff' }
                });
                setShowLocationPrompt(false);
            }
        } catch (error) {
            console.error('Detection failed:', error);
            toast.error('Location Access Denied.', { style: { borderRadius: '20px' } });
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
                        className="fixed inset-0 bg-black/70 z-[2500]"
                    />

                    {/* Bottom Sheet — solid bg, no glass */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 250 }}
                        className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[2501] px-6 pt-2 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] safe-area-bottom transition-colors ${
                            isDarkMode ? 'bg-[#111318]' : 'bg-white'
                        }`}
                    >
                        {/* Handle */}
                        <div className={`w-10 h-1 rounded-full mx-auto mt-2 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                        <div className="flex flex-col items-center">
                            {/* Header */}
                            <div className="flex items-center gap-4 w-full mb-6">
                                <div className="w-14 h-14 bg-[#F59E0B] rounded-2xl flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-[#F59E0B]/20">
                                    <MapPin size={24} />
                                </div>
                                <div className="text-left">
                                    <h2 className={`text-xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                        Set your <span className="text-[#F59E0B]">service zone</span>
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                        Find elite detailers near you
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="w-full space-y-3">
                                {/* GPS Button */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting || contextLoading}
                                    className="w-full h-[56px] bg-[#F59E0B] text-black rounded-2xl flex items-center px-5 font-bold text-sm shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center mr-4">
                                        {isDetecting
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <LocateFixed size={16} />
                                        }
                                    </div>
                                    <span>{isDetecting ? 'Detecting...' : 'Use current location'}</span>
                                    <ChevronRight size={16} className="ml-auto opacity-40" />
                                </motion.button>

                                {/* Manual Search Button */}
                                <button
                                    onClick={() => { setShowLocationPrompt(false); navigate('/addresses'); }}
                                    className={`w-full h-[56px] rounded-2xl flex items-center px-5 font-bold text-sm transition-all border ${
                                        isDarkMode
                                            ? 'bg-white/5 border-white/8 text-white hover:bg-white/10'
                                            : 'bg-black/04 border-black/08 text-[#0F172A] hover:bg-black/08'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                                        isDarkMode ? 'bg-white/10 text-white/50' : 'bg-black/08 text-black/40'
                                    }`}>
                                        <Search size={16} />
                                    </div>
                                    <span>Search manually</span>
                                    <ChevronRight size={16} className="ml-auto opacity-20" />
                                </button>
                            </div>

                            {/* Trust badge */}
                            <div className={`mt-6 flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter ${
                                isDarkMode ? 'text-white/15' : 'text-black/15'
                            }`}>
                                <ShieldCheck size={12} />
                                <span>End-to-End Encrypted Uplink v3.1</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LocationPromptModal;
