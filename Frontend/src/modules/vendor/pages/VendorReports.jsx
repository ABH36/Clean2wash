import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Calendar, Download,
    Filter, PieChart, Users, Star, ArrowUpRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';

const VendorReports = () => {
    const [period, setPeriod] = useState('Month');
    const [reportData, setReportData] = useState({
        metrics: [],
        bestSellers: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await vendorAPI.getReports();
                if (res.status === 'success') {
                    setReportData(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch reports', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);


    return (
        <VendorLayout
            title="Performance Reports"
            subtitle="Analytics & Studio Growth"
        >
            <div className="space-y-8 pb-24">
                {/* Hero Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-surface h-36 rounded-[2.5rem] animate-pulse border border-white/5/10 shadow-soft" />
                        ))
                    ) : (
                        reportData.metrics.map(m => (
                            <div key={m.label} className="bg-surface p-8 rounded-[2.5rem] border border-white/5/10 shadow-soft relative overflow-hidden group active:scale-[0.98] transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-colors" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 opacity-60">{m.label}</p>
                                    <h2 className={`text-4xl font-black ${m.color} tracking-tighter leading-none truncate`}>{m.val}</h2>
                                    <p className="text-[10px] font-black text-content uppercase tracking-widest mt-2 bg-background/50 inline-block px-2 py-0.5 rounded-lg border border-white/5/5">{m.sub}</p>
                                </div>
                                <div className="absolute bottom-6 right-8 text-content-subtle/5 group-hover:text-brand/10 transition-all group-hover:scale-110">
                                    <BarChart3 size={48} strokeWidth={1} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend Chart */}
                    <div className="bg-surface p-8 rounded-[3rem] border border-white/5/10 shadow-soft space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-[10px] font-black text-content uppercase tracking-[0.3em]">Growth <span className="text-brand">Trajectory</span></h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-60">Revenue patterns and projections</p>
                            </div>
                            <div className="flex gap-1.5 bg-background p-1 rounded-2xl border border-white/5/5 shadow-inner">
                                {['Week', 'Month', 'Year'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-surface text-brand  border border-white/5/10' : 'text-content-subtle hover:text-content'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-2.5 pt-4">
                            {(reportData.revenueTrend || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).map((h, i) => (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(8, Math.min(h * 2, 100))}%` }}
                                        className="w-full bg-brand/5 rounded-t-2xl group hover:bg-brand transition-all relative border-x border-t border-brand/10 hover:shadow-lg hover:shadow-brand/20"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-content text-surface text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-2xl shadow-black/50 pointer-events-none z-20">
                                            ₹{h}k
                                        </div>
                                    </motion.div>
                                    <p className="text-[8px] font-black text-content-subtle/40 text-center uppercase mt-3 tracking-tighter">
                                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-surface rounded-[3rem] p-9 text-content relative overflow-hidden shadow-soft border border-white/5/10 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mb-4 opacity-60 text-center md:text-left">Studio Health Score</p>
                                <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
                                    <div className="w-24 h-24 bg-background border border-white/5/10 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:border-brand/20 transition-colors">
                                        <h2 className="text-5xl font-black tracking-tighter leading-none">{reportData.metrics?.[2]?.val || '0.0'}</h2>
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <div className="flex gap-1.5 text-brand justify-center md:justify-start">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    size={18}
                                                    className="transition-transform group-hover:scale-110"
                                                    style={{ transitionDelay: `${s * 50}ms` }}
                                                    fill={s <= Math.round(parseFloat(reportData.metrics?.[2]?.val || 0)) ? "currentColor" : "none"}
                                                />
                                            ))}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                                            <TrendingUp size={12} className="text-green-500" />
                                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">{reportData.metrics?.[2]?.sub || 'Strategic Rating'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
                                <Star size={200} strokeWidth={1} />
                            </div>
                        </div>

                        <div className="bg-surface p-9 rounded-[3rem] border border-white/5/10 shadow-soft space-y-8 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-content uppercase tracking-[0.2em]">Tactical <span className="text-brand">Feedback</span></h3>
                                <button className="text-[9px] font-black text-brand uppercase tracking-widest border-b border-brand/20">Expand Log</button>
                            </div>
                            <div className="space-y-7">
                                {reportData.reviews?.length > 0 ? reportData.reviews.map(rev => (
                                    <div key={rev.id} className="space-y-3 group cursor-pointer relative">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-background border border-white/5/10 flex items-center justify-center font-black text-xs text-brand shadow-inner">
                                                    {rev.user[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-content tracking-tight uppercase leading-none mb-1">{rev.user}</p>
                                                    <div className="flex gap-0.5 text-brand/60">
                                                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} />)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-content-subtle uppercase tracking-tighter opacity-40">{rev.date}</span>
                                        </div>
                                        <p className="text-xs font-black text-content-subtle leading-relaxed pl-12 border-l-2 border-white/5/10 truncate">"{rev.comment}"</p>
                                    </div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center gap-3 opacity-30">
                                        <PieChart size={32} />
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">No field reports captured</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Popular Services Section */}
                <div className="bg-surface p-10 rounded-[3.5rem] border border-white/5/10 shadow-soft relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <div>
                            <h3 className="text-[10px] font-black text-content uppercase tracking-[0.4em] leading-none mb-2">Operational <span className="text-brand">Dominance</span></h3>
                            <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest opacity-60">Peak performance asset catalog</p>
                        </div>
                        <button className="h-12 px-6 bg-background border border-white/5/10 text-brand rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3  hover:border-brand/40 transition-all active:scale-[0.98]">
                            Intel Export <Download size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        {loading ? (
                            <div className="col-span-full py-16 flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Auditing Assets...</p>
                            </div>
                        ) : (
                            reportData.bestSellers.map(service => (
                                <div key={service.name} className="p-7 bg-background border border-white/5/10 rounded-[2.5rem] group/card hover:border-brand/30 transition-all shadow-inner relative overflow-hidden active:scale-[0.98]">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-sm font-black text-content tracking-tighter uppercase leading-tight max-w-[70%]">{service.name}</h4>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black  ${service.trend.startsWith('-') ? 'bg-red-500/10 text-red-600 border border-red-500/10' : 'bg-green-500/10 text-green-600 border border-green-500/10'}`}>
                                            {service.trend} <ArrowUpRight size={10} strokeWidth={3} className={service.trend.startsWith('-') ? 'rotate-90' : ''} />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black tracking-tighter text-content leading-none">{service.sales}</p>
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest opacity-60 mb-1">Strategic Conversions</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorReports;
