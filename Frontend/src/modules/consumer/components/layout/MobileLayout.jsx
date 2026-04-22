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
        <div className={`mobile-container relative transition-colors duration-500 bg-background overflow-x-hidden min-h-screen flex flex-col`}>
            {/* Global Ambient Glows for Premium Gold Aesthetic */}
            {/* Dark Mode - Deep Golden Space Glow */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 z-0 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
                {/* Accent Top Right */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F59E0B] opacity-20 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
                {/* Ambient Center Glow */}
                <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] bg-amber-500 opacity-10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/4" />
                {/* Accent Bottom Left */}
                <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-orange-400 opacity-[0.15] rounded-full blur-[90px] translate-y-1/4 -translate-x-1/3" />
            </div>

            {/* Light Mode - Rich Champagne Gold Glow */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 z-0 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`}>
                {/* Vibrant Top Gold */}
                <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#F59E0B] opacity-[0.25] rounded-full blur-[90px] -translate-y-1/3 translate-x-1/4" />
                {/* Warm Ambient Center (Champagne) */}
                <div className="absolute top-[40%] left-1/2 w-[500px] h-[500px] bg-yellow-400 opacity-[0.15] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                {/* Soft Edge Reflection */}
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-300 opacity-20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
            </div>

            <main className={`relative z-10 flex-1 ${!hideNav ? 'pb-24' : ''}`}>
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
