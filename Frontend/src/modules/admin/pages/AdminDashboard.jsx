import React from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    TrendingUp,
    TrendingDown,
    Zap,
    Users,
    History,
    Wallet,
    ChevronRight,
    Car,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

const AdminDashboard = () => {
    const STATS = [
        { label: 'Total Revenue', val: '₹48,25,400', trend: '+12.5%', isUp: true, icon: <Wallet size={20} />, color: 'text-brand', bg: 'bg-brand/10' },
        { label: 'Active Jobs', val: '243', trend: '+4.2%', isUp: true, icon: <Zap size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Platform Users', val: '12,940', trend: '+18.1%', isUp: true, icon: <Users size={20} />, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Cancellation', val: '1.2%', trend: '-0.8%', isUp: false, icon: <AlertCircle size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const RECENT_ORDERS = [
        { id: 'ORD-9921', customer: 'Aryan Pathak', service: 'Full Deep Clean', status: 'Completed', amount: '₹1,299', time: '12 mins ago' },
        { id: 'ORD-9920', customer: 'Rahul Sharma', service: 'Eco Wash', status: 'In Progress', amount: '₹499', time: '15 mins ago' },
        { id: 'ORD-9919', customer: 'Sneha Gupta', service: 'Ceramic Coating', status: 'Pending', amount: '₹4,999', time: '22 mins ago' },
        { id: 'ORD-9918', customer: 'Amit Singh', service: 'Full Deep Clean', status: 'Completed', amount: '₹1,299', time: '1 hour ago' },
    ];

    return (
        <AdminLayout title="Overview">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${stat.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {stat.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-content italic tracking-tight">{stat.val}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Orders Table */}
                <div className="xl:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <h3 className="text-lg font-black text-content italic uppercase tracking-tight">Recent Transactions</h3>
                        <button className="w-fit text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand/20">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Order ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">User</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Service</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {RECENT_ORDERS.map((order, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-all cursor-pointer">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-content italic">{order.id}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-black text-[10px] uppercase italic text-brand">
                                                    {order.customer[0]}
                                                </div>
                                                <span className="text-xs font-bold text-content">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-content-muted font-bold italic">{order.service}</td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${order.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                                order.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-black text-content">{order.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Performance Chart / Right Card */}
                <div className="space-y-6">
                    <div className="bg-content rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-2 font-black italic">Network Load</p>
                            <h4 className="text-4xl font-black italic tracking-tighter leading-none mb-6">92% <br /> <span className="text-white/40 text-xl">Capacity</span></h4>
                            <div className="flex gap-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '92%' }}
                                        className="h-full bg-brand"
                                    />
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-white/30 uppercase mt-4 italic">System running at peak performance</p>
                        </div>
                        <Zap size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft">
                        <h3 className="text-sm font-black text-content italic uppercase mb-6 px-1">Top Studios</h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Sec-15 Studio', city: 'Faridabad', count: 120, rating: 4.9 },
                                { name: 'Cyber Hub Node', city: 'Gurugram', count: 98, rating: 4.8 },
                                { name: 'Indirapuram Hub', city: 'Noida', count: 85, rating: 4.7 }
                            ].map((hub, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                            <Car size={18} className="text-brand" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-content italic uppercase leading-none mb-1">{hub.name}</h4>
                                            <p className="text-[9px] font-bold text-content-subtle uppercase">{hub.city}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-content">{hub.count}</p>
                                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mt-0.5">⭐ {hub.rating}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
