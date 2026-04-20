import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Phone, MapPin, X, Shield, Siren } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * SOS Emergency Button Component
 * Rapido-style prominent emergency button with confirmation modal
 */
const SOSButton = ({ 
    onEmergency, 
    bookingId = null,
    currentLocation = null,
    isActive = false,
    className = ''
}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [activating, setActivating] = useState(false);
    const [reason, setReason] = useState('');

    const emergencyReasons = [
        { id: 'accident', label: 'Accident', icon: AlertCircle },
        { id: 'harassment', label: 'Harassment', icon: Shield },
        { id: 'vehicle_issue', label: 'Vehicle Issue', icon: AlertCircle },
        { id: 'medical', label: 'Medical Emergency', icon: AlertCircle },
        { id: 'threat', label: 'Safety Threat', icon: Shield },
        { id: 'other', label: 'Other Emergency', icon: Siren }
    ];

    const handleSOSClick = () => {
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        setShowConfirm(true);
    };

    const handleConfirmSOS = async () => {
        if (!reason) {
            toast.error('Please select emergency reason');
            return;
        }

        setActivating(true);

        try {
            // Get current location if not provided
            let location = currentLocation;
            
            if (!location && navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        });
                    });
                    
                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (geoError) {
                    console.warn('Could not get location:', geoError);
                }
            }

            // Call emergency handler
            await onEmergency({
                bookingId,
                reason,
                latitude: location?.latitude || location?.lat,
                longitude: location?.longitude || location?.lng
            });

            // Success feedback
            toast.success('🚨 Emergency alert sent!', {
                duration: 5000,
                style: {
                    background: '#EF4444',
                    color: '#FFF',
                    fontWeight: 'bold'
                }
            });

            // Vibrate again
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            }

            setShowConfirm(false);
            setReason('');

        } catch (error) {
            console.error('SOS Error:', error);
            toast.error(error.message || 'Failed to send emergency alert');
        } finally {
            setActivating(false);
        }
    };

    return (
        <>
            {/* SOS Button */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSOSClick}
                disabled={!isActive}
                className={`relative group ${className}`}
                style={{
                    filter: isActive ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))' : 'none'
                }}
            >
                {/* Pulsing Ring */}
                {isActive && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
                    </>
                )}

                {/* Button */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isActive 
                        ? 'bg-red-500 shadow-2xl shadow-red-500/50' 
                        : 'bg-red-500/50 opacity-50 cursor-not-allowed'
                }`}>
                    <Siren 
                        size={28} 
                        className="text-white" 
                        strokeWidth={2.5}
                    />
                </div>

                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">
                        SOS
                    </span>
                </div>
            </motion.button>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center px-6"
                        onClick={() => !activating && setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => !activating && setShowConfirm(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <Siren size={40} className="text-red-500" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                    Emergency Alert
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This will immediately notify admin and emergency contacts
                                </p>
                            </div>

                            {/* Emergency Reasons */}
                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                                    Select Emergency Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {emergencyReasons.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setReason(item.id)}
                                            className={`p-3 rounded-xl border-2 transition-all ${
                                                reason === item.id
                                                    ? 'border-red-500 bg-red-500/10'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-red-500/50'
                                            }`}
                                        >
                                            <item.icon 
                                                size={20} 
                                                className={`mx-auto mb-1 ${
                                                    reason === item.id ? 'text-red-500' : 'text-gray-400'
                                                }`}
                                            />
                                            <p className={`text-[10px] font-bold ${
                                                reason === item.id 
                                                    ? 'text-red-500' 
                                                    : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {item.label}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        Your location will be shared with emergency contacts
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <Phone size={16} className="text-green-500 flex-shrink-0" />
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Admin will be notified immediately
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => !activating && setShowConfirm(false)}
                                    disabled={activating}
                                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSOS}
                                    disabled={activating || !reason}
                                    className="flex-1 h-12 rounded-xl bg-red-500 text-white font-black text-sm uppercase tracking-wider hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {activating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Siren size={16} />
                                            Send SOS
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Warning */}
                            <p className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-4">
                                ⚠️ Only use in genuine emergencies. False alerts may result in penalties.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SOSButton;
