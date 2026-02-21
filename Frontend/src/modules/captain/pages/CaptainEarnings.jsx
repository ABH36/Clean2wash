import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Wallet, Star, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

const TABS = ['Today', 'Week', 'Month'];

const DATA = {
    Today: { earned: '₹2,480', jobs: 7, rating: 5.0, hours: 6.2 },
    Week: { earned: '₹14,200', jobs: 41, rating: 4.9, hours: 38.5 },
    Month: { earned: '₹52,800', jobs: 162, rating: 4.9, hours: 148 },
};

const TRANSACTIONS = [
    { id: '#8821', service: 'Eco Wash', customer: 'Aman V.', amount: '+₹473', time: '2:30 PM', tip: '+₹50' },
    { id: '#8810', service: 'Deep Clean', customer: 'Priya S.', amount: '+₹899', time: '11:00 AM', tip: '' },
    { id: '#8802', service: 'Eco Wash', customer: 'Arjun M.', amount: '+₹354', time: '8:30 AM', tip: '+₹50' },
    { id: '#8791', service: 'Tyre Shine', customer: 'Nisha K.', amount: '+₹199', time: 'Yesterday', tip: '' },
];

const CaptainEarnings = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('Week');
    const d = DATA[tab];

    return (
        <CaptainLayout>
            {/* Header */}
            <header className="bg-content px-4 pt-10 pb-5 border-b border-white/5">
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Captain App</p>
                <h1 className="text-white text-xl font-black tracking-tight mb-5">My Earnings</h1>

                {/* Period tabs */}
                <div className="flex gap-1.5 bg-white/5 border border-white/5 rounded-xl p-1">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${tab === t ? 'bg-brand text-white shadow-md' : 'text-white/30'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Big Balance ── */}
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-brand rounded-2xl p-5 relative overflow-hidden">
                    <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">
                        {tab === 'Today' ? "Today's Earnings" : tab === 'Week' ? "This Week" : "This Month"}
                    </p>
                    <p className="text-white text-4xl font-black tracking-tight">{d.earned}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <ArrowUpRight size={14} className="text-white/70" />
                        <p className="text-white/70 text-xs font-bold">12% vs last {tab.toLowerCase()}</p>
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </motion.div>

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Jobs Done', value: d.jobs },
                        { label: 'Rating', value: `${d.rating}★` },
                        { label: 'Hours', value: `${d.hours}h` },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-soft px-3 py-4 text-center">
                            <p className="font-black text-lg text-content tracking-tight leading-none">{s.value}</p>
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Weekly Bar Chart ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-black text-sm text-content tracking-tight">Daily Trend</p>
                        <TrendingUp size={16} className="text-green-500" strokeWidth={2.5} />
                    </div>
                    <div className="flex items-end justify-between gap-1.5" style={{ height: 80 }}>
                        {[40, 65, 45, 80, 70, 95, 60].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t-lg bg-brand/20 relative overflow-hidden" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-0 inset-x-0 bg-brand rounded-t-lg" style={{ height: i === 5 ? '100%' : '60%' }} />
                                </div>
                                <p className="text-[7px] font-black text-content-subtle">{'SMTWTFS'[i]}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Payout Info ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-4 py-4 flex items-center gap-4">
                    <div className="w-11 h-11 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wallet size={20} className="text-green-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm text-content tracking-tight">Next Payout</p>
                        <p className="text-[10px] font-bold text-content-subtle mt-0.5">Sunday, Feb 23 · ₹14,200 to HDFC ····1234</p>
                    </div>
                    <span className="bg-green-50 border border-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Auto</span>
                </div>

                {/* ── Transaction List ── */}
                <section className="space-y-2">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Recent Jobs</p>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {TRANSACTIONS.map((tx, i) => (
                            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < TRANSACTIONS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <ArrowUpRight size={16} className="text-green-500" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-content truncate">{tx.service} · {tx.customer}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-content-subtle">{tx.time}</span>
                                        <span className="text-[8px] font-black text-content-subtle">{tx.id}</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-black text-sm text-green-600">{tx.amount}</p>
                                    {tx.tip && <p className="text-[9px] font-black text-brand">{tx.tip} tip</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </CaptainLayout>
    );
};

export default CaptainEarnings;
