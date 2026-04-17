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
            {/* LEFT: Avatar or Back Button */}
            <div className="flex-shrink-0 flex items-center gap-3">
                {showBack ? (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBackClick || (() => navigate(-1))}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F3F4F6]'
                        }`}
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                ) : (
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile')}
                        className="cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] shadow-sm">
                            {initials}
                        </div>
                    </motion.div>
                )}
                {title && (
                    <span className="text-[16px] font-bold truncate max-w-[120px]">
                        {title}
                    </span>
                )}
            </div>

            {/* CENTER: Location (only if no title) */}
            {!title && (
                <div 
                    className="flex flex-col items-center flex-1 mx-2 cursor-pointer"
                    onClick={() => navigate('/addresses')}
                >
                    <span className={`text-[10px] font-medium uppercase tracking-wider opacity-60 mb-0.5 ${
                        isDarkMode ? 'text-[#F9FAFB]' : 'text-[#111827]'
                    }`}>
                        Current Location
                    </span>
                    <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-[#F59E0B]" />
                        <span className="text-[14px] font-bold truncate max-w-[140px]">
                            {locationName}
                        </span>
                        <ChevronDown size={14} className="opacity-40" />
                    </div>
                </div>
            )}

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
