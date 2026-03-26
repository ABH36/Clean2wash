import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, ChevronLeft, Search, Navigation, Home, Briefcase,
    Plus, ChevronRight, Check, Zap, Calendar, Clock,
    ChevronDown, Locate, Map as MapIcon, Crosshair, Star
} from 'lucide-react';
import LocationContext from '../../../context/LocationContextBase';
import { serviceAPI } from '../../../utils/api';
import { geocodingService } from '../../../utils/geocoding';
import { toast } from 'react-hot-toast';

// Fix Leaflet marker icon issue
const studioIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// Helper component to center map
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
};

const MapEvents = ({ onMove }) => {
    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            onMove([center.lat, center.lng]);
        },
    });
    return null;
};

// Removed hardcoded SAVED_PLACES and RECENT_LOCATIONS

const MapScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type');
    const context = searchParams.get('from') || 'wash';
    const { currentLocation, detectCurrentLocation, saveLocation } = useContext(LocationContext);

    const searchInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState({
        label: 'Locating...',
        address: 'Fetching address details...',
        coordinates: { lat: 28.7041, lng: 77.1025 }
    });
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [mapOpacity, setMapOpacity] = useState(0.8); // Default to full opacity for real map
    const [studios, setStudios] = useState([]);

    // Fetch studios if type=vendor
    useEffect(() => {
        if (type === 'vendor') {
            const fetchStudios = async () => {
                try {
                    const params = { type: 'Studio' };
                    if (currentLocation) {
                        params.lat = currentLocation.lat;
                        params.lng = currentLocation.lng;
                        params.radius = 10;
                    }
                    const response = await serviceAPI.getHubs(params);
                    if (response.status === 'success') {
                        const mapped = response.data.hubs.map(hub => ({
                            id: hub._id,
                            name: hub.vendor?.profile?.studioName || hub.name,
                            coordinates: hub.location?.coordinates?.coordinates || [77.1025, 28.7041],
                            rating: hub.vendor?.rating || 4.8,
                            image: hub.vendor?.profile?.avatar || 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
                            price: '₹899'
                        }));
                        setStudios(mapped);
                    }
                } catch (err) {
                    console.error('Failed to fetch vendors for map:', err);
                }
            };
            fetchStudios();
        }
    }, [type, currentLocation]);

    // Reverse geocode when map center changes
    const handleMapMove = useCallback(async (pos) => {
        setIsGeocoding(true);
        const geocoded = await geocodingService.reverse(pos[0], pos[1]);
        if (geocoded) {
            setSelectedLocation({
                label: geocoded.street,
                address: geocoded.display_name,
                coordinates: { lat: pos[0], lng: pos[1] }
            });
        }
        setIsGeocoding(false);
    }, []);

    // 🔍 Real-time Search Integration
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                const results = await geocodingService.search(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleLocateMe = async () => {
        try {
            const pos = await detectCurrentLocation();
            if (pos) {
                setMapOpacity(0.8);
                setTimeout(() => setMapOpacity(0.4), 1000);
            }
        } catch (err) {
            toast.error('Location Access Denied');
        }
    };

    const handleConfirm = async () => {
        if (!selectedLocation.coordinates) return;
        
        try {
            toast.loading('Saving location...', { id: 'save-loc' });
            await saveLocation(
                selectedLocation.coordinates.lat, 
                selectedLocation.coordinates.lng,
                selectedLocation.label
            );
            toast.success('Location synchronized', { id: 'save-loc' });
            navigate(-1);
        } catch (err) {
            toast.error('Failed to save location', { id: 'save-loc' });
        }
    };

    const handleEdit = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="h-screen w-full bg-white relative overflow-hidden flex flex-col font-sans">
            {/* ── Background Map Surface ── */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[currentLocation?.lat || 28.7041, currentLocation?.lng || 77.1025]}
                    zoom={13}
                    zoomControl={false}
                    className="h-full w-full"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterMap lat={currentLocation?.lat} lng={currentLocation?.lng} />
                    <MapEvents onMove={handleMapMove} />

                    {currentLocation && (
                        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}

                    {type === 'vendor' && studios.map(studio => (
                        <Marker
                            key={studio.id}
                            position={[studio.coordinates[1], studio.coordinates[0]]}
                            icon={studioIcon}
                        >
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <img src={studio.image} className="w-full h-20 object-cover rounded-lg mb-2" alt={studio.name} />
                                    <h4 className="font-black text-xs uppercase mb-1">{studio.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-brand font-black italic">{studio.price}</span>
                                        <button
                                            onClick={() => navigate(`/service/${studio.id}`)}
                                            className="bg-black text-white text-[8px] px-2 py-1 rounded-md font-black uppercase"
                                        >
                                            Book
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/90 pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {!type && (
                    <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative">
                            <div className="w-14 h-14 bg-black rounded-[1.25rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-white relative z-10">
                                <MapPin size={28} className="text-brand" fill="currentColor" strokeWidth={1} />
                            </div>
                            <div className="w-2 h-2 bg-black rounded-full mx-auto mt-1 shadow-2xl" />
                        </motion.div>
                    </div>
                )}
            </div>

            {/* ── Top Bar Container ── */}
            <header className="relative z-50 px-5 pt-12 space-y-5">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white/90 backdrop-blur-2xl border border-black/[0.03] rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                    >
                        <ChevronLeft size={24} strokeWidth={3} className="text-black" />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] font-black tracking-[0.3em] text-black/20 uppercase block mb-0.5">Positioning</span>
                        <h1 className="text-[15px] font-black text-black uppercase tracking-tight">Set Location</h1>
                    </div>
                    <button className="w-12 h-12 bg-white/90 backdrop-blur-2xl border border-black/[0.03] rounded-2xl flex items-center justify-center shadow-2xl">
                        <MapIcon size={22} className="text-black/30" />
                    </button>
                </div>

                <div className="relative group shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[1.5rem] overflow-hidden">
                    <div className="absolute inset-y-0 left-6 flex items-center text-black/20 group-focus-within:text-brand transition-colors duration-300">
                        <Search size={22} strokeWidth={3} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search area, landmark..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 bg-white border-0 pl-16 pr-16 text-sm font-black text-black placeholder:text-black/20 focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                    />
                    <button
                        onClick={handleLocateMe}
                        className="absolute inset-y-0 right-6 flex items-center text-brand"
                    >
                        <Locate size={22} strokeWidth={3} />
                    </button>
                </div>

                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] mt-2 border border-black/[0.02] shadow-[0_40px_80px_rgba(0,0,0,0.15)] max-h-[40vh] overflow-y-auto p-4 space-y-1"
                        >
                            {searchResults.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => {
                                        setSelectedLocation({
                                            label: loc.label,
                                            address: loc.address,
                                            coordinates: { lat: loc.lat, lng: loc.lng }
                                        });
                                        // Update currentLocation to center map
                                        detectCurrentLocation(); // Silently trigger center update if needed
                                        setSearchQuery('');
                                    }}
                                    className="w-full flex items-center gap-5 p-4 hover:bg-black/[0.02] rounded-[2rem] transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black/15 group-hover:text-brand transition-all">
                                        <MapPin size={22} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1.5">{loc.label}</h4>
                                        <p className="text-[11px] font-bold text-black/30 uppercase tracking-widest truncate">{loc.address}</p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── Bottom Section ── */}
            <div className="mt-auto relative z-50">
                {/* Saved Places section removed as requested */}

                <div className="bg-white rounded-t-[2.5rem] p-6 pt-5 shadow-[0_-30px_60px_rgba(0,0,0,0.1)] border-t border-black/[0.03]">
                    <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6" />

                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 flex-shrink-0">
                                <MapPin size={22} strokeWidth={3} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em]">Drop Point</h3>
                                    <button onClick={handleEdit} className="text-brand text-[9px] font-black uppercase tracking-widest underline underline-offset-4">Edit</button>
                                </div>
                                <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-tight mb-0.5 truncate">
                                    {selectedLocation.label}
                                </h4>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-relaxed">
                                    {selectedLocation.address}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50/70 p-3 rounded-[1.25rem] border border-black/[0.01]">
                                <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-1.5 leading-none">Security</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    <span className="text-[10px] font-black text-black uppercase tracking-tight">Active Zone</span>
                                </div>
                            </div>
                            <div className="bg-gray-50/70 p-3 rounded-[1.25rem] border border-black/[0.01]">
                                <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-1.5 leading-none">Category</p>
                                <div className="flex items-center gap-2">
                                    <Zap size={10} className="text-brand" fill="currentColor" />
                                    <span className="text-[10px] font-black text-black uppercase tracking-tight">{context === 'chauffeur' ? 'Expert Driver' : 'Elite Care'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={handleConfirm}
                            disabled={isGeocoding}
                            className="w-full bg-black text-white h-14 rounded-2xl font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center relative group overflow-hidden disabled:opacity-50"
                        >
                            <span className="relative z-10 pl-4">
                                {isGeocoding ? 'Locating...' : 'Confirm Location'}
                            </span>
                            <div className="absolute right-6 opacity-30 group-hover:translate-x-1 transition-transform relative z-10">
                                <ChevronRight size={22} strokeWidth={3} />
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .font-black { font-weight: 1000; }
                .tracking-tighter { letter-spacing: -0.05em; }
            `}} />
        </div>
    );
};

export default MapScreen;
