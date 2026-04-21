import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, Plus, Home, Briefcase, MapPin,
    Edit3, Trash2, Check, Star, Navigation, Search, Map as MapIcon,
    Locate, Save, ArrowRight, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { toast } from 'react-hot-toast';
import { geocodingService } from '../../../utils/geocoding';
import MobileLayout from '../components/layout/MobileLayout';

const ICONS = { home: Home, office: Briefcase, other: MapPin };

const AddressManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnPath = searchParams.get('from');
    const isBookingFlow = !!returnPath;

    const {
        savedAddresses: addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setPrimary: setPrimaryAddress,
        loading: addressLoading,
        selectedAddress,
        currentLocation,
        setSelectedAddress,
        detectCurrentLocation
    } = useGeoLocation();

    const [showSheet, setShowSheet] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ label: 'Home', icon: 'home', full: '', landmark: '', city: '', state: '', pincode: '' });

    const searchInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [map, setMap] = useState(null);
    const [center, setCenter] = useState(selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 });
    const [isLocating, setIsLocating] = useState(false);
    const [geocodedAddress, setGeocodedAddress] = useState('');
    const [geocodedParts, setGeocodedParts] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debounceTimerRef = useRef(null);
    const lastGeocodedPos = useRef({ lat: 0, lng: 0 });
    const [isConfirmingPin, setIsConfirmingPin] = useState(false);

    // Recent addresses state
    const [recentAddresses, setRecentAddresses] = useState([]);

    // Fetch recent addresses from cache
    useEffect(() => {
        if (window.recentAddressesCache) {
            setRecentAddresses(window.recentAddressesCache);
        }
    }, []);

    useEffect(() => {
        if (!selectedAddress && !currentLocation) {
            detectCurrentLocation().catch(() => { });
        }
    }, [selectedAddress, currentLocation, detectCurrentLocation]);

    useEffect(() => {
        if (!selectedAddress && currentLocation && center.lat === 28.6139) {
            const pos = { lat: currentLocation.lat, lng: currentLocation.lng };
            setCenter(pos);
            if (map) map.panTo(pos);
            getAddressFromCoords(pos.lat, pos.lng);
        }
    }, [currentLocation, map, selectedAddress, center.lat]);

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
                    const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
                    setCenter(pos);
                    mapInstance.panTo(pos);
                    mapInstance.setZoom(17);
                    setGeocodedAddress(place.formatted_address);
                    const components = place.address_components;
                    const pincode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
                    const city = components.find(c => c.types.includes('locality'))?.long_name ||
                        components.find(c => c.types.includes('sublocality_level_1'))?.long_name || '';
                    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
                    setGeocodedParts({ city, state, postcode: pincode });
                    setSearchQuery(place.formatted_address);
                }
            });
        }
    }, []);

    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setIsGeocoding(true);
        try {
            const data = await geocodingService.reverse(lat, lng);
            if (data) {
                setGeocodedAddress(data.display_name);
                setGeocodedParts({ city: data.city, state: data.state, postcode: data.pincode, street: data.street, area: data.area });
                if (!editing) {
                    setForm(f => ({ ...f, full: data.street, city: data.city, state: data.state, pincode: data.pincode, landmark: data.area !== 'Unknown Area' ? data.area : f.landmark }));
                }
            }
        } catch (err) {
        } finally {
            setIsGeocoding(false);
        }
    }, [editing]);

    const handleIdle = (newCenter) => {
        setCenter(newCenter);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            const R = 6371e3;
            const φ1 = newCenter.lat * Math.PI / 180;
            const φ2 = lastGeocodedPos.current.lat * Math.PI / 180;
            const Δφ = (lastGeocodedPos.current.lat - newCenter.lat) * Math.PI / 180;
            const Δλ = (lastGeocodedPos.current.lng - newCenter.lng) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            if (dist > 15) {
                getAddressFromCoords(newCenter.lat, newCenter.lng);
                lastGeocodedPos.current = newCenter;
            }
        }, 1000);
    };

    const handleLocate = () => {
        setIsLocating(true);
        detectCurrentLocation().then(pos => {
            setCenter(pos);
            if (map) map.panTo(pos);
            getAddressFromCoords(pos.lat, pos.lng);
            setIsLocating(false);
            toast.success("Location updated");
        }).catch(() => {
            setIsLocating(false);
            toast.error("Location access denied");
        });
    };

    const openAdd = (addrText = '', parts = null) => {
        setEditing(null);
        const finalParts = parts || geocodedParts;
        setForm({
            label: 'Home',
            icon: 'home',
            full: addrText || geocodedAddress || '',
            landmark: '',
            city: finalParts?.city || '',
            state: finalParts?.state || '',
            pincode: finalParts?.postcode || ''
        });
        setIsConfirmingPin(true);
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

    const handleSave = async () => {
        if (!form.full) { toast.error("Enter full address"); return; }
        if (!form.city) { toast.error("City is required"); return; }
        const addressData = { label: form.label, street: form.full, city: form.city, state: form.state, pincode: form.pincode, landmark: form.landmark, coordinates: center };
        try {
            let res;
            if (editing) { res = await updateAddress(editing, addressData); toast.success("Address updated"); }
            else { res = await addAddress(addressData); toast.success("Address saved"); }
            setShowSheet(false);
            if (isBookingFlow && res) {
                sessionStorage.setItem('iw_location', JSON.stringify(res));
                navigate(`/${returnPath}`);
            }
        } catch (err) { toast.error("Failed to save"); }
    };

    const handleSelectAddress = (addr) => {
        setSelectedAddress(addr);
        sessionStorage.setItem('iw_location', JSON.stringify(addr));
        if (isBookingFlow) { navigate(`/${returnPath}`); }
        else { toast.success("Active location set"); setCenter(addr.coordinates); if (map) map.panTo(addr.coordinates); }
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-[#0A0F0D] font-sans pb-32">
                <header className="px-4 py-3 flex items-center justify-between bg-[#0A0F0D]/90 sticky top-0 z-[60] border-b border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                            <ChevronLeft size={16} className="text-white" strokeWidth={2.5} />
                        </motion.button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-white tracking-tighter leading-none">Coordinates</h1>
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center border border-[#F59E0B]/20">
                        <Sparkles size={14} className="text-[#F59E0B]" fill="currentColor" />
                    </div>
                </header>

                <div className="px-4 pt-4 space-y-6">
                    <div className="relative">
                        <div className="h-72 rounded-[2rem] overflow-hidden border border-white/10 relative z-0 shadow-2xl">
                            <GoogleMapBox center={center} zoom={15} onLoad={onMapLoad} onIdle={handleIdle} />

                            <div className="absolute top-4 inset-x-4 z-10">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center text-[#F59E0B]"><Search size={14} strokeWidth={3} /></div>
                                    <input ref={searchInputRef} type="text" placeholder="Search locale..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-11 bg-black/60 backdrop-blur-md rounded-2xl pl-10 pr-4 text-[12px] font-black uppercase tracking-wider text-white border border-white/10 shadow-2xl outline-none" />
                                </div>
                            </div>

                            <button onClick={handleLocate} className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-black/60 text-white border border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-all z-10 backdrop-blur-md">
                                <Locate size={18} className={isLocating ? 'text-[#F59E0B] animate-pulse' : ''} />
                            </button>

                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                <div className="mb-8 flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full border border-black shadow-[0_0_10px_#F59E0B]" />
                                    </div>
                                    <div className="w-0.5 h-4 bg-[#F59E0B]" />
                                </div>
                            </div>
                        </div>

                        {geocodedAddress && (
                            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => openAdd(geocodedAddress, geocodedParts)}
                                className="mt-4 w-full bg-white p-4 rounded-[2rem] flex flex-col items-center gap-0.5 shadow-2xl shadow-white/5 active:scale-95 transition-all">
                                <div className="flex items-center gap-2">
                                    {isGeocoding ? <div className="w-3 h-3 border-black border-[#F59E0B] border-t-transparent rounded-full animate-spin" /> : <Plus size={14} className="text-black" strokeWidth={4} />}
                                    <span className="text-black font-black text-[12px] tracking-widest">{isGeocoding ? 'Detecting...' : (geocodedParts?.area || 'Add new hub location')}</span>
                                </div>
                                {!isGeocoding && <p className="text-black/30 text-[8px] font-black tracking-[0.2em] line-clamp-1 px-4">{geocodedAddress}</p>}
                            </motion.button>
                        )}
                    </div>

                    {/* Recent Addresses Section */}
                    {recentAddresses && recentAddresses.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Recent Locations ({recentAddresses.length})</h3>
                            </div>
                            <div className="space-y-2">
                                {recentAddresses.slice(0, 3).map((addr, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setCenter(addr.coordinates);
                                            if (map) map.panTo(addr.coordinates);
                                            openAdd(addr.street, { city: addr.city, state: addr.state, postcode: addr.pincode });
                                        }}
                                        className="bg-white/[0.03] rounded-[1.5rem] p-4 border border-white/5 flex items-center gap-4 active:bg-white/5 transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <MapPin size={16} className="text-white/20" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-white tracking-tighter truncate">{addr.city}</p>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest truncate mt-1">{addr.street}</p>
                                        </div>
                                        <div className="text-[8px] font-black text-[#F59E0B] uppercase tracking-widest bg-[#F59E0B]/10 px-3 py-1.5 rounded-xl border border-[#F59E0B]/10">
                                            {addr.usageCount}X
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 italic">Vaulted Hubs ({addresses.length})</h3>
                        </div>

                        {addressLoading ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <div className="w-7 h-7 border-[2px] border-slate-100 border-t-[#FF9900] rounded-full animate-spin" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 py-16 text-center shadow-2xl">
                                <MapIcon size={28} className="text-white/10 mx-auto mb-4" />
                                <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">No hub coordinates registered</p>
                            </div>
                        ) : (
                            addresses.map((addr) => {
                                const Icon = ICONS[addr.icon] || MapPin;
                                const isSelected = selectedAddress?._id === (addr._id || addr.id) || selectedAddress?.id === (addr._id || addr.id);
                                return (
                                    <motion.div key={addr._id || addr.id} whileTap={{ scale: 0.99 }} onClick={() => handleSelectAddress(addr)}
                                        className={`bg-white/[0.03] rounded-[2rem] p-5 border transition-all flex items-start gap-5 active:bg-white/[0.05] shadow-2xl ${isSelected ? 'border-[#F59E0B]/30 bg-[#F59E0B]/05 ' : 'border-white/5'}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-white/20 border-white/10'}`}>
                                            <Icon size={22} strokeWidth={isSelected ? 3 : 2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h4 className="text-[14px] font-black text-white tracking-tighter">{addr.label}</h4>
                                                {isSelected && <span className="text-[8px] bg-white text-black px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Active</span>}
                                                {addr.isPrimary && <span className="text-[8px] bg-[#F59E0B] text-black px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Prime</span>}
                                            </div>
                                            <p className="text-[10px] font-black text-white/40 leading-relaxed uppercase tracking-widest line-clamp-2">{addr.street || addr.full || addr.address}</p>
                                            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/5">
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(addr); }} className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"><Edit3 size={11} /> Edit</button>
                                                {!addr.isPrimary && <button onClick={(e) => { e.stopPropagation(); setPrimaryAddress(addr._id || addr.id); }} className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest flex items-center gap-2"><Star size={11} /> Primary</button>}
                                                <button onClick={(e) => { e.stopPropagation(); removeAddress(addr._id || addr.id); }} className="text-[9px] font-black text-white/10 hover:text-rose-500 uppercase tracking-widest ml-auto flex items-center gap-2 transition-all"><Trash2 size={11} /> Erase</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isConfirmingPin && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed inset-0 bg-[#0A0F0D] z-[2000] flex flex-col"
                        >
                            <div className="absolute top-8 left-5 z-[2010]">
                                <button
                                    onClick={() => setIsConfirmingPin(false)}
                                    className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center shadow-2xl border border-white/10 active:scale-90"
                                >
                                    <ChevronLeft size={20} className="text-white" strokeWidth={3} />
                                </button>
                            </div>

                            <div className="flex-1 relative">
                                <GoogleMapBox
                                    center={center}
                                    zoom={18}
                                    onLoad={onMapLoad}
                                    onIdle={handleIdle}
                                />

                                {/* Center Pin HUD */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center mb-10">
                                    <div className="flex flex-col items-center">
                                        <motion.div initial={{ y: -10 }} animate={{ y: 0 }} repeat={Infinity}
                                            className="bg-white text-black rounded-full px-5 py-2.5 mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20">
                                            <span className="text-[10px] font-black tracking-[0.2em]">Adjust Hub Target</span>
                                        </motion.div>
                                        <div className="relative">
                                            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white] relative z-10" />
                                            <div className="absolute top-[-36px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] border-2 border-black shadow-2xl shadow-[#F59E0B]/20 flex items-center justify-center animate-bounce">
                                                    <MapPin size={22} className="text-black" strokeWidth={3} />
                                                </div>
                                                <div className="w-0.5 h-4 bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Precision Tools */}
                                <div className="absolute bottom-10 right-6 z-[2010]">
                                    <button
                                        onClick={handleLocate}
                                        className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[1.5rem] flex items-center justify-center shadow-2xl active:scale-90"
                                    >
                                        <Locate size={22} className={isLocating ? 'text-[#F59E0B] animate-pulse' : 'text-white'} />
                                    </button>
                                </div>
                            </div>

                            {/* Address Snapshot & CTA */}
                            <div className="bg-[#0A0F0D] px-6 py-10 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] border-t border-white/10">
                                <div className="mb-8 space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Target confirmed</p>
                                    </div>
                                    <p className="text-[15px] font-black text-white tracking-tighter leading-snug line-clamp-2">
                                        {geocodedAddress || 'Determining hub coordinates...'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsConfirmingPin(false);
                                        setShowSheet(true);
                                    }}
                                    disabled={!geocodedAddress || isGeocoding}
                                    className="w-full h-[64px] bg-[#F59E0B] text-black rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    Secure Coordinates
                                    <ArrowRight size={18} strokeWidth={4} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {showSheet && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSheet(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-[#0A0F0D] rounded-t-[3rem] border-t border-white/10 z-[1001] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[85vh]">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[18px] font-black text-white tracking-tighter">Hub details</h2>
                                    <button onClick={() => setShowSheet(false)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/20"><X size={20} strokeWidth={3} /></button>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 ml-1 italic">Classification</p>
                                        <div className="flex gap-3">
                                            {[{ key: 'home', label: 'Home', ico: Home }, { key: 'office', label: 'Office', ico: Briefcase }, { key: 'other', label: 'Other', ico: MapPin }].map(t => (
                                                <button key={t.key} onClick={() => setForm(f => ({ ...f, icon: t.key, label: t.label }))}
                                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${form.icon === t.key ? 'bg-[#F59E0B] border-[#F59E0B] text-black shadow-2xl shadow-[#F59E0B]/20' : 'bg-white/5 border-white/5 text-white/20'}`}>
                                                    <t.ico size={20} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Target Description</p>
                                            <textarea rows={2} value={form.full} onChange={e => setForm(f => ({ ...f, full: e.target.value }))} placeholder="Enter full hub details" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-[13px] text-white outline-none focus:border-[#F59E0B]/30 resize-none placeholder:text-white/10 shadow-inner" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">District</p>
                                                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-black text-[13px] text-white outline-none focus:border-[#F59E0B]/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Protocol Code</p>
                                                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-black text-[13px] text-white outline-none focus:border-[#F59E0B]/30" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">In-Point Landmark</p>
                                            <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="Ex: Near Galaxy Hub" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-black text-[13px] text-white outline-none focus:border-[#F59E0B]/30" />
                                        </div>
                                    </div>
                                    <button onClick={handleSave} className="w-full h-16 bg-white text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-6">
                                        <Save size={18} strokeWidth={3} /> {editing ? 'Recalibrate hub' : 'Vault address'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default AddressManager;
