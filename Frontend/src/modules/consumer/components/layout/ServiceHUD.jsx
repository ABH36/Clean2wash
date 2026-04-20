import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Car, MapPin, ChevronRight, Loader2, Navigation, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ServiceHUD = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookings, activeSOS, dispatchSOS } = useAuth();
    const isSpareDriverBooking = (booking = {}) => (
        booking?.service?.type === 'sparedriver'
        || booking?.type === 'sparedriver'
        || booking?.service?.category === 'Chauffeur'
        || String(booking?.serviceName || '').toLowerCase().includes('chauffeur')
        || String(booking?.serviceName || '').toLowerCase().includes('spare driver')
    );

    // 🛡️ HUD Visibility Protocol: Hide on Home Page as per clean-dashboard policy
    if (location.pathname === '/' || location.pathname.startsWith('/spare-driver')) return null;

    // 🏎️ Find the most relevant "Live" booking for the user
    // We prioritize bookings that are being actively serviced over just "confirmed"
    const spareBookings = (bookings || []).filter(isSpareDriverBooking);
    const liveBooking = spareBookings.find((b) =>
        ['en_route', 'arrived', 'active'].includes(b.status)
    ) || spareBookings.find((b) => ['pending', 'confirmed', 'assigned', 'accepted'].includes(b.status));

    if (!liveBooking && !activeSOS) return null;

    const isChauffeur = liveBooking?.service?.category === 'Chauffeur' || liveBooking?.service?.type === 'sparedriver';
    const statusLabel = liveBooking?.timelineStatus?.label || liveBooking?.status || 'Active';
    const statusColor = liveBooking?.timelineStatus?.color || 'brand';

    const handleHUDClick = () => {
        navigate('/spare-driver');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[85px] left-4 right-4 z-[90]"
            >
                <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-3 overflow-hidden">
                    {/* Visual Indicator */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        liveBooking?.status === 'active' ? 'bg-brand' : 'bg-black'
                    }`}>
                        {isChauffeur ? <Car className="text-white" size={24} /> : <Zap className="text-white" size={24} />}
                        {liveBooking?.status === 'en_route' && (
                           <motion.div 
                             animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                             transition={{ duration: 2, repeat: Infinity }}
                             className="absolute w-12 h-12 bg-black rounded-2xl"
                           />
                        )}
                    </div>

                    {/* Content Detail */}
                    <div className="flex-1 min-w-0" onClick={handleHUDClick}>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30">
                                {liveBooking?.service?.name || "Service Active"}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand animate-pulse">
                                {statusLabel}
                            </span>
                        </div>
                        <h4 className="text-[12px] font-[1000] text-white truncate uppercase tracking-tight">
                            {liveBooking?.provider?.name ? `Specialist: ${liveBooking.provider.name}` : "Finding your specialist..."}
                        </h4>
                    </div>

                    {/* Dynamic Action (SOS or Tracking) */}
                    {isChauffeur ? (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("ACTIVATE EMERGENCY SOS? Local authorities and our safety team will be notified of your GPS coordinates immediately.")) {
                                    dispatchSOS({ 
                                        bookingId: liveBooking._id, 
                                        reason: 'Panic Button Triggered from Persistent HUD',
                                        latitude: 0, // Injected via AuthContext hook
                                        longitude: 0 
                                    });
                                }
                            }}
                            className="bg-red-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                        >
                            <ShieldAlert size={22} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleHUDClick();
                            }}
                            className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                        >
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    )}

                    {/* Background Subtle Progress */}
                    {['active'].includes(liveBooking?.status) && (
                        <div className="absolute bottom-0 left-0 h-1 bg-brand/10 w-full overflow-hidden">
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="h-full w-1/3 bg-brand"
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ServiceHUD;
