import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, Phone, X, MapPin, Navigation, 
    Users, AlertTriangle, CheckCircle, Radio, 
    ChevronRight, MessageSquare, Car, Info
} from 'lucide-react';
import GoogleMapBox from '../../../components/common/GoogleMapBox';

const EmergencyResponse = ({ alert, onResolve, onClose }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!alert) return null;

    const consumerPos = {
        lat: alert.location?.coordinates?.[1] || 28.6139,
        lng: alert.location?.coordinates?.[0] || 77.2090
    };

    const driverPos = alert.booking?.captain?.currentLocation?.coordinates?.[1] 
        ? { 
            lat: alert.booking.captain.currentLocation.coordinates[1], 
            lng: alert.booking.captain.currentLocation.coordinates[0] 
          }
        : null;

    const markers = [
        {
            id: 'consumer',
            position: consumerPos,
            title: 'Consumer Location',
            icon: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="white" />
                    <circle cx="20" cy="20" r="15" fill="#ef4444" />
                    <circle cx="20" cy="20" r="8" fill="white">
                        <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                </svg>
            `)}`
        },
        ...(driverPos ? [{
            id: 'driver',
            position: driverPos,
            title: 'Driver Location',
            icon: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="white" />
                    <circle cx="20" cy="20" r="15" fill="#3b82f6" />
                    <path d="M12 28h16l-1.6-5.6c-.4-1.4-1.7-2.4-3.1-2.4h-6.6c-1.4 0-2.7 1-3.1 2.4L12 28z" fill="white" />
                </svg>
            `)}`
        }] : [])
    ];

    const polylines = driverPos ? [{
        path: [driverPos, consumerPos],
        options: {
            strokeColor: '#ef4444',
            strokeOpacity: 0.6,
            strokeWeight: 3,
            strokeDasharray: '10, 5'
        }
    }] : [];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col bg-[#0f172a] text-white overflow-hidden"
        >
            {/* Pulsing Red Atmosphere */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_70%)]" />
            </div>

            {/* Critical Header */}
            <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-[#0f172a]/80">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-bounce">
                        <ShieldAlert size={36} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-red-600/20 border border-red-600/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                                <Radio size={10} className="animate-ping" /> Live Emergency
                            </span>
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                Triggered: {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                            SOS Protocol <span className="text-red-500">Active</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right mr-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Command Center Time</p>
                        <p className="text-xl font-black tabular-nums">{currentTime.toLocaleTimeString()}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>
            </header>

            {/* Main Operational Zone */}
            <div className="flex-1 flex flex-col lg:flex-row relative z-10">
                {/* Left: Tactical Map */}
                <div className="flex-1 relative border-r border-white/10">
                    <GoogleMapBox 
                        center={consumerPos}
                        zoom={16}
                        markers={markers}
                        polylines={polylines}
                        darkMode={true}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            mapTypeControl: false,
                            streetViewControl: false,
                        }}
                    />
                    
                    {/* Map Overlays */}
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
                        <div className="px-4 py-3 bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPin size={16} className="text-red-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Incident Location</span>
                            </div>
                            <p className="text-sm font-bold text-white/90 max-w-[250px]">
                                {alert.location?.address || 'Detecting address...'}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">
                                Lat: {consumerPos.lat.toFixed(6)}, Lng: {consumerPos.lng.toFixed(6)}
                            </p>
                        </div>

                        {driverPos && (
                            <div className="px-4 py-3 bg-blue-600/90 backdrop-blur-md border border-blue-400/30 rounded-2xl shadow-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Car size={16} className="text-white" />
                                    <span className="text-xs font-black uppercase tracking-widest">Nearest Support</span>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {alert.booking?.captain?.name || 'Assigned Driver'}
                                </p>
                                <p className="text-[10px] text-white/70 mt-1">
                                    Estimated 240m away • Active Trip
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Intelligence Panel */}
                <aside className="w-full lg:w-[450px] bg-[#0f172a] overflow-y-auto p-8 space-y-8 border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                    
                    {/* Target Context */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5 pb-2">Consumer Intelligence</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {alert.consumer?.profile?.photo ? (
                                    <img src={alert.consumer.profile.photo} className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={32} className="text-white/20" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xl font-black italic uppercase tracking-tighter">{alert.consumer?.name}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <a href={`tel:${alert.consumer?.phone}`} className="flex items-center gap-2 text-red-500 font-bold hover:underline">
                                        <Phone size={14} /> {alert.consumer?.phone}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Security Note</span>
                            </div>
                            <p className="text-sm font-medium italic">
                                "{alert.description || 'No description provided by user'}"
                            </p>
                        </div>
                    </div>

                    {/* Operational Context */}
                    {alert.booking && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5 pb-2">Trip Context</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Booking ID</p>
                                    <p className="font-bold">#{alert.booking._id.slice(-6).toUpperCase()}</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Captain Assigned</p>
                                    <p className="font-bold">{alert.booking.captain?.name}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
                                <Car size={20} className="text-blue-500" />
                                <div>
                                    <p className="text-xs font-bold">{alert.booking.captain?.vehicleType || 'Vehicle'} • {alert.booking.captain?.plate || 'MH 01 AB 1234'}</p>
                                    <a href={`tel:${alert.booking.captain?.phone}`} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline mt-1 block">Call Captain</a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trusted Contacts */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5 pb-2">Emergency Contacts</h3>
                        <div className="space-y-2">
                            {alert.consumer?.profile?.trustedContacts?.length > 0 ? (
                                alert.consumer.profile.trustedContacts.map((contact, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold">{contact.name}</p>
                                            <p className="text-[10px] text-white/40">{contact.relation || 'Contact'}</p>
                                        </div>
                                        <a href={`tel:${contact.phone}`} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                            <Phone size={14} />
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs italic text-white/20">No trusted contacts configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Action Block */}
                    <div className="pt-4 space-y-3">
                        <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${consumerPos.lat},${consumerPos.lng}`, '_blank')}
                            className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all"
                        >
                            <Navigation size={20} /> Open Tactical Route
                        </button>
                        <button 
                            onClick={onResolve}
                            className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all"
                        >
                            <CheckCircle size={20} /> Mark Situation Resolved
                        </button>
                    </div>

                    <div className="p-6 border border-white/5 bg-white/[0.02] rounded-3xl text-center">
                        <Info size={24} className="mx-auto mb-3 text-white/20" />
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-loose">
                            Security Protocol 9.2: All emergency actions, voice recordings, and location logs are being captured in the Immutable Audit Vault.
                        </p>
                    </div>

                </aside>
            </div>
        </motion.div>
    );
};

export default EmergencyResponse;
