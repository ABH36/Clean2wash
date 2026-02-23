import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
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
    Tag
} from 'lucide-react';

const AdminLayout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, getUser } = useAuth();
    const user = getUser('admin') || { email: 'admin@CarWash.in', name: 'Admin' };
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile nav on route change
    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [location.pathname]);

    const NAV_ITEMS = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
        { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin/analytics' },
        { icon: <Users size={20} />, label: 'User Management', path: '/admin/users' },
        { icon: <Car size={20} />, label: 'Service Catalog', path: '/admin/services' },
        { icon: <MapPin size={20} />, label: 'Hubs & Studio', path: '/admin/hubs' },
        { icon: <Tag size={20} />, label: 'Promotions', path: '/admin/promotions' },
        { icon: <Settings size={20} />, label: 'System Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <motion.aside
                animate={{
                    width: isSidebarOpen ? 280 : 80,
                    x: 0
                }}
                className="hidden lg:flex bg-content text-white flex-col sticky top-0 h-screen overflow-hidden z-[60]"
            >
                <SidebarContent
                    isSidebarOpen={isSidebarOpen}
                    NAV_ITEMS={NAV_ITEMS}
                    location={location}
                    navigate={navigate}
                    user={user}
                    onLogout={() => { logout('admin'); navigate('/admin/login'); }}
                />
            </motion.aside>

            {/* Mobile Sidebar / Overlay */}
            <AnimatePresence>
                {isMobileNavOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileNavOpen(false)}
                            className="fixed inset-0 bg-content/60 backdrop-blur-sm z-[70] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-content text-white flex flex-col z-[80] lg:hidden"
                        >
                            <div className="absolute top-6 right-6 text-white/40" onClick={() => setIsMobileNavOpen(false)}>
                                <X size={24} />
                            </div>
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
            <main className="flex-1 flex flex-col min-h-screen w-full">
                {/* Header */}
                <header className="bg-white px-4 lg:px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-4 lg:gap-6">
                        {/* Toggle for Desktop */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-2 bg-gray-50 rounded-xl text-content-subtle hover:text-content transition-all"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Toggle for Mobile */}
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="lg:hidden p-2 bg-gray-50 rounded-xl text-content-subtle hover:text-content transition-all"
                        >
                            <Menu size={20} />
                        </button>

                        <h2 className="text-sm lg:text-xl font-black text-content italic tracking-tight uppercase truncate max-w-[150px] lg:max-w-none">
                            {title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
                            <Search size={18} className="text-content-subtle" />
                            <input
                                type="text"
                                placeholder="Universal Search..."
                                className="bg-transparent outline-none text-xs font-bold text-content w-48"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 lg:w-11 lg:h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-content-subtle relative hover:bg-gray-100 transition-all">
                                <Bell size={18} lg:size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-white" />
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1 lg:mx-2" />
                            <div className="flex items-center gap-2 lg:gap-3 bg-gray-50 p-1 lg:p-1.5 lg:pr-4 rounded-2xl border border-gray-100">
                                <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-xs italic shrink-0">
                                    SY
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-[9px] lg:text-[10px] font-black text-content italic leading-none">Admin</p>
                                    <p className="text-[7px] lg:text-[8px] font-bold text-brand uppercase tracking-widest mt-1">Superuser</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Body */}
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

const SidebarContent = ({ isSidebarOpen, NAV_ITEMS, location, navigate, onLogout, user }) => (
    <>
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
                <Car size={24} className="text-white" />
            </div>
            {isSidebarOpen && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-black italic tracking-tighter"
                >
                    CARWASH <span className="text-brand">BASE</span>
                </motion.span>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
                <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${location.pathname === item.path
                        ? 'bg-brand text-white'
                        : 'hover:bg-white/5 text-white/40 hover:text-white'
                        }`}
                >
                    <div className="shrink-0">{item.icon}</div>
                    {isSidebarOpen && (
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    )}
                    {location.pathname === item.path && (
                        <motion.div
                            layoutId="nav-active"
                            className="absolute left-[-16px] w-2 h-8 bg-brand rounded-r-full"
                        />
                    )}
                </button>
            ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-white/5">
            {isSidebarOpen && (
                <div className="px-4 py-4 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <User size={20} className="text-brand" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-black truncate">{user.name || 'CarWash Admin'}</p>
                        <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                    </div>
                </div>
            )}
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all"
            >
                <LogOut size={20} />
                {isSidebarOpen && <span className="text-sm font-black uppercase tracking-widest">Logout</span>}
            </button>
        </div>
    </>
);

export default AdminLayout;
