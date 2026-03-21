import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Phone, MessageSquare, Truck,
    ShieldCheck, CheckCircle2, Navigation2, Clock,
    Camera, AlertCircle, ArrowUpRight, Search, User,
    Package, X, Lock, Trash2, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { staffAPI } from '../../../utils/staffApi';
import { socketService } from '../../../utils/socket';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';

// 🛠️ Asset Protocol: Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PinModal = ({ isOpen, onConfirm, onCancel, title, isDarkMode }) => {
    const [pin, setPin] = useState('');
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (pin.length === 4) onConfirm(pin);
        else toast.error('Security Protocol: PIN must be 4 digits');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl" onClick={onCancel}
            />
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                className={`relative w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-gray-100'}`}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-brand/5 rounded-[2rem] flex items-center justify-center text-brand mb-6 border border-brand/10">
                        <Lock size={36} strokeWidth={2.5} />
                    </div>
                    <div className="mb-8">
                        <h3 className={`text-2xl font-black italic uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-content'}`}>{title}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 leading-relaxed ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Sync the 4-digit security code with the consumer's terminal.</p>
                    </div>

                    <input
                        type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-full h-20 text-center text-5xl font-black tracking-[0.6em] rounded-3xl border-2 transition-all outline-none mb-10 ${isDarkMode ? 'bg-white/5 border-white/5 text-white focus:border-brand/40 shadow-inner' : 'bg-gray-50 border-gray-100 text-content focus:border-brand/40 shadow-inner'}`}
                        placeholder="••••" autoFocus
                    />

                    <div className="flex gap-4 w-full">
                        <button onClick={onCancel} className={`flex-1 h-16 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-gray-100 text-content-muted hover:text-content'}`}>Abort</button>
                        <button onClick={handleConfirm} disabled={pin.length < 4} className="flex-1 h-16 bg-brand text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/30 disabled:opacity-30 disabled:scale-95 transition-all">Verify</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isDarkMode } = useTheme();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isConnectionActive, setIsConnectionActive] = useState(window.navigator.onLine);
    const [vcrChecklist, setVcrChecklist] = useState({
        scratches: false,
        dents: false,
        valuables: false,
        fuel: false
    });
    const [isCommitted, setIsCommitted] = useState(false);
    const isVcrReady = Object.values(vcrChecklist).every(Boolean);

    useEffect(() => {
        const handleOnline = () => setIsConnectionActive(true);
        const handleOffline = () => setIsConnectionActive(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 💾 Recover Cached Proofs
        const cached = localStorage.getItem(`cw_proof_${id}`);
        if (cached) {
            try {
                setPhotos(JSON.parse(cached));
                toast.success('Evidence Protocol Restored');
            } catch (e) { localStorage.removeItem(`cw_proof_${id}`); }
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [id]);

    useEffect(() => {
        if (photos.length > 0) {
            localStorage.setItem(`cw_proof_${id}`, JSON.stringify(photos));
        } else {
            localStorage.removeItem(`cw_proof_${id}`);
        }
    }, [photos, id]);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await staffAPI.getTaskById(id);
                if (res.status === 'success') {
                    setTask(res.data.task);

                    // 📡 Real-time Synchronization
                    const socket = socketService.getSocket();
                    if (socket) {
                        socketService.connect();
                        socketService.joinBookingRoom(id);
                        socket.on('booking_status_updated', (data) => {
                            if (data.bookingId === id) {
                                // Refresh task locally
                                staffAPI.getTaskById(id).then(r => {
                                    if (r.status === 'success') setTask(r.data.task);
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load task logs', err);
                toast.error('Sync Error: Unrecognized Protocol');
            } finally {
                setLoading(false);
            }
        };
        fetchTask();

        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('booking_status_updated');
            }
        };
    }, [id]);

    // 📍 Real-time GPS Telemetry Pulse (Logistic Protocol)
    useEffect(() => {
        let watchId = null;
        const activeTransitStatuses = ['en_route', 'delivery-assigned'];

        if (activeTransitStatuses.includes(task?.status) && isConnectionActive) {
            console.log(`[Phase 9] 🛰️ GPS Pulse Mode Engaged for Mission: ${id}`);
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            await staffAPI.updateLocation(id, latitude, longitude);
                        } catch (err) {
                            console.warn('Telemetry Pulse Sync Failure:', err);
                        }
                    },
                    (error) => console.error('GPS Telemetry Fatal Error:', error),
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
                );
            }
        }

        return () => {
            if (watchId) {
                console.log(`[Phase 9] 🛰️ GPS Pulse Mode Disengaged`);
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [task?.status, id, isConnectionActive]);

    const handlePhotoCapture = (e) => {
        const files = Array.from(e.target.files);
        if (photos.length + files.length > 4) {
            toast.error('Protocol Limit: Max 4 Evidence Photos');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpdateStatus = async (status, pin = null) => {
        if (['at-studio', 'completed'].includes(status) && photos.length === 0) {
            toast.error('Mission Protocol: Photos required for state verification');
            return false;
        }

        setIsSubmitting(true);
        try {
            let uploadedPhotos = [];
            // Handle Photo Upload if transitioning to 'at-studio' or 'completed'
            if (['at-studio', 'completed'].includes(status) && photos.length > 0) {
                setIsUploading(true);
                const type = status === 'at-studio' ? 'before' : 'after';
                const uploadRes = await staffAPI.uploadProof(photos, type);
                if (uploadRes.status === 'success') {
                    uploadedPhotos = uploadRes.data.urls;
                }
            }

            const payload = { status };
            if (pin) payload.pin = pin;
            if (uploadedPhotos.length > 0) payload.photos = uploadedPhotos;

            const res = await staffAPI.updateTaskStatus(id, payload);
            if (res.status === 'success') {
                setTask(res.data.task);
                setPhotos([]);
                toast.success('Protocol Synchronized Successfully');
                if (status === 'completed') {
                    setTimeout(() => navigate('/staff'), 1500);
                }
                return true;
            }
        } catch (err) {
            toast.error(err.message || 'Operation Timing Failure');
            return false;
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const handleActionTrigger = (nextStatus) => {
        if (['arrived', 'picked-up', 'at-studio', 'completed'].includes(nextStatus)) {
            setPendingStatus(nextStatus);
            setShowPinModal(true);
        } else {
            handleUpdateStatus(nextStatus);
        }
    };

    const handlePinConfirm = async (pin) => {
        const success = await handleUpdateStatus(pendingStatus, pin);
        if (success) setShowPinModal(false);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'}`}>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand ml-2">Pulling Terminal Logs...</p>
                </motion.div>
            </div>
        );
    }

    const taskData = task || {};
    const isDelivery = ['quality-check', 'ready-for-delivery', 'delivery-assigned', 'completed'].includes(taskData.status);
    const statusIdx = {
        'en_route': 1, 'arrived': 2, 'picked-up': 3, 'at-studio': 4, 'washing': 4, 'quality-check': 4, 'ready-for-delivery': 5, 'completed': 6
    }[taskData.status] || 0;

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'} pb-40 transition-colors duration-500`}>
            {/* Elite Header */}
            <header className={`${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-3xl px-6 pt-12 pb-6 border-b flex items-center justify-between sticky top-0 z-50`}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 shadow-soft text-content'}`}
                >
                    <ChevronLeft size={24} />
                </motion.button>
                <div className="text-center">
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] leading-none mb-1.5 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Authorized Terminal</p>
                    <h1 className={`text-lg font-black italic leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>#{String(taskData._id).slice(-8).toUpperCase()}</h1>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <ShieldCheck size={24} className="text-brand" />
                </div>
            </header>

            {/* 📡 Connectivity Guard */}
            {!isConnectionActive && (
                <div className="bg-amber-500 text-white px-6 py-2 flex items-center justify-center gap-2 sticky top-[88px] z-40 animate-pulse">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">Protocol Paused: Offline Mode Active</span>
                </div>
            )}

            {/* ⏰ High-Priority Scheduled Commitment Node */}
            {taskData.schedule?.type === 'scheduled' && taskData.status === 'pickup-assigned' && !isCommitted && (
                <div className="px-6 mt-8">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-8 rounded-[3.5rem] border-2 border-brand/20 shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-brand/5' : 'bg-brand/[0.02]'}`}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Clock size={80} className="text-brand rotate-12" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={14} className="text-brand animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand italic">Priority Protocol</span>
                                </div>
                                <h2 className={`text-2xl font-black italic uppercase leading-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                    Scheduled Pickup <br /> Request
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-soft'}`}>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Target Slot</p>
                                    <p className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-content'}`}>{taskData.schedule.timeSlot?.start || '10:00 AM'}</p>
                                </div>
                                <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-soft'}`}>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Status</p>
                                    <p className="text-sm font-black italic text-brand">Awaiting Commitment</p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    try {
                                        const res = await staffAPI.commitToSlot(id);
                                        if (res.status === 'success') {
                                            toast.success('Mission Slot Secured 🛡️');
                                            setIsCommitted(true);
                                        }
                                    } catch (err) {
                                        toast.error(err.message || 'Operation Timing Failure');
                                    }
                                }}
                                className="w-full h-20 bg-brand text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] italic shadow-xl shadow-brand/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20} />
                                {isCommitted ? 'Slot Secured' : 'Acknowledge & Commit to Slot'}
                            </button>

                            <p className="text-center text-[9px] font-bold opacity-40 uppercase tracking-widest italic">This commitment triggers the consumer departure signal</p>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className={`mt-8 px-6 space-y-6`}>
                {/* 🗺️ Live Tactical Map Node */}
                <div className={`relative h-72 rounded-[3.5rem] overflow-hidden border shadow-2xl transition-all ${isDarkMode ? 'border-white/5 bg-[#0F172A]' : 'border-gray-100 bg-white'}`}>
                    <div className="absolute inset-0 z-0">
                        <MapContainer
                            center={[taskData.location?.address?.coordinates?.lat || 20.5937, taskData.location?.address?.coordinates?.lng || 78.9629]}
                            zoom={13}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%', filter: isDarkMode ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[taskData.location?.address?.coordinates?.lat || 20.5937, taskData.location?.address?.coordinates?.lng || 78.9629]}>
                                <Popup>Consumer Location</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none z-10" />

                    <div className="absolute inset-x-8 bottom-8 flex items-end justify-between">
                        <div className="space-y-3 max-w-[70%] text-white">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full animate-ping ${isConnectionActive ? 'bg-brand' : 'bg-amber-500'}`} />
                                <p className={`text-[9px] font-black uppercase tracking-widest italic leading-none ${isConnectionActive ? 'text-brand' : 'text-amber-500'}`}>
                                    {isConnectionActive ? 'Precision Route Ready' : 'Protocol Signal Weak'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic leading-tight uppercase truncate mb-1">
                                    {(statusIdx >= 3 && statusIdx < 5)
                                        ? (taskData.provider?.businessName || 'Authorized Hub')
                                        : (taskData.location?.address?.street || 'Assigned point')
                                    }
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                                    <MapPin size={10} className="text-brand" />
                                    {(statusIdx >= 3 && statusIdx < 5)
                                        ? 'Returning to Studio Node'
                                        : (taskData.location?.landmark || 'Check terminal notes')
                                    }
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                let coords, address;
                                if (statusIdx >= 3 && statusIdx < 5) {
                                    // Hub Navigation
                                    coords = taskData.provider?.profile?.location?.coordinates;
                                    address = taskData.provider?.profile?.address?.street;
                                } else {
                                    // Consumer Navigation
                                    coords = taskData.location?.address?.coordinates;
                                    address = taskData.location?.address?.street;
                                }
                                const query = coords?.lat ? `${coords.lat},${coords.lng}` : encodeURIComponent(address || '');
                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }}
                            className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all ${(statusIdx >= 3 && statusIdx < 5) ? 'bg-brand text-white shadow-brand/40' : 'bg-white text-black shadow-brand/20'
                                }`}
                        >
                            <Navigation2 size={24} fill="currentColor" />
                        </motion.button>
                    </div>
                </div>

                {/* 👤 Consumer Profile Node */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[3rem] p-8 border hover:border-brand/30 transition-all`}>
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 rounded-[1.8rem] flex items-center justify-center">
                                <User size={32} className="text-brand" />
                            </div>
                            <div className="pt-1">
                                <h4 className={`text-2xl font-black italic uppercase tracking-tighter leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>{taskData.consumer?.name || 'Protocol Consumer'}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500/20 border border-green-500/40 rounded-full" />
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Identity Verified</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <a href={`tel:${taskData.consumer?.phone}`} className="w-12 h-12 bg-white text-[#0F172A] rounded-2xl flex items-center justify-center shadow-xl shadow-brand/5 active:scale-95 transition-all">
                                <Phone size={20} fill="currentColor" />
                            </a>
                            <button className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                                <MessageSquare size={20} />
                            </button>
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="space-y-1">
                            <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>Assigned Vehicle</p>
                            <h5 className={`text-sm font-black italic text-brand uppercase`}>{taskData.vehicle?.brand} {taskData.vehicle?.model}</h5>
                        </div>
                        <div className="text-right space-y-1">
                            <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>Plate Log</p>
                            <p className={`text-[10px] font-black uppercase italic ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{taskData.vehicle?.plate || '--'}</p>
                        </div>
                    </div>

                    {taskData.location?.instructions && (
                        <div className={`mt-4 p-5 rounded-[2rem] border-2 border-dashed ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={12} className="text-brand" />
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Dispatch Instructions</p>
                            </div>
                            <p className={`text-[10px] font-bold italic leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-content-muted'}`}>
                                "{taskData.location.instructions}"
                            </p>
                        </div>
                    )}
                </div>

                {/* 📋 Service Manifest Node */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[3rem] p-8 border overflow-hidden relative`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-brand" />
                            <h4 className={`text-[11px] font-black uppercase tracking-widest italic ${isDarkMode ? 'text-white/80' : 'text-content'}`}>Service Manifest</h4>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-brand/5 border-brand/10 text-brand'}`}>Elite Suite</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {/* Main Service */}
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-content'}`}>{taskData.service?.name || 'Protocol Service'}</p>
                            <span className="text-[10px] font-black italic text-brand">Core</span>
                        </div>

                        {/* Add-ons */}
                        {taskData.addons && taskData.addons.length > 0 ? (
                            taskData.addons.map((addon, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand" />
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-content'}`}>{addon.name}</p>
                                    </div>
                                    <span className={`text-[10px] font-black italic ${isDarkMode ? 'text-white/40' : 'text-content-muted'}`}>Premium Add-on</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-4 text-[9px] font-black uppercase tracking-[0.3em] opacity-20 italic">No Supplemental Add-ons Dispatched</p>
                        )}
                    </div>
                </div>

                {/* 📸 Elite Evidence Core */}
                <div className="space-y-6">
                    {/* Previous Handover Photos (for Delivery Staff) */}
                    {taskData.serviceImages?.before?.length > 0 && isDelivery && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3">
                                <ShieldCheck size={12} className="text-green-500" />
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Pickup Handover Proofs</h4>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {taskData.serviceImages.before.map((img, idx) => (
                                    <div key={idx} className="relative w-32 h-32 rounded-3xl overflow-hidden border border-brand/20 shrink-0">
                                        <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all cursor-zoom-in" alt="handover-proof" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-2">
                            <Camera size={12} className="text-brand" />
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{isDelivery ? 'Delivery Sync Media' : 'Media Evidence Log'}</h4>
                        </div>
                        <span className={`text-[10px] font-black ${photos.length >= 2 ? 'text-green-500' : 'text-brand'}`}>{photos.length}/4 Captured</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {photos.map((img, idx) => (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={idx} className="relative h-44 rounded-[2.5rem] overflow-hidden border-2 border-brand/20 group">
                                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="evidence" />
                                <button
                                    onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                        {photos.length < 4 && (
                            <label className={`h-44 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white/20 hover:border-brand/40 hover:text-brand' : 'bg-white border-gray-100 text-gray-300 hover:border-brand hover:text-brand'}`}>
                                <Camera size={32} strokeWidth={1.5} />
                                <p className="text-[9px] font-black uppercase tracking-widest italic">Initialize Camera</p>
                                <input type="file" accept="image/*" multiple onChange={handlePhotoCapture} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 🛡️ Operational Checklist (Digital VCR) */}
                <div className={`p-8 rounded-[3rem] border transition-all ${isVcrReady ? (isDarkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-100') : (isDarkMode ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white border-gray-100 shadow-soft')}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={20} className={isVcrReady ? 'text-green-500' : 'text-amber-500'} />
                            <h4 className={`text-[11px] font-black uppercase tracking-widest italic ${isVcrReady ? 'text-green-500' : 'text-amber-500'}`}>
                                {isVcrReady ? 'VCR Protocol Verified' : 'Liability Handshake: VCR'}
                            </h4>
                        </div>
                        {isVcrReady && <CheckCircle2 size={18} className="text-green-500 animate-bounce" />}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {Object.keys(vcrChecklist).map((key) => (
                            <button
                                key={key}
                                onClick={() => setVcrChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${vcrChecklist[key]
                                    ? (isDarkMode ? 'bg-brand/20 border-brand/40 text-white' : 'bg-brand/5 border-brand/20 text-brand')
                                    : (isDarkMode ? 'bg-white/5 border-white/5 text-white/30' : 'bg-gray-50 border-gray-100 text-content-subtle')
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${vcrChecklist[key] ? 'bg-brand border-brand text-white' : 'border-current'}`}>
                                    {vcrChecklist[key] && <Check size={12} strokeWidth={4} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter italic">
                                    {key === 'valuables' ? 'Valuables Out' : key === 'fuel' ? 'Fuel Logged' : `No ${key}`}
                                </span>
                            </button>
                        ))}
                    </div>

                    {!isVcrReady && (
                        <p className={`mt-5 text-[9px] font-bold leading-relaxed ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                            Terminal Alert: Confirm all vehicle condition parameters to unlock the custody handshake protocol.
                        </p>
                    )}
                </div>
            </div>

            {/* ⌨️ Terminal Dock */}
            <div className={`fixed bottom-0 left-0 right-0 p-8 pt-4 backdrop-blur-3xl border-t z-50 transition-all ${isDarkMode ? 'bg-[#0F172A]/90 border-white/5 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.8)]' : 'bg-white/90 border-gray-100 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.1)]'}`}>
                {/* Protocol Progress */}
                <div className="flex gap-1.5 mb-8 px-2">
                    {[1, 2, 3, 4, 5, 6].map(step => (
                        <div key={step} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step <= statusIdx ? 'bg-brand shadow-[0_0_10px_rgba(75,135,255,0.5)]' : 'bg-brand/10'}`} />
                    ))}
                </div>

                {taskData.status === 'pickup-assigned' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleUpdateStatus('en_route')} disabled={isSubmitting} className="w-full h-20 bg-brand text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-[0_20px_40px_-12px_rgba(75,135,255,0.4)]">
                        {isSubmitting ? 'Syncing...' : 'Initialize Pickup'} <Truck size={22} />
                    </motion.button>
                )}
                {taskData.status === 'en_route' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleUpdateStatus('arrived')} disabled={isSubmitting} className="w-full h-20 bg-black text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl">
                        {isSubmitting ? 'Syncing...' : 'Confirm Arrival'} <Navigation2 size={22} />
                    </motion.button>
                )}
                {taskData.status === 'arrived' && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionTrigger('picked-up')}
                        disabled={isSubmitting || !isVcrReady}
                        className="w-full h-20 bg-brand text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-xl disabled:opacity-30 disabled:grayscale transition-all"
                    >
                        {isSubmitting ? 'Syncing...' : (isVcrReady ? 'Begin Handover Handshake' : 'Complete VCR Protocol')}
                        {isVcrReady ? <Lock size={22} /> : <ShieldAlert size={22} />}
                    </motion.button>
                )}
                {taskData.status === 'picked-up' && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionTrigger('at-studio')}
                        disabled={isSubmitting || photos.length < 2}
                        className="w-full h-20 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-xl disabled:opacity-30 transition-all"
                    >
                        {isSubmitting ? 'Syncing...' : (photos.length >= 2 ? 'Finalize Hub Entry' : 'Capture Hub Receipt Proofs')}
                        <ArrowUpRight size={22} />
                    </motion.button>
                )}
                {taskData.status === 'ready-for-delivery' && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleUpdateStatus('en_route')} disabled={isSubmitting} className="w-full h-20 bg-brand text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-xl">
                        Initialize Delivery <Package size={22} />
                    </motion.button>
                )}
                {taskData.status === 'completed' ? (
                    <div className="w-full h-20 bg-green-500/10 text-green-500 border border-green-500/20 rounded-3xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.4em]">
                        <CheckCircle2 size={24} /> Protocol Finalized
                    </div>
                ) : (
                    ['at-studio', 'washing', 'quality-check'].includes(taskData.status) && (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <p className={`text-[10px] font-black uppercase tracking-[0.5em] italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Studio Node Active</p>
                            <div className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )
                )}
            </div>

            <AnimatePresence>
                {showPinModal && (
                    <PinModal
                        isOpen={showPinModal}
                        title={pendingStatus === 'completed' ? 'Final Handover' : 'Identity Verification'}
                        onConfirm={handlePinConfirm}
                        onCancel={() => setShowPinModal(false)}
                        isDarkMode={isDarkMode}
                    />
                )}
            </AnimatePresence>

            {/* 🔥 Global Overlay for Media Streams */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-2xl z-[500] flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-24 h-24 border-8 border-brand/10 border-t-brand rounded-full animate-spin mb-10" />
                        <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-4">Evidence Streaming</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand italic">Protocol Secured • Transmitting High-Resolution Proofs to Studio Node</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskDetails;
