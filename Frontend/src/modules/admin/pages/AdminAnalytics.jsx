import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, ChevronDown, RefreshCw, Download,
    Activity, BarChart3, PieChart, Zap,
    Layers, Target, TrendingUp, ArrowUpRight,
    ArrowDownRight,
    Globe,
    Cpu,
    MousePointer2,
    Filter,
    Users,
    ShieldCheck,
    Wallet
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart as RePieChart,
    Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const AdminAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('Last 30 Days');
    const [activeCategory, setActiveCategory] = useState('Global History');
    const [activeMetric, setActiveMetric] = useState('revenue'); // revenue, bookings
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeMode, setActiveMode] = useState('Historical');

    useEffect(() => {
        fetchStats();
    }, [timeRange, activeCategory]);

    const fetchStats = async () => {
        try {
            setIsSyncing(true);
            const res = await adminAPI.request(`/analytics?timeRange=${encodeURIComponent(timeRange)}&category=${encodeURIComponent(activeCategory)}`);
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Telemetry link failure');
        } finally {
            setIsSyncing(false);
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!stats?.revenueTimeline) return;
        
        const headers = ['Date', 'Revenue (INR)', 'Bookings'];
        const rows = stats.revenueTimeline.map(item => [
            `${item._id.day}/${item._id.month}/${item._id.year}`,
            item.revenue,
            item.bookings
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `spare_driver_analytics_${activeCategory.toLowerCase().replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('High-fidelity report exported');
    };

    const chartData = useMemo(() => {
        if (!stats?.revenueTimeline) return [];
        return stats.revenueTimeline.map(item => ({
            name: stats.timeRange === 'Year-to-Date' 
                ? new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' })
                : `${item._id.day}/${item._id.month}`,
            val: item[activeMetric],
            actualVal: item[activeMetric]
        }));
    }, [stats, activeMetric]);

    const opsMixData = useMemo(() => {
        if (!stats?.opsMix) return [];
        const total = stats.opsMix.reduce((sum, item) => sum + item.count, 0) || 1;
        return stats.opsMix.map(item => ({
            name: item._id || 'General',
            value: item.count,
            percent: Math.round((item.count / total) * 100)
        })).sort((a, b) => b.value - a.value);
    }, [stats]);

    const COLORS = ['#FF6B00', '#3B82F6', '#8B5CF6', '#10B981', '#64748B'];

    if (loading && !stats) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-white/5 border-brand/20 border-t-brand rounded-full" />
            <span className="text-[10px] font-black capitalize tracking-[0.4em] text-content-subtle opacity-30">Calibrating analytics hub</span>
        </div>
    );

    return (
        <div className="space-y-4 pb-20 max-w-[1450px] mx-auto px-4 lg:px-2 transition-colors duration-500">
            {/* ── ADMIN COMMAND HEADER ── */}
            <header className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-surface p-2.5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft transition-colors duration-500">
                <div className="flex bg-background p-1.5 rounded-xl w-full lg:w-auto shadow-inner border border-slate-100 dark:border-white/5">
                    {['Realtime', 'Historical', 'Predictive'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveMode(tab)}
                            className={`flex-1 lg:px-10 py-3 rounded-lg text-[10.5px] font-black capitalize tracking-widest transition-all ${activeMode === tab ? 'bg-surface text-brand  border border-slate-100 dark:border-white/5 translate-y-[-1px]' : 'text-content-muted hover:text-content'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <div className="relative group">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="appearance-none bg-background px-8 py-3.5 rounded-xl border border-slate-100 dark:border-white/5 text-[10.5px] font-black text-content capitalize tracking-widest outline-none pr-12 cursor-pointer hover:bg-surface transition-all shadow-inner"
                        >
                            <option value="Last 7 Days">Last 7 days</option>
                            <option value="Last 30 Days">Last 30 days</option>
                            <option value="Year-to-Date">Year-to-date</option>
                        </select>
                        <Calendar size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
                    </div>

                    <button 
                        onClick={fetchStats}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-background border border-slate-100 dark:border-white/5 text-content-subtle hover:text-brand transition-all hover:bg-surface shadow-inner`}
                        title="Sync Telemetry"
                    >
                        <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    </button>

                    <button 
                        onClick={handleExport}
                        className="h-12 px-8 bg-brand text-white rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand/20 text-[11px] font-black capitalize tracking-widest group"
                    >
                        <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" /> 
                        Export
                    </button>
                </div>
            </header>

            {/* ── ANALYTICS CARDS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Revenue Velocity */}
                <div className="lg:col-span-8 bg-surface rounded-[1.5rem] p-6 lg:p-7 border border-slate-200/60 dark:border-white/5 shadow-soft relative overflow-hidden group transition-colors duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-brand/10 text-brand rounded-[1.25rem] "><TrendingUp size={28} /></div>
                            <div>
                                <h3 className="text-[26px] font-black text-content tracking-tighter leading-none mb-2.5">Revenue Velocity</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-content-subtle capitalize tracking-widest opacity-40">Statistical Pulse: <span className="text-content opacity-100">Synchronized</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Metric Toggle */}
                            <div className="flex p-1.5 bg-background rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
                                {['revenue', 'bookings'].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setActiveMetric(m)}
                                        className={`px-6 py-2 rounded-lg text-[9.5px] font-black capitalize tracking-widest transition-all ${activeMetric === m ? 'bg-surface text-brand  border border-slate-100 dark:border-white/5' : 'text-content-muted hover:text-content'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Category Filter */}
                            <div className="relative group">
                                <Filter size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle opacity-30 group-hover:text-brand transition-colors" />
                                <select 
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="appearance-none bg-background px-12 py-3 rounded-xl text-[10.5px] font-black text-content outline-none hover:bg-surface transition-all capitalize tracking-widest pr-10 border border-slate-100 dark:border-white/5 shadow-inner"
                                >
                                    <option value="Global History">Global History</option>
                                    <option value="Chauffeur">Chauffeur</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-30" />
                            </div>
                        </div>
                    </div>

                    <div className="h-80 w-full mt-6 bg-background/20 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValAdv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={activeMetric === 'revenue' ? "#FF6B00" : "#3B82F6"} stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor={activeMetric === 'revenue' ? "#FF6B00" : "#3B82F6"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f040" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b830' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b830' }} />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: '1px solid #e2e8f030', 
                                        boxShadow: '0 30px 60px -12px rgb(0 0 0 / 0.15)', 
                                        fontSize: '12px', 
                                        fontWeight: '900', 
                                        textTransform: 'capitalize',
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-main)'
                                    }}
                                    cursor={{ stroke: '#FF6B00', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke={activeMetric === 'revenue' ? "#FF6B00" : "#3B82F6"} 
                                    strokeWidth={6} 
                                    fillOpacity={1} 
                                    fill="url(#colorValAdv)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* OPS MIX REFINED */}
                <div className="lg:col-span-4 bg-surface rounded-[1.5rem] p-6 border border-slate-200/60 dark:border-white/5 shadow-soft relative overflow-hidden group transition-colors duration-500 flex flex-col">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 blur-[60px] rounded-full" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-content capitalize tracking-tighter leading-none mb-1.5">Ops Mix</h3>
                            <p className="text-[9px] font-black text-content-subtle capitalize tracking-[0.3em] opacity-40">Market Partitioning</p>
                        </div>
                        <div className="p-3 bg-brand/10 rounded-xl text-brand group-hover:rotate-12 transition-transform "><PieChart size={22} /></div>
                    </div>

                    <div className="h-56 w-full relative z-10 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={opsMixData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={6}
                                    dataKey="value"
                                    animationDuration={1500}
                                >
                                    {opsMixData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        background: 'var(--bg-surface)', 
                                        border: '1px solid #e2e8f040', 
                                        borderRadius: '16px', 
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        color: 'var(--text-main)',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-1 opacity-30">Total</span>
                            <span className="text-2xl font-black text-content leading-none tracking-tighter">{stats?.periodTotalBookings || 0}</span>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {opsMixData.map((seg, i) => (
                            <div key={seg.name} className="flex justify-between items-center group/item p-3 hover:bg-background rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full " style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <div>
                                        <p className="text-[12.5px] font-black text-content capitalize">{seg.name}</p>
                                        <p className="text-[9px] font-bold text-content-subtle capitalize tracking-widest opacity-40">{seg.value} Data Points</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-black text-content tabular-nums">{seg.percent}%</p>
                                    <div className="w-16 h-1.5 bg-background rounded-full mt-1.5 overflow-hidden shadow-inner">
                                        <div className="h-full transition-all duration-1000" style={{ width: `${seg.percent}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* efficiency grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Market Yield', val: `₹${(stats?.periodTotalRevenue || 0).toLocaleString()}`, trend: 'Active', isUp: true, icon: <Wallet size={24} />, color: 'text-brand', bg: 'bg-brand/10' },
                    { label: 'Ops Pipeline', val: (stats?.activeJobs || 0).toString(), trend: 'Sync', isUp: true, icon: <Zap size={24} />, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-light)]' },
                    { label: 'Net Momentum', val: (stats?.userGrowth || 0).toString(), trend: 'Growth', isUp: true, icon: <Users size={24} />, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    { label: 'System Health', val: '99.9%', trend: 'HQ', isUp: true, icon: <ShieldCheck size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                ].map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        whileHover={{ y: -6 }}
                        className="bg-surface p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-white/5 shadow-soft group transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className={`w-12 h-12 ${metric.bg} ${metric.color} rounded-xl flex items-center justify-center transition-all  border border-transparent group-hover:bg-brand group-hover:text-white group-hover:shadow-lg`}>
                                {metric.icon}
                            </div>
                            <div className="px-4 py-2 bg-background border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black capitalize tracking-[0.2em] text-content-subtle/50">
                                {metric.trend}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-content-subtle capitalize tracking-[0.2em] mb-1.5 px-1 opacity-40">{metric.label}</p>
                            <h4 className="text-[28px] font-black text-content leading-none tracking-tighter tabular-nums font-sans">{metric.val}</h4>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Secondary Insight: Daily Volume */}
                <div className="lg:col-span-8 bg-surface p-7 rounded-[1.5rem] border border-slate-200/60 dark:border-white/5 shadow-soft relative overflow-hidden transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl border border-[var(--primary-light)] "><BarChart3 size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-content capitalize tracking-tighter leading-none mb-1.5">Growth Momentum</h3>
                                <p className="text-[9px] font-black text-content-subtle capitalize tracking-[0.3em] opacity-40">Volume Throughput Analytics</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-brand " /><span className="text-[10px] font-black text-content-subtle capitalize">Peak Activity</span></div>
                             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-background border border-slate-200 dark:border-white/10" /><span className="text-[10px] font-black text-content-subtle capitalize">Neutral</span></div>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full relative z-10 bg-background/10 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} hide />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        background: 'var(--bg-surface)', 
                                        border: '1px solid #e2e8f040', 
                                        color: 'var(--text-main)', 
                                        fontSize: '12px', 
                                        fontWeight: '900',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                                />
                                <Bar dataKey="val" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#FF6B00' : '#e2e8f040'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* IQ Terminal Hardened */}
                <div className="lg:col-span-4 bg-surface dark:bg-[#0B1222] p-8 rounded-[1.5rem] border border-slate-200/60 dark:border-white/5 shadow-soft flex flex-col items-center justify-center text-center group relative overflow-hidden transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full" />
                    <div className="w-20 h-20 bg-background rounded-[1.5rem] flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:bg-brand transition-all duration-500 shadow-inner group-hover:shadow-brand/20">
                        <Cpu size={40} className="text-content-subtle opacity-30 group-hover:text-white group-hover:opacity-100 transition-all" />
                    </div>
                    <h3 className="text-xl font-black text-content capitalize tracking-tighter mb-3">Master Intelligence</h3>
                    <p className="text-[11px] font-black text-content-subtle/60 leading-relaxed max-w-[260px] mb-8 font-mono tracking-tight">
                        Neural aggregation active. Operational data models and predictive stability patterns synchronized in realtime across the elite grid.
                    </p>
                    <button className="w-full py-4 bg-brand text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/50 shadow-brand/20">
                        Request Audit
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand/10 group-hover:bg-brand transition-colors" />
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
