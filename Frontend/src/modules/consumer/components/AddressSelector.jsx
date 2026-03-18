import React, { useState } from 'react';
import { MapPin, Plus, Home, Briefcase, Navigation, ChevronRight, Check } from 'lucide-react';
import MapPicker from './MapPicker';
import { motion, AnimatePresence } from 'framer-motion';

const AddressSelector = ({ addresses, onSelect, onClose, autoDetect = false }) => {
    const [showMap, setShowMap] = useState(autoDetect && addresses.length === 0);
    const [selectedId, setSelectedId] = useState(addresses.find(a => a.isPrimary)?.id || addresses[0]?.id);

    const handleSelectSaved = (addr) => {
        setSelectedId(addr.id);
        onSelect(addr);
        onClose();
    };

    const handleMapSelect = (mapDetails) => {
        const str = mapDetails?.street || 'Pinned Location';
        const newAddr = {
            id: 'custom-' + Date.now(),
            label: 'Pinned Location',
            street: str.substring(0, 50) + (str.length > 50 ? '...' : ''),
            fullStreet: str,
            city: mapDetails?.city || 'Bengaluru',
            state: mapDetails?.state || 'Karnataka',
            pincode: mapDetails?.pincode || '',
            coordinates: mapDetails?.coordinates || { lat: 12.9716, lng: 77.5946 },
            isCustom: true
        };
        onSelect(newAddr);
        onClose();
    };

    if (showMap) {
        return (
            <MapPicker 
                onSelect={handleMapSelect} 
                onClose={() => {
                    if (addresses.length === 0) {
                        onClose(); // Close entire selector if they cancel map and have no addresses
                    } else {
                        setShowMap(false); // Just go back to address list
                    }
                }} 
                autoDetect={autoDetect} 
            />
        );
    }

    // Default to map if no addresses are loaded
    if (addresses.length === 0 && !showMap) {
        setShowMap(true);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end font-outfit">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full bg-white rounded-t-[40px] p-6 pb-12 max-h-[85vh] overflow-y-auto"
            >
                {/* Handle */}
                <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8" />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-[22px] font-black text-black tracking-tight">Wash Location</h2>
                        <p className="text-[11px] font-bold text-black/30 uppercase tracking-widest mt-1">Select where you want the wash</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Saved Addresses */}
                    {addresses.map((addr) => (
                        <button
                            key={addr.id}
                            onClick={() => handleSelectSaved(addr)}
                            className={`w-full p-4 rounded-3xl border transition-all flex items-center gap-4 text-left group
                                ${selectedId === addr.id
                                    ? 'bg-black border-black shadow-xl shadow-black/10 scale-[1.02]'
                                    : 'bg-gray-50 border-black/[0.05] hover:bg-gray-100 hover:scale-[1.01]'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                                ${selectedId === addr.id ? 'bg-white/10 text-brand' : 'bg-white text-black/40 shadow-sm'}`}>
                                {addr.label?.toLowerCase() === 'home' ? <Home size={20} /> :
                                    addr.label?.toLowerCase() === 'office' ? <Briefcase size={20} /> : <MapPin size={20} />}
                            </div>
                            <div className="flex-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5
                                    ${selectedId === addr.id ? 'text-brand' : 'text-black/30'}`}>
                                    {addr.label || 'Saved Location'}
                                </span>
                                <h4 className={`text-[13px] font-black leading-tight
                                    ${selectedId === addr.id ? 'text-white' : 'text-black'}`}>
                                    {addr.street}
                                </h4>
                            </div>
                            {selectedId === addr.id && (
                                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-black">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Pin on Map option */}
                    <button
                        onClick={() => setShowMap(true)}
                        className="w-full p-5 rounded-3xl bg-brand text-black flex items-center gap-4 group active:scale-[0.98] transition-all shadow-xl shadow-brand/10 border-2 border-transparent hover:border-black/5"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20 transform group-hover:rotate-12 transition-transform">
                            <Navigation size={22} fill="currentColor" />
                        </div>
                        <div className="flex-1 text-left">
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-widest block mb-0.5 leading-none">High Precision</span>
                            <h4 className="text-[14px] font-black leading-none">Pin on Live Map</h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                            <ChevronRight size={18} strokeWidth={3} />
                        </div>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-4 px-6 rounded-2xl border border-black/[0.05] text-[11px] font-black uppercase tracking-[0.2em] text-black/40 hover:bg-gray-50 transition-colors"
                >
                    Cancel Selection
                </button>
            </motion.div>
        </div>
    );
};

export default AddressSelector;
