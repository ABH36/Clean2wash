import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
            <>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            {/* ── EMERGENCY OPS SECTION (SOS + STUCK) ── */}
            <div className="mb-10 space-y-8">
                {/* 1. SOS Alerts */}
                {stats.criticalIssues && stats.criticalIssues.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Critical Incident Report (SOS)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.criticalIssues.map((issue, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-8 rounded-[2rem] border-2 border-red-500/20 shadow-premium-color group relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[9px] font-black text-white bg-red-600 px-3 py-1 rounded-full uppercase tracking-widest">Active SOS</span>
                                            <ShieldAlert size={18} className="text-red-500" />
                                        </div>
                                        <h4 className="text-xl font-black text-content uppercase tracking-tight mb-2 leading-none">{issue.consumer?.name}</h4>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-6">
                                            {issue.issues?.find(i => i.type === 'SOS')?.description || 'Emergency assistance requested'}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/admin/bookings?id=${issue._id}`)}
                                            className="w-full py-3.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-200 hover:bg-content transition-all"
                                        >
                                            Intercept Incident
                                        </button>
                                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-7 rounded-[2.25rem] border border-gray-100 shadow-soft group hover:border-brand/40 transition-all relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110 ${stat.bg} ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${stat.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {stat.trend.split('|')[0]}
                                </div>
                            </div>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] mb-2 px-0.5">{stat.label}</p>
                            <h3 className="text-4xl font-black text-content tracking-tighter leading-none tabular-nums [font-feature-settings:'tnum']">{stat.val}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Growth Loop Analytics (Phase 4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-content-subtle mb-3">Total Referrals</p>
                        <h4 className="text-4xl font-black tracking-tight text-content mb-6">{stats.growthLoop?.totalReferredUsers || 0}</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                <Users size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Global Invited Network</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-3">Conversion Matrix</p>
                        <h4 className="text-4xl font-black text-content tracking-tight mb-6">{stats.growthLoop?.referralConversionRate || 0}%</h4>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.growthLoop?.referralConversionRate || 0}%` }}
                                className="h-full bg-brand"
                            />
                        </div>
                        <p className="text-[9px] font-bold text-content-subtle mt-4 uppercase tracking-widest px-0.5">Verified Wash Match</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-3">Rewards Distributed</p>
                        <h4 className="text-4xl font-black text-content tracking-tight mb-6 tabular-nums">₹{(stats.growthLoop?.totalReferralRewards || 0).toLocaleString()}</h4>
                        <div className="flex items-center gap-3 text-brand">
                            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                                <Wallet size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Growth Capital Yield</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Operations Feed */}
                <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                        <div>
                            <h3 className="text-lg font-black text-content uppercase tracking-tight leading-none">Intelligence Feed</h3>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Global Operations Logbook</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/bookings')}
                            className="h-10 px-5 bg-gray-50 text-content rounded-xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-content hover:text-white transition-all"
                        >
                            Full Registry
                        </button>
                    </div>
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Descriptor</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Protocol Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Value (INR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {RECENT_ORDERS.map((order, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition-all cursor-pointer group">
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                                    <Car size={16} className="text-content-subtle group-hover:text-brand transition-colors" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-content tracking-tight block">{order.customer}</span>
                                                    <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1.5">{order.service} | {order.time}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-brand/10 text-brand'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 text-xs font-black text-content text-right tabular-nums">{order.amount}</td>
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
            </div >
        </>
    );
};

export default AdminDashboard;
