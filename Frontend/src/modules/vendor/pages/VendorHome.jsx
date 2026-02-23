import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Phone, MessageSquare, Plus, Users, ChevronRight } from 'lucide-react';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

const VendorHome = () => {
    const { getUser } = useAuth();
    const user = getUser('vendor') || { studioName: 'Hoora Studio', city: 'Bengaluru' };
    const [activeTab, setActiveTab] = useState('Today');

    const STATS = [
        { label: 'Active Jobs', val: '08', trend: '+2', color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Today Revenue', val: '₹12,420', trend: '15%', color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Pending Pickups', val: '03', trend: '-1', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    const JOBS = [
        { id: 'HOORA-V992', customer: 'Suresh Raina', car: 'BMW X5', service: 'Studio Deep Clean', status: 'In Service', time: '10:30 AM', address: 'Indiranagar', type: 'Pickup' },
        { id: 'HOORA-V881', customer: 'Anjali Gupta', car: 'Honda City', service: 'Full Wash + Wax', status: 'Washing', time: '11:15 AM', address: 'Koramangala', type: 'Drop' },
        { id: 'HOORA-V772', customer: 'Aman Verma', car: 'Hyundai Creta', service: 'Interior Detailing', status: 'Delivering', time: '01:45 PM', address: 'HSR Layout', type: 'Self' },
    ];

    const QUICK_ACTIONS = [
        { label: 'New Booking', icon: Plus, color: 'bg-brand' },
        { label: 'Add Driver', icon: Users, color: 'bg-content' },
        { label: 'Report Issue', icon: MessageSquare, color: 'bg-red-500' },
    ];

    return (
        <VendorLayout
            title={user.studioName || "Studio Dashboard"}
            subtitle={`${user.city || 'Bengaluru'} · Connected`}
        >
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STATS.map(s => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">{s.label}</p>
                                <div className="flex items-end gap-3">
                                    <h2 className={`text-4xl font-black ${s.color} tracking-tighter italic`}>{s.val}</h2>
                                    <span className={`mb-1 text-[10px] font-black px-2 py-0.5 rounded-md ${s.bg} ${s.color}`}>
                                        {s.trend}
                                    </span>
                                </div>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${s.bg} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700`} />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Jobs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em] italic">Live Tracking</h3>
                            <div className="flex gap-2">
                                {['Today', 'Week'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${activeTab === t ? 'bg-content text-white' : 'text-content-muted hover:bg-gray-100'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {JOBS.map((job, i) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => navigate(`/vendor/order/${job.id}`)}
                                    className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-brand/20 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-brand/5 group-hover:border-brand/10 transition-all text-brand font-black italic">
                                            {job.car.split(' ')[0][0]}{job.car.split(' ')[1][0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-content tracking-tight">{job.customer}</h4>
                                                <span className="text-[8px] font-black bg-brand/10 text-brand px-2 py-0.5 rounded uppercase tracking-tighter italic">{job.type}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{job.car} · {job.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="hidden sm:block">
                                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Service</p>
                                            <p className="text-[11px] font-black text-content">{job.service}</p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Location</p>
                                            <div className="flex items-center gap-1">
                                                <MapPin size={10} className="text-brand" />
                                                <p className="text-[11px] font-black text-content">{job.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${job.status === 'Washing' ? 'bg-blue-50 text-blue-600' :
                                                job.status === 'Delivering' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                {job.status}
                                            </span>
                                            <p className="text-[9px] font-bold text-content-subtle mt-1 italic">{job.time}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions & News */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em] italic px-2">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {QUICK_ACTIONS.map(action => (
                                    <button
                                        key={action.label}
                                        className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-soft flex items-center justify-between group hover:border-brand/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                                                <action.icon size={18} />
                                            </div>
                                            <span className="text-[11px] font-black text-content uppercase tracking-widest italic">{action.label}</span>
                                        </div>
                                        <Plus size={16} className="text-content-muted group-hover:rotate-90 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Studio Performance */}
                        <div className="bg-content rounded-[2rem] p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic mb-4">Studio Health</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-2xl font-black italic tracking-tighter">98.4<span className="text-brand">%</span></p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Consistency Score</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-[spin_3s_linear_infinite]" />
                                </div>
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                    View Performance Report
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorHome;
