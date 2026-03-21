import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Download, Loader2, Wallet } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverEarnings = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        balance: 0,
        transactions: [],
        monthlyEarnings: 0,
        jobsDone: 0
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get profile for balance
                const profileRes = await spareDriverAPI.getProfile();
                const balance = profileRes?.data?.driver?.wallet?.balance || 0;

                // Get transactions
                const txRes = await spareDriverAPI.getTransactions();
                const txns = txRes?.data?.transactions || [];

                // Calculate stats (Current Month)
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const monthly = txns
                    .filter(t => t.type === 'credit' && new Date(t.createdAt) >= firstDayOfMonth)
                    .reduce((acc, t) => acc + t.amount, 0);

                const jobs = txns.filter(t => t.category === 'SERVICE_BOOKING' && t.type === 'credit').length;

                setData({
                    balance,
                    transactions: txns,
                    monthlyEarnings: monthly,
                    jobsDone: jobs
                });
            } catch (err) {
                console.error("Failed to load earnings:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <DriverLayout title="Earnings">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 size={24} className="animate-spin text-[#F29F05]" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Earnings">
            <div className="px-5 py-6 space-y-5">

                {/* ── Balance Card ── */}
                <div className="bg-black text-white rounded-lg p-5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Available Balance</p>
                    <p className="text-4xl font-black text-white leading-none mb-5">₹{data.balance.toLocaleString()}</p>

                    <div className="flex gap-3">
                        <button className="flex-1 h-10 bg-[#F29F05] text-black text-[10px] font-black uppercase tracking-widest rounded-md active:scale-95 transition-transform">
                            Withdraw
                        </button>
                        <button className="w-10 h-10 border border-white/10 text-white rounded-md flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all">
                            <Download size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">This Month</p>
                        <p className="text-xl font-black text-black">₹{data.monthlyEarnings.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-[#F29F05] text-[9px] font-black mt-1">
                            <TrendingUp size={10} /> Live Stats
                        </div>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Jobs Done</p>
                        <p className="text-xl font-black text-black">{data.jobsDone}</p>
                        <p className="text-[9px] font-black text-[#F29F05] mt-1">Verified Node</p>
                    </div>
                </div>

                {/* ── Transactions ── */}
                <div>
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mb-3">Recent Transactions</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden bg-white shadow-sm">
                        {data.transactions.length > 0 ? data.transactions.map((tx, i) => (
                            <div key={tx._id || i} className="flex items-center justify-between px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tx.type === 'credit' ? 'bg-[#F29F05]/10' : 'bg-gray-50'}`}>
                                        {tx.type === 'credit'
                                            ? <ArrowDownLeft size={13} className="text-[#F29F05]" />
                                            : <ArrowUpRight size={13} className="text-black/30" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase leading-none truncate max-w-[150px]">
                                            {tx.description || tx.category}
                                        </p>
                                        <p className="text-[8px] font-bold text-black/25 uppercase mt-0.5">
                                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {tx._id.slice(-6).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <p className={`text-[12px] font-black ${tx.type === 'credit' ? 'text-black' : 'text-black/40'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                </p>
                            </div>
                        )) : (
                            <div className="py-12 flex flex-col items-center gap-2 opacity-20">
                                <Wallet size={24} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-center">No transactions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {data.transactions.length > 5 && (
                    <button className="w-full text-center text-[9px] font-black text-black/20 uppercase tracking-widest py-3 hover:text-black/40 transition-colors">
                        View Full Statement
                    </button>
                )}

            </div>
        </DriverLayout>
    );
};

export default DriverEarnings;
