import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
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
    Sun,
    Crown,
    ShoppingBag,
    UserCheck,
    Wallet,
    Zap,
    History,
    TrendingUp
} from 'lucide-react';


const AdminLayout = ({ title: propTitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, getUser } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const user = getUser('admin') || { email: 'admin@CarWash.in', name: 'Admin' };
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const getPageTitle = () => {
        if (propTitle) return propTitle;
        const path = location.pathname;
        if (path === '/admin') return 'Operational IQ';
        if (path === '/admin/notifications') return 'Intelligence Logs';
        if (path === '/admin/bookings') return 'Service Registry';
        if (path === '/admin/users') return 'User Directory';
        return 'Admin Command';
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

        // Socket listener for new notifications
        socketService.joinAdminRoom();

        const handleNewNotification = () => {
            fetchUnreadCount();
        };

        socketService.on('new_admin_notification', handleNewNotification);
        socketService.on('sos_alert', handleNewNotification);
        socketService.on('new_booking', handleNewNotification);

        return () => {
            socketService.off('new_admin_notification', handleNewNotification);
            socketService.off('sos_alert', handleNewNotification);
            socketService.off('new_booking', handleNewNotification);
        };
    }, []);

    useEffect(() => { setIsMobileNavOpen(false); }, [location.pathname]);

    const NAV_ITEMS = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin' },
        { icon: <Bell size={18} />, label: 'Notifications', path: '/admin/notifications' },
        { icon: <BarChart3 size={18} />, label: 'Analytics', path: '/admin/analytics' },
        { icon: <Users size={18} />, label: 'User Management', path: '/admin/users' },
        { icon: <ShieldCheck size={18} />, label: 'Vendor Registry', path: '/admin/users?type=vendors' },
        { icon: <ShoppingBag size={18} />, label: 'Product Governance', path: '/admin/products' },
        { icon: <TrendingUp size={18} />, label: 'Product War-Room', path: '/admin/product-war-room' },
        { icon: <UserCheck size={18} />, label: 'Chauffeur Drivers', path: '/admin/spare-drivers' },
        { icon: <Package size={18} />, label: 'Operations Hub', path: '/admin/bookings' },
        { icon: <Car size={18} />, label: 'Service Catalog', path: '/admin/services' },
        { icon: <Car size={18} />, label: 'Vehicle Catalog', path: '/admin/vehicle-catalog' },
        { icon: <MapPin size={18} />, label: 'Hubs & Studio', path: '/admin/hubs' },
        { icon: <Crown size={18} />, label: 'Subscription Control', path: '/admin/subscriptions' },
        { icon: <Tag size={18} />, label: 'Promotions', path: '/admin/promotions' },
        { icon: <Wallet size={18} />, label: 'Audit Ledger', path: '/admin/transactions' },
        { icon: <History size={18} />, label: 'System Audit Logs', path: '/admin/audit' },
        { icon: <Settings size={18} />, label: 'System Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans selection:bg-brand selection:text-white transition-colors duration-500">
            {/* Desktop Sidebar */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="hidden lg:flex bg-[#0B1222] text-white flex-col sticky top-0 h-screen overflow-hidden z-[60] border-r border-white/5 shadow-2xl selection:bg-brand/30"
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
            <main className="flex-1 flex flex-col min-h-screen min-w-0 relative bg-background overflow-x-hidden pb-16 lg:pb-0">
                <header className="bg-surface/80 backdrop-blur-xl px-4 lg:px-10 py-3 lg:py-5 border-b border-gray-100/10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500">
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
                        <h2 className="text-[12px] lg:text-lg font-black text-content tracking-tight uppercase truncate max-w-[120px] lg:max-w-none">
                            {getPageTitle()}
                        </h2>
                        <div className="hidden sm:block">
                            <LocationIndicator variant="minimal" className="!bg-transparent !border-none !p-0 ml-4 opacity-70 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden lg:flex items-center gap-3 bg-background px-5 py-2.5 rounded-[1.25rem] border border-gray-100/10 focus-within:border-brand transition-all group">
                            <Search size={16} className="text-content-subtle group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Universal Query..."
                                className="bg-transparent outline-none text-[11px] font-bold text-content w-48 uppercase tracking-widest"
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

                            <button
                                onClick={() => navigate('/admin/notifications')}
                                className="w-11 h-11 bg-background rounded-2xl flex items-center justify-center text-content-subtle relative hover:text-brand hover:scale-105 active:scale-95 transition-all border border-gray-100/10"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-surface shadow-lg shadow-brand/20">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <div className="w-px h-8 bg-gray-100/20 mx-1 lg:mx-2" />
                            <div className="flex items-center gap-3 bg-background pr-4 pl-1.5 py-1.5 rounded-2xl border border-gray-100/10 hover:border-brand/30 transition-all cursor-pointer group">
                                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-xs shrink-0 group-hover:bg-brand group-hover:text-white transition-all">
                                    SY
                                </div>
                                <div className="hidden sm:block text-left overflow-hidden">
                                    <p className="text-[10px] font-black text-content leading-none truncate w-20 uppercase">Admin</p>
                                    <p className="text-[7px] font-black text-brand uppercase tracking-widest mt-1.5 opacity-60">Superuser</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-10 flex-1 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav
                    NAV_ITEMS={NAV_ITEMS}
                    location={location}
                    navigate={navigate}
                    setIsMobileNavOpen={setIsMobileNavOpen}
                />
            </main>
        </div>
    );
};

const SidebarContent = ({ isSidebarOpen, NAV_ITEMS, location, navigate, onLogout, user }) => (
    <div className="relative z-10 flex flex-col h-full">
        {/* Logo Section */}
        <div className={`p-8 flex items-center gap-4 mb-10 ${!isSidebarOpen && 'justify-center p-6'}`}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-[0_8px_30px_rgba(244,117,33,0.3)] hover:rotate-3 transition-transform cursor-pointer">
                <Car size={26} className="text-brand" />
            </div>
            {isSidebarOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col"
                >
                    <span className="text-xl font-black tracking-tighter leading-none text-white whitespace-nowrap uppercase italic">Carwash <span className="text-brand">O-IQ</span></span>
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/30 mt-1.5 leading-none">Elite command unit</span>
                </motion.div>
            )}
        </div>

        {/* Navigation */}
        <nav
            className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <LayoutGroup id="sidebar-nav">
                {NAV_ITEMS.map((item, i) => {
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    return (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden ${isActive
                                ? 'text-white'
                                : 'text-white/30 hover:text-white hover:bg-white/[0.03]'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-gradient-to-r from-brand to-orange-500 shadow-[0_10px_20px_rgba(244,117,33,0.3)] z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                            <div className={`relative z-10 shrink-0 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </div>
                            {isSidebarOpen && (
                                <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    {item.label}
                                </span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="active-tick"
                                    className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full z-20"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </LayoutGroup>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.01]">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-600/20 hover:text-red-500 text-white/20 transition-all group relative overflow-hidden"
            >
                <LogOut size={18} className="relative z-10 group-hover:-translate-x-1 transition-transform" />
                {isSidebarOpen && <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">End Operational Link</span>}
            </button>
        </div>
    </div>
);

const BottomNav = ({ NAV_ITEMS, location, navigate, setIsMobileNavOpen }) => {
    // Top 4 critical nodes for fast access
    const BOTTOM_ITEMS = [
        NAV_ITEMS[0], // Dashboard
        NAV_ITEMS[9], // Operations Hub (Bookings)
        NAV_ITEMS[3], // User Management
        NAV_ITEMS[10], // Service Catalog
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-2xl border-t border-gray-100/10 px-6 flex items-center justify-between lg:hidden z-[60] safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            {BOTTOM_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-brand scale-110' : 'text-content-subtle'}`}
                    >
                        <div className={`p-1 rounded-lg ${isActive ? 'bg-brand/10' : ''}`}>
                            {React.cloneElement(item.icon, { size: 18 })}
                        </div>
                    </button>
                );
            })}
            <button
                onClick={() => setIsMobileNavOpen(true)}
                className="flex flex-col items-center gap-1 text-content-subtle group"
            >
                <div className="p-1 rounded-lg group-active:bg-brand/10 group-active:text-brand transition-all">
                    <Menu size={18} />
                </div>
            </button>
        </nav>
    );
};

export default AdminLayout;
