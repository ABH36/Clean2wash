import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Zap,
    Clock,
    Activity,
    Target,
    Layers,
    ChevronDown,
    RefreshCw
} from 'lucide-react';

const AdminAnalytics = () => {
    const [timeRange, setTimeRange] = useState('Last 30 Days');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 1500);
    };

    return (
        <AdminLayout title="Intelligence Engine">
            <div className="space-y-8">
                {/* Tactical Header Control */}
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto">
                        {['Realtime', 'Historical', 'Predictive'].map(tab => (
                            <button
                                key={tab}
                                className={`flex-1 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'Realtime' ? 'bg-white text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                        <div className="relative group shrink-0">
                            <button className="flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 hover:border-brand transition-all">
                                <Calendar size={14} className="text-brand" />
                                <span className="text-[10px] font-black text-content italic uppercase tracking-widest">{timeRange}</span>
                                <ChevronDown size={14} className="text-content-subtle" />
                            </button>
                        </div>
                        <button
                            onClick={handleSync}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${isSyncing ? 'bg-brand text-white border-brand' : 'bg-gray-50 text-content-subtle border-gray-100 hover:border-brand hover:text-brand'}`}
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        </button>
                        <button className="w-11 h-11 bg-content text-white rounded-2xl flex items-center justify-center shadow-lg shadow-content/20 shrink-0 hover:bg-brand transition-all">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Performance Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Velocity Chart */}
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-soft relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-content italic uppercase tracking-tighter leading-none mb-2">Revenue Velocity</h3>
                                <div className="flex items-center gap-2">
                                    <Activity size={10} className="text-brand" />
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Network Throughput: <span className="text-brand">Optimized</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Growth</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-100" />
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Stability</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Chart Infrastructure */}
                        <div className="h-64 flex items-end gap-3 px-2 relative z-10">
                            {[35, 60, 42, 75, 50, 85, 65, 80, 55, 95, 70, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                    <div className="relative w-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.04, duration: 1.2, ease: "circOut" }}
                                            className={`w-full rounded-t-[0.6rem] transition-all duration-500 cursor-pointer ${i === 11 ? 'bg-brand shadow-[0_-8px_20px_rgba(244,117,33,0.3)]' : 'bg-gray-100 group-hover/bar:bg-brand/20'}`}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none">
                                            <span className="bg-content text-white text-[8px] font-black px-2 py-1 rounded-md">₹{(h * 123).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-content-subtle uppercase tracking-tighter opacity-40">T{i + 1}</span>
                                </div>
                            ))}
                        </div>
                        <BarChart3 className="absolute -bottom-10 -right-10 text-gray-50 size-48 -rotate-12 group-hover:text-brand/5 transition-colors" />
                    </div>

                    {/* Operational Composition */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-soft flex flex-col group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-content italic uppercase tracking-tighter leading-none">Ops Mix</h3>
                            <PieChart size={20} className="text-brand" />
                        </div>
                        <div className="space-y-8 flex-1 flex flex-col justify-center">
                            {[
                                { label: 'Elite Detailing', val: 42, color: 'bg-brand', icon: <Zap size={14} /> },
                                { label: 'Doorstep Tech', val: 28, color: 'bg-indigo-600', icon: <Activity size={14} /> },
                                { label: 'Hub Essentials', val: 18, color: 'bg-content', icon: <Layers size={14} /> },
                                { label: 'Custom Protocols', val: 12, color: 'bg-gray-400', icon: <Target size={14} /> }
                            ].map((item, i) => (
                                <div key={i} className="group/item">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`${item.color} p-1.5 rounded-lg text-white group-hover/item:scale-110 transition-all`}>
                                                {item.icon}
                                            </div>
                                            <p className="text-[10px] font-black text-content italic uppercase tracking-widest">{item.label}</p>
                                        </div>
                                        <span className="text-xs font-black text-content italic">{item.val}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.val}%` }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 1.2, ease: "circOut" }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Efficiency KPI Array */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Avg Ticket Vector', val: '₹1,440', trend: '+12.5%', isUp: true, icon: <TrendingUp size={20} />, color: 'text-green-500', bg: 'bg-green-50' },
                        { label: 'Growth/Acquisition', val: '₹140', trend: '-4.2%', isUp: true, icon: <ArrowUpRight size={20} />, color: 'text-brand', bg: 'bg-brand/10' },
                        { label: 'System Utility', val: '92%', trend: '+8.1%', isUp: true, icon: <Zap size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Response Latency', val: '4.2m', trend: '-22.1%', isUp: false, icon: <RefreshCw size={20} />, color: 'text-red-500', bg: 'bg-red-50' }
                    ].map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft group hover:border-brand transition-all relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 ${metric.bg} ${metric.color} rounded-2xl flex items-center justify-center group-hover:bg-content group-hover:text-white transition-all`}>
                                    {metric.icon}
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${metric.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {metric.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {metric.trend}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 italic px-1">{metric.label}</p>
                            <h4 className="text-2xl font-black text-content italic leading-none">{metric.val}</h4>
                            <div className={`absolute -right-2 -bottom-2 opacity-5 ${metric.color} group-hover:scale-125 transition-transform duration-700`}>
                                {React.cloneElement(metric.icon, { size: 80 })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
