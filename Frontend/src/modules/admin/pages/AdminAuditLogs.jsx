import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import {
    Shield,
    Activity,
    Search,
    Filter,
    RefreshCw,
    Clock,
    User,
    Database,
    AlertCircle,
    ChevronDown,
    Eye,
    Terminal,
    Fingerprint,
    Globe
} from 'lucide-react';

const AdminAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });
    const [selectedLog, setSelectedLog] = useState(null);
    const [filters, setFilters] = useState({ action: '', resource: '' });

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getAuditLogs({ page, limit: 20, ...filters });
            if (res.status === 'success') {
                setLogs(res.data.logs);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getAuditStats();
            if (res.status === 'success') {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('UPDATE')) return 'text-[var(--warning)] bg-[var(--warning-light)]';
        if (action.includes('DELETE')) return 'text-red-500 bg-red-500/10';
        if (action.includes('SETTLE')) return 'text-green-500 bg-green-500/10';
        return 'text-brand bg-brand/10';
    };

    return (
        <>
            <div className="space-y-8 pb-20">

                {/* ── Audit Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 bg-surface p-8 rounded-[2.5rem] border border-gray-100/10 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2">Audit Throughput</p>
                            <h3 className="text-3xl font-black text-content tracking-tighter">{pagination.total.toLocaleString()} <span className="text-xs text-brand">Logged Actions</span></h3>
                        </div>
                        <div className="flex gap-4">
                            {stats.slice(0, 3).map((s, i) => (
                                <div key={i} className="text-right">
                                    <p className="text-[9px] font-black text-content-subtle uppercase truncate max-w-[100px]">{s._id.replace('_', ' ')}</p>
                                    <p className="text-lg font-black text-content">{s.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-brand p-8 rounded-[2.5rem] shadow-brand/20 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <Activity className="absolute -right-4 -top-4 size-24 text-white/10 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">System Status</p>
                        <h4 className="text-xl font-black text-white">PROT-ACTIVE</h4>
                        <span className="text-[8px] font-bold text-white/40 mt-2 uppercase">Integrity Watcher Live</span>
                    </div>
                </div>

                {/* ── Controls Bar ── */}
                <div className="bg-surface rounded-3xl p-4 border border-gray-100/10 shadow-soft flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={18} />
                        <input
                            type="text"
                            placeholder="Search by action or resource protocol..."
                            className="w-full bg-background border border-gray-100/10 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                            value={filters.action}
                            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            className="bg-background border border-gray-100/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-content outline-none"
                            value={filters.resource}
                            onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
                        >
                            <option value="">All Resources</option>
                            <option value="Setting">Settings</option>
                            <option value="WalletTransaction">Transactions</option>
                            <option value="Booking">Bookings</option>
                        </select>

                        <button onClick={fetchLogs} className="p-3 bg-background border border-gray-100/10 rounded-xl text-content-subtle hover:text-brand transition-all active:scale-95">
                            <RefreshCw size={18} className={loading ? 'animate-spin text-brand' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── Logs Feed ── */}
                <div className="bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden">
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead className="bg-background/80 border-b border-gray-100/5">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Chronology</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Admin Entity</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Protocol Action</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Resource Node</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Context</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/5">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-6 h-20 bg-background/20" />
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Fingerprint size={48} className="mx-auto text-gray-100 mb-4" />
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">No Security Logs Detected</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-background/50 transition-all cursor-pointer group" onClick={() => setSelectedLog(log)}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center border border-gray-100/10">
                                                        <Clock size={14} className="text-content-subtle" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-content block leading-none">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                                        <span className="text-[8px] font-bold text-content-subtle uppercase mt-1">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-brand/5 flex items-center justify-center">
                                                        <User size={14} className="text-brand" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-content">{log.userId?.name || 'ROOT'}</span>
                                                        <p className="text-[8px] font-black text-content-subtle uppercase mt-0.5 tracking-widest">{log.userId?.role || 'SYSTEM'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${getActionColor(log.action)}`}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Database size={12} className="text-content-subtle" />
                                                    <span className="text-[10px] font-black text-content uppercase tracking-tight">{log.resource}</span>
                                                    <span className="text-[8px] font-mono text-content-subtle">ID:{log.resourceId.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="w-8 h-8 rounded-xl bg-background border border-gray-100/10 flex items-center justify-center text-content-subtle hover:text-brand hover:border-brand/30 transition-all">
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Log Inspector Modal ── */}
            < AnimatePresence >
                {selectedLog && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-surface w-full max-w-2xl rounded-[3rem] border border-gray-100/10 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
                            <div className="p-10 border-b border-gray-100/5 bg-background/30 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getActionColor(selectedLog.action)}`}>
                                        <Terminal size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-content tracking-tighter uppercase leading-none">{selectedLog.action.replace('_', ' ')}</h3>
                                        <p className="text-[9px] font-black text-brand uppercase tracking-[0.3em] mt-2 italic font-mono">HASH: {selectedLog._id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-3 hover:bg-background rounded-2xl transition-all">
                                    <ChevronDown size={24} className="text-content-subtle" />
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest border-b border-gray-100/5 pb-2">Administrative Context</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-background border border-gray-100/10 flex items-center justify-center">
                                                <User size={18} className="text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-content">{selectedLog.userId?.name}</p>
                                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest">{selectedLog.userId?.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest border-b border-gray-100/5 pb-2">Technical Origin</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Globe size={12} className="text-brand" />
                                                <span className="text-[10px] font-black text-content font-mono">{selectedLog.metadata?.ip || 'SECURE_VPN'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Fingerprint size={12} className="text-content-subtle" />
                                                <span className="text-[8px] font-black text-content-subtle truncate max-w-[150px]">{selectedLog.metadata?.userAgent || 'Browser Node'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest border-b border-gray-100/5 pb-2">Action Delta (Before / After)</p>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-background/50 rounded-2xl p-6 border border-gray-100/5">
                                            <span className="text-[8px] font-black text-red-500 uppercase mb-3 block tracking-widest">PRE-STATE</span>
                                            <pre className="text-[10px] font-mono text-content-subtle overflow-x-auto whitespace-pre-wrap">
                                                {JSON.stringify(selectedLog.oldValue, null, 2) || 'NULL'}
                                            </pre>
                                        </div>
                                        <div className="bg-brand/5 rounded-2xl p-6 border border-brand/10">
                                            <span className="text-[8px] font-black text-green-500 uppercase mb-3 block tracking-widest">POST-STATE</span>
                                            <pre className="text-[10px] font-mono text-content overflow-x-auto whitespace-pre-wrap font-bold">
                                                {JSON.stringify(selectedLog.newValue, null, 2) || 'STABLE'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-background/50 flex items-center justify-between border-t border-gray-100/5">
                                <div className="flex items-center gap-4">
                                    <AlertCircle size={14} className="text-brand" />
                                    <span className="text-[10px] font-black text-content uppercase tracking-widest mt-0.5">Immutable Record Protocol Active</span>
                                </div>
                                <span className="text-[10px] font-mono text-content-subtle opacity-50">{selectedLog.createdAt}</span>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </>
    );
};

export default AdminAuditLogs;
