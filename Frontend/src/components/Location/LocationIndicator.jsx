import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { motion } from 'framer-motion';

const LocationIndicator = ({ variant = 'light', className = '' }) => {
    const navigate = useNavigate();
    const { primaryAddress, selectedAddress } = useGeoLocation();

    const handleClick = () => {
        navigate('/addresses');
    };

    const isDark = variant === 'dark';
    const isMinimal = variant === 'minimal';

    if (isMinimal) {
        return (
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
                className={`flex items-center gap-1.5 ${className}`}
            >
                <MapPin size={12} className="text-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-content-subtle truncate max-w-[120px]">
                    {selectedAddress?.street || primaryAddress?.city || 'Set Location'}
                </span>
            </motion.button>
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all ${isDark
                ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] text-white'
                } ${className}`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center  ${isDark ? 'bg-brand/20 text-brand' : 'bg-white/5 text-brand border border-gray-50'
                }`}>
                <MapPin size={16} strokeWidth={2.5} />
            </div>
            <div className="text-left overflow-hidden">
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'
                    }`}>
                    Current Location
                </p>
                <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black truncate max-w-[100px] uppercase italic">
                        {selectedAddress?.street || primaryAddress?.label || primaryAddress?.city || 'Select Location'}
                    </span>
                    <ChevronRight size={12} className={isDark ? 'text-white/20' : 'text-gray-300'} />
                </div>
            </div>
        </motion.button>
    );
};

export default LocationIndicator;
