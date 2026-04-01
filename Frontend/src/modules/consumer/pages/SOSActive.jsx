import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ShieldAlert, Phone, ShieldCheck,
    AlertTriangle, MapPin, Navigation, User,
    Smartphone, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';

const SOSActive = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeSOS, getSOSStatus, resolveSOS, user } = useAuth();
    const [userCoords, setUserCoords] = useState({ 
        lat: activeSOS?.location?.coordinates?.[1] || 28.7041, 
        lng: activeSOS?.location?.coordinates?.[0] || 77.1025 
    });
    const [isResolving, setIsResolving] = useState(false);
    const [map, setMap] = useState(null);

    // Sync SOS status every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeSOS?._id) {
                getSOSStatus(activeSOS._id);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeSOS?._id, getSOSStatus]);

    // Track Live Location
    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { longitude, latitude } = pos.coords;
                const newCoords = { lat: latitude, lng: longitude };
                setUserCoords(newCoords);
                if (map) map.panTo(newCoords);
            },
            (err) => console.error('Map location tracking blocked'),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [map]);

    const handleResolve = async () => {
        if (!confirm('Verify: Are you safe now? This will call off the rescue network.')) return;
        setIsResolving(true);
        const res = await resolveSOS(activeSOS._id);
        if (res.success) {
            toast.success('SOS Resolved. Glad you are safe!');
            navigate('/');
        }
        setIsResolving(false);
    };

    if (!activeSOS) {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
                    <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-6">
                        <Info size={32} />
                    </div>
                    <h2 className="text-xl font-black text-content uppercase tracking-tight italic">No Active SOS Found</h2>
                    <p className="text-xs font-bold text-content-subtle uppercase tracking-widest mt-2 leading-relaxed">
                        If you are in danger, use the SOS button on the home screen.
                    </p>
                    <button onClick={() => navigate('/')} className="mt-8 px-8 py-4 bg-content text-white rounded-2xl font-black text-xs uppercase tracking-widest italic shadow-xl">Back to Dashboard</button>
                </div>
            </MobileLayout>
        );
    }

    const responders = activeSOS.responders || [];

    const mapMarkers = [
        {
            position: userCoords,
            icon: {
                url: 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png',
                scaledSize: { width: 32, height: 32 },
                anchor: { x: 16, y: 16 }
            },
            infoContent: <div className="p-1 font-bold text-xs font-outfit text-red-600">EMERGENCY: YOU ARE HERE</div>
        },
        ...responders.map(res => ({
            position: { 
                lat: userCoords.lat + 0.002, 
                lng: userCoords.lng + 0.002 
            }, // Simulated offset
            icon: {
                url: res.role === 'captain' 
                    ? 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png' 
                    : 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                scaledSize: { width: 32, height: 32 },
                anchor: { x: 16, y: 16 }
            },
            infoContent: (
                <div className="text-xs font-bold font-outfit p-1">
                    <p className={`uppercase ${res.role === 'captain' ? 'text-brand' : 'text-orange-500'}`}>{res.role} DISPATCHED</p>
                    <p className="mt-1 text-black">{res.user?.name || 'Responder'}</p>
                </div>
            )
        }))
    ];

    const mapCircles = [
        {
            center: userCoords,
            radius: 500,
            options: {
                fillColor: '#dc2626',
                fillOpacity: 0.1,
                strokeColor: '#dc2626',
                strokeOpacity: 0.5,
                strokeWeight: 1,
                clickable: false,
                editable: false,
                zIndex: 1
            }
        }
    ];

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-outfit relative">
                {/* ── Overlay Header ── */}
                <div className="absolute top-0 left-0 right-0 z-[100] p-5">
                    <header className="bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                                <ShieldAlert size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-red-600 uppercase tracking-tight italic">Rescue Active</h1>
                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest leading-none mt-1">Ref: {activeSOS._id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => window.location.href = 'tel:100'} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                                <Phone size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </header>
                </div>

                {/* ── Google Map ── */}
                <div className="absolute inset-0">
                    <GoogleMapBox 
                        center={userCoords}
                        zoom={15}
                        onLoad={setMap}
                        markers={mapMarkers}
                        circles={mapCircles}
                    />
                </div>

                {/* ── Bottom HUD ── */}
                <div className="absolute bottom-0 left-0 right-0 z-[100] p-6 space-y-4">
                    <AnimatePresence>
                        {responders.length > 0 ? (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-white/50"
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-xs font-black text-content uppercase tracking-tight italic">Response Squad</h3>
                                    <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase italic shadow-lg shadow-green-200">{responders.length} ACTIVE</span>
                                </div>

                                <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
                                    {responders.map(res => (
                                        <div key={res._id} className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                                            <div className={`w-10 h-10 ${res.role === 'captain' ? 'bg-brand' : 'bg-orange-500'} rounded-xl flex items-center justify-center text-white shrink-0`}>
                                                <User size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-[11px] font-black text-content uppercase italic leading-none">{res.user?.name || 'Hero'}</h4>
                                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-1.5">{res.role} • 2.4 KM AWAY</p>
                                            </div>
                                            <button className="w-9 h-9 bg-white border border-gray-100 text-content-subtle rounded-xl flex items-center justify-center">
                                                <Phone size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-red-600 rounded-[2.5rem] shadow-2xl p-6 text-white text-center border-4 border-red-500/30"
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <Navigation size={24} className="animate-pulse" />
                                </div>
                                <h3 className="text-base font-black uppercase italic tracking-tight">Rescue Network Alerted</h3>
                                <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.2em] mt-2 leading-relaxed">
                                    Alerting nearest captains, Hub Managers, and Admin Control Room...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleResolve}
                            className="bg-content h-16 rounded-[2rem] text-white flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest italic shadow-xl shadow-content/20 border-2 border-white/10 active:scale-95 transition-all"
                        >
                            <ShieldCheck size={18} strokeWidth={3} />
                            I AM SAFE
                        </button>
                        <button
                            onClick={() => window.location.href = 'tel:100'}
                            className="bg-red-600 h-16 rounded-[2rem] text-white flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest italic shadow-xl shadow-red-200 border-2 border-white/10 active:scale-95 transition-all"
                        >
                            <AlertTriangle size={18} strokeWidth={3} />
                            POLICE / 100
                        </button>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SOSActive;
