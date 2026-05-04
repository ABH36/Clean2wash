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
        <div className="space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shrink-0"><Shield size={22} /></div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Audit Logs</h1>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{pagination.total?.toLocaleString()} logged actions · Immutable record</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Throughput</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{pagination.total?.toLocaleString() || 0} <span className="text-sm text-amber-500 font-bold">Logged Actions</span></h3>
                    </div>
                    <div className="flex gap-6">
                        {stats.slice(0, 3).map((s, i) => (
                            <div key={i} className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[100px]">{s._id?.replace('_', ' ')}</p>
                                <p className="text-lg font-black text-slate-800">{s.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group shadow-xl">
                    <Activity className="absolute -right-3 -top-3 w-20 h-20 text-white/5 group-hover:scale-110 transition-transform" />
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">System Status</p>
                    <h4 className="text-lg font-black text-white">PROT-ACTIVE</h4>
                    <div className="flex items-center gap-1.5 mt-1"><span className="adm-live-dot" /><span className="text-[9px] font-bold text-white/40 uppercase">Watcher Live</span></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:bg-white transition-all">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input type="text" placeholder="Search by action or resource..." className="bg-transparent outline-none text-[12px] font-medium text-slate-700 w-full placeholder:text-slate-400" value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} />
                </div>
                <select className="adm-input adm-select text-[11px] w-auto py-2" value={filters.resource} onChange={e => setFilters(p => ({ ...p, resource: e.target.value }))}>
                    <option value="">All Resources</option>
                    <option value="Setting">Settings</option>
                    <option value="WalletTransaction">Transactions</option>
                    <option value="Booking">Bookings</option>
                </select>
                <button onClick={fetchLogs} className="adm-btn adm-btn-ghost adm-btn-sm">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Time</th><th>Admin</th><th>Action</th><th>Resource</th><th className="text-right">Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}><td colSpan="5" className="px-6 py-4"><div className="adm-skeleton h-8 w-full rounded-xl" /></td></tr>
                        )) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-16 text-center">
                                <Fingerprint size={40} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No logs found</p>
                            </td></tr>
                        ) : logs.map(log => (
                            <tr key={log._id} onClick={() => setSelectedLog(log)} className="cursor-pointer">
                                <td>
                                    <p className="text-[11px] font-black text-slate-800">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                    <p className="text-[9px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td>
                                    <p className="text-[11px] font-bold text-slate-800">{log.userId?.name || 'ROOT'}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">{log.userId?.role || 'SYSTEM'}</p>
                                </td>
                                <td><span className={`adm-badge ${getActionColor(log.action)}`}>{log.action.replace('_', ' ')}</span></td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Database size={11} className="text-slate-400" />
                                        <span className="text-[11px] font-black text-slate-700 uppercase">{log.resource}</span>
                                        <span className="text-[9px] font-mono text-slate-400">#{log.resourceId?.slice(-6).toUpperCase()}</span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <button className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-all ml-auto">
                                        <Eye size={13} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400">Page {page} of {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="adm-btn adm-btn-ghost adm-btn-sm disabled:opacity-40">← Prev</button>
                        <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="adm-btn adm-btn-ghost adm-btn-sm disabled:opacity-40">Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Log Inspector Modal ───────────────────────────────────────────────
const LogModal = ({ log, onClose }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-2xl rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Terminal size={18} /></div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{log.action.replace('_', ' ')}</h3>
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono">ID: {log._id}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronDown size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin</p>
                        <p className="text-sm font-bold text-slate-800">{log.userId?.name || 'ROOT'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{log.userId?.role || 'SYSTEM'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Origin IP</p>
                        <p className="text-sm font-bold text-slate-800 font-mono">{log.metadata?.ip || 'SECURE'}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{log.metadata?.userAgent?.slice(0,30) || 'Browser'}</p>
                    </div>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />State Delta</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                            <span className="text-[8px] font-black text-red-500 uppercase mb-2 block">Pre-State</span>
                            <pre className="text-[10px] font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.oldValue, null, 2) || 'NULL'}</pre>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                            <span className="text-[8px] font-black text-emerald-600 uppercase mb-2 block">Post-State</span>
                            <pre className="text-[10px] font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2) || 'STABLE'}</pre>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><AlertCircle size={12} className="text-amber-500" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Immutable Record</span></div>
                <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
        </motion.div>
    </div>
);

export default AdminAuditLogs;

