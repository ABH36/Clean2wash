import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Zap, Calendar } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

const NAV_ITEMS = [
    { id: 'home', to: '/', icon: Home, label: 'Home' },
    { id: 'spare-driver', to: '/spare-driver', icon: Zap, label: 'Book' },
    { id: 'bookings', to: '/bookings', icon: Calendar, label: 'Activity' },
    { id: 'profile', to: '/profile', icon: User, label: 'Account' }
];

const MobileLayout = ({ children, hideNav = false }) => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`mobile-container transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-[#FAF6EB]'}`}>
            <main className={`flex-1 ${!hideNav ? 'pb-24' : ''}`}>
                {children}
            </main>

            {!hideNav && (
                <div className="fixed bottom-0 left-0 right-0 z-[1000] safe-area-bottom">
                    {/* Premium Glassmorphism Dock */}
                    <div className={`absolute inset-0 transition-all duration-300 ${
                        isDarkMode 
                            ? 'bg-[#0B0F19]/90 border-t border-white/05 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]' 
                            : 'bg-white/90 border-t border-black/05 shadow-[0_-10px_35px_rgba(0,0,0,0.04)]'
                    } backdrop-blur-xl`} />
                    
                    <nav className="relative max-w-[430px] mx-auto h-[76px] px-6 flex items-center justify-between">
                        {NAV_ITEMS.map((tab) => (
                            <NavLink
                                key={tab.id}
                                to={tab.to}
                                end={tab.to === '/'}
                                className={({ isActive }) => `group flex flex-col items-center justify-center relative h-full transition-all active:scale-90`}
                            >
                                {({ isActive }) => (
                                    <div className="flex flex-col items-center gap-1.5">
                                        {/* Animated Background Pill */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute inset-x-[-12px] h-10 bg-[#F59E0B]/10 rounded-2xl -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        
                                        <div className={`transition-all duration-300 relative ${
                                            isActive 
                                                ? 'text-[#F59E0B]' 
                                                : (isDarkMode ? 'text-white/30' : 'text-black/30')
                                        }`}>
                                            <tab.icon
                                                size={22}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                className="transform transition-transform group-hover:scale-110"
                                            />
                                            
                                            {/* Subtle Glow for Active Icon */}
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="nav-glow"
                                                    className="absolute inset-0 bg-[#F59E0B]/20 blur-lg rounded-full -z-10"
                                                />
                                            )}
                                        </div>

                                        <span className={`text-[10px] font-bold transition-all duration-300 ${
                                            isActive 
                                                ? (isDarkMode ? 'text-white' : 'text-black') + ' font-black'
                                                : (isDarkMode ? 'text-white/20' : 'text-black/30')
                                        }`}>
                                            {tab.label}
                                        </span>
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    );
};

export default MobileLayout;
