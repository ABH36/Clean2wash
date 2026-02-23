import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    MapPin,
    Navigation,
    Users,
    Car,
    ChevronRight,
    Plus,
    Search,
    TrendingUp,
    MoreVertical,
    Activity,
    Shield
} from 'lucide-react';

const AdminHubs = () => {
    const [view, setView] = useState('All');

    const HUBS = [
        { id: 'HUB-001', name: 'Sector 15 Studio', city: 'Faridabad', captains: 24, status: 'Online', efficiency: '98%', manager: 'Rahul K.', load: 'High' },
        { id: 'HUB-002', name: 'Cyber Hub Node', city: 'Gurugram', captains: 42, status: 'Online', efficiency: '95%', manager: 'Sneha G.', load: 'Peak' },
        { id: 'HUB-003', name: 'Indirapuram Hub', city: 'Noida', captains: 18, status: 'Offline', efficiency: '88%', manager: 'Amit S.', load: 'Low' },
        { id: 'HUB-004', name: 'HSR Layout Node', city: 'Bengaluru', captains: 35, status: 'Online', efficiency: '92%', manager: 'Vikram D.', load: 'Moderate' },
    ];

    return (
        <AdminLayout title="Hub & Infrastructure">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center lg:text-left">
                        <h3 className="text-lg font-black text-content italic uppercase tracking-tight leading-none">Global Network</h3>
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Manage physical studios and nodes</p>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft">
                            <Search size={16} className="text-content-subtle" />
                            <input type="text" placeholder="Search hubs..." className="bg-transparent outline-none text-xs font-bold text-content w-full" />
                        </div>
                        <button className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0">
                            <Plus size={16} /> New Hub
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                    {['All', 'Online', 'Offline'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setView(tab)}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Hub Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {HUBS.filter(h => view === 'All' || h.status === view).map((hub, i) => (
                        <motion.div
                            key={hub.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand transition-all"
                        >
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-brand border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                                        <MapPin size={28} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg mb-1 ${hub.status === 'Online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {hub.status}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm border ${hub.load === 'Peak' ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-content-muted border-gray-100'
                                            }`}>
                                            {hub.load} Load
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xl font-black text-content italic uppercase tracking-tight truncate">{hub.name}</h4>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 italic">{hub.city} • {hub.id}</p>
                                </div>
                            </div>

                            <div className="px-8 py-6 grid grid-cols-3 gap-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Captains</p>
                                    <h5 className="text-sm font-black text-content italic">{hub.captains}</h5>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Efficiency</p>
                                    <h5 className="text-sm font-black text-brand italic">{hub.efficiency}</h5>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Manager</p>
                                    <h5 className="text-[10px] font-black text-content uppercase truncate">{hub.manager}</h5>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                <button className="w-full h-12 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 group-hover:bg-content group-hover:text-white transition-all overflow-hidden relative">
                                    <span className="text-[10px] font-black uppercase tracking-widest z-10 transition-transform group-hover:translate-x-2">Configure Station</span>
                                    <Navigation size={14} className="group-hover:translate-x-32 transition-transform duration-500 opacity-20" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminHubs;
