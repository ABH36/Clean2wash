import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, ShieldCheck, Map as MapIcon } from 'lucide-react';
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
                await saveLocation(coords.lat, coords.lng, 'My Location');
                toast.success('Location detected successfully! ✨');
                setShowLocationPrompt(false);
            }
        } catch (error) {
            console.error('Location detection failed:', error);
            toast.error('Could not detect location. Please try manual entry.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleManualEntry = () => {
        setShowLocationPrompt(false);
        navigate('/addresses');
    };

    return (
        <AnimatePresence>
            {showLocationPrompt && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLocationPrompt(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-black/20"
                    >
                        {/* Status Bar Decor */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-brand via-[#FF8C33] to-brand" />

                        <div className="p-8">
                            {/* Close Button */}
                            <button 
                                onClick={() => setShowLocationPrompt(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Header Icon */}
                            <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mb-8 mx-auto relative">
                                <div className="absolute inset-0 bg-brand/5 rounded-3xl animate-ping" />
                                <MapPin className="text-brand relative z-10" size={36} />
                            </div>

                            {/* Text Content */}
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
                                    Set Your Service Location
                                </h2>
                                <p className="text-gray-500 font-medium leading-relaxed px-4">
                                    To provide you with the best cleaning experts nearby, we need to know where you're located.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <button
                                    onClick={handleDetectLocation}
                                    disabled={isDetecting || contextLoading}
                                    className="w-full h-16 bg-[#1A1A1A] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-black/10 group"
                                >
                                    {isDetecting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin text-brand" />
                                            <span>Detecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-2 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                                                <Navigation size={18} className="text-brand" fill="currentColor" />
                                            </div>
                                            <span>Use Current Location</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleManualEntry}
                                    className="w-full h-16 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:border-brand/30 hover:bg-brand/5 active:scale-[0.98]"
                                >
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <Search size={18} className="text-gray-400" />
                                    </div>
                                    <span>Enter Manually</span>
                                </button>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span>Secure & Privacy First</span>
                            </div>
                        </div>

                        {/* Visual Asset Decor */}
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LocationPromptModal;
