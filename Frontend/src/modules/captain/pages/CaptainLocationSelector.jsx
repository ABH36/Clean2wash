import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Navigation, Search,
    Check, Locate, ArrowRight, X, Compass
} from 'lucide-react';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { toast } from 'react-hot-toast';
import { useCaptain } from '../../../hooks/useCaptain';
import { geocodingService } from '../../../utils/geocoding';

// Leaflet map helpers removed

const CaptainLocationSelector = () => {
    const navigate = useNavigate();
    const { updateLocation } = useCaptain();

    // Default to a central location (Delhi) if GPS fails
    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
    const [selectedPos, setSelectedPos] = useState({ lat: 28.6139, lng: 77.2090 });
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [addressName, setAddressName] = useState('Fetching location...');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const debounceTimerRef = useRef(null);
    const lastGeocodedPos = useRef({ lat: 0, lng: 0 });

    // Get current location on mount
    useEffect(() => {
        handleLocate();
    }, []);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setMapCenter(newPos);
                setSelectedPos(newPos);
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                toast.error("Unable to get current location");
            }
        );
    };

    const handleIdle = (newCenter) => {
        setSelectedPos(newCenter);

        // 💵 BILLING PROTECTION: 1-second Debounce
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(async () => {
            const dist = getDistance(newCenter, lastGeocodedPos.current);

            // 💵 BILLING PROTECTION: 15-meter Threshold
            if (dist > 15) {
                setIsGeocoding(true);
                const data = await geocodingService.reverse(newCenter.lat, newCenter.lng);
                if (data) {
                    setAddressName(data.display_name);
                    lastGeocodedPos.current = newCenter;
                } else {
                    setAddressName('Location selected');
                }
                setIsGeocoding(false);
            } else {
                console.log("🛰️ Captain Map: Skipping geocode (Minimal movement)");
            }
        }, 1000);
    };

    // Helper to calculate distance in meters
    const getDistance = (p1, p2) => {
        if (!p1 || !p2) return 999;
        const R = 6371e3;
        const φ1 = p1.lat * Math.PI / 180;
        const φ2 = p2.lat * Math.PI / 180;
        const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
        const Δλ = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsGeocoding(true);
        const results = await geocodingService.search(searchQuery);
        if (results && results.length > 0) {
            const newPos = { lat: results[0].lat, lng: results[0].lng };
            setMapCenter(newPos);
            setSelectedPos(newPos);
        } else {
            toast.error("Area not found");
        }
        setIsGeocoding(false);
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            const result = await updateLocation(selectedPos.lat, selectedPos.lng);
            if (result.success) {
                toast.success("Working area set successfully!", {
                    icon: '📍',
                    style: { borderRadius: '15px', background: '#000', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
                });
                navigate('/captain');
            } else {
                toast.error(result.error || "Failed to update area");
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="px-5 pt-12 pb-5 bg-white sticky top-0 z-[1000] border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
                        <ChevronLeft size={20} strokeWidth={3} className="text-black" />
                    </button>
                    <div>
                        <h1 className="text-[17px] font-[1000] tracking-tight text-black uppercase leading-none">Working Area</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-[0.2em] mt-1.5">Set Your Location</p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col h-[calc(100vh-100px)]">
                {/* Search Bar */}
                <div className="px-5 pt-4 pb-2">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-black/30 group-focus-within:text-brand transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search any area, city or junction..."
                            className="w-full bg-white border border-black/[0.06] rounded-[1.8rem] pl-12 pr-4 py-4 text-[13px] font-bold text-black outline-none focus:border-brand shadow-sm transition-all"
                        />
                        {isGeocoding && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </form>
                </div>

                {/* Map Interface */}
                <div className="flex-1 relative m-5 rounded-[2.5rem] overflow-hidden border-2 border-white shadow-2xl z-0 bg-gray-100">
                    <GoogleMapBox 
                        center={mapCenter} 
                        zoom={15} 
                        onIdle={handleIdle}
                        markers={[
                            {
                                id: 'center-marker',
                                position: selectedPos,
                                icon: {
                                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                                    scale: 0 // Hide actual marker, we use the crosshair overlay
                                }
                            }
                        ]}
                    />

                    {/* Overlay Buttons */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
                        <button
                            onClick={handleLocate}
                            className={`w-11 h-11 rounded-2xl bg-white text-black shadow-xl flex items-center justify-center transition-all ${isLocating ? 'animate-spin' : 'active:scale-90 hover:bg-gray-50'}`}
                        >
                            <Locate size={20} strokeWidth={2.5} className={isLocating ? 'text-brand' : ''} />
                        </button>
                        <button
                            onClick={() => navigate('/captain')}
                            className="w-11 h-11 rounded-2xl bg-white text-black shadow-xl flex items-center justify-center transition-all active:scale-90 hover:bg-gray-50"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Selection Indicator Point */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-brand/50 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Bottom Detail Card */}
                <div className="px-5 pb-8">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                                <Compass size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[12px] font-black text-black/20 uppercase tracking-[0.2em] mb-1">Selected Region</h3>
                                <p className="text-[14px] font-[1000] text-black leading-tight line-clamp-2 uppercase tracking-tight">
                                    {isGeocoding ? 'Locating...' : addressName}
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={isSaving || isGeocoding}
                            onClick={handleConfirm}
                            className={`w-full py-5 rounded-[1.8rem] font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all ${isSaving ? 'bg-gray-100 text-black/20' : 'bg-black text-white active:bg-brand active:shadow-brand/20'
                                }`}
                        >
                            {isSaving ? (
                                <>Setting Region... <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" /></>
                            ) : (
                                <>Start Waiting Here <ArrowRight size={18} strokeWidth={3} /></>
                            )}
                        </motion.button>

                        <p className="text-[8px] font-black text-center text-black/30 uppercase tracking-[0.15em] mt-4">
                            Requests within 5km of this point will be broadcast to you.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CaptainLocationSelector;
