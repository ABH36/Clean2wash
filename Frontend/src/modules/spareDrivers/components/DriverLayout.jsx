import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Calendar, 
    Wallet, 
    Bell, 
    User, 
    History,
    Sun,
    Moon
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

import spareDriverLogo from '../../../assets/spareDriverLogo.png';

const DriverLayout = ({ 
    children, 
    title, 
    hideNav = false, 
    hideHeader = false,
    isOnline = false,
    onToggle = () => {},
    showToggle = false 
}) => {
    const location = useLocation();
    const { isDarkMode, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const handleSync = (e) => setUnreadCount(e.detail?.count || 0);
        window.addEventListener('spare-driver-unread-sync', handleSync);
        return () => window.removeEventListener('spare-driver-unread-sync', handleSync);
    }, []);

    const navLinks = [
        { to: '/spare-driver/dashboard', icon: LayoutDashboard, label: 'HUB' },
        { to: '/spare-driver/bookings', icon: Calendar, label: 'OPS' },
        { to: '/spare-driver/wallet', icon: Wallet, label: 'WALLET' },
        { to: '/spare-driver/profile', icon: User, label: 'DOC' }
    ];

    return (
        <div className="min-h-screen bg-background text-content font-sans selection:bg-brand selection:text-white transition-colors duration-500 driver-theme">
            {/* ── Fixed Header ── */}
            {!hideHeader && (
                <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[50] px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-content/[0.03] flex items-center justify-between transition-all duration-500">
                    <div className="flex items-center gap-3">
                        <img 
                            src={spareDriverLogo} 
                            alt="Spare Driver" 
                            className="h-12 sm:h-14 w-auto object-contain"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* ── Online/Offline Toggle ── */}
                        {showToggle && (
                            <button 
                                onClick={onToggle} 
                                className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${isOnline ? 'bg-brand/20 border border-brand/30' : 'bg-content/[0.05] border border-content/[0.1]'}`}
                            >
                                <motion.div 
                                    animate={{ 
                                        x: isOnline ? 24 : 0,
                                        backgroundColor: isOnline ? '#FACD15' : '#888'
                                    }}
                                    className="w-5 h-5 rounded-full shadow-lg"
                                />
                                <span className={`absolute ${isOnline ? 'left-2' : 'right-2'} text-[8px] font-black uppercase ${isOnline ? 'text-brand' : 'text-content/30'}`}>
                                    {isOnline ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        )}
                        {/* ── Theme Toggle ── */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl border border-content/[0.04] bg-content/[0.02] text-content/40 hover:text-brand transition-all active:scale-95"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <NavLink to="/spare-driver/notifications" className="relative p-2.5 rounded-xl border border-content/[0.04] bg-content/[0.02] text-content/40 hover:text-brand transition-all active:scale-95">
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-white/5 border-surface " 
                                />
                            )}
                        </NavLink>
                        <NavLink to="/spare-driver/history-log" className="p-2.5 rounded-xl border border-content/[0.04] bg-content/[0.02] text-content/40 hover:text-brand transition-all active:scale-95">
                            <History size={18} />
                        </NavLink>
                    </div>
                </header>
            )}

            {/* ── Content Terminal ── */}
            <main className={`${!hideHeader ? 'pt-24' : 'pt-0'} ${!hideNav ? 'pb-32' : 'pb-0'} max-w-[430px] mx-auto min-h-screen px-0`}>
                {children}
            </main>

            {/* ── Navigation Dock (Full Width Mobile Style) ── */}
            {!hideNav && (
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[50] h-20 bg-surface/90 backdrop-blur-3xl border-t border-content/[0.05] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] px-6 flex items-center justify-between transition-all duration-500 pb-safe">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `
                                relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                ${isActive ? 'text-brand scale-110' : 'text-content/30 hover:text-content/60'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                        {link.label}
                                    </span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="nav_dot"
                                            className="absolute -bottom-1 w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_#FACD15]" 
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default DriverLayout;
