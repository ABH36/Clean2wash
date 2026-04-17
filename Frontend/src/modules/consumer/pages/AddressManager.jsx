import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, Plus, Home, Briefcase, MapPin,
    Edit3, Trash2, Check, Star, Navigation, Search, Map as MapIcon,
    Locate, Save, ArrowRight, X
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

    useEffect(() => {
        if (!selectedAddress && !currentLocation) {
            detectCurrentLocation().catch(() => {});
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
            const φ1 = newCenter.lat * Math.PI/180;
            const φ2 = lastGeocodedPos.current.lat * Math.PI/180;
            const Δφ = (lastGeocodedPos.current.lat-newCenter.lat) * Math.PI/180;
            const Δλ = (lastGeocodedPos.current.lng-newCenter.lng) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
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
            <div className="min-h-screen bg-slate-50 font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Addresses</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Manage your locations</p>
                        </div>
                    </div>
                    <button onClick={() => openAdd()} className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                        <Plus size={16} /> New address
                    </button>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Visual Map ── */}
                    <div className="relative">
                        <div className="h-72 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm relative z-0">
                            <GoogleMapBox center={center} zoom={15} onLoad={onMapLoad} onIdle={handleIdle} />
                            
                            <div className="absolute top-4 inset-x-4 z-10">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center text-brand"><Search size={16} /></div>
                                    <input ref={searchInputRef} type="text" placeholder="Search location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-11 bg-white/95 backdrop-blur-md rounded-2xl pl-11 pr-4 text-[13px] font-bold text-slate-900 border border-slate-100 shadow-xl outline-none" />
                                </div>
                            </div>

                            <button onClick={handleLocate} className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-white text-slate-900 shadow-xl flex items-center justify-center active:scale-90 transition-all z-10">
                                <Locate size={18} className={isLocating ? 'text-brand animate-pulse' : ''} />
                            </button>

                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                <div className="mb-8 flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-brand rounded-full border-2 border-white shadow-sm" />
                                    </div>
                                    <div className="w-0.5 h-4 bg-brand" />
                                </div>
                            </div>
                        </div>

                        {geocodedAddress && (
                            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => openAdd(geocodedAddress, geocodedParts)}
                                className="mt-4 w-full bg-slate-900 p-5 rounded-[2rem] flex flex-col items-center gap-1 shadow-xl active:scale-98 transition-all">
                                <div className="flex items-center gap-2">
                                    {isGeocoding ? <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" /> : <Check size={16} className="text-brand" />}
                                    <span className="text-white font-bold text-[13px]">{isGeocoding ? 'Detecting...' : (geocodedParts?.area || 'Confirm location')}</span>
                                </div>
                                {!isGeocoding && <p className="text-white/40 text-[10px] font-medium line-clamp-1 px-4">{geocodedAddress}</p>}
                            </motion.button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Saved addresses ({addresses.length})</h3>
                        </div>

                        {addressLoading ? (
                            <div className="py-20 flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-[3px] border-slate-100 border-t-brand rounded-full animate-spin" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-12 text-center">
                                <MapIcon size={32} className="text-slate-100 mx-auto mb-3" />
                                <p className="text-[12px] font-bold text-slate-300">No addresses saved yet</p>
                            </div>
                        ) : (
                            addresses.map((addr) => {
                                const Icon = ICONS[addr.icon] || MapPin;
                                const isSelected = selectedAddress?._id === (addr._id || addr.id) || selectedAddress?.id === (addr._id || addr.id);
                                return (
                                    <motion.div key={addr._id || addr.id} whileTap={{ scale: 0.99 }} onClick={() => handleSelectAddress(addr)}
                                        className={`bg-white rounded-[2rem] p-5 border transition-all flex items-start gap-4 shadow-sm ${isSelected ? 'border-brand/40 bg-brand/[0.02]' : 'border-gray-100 hover:border-slate-200'}`}>
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-[14px] font-bold text-slate-900">{addr.label}</h4>
                                                {isSelected && <span className="text-[9px] bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-lg font-bold">Active</span>}
                                                {addr.isPrimary && <span className="text-[9px] bg-amber-50 text-amber-500 px-2 py-0.5 rounded-lg font-bold">Primary</span>}
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed line-clamp-2">{addr.street || addr.full || addr.address}</p>
                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(addr); }} className="text-[10px] font-bold text-slate-400 hover:text-brand flex items-center gap-1.5"><Edit3 size={12} /> Edit</button>
                                                {!addr.isPrimary && <button onClick={(e) => { e.stopPropagation(); setPrimaryAddress(addr._id || addr.id); }} className="text-[10px] font-bold text-brand flex items-center gap-1.5"><Star size={12} /> Set primary</button>}
                                                <button onClick={(e) => { e.stopPropagation(); removeAddress(addr._id || addr.id); }} className="text-[10px] font-bold text-slate-300 hover:text-rose-500 ml-auto"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Address Sheet ── */}
                <AnimatePresence>
                    {showSheet && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSheet(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[90vh]">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit address' : 'New address'}</h2>
                                    <button onClick={() => setShowSheet(false)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 mb-3 ml-1">Save as</p>
                                        <div className="flex gap-3">
                                            {[ {key:'home', label:'Home', ico:Home}, {key:'office', label:'Office', ico:Briefcase}, {key:'other', label:'Other', ico:MapPin} ].map(t => (
                                                <button key={t.key} onClick={() => setForm(f => ({ ...f, icon: t.key, label: t.label }))}
                                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] border-2 transition-all ${form.icon === t.key ? 'bg-slate-900 border-slate-900 text-brand' : 'bg-white border-slate-50 text-slate-300'}`}>
                                                    <t.ico size={20} />
                                                    <span className="text-[10px] font-bold">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold text-slate-400 ml-1">Flat / House no. / Street</p>
                                            <input value={form.full} onChange={e => setForm(f => ({ ...f, full: e.target.value }))} placeholder="Enter full address" className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-[13px] outline-none focus:border-brand/40" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-slate-400 ml-1">City</p>
                                                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-[13px] outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-slate-400 ml-1">Pincode</p>
                                                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-[13px] outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold text-slate-400 ml-1">Landmark (Optional)</p>
                                            <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="Ex: Near Galaxy Mall" className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-[13px] outline-none" />
                                        </div>
                                    </div>
                                    <button onClick={handleSave} className="w-full h-15 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <Save size={18} /> {editing ? 'Apply changes' : 'Save address'}
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
