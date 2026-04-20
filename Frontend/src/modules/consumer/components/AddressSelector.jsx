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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Operational Zones</h3>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/addresses?from=${currentPath}`)}
                    className="flex items-center gap-1.5 text-brand font-black text-[9px] uppercase tracking-widest bg-brand/5 px-4 py-2 rounded-2xl border border-brand/10 shadow-lg shadow-brand/5 active:scale-95 transition-all"
                >
                    <Plus size={12} strokeWidth={3} /> Define New
                </motion.button>
            </div>

            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-20 bg-white/[0.02] rounded-[2rem] animate-pulse border border-white/5" />
                        ))
                    ) : addresses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/[0.02] rounded-[2.5rem] p-10 text-center border-white/5 border-dashed border-white/[0.05]"
                        >
                            <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                <Locate size={24} className="text-white/10" />
                            </div>
                            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                                No Secure Sectors Detected <br/>
                                <span className="text-brand/40 uppercase">Initialize first zone to proceed</span>
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
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(addr)}
                                    className={`relative group flex items-center gap-4 p-4 pr-6 rounded-[2rem] border-white/5 transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-white/5 border-brand shadow-[0_12px_40px_rgba(255,191,0,0.15)] scale-[1.02]' 
                                        : 'bg-white/[0.03] border-white/[0.05] hover:border-brand/30'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                                        isSelected ? 'bg-brand text-white shadow-lg shadow-brand/20 rotate-[-10deg]' : 'bg-white/5 text-white/20'
                                    }`}>
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className={`font-black text-[13px] uppercase tracking-tighter italic leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                                {addr.label}
                                            </h4>
                                            {addr.isPrimary && (
                                                <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${isSelected ? 'bg-black text-white' : 'bg-brand text-white'}`}>HQ</span>
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-bold leading-none uppercase tracking-wide truncate ${isSelected ? 'text-white/40' : 'text-white/20'}`}>
                                            {addr.street || addr.full || addr.address}
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        {isSelected ? (
                                            <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center shadow-lg">
                                                <Check size={16} strokeWidth={4} />
                                            </div>
                                        ) : (
                                            <ChevronRight size={18} className="text-white/10 group-hover:text-brand transition-colors" />
                                        )}
                                    </div>
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
