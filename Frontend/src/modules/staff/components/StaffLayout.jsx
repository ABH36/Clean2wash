import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation, Calendar, User, LogOut, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

const StaffLayout = ({ children, title, subtitle, showBack = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode, toggleTheme } = useTheme();

    const tabs = [
        { id: 'jobs', label: 'Jobs', icon: <Navigation size={20} />, path: '/staff' },
        { id: 'history', label: 'History', icon: <Calendar size={20} />, path: '/staff/history' },
        { id: 'profile', label: 'Profile', icon: <User size={20} />, path: '/staff/profile' },
    ];

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#FDFDFF]'} font-sans pb-28 transition-colors duration-500`}>
            {/* Top Bar */}
            <header className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-xl z-[60] px-6 pt-12 pb-6 border-b transition-all flex items-center justify-between`}>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>{subtitle || 'Staff Workspace'}</p>
                    <h1 className={`text-2xl font-black italic leading-none tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{title || 'Dashboard'}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-brand-light' : 'bg-gray-50 border-gray-100 text-content-subtle hover:text-brand'}`}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        onClick={() => navigate('/staff/profile')}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-brand' : 'bg-gray-50 border-gray-100 text-content-subtle hover:text-brand hover:border-brand/20'}`}
                    >
                        <User size={22} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 px-5">
                {children}
            </main>

            {/* Premium Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4">
                <div className="max-w-md mx-auto bg-content/95 backdrop-blur-xl rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl shadow-content/30 border border-white/10">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-3xl transition-all duration-500 overflow-hidden ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                <span className={`relative z-10 ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
                                    {tab.icon}
                                </span>
                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-black uppercase tracking-widest relative z-10"
                                    >
                                        {tab.label}
                                    </motion.span>
                                )}

                                {/* Interactive Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="absolute inset-0 bg-gradient-to-r from-brand to-brand-light opacity-100"
                                    />
                                )}
                            </button>
                        );
                    })}

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button
                        onClick={() => navigate('/staff/login')}
                        className="p-3.5 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default StaffLayout;
