import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, BarChart2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

const NAV = [
    { to: '/captain', icon: Home, label: 'Home' },
    { to: '/captain/job', icon: Briefcase, label: 'Jobs' },
    { to: '/captain/earnings', icon: BarChart2, label: 'Earnings' },
    { to: '/captain/profile', icon: User, label: 'Profile' },
];

const CaptainLayout = ({ children, hideNav = false }) => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`mobile-container ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'} flex flex-col min-h-screen relative overflow-hidden transition-colors duration-500`}>
            {/* ── Ambient Mesh Lighting ── */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className={`absolute -top-[10%] -left-[10%] w-[60%] h-[50%] blur-[120px] rounded-full ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`} />
                <div className={`absolute top-[20%] -right-[15%] w-[50%] h-[50%] blur-[140px] rounded-full ${isDarkMode ? 'bg-indigo-500/15' : 'bg-blue-500/5'}`} />
            </div>

            <main className="flex-1 relative z-10">{children}</main>

            {!hideNav && (
                <nav className={`fixed bottom-0 w-full max-w-md backdrop-blur-3xl border-t px-6 pt-3 pb-7 flex justify-between items-center z-50 transition-all duration-500 ${isDarkMode
                    ? 'bg-[#1E293B]/90 border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.5)]'
                    : 'bg-white/90 border-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.08)]'
                    }`}>
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/captain'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-brand' : isDarkMode ? 'text-white/20' : 'text-slate-400'}`
                            }>
                            {({ isActive }) => (
                                <>
                                    <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive
                                        ? isDarkMode ? 'bg-brand/15 shadow-[0_0_25px_rgba(255,107,0,0.2)]' : 'bg-brand/10 shadow-[0_0_20px_rgba(255,107,0,0.1)]'
                                        : isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/[0.05]'
                                        }`}>
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        {isActive && (
                                            <motion.div layoutId="navDot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full shadow-[0_0_10px_#FF6B00]" />
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors ${isActive ? 'text-brand' : isDarkMode ? 'text-white/10' : 'text-slate-400'}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default CaptainLayout;
