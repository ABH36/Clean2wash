import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Briefcase, Filter, Box, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { driverService } from '../services/driverService';
import { toast } from 'react-hot-toast';

const DriverCompliance = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING_KIT, PENDING_POLICE

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchComplianceList();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, filter]);

    const fetchComplianceList = async () => {
        try {
            setLoading(true);
            const params = { limit: 100 };
            if (search) params.search = search;
            if (filter === 'PENDING_KIT') params.kitStatus = 'NOT_PURCHASED,PENDING';
            if (filter === 'PENDING_POLICE') params.policeVerification = 'PENDING,REJECTED';
            
            const res = await driverService.getAllDrivers(params);
            if (res?.status === 'success') {
                setDrivers(res.data.drivers);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to sync compliance registry');
        } finally {
            setLoading(false);
        }
    };

    const updateKit = async (id, status) => {
        try {
            const res = await driverService.updateKitStatus(id, status);
            if (res.status === 'success') {
                toast.success('Kit Status Synchronized');
                setDrivers(prev => prev.map(d => d._id === id ? { ...d, kitStatus: status } : d));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update kit status');
        }
    };

    const updatePolice = async (id, status) => {
        try {
            const res = await driverService.updatePoliceVerification(id, status);
            if (res.status === 'success') {
                toast.success('Police Verification Synchronized');
                setDrivers(prev => prev.map(d => d._id === id ? { ...d, policeVerification: status } : d));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update police verification');
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 pb-20 space-y-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft">
                <div>
                    <h2 className="text-2xl font-black text-content tracking-tighter">Compliance Operations</h2>
                    <p className="text-[11px] font-black tracking-widest text-content-subtle opacity-60 uppercase mt-1">
                        Tracking Equipment & Legal Vetting
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find Operative..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-xs font-black text-content placeholder:text-content-subtle/40 outline-none focus:border-brand/30 shadow-inner transition-all"
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-10 pr-10 py-3.5 text-[10px] uppercase tracking-widest font-black text-content outline-none cursor-pointer shadow-inner"
                        >
                            <option value="ALL">All Items</option>
                            <option value="PENDING_KIT">Pending Kit</option>
                            <option value="PENDING_POLICE">Pending Background</option>
                        </select>
                    </div>

                    <button onClick={fetchComplianceList} className="h-12 w-12 flex items-center justify-center bg-background border border-slate-200 dark:border-white/10 rounded-xl hover:border-brand hover:text-brand transition-colors">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </header>

            <div className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-slate-100 dark:border-white/5">
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle w-1/3">Operative Profile</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Equipment Protocol (Kit)</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle text-right relative pr-8">Legal Vetting (Police)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" className="p-10 text-center"><div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto" /></td></tr>
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-16 text-center text-content-subtle">
                                        <Briefcase className="mx-auto opacity-20 mb-4" size={40} />
                                        <p className="text-sm font-bold opacity-60">System Synchronized</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">No items match criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                drivers.map((driver) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        key={driver._id} 
                                        className="border-b border-slate-100/50 dark:border-white/5 hover:bg-background/30 transition-colors"
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                     <Box size={18} className="opacity-50" />
                                                 </div>
                                                <div>
                                                    <p className="text-sm font-black text-content capitalize">{driver.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle tracking-widest mt-0.5">{driver.phone} • {driver.driverId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="p-5">
                                            <select
                                                value={driver.kitStatus}
                                                onChange={(e) => updateKit(driver._id, e.target.value)}
                                                className={`appearance-none bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-inner transition-colors ${
                                                    driver.kitStatus === 'COMPLETED' ? 'text-emerald-500 border-emerald-500/20' : driver.kitStatus === 'PENDING' ? 'text-amber-500 border-amber-500/20' : 'text-red-500 border-red-500/20'
                                                }`}
                                            >
                                                <option value="NOT_PURCHASED" className="text-red-500">Not Purchased</option>
                                                <option value="PENDING" className="text-amber-500">Payment Pending</option>
                                                <option value="COMPLETED" className="text-emerald-500">Completed (Assigned)</option>
                                            </select>
                                        </td>

                                        <td className="p-5 text-right">
                                            <select
                                                value={driver.policeVerification}
                                                onChange={(e) => updatePolice(driver._id, e.target.value)}
                                                className={`appearance-none bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-inner transition-colors ${
                                                    driver.policeVerification === 'VERIFIED' ? 'text-emerald-500 border-emerald-500/20' : driver.policeVerification === 'REJECTED' ? 'text-red-500 border-red-500/20' : 'text-amber-500 border-amber-500/20'
                                                }`}
                                            >
                                                <option value="PENDING" className="text-amber-500">Verification Pending</option>
                                                <option value="VERIFIED" className="text-emerald-500">Verified & Approved</option>
                                                <option value="REJECTED" className="text-red-500">Check Failed</option>
                                            </select>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DriverCompliance;
