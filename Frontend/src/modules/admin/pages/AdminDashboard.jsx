import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { adminAPI } from '../../../utils/adminApi';
import {
    TrendingUp,
    TrendingDown,
    Zap,
    Users,
    History,
    Wallet,
    ChevronRight,
    Car,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeJobs: 0,
        totalUsers: 0,
        recentBookings: [],
        topNodes: [],
        networkLoad: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await adminAPI.getDashboard();
                if (res.status === 'success') {
                    setStats(res.data);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const STATS = [
        { 
            label: 'Total Revenue', 
            val: `₹${(stats.totalRevenue || 0).toLocaleString()}`, 
            trend: `${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend}%`, 
            isUp: stats.revenueTrend >= 0, 
            icon: <Wallet size={20} />, 
            color: 'text-brand', 
            bg: 'bg-brand/10' 
        },
        { 
            label: 'Active Jobs', 
            val: (stats.activeJobs || 0).toString(), 
            trend: `${stats.jobsTrend >= 0 ? '+' : ''}${stats.jobsTrend}%`, 
            isUp: stats.jobsTrend >= 0, 
            icon: <Zap size={20} />, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50' 
        },
        { 
            label: 'Platform Users', 
            val: (stats.totalUsers || 0).toString(), 
            trend: `${stats.usersTrend >= 0 ? '+' : ''}${stats.usersTrend}%`, 
            isUp: stats.usersTrend >= 0, 
            icon: <Users size={20} />, 
            color: 'text-violet-600', 
            bg: 'bg-violet-50' 
        },
        { 
            label: 'Network Load', 
            val: `${stats.networkLoad || 0}%`, 
            trend: stats.networkLoad > 80 ? '+High' : 'Optimal', 
            isUp: stats.networkLoad < 80, 
            icon: <AlertCircle size={20} />, 
            color: 'text-red-600', 
            bg: 'bg-red-50' 
        },
    ];

    const RECENT_ORDERS = stats.recentBookings.map(b => ({
        id: b.bookingId || b._id.substring(0, 8),
        customer: b.consumer?.name || 'Guest User',
        service: b.service?.name || 'Service',
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1).replace(/[-_]/g, ' '),
        amount: b.price || '₹0',
        time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    if (loading) {
        return (
            <AdminLayout title="System Overview">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Overview">
            {/* Emergency Response Center (SOS Control) */}
            {stats.criticalIssues && stats.criticalIssues.length > 0 && (
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                            <h3 className="text-sm font-black text-red-600 uppercase tracking-[0.2em]">Active Emergency SOS Alerts</h3>
                        </div>
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">{stats.criticalIssues.length} Critical Event{stats.criticalIssues.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.criticalIssues.map((issue, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-red-200 group relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <AlertCircle size={20} className="text-white" />
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/admin/bookings?id=${issue._id}`)}
                                            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">SOS ALERT | {issue.bookingId || issue._id.slice(-6)}</p>
                                    <h4 className="text-lg font-black leading-tight mb-2 uppercase italic">{issue.consumer?.name}</h4>
                                    <p className="text-xs font-bold leading-relaxed line-clamp-2 opacity-90">{issue.issues?.find(i => i.type === 'SOS')?.description}</p>
                                    <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase opacity-60">Status</span>
                                            <span className="text-[10px] font-black uppercase">LIVE EMERGENCY</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/admin/bookings?id=${issue._id}`)}
                                            className="px-4 py-2 bg-white text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            Response Hub
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tactical Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft group hover:border-brand transition-all relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-brand group-hover:text-white ${stat.bg} ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg ${stat.isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {stat.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-1.5 px-0.5">{stat.label}</p>
                            <h3 className="text-3xl font-black text-content tracking-tighter leading-none">{stat.val}</h3>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-brand/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Operations Feed */}
                <div className="xl:col-span-2 bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100/10 flex items-center justify-between bg-background/50">
                        <div>
                            <h3 className="text-lg font-black text-content uppercase tracking-tight leading-none">Live Operations Feed</h3>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] mt-2">Real-time terminal synchronization</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/bookings')}
                            className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20 pb-0.5 hover:border-brand transition-all"
                        >
                            Open Operations Hub
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-background/80">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Order Node</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">User Entity</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Protocol</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/5">
                                {RECENT_ORDERS.map((order, i) => (
                                    <tr key={i} className="hover:bg-background/50 transition-all cursor-pointer group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-content tracking-tight">{order.id}</span>
                                            <p className="text-[8px] font-bold text-content-subtle mt-1">{order.time}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center font-black text-[10px] uppercase text-brand border border-gray-100/10 group-hover:bg-brand group-hover:text-white transition-all">
                                                    {order.customer[0]}
                                                </div>
                                                <span className="text-xs font-bold text-content">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-brand'} animate-pulse`} />
                                                <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-brand/10 text-brand'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-black text-content text-right">{order.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Network Performance & Nodes */}
                <div className="space-y-6">
                    <div className="bg-[#0B1222] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl group border border-white/5">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[8px] font-black text-brand uppercase tracking-[0.3em]">Network Load</p>
                                <div className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                                    <div className={`w-1 h-1 ${stats.networkLoad < 85 ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`} />
                                    <span className={`text-[7px] font-black ${stats.networkLoad < 85 ? 'text-green-500' : 'text-red-500'} uppercase tracking-widest`}>{stats.networkLoad < 85 ? 'Optimal' : 'High Load'}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <h4 className="text-4xl font-black tracking-tighter leading-none">{stats.networkLoad}<span className="text-brand">%</span></h4>
                                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Capacity</span>
                            </div>
                            <div className="space-y-3">
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.networkLoad}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-brand to-orange-500 shadow-[0_0_10px_rgba(244,117,33,0.3)]"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-[0.15em] text-white/20">
                                    <span>Captains: {stats.onlineCaptains || 0} Online</span>
                                    <span>Sync: Real-time</span>
                                </div>
                            </div>
                        </div>
                        <Zap size={100} className="absolute -bottom-6 -right-6 text-white/[0.02] rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>

                    <div className="bg-surface rounded-[2.5rem] p-8 border border-gray-100/10 shadow-soft relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-content uppercase tracking-tight leading-none px-1">Top Performing Nodes</h3>
                            <ChevronRight size={16} className="text-content-subtle hover:text-brand cursor-pointer transition-colors" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            {stats.topNodes.length > 0 ? stats.topNodes.map((hub, i) => (
                                <div key={i} className="flex items-center justify-between group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-background rounded-2xl flex items-center justify-center border border-gray-100/10 group-hover/item:border-brand transition-colors">
                                            <Car size={20} className="text-content-subtle group-hover/item:text-brand transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-content uppercase leading-none mb-1.5">{hub.name || 'Unknown Node'}</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">{hub._id?.substring(0, 8)}</p>
                                                <span className="text-[7px] font-black text-green-600">Active Node</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-content">{hub.count}</p>
                                        <p className="text-[8px] font-black text-brand uppercase mt-1 tracking-widest">₹{hub.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">No Performance Data Yet</p>
                                </div>
                            )}
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-brand/5 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
