import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Home, Briefcase, Plus, Check, ChevronRight, Locate } from 'lucide-react';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { useNavigate } from 'react-router-dom';

const ICONS = { home: Home, office: Briefcase, other: MapPin };

const AddressSelector = ({ onSelect, currentPath = 'full-wash-booking' }) => {
    const navigate = useNavigate();
    const { 
        savedAddresses: addresses, 
        selectedAddress, 
        setSelectedAddress,
        loading 
    } = useGeoLocation();

    const handleSelect = (addr) => {
        setSelectedAddress(addr);
        if (onSelect) onSelect(addr);
    };

    const handleAddNew = () => {
        navigate(`/addresses?from=${currentPath}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Select Service Location</h3>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddNew}
                    className="flex items-center gap-1.5 text-brand font-black text-[9px] uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-xl border border-brand/10"
                >
                    <Plus size={12} strokeWidth={3} /> Add New
                </motion.button>
            </div>

            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
                        ))
                    ) : addresses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 rounded-[2rem] p-8 text-center border-2 border-dashed border-white/5"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Locate size={20} className="text-white/20" />
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-relaxed">
                                No addresses found. <br/>
                                <span className="text-brand">Add one to continue.</span>
                            </p>
                        </motion.div>
                    ) : (
                        addresses.map((addr) => {
                            const Icon = ICONS[addr.icon] || MapPin;
                            const isSelected = selectedAddress?._id === (addr._id || addr.id) || selectedAddress?.id === (addr._id || addr.id);

                            return (
                                <motion.div
                                    key={addr._id || addr.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(addr)}
                                    className={`relative group flex items-start gap-4 p-5 rounded-[2.2rem] border-2 transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-white border-brand shadow-2xl shadow-brand/10' 
                                        : 'bg-white border-gray-50 hover:border-brand/20 shadow-sm'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-gray-50 text-gray-300'
                                    }`}>
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-black text-[14px] uppercase tracking-tight italic ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                                                {addr.label}
                                            </h4>
                                            {addr.isPrimary && (
                                                <span className="text-[7px] bg-brand text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest italic">Default</span>
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-wide line-clamp-1 ${isSelected ? 'text-gray-500' : 'text-gray-300'}`}>
                                            {addr.street || addr.full || addr.address}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <motion.div 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute top-5 right-5 w-8 h-8 bg-brand text-white rounded-xl shadow-lg flex items-center justify-center"
                                        >
                                            <Check size={16} strokeWidth={4} />
                                        </motion.div>
                                    )}

                                    {!isSelected && (
                                        <div className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={18} />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AddressSelector;
