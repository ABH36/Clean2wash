import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Phone, MessageSquare, Plus, Users, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';
import { vendorAPI } from '../../../utils/vendorApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const VendorHome = () => {
    const navigate = useNavigate();
    const { getUser } = useAuth();
    const user = getUser('vendor') || { studioName: 'Studio Partner', city: '' };

    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeJobs: 0,
        completedJobs: 0,
        rating: 0,
        recentActivity: []
    });
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const [res, leadRes] = await Promise.all([
                vendorAPI.getDashboard(),
                vendorAPI.getLeads()
            ]);

            if (res.status === 'success') {
                setStats(res.data);
            }
            if (leadRes.status === 'success') {
                setLeads(leadRes.data.leads || []);
            }
        } catch (err) {
            console.error("Failed to fetch vendor dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptLead = async (orderId) => {
        try {
            const res = await vendorAPI.acceptLead(orderId);
            if (res.status === 'success') {
                toast.success('Order claimed successfully! 💎');
                fetchDashboard();
            }
        } catch (err) {
            toast.error(err.message || 'Failed to claim order');
        }
    };

    useEffect(() => {
        fetchDashboard();

        // --- Real-time Operations ---
        if (user?.id) {
            // Listen for new bookings to refresh dashboard stats
            socketService.on('new_studio_booking', fetchDashboard);
            socketService.on('new_product_order', fetchDashboard);

            // Listen for status updates
            socketService.on('booking_status_updated', fetchDashboard);
            socketService.on('product_order_status_updated', fetchDashboard);
        }

        return () => {
            socketService.off('new_studio_booking');
            socketService.off('new_product_order');
            socketService.off('booking_status_updated');
            socketService.off('product_order_status_updated');
        };
    }, [user?.id]);

    const STATS = [
        { label: 'Active Jobs', val: stats.activeJobs?.toString().padStart(2, '0') || '00', trend: `Live`, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Revenue', val: `₹${(stats.totalRevenue || 0).toLocaleString()}`, trend: '100%', color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Active Subs', val: stats.activeSubscriptionsCount?.toString().padStart(2, '0') || '00', trend: 'Apartment', color: 'text-brand', bg: 'bg-brand/10' },
    ];

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        if (['pending', 'confirmed'].includes(s)) return 'bg-brand text-white';
        if (s === 'completed') return 'bg-green-500/10 text-green-500';
        if (['cancelled', 'payment-failed'].includes(s)) return 'bg-red-500/10 text-red-500';
        return 'bg-blue-500/10 text-blue-500';
    };

    const JOBS = (stats.recentActivity || []).map(b => ({
        id: b.bookingId || b._id.substring(b._id.length - 8),
        customer: b.consumer?.name || 'Guest User',
        car: b.vehicle?.brand ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Standard Vehicle',
        service: b.service?.name || 'Car Care',
        status: (b.status || 'pending').replace(/-/g, ' ').toUpperCase(),
        rawStatus: b.status,
        time: new Date(b.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        address: b.location?.address?.street || b.location?.address?.city || b.consumer?.profile?.address?.city || 'On-Site',
        type: b.location?.type || 'Pickup'
    }));

    const QUICK_ACTIONS = [
        { label: 'View Orders', icon: Plus, color: 'bg-brand', path: '/vendor/orders' },
        { label: 'Products', icon: Package, color: 'bg-blue-500', path: '/vendor/products' },
        { label: 'Inventory', icon: Package, color: 'bg-slate-700', path: '/vendor/inventory' },
        { label: 'Fleet Hub', icon: Users, color: 'bg-content', path: '/vendor/fleet' },
        { label: 'Settings', icon: MessageSquare, color: 'bg-gray-400', path: '/vendor/settings' },
    ];

    return (
        <VendorLayout
            title={user.studioName || "Studio Dashboard"}
            subtitle={`${user.city || 'Hub Active'} · Live Monitoring`}
        >
            <div className="space-y-8">
                {/* Market Opportunities - Lead Board */}
                {leads.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.3em]">Market Opportunities (Indore Hub)</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {leads.map((lead, i) => (
                                <motion.div
                                    key={lead._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="min-w-[300px] bg-gradient-to-br from-orange-50 to-white p-6 rounded-[2rem] border-white/5 border-orange-100 shadow-2xl shadow-black/50 shadow-orange-500/5 relative overflow-hidden group"
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                                <Award size={20} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Estimate</p>
                                                <p className="text-xl font-black text-orange-950 tracking-tighter">₹{lead.pricing?.totalAmount || '0'}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h4 className="text-base font-black text-orange-950 uppercase tracking-tight mb-1">{lead.consumer?.name || 'New Lead'}</h4>
                                            <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-tighter">
                                                {lead.vehicle?.brand} {lead.vehicle?.model} · {lead.location?.address?.city || 'Indore'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleAcceptLead(lead._id)}
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Accept Order & Assign Staff
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-x-12 -translate-y-12" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {STATS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-surface p-5 md:p-8 rounded-[2.5rem] border border-white/5/10 shadow-soft relative overflow-hidden group hover:border-brand/30 transition-all"
                        >
                            <div className="relative z-10">
                                <p className="text-[9px] md:text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2">{s.label}</p>
                                <div className="flex items-baseline gap-3">
                                    <h2 className={`text-2xl md:text-4xl font-black ${s.color} tracking-tighter leading-none`}>{s.val}</h2>
                                    <span className={`text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-lg ${s.bg} ${s.color} uppercase tracking-widest`}>
                                        {s.trend}
                                    </span>
                                </div>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-colors" />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Jobs */}
                    <div className="lg:col-span-2 space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 bg-surface rounded-[2.5rem] border border-white/5/10">
                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                        <h3 className="text-[10px] font-black text-content uppercase tracking-[0.3em]">Tactical Registry (Live)</h3>
                                    </div>
                                    <button
                                        onClick={() => navigate('/vendor/orders')}
                                        className="text-[9px] font-black text-brand uppercase tracking-widest hover:tracking-[0.2em] transition-all"
                                    >
                                        Full Log List
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {JOBS.map(job => (
                                        <motion.div
                                            key={job.id}
                                            layoutId={job.id}
                                            onClick={() => navigate(job.isProduct ? `/vendor/product-order/${job.id}` : `/vendor/order/${job.id}`)}
                                            className="bg-surface p-6 rounded-[2.5rem] border border-white/5/10 shadow-soft group hover:border-brand/40 transition-all cursor-pointer relative overflow-hidden active:scale-95"
                                        >
                                            <div className="relative z-10 space-y-5">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-background rounded-2xl flex items-center justify-center text-brand border border-white/5/5 shadow-inner">
                                                            <Package size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-0.5">#{job.id}</p>
                                                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tight opacity-50">{job.time}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em]  ${getStatusStyles(job.rawStatus)}`}>
                                                        {job.status}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-base font-black text-content tracking-tight uppercase leading-none mb-2">{job.customer}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-brand uppercase tracking-widest px-2 py-0.5 bg-brand/5 rounded-md">{job.type}</span>
                                                        <span className="text-[10px] font-bold text-content-subtle uppercase tracking-tight">· {job.car}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-4 border-t border-white/5/5">
                                                    <MapPin size={10} className="text-brand" />
                                                    <span className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter truncate">{job.address}</span>
                                                </div>
                                            </div>
                                            {/* Modern hover effect */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl translate-x-16 -translate-y-16 group-hover:bg-brand/10 transition-colors" />
                                        </motion.div>
                                    ))}
                                    {JOBS.length === 0 && (
                                        <div className="col-span-full text-center py-24 bg-surface rounded-[3rem] border border-dashed border-white/5/20 flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-background rounded-[1.5rem] flex items-center justify-center text-content-subtle/20 border border-white/5/10 shadow-inner">
                                                <Package size={32} />
                                            </div>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">No active operations in sector</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick Actions & Health */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.3em] px-2">Rapid Command</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {QUICK_ACTIONS.map(action => (
                                    <button
                                        key={action.label}
                                        onClick={() => navigate(action.path)}
                                        className="w-full bg-surface p-5 rounded-[1.8rem] border border-white/5/10 shadow-soft flex items-center justify-between group hover:border-brand/40 transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${action.color.split('-')[1]}/20`}>
                                                <action.icon size={18} />
                                            </div>
                                            <span className="text-[11px] font-black text-content uppercase tracking-[0.2em]">{action.label}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-content-subtle group-hover:text-brand group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Performance Mini-Card */}
                        <div className="bg-[#0B1222] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Global Rating</h3>
                                    <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center text-brand">
                                        <Award size={16} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <h4 className="text-5xl font-black tracking-tighter leading-none">{stats.rating.toFixed(1)}</h4>
                                    <span className="text-brand text-2xl">★</span>
                                </div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-8 leading-relaxed">
                                    Maintaining elite standards across <span className="text-white">{user.city || 'Active Territory'}</span>
                                </p>
                                <button
                                    onClick={() => navigate('/vendor/reports')}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:bg-brand group-hover:text-white group-hover:border-brand shadow-2xl shadow-black/50"
                                >
                                    Detailed Analytics <ChevronRight size={14} />
                                </button>
                            </div>
                            {/* Neon glow */}
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand/5 rounded-full blur-[80px]" />
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorHome;
