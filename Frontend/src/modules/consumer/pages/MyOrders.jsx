import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Package, Clock, CheckCircle2,
    XCircle, ChevronRight, Filter, Zap,
    ShoppingBag, Tag, ArrowRight, Boxes,
    RefreshCw
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['Active', 'Completed', 'Cancelled'];

const MyOrders = () => {
    const navigate = useNavigate();
    const { productOrders, loadProductOrders } = useAuth();
    const [activeTab, setActiveTab] = useState('Active');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadProductOrders();
    }, [loadProductOrders]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProductOrders();
        setRefreshing(false);
    };

    const filteredOrders = useMemo(() => {
        if (!productOrders) return { Active: [], Completed: [], Cancelled: [] };

        return {
            Active: productOrders.filter(o => ['pending', 'processing', 'shipped', 'paid'].includes(o.status)),
            Completed: productOrders.filter(o => o.status === 'delivered'),
            Cancelled: productOrders.filter(o => o.status === 'cancelled')
        };
    }, [productOrders]);

    const list = filteredOrders[activeTab] || [];

    return (
        <MobileLayout hideNav>
            <div className="bg-slate-50 min-h-screen pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">My orders</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Track your purchases</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className={`p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all ${refreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                </header>

                <div className="px-5 pt-6 space-y-5">
                    {/* ── Tab Selector ── */}
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all flex items-center justify-center gap-2 ${activeTab === tab 
                                    ? 'bg-slate-900 text-white shadow-md' 
                                    : 'text-slate-400'}`}
                            >
                                {tab}
                                <span className={`h-4.5 px-1.5 rounded-lg flex items-center justify-center text-[9px] font-bold ${activeTab === tab ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {filteredOrders[tab].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ── Order Cards ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {list.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                    <ShoppingBag size={32} className="text-slate-100 mx-auto mb-3" />
                                    <p className="text-[12px] font-bold text-slate-300">No orders here</p>
                                    <button onClick={() => navigate('/shop')} className="mt-6 text-brand font-bold text-[11px] underline underline-offset-4">Explore products</button>
                                </div>
                            ) : (
                                list.map((order) => (
                                    <OrderCard key={order._id} order={order} onTrack={() => navigate(`/order-tracking/${order._id}`)} />
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Shop Banner ── */}
                    <button 
                        onClick={() => navigate('/shop')}
                        className="w-full bg-slate-900 p-5 rounded-[2rem] flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all group shadow-xl"
                    >
                        <div className="w-11 h-11 bg-brand rounded-2xl flex items-center justify-center shrink-0">
                            <Tag size={20} className="text-slate-900" fill="currentColor" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-bold text-[15px] leading-tight mb-1">Upgrade your kit</p>
                            <p className="text-white/40 text-[10px] font-medium leading-none">Browse premium microfiber towels</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/20 group-hover:text-brand transition-colors">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

const OrderCard = ({ order, onTrack }) => {
    const status = (order.status || 'pending').toLowerCase();
    const statusInfo = {
        'pending': { label: 'Awaiting payment', color: 'text-amber-500 bg-amber-50' },
        'paid': { label: 'Confirmed', color: 'text-blue-500 bg-blue-50' },
        'processing': { label: 'Preparing', color: 'text-blue-500 bg-blue-50' },
        'shipped': { label: 'In transit', color: 'text-orange-500 bg-orange-50' },
        'delivered': { label: 'Delivered', color: 'text-emerald-500 bg-emerald-50' },
        'cancelled': { label: 'Cancelled', color: 'text-red-500 bg-red-50' }
    }[status] || { label: status, color: 'text-slate-400 bg-slate-50' };

    const firstProduct = order.items?.[0]?.product || {};
    const moreItemsCount = (order.items?.length || 0) - 1;

    return (
        <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={onTrack}
            className="bg-white rounded-[1.8rem] border border-gray-100 shadow-sm overflow-hidden p-4 group"
        >
            <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 relative">
                    <img
                        src={firstProduct.image || firstProduct.images?.[0] || 'https://images.unsplash.com/photo-1558227691-41ea78d1f631?w=200&q=80'}
                        className="w-full h-full object-cover"
                        alt=""
                    />
                    {moreItemsCount > 0 && (
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm py-0.5 text-center">
                            <span className="text-[7px] font-bold text-white">+{moreItemsCount} items</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <p className="text-[14px] font-bold text-slate-800 tabular-nums">
                            ₹{order.pricing?.totalPrice?.toLocaleString()}
                        </p>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 truncate mb-1">
                        {firstProduct.name || 'Order confirmation'}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-[9px] font-bold text-brand uppercase tracking-wider">Live tracking active</span>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.div>
    );
};

export default MyOrders;
