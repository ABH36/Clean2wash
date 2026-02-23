import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    MapPin,
    ArrowLeft
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const CaptainHistory = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');

    const HISTORY_DATA = [
        { id: 'WSH-9921', service: 'Full Deep Clean', date: 'Today, 10:30 AM', status: 'Completed', amount: '₹1,299', location: 'Section 15, Faridabad' },
        { id: 'WSH-9902', service: 'Eco Wash', date: 'Yesterday, 04:15 PM', status: 'Completed', amount: '₹499', location: 'Cyber Hub, Gurugram' },
        { id: 'WSH-9884', service: 'Ceramic Coating', date: '21 Feb 2026', status: 'Completed', amount: '₹4,999', location: 'HSR Layout, Bengaluru' },
        { id: 'WSH-9871', service: 'Eco Wash', date: '20 Feb 2026', status: 'Cancelled', amount: '₹0', location: 'Indirapuram, Noida', reason: 'User not available' },
        { id: 'WSH-9865', service: 'Interior Detailing', date: '19 Feb 2026', status: 'Completed', amount: '₹899', location: 'Vasant Kunj, Delhi' },
    ];

    const filteredData = activeTab === 'All'
        ? HISTORY_DATA
        : HISTORY_DATA.filter(item => item.status === activeTab);

    return (
        <CaptainLayout>
            <div className="pb-28">
                {/* Header */}
                <div className="bg-content px-4 pt-12 pb-6 sticky top-0 z-50">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-white italic tracking-tight uppercase">Wash History</h1>
                    </div>

                    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
                        {['All', 'Completed', 'Cancelled'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand text-white' : 'text-white/40'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* History List */}
                <div className="px-4 mt-6 space-y-4">
                    {filteredData.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-content border border-white/5 rounded-3xl p-5 group hover:border-brand/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest italic mb-1">{item.id}</p>
                                    <h3 className="text-white font-black text-base italic uppercase tracking-tight">{item.service}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${item.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {item.status === 'Completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    <span className="text-[8px] font-black uppercase tracking-widest">{item.status}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3 text-white/40">
                                    <Calendar size={14} className="shrink-0" />
                                    <span className="text-[11px] font-bold">{item.date}</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/40">
                                    <MapPin size={14} className="shrink-0 text-brand" />
                                    <span className="text-[11px] font-bold truncate">{item.location}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Payout</p>
                                    <p className="text-xl font-black text-white italic">{item.amount}</p>
                                </div>
                                <button className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:bg-brand group-hover:text-white transition-all">
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {item.reason && (
                                <div className="mt-4 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <p className="text-[9px] font-bold text-red-400">Note: {item.reason}</p>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {filteredData.length === 0 && (
                        <div className="py-20 text-center">
                            <Clock size={48} className="text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 font-black uppercase text-xs tracking-widest italic">No history found</p>
                        </div>
                    )}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHistory;
