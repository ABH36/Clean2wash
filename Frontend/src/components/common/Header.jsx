import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, User, Menu, ChevronDown, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ title, showBack = false, onBackClick, onMenuClick, showMenu = false }) => {
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const { selectedAddress, primaryAddress } = useGeoLocation();
    const { isDarkMode } = useTheme();
    
    const user = getUser('consumer');
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CW';

    const locationName = selectedAddress?.street || primaryAddress?.city || 'Pipliyahana Road';

    return (
        <header className={`sticky top-0 z-[1000] w-full h-[64px] px-4 flex items-center justify-between transition-colors duration-300 ${
            isDarkMode ? 'bg-[#0B0F19] text-[#F9FAFB]' : 'bg-[#FFFFFF] text-[#111827]'
        }`}>
            {/* LEFT SECTION: Brand & Location Hook */}
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {showBack ? (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBackClick || (() => navigate(-1))}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]'
                        }`}
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </motion.button>
                ) : (
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile')}
                        className="relative flex-shrink-0"
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[12px] bg-black shadow-lg border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B] to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
                            <span className="relative z-10 tracking-tighter">CW</span>
                        </div>
                    </motion.div>
                )}

                <div 
                    className="flex flex-col min-w-0 cursor-pointer"
                    onClick={() => navigate('/map')}
                >
                    <div className="flex items-center gap-1">
                        <h1 className="text-[13px] font-[1000] uppercase tracking-tight text-[#F59E0B]">
                            {title || 'Spare Driver'}
                        </h1>
                        {!title && <ChevronDown size={10} className="text-[#F59E0B]/50" />}
                    </div>
                    <div className="flex items-center gap-1 opacity-60">
                        <MapPin size={9} strokeWidth={3} className="text-[#F59E0B]" />
                        <span className="text-[10px] font-bold truncate max-w-[150px]">
                            {locationName}
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-3">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/notifications')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-colors ${
                        isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]'
                    }`}
                >
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F59E0B] rounded-full border-2 border-inherit" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onMenuClick || (() => navigate('/profile'))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]'
                    }`}
                >
                    {showMenu ? <Menu size={20} /> : <User size={20} />}
                </motion.button>
            </div>
        </header>
    );
};

export default Header;
