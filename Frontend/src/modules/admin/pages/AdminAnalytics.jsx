import React from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Zap
} from 'lucide-react';

const AdminAnalytics = () => {
    return (
        <AdminLayout title="Analytics Engine">
            <div className="space-y-8">
                {/* Global Filters */}
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <button className="flex-1 lg:px-5 py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                            Realtime
                        </button>
                        <button className="flex-1 lg:px-5 py-2.5 bg-gray-50 text-content-muted border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Historical
                        </button>
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shrink-0">
                            <Calendar size={14} className="text-content-subtle" />
                            <span className="text-[10px] font-black text-content italic uppercase tracking-widest">Last 30 Days</span>
                        </div>
                        <button className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle border border-gray-100 hover:text-brand transition-all shrink-0">
                            <Filter size={18} />
                        </button>
                        <button className="w-11 h-11 bg-content text-white rounded-xl flex items-center justify-center shadow-lg shadow-content/20 shrink-0">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Primary Data Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-content italic uppercase tracking-tight leading-none mb-1">Growth Index</h3>
                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Revenue vs Target</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Actual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Target</span>
                                </div>
                            </div>
                        </div>

                        {/* Mock Chart Visual */}
                        <div className="h-64 flex items-end gap-3 px-2">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.05, duration: 1 }}
                                        className={`w-full rounded-t-xl transition-all ${i === 11 ? 'bg-brand' : 'bg-gray-100 group-hover:bg-brand/20'
                                            }`}
                                    />
                                    <span className="text-[7px] font-black text-content-subtle uppercase tracking-tighter">M{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft">
                        <h3 className="text-lg font-black text-content italic uppercase tracking-tight leading-none mb-6">Service Mix</h3>
                        <div className="space-y-8">
                            {[
                                { label: 'Studio Wash', val: 42, color: 'bg-brand' },
                                { label: 'Doorstep Wash', val: 28, color: 'bg-blue-500' },
                                { label: 'Clinical Deep', val: 18, color: 'bg-violet-500' },
                                { label: 'Coating Services', val: 12, color: 'bg-content' }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-black text-content italic uppercase tracking-widest">{item.label}</p>
                                        <span className="text-[10px] font-black text-content">{item.val}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.val}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row - Operational Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Avg Ticket Value', val: '₹1,440', sub: 'Updated 5m ago', icon: <TrendingUp className="text-green-500" /> },
                        { label: 'Cust Acquisition', val: '₹140', sub: 'Decreased by 4%', icon: <ArrowDownRight className="text-green-500" /> },
                        { label: 'Fleet Utility', val: '86%', sub: 'High load detected', icon: <Zap className="text-brand" fill="currentColor" /> },
                        { label: 'Support TAT', val: '4.2m', sub: 'Faster than avg', icon: <Clock className="text-blue-500" /> }
                    ].map((metric, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle">
                                    {metric.icon}
                                </div>
                                <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">Active</span>
                            </div>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1">{metric.label}</p>
                            <h4 className="text-xl font-black text-content italic mb-1">{metric.val}</h4>
                            <p className="text-[8px] font-bold text-content-subtle uppercase italic tracking-tighter opacity-60">{metric.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

const Clock = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export default AdminAnalytics;
