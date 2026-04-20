import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, ChevronRight, Package, Truck,
    Wallet, TrendingUp, Filter, Search, Award, CheckCircle2,
    Clock, RefreshCcw
} from 'lucide-react';
import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { staffAPI } from '../../../utils/staffApi';
import { toast } from 'react-hot-toast';

const StaffHistory = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { getUser } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-DEFAULT' };

    const [ledger, setLedger] = useState([]);
    const [stats, setStats] = useState({ totalEarnings: 0, weeklyEarnings: 0, tasksCompleted: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getEarnings();
            if (res.status === 'success') {
                setLedger(res.data.ledger);
                setStats(res.data.stats);
            }
        } catch (err) {
            toast.error('Ledger Sync Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <StaffLayout
            title="Ledger"
            subtitle={`Session_${String(user.id || user._id).slice(-4).toUpperCase()}`}
        >
            <div className="space-y-8 pb-32">
                {/* 💰 Premium Earnings Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-[2.5rem] border relative overflow-hidden group ${isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/20'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet size={48} className="text-brand" />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-3 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Total Payout</p>
                        <h2 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
                            ₹{stats.totalEarnings?.toLocaleString()}
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`p-6 rounded-[2.5rem] border relative overflow-hidden group ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/5 shadow-soft'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={48} className={isDarkMode ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-3 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Tasks</p>
                        <h2 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>
                            {stats.tasksCompleted}
                        </h2>
                    </motion.div>
                </div>

                {/* 📅 Filter & History List */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Financial Logs</h3>
                            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                        </div>
                        <button onClick={fetchEarnings} className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white/5 text-white/40 active:bg-white/10' : 'bg-white/[0.05] text-gray-400 active:bg-gray-200'}`}>
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {ledger.length > 0 ? (
                                ledger.map((entry, idx) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => navigate(`/staff/task/${entry.id}`)}
                                        className={`p-5 rounded-[2.5rem] border flex items-center justify-between group cursor-pointer transition-all duration-500 overflow-hidden relative ${isDarkMode ? 'bg-[#1E293B] border-white/5 hover:border-brand/30' : 'bg-white/5 shadow-soft border-white/5 hover:border-brand/20'}`}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-brand group-hover:text-white ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-white/[0.02] text-gray-400'}`}>
                                                <Award size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{entry.orderId}</h4>
                                                    <div className="px-2 py-0.5 bg-green-500 rounded-full">
                                                        <span className="text-[7px] font-black text-white uppercase tracking-widest">Settled</span>
                                                    </div>
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                                                    {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {entry.service}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className={`text-lg font-black tracking-tighter mb-0.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>+₹{entry.amount}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Fee Shared</p>
                                        </div>
                                        {/* Luxury Pattern */}
                                        <div className="absolute top-0 right-0 w-32 h-full opacity-[0.03] pointer-events-none skew-x-12 translate-x-16 bg-gradient-to-r from-transparent via-brand to-transparent" />
                                    </motion.div>
                                ))
                            ) : (
                                !loading && (
                                    <div className="py-20 text-center opacity-30">
                                        <TrendingUp size={48} className="mx-auto mb-4 stroke-1" />
                                        <p className="text-sm font-black uppercase tracking-widest">Protocol Idle: No active earnings</p>
                                    </div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffHistory;
