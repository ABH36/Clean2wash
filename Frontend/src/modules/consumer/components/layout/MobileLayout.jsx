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
        <div className={`mobile-container transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-[#FBF8EF]'}`}>
            <main className="flex-1 pb-24">
                {children}
            </main>

            {!hideNav && (
                <div className="fixed bottom-0 left-0 right-0 z-[1000] safe-area-bottom">
                    {/* Glassmorphism Background Integration */}
                    <div className={`absolute inset-0 border-t transition-all duration-300 ${
                        isDarkMode 
                            ? 'bg-[#0B0F19]/90 border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' 
                            : 'bg-white/95 border-black/5 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]'
                    } backdrop-blur-2xl`} />
                    
                    <nav className="relative max-w-[430px] mx-auto h-[68px] px-4 flex items-center justify-around">
                        {NAV_ITEMS.map((tab) => (
                            <NavLink
                                key={tab.id}
                                to={tab.to}
                                end={tab.to === '/'}
                                className={({ isActive }) => `group flex flex-col items-center justify-center gap-1.5 relative h-full w-20 transition-all active:scale-95`}
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Active Indicator Bar at Top */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-indicator-top"
                                                className="absolute top-0 w-10 h-[3px] bg-[#FF9900] rounded-b-full shadow-[0_2px_10px_#FF9900]/40"
                                            />
                                        )}
                                        
                                        <div className={`transition-all duration-300 ${
                                            isActive 
                                                ? 'text-[#FF9900]' 
                                                : (isDarkMode ? 'text-white/40' : 'text-black/30')
                                        }`}>
                                            <tab.icon
                                                size={22}
                                                strokeWidth={isActive ? 2.5 : 2}
                                            />
                                        </div>

                                        <span className={`text-[9px] font-[1000] uppercase tracking-[0.15em] transition-all duration-300 ${
                                            isActive 
                                                ? 'text-[#FF9900]' 
                                                : (isDarkMode ? 'text-white/30' : 'text-black/20')
                                        }`}>
                                            {tab.label}
                                        </span>
                                    </>
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
