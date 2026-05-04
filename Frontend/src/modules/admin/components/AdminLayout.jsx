import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import { isFeatureEnabled, syncPlatformConfig } from '../../../utils/platformConfig';
import { ADMIN_ROUTES_CONFIG } from '../AdminRoutesConfig.jsx';
import '../../../styles/admin-theme.css';
import {
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    Moon,
    Sun,
    ChevronDown,
    Calendar,
    Settings,
    Car
} from 'lucide-react';

import EmergencyResponse from '../components/EmergencyResponse';

const AdminLayout = ({ title: propTitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeSOS, setActiveSOS] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState([
        'Bookings', 
        'Operations', 
        'Support Desk', 
        'Finance'
    ]);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark');
        } else {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const initPlatform = async () => {
            await syncPlatformConfig();
            setIsLoadingConfig(false);
        };
        initPlatform();
    }, []);

    const getPageTitle = () => {
        if (propTitle) return propTitle;
        const path = location.pathname;
        if (path === '/admin') return 'Dashboard';
        
        // Find label from config
        let label = 'Admin Panel';
        ADMIN_ROUTES_CONFIG.forEach(item => {
            if (item.path === path) label = item.label;
            if (item.routes) {
                item.routes.forEach(route => {
                    if (route.path === path) label = route.label;
                });
            }
        });
        return label;
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await adminAPI.getNotifications({ limit: 1, isRead: false });
            if (res.status === 'success') {
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        socketService.joinAdminRoom();
        
        const handleNewNotification = () => fetchUnreadCount();
        const handleSOSAlert = (data) => {
            setActiveSOS(data);
            fetchUnreadCount();
        };

        socketService.on('new_admin_notification', handleNewNotification);
        socketService.on('sos_alert', handleSOSAlert);
        
        return () => {
            socketService.off('new_admin_notification', handleNewNotification);
            socketService.off('sos_alert', handleSOSAlert);
        };
    }, []);

    useEffect(() => { setIsMobileNavOpen(false); }, [location.pathname]);

    const toggleGroup = (label) => {
        setExpandedGroups(prev => 
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    return (
        <div className="admin-module-root flex flex-col lg:flex-row min-h-screen">
            
            {/* Desktop Sidebar */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 264 : 72 }}
                className="hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden z-40 shrink-0 adm-sidebar"
            >
                <SidebarContent
                    isSidebarOpen={isSidebarOpen}
                    NAV_ITEMS={ADMIN_ROUTES_CONFIG}
                    location={location}
                    navigate={navigate}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    onLogout={() => { logout('admin'); navigate('/admin/login'); }}
                />
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileNavOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileNavOpen(false)}
                            className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] flex flex-col z-[70] lg:hidden shadow-2xl"
                            style={{ backgroundColor: 'var(--sidebar-bg)' }}
                        >
                            <SidebarContent
                                isSidebarOpen={true}
                                NAV_ITEMS={ADMIN_ROUTES_CONFIG}
                                location={location}
                                navigate={navigate}
                                expandedGroups={expandedGroups}
                                toggleGroup={toggleGroup}
                                onLogout={() => { logout('admin'); navigate('/admin/login'); }}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen min-w-0 relative overflow-x-hidden bg-mesh">
                {/* ── PREMIUM TOP BAR ── */}
                <header className="adm-header shrink-0">
                    {/* Left: Menu + Page Title */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-500"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="hidden sm:flex flex-col">
                            <h2 className="text-sm font-black !text-white uppercase tracking-widest leading-none">
                                {getPageTitle()}
                            </h2>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">Clean2Wash Control</p>
                        </div>
                    </div>

                    {/* Center: Search */}
                    <div className="adm-search-bar hidden md:block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="adm-search-input"
                        />
                    </div>

                    {/* Right: Actions + Profile */}
                    <div className="flex items-center gap-2">
                        {/* Date Range */}
                        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white hover:border-amber-300 transition-all">
                            <Calendar size={13} className="text-slate-500" />
                            <span className="text-[11px] font-bold text-slate-600">20 May – 26 May, 2025</span>
                            <ChevronDown size={11} className="text-slate-400" />
                        </div>

                        {/* Notification Bell */}
                        <button className="relative p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="h-7 w-px bg-slate-200 mx-1" />

                        {/* Profile */}
                        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-[11px] font-black text-white leading-none group-hover:text-amber-600 transition-colors uppercase tracking-wide">Super Admin</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Administrator</p>
                            </div>
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden border-2 border-slate-100 shadow-md">
                                    <img src="https://ui-avatars.com/api/?name=Super+Admin&background=0f172a&color=f59e0b" alt="Admin" className="w-full h-full object-cover" />
                                </div>
                                {/* Live status dot */}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white adm-live-dot" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="p-6 flex-1 relative w-full overflow-x-hidden bg-mesh">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}>
                        <Outlet />
                    </Suspense>
                </div>
            </main>

            {/* Emergency Alerts */}
            <AnimatePresence>
                {activeSOS && (
                    <EmergencyResponse 
                        alert={activeSOS} 
                        onResolve={() => setActiveSOS(null)}
                        onClose={() => setActiveSOS(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const SidebarContent = ({ isSidebarOpen, NAV_ITEMS, location, navigate, onLogout, expandedGroups, toggleGroup }) => (
    <div className="flex flex-col h-full text-[var(--sidebar-text)]">
        {/* Logo Section */}
        <div className="px-6 py-8 flex items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <Car className="text-slate-900" size={24} />
                </div>
                {isSidebarOpen && (
                    <motion.h1 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xl font-black !text-white tracking-tight"
                    >
                        SpareDriver
                    </motion.h1>
                )}
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
            {NAV_ITEMS.map((item, i) => {
                const isGroup = !!item.routes;
                const isExpanded = expandedGroups.includes(item.category);
                const isActive = item.path ? location.pathname === item.path : item.routes?.some(r => location.pathname === r.path);
                
                return (
                    <div key={item.label || item.category} className="mb-2">
                        {isGroup ? (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleGroup(item.category)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${
                                        isActive ? 'text-white' : 'hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`${isActive ? 'text-amber-500' : 'text-slate-400'} group-hover:text-amber-400 transition-colors`}>
                                            {item.icon}
                                        </span>
                                        {isSidebarOpen && (
                                            <span className="text-[13px] font-black tracking-wide uppercase opacity-70 group-hover:opacity-100 text-slate-300">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    {isSidebarOpen && (
                                        <ChevronDown size={12} strokeWidth={3} className={`transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                                
                                <AnimatePresence>
                                    {isExpanded && isSidebarOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden ml-12 space-y-1 mt-1 border-l-2 border-slate-800/50"
                                        >
                                            {item.routes.map((route) => (
                                                <button
                                                    key={route.label}
                                                    onClick={() => navigate(route.path)}
                                                    className={`w-full text-left px-5 py-2 rounded-r-xl text-[12px] font-bold transition-all relative ${
                                                        location.pathname === route.path 
                                                            ? 'text-amber-500 bg-amber-500/10' 
                                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {route.label}
                                                    {route.badge && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-purple-600 text-[8px] text-white rounded font-black uppercase tracking-widest">
                                                            {route.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                                    location.pathname === item.path
                                        ? 'bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/20 scale-[1.02]'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                }`}
                            >
                                <span className={`${location.pathname === item.path ? 'text-slate-900' : 'text-slate-400 group-hover:text-amber-400'}`}>
                                    {item.icon}
                                </span>
                                {isSidebarOpen && (
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className={`text-[13px] font-black tracking-wide uppercase ${location.pathname === item.path ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                location.pathname === item.path ? 'bg-slate-900 text-white' : 'bg-purple-600 text-white'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                );
            })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 mt-auto border-t border-slate-800/50">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
            >
                <LogOut size={18} />
                {isSidebarOpen && <span className="text-sm font-bold">Logout</span>}
            </button>
        </div>
    </div>
);

export default AdminLayout;
