import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Phone, MessageSquare, Plus, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorHome = () => {
    const navigate = useNavigate();
    const { bookings, getUser } = useAuth();
    const user = getUser('vendor') || { studioName: 'CarWash Studio', city: 'Bengaluru' };

    // Filter vendor bookings
    const incomingRequests = bookings.filter(b => b.type === 'vendor' && b.status === 'pending');
    const myActiveJobs = bookings.filter(b => b.vendorId === user.id && b.status !== 'completed');
    const myCompletedJobs = bookings.filter(b => b.vendorId === user.id && b.status === 'completed');

    const activeVendorJobs = myActiveJobs.filter(b => ['accepted', 'confirmed', 'at-studio', 'delivery-assigned'].includes(b.status));
    const todayRevenue = myCompletedJobs
        .reduce((acc, b) => acc + parseInt(b.price.replace(/[^0-9]/g, '') || 0), 0);

    const STATS = [
        { label: 'Active Jobs', val: activeVendorJobs.length.toString().padStart(2, '0'), trend: `+${activeVendorJobs.length}`, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Today Revenue', val: `₹${todayRevenue.toLocaleString()}`, trend: '100%', color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'New Requests', val: incomingRequests.length.toString().padStart(2, '0'), trend: 'Live', color: 'text-brand', bg: 'bg-brand/10' },
    ];

    const JOBS = [
        ...incomingRequests.map(b => ({ ...b, category: 'Request' })),
        ...myActiveJobs.map(b => ({ ...b, category: 'Active' }))
    ].map(b => ({
        id: b.id,
        customer: b.userName || 'Guest User',
        car: b.vehicle || 'Unknown Car',
        service: b.serviceName,
        status: b.category === 'Request' ? 'INCOMING' : b.status.toUpperCase(),
        time: new Date(b.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        address: b.address || 'HSR Layout',
        type: b.category === 'Request' ? 'Market' : 'Pickup'
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
            subtitle={`${user.city || 'Bengaluru'} · Active Session`}
        >
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STATS.map(s => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1">{s.label}</p>
                                <div className="flex items-end gap-3">
                                    <h2 className={`text-3xl font-black ${s.color} tracking-tight`}>{s.val}</h2>
                                    <span className={`mb-1 text-[9px] font-black px-2 py-0.5 rounded-md ${s.bg} ${s.color}`}>
                                        {s.trend}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Jobs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.15em]">Live Operations</h3>
                            <button onClick={() => navigate('/vendor/orders')} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">View All</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {JOBS.map(job => (
                                <motion.div
                                    key={job.id}
                                    layoutId={job.id}
                                    onClick={() => navigate(`/vendor/order/${job.id}`)}
                                    className="bg-surface p-5 rounded-3xl border border-gray-100/10 shadow-sm group hover:border-brand/20 transition-all cursor-pointer relative"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-background rounded-xl flex items-center justify-center text-brand">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-0.5">{job.id}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tight">{job.time}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${job.status === 'INCOMING' ? 'bg-brand text-white' :
                                                job.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {job.status}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-black text-content tracking-tight">{job.customer}</h4>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tight">{job.car} · {job.service}</p>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100/5">
                                            <MapPin size={10} className="text-content-subtle" />
                                            <span className="text-[10px] font-bold text-content-subtle italic">{job.address}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.15em] px-1">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {QUICK_ACTIONS.map(action => (
                                    <button
                                        key={action.label}
                                        onClick={() => navigate(action.path)}
                                        className="w-full bg-surface p-4 rounded-2xl border border-gray-100/10 shadow-sm flex items-center justify-between group hover:border-brand/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-9 h-9 ${action.color} rounded-xl flex items-center justify-center text-white`}>
                                                <action.icon size={16} />
                                            </div>
                                            <span className="text-[11px] font-black text-content uppercase tracking-widest">{action.label}</span>
                                        </div>
                                        <Plus size={14} className="text-content-subtle group-hover:rotate-90 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Performance Mini-Card */}
                        <div className="bg-content rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-content/10">
                            <div className="relative z-10">
                                <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Studio Health</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-2xl font-black tracking-tight">98.4<span className="text-brand">%</span></p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Consistency Score</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                    Performance Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorHome;
