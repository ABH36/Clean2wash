import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Wallet, TrendingUp, Download,
    ArrowUpRight, ArrowDownLeft, Filter
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorEarnings = () => {
    const { bookings, getUser } = useAuth();
    const vendor = getUser('vendor') || { id: 'VND-MOCK' };

    // Calculate dynamic stats from bookings
    const completedBookings = bookings.filter(b => b.vendorId === vendor.id && b.status === 'completed');
    const totalRevenue = completedBookings.reduce((acc, b) => acc + parseInt(b.price.replace(/[^0-9]/g, '') || 0), 0);
    const liveJobs = bookings.filter(b => b.vendorId === vendor.id && b.status !== 'completed').length;

    const TRANSACTIONS = completedBookings.map(b => ({
        id: b.id,
        orderId: b.id.replace('BK-', '#'),
        date: new Date(b.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' }),
        amount: `+₹${b.price.replace(/[^0-9]/g, '')}`,
        status: 'Settled',
        method: b.paymentMethod || 'UPI'
    }));

    // Add a mock payout for visual variety
    if (TRANSACTIONS.length > 0) {
        TRANSACTIONS.push({
            id: 'TXN-PAYOUT-001',
            orderId: 'WD-8821',
            date: 'Yesterday',
            amount: '-₹2,500',
            status: 'Payout',
            method: 'Bank'
        });
    }

    return (
        <VendorLayout
            title="Wallet & Analytics"
            subtitle="Manage Payouts & Revenue"
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Hero Balance Section */}
                <div className="bg-[#0f1117] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-black/10">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Withdrawable Balance</p>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                                ₹{totalRevenue.toLocaleString()}.<span className="text-brand">00</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-green-400 italic">
                                <TrendingUp size={12} />
                                <span>Tracking {completedBookings.length} completed jobs</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="h-14 px-10 bg-brand text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all">
                                Transfer to Bank
                            </button>
                            <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>
                    {/* Background Detail */}
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand/10 rounded-full blur-3xl" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Revenue" val={`₹${(totalRevenue / 1000).toFixed(1)}K`} color="text-content" />
                    <StatCard label="Live Jobs" val={liveJobs} color="text-brand" />
                    <StatCard label="Studio Level" val="Lvl 1" color="text-brand" />
                    <StatCard label="Trust Score" val="98%" color="text-green-500" />
                </div>

                {/* Transaction Ledger */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.15em]">Transaction Registry</h3>
                        <button className="text-[10px] font-black text-brand uppercase tracking-widest border-b-2 border-brand/20">Full Ledger</button>
                    </div>

                    <div className="bg-surface rounded-3xl border border-gray-100/10 shadow-sm overflow-hidden transition-colors">
                        {TRANSACTIONS.length > 0 ? TRANSACTIONS.map((txn, i) => (
                            <div key={txn.id} className={`p-5 flex items-center justify-between hover:bg-background/50 transition-colors ${i < TRANSACTIONS.length - 1 ? 'border-b border-gray-100/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.amount.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {txn.amount.startsWith('+') ? <ArrowDownLeft size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-black text-content tracking-tight">{txn.status === 'Payout' ? 'Studio Withdrawal' : `Order ${txn.orderId}`}</span>
                                            <span className="text-[9px] font-bold text-content-subtle uppercase tracking-widest bg-background px-2 py-0.5 rounded-md border border-gray-100/5">{txn.method}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-tighter opacity-70">{txn.date} · {txn.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black tracking-tight ${txn.amount.startsWith('+') ? 'text-green-500' : 'text-content'}`}>{txn.amount}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${txn.status === 'Pending' ? 'text-amber-500' : 'text-green-500'}`}>{txn.status}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center space-y-3">
                                <Wallet size={32} className="mx-auto text-content-subtle/20" />
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic opacity-50">No settlement history found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

const StatCard = ({ label, val, color }) => (
    <div className="bg-surface p-5 rounded-2xl border border-gray-100/10 shadow-sm transition-colors">
        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1 opacity-60">{label}</p>
        <span className={`text-xl font-black ${color} tracking-tight`}>{val}</span>
    </div>
);


export default VendorEarnings;
