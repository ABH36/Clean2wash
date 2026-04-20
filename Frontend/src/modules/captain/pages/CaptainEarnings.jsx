import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Wallet, TrendingUp, Download,
    ArrowUpRight, ArrowDownLeft, Filter, Loader2,
    Clock, CheckCircle2, Star, Zap
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { useTheme } from '../../../context/ThemeContext';

const TABS = ['Today', 'Week', 'Month'];

const CaptainEarnings = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { captainJobs, captainEarnings, captainEarningsLoading, withdrawEarnings } = useCaptain();
    const [tab, setTab] = useState('Week');
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');

    const { sessions } = useAuth();
    const user = sessions.captain || {};
    const balance = captainEarnings.balance || 0;

    const handleWithdrawRequest = async () => {
        const amount = Number(payoutAmount);
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (amount > balance) {
            toast.error("Insufficient balance");
            return;
        }

        try {
            setPayoutModalOpen(false);
            const result = await withdrawEarnings(amount);
            if (result.success) {
                toast.success('Transfer request submitted!');
                setPayoutAmount('');
            } else {
                toast.error(result.error || 'Transfer failed');
            }
        } catch (error) {
            toast.error('System error occurred');
        }
    };

    const myJobs = captainJobs.filter(job => job.status === 'completed');

    // Use backend earnings data if available
    const today = captainEarnings.today || { earned: 0, jobs: 0 };
    const week = captainEarnings.week || { earned: 0, jobs: 0 };
    const month = captainEarnings.month || { earned: 0, jobs: 0 };

    const stats = {
        Today: { earned: today.earned || 0, jobs: today.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((today.jobs || 0) * 0.8).toFixed(1) },
        Week: { earned: week.earned || 0, jobs: week.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((week.jobs || 0) * 0.8).toFixed(1) },
        Month: { earned: month.earned || 0, jobs: month.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((month.jobs || 0) * 0.8).toFixed(1) },
    };

    const activeD = stats[tab];

    return (
        <CaptainLayout>
            <div className={`min-h-[100dvh] pb-32 transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white/[0.02]'}`}>
                {/* ── Header ── */}
                <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-white/5'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 relative overflow-hidden`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white/[0.02] border-white/5 text-content hover:bg-white/[0.05]'}`}>
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className={`text-xl font-black tracking-tight leading-none uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Earnings</h1>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-brand' : 'text-brand'}`}>Revenue Center</p>
                            </div>
                        </div>
                        <button className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-brand' : 'bg-white/[0.02] border-white/5 text-brand'}`}>
                            <Download size={18} />
                        </button>
                    </div>
                </header>

                <div className="px-4 py-6 space-y-6">
                    {/* ── Hero Balance Card ── */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 shadow-2xl shadow-black/50 shadow-gray-200/50'} border rounded-[2.5rem] p-8 transition-all overflow-hidden relative`}>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Current Balance</p>
                                <div className="bg-brand/10 text-brand px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">Live</div>
                            </div>
                            <h2 className={`text-5xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'} mb-8`}>
                                ₹{balance.toLocaleString()}.<span className="text-brand">00</span>
                            </h2>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPayoutModalOpen(true)}
                                    disabled={captainEarningsLoading || balance <= 0}
                                    className={`flex-1 h-14 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/50 shadow-brand/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2`}
                                >
                                    {captainEarningsLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                    Transfer to Bank
                                </button>
                                <button className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white/[0.02] border-white/5 text-gray-300 hover:text-brand'}`}>
                                    <Filter size={18} />
                                </button>
                            </div>
                        </div>
                        {/* Background accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 blur-[40px] -ml-12 -mb-12 rounded-full" />
                    </div>

                    {/* ── Tab Switcher ── */}
                    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-white/[0.05]'} p-1.5 rounded-2xl flex gap-1`}>
                        {TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${tab === t
                                    ? (isDarkMode ? 'bg-[#1E293B] text-brand shadow-lg' : 'bg-white/5 text-brand ')
                                    : (isDarkMode ? 'text-white/30' : 'text-content-subtle hover:text-content')}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* ── Quick Stats Grid ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="Period Earned"
                            val={`₹${activeD.earned}`}
                            sub={`+12% vs last ${tab}`}
                            icon={<TrendingUp size={14} />}
                            color="text-green-500"
                            isDarkMode={isDarkMode}
                        />
                        <StatCard
                            label="Deliveries"
                            val={activeD.jobs}
                            sub="Completed Orders"
                            icon={<CheckCircle2 size={14} />}
                            color="text-brand"
                            isDarkMode={isDarkMode}
                        />
                        <StatCard
                            label="Avg Rating"
                            val={activeD.rating}
                            sub="Partner Feedback"
                            icon={<Star size={14} />}
                            color="text-amber-500"
                            isDarkMode={isDarkMode}
                        />
                        <StatCard
                            label="Duty Hours"
                            val={activeD.hours}
                            sub="On-Road Time"
                            icon={<Clock size={14} />}
                            color="text-indigo-500"
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {/* ── Recent Activity ── */}
                    <section>
                        <div className="flex items-center justify-between px-1 mb-6">
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Transaction Registry</h3>
                                <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'} opacity-60`}>Financial Audit Log</p>
                            </div>
                            <button className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">Full Ledger</button>
                        </div>

                        <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 shadow-soft'} border rounded-[2.5rem] overflow-hidden`}>
                            {myJobs.length > 0 ? (
                                <div className="divide-y divide-gray-100/5">
                                    {myJobs.slice(0, 5).map((tx, i) => (
                                        <div key={tx.id} className={`flex items-center justify-between p-6 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/[0.02]'} transition-all`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                    <ArrowDownLeft size={18} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black tracking-tight uppercase leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>{tx.serviceName}</p>
                                                    <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest`}>{tx.userName} · Completed</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>+{tx.price}</p>
                                                <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[8px] font-bold mt-1`}>08:45 PM</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 ${isDarkMode ? 'bg-white/5 text-white/5' : 'bg-white/[0.02] text-gray-200'}`}>
                                        <Wallet size={32} />
                                    </div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>No Settlement History</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* ── Withdrawal Modal ── */}
                <AnimatePresence>
                    {payoutModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setPayoutModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className={`${isDarkMode ? 'bg-[#1E293B] border-white/10 shadow-2xl shadow-black/80' : 'bg-white/5 border-white/5 shadow-2xl shadow-gray-200/50'} w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border transition-all`}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black tracking-tighter leading-none uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Request Payout</h3>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Funds sent to bank</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className={`text-[9px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Settlement Amount (₹)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="e.g. 2000"
                                                className={`w-full px-6 py-4 rounded-2xl text-xs font-black outline-none transition-all  ${isDarkMode
                                                    ? 'bg-black/20 border-white/5 text-white focus:border-brand focus:bg-black/40'
                                                    : 'bg-white/[0.02] border-white/5 text-content focus:border-brand focus:bg-white/5'}`}
                                                value={payoutAmount}
                                                onChange={e => setPayoutAmount(e.target.value)}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand">MAX</div>
                                        </div>
                                        <div className="flex justify-between items-center px-2 mt-2">
                                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Available Balance</span>
                                            <span className={`text-[9px] font-black ${isDarkMode ? 'text-white/60' : 'text-content'}`}>₹{balance.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Payout Target Confirmation */}
                                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5'}`}>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Settlement Destination</p>
                                        {user.bankDetails?.upiId || user.bankDetails?.accountNumber ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                                                        <Zap size={12} fill="currentColor" />
                                                    </div>
                                                    <span className={`text-[10px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                        {user.bankDetails?.upiId || `A/C: XXXX${user.bankDetails?.accountNumber?.slice(-4)}`}
                                                    </span>
                                                </div>
                                                <button onClick={() => navigate('/captain/profile/edit')} className="text-[8px] font-black text-brand uppercase tracking-widest underline">Change</button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest leading-tight">⚠️ No payout method found! Please add your UPI ID to receive funds.</p>
                                                <button onClick={() => navigate('/captain/profile/edit')} className="w-fit h-7 px-3 bg-brand text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">Add UPI Now</button>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleWithdrawRequest}
                                        disabled={!user.bankDetails?.upiId && !user.bankDetails?.accountNumber}
                                        className="w-full bg-brand text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/50 shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        Initiate Transfer
                                    </button>
                                    <button
                                        onClick={() => setPayoutModalOpen(false)}
                                        className={`w-full text-[9px] font-black uppercase tracking-[0.2em] py-2 ${isDarkMode ? 'text-white/20' : 'text-content-subtle underline'}`}
                                    >
                                        Cancel Transaction
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </CaptainLayout>
    );
};

const StatCard = ({ label, val, sub, icon, color, isDarkMode }) => (
    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 shadow-2xl shadow-black/50 shadow-gray-200/50'} border p-5 rounded-[2rem] transition-all`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-4 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]'} ${color}`}>
            {icon}
        </div>
        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{label}</p>
        <span className={`text-xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{val}</span>
        <p className={`text-[8px] font-bold mt-1.5 opacity-40 ${isDarkMode ? 'text-white' : 'text-content-subtle'}`}>{sub}</p>
    </div>
);

export default CaptainEarnings;
