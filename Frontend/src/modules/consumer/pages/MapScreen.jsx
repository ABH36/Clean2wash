import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import {
    MapPin, ChevronLeft, Search, Navigation, Home, Briefcase,
    Plus, ChevronRight, Check, Zap, Calendar, Clock,
    ChevronDown, Locate, Map as MapIcon, Crosshair, Star
} from 'lucide-react';
import LocationContext from '../../../context/LocationContextBase';
import { serviceAPI } from '../../../utils/api';
import { geocodingService } from '../../../utils/geocoding';
import { toast } from 'react-hot-toast';

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const USER_AND_CAR_MARKER = svgToDataUrl(`
<svg width="72" height="84" viewBox="0 0 72 84" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="36" cy="75" rx="18" ry="6" fill="rgba(15,23,42,0.16)"/>
  <path d="M36 5C23.85 5 14 14.85 14 27C14 43.5 36 64 36 64C36 64 58 43.5 58 27C58 14.85 48.15 5 36 5Z" fill="white" stroke="#F29F05" stroke-width="2.4"/>
  <circle cx="36" cy="20.2" r="4.6" fill="#F97316"/>
  <path d="M28 30.6C28 27.9 30.2 25.7 32.9 25.7H39.1C41.8 25.7 44 27.9 44 30.6V33H28V30.6Z" fill="#F29F05"/>
  <rect x="23" y="34.2" width="26" height="7" rx="3.5" fill="#111827"/>
  <rect x="27.5" y="28.8" width="17" height="6.1" rx="2.6" fill="#111827"/>
  <circle cx="29.5" cy="42.8" r="3.1" fill="#111827"/>
  <circle cx="42.5" cy="42.8" r="3.1" fill="#111827"/>
</svg>
`);

const LOCATION_PICKER_PIN = svgToDataUrl(`
<svg width="82" height="98" viewBox="0 0 82 98" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="41" cy="88" rx="20" ry="7" fill="rgba(15,23,42,0.16)"/>
  <path d="M41 7C27.193 7 16 18.193 16 32C16 50 41 73 41 73C41 73 66 50 66 32C66 18.193 54.807 7 41 7Z" fill="#101828"/>
  <path d="M41 11C29.402 11 20 20.402 20 32C20 47.346 41 67.173 41 67.173C41 67.173 62 47.346 62 32C62 20.402 52.598 11 41 11Z" fill="#111827" stroke="#F29F05" stroke-width="2.4"/>
  <circle cx="41" cy="32" r="15" fill="white"/>
  <path d="M41 22.5L44.4 29.6L52 30.6L46.5 35.8L47.9 43.2L41 39.4L34.1 43.2L35.5 35.8L30 30.6L37.6 29.6L41 22.5Z" fill="#F29F05"/>
  <rect x="29.5" y="46.5" width="23" height="6.8" rx="3.4" fill="#111827"/>
  <circle cx="34" cy="54.8" r="3" fill="#111827"/>
  <circle cx="48" cy="54.8" r="3" fill="#111827"/>
</svg>
`);

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
    const [studios, setStudios] = useState([]);
    const [map, setMap] = useState(null);

    const syncSelectedLocation = useCallback(async (pos, fallbackLabel = 'Selected Location', fallbackAddress = '') => {
        if (!pos?.lat || !pos?.lng) return;

        setIsGeocoding(true);
        try {
            const geocoded = await geocodingService.reverse(pos.lat, pos.lng);

            if (geocoded) {
                setSelectedLocation({
                    label: geocoded.area || geocoded.street || fallbackLabel,
                    address: geocoded.display_name || fallbackAddress || `${geocoded.street}, ${geocoded.city}`,
                    coordinates: pos
                });
                return;
            }

            setSelectedLocation({
                label: fallbackLabel,
                address: fallbackAddress || 'Address unavailable for this point',
                coordinates: pos
            });
        } catch (err) {
            console.error('MapScreen location sync error:', err);
            setSelectedLocation({
                label: fallbackLabel,
                address: fallbackAddress || 'Address unavailable for this point',
                coordinates: pos
            });
        } finally {
            setIsGeocoding(false);
        }
    }, []);

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
                            coordinates: {
                                lat: hub.location?.coordinates?.coordinates?.[1] || 28.7041,
                                lng: hub.location?.coordinates?.coordinates?.[0] || 77.1025
                            },
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

    useEffect(() => {
        if (currentLocation?.lat && currentLocation?.lng) {
            syncSelectedLocation(currentLocation, 'Current Location');
            return;
        }

        detectCurrentLocation().catch((err) => {
            console.warn('MapScreen auto-location failed:', err?.message || err);
        });
    }, [currentLocation, detectCurrentLocation, syncSelectedLocation]);

    // Reverse geocode when map center changes
    const handleMapIdle = useCallback(async (pos) => {
        await syncSelectedLocation(pos, 'Selected Location');
    }, [syncSelectedLocation]);

    // 🔍 Real-time Search Integration (Google Autocomplete fallback or manual)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                if (window.google?.maps?.places?.AutocompleteService) {
                    const service = new window.google.maps.places.AutocompleteService();
                    service.getPlacePredictions({ input: searchQuery }, (predictions) => {
                        if (predictions) {
                            setSearchResults(predictions.map(p => ({
                                id: p.place_id,
                                label: p.structured_formatting.main_text,
                                address: p.description,
                                placeId: p.place_id
                            })));
                        }
                    });
                }
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
            if (pos && map) {
                map.panTo(pos);
            }
            if (pos) {
                await syncSelectedLocation(pos, 'Current Location');
            }
        } catch (err) {
            toast.error('Location Access Denied');
        }
    };

    const handleSearchResultSelect = async (loc) => {
        if (loc.placeId && window.google?.maps?.places?.PlacesService) {
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            service.getDetails({ placeId: loc.placeId }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry?.location) {
                    const pos = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    setSelectedLocation({
                        label: loc.label,
                        address: loc.address,
                        coordinates: pos
                    });
                    if (map) map.panTo(pos);
                    syncSelectedLocation(pos, loc.label, loc.address);
                    setSearchQuery('');
                    setSearchResults([]);
                }
            });
        }
    };

    const handleConfirm = async () => {
        if (!selectedLocation.coordinates) return;
        
        try {
            toast.loading('Saving location...', { id: 'save-loc' });
            await saveLocation(
                selectedLocation.coordinates.lat, 
                selectedLocation.coordinates.lng,
                selectedLocation.label === 'Selected Location' ? 'Home' : selectedLocation.label
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

    const mapMarkers = [
        ...(currentLocation ? [{
            position: currentLocation,
            icon: {
                url: USER_AND_CAR_MARKER,
                scaledSize: window.google?.maps ? new window.google.maps.Size(44, 52) : undefined,
                anchor: window.google?.maps ? new window.google.maps.Point(22, 44) : undefined
            }
        }] : []),
        ...(type === 'vendor' ? studios.map(studio => ({
            position: studio.coordinates,
            icon: {
                url: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
                scaledSize: window.google?.maps ? new window.google.maps.Size(42, 42) : undefined,
                anchor: window.google?.maps ? new window.google.maps.Point(21, 42) : undefined
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
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            )
        })) : [])
    ];

    return (
        <div className="h-screen w-full bg-white relative overflow-hidden flex flex-col font-sans">
            {/* ── Background Map Surface ── */}
            <div className="absolute inset-0 z-0">
                <GoogleMapBox 
                    center={selectedLocation.coordinates || currentLocation || { lat: 28.7041, lng: 77.1025 }}
                    zoom={13}
                    onLoad={setMap}
                    onIdle={handleMapIdle}
                    markers={mapMarkers}
                    darkMode={false}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-white/86 via-transparent to-white/88 pointer-events-none" />
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />

                {!type && (
                    <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative">
                            <img
                                src={LOCATION_PICKER_PIN}
                                alt="Selected location"
                                className="w-[4.6rem] h-[5.3rem] drop-shadow-[0_22px_40px_rgba(15,23,42,0.24)]"
                            />
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
                                    onClick={() => handleSearchResultSelect(loc)}
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
