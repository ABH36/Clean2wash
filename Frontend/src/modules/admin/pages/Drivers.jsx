import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, Ban, CheckCircle, Clock, Link as LinkIcon, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { driverService } from '../services/driverService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../utils/socket'; // Fixed import to explicitly map to Socket utility

const Drivers = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDrivers, setTotalDrivers] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set()); // Multi-select tracking
    const [isAllSelected, setIsAllSelected] = useState(false);

    useEffect(() => {
        // Socket subscription for real-time synchronization
        socketService.on('driver_updated', (payload) => {
            if (payload && payload.driverId) {
                setDrivers(prev => prev.map(d => d._id === payload.driverId ? { ...d, ...payload.data } : d));
            } else {
                fetchDrivers();
            }
        });

        const timeoutId = setTimeout(() => {
            fetchDrivers();
        }, 500); // debounce search
        
        return () => {
            clearTimeout(timeoutId);
            socketService.off('driver_updated');
        };
    }, [search, statusFilter, page]);

    // Handle Checkbox "Select All"
    useEffect(() => {
        if (drivers.length > 0 && selectedIds.size === drivers.length) {
            setIsAllSelected(true);
        } else {
            setIsAllSelected(false);
        }
    }, [selectedIds, drivers]);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const res = await driverService.getAllDrivers(params);
            if (res?.status === 'success') {
                setDrivers(res.data.drivers);
                setTotalPages(res.data.pagination.pages);
                setTotalDrivers(res.data.pagination.total);
            }
        } catch (error) {
            toast.error(error.message || 'Telemetry link failure');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
            const res = await driverService.updateDriverStatus(id, newStatus);
            if (res.status === 'success') {
                toast.success(`Operative is now ${newStatus}`);
                // LOCAL UPDATE - Avoids double fetching overhead resolving global refresh issue #1
                setDrivers(prev => prev.map(d => d._id === id ? { ...d, status: newStatus } : d));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to override operative status');
        }
    };

    const handleSelectRow = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(drivers.map(d => d._id)));
        }
    };

    const executeBulkBlock = async () => {
        const promises = Array.from(selectedIds).map(id => driverService.updateDriverStatus(id, 'BLOCKED').catch(e => null));
        await Promise.all(promises);
        toast.success(`Bulk operations executed over ${selectedIds.size} operatives`);
        setSelectedIds(new Set());
        fetchDrivers(); // Clean UI reload since it was a massive multi-mutation
    };

    const executeBulkActivate = async () => {
        const promises = Array.from(selectedIds).map(id => driverService.updateDriverStatus(id, 'ACTIVE').catch(e => null));
        await Promise.all(promises);
        toast.success(`Bulk operations executed over ${selectedIds.size} operatives`);
        setSelectedIds(new Set());
        fetchDrivers();
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 pb-20 space-y-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft">
                <div>
                    <h2 className="text-2xl font-black text-content tracking-tighter">Driver Registry</h2>
                    <p className="text-[11px] font-black tracking-widest text-content-subtle opacity-60 uppercase mt-1">
                        {totalDrivers} Personnel Synchronized
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Bulk Action Controls */}
                    {selectedIds.size > 0 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mr-4 bg-background border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-inner">
                            <span className="text-[10px] font-black tracking-widest text-brand px-3 uppercase">{selectedIds.size} Target(s)</span>
                            <button onClick={executeBulkActivate} className="px-3 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ">
                                Activate
                            </button>
                            <button onClick={executeBulkBlock} className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ">
                                Block
                            </button>
                        </motion.div>
                    )}

                    <div className="flex-1 md:w-64 bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 group focus-within:border-brand/30 transition-all shadow-inner">
                        <Search size={16} className="text-content-subtle group-focus-within:text-brand transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Grid..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-black text-content placeholder:text-content-subtle/40 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-10 pr-10 py-3.5 text-xs font-black text-content outline-none cursor-pointer shadow-inner"
                        >
                            <option value="">All States</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PENDING">Pending</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>
                    </div>
                </div>
            </header>

            <div className="bg-surface rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-slate-100 dark:border-white/5">
                                <th className="p-5 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected && drivers.length > 0} 
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-brand bg-surface focus:ring-brand accent-brand cursor-pointer"
                                    />
                                </th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Operative</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Contact</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Vetting Status</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Network State</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle text-right">Overrides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-white/5 border-brand/20 border-t-brand rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-content-subtle opacity-50">Syncing Grid</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-content-subtle">
                                        <Shield className="mx-auto opacity-20 mb-3" size={32} />
                                        <p className="text-sm font-bold opacity-60">No operatives found</p>
                                    </td>
                                </tr>
                            ) : (
                                drivers.map((driver) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={driver._id} 
                                        className="border-b border-slate-100/50 dark:border-white/5 hover:bg-background/30 transition-colors"
                                    >
                                        <td className="p-5 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(driver._id)}
                                                onChange={() => handleSelectRow(driver._id)}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-brand bg-surface focus:ring-brand accent-brand cursor-pointer "
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-orange-400 p-[1px]">
                                                <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center overflow-hidden">
                                                    {driver.profile?.profilePhoto ? (
                                                         <img src={driver.profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                         <span className="text-sm font-black text-content">{driver.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                            </div>
                                                <div>
                                                    <p className="text-sm font-black text-content capitalize">{driver.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle tracking-widest mt-0.5">{driver.driverId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-xs font-black text-content tabular-nums">{driver.phone}</p>
                                            <p className="text-[10px] font-bold text-content-subtle tracking-widest mt-0.5">{driver.profile?.city || 'Unassigned'}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                                driver.verificationStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                driver.verificationStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                                {driver.verificationStatus === 'APPROVED' ? <CheckCircle size={12} /> : driver.verificationStatus === 'REJECTED' ? <Ban size={12} /> : <Clock size={12} />}
                                                {driver.verificationStatus}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full  ${driver.status === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-500/40' : driver.status === 'BLOCKED' ? 'bg-red-500 shadow-red-500/40' : 'bg-amber-500'}`} />
                                                <span className="text-[10px] font-black text-content uppercase tracking-widest">{driver.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => navigate(`/admin/drivers/${driver._id}`)}
                                                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-background border border-slate-200 dark:border-white/10 hover:border-brand/40 hover:text-brand transition-colors flex items-center gap-1"
                                                >
                                                    <LinkIcon size={12} />
                                                    View
                                                </button>
                                                <button 
                                                    onClick={() => toggleStatus(driver._id, driver.status)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0 transition-all ${
                                                        driver.status === 'BLOCKED' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                                                            : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                                                    }`}
                                                >
                                                    {driver.status === 'BLOCKED' ? 'Activate' : 'Block'}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-background/30 flex items-center justify-between">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-surface border border-slate-200 dark:border-white/10 disabled:opacity-30"
                        >Prev</button>
                        <span className="text-[10px] font-black tracking-widest text-content-subtle">
                            Page {page} / {totalPages}
                        </span>
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-surface border border-slate-200 dark:border-white/10 disabled:opacity-30"
                        >Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Drivers;
