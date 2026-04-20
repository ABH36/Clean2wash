import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, ShieldCheck, LocateFixed, ChevronRight } from 'lucide-react';
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
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLocationPrompt(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500]"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 250 }}
                        className="fixed bottom-0 left-0 right-0 bg-white/5 rounded-t-[2.5rem] z-[2501] px-6 pt-2 pb-8 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] safe-area-bottom"
                    >
                        {/* Compact Handle */}
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-2 mb-6" />

                        <div className="flex flex-col items-center">
                            {/* Header: Side-by-Side Icon + Text for Compactness */}
                            <div className="flex items-center gap-4 w-full mb-6">
                                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-[#F59E0B] flex-shrink-0 shadow-lg shadow-black/10">
                                    <MapPin size={24} />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black text-[#0F172A] leading-tight">
                                        Set your <span className="text-[#F59E0B]">service zone</span>
                                    </h2>
                                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">
                                        Find elite detailers near you
                                    </p>
                                </div>
                            </div>

                            {/* Clean Options */}
                            <div className="w-full space-y-3">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting || contextLoading}
                                    className="w-full h-15 bg-black text-white rounded-xl flex items-center px-5 relative overflow-hidden group disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center text-white mr-4 shadow-lg shadow-[#F59E0B]/20">
                                        {isDetecting ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                                    </div>
                                    <span className="font-bold text-sm">
                                        {isDetecting ? 'Detecting...' : 'Use current location'}
                                    </span>
                                    <ChevronRight size={16} className="ml-auto text-white/20" />
                                </motion.button>

                                <button
                                    onClick={() => { setShowLocationPrompt(false); navigate('/addresses'); }}
                                    className="w-full h-15 bg-white/5 border border-black/05 text-[#0F172A] rounded-xl flex items-center px-5 hover:bg-white/[0.02] transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-black/05 flex items-center justify-center text-white/40 mr-4 group-hover:bg-black group-hover:text-[#F59E0B] transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <span className="font-bold text-sm">Search manually</span>
                                    <ChevronRight size={16} className="ml-auto text-black/05" />
                                </button>
                            </div>

                            {/* Minimal Trust Info */}
                            <div className="mt-6 flex items-center gap-2 text-[9px] font-bold text-black/15 uppercase tracking-tighter">
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
