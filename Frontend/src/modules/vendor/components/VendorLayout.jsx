import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, Truck, Users,
    Wallet, Settings, Bell, Plus, Search, Box, LayoutGrid, BarChart3, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const VendorLayout = ({ children, title, subtitle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const NAV_ITEMS = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor' },
        { icon: Package, label: 'All Orders', path: '/vendor/orders' },
        { icon: LayoutGrid, label: 'Studio Services', path: '/vendor/services' },
        { icon: BarChart3, label: 'Performance', path: '/vendor/reports' },
        { icon: Truck, label: 'Fleet & Drivers', path: '/vendor/fleet' },
        { icon: Users, label: 'Customers', path: '/vendor/customers' },
        { icon: Box, label: 'Inventory', path: '/vendor/inventory' },
        { icon: Wallet, label: 'Earnings', path: '/vendor/earnings' },
        { icon: Settings, label: 'Studio Settings', path: '/vendor/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* ── Sidebar (Desktop) ── */}
            <aside className="hidden md:flex w-68 bg-content flex-col border-r border-white/5 p-6 space-y-8 sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                        <Package size={20} className="text-white" />
                    </div>
                    <span className="text-white font-black text-xl italic tracking-tighter">Hoora <span className="text-brand">Vendor</span></span>
                </div>

                <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-brand text-white shadow-xl shadow-brand/20 scale-[1.02]'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 3 : 2.5} />
                                <span className="font-black text-sm tracking-tight">{item.label}</span>
                                {isActive && (
                                    <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                            <Plus size={16} />
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Elite Support</p>
                    </div>
                    <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        Contact Manager
                    </button>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={() => navigate('/vendor/login')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                    >
                        <LogOut size={20} />
                        <span className="font-black text-sm tracking-tight">Logout session</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">{title}</h1>
                        <p className="text-[10px] text-content-subtle font-bold uppercase tracking-widest mt-1">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                            <Search size={14} className="text-content-subtle" />
                            <input type="text" placeholder="Search orders..." className="bg-transparent border-none outline-none px-2 text-[11px] font-bold text-content placeholder:text-content-subtle" />
                        </div>
                        <button className="relative w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-white transition-all">
                            <Bell size={18} className="text-content-muted" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-white" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-brand overflow-hidden border border-brand shadow-sm cursor-pointer" onClick={() => navigate('/vendor/settings')}>
                            <img src="https://images.unsplash.com/photo-1542435503-956c469947f6?w=200&q=80" alt="Vendor" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* ── Mobile Navigation ── */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-content/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex justify-around items-center z-50 shadow-2xl">
                {NAV_ITEMS.slice(0, 4).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`p-3 rounded-xl transition-all ${isActive ? 'bg-brand text-white' : 'text-white/40'}`}
                        >
                            <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default VendorLayout;
