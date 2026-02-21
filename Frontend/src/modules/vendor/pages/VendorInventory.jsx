import React, { useState } from 'react';
import {
    Package, AlertTriangle, TrendingUp, Search,
    Filter, Plus, RefreshCw, ChevronRight, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';

const VendorInventory = () => {
    const [activeTab, setActiveTab] = useState('All Items');

    const INVENTORY = [
        { id: 'SKU-001', name: 'Premium Eco Soap', category: 'Cleaning', stock: 12, unit: 'Liters', status: 'Healthy', color: 'bg-green-500' },
        { id: 'SKU-002', name: 'Carnauba Wax', category: 'Polishing', stock: 2, unit: 'Tubs', status: 'Low Stock', color: 'bg-amber-500' },
        { id: 'SKU-003', name: 'Microfiber Towels', category: 'Tools', stock: 45, unit: 'Units', status: 'Healthy', color: 'bg-green-500' },
        { id: 'SKU-004', name: 'Tire Shine Spray', category: 'Detailing', stock: 0, unit: 'Bottles', status: 'Out of Stock', color: 'bg-red-500' },
        { id: 'SKU-005', name: 'Interior Leather Care', category: 'Detailing', stock: 8, unit: 'Bottles', status: 'Healthy', color: 'bg-green-500' },
    ];

    const STATS = [
        { label: 'Total Value', val: '₹14,200', icon: BarChart3, color: 'text-blue-500' },
        { label: 'Low Stock', val: '02 Items', icon: AlertTriangle, color: 'text-amber-500' },
        { label: 'Refills (Month)', val: '12', icon: RefreshCw, color: 'text-purple-500' },
    ];

    return (
        <VendorLayout
            title="Supplies & Inventory"
            subtitle="Track Studio Resources"
        >
            <div className="space-y-8">
                {/* Inventory Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STATS.map(s => (
                        <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">{s.label}</p>
                                <h2 className={`text-2xl font-black ${s.color} tracking-tight italic`}>{s.val}</h2>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-content-muted group-hover:bg-brand/5 group-hover:text-brand transition-all">
                                <s.icon size={22} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Tabs */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
                        {['All Items', 'Cleaning', 'Tools', 'Detailing'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-brand shadow-sm' : 'text-content-muted hover:text-content'
                                    }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                            <input type="text" placeholder="Search stock..." className="w-full h-12 bg-white border border-gray-100 rounded-xl pl-12 pr-4 text-[11px] font-bold text-content outline-none focus:border-brand shadow-soft" />
                        </div>
                        <button className="h-12 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2">
                            <Plus size={16} /> Add Supply
                        </button>
                    </div>
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INVENTORY.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft space-y-6 relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-brand uppercase tracking-widest italic">{item.category}</span>
                                        <span className="text-[8px] font-bold text-content-subtle lowercase">{item.id}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-content tracking-tight">{item.name}</h3>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_15px_rgba(0,0,0,0.1)] group-hover:scale-150 transition-transform`} />
                            </div>

                            <div className="flex items-end justify-between relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">In Stock</p>
                                    <p className="text-3xl font-black italic tracking-tighter text-content">
                                        {item.stock} <span className="text-xs text-content-subtle uppercase tracking-widest font-black leading-none">{item.unit}</span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <button className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-muted hover:bg-white hover:border-brand/30 hover:text-brand transition-all flex items-center justify-center gap-2">
                                        <RefreshCw size={12} /> Refill
                                    </button>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="relative z-10 space-y-2">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                    <span className="text-content-subtle">Health</span>
                                    <span className={item.color.replace('bg-', 'text-')}>{item.status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: item.stock === 0 ? '0%' : item.stock < 5 ? '30%' : '100%' }}
                                        className={`h-full ${item.color}`}
                                    />
                                </div>
                            </div>

                            {/* Decorative Background */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${item.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                        </motion.div>
                    ))}
                </div>

                {/* Consumption Chart Placeholder */}
                <div className="bg-content rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-content/30">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Supply Utilization</p>
                            <h2 className="text-3xl font-black italic tracking-tighter">Consumption Trends</h2>
                            <p className="text-[11px] font-bold text-white/40 leading-relaxed max-w-sm">Soap consumption is up by 12% this week due to high volume of 'Eco Wash' bookings. Schedule refill by Tuesday.</p>
                        </div>
                        <div className="flex-1 flex items-end justify-center md:justify-end gap-2 h-24">
                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="w-3 bg-brand/40 rounded-t-sm hover:bg-brand transition-colors cursor-pointer"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorInventory;
