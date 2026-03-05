import React from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';

const DriverEarnings = () => {
    const txns = [
        { id: 'TX-291', date: '25 Feb', label: 'Point-to-Point', amount: '+₹240', credit: true },
        { id: 'TX-289', date: '24 Feb', label: 'Hourly (4h)', amount: '+₹680', credit: true },
        { id: 'TX-282', date: '22 Feb', label: 'Bank Payout', amount: '-₹2,500', credit: false },
        { id: 'TX-278', date: '20 Feb', label: 'Full Day', amount: '+₹1,200', credit: true },
    ];

    return (
        <DriverLayout title="Earnings">
            <div className="px-5 py-6 space-y-5">

                {/* ── Balance Card ── */}
                <div className="bg-black text-white rounded-lg p-5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Available Balance</p>
                    <p className="text-4xl font-black text-white leading-none mb-5">₹4,820</p>

                    <div className="flex gap-3">
                        <button className="flex-1 h-10 bg-[#F29F05] text-black text-[10px] font-black uppercase tracking-widest rounded-md">
                            Withdraw
                        </button>
                        <button className="w-10 h-10 border border-white/10 text-white rounded-md flex items-center justify-center">
                            <Download size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-100 rounded-lg p-4">
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">This Month</p>
                        <p className="text-xl font-black text-black">₹18,420</p>
                        <div className="flex items-center gap-1 text-[#F29F05] text-[9px] font-black mt-1">
                            <TrendingUp size={10} /> +4.2%
                        </div>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-4">
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Jobs Done</p>
                        <p className="text-xl font-black text-black">42</p>
                        <p className="text-[9px] font-black text-[#F29F05] mt-1">Bronze Rank</p>
                    </div>
                </div>

                {/* ── Transactions ── */}
                <div>
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mb-3">Recent Transactions</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {txns.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tx.credit ? 'bg-[#F29F05]/10' : 'bg-gray-50'}`}>
                                        {tx.credit
                                            ? <ArrowDownLeft size={13} className="text-[#F29F05]" />
                                            : <ArrowUpRight size={13} className="text-black/30" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase leading-none">{tx.label}</p>
                                        <p className="text-[8px] font-bold text-black/25 uppercase mt-0.5">{tx.date} • {tx.id}</p>
                                    </div>
                                </div>
                                <p className={`text-[12px] font-black ${tx.credit ? 'text-black' : 'text-black/40'}`}>{tx.amount}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="w-full text-center text-[9px] font-black text-black/20 uppercase tracking-widest py-3 hover:text-black/40 transition-colors">
                    View Full Statement
                </button>

            </div>
        </DriverLayout>
    );
};

export default DriverEarnings;
