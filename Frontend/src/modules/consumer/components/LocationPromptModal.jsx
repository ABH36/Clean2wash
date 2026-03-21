import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, X, Locate, Search } from 'lucide-react';
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

            // For now, we'll redirect to AddressManager with these coordinates pre-filled
            // This is safer than just saving a 'Current Location' address directly
            navigate(`/consumer/profile/addresses?lat=${pos.lat}&lng=${pos.lng}&detect=true`);
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
        navigate('/consumer/profile/addresses');
    };

    const handleSkip = () => {
        setShowLocationPrompt(false);
        toast('No problem! You can set your location later from the header.', {
            icon: '📍',
            style: { borderRadius: '12px', background: '#0b0b0b', color: '#fff' }
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] shadow-2xl"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-white/60" />
                    </button>

                    <div className="px-8 pt-12 pb-10">
                        {/* Icon Header */}
                        <div className="flex justify-center mb-8">
                            <div className="relative group">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                                >
                                    <MapPin size={36} className="text-black" />
                                </motion.div>
                                <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-white mb-3">Set your location</h2>
                            <p className="text-white/50 text-sm leading-relaxed px-4">
                                To provide the fastest car wash at your doorstep, we need to know your location.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={handleDetectLocation}
                                disabled={isDetecting}
                                className="w-full h-16 flex items-center justify-between px-6 bg-white rounded-3xl hover:bg-white/90 transition-all group overflow-hidden relative"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-black/5 rounded-xl group-hover:scale-110 transition-transform">
                                        <Locate size={20} className="text-black" />
                                    </div>
                                    <span className="font-bold text-black">Use my current location</span>
                                </div>
                                {isDetecting ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <Navigation size={18} className="text-black/30 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                )}
                            </button>

                            <button
                                onClick={handleManualEntry}
                                className="w-full h-16 flex items-center justify-between px-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                        <Search size={20} className="text-white/60" />
                                    </div>
                                    <span className="font-bold text-white/80">Search address manually</span>
                                </div>
                                <ArrowRight size={18} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        {/* Footer Link */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleSkip}
                                className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] hover:text-white/60 transition-colors"
                            >
                                I'll set it later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LocationPromptModal;
