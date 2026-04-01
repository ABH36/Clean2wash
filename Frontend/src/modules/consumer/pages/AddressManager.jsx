import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, Plus, Home, Briefcase, MapPin,
    Edit3, Trash2, Check, Star, Navigation, Search, Map as MapIcon,
    Locate, Save, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../utils/api';

const ICONS = { home: Home, office: Briefcase, other: MapPin };

const AddressManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnPath = searchParams.get('from');
    const isBookingFlow = !!returnPath;

    const { token } = useAuth();
    const {
        savedAddresses: addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setPrimary: setPrimaryAddress,
        loading: addressLoading,
        selectedAddress,
        currentLocation,
        setSelectedAddress
    } = useGeoLocation();
    
    const [showSheet, setShowSheet] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        label: 'Home',
        icon: 'home',
        full: '',
        landmark: '',
        city: '',
        state: '',
        pincode: ''
    });

    // Map States
    const searchInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [map, setMap] = useState(null);
    const [center, setCenter] = useState(selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 });
    const [isLocating, setIsLocating] = useState(false);
    const [geocodedAddress, setGeocodedAddress] = useState('');
    const [geocodedParts, setGeocodedParts] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSavingInstant, setIsSavingInstant] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { detectCurrentLocation } = useGeoLocation();

    // Auto-detect on mount
    useEffect(() => {
        if (!selectedAddress && !currentLocation) {
            detectCurrentLocation().catch(err => console.warn("Initial locate failed", err));
        }
    }, []);

    // Sync center with currentLocation if it arrives late and map hasn't been moved
    useEffect(() => {
        if (!selectedAddress && currentLocation && center.lat === 28.6139) {
            const pos = { lat: currentLocation.lat, lng: currentLocation.lng };
            setCenter(pos);
            if (map) map.panTo(pos);
            getAddressFromCoords(pos.lat, pos.lng);
        }
    }, [currentLocation, map, selectedAddress]);

    // Initialize Autocomplete
    const onMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        if (window.google && searchInputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                componentRestrictions: { country: 'in' },
                fields: ['address_components', 'geometry', 'formatted_address']
            });
            autocompleteRef.current = autocomplete;

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry && place.geometry.location) {
                    const pos = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    setCenter(pos);
                    mapInstance.panTo(pos);
                    mapInstance.setZoom(17);
                    setGeocodedAddress(place.formatted_address);
                    const components = place.address_components;
                    const pincode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
                    const city = components.find(c => c.types.includes('locality'))?.long_name || 
                                 components.find(c => c.types.includes('sublocality_level_1'))?.long_name ||
                                 components.find(c => c.types.includes('administrative_area_level_3'))?.long_name ||
                                 components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '';
                    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
                    
                    setGeocodedParts({ city, state, postcode: pincode });
                    setSearchQuery(place.formatted_address); // Retain context
                }
            });
        }
    }, []);

    // Auto-detect if triggered from Global Prompt
    useEffect(() => {
        const detect = searchParams.get('detect');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (detect === 'true' && lat && lng) {
            const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
            setCenter(pos);
            setShowSheet(true);
            toast.success("Location locked. Give it a name to save!");
        }
    }, [searchParams]);

    const TYPES = [
        { key: 'home', label: 'Home', ico: Home },
        { key: 'office', label: 'Office', ico: Briefcase },
        { key: 'other', label: 'Other', ico: MapPin },
    ];

    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setIsGeocoding(true);
        
        // Try Native Google Geocoding
        if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response?.results?.[0]) {
                    const result = response.results[0];
                    const components = result.address_components;
                    
                    const pincode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
                    const city = components.find(c => c.types.includes('locality'))?.long_name || 
                                 components.find(c => c.types.includes('sublocality_level_1'))?.long_name ||
                                 components.find(c => c.types.includes('administrative_area_level_3'))?.long_name ||
                                 components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '';
                    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
                    
                    setGeocodedAddress(result.formatted_address);
                    setGeocodedParts({ city, state, postcode: pincode });

                    if (!editing) {
                        setForm(f => ({
                            ...f,
                            full: result.formatted_address,
                            city,
                            state,
                            pincode
                        }));
                    }
                    setIsGeocoding(false);
                    return;
                }
            } catch (err) {
                console.error("Google Geocoding error:", err);
            }
        }

        // Fallback to Backend Proxy
        try {
            const data = await apiClient.request(`/maps/proxy/reverse?lat=${lat}&lon=${lng}`);
            if (data?.status === 'success') {
                const addr = data.data.display_name;
                const parts = data.data.address;
                setGeocodedAddress(addr);
                setGeocodedParts(parts);
                if (!editing) {
                    setForm(f => ({
                        ...f,
                        full: addr,
                        city: parts?.city || parts?.town || parts?.village || parts?.city_district || '',
                        state: parts?.state || '',
                        pincode: parts?.postcode || ''
                    }));
                }
            }
        } catch (proxyErr) {
            console.error("Geocoding fatal failure:", proxyErr);
        } finally {
            setIsGeocoding(false);
        }
    }, [editing]);

    const handleIdle = (newCenter) => {
        setCenter(newCenter);
        getAddressFromCoords(newCenter.lat, newCenter.lng);
    };

    const handleLocate = () => {
        setIsLocating(true);
        detectCurrentLocation().then(pos => {
            setCenter(pos);
            if (map) map.panTo(pos);
            getAddressFromCoords(pos.lat, pos.lng);
            setIsLocating(false);
            toast.success("Location locked!");
        }).catch(err => {
            setIsLocating(false);
            toast.error("Location access denied or unavailable");
        });
    };

    const openAdd = (initialText = '') => {
        setEditing(null);
        setForm({
            label: 'Home',
            icon: 'home',
            full: initialText || geocodedAddress || '',
            landmark: '',
            city: geocodedParts?.city || '',
            state: geocodedParts?.state || '',
            pincode: geocodedParts?.postcode || ''
        });
        setShowSheet(true);
    };

    const openEdit = (addr) => {
        setEditing(addr._id || addr.id);
        setForm({
            label: addr.label,
            icon: addr.icon || 'other',
            full: addr.street || addr.full || '',
            landmark: addr.landmark || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || ''
        });
        if (addr.coordinates) {
            setCenter(addr.coordinates);
            if (map) map.panTo(addr.coordinates);
        }
        setShowSheet(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await removeAddress(id);
            toast.success("Address removed");
        } catch (err) {
            toast.error("Failed to remove address");
        }
    };

    const handleSetPrimary = async (e, id) => {
        e.stopPropagation();
        try {
            await setPrimaryAddress(id);
            toast.success("Primary updated");
        } catch (err) {
            toast.error("Failed to set primary");
        }
    };

    const handleSave = async () => {
        if (!form.full) {
            toast.error("Please enter full address");
            return;
        }
        if (!form.city) {
            toast.error("City is required");
            return;
        }

        const addressData = {
            label: form.label,
            street: form.full,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            landmark: form.landmark,
            coordinates: center
        };

        try {
            setIsSavingInstant(true);
            let savedOrUpdatedAddress;

            if (editing) {
                const updated = await updateAddress(editing, addressData);
                if (updated && (selectedAddress?._id === editing || selectedAddress?.id === editing)) {
                    setSelectedAddress(updated);
                }
                savedOrUpdatedAddress = updated;
                toast.success("Address updated");
            } else {
                const saved = await addAddress(addressData);
                if (saved) setSelectedAddress(saved);
                savedOrUpdatedAddress = saved;
                toast.success("Address saved successfully");
            }
            setShowSheet(false);

            // If in booking flow, immediately select it and navigate back
            if (isBookingFlow && savedOrUpdatedAddress) {
                sessionStorage.setItem('iw_location', JSON.stringify(savedOrUpdatedAddress));
                toast.success("Location locked for service!");
                navigate(`/${returnPath}`);
            }

        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setIsSavingInstant(false);
        }
    };

    const handleSelectAddress = (addr) => {
        setSelectedAddress(addr);
        sessionStorage.setItem('iw_location', JSON.stringify(addr));
        
        if (isBookingFlow) {
            toast.success("Location selected!");
            navigate(`/${returnPath}`);
        } else {
            toast.success("Active location set!");
            setCenter(addr.coordinates);
            if (map) map.panTo(addr.coordinates);
        }
    };

    const handleConfirmLocation = () => {
        if (!geocodedAddress) {
            toast.error("Detecting location...");
            return;
        }
        
        // Always open the bottom sheet to force complete address entry
        openAdd();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="px-5 pt-12 pb-5 bg-white sticky top-0 z-[1000] border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
                            <ChevronLeft size={20} strokeWidth={3} className="text-black" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] tracking-tight text-black uppercase italic leading-none">Addresses</h1>
                            <p className="text-[9px] text-brand font-black uppercase tracking-[0.2em] mt-1.5">Manage Locations</p>
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openAdd()}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 active:bg-brand"
                    >
                        <Plus size={14} strokeWidth={4} /> Add New
                    </motion.button>
                </div>
            </header>

            <div className="px-5 py-6 space-y-6 pb-32">
                {/* Visual Map Interface */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-blue-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative h-80 rounded-[2.2rem] overflow-hidden border-2 border-white shadow-2xl z-0">
                        <GoogleMapBox 
                            center={center}
                            zoom={15}
                            onLoad={onMapLoad}
                            onIdle={handleIdle}
                        />

                        {/* Search Bar Overlay */}
                        <div className="absolute top-4 left-4 right-4 z-[400]">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search size={16} className="text-brand" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search location to pin..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-white/95 backdrop-blur-md rounded-2xl pl-12 pr-4 text-[13px] font-bold text-black border border-black/5 shadow-xl outline-none focus:border-brand/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* Overlay Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
                            <button
                                onClick={handleLocate}
                                className={`w-10 h-10 rounded-xl bg-white text-black shadow-lg flex items-center justify-center transition-all ${isLocating ? 'animate-spin' : 'active:scale-90'}`}
                            >
                                <Locate size={18} strokeWidth={2.5} className={isLocating ? 'text-brand' : ''} />
                            </button>
                        </div>

                        {/* Confirm Button Overlay */}
                        <div className="absolute bottom-4 left-4 z-[400]">
                            {geocodedAddress && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleConfirmLocation}
                                    disabled={isGeocoding || isLocating}
                                    className="bg-black text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2 border border-white/10 active:scale-95 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
                                >
                                    {(isGeocoding || isLocating) ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} strokeWidth={4} className="text-brand" />
                                    )}
                                    {isGeocoding ? 'Detecting...' : 'Confirm Location'}
                                </motion.button>
                            )}
                        </div>

                        {/* Static Center Pin Visual */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                            <div className="mb-8 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center animate-pulse">
                                    <div className="w-3 h-3 bg-brand rounded-full border-2 border-white shadow-sm" />
                                </div>
                                <div className="w-0.5 h-4 bg-brand" />
                            </div>
                        </div>

                        {/* Real-time Address Overlay (Refined) */}
                        <AnimatePresence>
                            {geocodedAddress && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute top-20 left-4 right-4 z-[300]"
                                >
                                    <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGeocoding ? 'bg-brand animate-pulse' : 'bg-emerald-500'}`} />
                                        <p className="text-[10px] font-black text-white/90 uppercase tracking-tight line-clamp-1 italic">
                                            {isGeocoding ? '🛰️ Adjusting Coordinates...' : geocodedAddress}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Saved Addresses ({addresses?.length || 0})</h3>
                </div>

                {/* Address Nodes */}
                <div className="space-y-3">
                    {addressLoading ? (
                        <div className="p-10 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Loading Vault...</p>
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-10 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <MapIcon size={24} className="text-gray-300" />
                            </div>
                            <p className="text-[11px] font-black text-black/20 uppercase tracking-widest leading-relaxed">
                                No saved addresses found.
                            </p>
                        </div>
                    ) : (
                        addresses.map((addr, i) => {
                            const Icon = ICONS[addr.icon] || MapPin;
                            const isSelected = selectedAddress?._id === (addr._id || addr.id) || selectedAddress?.id === (addr._id || addr.id);
                            
                            return (
                                <motion.div
                                    key={addr._id || addr.id || i}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectAddress(addr)}
                                    className={`group bg-white rounded-[2.2rem] p-5 border transition-all duration-300 flex items-start gap-4 relative overflow-hidden cursor-pointer ${isSelected ? 'border-brand shadow-brand/10 shadow-xl bg-brand/[0.02]' : 'border-gray-100 hover:border-brand/20 shadow-sm'}`}
                                >
                                    {addr.isPrimary && (
                                        <div className="absolute top-0 right-0 bg-brand text-white px-3 py-1 text-[7px] font-black uppercase tracking-widest rounded-bl-xl italic">
                                            Primary
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-brand text-white shadow-lg' : 'bg-gray-50 text-gray-300 group-hover:bg-brand/5 group-hover:text-brand'}`}>
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-[14px] text-black uppercase tracking-tight italic">{addr.label}</h4>
                                            {isSelected && (
                                                <span className="text-[8px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Active</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide line-clamp-2">
                                            {addr.street || addr.full || addr.address}
                                        </p>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEdit(addr); }} 
                                                className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] hover:text-brand flex items-center gap-1"
                                            >
                                                <Edit3 size={10} /> Edit
                                            </button>
                                            {!addr.isPrimary && (
                                                <button 
                                                    onClick={(e) => handleSetPrimary(e, addr._id || addr.id)} 
                                                    className="text-[9px] font-black text-brand uppercase tracking-[0.2em] flex items-center gap-1"
                                                >
                                                    <Star size={10} /> Set Primary
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {isBookingFlow ? (
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform ${isSelected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Check size={18} strokeWidth={3} />
                                            </div>
                                        ) : !addr.isPrimary && (
                                            <button 
                                                onClick={(e) => handleDelete(e, addr._id || addr.id)} 
                                                className="w-8 h-8 bg-gray-50 text-gray-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-all border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Bottom Sheet Overlay */}
            <AnimatePresence>
                {showSheet && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000]" onClick={() => setShowSheet(false)} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#F8FAFC] rounded-t-[3rem] z-[2001] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-[1000] text-xl tracking-tight text-black italic uppercase italic leading-none">{editing ? 'Edit Address' : 'Add New Address'}</h3>
                                <button onClick={() => getAddressFromCoords(center.lat, center.lng)} className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1.5 bg-brand/10 px-3 py-2 rounded-xl">
                                    <Locate size={12} /> Auto-fill from Pin
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-3 ml-1 italic">Save As</p>
                                    <div className="flex gap-3">
                                        {TYPES.map(t => (
                                            <button key={t.key} onClick={() => setForm(f => ({ ...f, icon: t.key, label: t.label }))}
                                                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] border-2 transition-all ${form.icon === t.key ? 'bg-black border-black text-brand shadow-xl' : 'bg-white border-transparent text-black/20 shadow-sm'}`}>
                                                <t.ico size={20} strokeWidth={2.5} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1">Street / House No.</p>
                                        <input value={form.full} onChange={e => setForm(f => ({ ...f, full: e.target.value }))} placeholder="Complete physical address" className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] outline-none shadow-sm focus:border-brand/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1">City</p>
                                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="CityName" className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] outline-none shadow-sm focus:border-brand/30" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1">Pincode</p>
                                            <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="000000" className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] outline-none shadow-sm focus:border-brand/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1">State</p>
                                        <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] outline-none shadow-sm focus:border-brand/30" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1">Landmark</p>
                                        <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="Near, Behind, Opposite..." className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] outline-none shadow-sm focus:border-brand/30" />
                                    </div>
                                </div>
                                <button onClick={handleSave} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] italic shadow-2xl active:bg-brand transition-colors flex items-center justify-center gap-3 mt-6">
                                    <Save size={18} /> {editing ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddressManager;
