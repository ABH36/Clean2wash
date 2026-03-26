import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorAPI } from '../../../utils/vendorApi';
import { toast } from 'react-hot-toast';
import {
    Wallet, TrendingUp, Download, Loader2,
    ArrowUpRight, ArrowDownLeft, Filter
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorEarnings = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeJobs: 0,
        completedJobs: 0
    });
    const [loading, setLoading] = useState(true);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await vendorAPI.getDashboard();
                if (res.status === 'success') {
                    setStats({
                        ...res.data,
                        totalRevenue: res.data.totalRevenue || 0,
                        walletBalance: res.data.walletBalance || 0,
                        activeJobs: res.data.activeJobs || 0,
                        completedJobs: res.data.completedJobs || 0,
                        transactions: res.data.transactions || []
                    });
                }
            } catch (err) {
                console.error('Failed to fetch carnings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    const handlePayout = async () => {
        if (!payoutAmount || isNaN(payoutAmount) || payoutAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            setLoading(true);
            setPayoutModalOpen(false);
            const res = await vendorAPI.requestPayout(Number(payoutAmount));
            if (res.status === 'success') {
                toast.success("Payout request submitted successfully!");
                setPayoutAmount('');
                // Refresh data
                const dash = await vendorAPI.getDashboard();
                if (dash.status === 'success') {
                    setStats({
                        ...dash.data,
                        transactions: dash.data.transactions || []
                    });
                }
            }
        } catch (err) {
            toast.error(err.message || "Failed to process payout");
        } finally {
            setLoading(false);
        }
    };

    // Payout transactions (Mock for UI)
    const TRANSACTIONS = [
        {
            id: 'TXN-PAYOUT-001',
            orderId: 'WD-8821',
            date: 'Yesterday',
            amount: '-₹2,500',
            status: 'Payout',
            method: 'Bank'
        }
    ];

    return (
        <VendorLayout
            title="Wallet & Analytics"
            subtitle="Manage Payouts & Revenue"
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Hero Balance Section */}
                <div className="bg-[#0f1117] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-black/10">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        {loading ? (
                            <div className="h-24 flex items-center">
                                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Withdrawable Balance</p>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                                    ₹{stats.walletBalance?.toLocaleString('en-IN') || '0'}.<span className="text-brand">00</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-green-400">
                                    <TrendingUp size={12} />
                                    <span>Tracking {stats.completedJobs} completed jobs</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPayoutModalOpen(true)}
                                disabled={loading || stats.walletBalance <= 0}
                                className="h-14 px-10 bg-brand text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Transfer to Bank'}
                            </button>
                            <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Revenue" val={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`} color="text-content" />
                    <StatCard label="Live Jobs" val={stats.activeJobs} color="text-brand" />
                    <StatCard label="Studio Level" val="Lvl 1" color="text-brand" />
                    <StatCard label="Trust Score" val="98%" color="text-green-500" />
                </div>

                {/* Transaction Ledger */}
                <div className="space-y-4 pb-20 md:pb-0">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-60">Transaction Registry</h3>
                            <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-40">Financial audit log</p>
                        </div>
                        <button className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20 hover:border-brand transition-all">Full Tactical Ledger</button>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden transition-colors">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center gap-4 bg-gray-50/5">
                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Accessing Financial Vault...</p>
                            </div>
                        ) : (stats.transactions && stats.transactions.length > 0) ? (
                            <div className="admin-table-container">
                                <div className="divide-y divide-gray-100/5">
                                    {stats.transactions.map((txn, i) => (
                                        <div key={txn.id} className="p-6 md:p-7 flex items-center justify-between hover:bg-gray-50/5 transition-all group active:scale-[0.995]">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${txn.amount.toString().startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {txn.amount.toString().startsWith('+') ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1.5">
                                                        <span className="text-sm font-black text-content tracking-tight uppercase leading-none">{txn.status === 'Payout' ? 'Studio Withdrawal' : `Order Operational Unit #${txn.orderId}`}</span>
                                                        <span className="w-fit text-[9px] font-black text-brand uppercase tracking-[0.15em] bg-brand/5 px-2 py-0.5 rounded-lg border border-brand/10">{txn.method}</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-tighter opacity-70 font-mono">Registry: {txn.date} · ID: {txn.id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base font-black tracking-tighter ${txn.amount.toString().startsWith('+') ? 'text-green-500' : 'text-content'}`}>{txn.amount}</p>
                                                <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${txn.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    <div className={`w-1 h-1 rounded-full ${txn.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                                    {txn.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-24 text-center space-y-4 bg-gray-50/5">
                                <div className="w-16 h-16 bg-background rounded-[1.5rem] flex items-center justify-center mx-auto text-content-subtle/10 border border-gray-100/10 shadow-inner">
                                    <Wallet size={32} />
                                </div>
                                <div>
                                    <p className="text-base font-black text-content uppercase tracking-tight">Vault Empty</p>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-60">No settlement history found in registry</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payout Modal */}
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
                            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-gray-100 shadow-2xl"
                        >
                            <h3 className="text-xl font-black text-content leading-none uppercase tracking-tighter mb-2">Request Payout</h3>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-6">Enter transfer amount to bank</p>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                        value={payoutAmount}
                                        onChange={e => setPayoutAmount(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handlePayout}
                                    className="w-full bg-content text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm Payout
                                </button>
                                <button
                                    onClick={() => setPayoutModalOpen(false)}
                                    className="w-full text-[9px] font-black text-content-subtle uppercase tracking-widest py-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </VendorLayout >
    );
};

const StatCard = ({ label, val, color }) => (
    <div className="bg-surface p-5 rounded-2xl border border-gray-100/10 shadow-sm transition-colors">
        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1 opacity-60">{label}</p>
        <span className={`text-xl font-black ${color} tracking-tight`}>{val}</span>
    </div>
);


export default VendorEarnings;
