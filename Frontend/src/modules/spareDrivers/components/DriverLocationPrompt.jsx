import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Loader2, ShieldCheck, Radio } from 'lucide-react';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const GEO_PROMPT_COOLDOWN_MS = 2 * 60 * 60 * 1000;

const DriverLocationPrompt = ({ onLocationSet }) => {
    const {
        detectCurrentLocation
    } = useGeoLocation();

    const [isVisible, setIsVisible] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [driverId, setDriverId] = useState('');

    useEffect(() => {
        const checkLocation = async () => {
            try {
                const res = await spareDriverAPI.getProfile();
                const driver = res?.data?.driver || {};
                const currentDriverId = driver?._id || '';
                setDriverId(currentDriverId);

                const coords = driver?.currentLocation?.coordinates;
                const hasLiveCoords = Array.isArray(coords)
                    && coords.length === 2
                    && Number(coords[0]) !== 0
                    && Number(coords[1]) !== 0;

                const addressLat = Number(driver?.address?.coordinates?.lat);
                const addressLng = Number(driver?.address?.coordinates?.lng);
                const hasAddressCoords = Number.isFinite(addressLat)
                    && Number.isFinite(addressLng)
                    && addressLat !== 0
                    && addressLng !== 0;

                if (!hasLiveCoords && hasAddressCoords) {
                    await spareDriverAPI.updateLocation(addressLat, addressLng);
                    if (onLocationSet) onLocationSet();
                    return;
                }

                if (!hasLiveCoords) {
                    const nextAllowedAt = Number(localStorage.getItem(`spare_driver_geo_prompt_next_at_${currentDriverId}`) || 0);
                    if (Date.now() >= nextAllowedAt) {
                        setIsVisible(true);
                    }
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('Failed to check driver location status', error);
            }
        };

        checkLocation();
    }, [onLocationSet]);

    const handleDetectLocation = async () => {
        try {
            setIsDetecting(true);
            const coords = await detectCurrentLocation();
            if (coords) {
                await spareDriverAPI.updateLocation(coords.lat, coords.lng);
                if (driverId) {
                    localStorage.removeItem(`spare_driver_geo_prompt_next_at_${driverId}`);
                }
                toast.success('Telemetric sync successful.');
                setIsVisible(false);
                if (onLocationSet) onLocationSet();
            }
        } catch (error) {
            console.error('Location detection failed:', error);
            try {
                const res = await spareDriverAPI.getProfile();
                const fallbackLat = Number(res?.data?.driver?.address?.coordinates?.lat);
                const fallbackLng = Number(res?.data?.driver?.address?.coordinates?.lng);
                if (Number.isFinite(fallbackLat) && Number.isFinite(fallbackLng) && fallbackLat !== 0 && fallbackLng !== 0) {
                    await spareDriverAPI.updateLocation(fallbackLat, fallbackLng);
                    toast.success('Using saved address coordinates as fallback location.');
                    setIsVisible(false);
                    if (onLocationSet) onLocationSet();
                    return;
                }
            } catch (fallbackError) {
                console.error('Address fallback location failed:', fallbackError);
            }
            toast.error('Could not detect location. Please enable GPS permissions or set address coordinates.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleDismiss = () => {
        if (driverId) {
            localStorage.setItem(
                `spare_driver_geo_prompt_next_at_${driverId}`,
                String(Date.now() + GEO_PROMPT_COOLDOWN_MS)
            );
        }
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6 translate-z-0">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-[430px] bg-surface rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-12 shadow-2xl transition-colors duration-500 border-t border-brand/20 sm:border-t-0"
                    >
                        <div className="w-12 h-1.5 bg-content/10 rounded-full mx-auto mb-8" />

                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-brand/10 rounded-[2.2rem] flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20 relative">
                                <Radio size={32} className="animate-pulse" />
                                <div className="absolute inset-0 bg-brand/10 rounded-[2.2rem] animate-ping opacity-20" />
                            </div>
                            <h2 className="text-2xl font-black text-content uppercase tracking-tight">Signal Offline</h2>
                            <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.3em] mt-2 leading-relaxed">
                                Enable geolocation to broadcast your availability and intercept local mission requests.
                            </p>
                        </div>

                        <div className="bg-content/[0.02] border border-content/[0.03] rounded-3xl p-5 mb-8 flex items-start gap-4 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-content uppercase tracking-tight">Deployment Security</h4>
                                <p className="text-[9px] font-black text-content/30 uppercase mt-1 leading-tight">Your coordinates are encrypted and only used for mission matching within your sector.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleDetectLocation}
                                disabled={isDetecting}
                                className="w-full h-15 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-brand/20"
                            >
                                {isDetecting ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>Initiate Uplink <Navigation size={18} className="rotate-45" /></>
                                )}
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="w-full h-12 text-[10px] font-black text-content/30 uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Continue Offline
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-content/[0.04] text-center">
                            <p className="text-[8px] font-black text-content/15 uppercase tracking-[0.4em]">Tracking Protocol v4.2 // Active-Sync</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DriverLocationPrompt;
