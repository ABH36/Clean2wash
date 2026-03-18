import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { vendorAPI } from '../../../utils/vendorApi';
import {
    Users, Search, Filter, Mail, Phone,
    ChevronRight, Star, History, ShoppingBag, Loader2
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';

const VendorCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await vendorAPI.getCustomers();
                if (res.status === 'success') {
                    setCustomers(res.data.customers);
                }
            } catch (err) {
                console.error('Failed to fetch customers', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm)
    );

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
                            className="w-full h-14 bg-surface border border-gray-100/10 rounded-2xl pl-12 pr-4 text-sm font-bold text-content outline-none focus:border-brand transition-all shadow-soft"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-surface rounded-3xl border border-gray-100/10 shadow-soft overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-background border-b border-gray-100/10 text-[10px] font-black uppercase tracking-[0.15em] text-content-subtle">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Total Bookings</th>
                                    <th className="px-6 py-4">Total Spent</th>
                                    <th className="px-6 py-4">Last Activity</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/5">
                                {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-background border border-gray-100/10 flex items-center justify-center text-content-muted font-black text-xs">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-content tracking-tight">{customer.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle">{customer.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${customer.status === 'Elite' ? 'bg-brand/10 text-brand' : 'bg-background border border-gray-100/10 text-content-muted'
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
                                            <span className="text-sm font-black text-green-600 tracking-tight">₹{customer.spent ? Number(customer.spent).toLocaleString('en-IN') : '0'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <History size={14} className="text-content-subtle" />
                                                <span className="text-xs font-bold text-content-subtle italic">{new Date(customer.lastActive).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button className="text-content-muted hover:text-brand transition-all group-hover:translate-x-1">
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center">
                                            <Users size={32} className="mx-auto text-content-subtle/20 mb-2" />
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">No client records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 pb-24">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        </div>
                    ) : filteredCustomers.map(customer => (
                        <motion.div
                            key={customer.id}
                            whileHover={{ y: -4 }}
                            className="bg-surface p-5 rounded-3xl border border-gray-100/10 shadow-soft space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-background border border-gray-100/10 flex items-center justify-center text-brand font-black text-sm">
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
                                <button className="p-3 bg-background border border-gray-100/10 rounded-xl text-content-muted hover:text-brand transition-colors">
                                    <Phone size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100/10">
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Engagement</p>
                                    <p className="text-xs font-black text-content">{customer.bookings} Bookings</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 italic">Contribution</p>
                                    <p className="text-xs font-black text-green-600">₹{customer.spent ? Number(customer.spent).toLocaleString('en-IN') : '0'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic leading-none">Activity: {new Date(customer.lastActive).toLocaleDateString()}</span>
                                <button className="flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-widest">
                                    Profile <ChevronRight size={14} strokeWidth={3} />
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
