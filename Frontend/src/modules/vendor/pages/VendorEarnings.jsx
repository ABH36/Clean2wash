import React from 'react';
import {
    Wallet, TrendingUp, Download,
    ArrowUpRight, ArrowDownLeft, Filter
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorEarnings = () => {
    const TRANSACTIONS = [
        { id: 'TXN-9092', orderId: 'ORD-9921', date: 'Feb 21, 2026', amount: '+ ₹1,299', status: 'Settled', method: 'UPI' },
        { id: 'TXN-9081', orderId: 'ORD-8812', date: 'Feb 21, 2026', amount: '+ ₹899', status: 'Settled', method: 'Wallet' },
        { id: 'TXN-9076', orderId: 'ORD-7654', date: 'Feb 20, 2026', amount: '- ₹2,500', status: 'Payout', method: 'Bank Transfer' },
        { id: 'TXN-9065', orderId: 'ORD-6543', date: 'Feb 20, 2026', amount: '+ ₹1,100', status: 'Pending', method: 'Cash' },
    ];

    return (
        <VendorLayout
            title="Wallet & Analytics"
            subtitle="Manage Payouts & Revenue"
        >
            <div className="space-y-6">
                {/* Hero Stats */}
                <div className="bg-content rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-content/30 border border-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] italic">Withdrawable Balance</p>
                            <h2 className="text-5xl font-black italic tracking-tighter">₹42,850. <span className="text-brand/80">00</span></h2>
                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-green-400 text-xs font-black flex items-center gap-1 italic">
                                    <TrendingUp size={14} /> +12% this week
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="h-14 bg-brand px-8 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all">
                                Transfer to Bank
                            </button>
                            <button className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-md hover:bg-white/20 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Revenue" val="₹1.2L" color="text-content" />
                    <StatCard label="Studio Fees" val="₹8.4K" color="text-red-500" />
                    <StatCard label="Tips Earned" val="₹2.1K" color="text-green-500" />
                    <StatCard label="Studio Level" val="Lvl 4" color="text-brand" />
                </div>

                {/* Transaction History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] italic">Payment History</h3>
                        <button className="text-[10px] font-black text-brand uppercase tracking-widest border-b-2 border-brand/20 pb-0.5">View All</button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                        {TRANSACTIONS.map((txn, i) => (
                            <div key={txn.id} className={`p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${i < TRANSACTIONS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${txn.amount.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {txn.amount.startsWith('+') ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-black text-content tracking-tight">{txn.status === 'Payout' ? 'Bank Payout' : `Order ${txn.orderId}`}</span>
                                            <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">{txn.method}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{txn.date} · {txn.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-base font-black tracking-tight ${txn.amount.startsWith('+') ? 'text-green-600' : 'text-content'}`}>{txn.amount}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${txn.status === 'Pending' ? 'text-amber-500' : 'text-green-500'}`}>{txn.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

const StatCard = ({ label, val, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft">
        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">{label}</p>
        <span className={`text-xl font-black ${color} tracking-tight italic`}>{val}</span>
    </div>
);

export default VendorEarnings;
