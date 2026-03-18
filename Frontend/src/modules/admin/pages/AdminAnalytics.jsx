import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, ChevronDown, RefreshCw, Download,
    Activity, BarChart3, PieChart, Zap,
    Layers, Target, TrendingUp, ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { adminAPI } from '../../../utils/adminApi';

const AdminAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('Last 30 Days');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    const fetchStats = async () => {
        try {
            setIsSyncing(true);
            const response = await adminAPI.getAnalytics(timeRange);
            if (response.status === 'success') {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsSyncing(false);
            setLoading(false);
        }
    };

    const handleSync = () => {
        fetchStats();
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
                            <select 
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 hover:border-brand transition-all text-[10px] font-black text-content uppercase tracking-widest outline-none appearance-none cursor-pointer pr-10"
                            >
                                <option value="Last 7 Days">Last 7 Days</option>
                                <option value="Last 30 Days">Last 30 Days</option>
                                <option value="Year-to-Date">Year-to-Date</option>
                            </select>
                            <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
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
                                <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none mb-2">Revenue Velocity</h3>
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
                            {(() => {
                                if (!stats?.revenueTimeline) return null;
                                
                                const maxRevenue = Math.max(...stats.revenueTimeline.map(r => r.revenue), 1);
                                const isDaily = stats.timeRange !== 'Year-to-Date';

                                return stats.revenueTimeline.map((m, i) => {
                                    const heightPercent = (m.revenue / maxRevenue) * 100;
                                    const label = isDaily ? `${m._id.day}/${m._id.month}` : new Date(0, m._id.month - 1).toLocaleString('default', { month: 'short' });

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                            <div className="relative w-full h-full flex items-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(5, heightPercent)}%` }}
                                                    transition={{ delay: i * 0.02, duration: 1, ease: "circOut" }}
                                                    className={`w-full rounded-t-[0.4rem] transition-all duration-500 cursor-pointer ${i === stats.revenueTimeline.length - 1 ? 'bg-brand shadow-[0_-8px_20px_rgba(244,117,33,0.3)]' : 'bg-gray-100 group-hover/bar:bg-brand/20'}`}
                                                />
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20">
                                                    <span className="bg-content text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl border border-white/10">₹{m.revenue.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="text-[7px] font-black text-content-subtle uppercase tracking-tighter opacity-40">{label}</span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <BarChart3 className="absolute -bottom-10 -right-10 text-gray-50 size-48 -rotate-12 group-hover:text-brand/5 transition-colors" />
                    </div>

                    {/* Operational Composition */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-soft flex flex-col group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">Ops Mix</h3>
                            <PieChart size={20} className="text-brand" />
                        </div>
                        <div className="space-y-8 flex-1 flex flex-col justify-center">
                            {(() => {
                                const totalItems = stats?.opsMix?.reduce((sum, item) => sum + item.count, 0) || 0;
                                const categories = [
                                    { id: 'Doorstep', color: 'bg-brand', icon: <Zap size={14} /> },
                                    { id: 'Studio', color: 'bg-indigo-600', icon: <Activity size={14} /> },
                                    { id: 'Add-ons', color: 'bg-content', icon: <Layers size={14} /> },
                                    { id: 'Prestige', color: 'bg-gray-400', icon: <Target size={14} /> }
                                ];

                                return categories.map((cat, i) => {
                                    const data = stats?.opsMix?.find(o => o._id === cat.id);
                                    const percent = totalItems > 0 ? Math.round(((data?.count || 0) / totalItems) * 100) : 0;

                                    return (
                                        <div key={i} className="group/item">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`${cat.color} p-1.5 rounded-lg text-white group-hover/item:scale-110 transition-all`}>
                                                        {cat.icon}
                                                    </div>
                                                    <p className="text-[10px] font-black text-content uppercase tracking-widest">{cat.id}</p>
                                                </div>
                                                <span className="text-xs font-black text-content">{percent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ delay: 0.6 + i * 0.1, duration: 1.2, ease: "circOut" }}
                                                    className={`h-full ${cat.color} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Efficiency KPI Array */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Period Revenue Flow', val: `₹${(stats?.periodTotalRevenue || 0).toLocaleString()}`, trend: 'Selected', isUp: true, icon: <TrendingUp size={20} />, color: 'text-green-500', bg: 'bg-green-50' },
                        { label: 'Active Pipeline', val: stats?.activeJobs || 0, trend: 'Current', isUp: true, icon: <Activity size={20} />, color: 'text-brand', bg: 'bg-brand/10' },
                        { label: 'Acquired Network', val: stats?.userGrowth || 0, trend: 'New', isUp: true, icon: <Zap size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'System Utility', val: '100%', trend: 'Operational', isUp: true, icon: <RefreshCw size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' }
                    ].map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className={`${loading ? 'animate-pulse bg-gray-50' : 'bg-white'} p-8 rounded-[2.5rem] border border-gray-100 shadow-soft group hover:border-brand transition-all relative overflow-hidden`}
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
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 px-1">{metric.label}</p>
                            <h4 className="text-2xl font-black text-content leading-none">{metric.val}</h4>
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
