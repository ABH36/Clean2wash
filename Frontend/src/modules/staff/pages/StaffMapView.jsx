import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Navigation, Truck, Package,
    Locate, Search, Activity, Shield, Zap, Info,
    ArrowUpRight, Clock, User
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { staffAPI } from '../../../utils/staffApi';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

// 🛠️ Hub Asset Protocol: Custom Markers
const createIcon = (color, Icon) => {
    return L.divIcon({
        html: `<div class="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-2xl transition-all duration-300 transform hover:scale-110" style="background: ${color}; color: white;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    ${Icon}
                </svg>
              </div>`,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

const staffIcon = createIcon('#4F46E5', '<circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/>'); // Crosshair/Pulse
const pickupIcon = createIcon('#3B82F6', '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'); // Truck
const deliveryIcon = createIcon('#10B981', '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'); // Package
const productIcon = createIcon('#8B5CF6', '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'); // Package reuse

// Helper to recenter map
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 14);
    }, [center, map]);
    return null;
};

const StaffMapView = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState(null);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India center
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTasks = useCallback(async () => {
        try {
            const res = await staffAPI.getTasks();
            if (res.status === 'success') {
                const serviceTasks = (res.data.tasks || []).map(t => ({
                    ...t,
                    id: t._id,
                    isProduct: false,
                    type: ['quality-check', 'ready-for-delivery', 'delivery-assigned'].includes(t.status) ? 'Delivery' : 'Pickup',
                    coords: [t.location?.address?.coordinates?.lat || 0, t.location?.address?.coordinates?.lng || 0]
                }));
                const productTasks = (res.data.productTasks || []).map(t => ({
                    ...t,
                    id: t._id,
                    isProduct: true,
                    type: 'Product',
                    coords: [0, 0] // Geolocation for product tasks might be different or center of hub
                }));
                // Filter out tasks without valid coordinates
                const validTasks = [...serviceTasks, ...productTasks].filter(t => t.coords[0] !== 0);
                setTasks(validTasks);

                // If we have tasks but no current position, center on the first task
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

        // 🛰️ Initialize Geolocation Tracking
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPos([latitude, longitude]);
                    setMapCenter([latitude, longitude]);
                },
                (error) => console.error('GPS Fatal:', error),
                { enableHighAccuracy: true }
            );
        }
    }, [fetchTasks]);

    const handleLocateMe = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
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

    return (
        <div className={`h-screen w-screen relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FAFBFF]'}`}>
            {/* 🛰️ Background Tactical Map */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%', filter: isDarkMode ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterMap center={mapCenter} />

                    {currentPos && (
                        <Marker position={currentPos} icon={staffIcon}>
                            <Popup className="premium-popup">
                                <div className="text-center p-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand">Your Terminal</p>
                                    <p className="text-xs font-bold mt-1">Active Pulse</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {filteredTasks.map(task => (
                        <Marker
                            key={task.id}
                            position={task.coords}
                            icon={task.type === 'Pickup' ? pickupIcon : task.type === 'Delivery' ? deliveryIcon : productIcon}
                        >
                            <Popup className="premium-popup">
                                <div className="p-4 min-w-[200px] flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${task.type === 'Pickup' ? 'bg-blue-500/10 text-blue-500' :
                                                task.type === 'Delivery' ? 'bg-green-500/10 text-green-500' : 'bg-purple-500/10 text-purple-500'
                                            }`}>
                                            {task.type} Mission
                                        </div>
                                        <p className="text-[9px] font-black text-brand uppercase">#{String(task.id).slice(-4)}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight leading-none mb-1">{task.consumer?.name || 'Protocol Client'}</h4>
                                        <p className="text-[10px] text-content-subtle font-bold truncate">{task.location?.address?.street || 'Assigned Node'}</p>
                                    </div>

                                    <div className="flex items-center gap-2 py-2 border-y border-gray-100/10">
                                        <Clock size={12} className="text-brand" />
                                        <p className="text-[10px] font-black">{task.schedule?.timeSlot?.start || 'Instant'}</p>
                                    </div>

                                    <button
                                        onClick={() => navigate(task.isProduct ? `/staff/product-task/${task.orderId}/${task.id}` : `/staff/task/${task.id}`)}
                                        className="w-full h-10 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand/20 active:scale-95 transition-all"
                                    >
                                        Execute Protocol <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* 🛡️ HUD: Overlays */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
                {/* Header HUD */}
                <header className="px-6 pt-12 pb-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/20 via-black/10 to-transparent">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-3xl shadow-2xl overflow-hidden active:scale-90 transition-all ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-white' : 'bg-white/80 border-gray-100 text-content'}`}
                    >
                        <ChevronLeft size={24} />
                    </motion.button>

                    <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-1.5 ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Dispatch HUD</p>
                        <h1 className={`text-xl font-black leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Mission Map</h1>
                    </div>

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-3xl shadow-2xl ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-brand' : 'bg-white/80 border-gray-100 text-brand'}`}>
                        <Shield size={24} fill="currentColor" className="opacity-20" />
                        <Activity size={12} className="absolute animate-pulse" />
                    </div>
                </header>

                {/* Sub-HUD: Search & Active Controls */}
                <div className="mt-4 px-6 space-y-4 pointer-events-auto">
                    <div className={`relative group shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 border-2 ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 focus-within:border-brand/40' : 'bg-white/80 border-gray-100 focus-within:border-brand/40'} backdrop-blur-3xl`}>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={18} />
                        <input
                            type="text"
                            placeholder="Find Mission or Node..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-transparent pl-14 pr-6 text-xs font-black uppercase tracking-widest placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLocateMe}
                            className={`h-12 px-6 rounded-2xl flex items-center gap-3 backdrop-blur-3xl border transition-all active:scale-95 shadow-xl ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5 text-white' : 'bg-white/80 border-gray-100 text-content'}`}
                        >
                            <Locate size={18} className="text-brand" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Recenter HUD</span>
                        </button>
                        <div className={`h-12 px-6 rounded-2xl flex items-center gap-3 backdrop-blur-3xl border border-white/5 shadow-xl ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-brand/5 border-brand/10 text-brand'}`}>
                            <Zap size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{filteredTasks.length} NODES ACTIVE</span>
                        </div>
                    </div>
                </div>

                {/* Footer HUD: Quick Status & Legend */}
                <div className="mt-auto p-8 pointer-events-auto">
                    <div className={`max-w-md mx-auto rounded-[3rem] p-6 backdrop-blur-3xl border shadow-3xl flex items-end justify-between ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/95 border-gray-100'}`}>
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
                            className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/30 active:scale-90 transition-all"
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
                        <div className="w-20 h-20 border-8 border-brand/10 border-t-brand rounded-full animate-spin" />
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Initializing Fleet Map</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand">Pulling Geospatial Terminal Logs...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .premium-popup .leaflet-popup-content-wrapper {
                    background: ${isDarkMode ? '#1E293B' : '#FFFFFF'} !important;
                    color: ${isDarkMode ? '#FFFFFF' : '#0F172A'} !important;
                    border-radius: 2rem !important;
                    padding: 0 !important;
                    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
                    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3) !important;
                }
                .premium-popup .leaflet-popup-content {
                    margin: 0 !important;
                }
                .premium-popup .leaflet-popup-tip {
                    background: ${isDarkMode ? '#1E293B' : '#FFFFFF'} !important;
                }
                .custom-div-icon {
                    background: none !important;
                    border: none !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            `}} />
        </div>
    );
};

export default StaffMapView;
