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
                            className="w-full h-14 bg-surface border border-white/5/10 rounded-2xl pl-12 pr-4 text-sm font-bold text-content outline-none focus:border-brand transition-all shadow-soft"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-surface rounded-[2.5rem] border border-white/5/10 shadow-soft overflow-hidden">
                    <div className="p-8 border-b border-white/5/10">
                        <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">Client <span className="text-brand">Registry</span></h3>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1.5 opacity-60">Strategic relationship management database</p>
                    </div>
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4 bg-white/[0.02]/5">
                            <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Synchronizing Client Data...</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5/5 bg-white/[0.02]/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Operational Profile</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] text-center">Engagement</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Contribution</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Last Activity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] text-right">Command</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                        <tr key={customer.id} className="border-b border-white/5/5 group hover:bg-white/[0.02]/5 transition-all font-black relative active:scale-[0.995]">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-background border border-white/5/10 rounded-2xl flex items-center justify-center text-brand shadow-inner font-black text-xs">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-content tracking-tight uppercase leading-none mb-1.5">{customer.name}</p>
                                                        <p className="text-[10px] font-black text-brand uppercase tracking-tighter opacity-80 font-mono">{customer.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.15em] 
                                                    ${customer.status === 'Elite' ? 'bg-brand/10 border-brand/20 text-brand shadow-brand/5' : 'bg-background border-white/5/10 text-content-subtle opacity-60'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'Elite' ? 'bg-brand animate-pulse' : 'bg-gray-400'}`} />
                                                    {customer.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ShoppingBag size={14} className="text-brand opacity-60" />
                                                    <p className="text-sm font-black text-content tracking-tighter">{customer.bookings} <span className="text-[10px] uppercase font-black opacity-40">Ops</span></p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-green-500 tracking-tighter">₹{customer.spent ? Number(customer.spent).toLocaleString('en-IN') : '0'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <History size={14} className="text-content-subtle opacity-40" />
                                                    <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{new Date(customer.lastActive).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="w-10 h-10 bg-background border border-white/5/10 rounded-xl text-content-muted hover:text-brand hover:border-brand/40 transition-all font-bold  flex items-center justify-center translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                                                    <ChevronRight size={18} strokeWidth={3} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="py-24 text-center bg-white/[0.02]/5">
                                                <div className="w-16 h-16 bg-background rounded-[1.5rem] flex items-center justify-center mx-auto text-content-subtle/10 border border-white/5/10 shadow-inner mb-6">
                                                    <Users size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-content uppercase tracking-tight">Registry Empty</p>
                                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 opacity-60">No client records found in sector</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-6 pb-24">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4 bg-white/[0.02]/5 rounded-[2.5rem] border border-white/5/5">
                            <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/20" />
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Syncing Assets...</p>
                        </div>
                    ) : filteredCustomers.map(customer => (
                        <motion.div
                            key={customer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface p-7 rounded-[2.5rem] border border-white/5/10 shadow-soft space-y-7 relative overflow-hidden group active:scale-[0.98] transition-transform"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-background border border-white/5/10 flex items-center justify-center text-brand font-black text-base shadow-inner">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-content tracking-tight uppercase leading-none mb-1.5">{customer.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${customer.status === 'Elite' ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-background border-white/5/10 text-content-subtle opacity-60'}`}>
                                                {customer.status}
                                            </span>
                                            <span className="text-[10px] font-black text-brand tracking-tighter font-mono opacity-80">{customer.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-11 h-11 bg-background border border-white/5/10 rounded-xl text-content-muted hover:text-brand hover:border-brand/40 transition-all  flex items-center justify-center">
                                    <Phone size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-5 border-y border-white/5/5 relative z-10">
                                <div className="bg-background rounded-2xl p-4 border border-white/5/5 shadow-inner">
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5 opacity-50">Engagement</p>
                                    <p className="text-xs font-black text-content">{customer.bookings} <span className="text-[9px] uppercase font-black opacity-40">Operations</span></p>
                                </div>
                                <div className="bg-background rounded-2xl p-4 border border-white/5/5 shadow-inner">
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1.5 opacity-50">Contribution</p>
                                    <p className="text-xs font-black text-green-500">₹{customer.spent ? Number(customer.spent).toLocaleString('en-IN') : '0'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <History size={12} className="text-content-subtle opacity-40" />
                                    <span className="text-[10px] font-black text-content-subtle uppercase tracking-[0.15em]">Last: {new Date(customer.lastActive).toLocaleDateString()}</span>
                                </div>
                                <button className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                                    Strategic Profile <ChevronRight size={14} strokeWidth={3} />
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
