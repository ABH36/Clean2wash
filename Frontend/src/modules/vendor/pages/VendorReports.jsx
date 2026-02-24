import React, { useState } from 'react';
import {
    BarChart3, TrendingUp, Calendar, Download,
    Filter, PieChart, Users, Star, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';

const VendorReports = () => {
    const [period, setPeriod] = useState('Month');

    const METRICS = [
        { label: 'Booking Growth', val: '+24%', sub: 'vs last month', color: 'text-green-500' },
        { label: 'Repeat Customers', val: '42%', sub: 'Retention rate', color: 'text-blue-500' },
        { label: 'Avg Rating', val: '4.92', sub: 'Across 120 reviews', color: 'text-amber-500' },
    ];

    const RECENT_REVIEWS = [
        { id: 1, user: 'Suresh Raina', rating: 5, comment: 'Excellent quality! Best studio in Bengaluru.', date: '2 days ago' },
        { id: 2, user: 'Anjali G.', rating: 4, comment: 'Great job, but pickup was slightly delayed.', date: '5 days ago' },
        { id: 3, user: 'Aman Verma', rating: 5, comment: 'The ceramic coating looks fabulous!', date: '1 week ago' },
    ];

    return (
        <VendorLayout
            title="Performance Reports"
            subtitle="Analytics & Studio Growth"
        >
            <div className="space-y-8 pb-24">
                {/* Hero Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {METRICS.map(m => (
                        <div key={m.label} className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1 italic font-bold">{m.label}</p>
                                <h2 className={`text-4xl font-black ${m.color} tracking-tighter italic`}>{m.val}</h2>
                                <p className="text-[10px] font-bold text-content-subtle mt-1 uppercase tracking-widest">{m.sub}</p>
                            </div>
                            <div className="absolute top-4 right-4 text-content-subtle/10 group-hover:text-brand/20 transition-colors">
                                <BarChart3 size={40} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend Chart Placeholder */}
                    <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em] italic">Revenue Trends</h3>
                            <div className="flex gap-2">
                                {['Week', 'Month', 'Year'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-brand text-white' : 'text-content-muted hover:bg-background'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-4 pt-4">
                            {[60, 40, 95, 75, 55, 80, 70, 45, 90, 65, 85, 50].map((h, i) => (
                                <div key={i} className="flex-1 space-y-2">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className="w-full bg-brand/10 rounded-t-xl group hover:bg-brand transition-all relative border-x border-t border-brand/20"
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface border border-gray-100/10 text-content text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {h}k
                                        </div>
                                    </motion.div>
                                    <p className="text-[8px] font-black text-content-subtle text-center uppercase">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div className="space-y-6">
                        <div className="bg-surface rounded-[2.5rem] p-8 text-content relative overflow-hidden shadow-2xl border border-gray-100/10">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] italic">Customer Feedback</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <h2 className="text-5xl font-black italic tracking-tighter">4.9</h2>
                                    <div className="space-y-1">
                                        <div className="flex gap-0.5 text-brand">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                                        </div>
                                        <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest">Studio Rating (120 Users)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Users size={120} />
                            </div>
                        </div>

                        <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft space-y-6">
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em] italic">Recent Reviews</h3>
                            <div className="space-y-6">
                                {RECENT_REVIEWS.map(rev => (
                                    <div key={rev.id} className="space-y-2 group cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-background border border-gray-100/10 flex items-center justify-center font-black text-[10px] text-brand">
                                                    {rev.user[0]}
                                                </div>
                                                <span className="text-sm font-black text-content tracking-tight">{rev.user}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-content-subtle uppercase italic">{rev.date}</span>
                                        </div>
                                        <p className="text-xs font-bold text-content-muted leading-relaxed line-clamp-2 italic">"{rev.comment}"</p>
                                        <div className="flex gap-0.5 text-amber-500">
                                            {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-4 border-2 border-dashed border-gray-100/10 bg-background rounded-2xl text-[10px] font-black text-content-subtle uppercase tracking-widest hover:border-brand hover:text-brand transition-all">
                                View Full Review Log
                            </button>
                        </div>
                    </div>
                </div>

                {/* Popular Services Section */}
                <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em] italic">Best Sellers</h3>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Most booked services this period</p>
                        </div>
                        <button className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                            Download PDF <Download size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Eco Wash', sales: 120, trend: '+15%' },
                            { name: 'Deep Clean', sales: 85, trend: '+8%' },
                            { name: 'Full Detail', sales: 42, trend: '-2%' },
                            { name: 'Ceramic', sales: 12, trend: '+20%' },
                        ].map(service => (
                            <div key={service.name} className="p-5 bg-background rounded-[2rem] border border-gray-100/10 group hover:border-brand/20 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-black text-content tracking-tight">{service.name}</h4>
                                    <div className={`flex items-center gap-1 text-[9px] font-black ${service.name === 'Full Detail' ? 'text-red-500' : 'text-green-500'}`}>
                                        {service.trend} <ArrowUpRight size={10} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black italic tracking-tighter text-content">{service.sales} <span className="text-[10px] text-content-subtle uppercase tracking-widest not-italic">Sales</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorReports;
