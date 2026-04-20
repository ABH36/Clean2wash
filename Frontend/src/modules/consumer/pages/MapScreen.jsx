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
  <path d="M41 11C29.402 11 20 20.402 20 32C20 47.346 41 67.173 41 67.173C41 67.173 62 47.346 62 32C62 20.402 52.598 11 41 11Z" fill="#111827" stroke="#F59E0B" stroke-width="2.8"/>
  <circle cx="41" cy="32" r="15" fill="white"/>
  <path d="M41 22.5L44.4 29.6L52 30.6L46.5 35.8L47.9 43.2L41 39.4L34.1 43.2L35.5 35.8L30 30.6L37.6 29.6L41 22.5Z" fill="#F59E0B"/>
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
            if (err.message === 'LOCATION_PERMISSION_DENIED') {
                toast.error('Location Blocked: Please enable GPS in your browser settings', {
                    duration: 5000,
                    icon: '🔒'
                });
            } else {
                toast.error('Location Access Failed');
            }
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
                <div className="p-0 min-w-[180px] bg-white/5 rounded-2xl overflow-hidden font-outfit shadow-2xl border border-white/5">
                    <div className="relative h-24">
                        <img src={studio.image} className="w-full h-full object-cover" alt={studio.name} />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Star size={10} className="text-amber-400" fill="currentColor" />
                            <span className="text-[10px] font-black">{studio.rating}</span>
                        </div>
                    </div>
                    <div className="p-3">
                        <h4 className="font-black text-[11px] uppercase tracking-tight mb-1 text-white truncate">{studio.name}</h4>
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
        <div className="h-screen w-full bg-white/5 relative overflow-hidden flex flex-col font-sans">
            {/* ── Background Map Surface ── */}
            <div className="absolute inset-0 z-0">
                <GoogleMapBox 
                    center={selectedLocation.coordinates || currentLocation || { lat: 28.7041, lng: 77.1025 }}
                    zoom={15}
                    onLoad={setMap}
                    onIdle={handleMapIdle}
                    markers={mapMarkers}
                    darkMode={false}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        mapTypeControl: false,
                        scaleControl: false,
                        streetViewControl: false,
                        rotateControl: false,
                        fullscreenControl: false
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-white/86 via-transparent to-white/88 pointer-events-none" />
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />

                {!type && (
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-[100%] flex flex-col items-center pointer-events-none z-10">
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="relative mb-2"
                        >
                            <img
                                src={LOCATION_PICKER_PIN}
                                alt="Selected location"
                                className="w-14 h-16 drop-shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                            />
                        </motion.div>
                        <div className="w-2 h-1 bg-black/20 rounded-full blur-[2px]" />
                    </div>
                )}
            </div>

            <header className="absolute top-0 left-0 right-0 z-50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white/5 shadow-2xl shadow-black/50 rounded-full flex items-center justify-center text-white active:scale-95 transition-all border border-black/[0.03]"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <div />
                    <button className="w-10 h-10 bg-white/5 shadow-2xl shadow-black/50 rounded-full flex items-center justify-center text-white border border-black/[0.03]">
                        <MapIcon size={18} className="text-black/30" />
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-white/20">
                        <Search size={18} strokeWidth={3} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search area, street or building..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-white/90 backdrop-blur-xl border border-black/05 pl-12 pr-12 text-[13px] font-bold text-white placeholder:text-white/20 rounded-2xl shadow-2xl shadow-black/50 focus:ring-0 outline-none"
                    />
                    <button
                        onClick={handleLocateMe}
                        className="absolute inset-y-0 right-5 flex items-center text-[#F59E0B]"
                    >
                        <Locate size={18} strokeWidth={3} />
                    </button>
                </div>

                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/95 backdrop-blur-3xl rounded-2xl mt-2 border border-black/05 shadow-2xl max-h-[30vh] overflow-y-auto p-2"
                        >
                            {searchResults.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleSearchResultSelect(loc)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-black/[0.02] rounded-xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-black/10">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <h4 className="text-[12px] font-black text-white uppercase truncate">{loc.label}</h4>
                                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate">{loc.address}</p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── Bottom Interface Card ── */}
            <div className="absolute bottom-4 left-4 right-4 z-50">
                <div className="bg-white/5 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-black/[0.03]">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 bg-[#0F172A]/03 rounded-xl flex items-center justify-center text-[#F59E0B] flex-shrink-0">
                            <MapPin size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-[8px] font-black text-white/20 uppercase tracking-widest">Selected Location</h3>
                                <button onClick={handleEdit} className="text-[#F59E0B] text-[9px] font-black uppercase tracking-widest leading-none">Change</button>
                            </div>
                            <h4 className="text-[14px] font-[1000] text-white uppercase tracking-tight leading-tight truncate">
                                {selectedLocation.label}
                            </h4>
                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-tighter truncate mt-0.5">
                                {selectedLocation.address}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                        <div className="bg-white/[0.02]/70 py-2.5 px-3 rounded-xl border border-black/[0.01] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-tight">Active Zone</span>
                        </div>
                        <div className="bg-white/[0.02]/70 py-2.5 px-3 rounded-xl border border-black/[0.01] flex items-center gap-2">
                            <Zap size={10} className="text-[#F59E0B]" fill="currentColor" />
                            <span className="text-[9px] font-black text-white uppercase tracking-tight">Elite Care</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleLocateMe}
                            className="w-full h-12 bg-white/5 border border-black/10 text-white rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2  active:bg-white/[0.02] transition-all"
                        >
                            <Locate size={14} className="text-[#F59E0B]" strokeWidth={3} />
                            Use Current Location
                        </button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            disabled={isGeocoding}
                            className="w-full bg-black text-white h-12 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-black/50 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {isGeocoding ? 'Locating...' : 'Confirm Location'}
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
