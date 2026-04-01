import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import {
    ChevronLeft, Search, MapPin, Star, Clock,
    Filter, SlidersHorizontal, Navigation, ArrowRight,
    Briefcase, ShieldCheck, Zap, Droplets, Map as MapIcon, List
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import LocationContext from '../../../context/LocationContextBase';
import { serviceAPI } from '../../../utils/api';

const StudioDiscovery = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [studios, setStudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentLocation, detectCurrentLocation } = useContext(LocationContext);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    useEffect(() => {
        if (!currentLocation) {
            detectCurrentLocation().catch(err => console.error('Location detection failed:', err));
        }
    }, [currentLocation, detectCurrentLocation]);

    useEffect(() => {
        const fetchStudios = async () => {
            try {
                setLoading(true);
                const params = { type: 'Studio' };
                if (currentLocation) {
                    params.lat = currentLocation.lat;
                    params.lng = currentLocation.lng;
                    params.radius = 10;
                }

                const response = await serviceAPI.getHubs(params);
                if (response.status === 'success') {
                    const mappedStudios = response.data.hubs.map(hub => ({
                        id: hub._id,
                        name: hub.vendor?.profile?.studioName || hub.name,
                        location: `${hub.city} · ${hub.load} Load`,
                        coordinates: hub.location?.coordinates?.coordinates || [77.1025, 28.7041], // [lng, lat]
                        rating: hub.vendor?.rating || 4.8,
                        reviews: Math.floor(Math.random() * 500) + 100,
                        image: hub.vendor?.profile?.avatar || 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
                        tags: [hub.city, 'Express Wash'],
                        price: '₹899',
                        isElite: hub.type === 'Studio',
                        features: ['Pickup Available', 'CCTV Monitor', 'Waiting Lounge']
                    }));
                    setStudios(mappedStudios);
                }
            } catch (error) {
                console.error('Failed to fetch studios:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudios();
    }, [currentLocation]);

    const filteredStudios = studios.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MobileLayout hideNav>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Nearby Studios</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Top-rated centers near you</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                        <Search size={16} className="text-content-subtle" strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Search studios..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent text-xs font-bold text-content outline-none placeholder:font-medium placeholder:text-content-subtle"
                        />
                    </div>
                    <button className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-content">
                        <SlidersHorizontal size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pt-4 pb-1 scrollbar-hide">
                    {['All', 'Elite', 'Fastest', 'Budget-Friendly'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeFilter === f ? 'bg-brand text-white border-brand shadow-md' : 'bg-white border-gray-100 text-content-muted hover:bg-gray-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-6 pb-24">
                {/* ── View Toggle ── */}
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-brand' : 'text-content-muted'}`}
                    >
                        <List size={16} /> List View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white shadow-md text-brand' : 'text-content-muted'}`}
                    >
                        <MapIcon size={16} /> Map View
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'map' ? (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-[60vh] rounded-[2.5rem] overflow-hidden border-2 border-white shadow-2xl relative"
                        >
                            <GoogleMapBox 
                                center={{
                                    lat: currentLocation?.lat || 28.7041,
                                    lng: currentLocation?.lng || 77.1025
                                }}
                                zoom={13}
                                markers={[
                                    ...(currentLocation ? [{
                                        position: { lat: currentLocation.lat, lng: currentLocation.lng },
                                        icon: {
                                            url: 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png',
                                            scaledSize: new window.google.maps.Size(30, 30),
                                            anchor: new window.google.maps.Point(15, 30)
                                        },
                                        infoContent: <div className="p-1 font-bold text-xs uppercase text-brand">You are here</div>
                                    }] : []),
                                    ...(studios.map(studio => ({
                                        position: { 
                                            lat: studio.coordinates[1], 
                                            lng: studio.coordinates[0] 
                                        },
                                        icon: {
                                            url: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
                                            scaledSize: new window.google.maps.Size(42, 42),
                                            anchor: new window.google.maps.Point(21, 42)
                                        },
                                        infoContent: (
                                            <div className="p-0 min-w-[180px] bg-white rounded-2xl overflow-hidden font-outfit shadow-2xl border border-gray-100">
                                                <div className="relative h-24">
                                                    <img src={studio.image} className="w-full h-full object-cover" alt={studio.name} />
                                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                                                        <Star size={10} className="text-amber-400" fill="currentColor" />
                                                        <span className="text-[10px] font-black">{studio.rating}</span>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-black text-[11px] uppercase tracking-tight mb-1 text-black truncate">{studio.name}</h4>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div>
                                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">Starting from</p>
                                                            <p className="text-brand font-black text-sm italic">{studio.price}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/service/${studio.id}`)}
                                                            className="bg-black text-white text-[9px] px-3 py-2 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-black/10"
                                                        >
                                                            Book
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })))
                                ]}
                            />

                            {!currentLocation && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-10">
                                    <Navigation size={40} className="text-brand animate-bounce mb-4" />
                                    <h4 className="font-black text-content uppercase tracking-tight">Detecting Location...</h4>
                                    <p className="text-[10px] font-bold text-content-subtle mt-2">Allow location access to see studios near you</p>
                                    <button
                                        onClick={() => detectCurrentLocation()}
                                        className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Enable Access
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* ── Map Teaser (Only in List View) ── */}
                            <div className="bg-content rounded-2xl p-4 shadow-lg flex items-center justify-between relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="text-white font-black text-sm tracking-tight mb-1">View on Map</h3>
                                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">See studios around you</p>
                                </div>
                                <button onClick={() => setViewMode('map')} className="relative z-10 w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Navigation size={18} fill="white" />
                                </button>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full" />
                            </div>

                            {/* ── Studio List ── */}
                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
                                    ))
                                ) : filteredStudios.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <MapPin size={40} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-xs font-bold text-content-subtle uppercase tracking-widest">No studios found nearby</p>
                                    </div>
                                ) : (
                                    filteredStudios.map((studio, i) => (
                                        <motion.div
                                            key={studio.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/map?studio=${studio.id}&type=vendor&price=${studio.price}`)}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden group cursor-pointer"
                                        >
                                            {/* Image Header */}
                                            <div className="relative h-44 overflow-hidden">
                                                <img src={studio.image} alt={studio.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                {studio.isElite && (
                                                    <div className="absolute top-3 left-3 bg-brand px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                                        <Zap size={10} className="text-white" fill="white" />
                                                        <span className="text-white text-[8px] font-black uppercase tracking-widest">Elite Service</span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                                    <div>
                                                        <h3 className="text-white text-lg font-black tracking-tight leading-none mb-1">{studio.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                                                                <Star size={10} className="text-amber-400" fill="currentColor" />
                                                                <span className="text-white text-[10px] font-black">{studio.rating}</span>
                                                            </div>
                                                            <span className="text-white/60 text-[10px] font-bold">{studio.location}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-xl shadow-lg">
                                                        <p className="text-[7px] font-black text-content-subtle uppercase tracking-widest leading-none mb-0.5">Starts at</p>
                                                        <p className="text-brand font-black text-base leading-none italic">{studio.price}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Footer */}
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    {studio.features.slice(0, 2).map(f => (
                                                        <div key={f} className="flex items-center gap-1 text-[9px] font-black text-content-subtle uppercase tracking-wider">
                                                            <ShieldCheck size={12} className="text-brand" /> {f}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all">
                                                    <ArrowRight size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* ── Promotion ── */}
                            <div className="bg-gray-100 rounded-2xl p-5 border border-dashed border-gray-300 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Droplets size={24} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-xs text-content uppercase tracking-widest">Become a Partner</h4>
                                    <p className="text-[10px] font-bold text-content-subtle mt-1">List your studio on CarWash and reach 10x customers.</p>
                                </div>
                                <button onClick={() => navigate('/vendor/signup')} className="text-brand text-[8px] font-black uppercase tracking-widest border-b border-brand/30">Join Us</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default StudioDiscovery;
