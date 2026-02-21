import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Filter, Mail, Phone,
    ChevronRight, Star, History, ShoppingBag
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorCustomers = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const CUSTOMERS = [
        { id: 'CUS-101', name: 'Suresh Raina', bookings: 12, spent: '₹14,299', lastActive: '2 days ago', phone: '+91 98XXX 00123', status: 'Elite' },
        { id: 'CUS-102', name: 'Anjali Gupta', bookings: 5, spent: '₹4,899', lastActive: '1 week ago', phone: '+91 98XXX 00456', status: 'Regular' },
        { id: 'CUS-103', name: 'Aman Verma', bookings: 24, spent: '₹32,400', lastActive: 'Today', phone: '+91 98XXX 00789', status: 'Elite' },
        { id: 'CUS-104', name: 'Rohit Sharma', bookings: 2, spent: '₹1,200', lastActive: '1 month ago', phone: '+91 98XXX 00111', status: 'Regular' },
        { id: 'CUS-105', name: 'Priya Patel', bookings: 8, spent: '₹9,850', lastActive: '3 days ago', phone: '+91 98XXX 00222', status: 'Elite' },
    ];

    return (
        <VendorLayout
            title="Customer Database"
            subtitle="Manage client relationships"
        >
            <div className="space-y-6">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted group-focus-within:text-brand transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full h-14 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-content outline-none focus:border-brand transition-all shadow-soft"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none h-14 px-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-content-muted font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-soft">
                            <Filter size={18} /> Filter
                        </button>
                        <button className="flex-1 md:flex-none h-14 px-8 bg-brand text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all">
                            Export List
                        </button>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-content-subtle">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Total Bookings</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Last Activity</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {CUSTOMERS.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-content-muted font-black text-xs">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-content tracking-tight">{customer.name}</p>
                                                <p className="text-[10px] font-bold text-content-subtle">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${customer.status === 'Elite' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-content-muted'
                                            }`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={14} className="text-content-subtle" />
                                            <span className="text-sm font-black text-content">{customer.bookings} orders</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-green-600 tracking-tight">{customer.spent}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <History size={14} className="text-content-subtle" />
                                            <span className="text-xs font-bold text-content-subtle italic">{customer.lastActive}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button className="text-content-muted hover:text-brand transition-all group-hover:translate-x-1">
                                            <ChevronRight size={18} strokeWidth={3} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 pb-24">
                    {CUSTOMERS.map(customer => (
                        <motion.div
                            key={customer.id}
                            whileHover={{ y: -4 }}
                            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand font-black text-sm border border-gray-100">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-content tracking-tight">{customer.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded-md border border-brand/10">{customer.status}</span>
                                            <span className="text-[10px] font-bold text-content-subtle italic">{customer.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-3 bg-gray-50 rounded-xl text-content-muted">
                                    <Phone size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Engagement</p>
                                    <p className="text-xs font-black text-content">{customer.bookings} Bookings</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Revenue Contribution</p>
                                    <p className="text-xs font-black text-green-600">{customer.spent}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic leading-none">Last Booked {customer.lastActive}</span>
                                <button className="flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-widest">
                                    View Profile <ChevronRight size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorCustomers;
