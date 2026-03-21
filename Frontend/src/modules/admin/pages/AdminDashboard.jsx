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
    CheckCircle2,
    ExternalLink,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const playSOSAlarm = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
        oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1.2);
    } catch (e) {
        console.warn('Audio contextual initialization failed');
    }
};

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

    useEffect(() => {
        fetchDashboard();

        // Socket Integration
        socketService.joinAdminRoom();

        const handleSystemUpdate = (data) => {
            console.log('[Admin Dashboard] 📡 System update received:', data.type);
            fetchDashboard();

            if (data.type === 'new_booking') {
                toast.success('New Order Received!', {
                    icon: '🛒',
                    duration: 5000,
                    style: { background: '#0F172A', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
                });
            }
        };

        const handleSOSAlert = (data) => {
            console.log('[Admin Dashboard] 🚨 CRITICAL SOS RECEIVED:', data);
            fetchDashboard();
            playSOSAlarm();
            setTimeout(playSOSAlarm, 1500);

            toast.error('EMERGENCY: Specialist SOS Alert!', {
                icon: '🆘',
                duration: 10000,
                style: { background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: '900', border: '2px solid white' }
            });
        };

        const handleStuckAlert = (data) => {
            console.log('[Admin Dashboard] ⚠️ STUCK BOOKING ALERT:', data);
            fetchDashboard();
            toast('Logistical Bottleneck Detected', {
                icon: '⚠️',
                duration: 6000,
                style: { background: '#F59E0B', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
            });
        };

        socketService.on('new_booking', handleSystemUpdate);
        socketService.on('global_status_update', handleSystemUpdate);
        socketService.on('sos_alert', handleSOSAlert);
        socketService.on('stuck_booking_alert', handleStuckAlert);

        return () => {
            socketService.off('new_booking', handleSystemUpdate);
            socketService.off('global_status_update', handleSystemUpdate);
            socketService.off('sos_alert', handleSOSAlert);
            socketService.off('stuck_booking_alert', handleStuckAlert);
        };
    }, []);

    const STATS = [
        {
            label: 'Unified Revenue',
            val: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
            trend: `Service: ₹${(stats.serviceRevenue || 0).toLocaleString()}`,
            isUp: true,
            icon: <Wallet size={20} />,
            color: 'text-brand',
            bg: 'bg-brand/10'
        },
        {
            label: 'Active Ops (S+P)',
            val: (stats.totalActiveOps || 0).toString(),
            trend: `${stats.activeJobs} Jobs | ${stats.activeProductOrders} Orders`,
            isUp: true,
            icon: <Zap size={20} />,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Platform Users',
            val: (stats.totalUsers || 0).toString(),
            trend: 'Live Engagement',
            isUp: true,
            icon: <Users size={20} />,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            label: 'Supply Health',
            val: (stats.lowStockCount || 0).toString(),
            trend: stats.lowStockCount > 0 ? 'Action Required' : 'Optimal Stock',
            isUp: stats.lowStockCount === 0,
            icon: <AlertCircle size={20} />,
            color: stats.lowStockCount > 0 ? 'text-red-600' : 'text-green-600',
            bg: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50'
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
            <AdminLayout title="Operational IQ">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Operational IQ">
            {/* ── EMERGENCY OPS SECTION (SOS + STUCK) ── */}
            <div className="mb-8 space-y-6">
                {/* 1. SOS Alerts */}
                {stats.criticalIssues && stats.criticalIssues.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                            <h3 className="text-sm font-black text-red-600 uppercase tracking-[0.2em]">Active SOS Alerts</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.criticalIssues.map((issue, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-red-200 group relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">SOS | {issue.bookingId || issue._id.slice(-6)}</p>
                                        <h4 className="text-lg font-black leading-tight mb-2 uppercase italic">{issue.consumer?.name}</h4>
                                        <p className="text-xs font-bold opacity-90 line-clamp-1">{issue.issues?.find(i => i.type === 'SOS')?.description}</p>
                                        <button
                                            onClick={() => navigate(`/admin/bookings?id=${issue._id}`)}
                                            className="mt-4 w-full py-2 bg-white text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            Response Hub
                                        </button>
                                    </div>
                                    <AlertCircle size={80} className="absolute -right-4 -bottom-4 text-white/10" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Stuck Bookings Monitor */}
                {stats.stuckBookings && stats.stuckBookings.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <h3 className="text-sm font-black text-amber-600 uppercase tracking-[0.2em]">Logistical Bottlenecks (Stalled)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.stuckBookings.map((stuck, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-xl shadow-amber-500/5 group relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                                                STUCK in {stuck.status}
                                            </span>
                                            <History size={14} className="text-amber-300" />
                                        </div>
                                        <h4 className="text-base font-black text-content uppercase tracking-tight mb-1">{stuck.consumer?.name}</h4>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none">
                                            Last Activity: {new Date(stuck.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/admin/bookings?id=${stuck._id}`)}
                                            className="mt-4 w-full py-2.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 hover:scale-105 transition-all"
                                        >
                                            Investigate Dispatch
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
                                <div className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-lg ${stat.isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-1.5 px-0.5">{stat.label}</p>
                            <h3 className="text-3xl font-black text-content tracking-tighter leading-none">{stat.val}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Growth Loop Analytics (Phase 4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Total Referrals</p>
                        <h4 className="text-4xl font-black tracking-tight mb-6">{stats.growthLoop?.totalReferredUsers || 0}</h4>
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-indigo-200" />
                            <span className="text-[10px] font-bold opacity-90 uppercase tracking-widest">Invited Users</span>
                        </div>
                    </div>
                    <Users size={120} className="absolute -right-8 -bottom-8 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-soft relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Conversion Rate</p>
                        <h4 className="text-4xl font-black text-content tracking-tight mb-6">{stats.growthLoop?.referralConversionRate || 0}%</h4>
                        <div className="h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.growthLoop?.referralConversionRate || 0}%` }}
                                className="h-full bg-indigo-500"
                            />
                        </div>
                        <p className="text-[9px] font-bold text-content-subtle mt-4 uppercase tracking-widest">Successful Wash Match</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-green-50 shadow-soft relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em] mb-2">Rewards Distributed</p>
                        <h4 className="text-4xl font-black text-content tracking-tight mb-6">₹{(stats.growthLoop?.totalReferralRewards || 0).toLocaleString()}</h4>
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Growth Capital Spent</span>
                        </div>
                    </div>
                    <Wallet size={80} className="absolute -right-4 -bottom-4 text-green-50 group-hover:rotate-12 transition-transform duration-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Operations Feed */}
                <div className="xl:col-span-2 bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100/10 flex items-center justify-between bg-background/50">
                        <div>
                            <h3 className="text-lg font-black text-content uppercase tracking-tight leading-none">Live Service Stream</h3>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] mt-2">Aggregated Ecosystem Logs</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/bookings')}
                            className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20 pb-0.5 hover:border-brand transition-all"
                        >
                            Operations Hub
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-background/80">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Node ID</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Entity</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Value</th>
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
                                            <span className="text-xs font-bold text-content">{order.customer}</span>
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

                {/* Network Performance */}
                <div className="space-y-6">
                    <div className="bg-[#0B1222] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl group border border-white/5">
                        <div className="relative z-10">
                            <p className="text-[8px] font-black text-brand uppercase tracking-[0.3em] mb-4">Service Capacity</p>
                            <div className="flex items-baseline gap-2 mb-4">
                                <h4 className="text-4xl font-black tracking-tighter leading-none">{stats.networkLoad}<span className="text-brand">%</span></h4>
                                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Platform Load</span>
                            </div>
                            <div className="space-y-3">
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.networkLoad}%` }}
                                        transition={{ duration: 1.5 }}
                                        className="h-full bg-gradient-to-r from-brand to-orange-500 shadow-[0_0_10px_rgba(244,117,33,0.3)]"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-[0.15em] text-white/20">
                                    <span>Specialists Online: {stats.onlineCaptains || 0}</span>
                                    <span>Ops Hub: Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ecosystem Mix */}
                    <div className="bg-surface rounded-[2.5rem] p-8 border border-gray-100/10 shadow-soft relative overflow-hidden group">
                        <h3 className="text-sm font-black text-content uppercase tracking-tight leading-none mb-6 px-1">Service Ecosystem Mix</h3>
                        <div className="space-y-4">
                            {stats.serviceMix?.map((mix, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                                        <span className="text-[10px] font-black text-content uppercase tracking-widest">{mix._id || 'Standard'}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-content-subtle">{mix.count} Orders</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-content uppercase">Total Ops</span>
                            <span className="text-[10px] font-black text-brand">{stats.totalActiveOps} Orders</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
