import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, Plus, Home, Briefcase, MapPin,
    Edit3, Trash2, Check, Star, Navigation, Search, Map as MapIcon,
    Locate, Save, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../utils/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ICONS = { home: Home, office: Briefcase, other: MapPin };

// --- Map Components ---
const MapEvents = ({ onMove }) => {
    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            onMove([center.lat, center.lng]);
        },
    });
    return null;
};

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

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
        loading: addressLoading
    } = useGeoLocation();
    const [showSheet, setShowSheet] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        label: 'Home',
        icon: 'home',
        full: '',
        landmark: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
    });

    // Map States
    const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bengaluru default
    const [selectedPos, setSelectedPos] = useState([12.9716, 77.5946]);
    const [isLocating, setIsLocating] = useState(false);
    const [geocodedAddress, setGeocodedAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSavingInstant, setIsSavingInstant] = useState(false);

    // Auto-detect if triggered from Global Prompt
    useEffect(() => {
        const detect = searchParams.get('detect');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (detect === 'true' && lat && lng) {
            const pos = [parseFloat(lat), parseFloat(lng)];
            setSelectedPos(pos);
            setMapCenter(pos);
            setShowSheet(true);
            toast.success("Location locked. Give it a name to save!");
        }
    }, [searchParams]);

    const TYPES = [
        { key: 'home', label: 'Home', ico: Home },
        { key: 'office', label: 'Office', ico: Briefcase },
        { key: 'other', label: 'Other', ico: MapPin },
    ];

    // Reverse Geocoding via Backend Proxy
    useEffect(() => {
        const fetchAddress = async () => {
            if (!selectedPos || selectedPos[0] === 0) return;
            try {
                setIsGeocoding(true);
                const data = await apiClient.request(`/maps/proxy/reverse?lat=${selectedPos[0]}&lon=${selectedPos[1]}`);

                if (data && data.status === 'success') {
                    const addr = data.data.display_name;
                    setGeocodedAddress(addr);

                    // Pre-fill form if not editing
                    if (!editing) {
                        const parts = data.data.address || {};
                        setForm(f => ({
                            ...f,
                            full: addr,
                            city: parts.city || parts.town || parts.village || 'Bengaluru',
                            state: parts.state || 'Karnataka',
                            pincode: parts.postcode || '560001'
                        }));
                    }
                }
            } catch (err) {
                console.error("Geocoding failed", err);
            } finally {
                setIsGeocoding(false);
            }
        };

        const timer = setTimeout(fetchAddress, 800);
        return () => clearTimeout(timer);
    }, [selectedPos, editing]);

    // Get current location
    const handleLocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = [latitude, longitude];
                setMapCenter(newPos);
                setSelectedPos(newPos);
                setIsLocating(false);
                toast.success("Location pinpointed!");
            },
            () => {
                setIsLocating(false);
                toast.error("Unable to retrieve location");
            }
        );
    };

    const openAdd = (initialText = '') => {
        setEditing(null);
        setForm({
            label: 'Home',
            icon: 'home',
            full: initialText || '',
            landmark: '',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001'
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
            city: addr.city || 'Bengaluru',
            state: addr.state || 'Karnataka',
            pincode: addr.pincode || '560001'
        });
        if (addr.coordinates) {
            setMapCenter([addr.coordinates.lat, addr.coordinates.lng]);
            setSelectedPos([addr.coordinates.lat, addr.coordinates.lng]);
        }
        setShowSheet(true);
    };

    const handleDelete = async (id) => {
        try {
            await removeAddress(id);
            toast.success("Address removed");
        } catch (err) {
            toast.error("Failed to remove address");
        }
    };

    const handleSetPrimary = async (id) => {
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

        const addressData = {
            label: form.label,
            street: form.full,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            landmark: form.landmark,
            coordinates: { lat: selectedPos[0], lng: selectedPos[1] }
        };

        try {
            if (editing) {
                await updateAddress(editing, addressData);
                toast.success("Address updated");
            } else {
                await addAddress(addressData);
                toast.success("Address saved");
            }
            setShowSheet(false);
        } catch (err) {
            toast.error("Operation failed");
        }
    };

    const handleConfirmReturn = (addr) => {
        // Save to session storage for booking flows
        sessionStorage.setItem('iw_location', JSON.stringify(addr));
        toast.success("Location selected for booking!");
        if (returnPath) {
            navigate(`/${returnPath}`);
        } else {
            navigate(-1);
        }
    };

    // Instant Save for the current Map Pin (Non-booking flow)
    const handleInstantSavePin = async () => {
        if (!geocodedAddress) {
            toast.error("Detecting location... please wait");
            return;
        }

        const addressData = {
            label: 'Saved Location',
            street: geocodedAddress,
            city: 'Bengaluru', // Fallbacks as per existing logic
            state: 'Karnataka',
            pincode: '560001',
            landmark: 'Selected via Map',
            coordinates: { lat: selectedPos[0], lng: selectedPos[1] }
        };

        try {
            setIsSavingInstant(true);
            await addAddress(addressData);
            toast.success("Location saved to profile!");
        } catch (err) {
            toast.error(err.message || "Failed to save location");
        } finally {
            setIsSavingInstant(false);
        }
    };

    // Confirm the current map center (unnamed location)
    const handleConfirmCurrentPin = () => {
        const tempAddr = {
            id: 'temp_' + Date.now(),
            label: 'Selected Location',
            full: geocodedAddress || `Lat: ${selectedPos[0].toFixed(4)}, Lng: ${selectedPos[1].toFixed(4)}`,
            address: geocodedAddress || `Lat: ${selectedPos[0].toFixed(4)}, Lng: ${selectedPos[1].toFixed(4)}`,
            coordinates: { lat: selectedPos[0], lng: selectedPos[1] }
        };
        handleConfirmReturn(tempAddr);
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
                        onClick={openAdd}
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
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <ChangeView center={mapCenter} />
                            <MapEvents onMove={setSelectedPos} />
                            <Marker position={selectedPos} />
                        </MapContainer>

                        {/* Overlay Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
                            <button
                                onClick={handleLocate}
                                className={`w-10 h-10 rounded-xl bg-white text-black shadow-lg flex items-center justify-center transition-all ${isLocating ? 'animate-spin' : 'active:scale-90'}`}
                            >
                                <Locate size={18} strokeWidth={2.5} className={isLocating ? 'text-brand' : ''} />
                            </button>
                        </div>

                        {/* Centered Confirm Button */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[80%]">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLocate}
                                className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 border border-gray-100 mb-3"
                            >
                                <Navigation size={14} className="text-brand" strokeWidth={3} />
                                Use Current Location
                            </motion.button>

                            {!isBookingFlow && geocodedAddress && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleInstantSavePin}
                                    disabled={isSavingInstant}
                                    className={`w-full bg-brand text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 ${isSavingInstant ? 'opacity-70 grayscale cursor-not-allowed' : ''}`}
                                >
                                    {isSavingInstant ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} strokeWidth={4} />
                                    )}
                                    {isSavingInstant ? 'Saving...' : 'Confirm This Location'}
                                </motion.button>
                            )}

                            {isBookingFlow && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleConfirmCurrentPin}
                                    className="w-full bg-brand text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3"
                                >
                                    <Check size={16} strokeWidth={4} />
                                    Confirm This Location
                                </motion.button>
                            )}
                        </div>

                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-brand/50 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                            </div>
                        </div>

                        {/* Real-time Address Overlay */}
                        <AnimatePresence>
                            {geocodedAddress && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-4 left-4 right-16 z-[400]"
                                >
                                    <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-xl flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isGeocoding ? 'bg-brand animate-pulse' : 'bg-emerald-500'}`} />
                                        <p className="text-[10px] font-[1000] text-black uppercase tracking-tight line-clamp-1 flex-1">
                                            {isGeocoding ? 'Locating...' : geocodedAddress}
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
                    {addresses.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-10 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <MapIcon size={24} className="text-gray-300" />
                            </div>
                            <p className="text-[11px] font-black text-black/20 uppercase tracking-widest leading-relaxed">
                                No saved addresses found.<br />Add a new location to begin.
                            </p>
                        </div>
                    ) : (
                        addresses.map((addr, i) => {
                            const Icon = ICONS[addr.icon] || MapPin;
                            const isSelected = isBookingFlow; // Visual cue if coming from flow

                            return (
                                <motion.div
                                    key={addr._id || addr.id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`group bg-white rounded-[2.2rem] p-5 border transition-all duration-300 flex items-start gap-4 relative overflow-hidden ${addr.isPrimary ? 'border-brand/30 shadow-brand/5 shadow-xl' : 'border-gray-100 hover:border-brand/20 shadow-sm'}`}
                                >
                                    {addr.isPrimary && (
                                        <div className="absolute top-0 right-0 bg-brand text-white px-3 py-1 text-[7px] font-black uppercase tracking-widest rounded-bl-xl italic">
                                            Primary
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-colors ${addr.isPrimary ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-gray-300 group-hover:bg-brand/5 group-hover:text-brand'}`}>
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-[14px] text-black uppercase tracking-tight italic">{addr.label}</h4>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide line-clamp-2">
                                            {addr.street || addr.full || addr.address}
                                        </p>
                                        {addr.landmark && (
                                            <div className="flex items-center gap-1.5 mt-2 opacity-60">
                                                <div className="w-1 h-1 rounded-full bg-brand" />
                                                <p className="text-[8px] font-black text-brand uppercase tracking-tighter italic">{addr.landmark}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => openEdit(addr)}
                                                className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] hover:text-brand transition-colors flex items-center gap-1"
                                            >
                                                <Edit3 size={10} /> Edit Address
                                            </button>
                                            {!addr.isPrimary && (
                                                <button
                                                    onClick={() => handleSetPrimary(addr._id || addr.id)}
                                                    className="text-[9px] font-black text-brand uppercase tracking-[0.2em] flex items-center gap-1"
                                                >
                                                    <Star size={10} /> Set Primary
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {isBookingFlow ? (
                                            <button
                                                onClick={() => handleConfirmReturn(addr)}
                                                className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-transform"
                                            >
                                                <ArrowRight size={18} strokeWidth={3} />
                                            </button>
                                        ) : !addr.isPrimary && (
                                            <button
                                                onClick={() => handleDelete(addr._id || addr.id)}
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

            {/* Redesigned Bottom Sheet */}
            <AnimatePresence>
                {showSheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000]"
                            onClick={() => setShowSheet(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#F8FAFC] rounded-t-[3rem] z-[2001] p-8 pb-12 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />

                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 cursor-pointer active:scale-90 transition-transform" onClick={() => setShowSheet(false)} />

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-[1000] text-xl tracking-tight text-black italic uppercase italic">{editing ? 'Edit Address' : 'Add New Address'}</h3>
                                <div className="flex items-center gap-2 bg-brand/10 px-3 py-1 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <span className="text-[8px] font-black text-brand uppercase tracking-widest">Pin Location</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Type selector */}
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-3 ml-1 italic">Save As</p>
                                    <div className="flex gap-3">
                                        {TYPES.map(t => (
                                            <button key={t.key} onClick={() => setForm(f => ({ ...f, icon: t.key, label: t.label }))}
                                                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] border-2 transition-all duration-300 ${form.icon === t.key ? 'bg-black border-black text-brand shadow-xl' : 'bg-white border-transparent text-black/20 hover:border-black/5 shadow-sm'}`}>
                                                <t.ico size={20} strokeWidth={2.5} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1 italic">Label</p>
                                        <div className="relative">
                                            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Headquarters"
                                                className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-black text-[13px] text-black outline-none focus:border-brand shadow-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1 italic">Full Address</p>
                                        <textarea rows={2} value={form.full} onChange={e => setForm(f => ({ ...f, full: e.target.value }))} placeholder="Complete physical address..."
                                            className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] text-black outline-none focus:border-brand shadow-sm resize-none" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1 italic">City</p>
                                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Bengaluru"
                                                className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] text-black outline-none focus:border-brand shadow-sm" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1 italic">Pincode</p>
                                            <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit PIN"
                                                className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] text-black outline-none focus:border-brand shadow-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 mb-2 ml-1 italic">Landmark (Optional)</p>
                                        <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="e.g. Near the blue gate"
                                            className="w-full bg-white border border-black/[0.04] rounded-2xl px-5 py-4 font-bold text-[13px] text-black outline-none focus:border-brand shadow-sm" />
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] italic shadow-2xl active:bg-brand transition-colors flex items-center justify-center gap-3"
                                >
                                    <Save size={18} />
                                    {editing ? 'Update Address' : 'Save Address'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddressManager;
