import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Navigation, Truck, Package,
    Locate, Search, Activity, Shield, Zap, Info,
    ArrowUpRight, Clock, User
} from 'lucide-react';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { staffAPI } from '../../../utils/staffApi';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

// 🛠️ Hub Asset Protocol: Elite Marker Assets
const ASSETS = {
    USER_BIKE: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png', // Specialist/Bike
    PICKUP: 'https://cdn-icons-png.flaticon.com/512/2769/2769339.png',    // Truck
    DELIVERY: 'https://cdn-icons-png.flaticon.com/512/1670/1670915.png', // Package/Delivery
    PRODUCT: 'https://cdn-icons-png.flaticon.com/512/1554/1554591.png'    // Box
};

const StaffMapView = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default India center
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTasks = useCallback(async () => {
        try {
            const res = await staffAPI.getTasks();
            if (res.status === 'success') {
                const serviceTasks = (res.data.tasks || [])
                    .filter((t) => t.service?.category !== 'Apartment' && t.service?.key !== 'APARTMENT_WASH')
                    .map(t => ({
                    ...t,
                    id: t._id,
                    isProduct: false,
                    type: ['quality-check', 'ready-for-delivery', 'delivery-assigned'].includes(t.status) ? 'Delivery' : 'Pickup',
                    coords: { 
                        lat: t.location?.address?.coordinates?.lat || 0, 
                        lng: t.location?.address?.coordinates?.lng || 0 
                    }
                }));
                const productTasks = (res.data.productTasks || []).map(t => ({
                    ...t,
                    id: t._id,
                    isProduct: true,
                    type: 'Product',
                    coords: { lat: 0, lng: 0 }
                }));
                // Filter out tasks without valid coordinates
                const validTasks = [...serviceTasks, ...productTasks].filter(t => t.coords.lat !== 0);
                setTasks(validTasks);

                if (validTasks.length > 0 && !currentPos) {
                    setMapCenter(validTasks[0].coords);
                }
            }
        } catch (err) {
            console.error('Failed to sync missions:', err);
            toast.error('Mission Sync Failure');
        } finally {
            setLoading(false);
        }
    }, [currentPos]);

    useEffect(() => {
        fetchTasks();

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const pos = { lat: latitude, lng: longitude };
                    setCurrentPos(pos);
                    setMapCenter(pos);
                },
                (error) => console.error('GPS Fatal:', error),
                { enableHighAccuracy: true }
            );
        }
    }, [fetchTasks]);

    const handleLocateMe = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentPos(coords);
                setMapCenter(coords);
                toast.success('Terminal Position Synchronized');
            });
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.consumer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location?.address?.street?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const mapMarkers = [
        ...(currentPos ? [{
            position: currentPos,
            icon: {
                url: ASSETS.USER_BIKE,
                scaledSize: new window.google.maps.Size(42, 42),
                anchor: new window.google.maps.Point(21, 42)
            },
            infoContent: (
                <div className="text-center p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand">Your Terminal</p>
                    <p className="text-xs font-bold mt-1 text-white">Active Pulse</p>
                </div>
            )
        }] : []),
        ...filteredTasks.map(task => ({
            position: task.coords,
            icon: {
                url: task.type === 'Pickup' ? ASSETS.PICKUP : 
                    (task.type === 'Delivery' ? ASSETS.DELIVERY : ASSETS.PRODUCT),
                scaledSize: new window.google.maps.Size(38, 38),
                anchor: new window.google.maps.Point(19, 38)
            },
            infoContent: (
                <div className="p-0 min-w-[200px] bg-white/5 rounded-2xl overflow-hidden font-outfit shadow-2xl border border-white/5">
                    <div className="p-3 bg-white/[0.02]/50 border-b border-white/5 flex items-center justify-between">
                        <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            task.type === 'Pickup' ? 'bg-blue-500 text-white' :
                            task.type === 'Delivery' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                        }`}>
                            {task.type} Mission
                        </div>
                        <p className="text-[9px] font-black text-brand uppercase tracking-tighter">#{String(task.id).slice(-4)}</p>
                    </div>

                    <div className="p-4">
                        <div className="mb-3">
                            <h4 className="text-[11px] font-black uppercase tracking-tight text-white mb-0.5 truncate">{task.consumer?.name || 'Protocol Client'}</h4>
                            <div className="flex items-center gap-1 opacity-40">
                                <MapPin size={8} />
                                <p className="text-[8px] font-bold uppercase truncate">{task.location?.address?.street || 'Assigned Node'}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-lg bg-white/[0.05] flex items-center justify-center">
                                    <Clock size={10} className="text-brand" />
                                </div>
                                <p className="text-[9px] font-black text-white">{task.schedule?.timeSlot?.start || 'Instant'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-black text-gray-400 uppercase leading-none">Status</p>
                                <p className="text-[9px] font-black text-brand uppercase">{task.status}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(task.isProduct ? `/staff/product-task/${task.orderId}/${task.id}` : `/staff/task/${task.id}`)}
                            className="w-full h-10 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95 transition-all"
                        >
                            Execute Protocol <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            )
        }))
    ];

    return (
        <div className={`h-screen w-screen relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'}`}>
            {/* 🛰️ Background Google Map */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <GoogleMapBox 
                    center={mapCenter}
                    zoom={13}
                    darkMode={isDarkMode}
                    markers={mapMarkers}
                />
            </div>

            {/* 🛡️ HUD: Overlays */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
                {/* Header HUD */}
                <header className="px-6 pt-12 pb-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/20 via-black/10 to-transparent">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-3xl shadow-2xl overflow-hidden active:scale-90 transition-all ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-white' : 'bg-white/80 border-white/5 text-content'}`}
                    >
                        <ChevronLeft size={24} />
                    </motion.button>

                    <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-1.5 ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Dispatch HUD</p>
                        <h1 className={`text-xl font-black leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Mission Map</h1>
                    </div>

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-3xl shadow-2xl ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-brand' : 'bg-white/80 border-white/5 text-brand'}`}>
                        <Shield size={24} fill="currentColor" className="opacity-20" />
                        <Activity size={12} className="absolute animate-pulse" />
                    </div>
                </header>

                {/* Sub-HUD: Search & Active Controls */}
                <div className="mt-4 px-6 space-y-4 pointer-events-auto">
                    <div className={`relative group shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 border-white/5 ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 focus-within:border-brand/40' : 'bg-white/80 border-white/5 focus-within:border-brand/40'} backdrop-blur-3xl`}>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={18} />
                        <input
                            type="text"
                            placeholder="Find Mission or Node..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-transparent pl-[3.5rem] pr-6 text-xs font-black uppercase tracking-widest placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLocateMe}
                            className={`h-12 px-6 rounded-2xl flex items-center gap-3 backdrop-blur-3xl border transition-all active:scale-95 shadow-2xl shadow-black/50 ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-white' : 'bg-white/80 border-white/5 text-content'}`}
                        >
                            <Locate size={18} className="text-brand" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Recenter HUD</span>
                        </button>
                        <div className={`h-12 px-6 rounded-2xl flex items-center gap-3 backdrop-blur-3xl border border-white/5 shadow-2xl shadow-black/50 ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-brand/5 border-brand/10 text-brand'}`}>
                            <Zap size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{filteredTasks.length} NODES ACTIVE</span>
                        </div>
                    </div>
                </div>

                {/* Footer HUD: Quick Status & Legend */}
                <div className="mt-auto p-8 pointer-events-auto">
                    <div className={`max-w-md mx-auto rounded-[3rem] p-6 backdrop-blur-3xl border shadow-3xl flex items-end justify-between ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/95 border-white/5'}`}>
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Pickup</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Delivery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Product</span>
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Terminal Telemetry Active</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40`}>Real-time synchronization with HUB center enabled</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchTasks}
                            className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-2xl shadow-black/50 shadow-brand/30 active:scale-90 transition-all"
                        >
                            <Activity size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 🛠️ Global HUD Overlays */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col items-center justify-center gap-8"
                    >
                        <div className="w-20 h-20 border-white/5 border-brand/10 border-t-brand rounded-full animate-spin" />
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Initializing Fleet Map</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand">Pulling Geospatial Terminal Logs...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffMapView;
