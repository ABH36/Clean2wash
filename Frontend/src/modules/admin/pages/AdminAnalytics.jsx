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
        <div className="space-y-6 pb-32">
            {/* ── INTELLIGENCE COMMAND BANNER ── */}
            <div className="adm-card overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col lg:flex-row gap-6 lg:items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Intelligence Command</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Real-time Telemetry Active</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="adm-input pl-12 h-11 text-xs font-bold uppercase appearance-none"
                            >
                                <option value="Last 7 Days">Last 7 Days</option>
                                <option value="Last 30 Days">Last 30 Days</option>
                                <option value="Year-to-Date">Year-to-Date</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={fetchStats}
                                className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                            >
                                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            </button>
                            <button 
                                onClick={handleExport}
                                className="adm-btn adm-btn-primary h-11 px-6 flex items-center gap-2"
                            >
                                <Download size={18} /> Export Intel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3 bg-white flex border-b border-slate-50 overflow-x-auto no-scrollbar">
                    {['Global History', 'Chauffeur', 'Commercial', 'Logistics'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                                activeCategory === cat 
                                    ? 'bg-slate-900 text-amber-500 shadow-lg' 
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CORE METRICS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Market Yield', val: `₹${(stats?.periodTotalRevenue || 0).toLocaleString()}`, trend: '+12.5%', isUp: true, icon: <Wallet size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Ops Pipeline', val: (stats?.activeJobs || 0).toString(), trend: 'Syncing', isUp: true, icon: <Zap size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Net Momentum', val: (stats?.userGrowth || 0).toString(), trend: '+4.2%', isUp: true, icon: <Users size={24} />, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'System Health', val: '99.9%', trend: 'Nominal', isUp: true, icon: <ShieldCheck size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="adm-card p-8 group hover:border-amber-500 transition-all"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className={`w-14 h-14 ${metric.bg} ${metric.color} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm`}>
                                {metric.icon}
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${metric.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {metric.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{metric.label}</p>
                            <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{metric.val}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── DATA VISUALIZATION ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Revenue/Booking Timeline */}
                <div className="lg:col-span-8 adm-card flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Revenue Velocity</h3>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Timeline Aggregation</p>
                        </div>
                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                            {['revenue', 'bookings'].map(m => (
                                <button 
                                    key={m} 
                                    onClick={() => setActiveMetric(m)}
                                    className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMetric === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 flex-1 min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={activeMetric === 'revenue' ? "#f59e0b" : "#3b82f6"} stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor={activeMetric === 'revenue' ? "#f59e0b" : "#3b82f6"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                    dy={15} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '1.5rem', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', 
                                        fontSize: '11px', 
                                        fontWeight: '900', 
                                        textTransform: 'uppercase',
                                        backgroundColor: '#ffffff',
                                        padding: '12px 16px'
                                    }}
                                    cursor={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke={activeMetric === 'revenue' ? "#f59e0b" : "#3b82f6"} 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorMetric)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Operations Distribution */}
                <div className="lg:col-span-4 adm-card flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Ops Mix</h3>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Market Partitioning</p>
                        </div>
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                            <PieChart size={20} />
                        </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="h-64 w-full relative mb-10">
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
                                            background: '#ffffff', 
                                            border: '1px solid #e2e8f0', 
                                            borderRadius: '1rem', 
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total</span>
                                <span className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stats?.periodTotalBookings || 0}</span>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {opsMixData.map((seg, i) => (
                                <div key={seg.name} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <div>
                                            <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{seg.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{seg.value} Samples</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{seg.percent}%</p>
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                            <div className="h-full transition-all duration-1000" style={{ width: `${seg.percent}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ADDITIONAL INTELLIGENCE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 adm-card p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 text-amber-500 rounded-xl shadow-lg"><BarChart3 size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Growth Momentum</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Throughput Analytics</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peak Activity</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Baseline</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '1rem', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                                        fontSize: '11px', 
                                        fontWeight: '900',
                                        textTransform: 'uppercase'
                                    }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="val" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#f59e0b' : '#f1f5f9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 adm-card bg-slate-900 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Cpu size={120} className="text-white" />
                    </div>
                    
                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 group-hover:bg-amber-500 transition-all duration-500 shadow-xl group-hover:shadow-amber-500/20">
                        <Cpu size={40} className="text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Master Intelligence</h3>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[280px] mb-10 font-mono">
                        Neural aggregation active. Operational data models and predictive stability patterns synchronized in real-time across the elite grid.
                    </p>
                    
                    <button className="adm-btn adm-btn-primary w-full h-14 rounded-2xl text-[11px] tracking-[0.3em] shadow-2xl shadow-amber-500/20">
                        REQUEST AUDIT REPORT
                    </button>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 group-hover:bg-amber-500 transition-all" />
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
