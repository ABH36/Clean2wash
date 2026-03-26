import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { toast } from 'react-hot-toast';

const LocationPromptModal = () => {
    const {
        showLocationPrompt,
        setShowLocationPrompt,
        detectCurrentLocation,
        addAddress
    } = useGeoLocation();

    const navigate = useNavigate();
    const [isDetecting, setIsDetecting] = useState(false);

    if (!showLocationPrompt) return null;

    const handleDetectLocation = async () => {
        try {
            setIsDetecting(true);
            const pos = await detectCurrentLocation();

            // Redirect to updated address manager route
            navigate(`/addresses?lat=${pos.lat}&lng=${pos.lng}&detect=true`);
            setShowLocationPrompt(false);
            toast.success('Location detected! Let\'s save it.');
        } catch (error) {
            console.error('Location detection failed:', error);
            toast.error('Could not detect location. Please enter manually.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleManualEntry = () => {
        setShowLocationPrompt(false);
        navigate('/addresses');
    };

    const handleSkip = () => {
        setShowLocationPrompt(false);
        toast('No problem! You can set your location later.', {
            icon: '📍',
            style: { borderRadius: '16px', background: '#FFFFFF', color: '#000000', fontWeight: 'bold' }
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm">
                {/* Backdrop Blur Layer */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
                />

                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-white sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
                >
                    {/* Brand Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-brand-light to-brand" />

                    {/* Content Container */}
                    <div className="px-8 pt-12 pb-10">
                        {/* Illustration / Icon Header */}
                        <div className="flex justify-center mb-10">
                            <div className="relative">
                                <motion.div
                                    animate={{ 
                                        y: [0, -10, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 4, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-24 h-24 bg-brand/5 rounded-[2.5rem] flex items-center justify-center relative z-10"
                                >
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-brand/10">
                                        <MapPin size={32} className="text-brand" strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                                {/* Soft Glows */}
                                <div className="absolute -inset-4 bg-brand/10 blur-2xl rounded-full -z-10 animate-pulse" />
                            </div>
                        </div>

                        {/* Textual Narrative */}
                        <div className="text-center mb-10 space-y-3">
                            <h2 className="text-3xl font-[1000] text-black tracking-tight leading-none uppercase">
                                Precise Service <br/>
                                <span className="text-brand">Starts Here</span>
                            </h2>
                            <p className="text-gray-500 text-[13px] font-bold leading-relaxed px-6">
                                Enable location to help our captains reach you with clinical precision. We never share your private data.
                            </p>
                        </div>

                        {/* Action Stack */}
                        <div className="space-y-4">
                            <button
                                onClick={handleDetectLocation}
                                disabled={isDetecting}
                                className="w-full h-16 flex items-center justify-between px-6 bg-brand rounded-3xl hover:bg-brand-dark transition-all group relative overflow-hidden shadow-[0_12px_30px_-10px_rgba(255,107,0,0.5)] active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Navigation size={20} className="text-white fill-white" />
                                    </div>
                                    <span className="font-black text-white uppercase text-[12px] tracking-widest">Auto-Detect current location</span>
                                </div>
                                {isDetecting ? (
                                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin z-10" />
                                ) : (
                                    <ArrowRight size={20} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all z-10" />
                                )}
                                {/* Button Shine Effect */}
                                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700 pointer-events-none" />
                            </button>

                            <button
                                onClick={handleManualEntry}
                                className="w-full h-16 flex items-center justify-between px-6 bg-gray-50 border-2 border-transparent hover:border-brand/20 rounded-3xl transition-all group active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Search size={18} className="text-gray-400 group-hover:text-brand transition-colors" />
                                    </div>
                                    <span className="font-bold text-gray-500 uppercase text-[12px] tracking-widest">Select manually on map</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        {/* Bottom Utility */}
                        <div className="mt-10 flex flex-col items-center gap-6">
                            <button
                                onClick={handleSkip}
                                className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-brand transition-colors border-b-2 border-transparent hover:border-brand pb-1"
                            >
                                Continue without location
                            </button>
                            
                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100/50">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                End-to-End Privacy Encrypted
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LocationPromptModal;
