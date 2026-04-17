import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ShieldAlert, Phone, ShieldCheck,
    AlertTriangle, MapPin, Navigation, User,
    Smartphone, CheckCircle2, XCircle, Info, PhoneCall
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

    useEffect(() => {
        const interval = setInterval(() => {
            if (activeSOS?._id) { getSOSStatus(activeSOS._id); }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeSOS?._id, getSOSStatus]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { longitude, latitude } = pos.coords;
                const newCoords = { lat: latitude, lng: longitude };
                setUserCoords(newCoords);
                if (map) map.panTo(newCoords);
            },
            () => {},
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [map]);

    const handleResolve = async () => {
        if (!window.confirm('Are you safe now? This will call off the rescue network.')) return;
        setIsResolving(true);
        const res = await resolveSOS(activeSOS._id);
        if (res.success) {
            toast.success('SOS resolved. Glad you are safe!');
            navigate('/');
        }
        setIsResolving(false);
    };

    if (!activeSOS) {
        return (
            <MobileLayout>
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white font-sans">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[1.8rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner text-emerald-500">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-3">No active SOS found</h2>
                    <p className="text-[13px] font-medium text-slate-400 leading-relaxed mb-8">
                        The situation has been resolved or no alert was found. If you are in danger, use the emergency button.
                    </p>
                    <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[13px] shadow-xl active:scale-95 transition-all">Back to dashboard</button>
                </div>
            </MobileLayout>
        );
    }

    const responders = activeSOS.responders || [];

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen font-sans relative">
                {/* ── Floating Header ── */}
                <div className="absolute top-0 left-0 right-0 z-[100] p-5">
                    <header className="bg-white/95 backdrop-blur-md rounded-[2rem] border border-white shadow-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-pulse">
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <h1 className="text-[15px] font-bold text-rose-500 tracking-tight leading-none mb-1.5">Rescue active</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {activeSOS._id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = 'tel:100'} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 active:scale-95 transition-all">
                            <Phone size={18} />
                        </button>
                    </header>
                </div>

                {/* ── Visual Map ── */}
                <div className="absolute inset-0">
                    <GoogleMapBox 
                        center={userCoords}
                        zoom={15}
                        onLoad={setMap}
                        markers={[
                            { position: userCoords, icon: { url: 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png', scaledSize: { width: 32, height: 32 }, anchor: { x: 16, y: 16 } } }
                        ]}
                        circles={[
                            { center: userCoords, radius: 500, options: { fillColor: '#f43f5e', fillOpacity: 0.1, strokeColor: '#f43f5e', strokeOpacity: 0.5, strokeWeight: 1, clickable: false, zIndex: 1 } }
                        ]}
                    />
                </div>

                {/* ── Control HUD ── */}
                <div className="absolute bottom-0 left-0 right-0 z-[100] p-6 space-y-4 pb-12">
                    <AnimatePresence>
                        {responders.length > 0 ? (
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-white/50">
                                <div className="flex items-center justify-between mb-5 px-1">
                                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest leading-none">Response squad</h3>
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">{responders.length} active</span>
                                </div>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                                    {responders.map(res => (
                                        <div key={res._id} className="bg-slate-50 rounded-[1.8rem] p-4 flex items-center gap-4 border border-slate-100">
                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-brand shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[14px] font-bold text-slate-900 leading-none mb-1.5">{res.user?.name || 'Technician'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dispatch personnel • En-route</p>
                                            </div>
                                            <button onClick={() => window.location.href = `tel:${res.user?.phone || ''}`} className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                                                <Phone size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-rose-500 rounded-[2.5rem] shadow-2xl p-7 text-white text-center border border-white/10 relative overflow-hidden">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner relative z-10">
                                    <Navigation size={24} className="animate-pulse" />
                                </div>
                                <h3 className="text-[17px] font-bold text-white tracking-tight leading-none mb-2 relative z-10">Network alerted</h3>
                                <p className="text-white/60 text-[11px] font-medium leading-relaxed relative z-10">
                                    Alerting nearest responders, hub managers, and admin control room...
                                </p>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                                    <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-full w-1/2 bg-white/40" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleResolve} disabled={isResolving} className="bg-slate-900 h-16 rounded-[2rem] text-white flex items-center justify-center gap-3 font-bold text-[14px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-30">
                            <ShieldCheck size={20} className="text-emerald-500" /> I am safe
                        </button>
                        <button onClick={() => window.location.href = 'tel:100'} className="bg-rose-500 h-16 rounded-[2rem] text-white flex items-center justify-center gap-3 font-bold text-[14px] shadow-xl shadow-rose-500/10 active:scale-95 transition-all">
                            <PhoneCall size={20} /> Call 100
                        </button>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SOSActive;
