import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    LayoutDashboard, Package, Truck, Users,
    Wallet, Settings, Bell, Search, Box, LayoutGrid,
    BarChart3, LogOut, ShoppingBag, ChevronRight,
    ShieldCheck, ShieldAlert, Lock, Clock, XCircle,
    Menu, X, Sun, Moon, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

const NAV_GROUPS = [
    {
        label: 'Main',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor' },
            { icon: Package, label: 'All Orders', path: '/vendor/orders' },
            { icon: BarChart3, label: 'Performance', path: '/vendor/reports' },
        ],
    },
    {
        label: 'Manage',
        items: [
            { icon: LayoutGrid, label: 'Studio Services', path: '/vendor/services' },
            { icon: ShoppingBag, label: 'Shop & Products', path: '/vendor/products' },
            { icon: Box, label: 'Inventory', path: '/vendor/inventory' },
            { icon: Truck, label: 'Fleet & Drivers', path: '/vendor/fleet' },
        ],
    },
    {
        label: 'Account',
        items: [
            { icon: Users, label: 'Customers', path: '/vendor/customers' },
            { icon: Wallet, label: 'Earnings', path: '/vendor/earnings' },
            { icon: Settings, label: 'Studio Settings', path: '/vendor/settings' },
        ],
    },
    {
        label: 'Team',
        items: [
            { icon: UserPlus, label: 'Add Staff', path: '/vendor/staff' },
        ],
    },
];

const VendorLayout = ({ children, title, subtitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getUser, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const user = getUser('vendor') || {};
    const isVerified = user.verificationStatus === 'verified';
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    const closeDrawer = () => setIsMobileDrawerOpen(false);

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans transition-colors duration-500">

            {/* ── Mobile Drawer (Overlay) ── */}
            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDrawer}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f1117] text-white flex flex-col z-[260] md:hidden shadow-2xl"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20">
                                        <Package size={16} className="text-white" />
                                    </div>
                                    <span className="text-sm font-black uppercase italic tracking-tighter">CarWash <span className="text-brand">Hub</span></span>
                                </div>
                                <button onClick={closeDrawer} className="text-white/40 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                                {NAV_GROUPS.map((group) => (
                                    <div key={group.label}>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] px-3 mb-3">{group.label}</p>
                                        <div className="space-y-1">
                                            {group.items.map((item) => {
                                                const isActive = location.pathname === item.path;
                                                const isRestricted = !isVerified && item.path !== '/vendor' && item.path !== '/vendor/settings';
                                                return (
                                                    <button
                                                        key={item.path}
                                                        onClick={() => {
                                                            if (!isRestricted) {
                                                                navigate(item.path);
                                                                closeDrawer();
                                                            }
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-brand' : 'text-white/40'}`}
                                                    >
                                                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                        <span className="text-xs font-bold">{item.label}</span>
                                                        {isRestricted && <Lock size={12} className="ml-auto opacity-20" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className="p-4 border-t border-white/5">
                                <button
                                    onClick={() => { logout('vendor'); navigate('/vendor/login'); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 bg-red-500/5 font-bold text-xs"
                                >
                                    <LogOut size={16} /> Logout Terminal
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Sidebar (Desktop) ── */}
            <aside className="hidden md:flex flex-col sticky top-0 h-screen"
                style={{ width: 260, background: '#0f1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Logo */}
                <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30 flex-shrink-0">
                            <Package size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-white font-black text-[15px] tracking-tight leading-none">
                                CarWash<span className="text-brand"> Vendor</span>
                            </p>
                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Management Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] px-3 mb-2">{group.label}</p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const isRestricted = !isVerified && item.path !== '/vendor' && item.path !== '/vendor/settings';

                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => !isRestricted && navigate(item.path)}
                                            disabled={isRestricted}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isRestricted ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                            style={isActive ? { background: 'rgba(255,255,255,0.08)' } : {}}
                                        >
                                            {/* Active left bar */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeBar"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-full"
                                                />
                                            )}

                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive
                                                ? 'bg-brand/15'
                                                : 'bg-transparent group-hover:bg-white/5'
                                                }`}>
                                                <item.icon
                                                    size={16}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={isActive ? 'text-brand' : 'text-white/35 group-hover:text-white/70 transition-colors'}
                                                />
                                            </div>

                                            {/* Label */}
                                            <span className={`text-[13px] font-bold tracking-tight flex-1 text-left transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/75'
                                                }`}>
                                                {item.label}
                                            </span>

                                            {isRestricted && <Lock size={12} className="text-white/20" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 pb-6 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={() => { logout('vendor'); navigate('/vendor/login'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-transparent group-hover:bg-red-500/10 flex items-center justify-center flex-shrink-0 transition-all">
                            <LogOut size={16} className="transition-colors" />
                        </div>
                        <span className="text-[13px] font-bold tracking-tight">Logout session</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto relative h-screen">
                {/* Header */}
                <header className="bg-surface/80 backdrop-blur-xl border-b border-gray-100/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="md:hidden w-10 h-10 bg-background rounded-xl flex items-center justify-center text-content border border-gray-100/10"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-content leading-none">{title}</h1>
                            <p className="text-[10px] text-content-subtle font-bold uppercase tracking-widest mt-1">{subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center bg-background border border-gray-100/10 rounded-xl px-3 py-2">
                            <Search size={13} className="text-content-subtle" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none px-2 text-[11px] font-bold text-content placeholder:text-content-subtle w-36"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 bg-background rounded-xl flex items-center justify-center text-content-subtle border border-gray-100/10 hover:text-brand transition-all"
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <button className="relative w-9 h-9 bg-background rounded-xl flex items-center justify-center border border-gray-100/10 hover:bg-surface transition-all">
                            <Bell size={16} className="text-content-muted" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full" />
                        </button>
                        <div
                            className="w-9 h-9 rounded-xl overflow-hidden border-2 border-gray-100/10 cursor-pointer hover:border-brand/30 transition-all"
                            onClick={() => navigate('/vendor/settings')}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1542435503-956c469947f6?w=200&q=80"
                                alt="Vendor"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto relative">
                    {!isVerified && location.pathname !== '/vendor/settings' && (
                        <div className="fixed inset-0 z-[200] backdrop-blur-xl bg-background/40 flex items-center justify-center p-6 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-surface border border-gray-100/10 shadow-2xl rounded-[3rem] p-10 max-w-md w-full flex flex-col items-center"
                            >
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl ${user.verificationStatus === 'rejected' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-brand text-white shadow-brand/30'}`}>
                                    {user.verificationStatus === 'rejected' ? <XCircle size={36} /> : <ShieldAlert size={36} />}
                                </div>
                                <h2 className="text-2xl font-black text-content italic leading-none uppercase tracking-tighter mb-4">Security Clearance <br /><span className="text-brand">Required</span></h2>
                                <p className="text-[11px] font-bold text-content-subtle uppercase tracking-[0.2em] leading-relaxed mb-8">
                                    {user.verificationStatus === 'rejected'
                                        ? 'Your application has been rejected by administration. Please contact support to resolve identifying disputes.'
                                        : 'Your identity proof is currently under review by our tactical operations team. Access to the commerce engine is restricted.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-background p-4 rounded-3xl border border-gray-100/10">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5">Current Status</p>
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.verificationStatus === 'rejected' ? 'bg-red-500' : 'bg-brand'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-tighter italic ${user.verificationStatus === 'rejected' ? 'text-red-500' : 'text-brand'}`}>
                                                {user.verificationStatus?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-background p-4 rounded-3xl border border-gray-100/10 flex flex-col justify-center">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5">Support Port</p>
                                        <span className="text-[10px] font-black text-content uppercase tracking-tighter italic">VND-OPS-0421</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/vendor/settings')}
                                    className="w-full h-14 bg-brand text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] mt-8 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                                >
                                    Review Documents <Settings size={14} />
                                </button>
                            </motion.div>
                        </div>
                    )}
                    {children}
                </div>
            </main>

            {/* ── Mobile Navigation ── */}
            <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex justify-around items-center z-50 shadow-2xl"
                style={{ background: '#0f1117' }}>
                {NAV_GROUPS[0].items.concat(NAV_GROUPS[1].items.slice(0, 1)).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive ? 'text-brand' : 'text-white/30'}`}
                        >
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default VendorLayout;
