import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Package, Clock, CheckCircle2,
    XCircle, ChevronRight, Filter, Zap,
    ShoppingBag, Tag, ArrowRight
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['Active', 'Completed', 'Cancelled'];

const MyOrders = () => {
    const navigate = useNavigate();
    const { productOrders, loadProductOrders } = useAuth();
    const [activeTab, setActiveTab] = useState('Active');

    useEffect(() => {
        loadProductOrders();
    }, [loadProductOrders]);

    const filteredOrders = useMemo(() => {
        if (!productOrders) return { Active: [], Completed: [], Cancelled: [] };

        return {
            Active: productOrders.filter(o => ['pending', 'processing', 'shipped', 'paid'].includes(o.status)),
            Completed: productOrders.filter(o => o.status === 'delivered'),
            Cancelled: productOrders.filter(o => o.status === 'cancelled')
        };
    }, [productOrders]);

    const list = filteredOrders[activeTab] || [];

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { label: 'Awaiting Payment', color: 'text-violet-600 bg-violet-50' };
            case 'paid': return { label: 'Confirmed', color: 'text-blue-600 bg-blue-50' };
            case 'processing': return { label: 'Preparing', color: 'text-blue-600 bg-blue-50' };
            case 'shipped': return { label: 'In Transit', color: 'text-orange-600 bg-orange-50' };
            case 'delivered': return { label: 'Delivered', color: 'text-green-600 bg-green-50' };
            case 'cancelled': return { label: 'Cancelled', color: 'text-red-600 bg-red-50' };
            default: return { label: status, color: 'text-gray-600 bg-gray-50' };
        }
    };

    return (
        <MobileLayout hideNav>
            {/* ── Header ── */}
            <header className="px-5 pt-12 pb-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                        <ChevronLeft size={20} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-content italic uppercase">My Orders</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5 leading-none">Product Hub</p>
                    </div>
                </div>
                <button className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <Filter size={18} className="text-content-subtle" />
                </button>
            </header>

            <div className="p-5 space-y-5 pb-32">
                {/* ── Tab Switcher ── */}
                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-content shadow-sm border border-gray-100'
                                    : 'text-content-subtle opacity-60'
                                }`}
                        >
                            {tab}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-lg text-[8px] ${activeTab === tab ? 'bg-brand/10 text-brand' : 'bg-gray-200'
                                }`}>
                                {filteredOrders[tab].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Orders List ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {list.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                                    <ShoppingBag size={32} className="text-gray-200" />
                                </div>
                                <h3 className="text-base font-black text-content tracking-tight uppercase italic mb-2">No Consignments</h3>
                                <p className="text-xs font-bold text-content-subtle opacity-60 px-10">You haven't procured any premium products in this category yet.</p>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="mt-8 px-8 py-3 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20"
                                >
                                    Browse Shop
                                </button>
                            </div>
                        ) : (
                            list.map((order) => (
                                <OrderCard key={order._id} order={order} onTrack={() => navigate(`/order-tracking/${order._id}`)} />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── Cross-Sell / Promo ── */}
                <div
                    onClick={() => navigate('/shop')}
                    className="relative bg-content p-6 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag size={12} className="text-brand" fill="currentColor" />
                            <span className="text-[9px] font-black text-brand uppercase tracking-widest italic">Exclusive Offer</span>
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase italic leading-none mb-1">Upgrade your kit</h3>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Stock up on premium microfiber towels</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest italic">
                            Procure Now <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

const OrderCard = ({ order, onTrack }) => {
    const status = (order.status || 'pending').toLowerCase();
    const statusInfo = {
        'pending': { label: 'Awaiting Payment', color: 'text-violet-600 bg-violet-50' },
        'paid': { label: 'Confirmed', color: 'text-blue-600 bg-blue-50' },
        'processing': { label: 'Preparing', color: 'text-blue-600 bg-blue-50' },
        'shipped': { label: 'In Transit', color: 'text-orange-600 bg-orange-50' },
        'delivered': { label: 'Delivered', color: 'text-green-600 bg-green-50' },
        'cancelled': { label: 'Cancelled', color: 'text-red-600 bg-red-50' }
    }[status] || { label: status, color: 'text-gray-600 bg-gray-50' };

    const firstProduct = order.items?.[0]?.product || {};
    const moreItemsCount = (order.items?.length || 0) - 1;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onTrack}
            className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden group cursor-pointer"
        >
            <div className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative flex-shrink-0">
                    <img
                        src={firstProduct.image || firstProduct.images?.[0] || 'https://images.unsplash.com/photo-1558227691-41ea78d1f631?w=200&q=80'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={firstProduct.name}
                    />
                    {moreItemsCount > 0 && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                            <span className="text-[8px] font-black text-white uppercase">+{moreItemsCount} more</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <span className="text-[10px] font-black text-content tabular-nums tracking-tighter">
                            ₹{order.pricing?.totalPrice?.toLocaleString()}
                        </span>
                    </div>
                    <h4 className="text-sm font-black text-content tracking-tight truncate mb-1">
                        {firstProduct.name || 'Premium Procurement'}
                    </h4>
                    <p className="text-[9px] font-bold text-content-subtle opacity-60 uppercase tracking-widest mb-3">
                        Slot: {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                            <span className="text-[8px] font-black text-brand uppercase tracking-widest">Live Tracking Available</span>
                        </div>
                        <ChevronRight size={16} className="text-content-subtle group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MyOrders;
