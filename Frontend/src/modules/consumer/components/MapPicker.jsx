import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Search, MapPin, Navigation, X, AlertTriangle } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { useGeoLocation } from '../../../hooks/useGeoLocation';

import { geocodingService } from '../../../utils/geocoding';

const MapPicker = ({ onSelect, initialCenter: propCenter, onClose, autoDetect = false }) => {
    const { currentLocation, selectedAddress } = useGeoLocation();
    
    // Resolve initial center: Prop -> Selected -> Current -> Delhi Fallback
    const initialCenter = useMemo(() => {
        if (propCenter) return propCenter;
        if (selectedAddress?.coordinates) return selectedAddress.coordinates;
        if (currentLocation) return currentLocation;
        return { lat: 28.6139, lng: 77.2090 };
    }, [propCenter, selectedAddress, currentLocation]);

    const [map, setMap] = useState(null);
    const [center, setCenter] = useState(initialCenter);
    const [searchQuery, setSearchQuery] = useState('');
    const [address, setAddress] = useState('Fetching location...');
    const [loading, setLoading] = useState(false);
    const [geocodingError, setGeocodingError] = useState(false);
    const autocompleteRef = useRef(null);

    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setLoading(true);
        setGeocodingError(false);

        try {
            const result = await geocodingService.reverse(lat, lng);
            if (result) {
                setAddress(result.display_name);
                return {
                    street: result.display_name,
                    city: result.city,
                    state: result.state,
                    pincode: result.pincode,
                    coordinates: { lat, lng }
                };
            }
        } catch (error) {
            console.error('MapPicker Geocoding error:', error);
            setGeocodingError(true);
            setAddress(`Custom Pin at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setLoading(false);
        }
        return null;
    }, []);

    const handleMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        getAddressFromCoords(initialCenter.lat, initialCenter.lng);
    }, [initialCenter, getAddressFromCoords]);

    const handleIdle = useCallback((newCenter) => {
        setCenter(newCenter);
        getAddressFromCoords(newCenter.lat, newCenter.lng);
    }, [getAddressFromCoords]);

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const pos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setCenter(pos);
                if (map) {
                    map.panTo(pos);
                    map.setZoom(17);
                }
                setSearchQuery(place.formatted_address || '');
            }
        }
    };

    const onLoadAutocomplete = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const handleConfirm = async () => {
        const finalDetails = await getAddressFromCoords(center.lat, center.lng);
        if (finalDetails) {
            onSelect(finalDetails);
        } else {
            onSelect({
                street: address,
                city: '',
                state: '',
                pincode: '',
                coordinates: center,
                isCustom: true
            });
        }
    };

    const useCurrentLocation = useCallback(() => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setCenter(pos);
                if (map) {
                    map.panTo(pos);
                    map.setZoom(17);
                }
                setLoading(false);
            }, (error) => {
                console.error("Geolocation error:", error);
                setLoading(false);
            });
        }
    }, [map]);

    useEffect(() => {
        if (autoDetect) {
            useCurrentLocation();
        }
    }, [autoDetect, useCurrentLocation]);

    return (
        <div className="fixed inset-0 z-[100] bg-white/5 flex flex-col font-outfit">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-black/[0.05]">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full active:bg-white/[0.05] transition-colors">
                    <X size={20} className="text-white/60" />
                </button>
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 z-10" />
                    <Autocomplete
                        onLoad={onLoadAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                        options={{
                            componentRestrictions: { country: "IN" },
                            fields: ["formatted_address", "geometry", "name"],
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search for your location"
                            className="w-full bg-white/[0.02] border-none rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-bold text-white focus:ring-0 placeholder:text-white/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Autocomplete>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <GoogleMapBox 
                    center={center}
                    onLoad={handleMapLoad}
                    onIdle={handleIdle}
                />

                {/* Visual Center Marker (Static in center of map) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mb-8 z-20">
                    <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-brand shadow-2xl shadow-black/50 border-white/5 border-white" />
                    </div>
                    {/* Marker Needle */}
                    <div className="w-0.5 h-4 bg-brand mx-auto -mt-1" />
                </div>

                <button
                    onClick={useCurrentLocation}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-white/5 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform border border-black/[0.05] z-20"
                >
                    <Navigation size={20} className="text-brand" />
                </button>
            </div>

            {/* Footer Detail */}
            <div className="p-5 bg-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[32px] border-t border-black/[0.02]">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center flex-shrink-0">
                        <MapPin size={20} className="text-brand" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Confirm Wash Location</span>
                        <h3 className={`text-[14px] font-black leading-tight line-clamp-2 ${geocodingError ? 'text-red-500' : 'text-white'}`}>
                            {loading ? 'Moving marker...' : address}
                        </h3>
                    </div>
                </div>

                <button
                    disabled={loading}
                    onClick={handleConfirm}
                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-black/50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Locating...' : 'Confirm Location'}
                </button>
            </div>
        </div>
    );
};

export default MapPicker;
