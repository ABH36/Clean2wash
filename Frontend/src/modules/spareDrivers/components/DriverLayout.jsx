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

const DriverLayout = ({ children, title, hideNav = false, hideHeader = false }) => {
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
        { to: '/spare-driver/earnings', icon: Wallet, label: 'BAL' },
        { to: '/spare-driver/profile', icon: User, label: 'DOC' }
    ];

    return (
        <div className="min-h-screen bg-background text-content font-sans selection:bg-brand selection:text-black transition-colors duration-500 driver-theme">
            {/* ── Fixed Header ── */}
            {!hideHeader && (
                <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[50] px-6 py-5 bg-surface/80 backdrop-blur-xl border-b border-content/[0.03] flex items-center justify-between transition-colors duration-500">
                    <div>
                        <p className="text-[9px] font-black text-brand uppercase tracking-[0.3em] mb-0.5">Fleet Protocol</p>
                        <h1 className="text-xl font-black text-content tracking-tighter uppercase">{title || 'Command'}</h1>
                    </div>
                    <div className="flex items-center gap-2">
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
                                    className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-surface shadow-sm" 
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

            {/* ── Navigation Dock ── */}
            {!hideNav && (
                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[380px] z-[50] h-18 bg-black/[0.90] dark:bg-black/[0.80] backdrop-blur-2xl rounded-[2.2rem] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] px-4 flex items-center justify-between transition-all duration-500">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `
                                relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                                ${isActive ? 'text-brand scale-110' : 'text-white/30 hover:text-white/60'}
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
