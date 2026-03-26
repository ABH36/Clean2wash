import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Search, MapPin, Navigation, X, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeoLocation } from '../../../hooks/useGeoLocation';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper for dynamic script loading
const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve(window.google);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

// Custom Leaflet components
const LeafletMapEvents = ({ onMove, onIdle }) => {
    const map = useMapEvents({
        move: () => {
            onMove(map.getCenter());
        },
        moveend: () => {
            onIdle(map.getCenter());
        }
    });
    return null;
};

const LeafletMapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView([center.lat, center.lng], zoom || 17);
        }
    }, [center, zoom, map]);
    return null;
};

const MapPicker = ({ onSelect, initialCenter: propCenter, onClose, autoDetect = false }) => {
    const { currentLocation, selectedAddress } = useGeoLocation();
    
    // Resolve initial center: Prop -> Selected -> Current -> Delhi Fallback
    const initialCenter = useMemo(() => {
        if (propCenter) return propCenter;
        if (selectedAddress?.coordinates) return selectedAddress.coordinates;
        if (currentLocation) return currentLocation;
        return { lat: 28.6139, lng: 77.2090 };
    }, [propCenter, selectedAddress, currentLocation]);
    const mapRef = useRef(null);
    const [mapEngine, setMapEngine] = useState('leaflet'); // Default to leaflet, switch to google if key exists
    const [googleMap, setGoogleMap] = useState(null);
    const [googleMarker, setGoogleMarker] = useState(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Leaflet specific
    const [leafletCenter, setLeafletCenter] = useState(initialCenter);
    const [leafletZoom, setLeafletZoom] = useState(15);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [address, setAddress] = useState('Fetching location...');
    const [loading, setLoading] = useState(false);
    const [geocodingError, setGeocodingError] = useState(false);
    const searchInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Proxy Base URL
    const PROXY_URL = import.meta.env.VITE_API_URL + '/maps/proxy';

    // Script Loading & Engine Selection
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

        if (!apiKey || apiKey === 'AIzaSyCV6QreLE4QR76xie0BI3B9y2wY4awcPP8' || apiKey.includes('YOUR_')) {
            console.log("No valid Google Maps key found, using Leaflet.");
            setMapEngine('leaflet');
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => {
                setGoogleLoaded(true);
                setMapEngine('google');
            })
            .catch((err) => {
                console.error("Failed to load Google Maps script:", err);
                setMapEngine('leaflet');
            });
    }, []);

    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setLoading(true);
        setGeocodingError(false);

        if (mapEngine === 'google' && window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response && response.results && response.results[0]) {
                    const result = response.results[0];
                    setAddress(result.formatted_address);

                    const components = result.address_components;
                    const pincode = components.find(c => c.types.includes('postal_code'))?.long_name;
                    const city = components.find(c => c.types.includes('locality'))?.long_name;
                    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;

                    return {
                        street: result.formatted_address,
                        city,
                        state,
                        pincode,
                        coordinates: { lat, lng }
                    };
                }
            } catch (error) {
                console.error('Google Geocoding error:', error);
                if (error.message?.includes('REQUEST_DENIED') || error.message?.includes('BillingNotEnabled')) {
                    setMapEngine('leaflet');
                }
            }
        }

        // Fallback to Backend Proxy (which calls Nominatim)
        try {
            const res = await fetch(`${PROXY_URL}/reverse?lat=${lat}&lon=${lng}`);
            const result = await res.json();

            if (result.status === 'success' && result.data && result.data.display_name) {
                const data = result.data;
                setAddress(data.display_name);
                return {
                    street: data.display_name,
                    city: data.address.city || data.address.town || data.address.village,
                    state: data.address.state,
                    pincode: data.address.postcode,
                    coordinates: { lat, lng }
                };
            }
        } catch (error) {
            console.error('Proxy Proxy Geocoding error:', error);
            setGeocodingError(true);
            setAddress(`Custom Pin at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setLoading(false);
        }
        return null;
    }, [mapEngine, PROXY_URL]);

    // Google Maps Logic
    useEffect(() => {
        if (mapEngine !== 'google' || !googleLoaded || !mapRef.current) return;

        let gMap;
        let gMarker;
        let centerListener;
        let idleListener;
        let autocomplete;

        try {
            gMap = new window.google.maps.Map(mapRef.current, {
                center: initialCenter,
                zoom: 15,
                disableDefaultUI: true,
                styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
            });

            gMarker = new window.google.maps.Marker({
                position: initialCenter,
                map: gMap,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#FF6B00",
                    fillOpacity: 1,
                    strokeWeight: 4,
                    strokeColor: "#FFFFFF",
                }
            });

            setGoogleMap(gMap);
            setGoogleMarker(gMarker);
            getAddressFromCoords(initialCenter.lat, initialCenter.lng);

            centerListener = gMap.addListener('center_changed', () => {
                gMarker.setPosition(gMap.getCenter());
            });

            idleListener = gMap.addListener('idle', async () => {
                const center = gMap.getCenter();
                await getAddressFromCoords(center.lat(), center.lng());
            });

            // Modern Autocomplete (PlaceAutocompleteElement fallback to legacy if needed)
            if (searchInputRef.current) {
                if (window.google.maps.places) {
                    autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                        types: ['geocode', 'establishment'],
                        componentRestrictions: { country: 'IN' }
                    });
                    autocompleteRef.current = autocomplete;

                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place.geometry && place.geometry.location) {
                            gMap.setCenter(place.geometry.location);
                            gMap.setZoom(17);
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Google Maps Init Error (switching to Leaflet):", err);
            setMapEngine('leaflet');
        }

        return () => {
            if (window.google?.maps?.event) {
                if (centerListener) google.maps.event.removeListener(centerListener);
                if (idleListener) google.maps.event.removeListener(idleListener);
                if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
            }
            if (gMarker) gMarker.setMap(null);
            if (mapRef.current) mapRef.current.innerHTML = '';
        };
    }, [mapEngine, googleLoaded, initialCenter, getAddressFromCoords]);

    // Debounced Nominatim Search Logic for Leaflet (via Proxy)
    const handleLeafletSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${PROXY_URL}/search?q=${encodeURIComponent(query)}`);
                const result = await res.json();
                if (result.status === 'success') {
                    setSearchResults(result.data);
                }
            } catch (error) {
                console.error("Proxy Search error:", error);
            }
        }, 500); // 500ms debounce for search
    };

    const selectLeafletResult = (result) => {
        const pos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setLeafletCenter(pos);
        setLeafletZoom(17);
        setSearchResults([]);
        setSearchQuery(result.display_name);
    };

    // Debounced onIdle for map movement
    const handleMapIdle = useCallback((center) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            getAddressFromCoords(center.lat, center.lng);
        }, 800); // 800ms debounce for address fetching
    }, [getAddressFromCoords]);

    const handleConfirm = async () => {
        let lat, lng;
        if (mapEngine === 'google' && googleMap) {
            const center = googleMap.getCenter();
            lat = center.lat();
            lng = center.lng();
        } else {
            lat = leafletCenter.lat;
            lng = leafletCenter.lng;
        }

        const finalDetails = await getAddressFromCoords(lat, lng);
        if (finalDetails) {
            onSelect(finalDetails);
        } else {
            onSelect({
                street: address,
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '',
                coordinates: { lat, lng },
                isCustom: true
            });
        }
    };

    const useCurrentLocation = useCallback(() => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                if (mapEngine === 'google' && googleMap) {
                    googleMap.setCenter(pos);
                    googleMap.setZoom(17);
                } else {
                    setLeafletCenter(pos);
                    setLeafletZoom(17);
                }
                setLoading(false);
            }, (error) => {
                console.error("Geolocation error:", error);
                setLoading(false);
            });
        }
    }, [mapEngine, googleMap]);

    useEffect(() => {
        if (autoDetect) {
            useCurrentLocation();
        }
    }, [autoDetect, useCurrentLocation]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col font-outfit">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-black/[0.05]">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors">
                    <X size={20} className="text-black/60" />
                </button>
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for your location"
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-bold text-black focus:ring-0 placeholder:text-black/20"
                        value={searchQuery}
                        onChange={(e) => mapEngine === 'google' ? setSearchQuery(e.target.value) : handleLeafletSearch(e.target.value)}
                    />
                    {mapEngine === 'leaflet' && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-b-2xl mt-1 z-[110] border border-black/[0.05] overflow-hidden">
                            {searchResults.map((r, i) => (
                                <div
                                    key={i}
                                    onClick={() => selectLeafletResult(r)}
                                    className="p-3 border-b border-black/[0.02] last:border-none active:bg-gray-50 cursor-pointer"
                                >
                                    <p className="text-[11px] font-bold text-black line-clamp-1">{r.display_name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {mapEngine === 'google' ? (
                    <div ref={mapRef} className="w-full h-full" />
                ) : (
                    <MapContainer
                        center={[initialCenter.lat, initialCenter.lng]}
                        zoom={15}
                        className="w-full h-full z-0"
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LeafletMapEvents
                            onMove={(c) => setLeafletCenter(c)}
                            onIdle={(c) => handleMapIdle(c)}
                        />
                        <LeafletMapController center={leafletCenter} zoom={leafletZoom} />
                    </MapContainer>
                )}

                {/* Hybrid Engine Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg backdrop-blur-md border ${mapEngine === 'google' ? 'bg-white/80 border-black/5' : 'bg-amber-500/90 border-amber-600'
                        }`}>
                        {mapEngine === 'google' ? (
                            <>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-black/60">Google Maps</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={10} className="text-white" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white">Leaflet Fallback</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Visual Center Marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mb-4 z-20">
                    <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-brand shadow-xl border-2 border-white" />
                    </div>
                </div>

                <button
                    onClick={useCurrentLocation}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform border border-black/[0.05] z-20"
                >
                    <Navigation size={20} className="text-brand" />
                </button>
            </div>

            {/* Footer Detail */}
            <div className="p-5 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[32px] border-t border-black/[0.02]">
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <MapPin size={20} className="text-brand" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[10px] font-black text-black/20 uppercase tracking-widest block mb-1">Confirm Wash Location</span>
                        <h3 className={`text-[14px] font-black leading-tight line-clamp-2 ${geocodingError ? 'text-red-500' : 'text-black'}`}>
                            {loading ? 'Moving marker...' : address}
                        </h3>
                    </div>
                </div>

                <button
                    disabled={loading}
                    onClick={handleConfirm}
                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Locating...' : 'Confirm Location'}
                </button>
            </div>
        </div>
    );
};

export default MapPicker;
