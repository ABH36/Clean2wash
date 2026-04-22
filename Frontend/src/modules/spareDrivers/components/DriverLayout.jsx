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
    Moon,
    ChevronRight
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

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
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const [address, setAddress] = useState('Fetching Base...');

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await spareDriverAPI.getProfile();
                const addr = res?.data?.driver?.address;
                if (addr && addr.street) {
                    setAddress(`${addr.street}, ${addr.city}`);
                } else if (addr && addr.city) {
                    setAddress(addr.city);
                } else {
                    setAddress('Set Base Address');
                }
            } catch (error) {
                setAddress('Location Offline');
            }
        };
        fetchAddress();
    }, []);

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
                            className="h-14 sm:h-16 w-auto object-contain"
                        />
                        <button 
                            onClick={() => navigate('/spare-driver/address')}
                            className="flex flex-col items-start -space-y-0.5 group"
                        >
                            <span className="text-[7px] font-black text-brand uppercase tracking-widest opacity-60">Operational Base</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] font-black text-content uppercase tracking-tight truncate max-w-[120px] group-active:text-brand transition-colors">
                                    {address}
                                </span>
                                <motion.div 
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <ChevronRight size={10} className="text-brand" />
                                </motion.div>
                            </div>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* ── Online/Offline Toggle ── */}
                        {showToggle && (
                            <button 
                                onClick={onToggle} 
                                className={`w-16 h-8 rounded-full transition-all relative flex items-center px-1 shadow-inner ${isOnline ? 'bg-brand/20 border border-brand/40' : 'bg-content/[0.08] border border-content/[0.1]'}`}
                            >
                                <motion.div 
                                    animate={{ 
                                        x: isOnline ? 32 : 0,
                                        backgroundColor: isOnline ? '#FACD15' : '#666'
                                    }}
                                    className="w-6 h-6 rounded-full shadow-md z-10 flex items-center justify-center"
                                >
                                    {isOnline && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                                </motion.div>
                                <span className={`absolute ${isOnline ? 'left-2.5' : 'right-2.5'} text-[8px] font-black uppercase tracking-tighter ${isOnline ? 'text-brand' : 'text-content/30'}`}>
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
                    </div>
                </header>
            )}

            {/* ── Content Terminal ── */}
            <main className={`${!hideHeader ? 'pt-24' : 'pt-0'} ${!hideNav ? 'pb-40' : 'pb-0'} max-w-[430px] mx-auto min-h-screen px-0`}>
                {children}
            </main>

            {/* ── Navigation Dock (Full Width Mobile Style) ── */}
            {!hideNav && (
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[50] h-24 bg-surface/95 backdrop-blur-3xl border-t border-content/[0.05] shadow-[0_-15px_45px_rgba(0,0,0,0.08)] px-8 flex items-center justify-between transition-all duration-500 pb-safe">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `
                                relative flex flex-col items-center justify-center w-16 h-16 rounded-3xl transition-all duration-300
                                ${isActive ? 'text-brand scale-110' : 'text-content/30 hover:text-content/60'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <link.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                        {link.label}
                                    </span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="nav_dot"
                                            className="absolute -bottom-1 w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_12px_#FACD15]" 
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
