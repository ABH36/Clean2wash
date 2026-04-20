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
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const CaptainHistory = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { captainJobs, loadCaptainJobs } = useCaptain();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        loadCaptainJobs();
    }, [loadCaptainJobs]);

    // Filter jobs based on tab and search
    const filteredJobs = captainJobs.filter(job => {
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Completed' && job.status === 'completed') ||
            (activeTab === 'Cancelled' && job.status === 'cancelled');

        const matchesSearch = !searchQuery ||
            job.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.userName?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <CaptainLayout>
            <div className="pb-28 transition-colors duration-500">
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-white/[0.02]'} px-4 pt-12 pb-6 sticky top-0 z-50 transition-colors duration-500 border-b ${isDarkMode ? 'border-white/5' : 'border-white/5'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white/5 border border-white/5 text-content'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={`text-xl font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Wash History</h1>
                    </div>

                    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-white/[0.05]'} flex gap-2 p-1 rounded-2xl overflow-x-auto scrollbar-hide transition-colors`}>
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
                    {filteredJobs.map((item, i) => (
                        <motion.div
                            key={item.id || item._id || `job-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 hover:border-brand/40 shadow-2xl shadow-black/20' : 'bg-white/5 border-white/5 hover:border-brand/30 shadow-soft'} border rounded-3xl p-5 group transition-all duration-500`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">{item.id}</p>
                                        {item.isUserVerified && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-full">
                                                <Shield size={8} className="text-amber-500" fill="currentColor" />
                                                <span className="text-[7px] font-black uppercase tracking-wider text-amber-600">Verified Elite</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={`font-black text-base uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.serviceName}</h3>
                                    <p className={`text-[10px] font-bold mt-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Customer: {item.userName}</p>
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
                                    <span className="text-[11px] font-bold">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                                    </span>
                                </div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    <MapPin size={14} className="shrink-0 text-brand" />
                                    <span className="text-[11px] font-bold truncate">{item.address}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>PPL Share</p>
                                    <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.price}</p>
                                </div>
                                <button onClick={() => navigate(`/captain/job?id=${item.id}`)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white/[0.02] text-content-subtle'} group-hover:bg-brand group-hover:text-white`}>
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

                    {filteredJobs.length === 0 && (
                        <div className="py-20 text-center">
                            <Clock size={48} className={`${isDarkMode ? 'text-white/10' : 'text-gray-200'} mx-auto mb-4`} />
                            <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} font-black uppercase text-xs tracking-widest`}>No history found</p>
                        </div>
                    )}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainHistory;
