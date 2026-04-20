import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, User, Menu, ChevronDown, ChevronLeft, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { useTheme } from '../../context/ThemeContext';

import logo from '../../assets/spareDriverLogo.png';

const Header = ({ title, showBack = false, onBackClick, onMenuClick, showMenu = false }) => {
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const { selectedAddress, primaryAddress } = useGeoLocation();
    const { isDarkMode, toggleTheme } = useTheme();
    
    const user = getUser('consumer');

    const locationName = selectedAddress?.street || primaryAddress?.city || 'Select Location';

    return (
        <header className={`sticky top-0 z-[1000] w-full h-[72px] px-4 flex items-center justify-between transition-all duration-300 border-b ${
            isDarkMode 
                ? 'bg-[#0B0F19]/80 backdrop-blur-lg border-white/05 text-[#F9FAFB]' 
                : 'bg-white/80 backdrop-blur-lg border-black/05 text-[#111827]'
        }`}>
            {/* LEFT SECTION: Elite Brand Identity */}
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {showBack ? (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBackClick || (() => navigate(-1))}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                            isDarkMode ? 'bg-white/05' : 'bg-black/05'
                        }`}
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </motion.button>
                ) : (
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile')}
                        className="relative flex-shrink-0"
                    >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black shadow-lg border border-white/10 relative overflow-hidden group">
                           <img src={logo} alt="Logo" className="w-9 h-9 object-contain relative z-10" />
                           <div className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B] to-transparent opacity-10" />
                        </div>
                    </motion.div>
                )}

                <div 
                    className="flex flex-col min-w-0 cursor-pointer pl-1"
                    onClick={() => navigate('/addresses')}
                >
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[14px] font-[1000] tracking-wide text-[#F59E0B]">
                            {title || 'Spare driver'}
                        </h1>
                        {!title && <ChevronDown size={12} className="text-[#F59E0B]" strokeWidth={3} />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} strokeWidth={3} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
                        <span className={`text-[11px] font-bold truncate max-w-[140px] uppercase tracking-tighter ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {locationName}
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: Modern Tools */}
            <div className="flex items-center gap-2.5">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/notifications')}
                    className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all ${
                        isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-transparent'
                    } border`}
                >
                    <Bell size={20} strokeWidth={2} />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#F59E0B] rounded-full border-[2.5px] border-white " />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isDarkMode ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#F59E0B]/10 border-transparent text-[#F59E0B]'
                    } border`}
                >
                    {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onMenuClick || (() => navigate('/profile'))}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isDarkMode ? 'bg-white/05 border-white/05' : 'bg-black/05 border-transparent'
                    } border`}
                >
                    {showMenu ? <Menu size={20} /> : <User size={20} />}
                </motion.button>
            </div>
        </header>
    );
};

export default Header;
