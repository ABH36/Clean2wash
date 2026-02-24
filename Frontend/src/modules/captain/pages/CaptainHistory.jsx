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
import { useTheme } from '../../../context/ThemeContext';

const CaptainHistory = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { bookings, getUser } = useAuth();
    // ... logic (same as before)

    return (
        <CaptainLayout>
            <div className="pb-28 transition-colors duration-500">
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} px-4 pt-12 pb-6 sticky top-0 z-50 transition-colors duration-500 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white border border-gray-100 text-content'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={`text-xl font-black italic tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Wash History</h1>
                    </div>

                    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} flex gap-2 p-1 rounded-2xl overflow-x-auto scrollbar-hide transition-colors`}>
                        {['All', 'Completed', 'Cancelled'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-brand text-white shadow-lg'
                                    : isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-content-subtle hover:text-content'
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
                            className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 hover:border-brand/40 shadow-2xl shadow-black/20' : 'bg-white border-gray-100 hover:border-brand/30 shadow-soft'} border rounded-3xl p-5 group transition-all duration-500`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest italic mb-1">{item.id}</p>
                                    <h3 className={`font-black text-base italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.serviceName}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${item.status === 'completed'
                                    ? (isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')
                                    : (isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                                    }`}>
                                    {item.status === 'completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    <span className="text-[8px] font-black uppercase tracking-widest">{item.status}</span>
                                </div>
                            </div>

                            <div className={`space-y-3 pb-4 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    <Calendar size={14} className="shrink-0" />
                                    <span className="text-[11px] font-bold">{item.timestamp || 'Recent'}</span>
                                </div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    <MapPin size={14} className="shrink-0 text-brand" />
                                    <span className="text-[11px] font-bold truncate">{item.address}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>PPL Share</p>
                                    <p className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.price}</p>
                                </div>
                                <button onClick={() => navigate(`/captain/job?id=${item.id}`)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-content-subtle'} group-hover:bg-brand group-hover:text-white`}>
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {item.status === 'cancelled' && (
                                <div className={`mt-4 p-3 rounded-xl border ${isDarkMode ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100'}`}>
                                    <p className={`text-[9px] font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Note: User cancelled request</p>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {filteredData.length === 0 && (
                        <div className="py-20 text-center">
                            <Clock size={48} className={`${isDarkMode ? 'text-white/10' : 'text-gray-200'} mx-auto mb-4`} />
                            <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} font-black uppercase text-xs tracking-widest italic`}>No history found</p>
                        </div>
                    )}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHistory;
