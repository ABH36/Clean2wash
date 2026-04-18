import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Zap, Calendar } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'home', to: '/', icon: Home, label: 'Home' },
    { id: 'spare-driver', to: '/spare-driver', icon: Zap, label: 'Book' },
    { id: 'bookings', to: '/bookings', icon: Calendar, label: 'Activity' },
    { id: 'profile', to: '/profile', icon: User, label: 'Account' }
];

const MobileLayout = ({ children, hideNav = false }) => (
    <div className="mobile-container bg-[#FBF8EF]">
        <main className="flex-1 pb-24">
            {children}
        </main>

        {!hideNav && (
            <div className="fixed bottom-6 left-0 right-0 z-[1000] px-6">
                <nav className="max-w-[430px] mx-auto h-20 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/20 px-6 flex items-center justify-between transition-all duration-300 backdrop-blur-2xl bg-white/95">
                    {NAV_ITEMS.map((tab) => (
                        <NavLink
                            key={tab.id}
                            to={tab.to}
                            end={tab.to === '/'}
                            className={({ isActive }) => `flex flex-col items-center gap-1.5 relative transition-all active:scale-90 ${
                                isActive ? 'text-[#0F172A]' : 'text-black/30'
                            }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        <tab.icon
                                            size={22}
                                            strokeWidth={isActive ? 3 : 2}
                                            className={isActive ? 'text-[#F59E0B]' : 'text-black/30'}
                                        />
                                    </div>

                                    <span className={`text-[9px] font-[1000] uppercase tracking-wider ${
                                        isActive ? 'text-[#0F172A]' : 'text-black/20'
                                    }`}>
                                        {tab.label}
                                    </span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-3 w-1 h-1 bg-[#F59E0B] rounded-full shadow-[0_0_10px_#F59E0B]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        )}
    </div>
);

export default MobileLayout;
