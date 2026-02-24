import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
    LayoutDashboard,
    BarChart3,
    Users,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronRight,
    Car,
    ShieldCheck,
    MapPin,
    Tag,
    Package,
    Moon,
    Sun
} from 'lucide-react';

const AdminLayout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, getUser } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const user = getUser('admin') || { email: 'admin@CarWash.in', name: 'Admin' };
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { setIsMobileNavOpen(false); }, [location.pathname]);

    const NAV_ITEMS = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin' },
        { icon: <BarChart3 size={18} />, label: 'Analytics', path: '/admin/analytics' },
        { icon: <Users size={18} />, label: 'User Management', path: '/admin/users' },
        { icon: <ShieldCheck size={18} />, label: 'Vendor Registry', path: '/admin/users?type=vendors' },
        { icon: <Package size={18} />, label: 'Operations Hub', path: '/admin/bookings' },
        { icon: <Car size={18} />, label: 'Service Catalog', path: '/admin/services' },
        { icon: <MapPin size={18} />, label: 'Hubs & Studio', path: '/admin/hubs' },
        { icon: <Tag size={18} />, label: 'Promotions', path: '/admin/promotions' },
        { icon: <Settings size={18} />, label: 'System Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans selection:bg-brand selection:text-white transition-colors duration-500">
            {/* Desktop Sidebar */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="hidden lg:flex bg-[#0B1222] text-white flex-col sticky top-0 h-screen overflow-hidden z-[60] border-r border-white/5 shadow-2xl"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-brand/5 pointer-events-none" />

                <SidebarContent
                    isSidebarOpen={isSidebarOpen}
                    NAV_ITEMS={NAV_ITEMS}
                    location={location}
                    navigate={navigate}
                    user={user}
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0B1222] text-white flex flex-col z-[80] lg:hidden border-r border-white/10"
                        >
                            <div className="absolute top-6 right-6 text-white/40 z-10" onClick={() => setIsMobileNavOpen(false)}>
                                <X size={24} />
                            </div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                            <SidebarContent
                                isSidebarOpen={true}
                                NAV_ITEMS={NAV_ITEMS}
                                location={location}
                                navigate={navigate}
                                user={user}
                                onLogout={() => { logout('admin'); navigate('/admin/login'); }}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen w-full relative">
                <header className="bg-surface/80 backdrop-blur-xl px-4 lg:px-10 py-5 border-b border-gray-100/10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500">
                    <div className="flex items-center gap-4 lg:gap-8">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-2.5 bg-background rounded-2xl text-content-subtle hover:text-brand hover:scale-105 active:scale-95 transition-all border border-gray-100/10"
                        >
                            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="lg:hidden p-2.5 bg-background rounded-2xl text-content-subtle"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="h-6 w-px bg-gray-100/20 mx-2 hidden lg:block" />
                        <h2 className="text-sm lg:text-lg font-black text-content italic tracking-tight uppercase truncate max-w-[150px] lg:max-w-none">
                            {title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden lg:flex items-center gap-3 bg-background px-5 py-2.5 rounded-[1.25rem] border border-gray-100/10 focus-within:border-brand transition-all group">
                            <Search size={16} className="text-content-subtle group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Universal Query..."
                                className="bg-transparent outline-none text-[11px] font-bold text-content w-48 uppercase tracking-widest italic"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="w-11 h-11 bg-background rounded-2xl flex items-center justify-center text-content-subtle hover:text-brand hover:scale-105 active:scale-95 transition-all border border-gray-100/10"
                            >
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <button className="w-11 h-11 bg-background rounded-2xl flex items-center justify-center text-content-subtle relative hover:text-brand hover:scale-105 active:scale-95 transition-all border border-gray-100/10">
                                <Bell size={18} />
                                <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full border-2 border-surface animate-pulse" />
                            </button>
                            <div className="w-px h-8 bg-gray-100/20 mx-1 lg:mx-2" />
                            <div className="flex items-center gap-3 bg-background pr-4 pl-1.5 py-1.5 rounded-2xl border border-gray-100/10 hover:border-brand/30 transition-all cursor-pointer group">
                                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-xs italic shrink-0 group-hover:bg-brand group-hover:text-white transition-all">
                                    SY
                                </div>
                                <div className="hidden sm:block text-left overflow-hidden">
                                    <p className="text-[10px] font-black text-content italic leading-none truncate w-20 uppercase">Admin</p>
                                    <p className="text-[7px] font-black text-brand uppercase tracking-widest mt-1.5 opacity-60 italic">Superuser</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

const SidebarContent = ({ isSidebarOpen, NAV_ITEMS, location, navigate, onLogout, user }) => (
    <div className="relative z-10 flex flex-col h-full">
        {/* Logo Section */}
        <div className={`p-8 flex items-center gap-4 mb-10 ${!isSidebarOpen && 'justify-center p-6'}`}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-[0_8px_30px_rgba(244,117,33,0.3)]">
                <Car size={26} className="text-brand" />
            </div>
            {isSidebarOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col"
                >
                    <span className="text-xl font-black italic tracking-tighter leading-none text-white whitespace-nowrap">CARWASH <span className="text-brand">BASE</span></span>
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/30 mt-1.5 italic">Operational Unit</span>
                </motion.div>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide py-2">
            {NAV_ITEMS.map((item, i) => {
                const isActive = (location.pathname + location.search) === item.path;
                return (
                    <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden ${isActive
                            ? 'bg-brand text-white shadow-[0_10px_30px_rgba(244,117,33,0.25)]'
                            : 'hover:bg-white/[0.03] text-white/30 hover:text-white'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="nav-bg"
                                className="absolute inset-0 bg-gradient-to-r from-brand to-orange-400 opacity-90"
                            />
                        )}
                        <div className={`relative z-10 shrink-0 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {item.icon}
                        </div>
                        {isSidebarOpen && (
                            <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 italic ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                {item.label}
                            </span>
                        )}
                        {isActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full z-20"
                            />
                        )}
                    </motion.button>
                );
            })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.01]">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-600 text-white/20 hover:text-white transition-all group relative overflow-hidden"
            >
                <LogOut size={18} className="relative z-10 group-hover:-translate-x-1 transition-transform" />
                {isSidebarOpen && <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] italic">Decommission Login</span>}
            </button>
        </div>
    </div>
);

export default AdminLayout;
