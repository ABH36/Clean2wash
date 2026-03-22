import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Search,
    Filter,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    ChevronDown,
    User,
    Shield
} from 'lucide-react';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ pendingWithdrawals: 0, totalSettled: 0, platformVolume: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [utr, setUtr] = useState('');
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetchTransactions();
        fetchStats();
    }, [pagination.page, filterType]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: 15,
                ...(filterType === 'Credit' && { type: 'credit' }),
                ...(filterType === 'Debit' && { type: 'debit' }),
                ...(filterType === 'Withdrawals' && { category: 'WITHDRAWAL' }),
                ...(searchQuery && { search: searchQuery })
            };
            const res = await adminAPI.getTransactions(params);
            if (res.status === 'success') {
                setTransactions(res.data.transactions);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getSettlementStats();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await adminAPI.updateTransactionStatus(id, newStatus, adminNote, utr);
            if (res.status === 'success') {
                setTransactions(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
                fetchStats();
                setSelectedTxn(null);
                setUtr('');
                setAdminNote('');
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const getTypeColor = (type) => {
        return type === 'credit' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} className="text-green-500" />;
            case 'pending': return <Clock size={12} className="text-orange-500 animate-pulse" />;
            case 'failed': return <XCircle size={12} className="text-red-500" />;
            default: return <AlertCircle size={12} className="text-content-subtle" />;
        }
    };

    return (
        <>
            <div className="space-y-6">

                {/* ── Transaction Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2">Pending Settlements</p>
                        <h3 className="text-3xl font-black text-content tracking-tighter text-orange-500">₹{stats.pendingWithdrawals?.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Awaiting Admin Action</span>
                        </div>
                    </div>
                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2">Total Settled</p>
                        <h3 className="text-3xl font-black text-content tracking-tighter text-green-500">₹{stats.totalSettled?.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Successfully Disbursed</span>
                        </div>
                    </div>
                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2">Platform Volume</p>
                        <h3 className="text-3xl font-black text-content tracking-tighter">₹{stats.platformVolume?.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <RefreshCw size={12} className="text-brand" />
                            <span className="text-[8px] font-black text-content-subtle uppercase tracking-widest">Lifetime Transaction Throughput</span>
                        </div>
                    </div>
                </div>

                {/* ── Controls Bar ── */}
                <div className="bg-surface rounded-[2rem] p-4 border border-gray-100/10 shadow-soft flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={18} />
                        <input
                            type="text"
                            placeholder="Find transaction by ID, description, or protocol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                            className="w-full bg-background border border-gray-100/10 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-background p-1 rounded-xl border border-gray-100/10">
                            {['All', 'Credit', 'Debit', 'Withdrawals'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'text-content-subtle hover:text-content'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <button onClick={fetchTransactions} className="p-3 bg-background border border-gray-100/10 rounded-xl text-content-subtle hover:text-brand transition-all active:scale-95">
                            <RefreshCw size={18} className={loading ? 'animate-spin text-brand' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── Grid View ────────────────────────────────────────────── */}
                <div className="bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden">
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead className="bg-background/80 border-b border-gray-100/5">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Temporal Node</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">User Entity</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Fiscal Action</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/5">
                                {loading && transactions.length === 0 ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-6 h-20 bg-background/20" />
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">No Transactions Found in Current Buffer</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((txn, i) => (
                                        <tr
                                            key={txn._id}
                                            onClick={() => setSelectedTxn(txn)}
                                            className="hover:bg-background/50 transition-all cursor-pointer group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${getTypeColor(txn.type)}`}>
                                                        {txn.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-content tracking-tight">{new Date(txn.createdAt).toLocaleDateString()}</span>
                                                        <p className="text-[8px] font-bold text-content-subtle mt-1 uppercase tracking-widest font-mono">{txn._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center">
                                                        <User size={14} className="text-content-subtle group-hover:text-brand transition-colors" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-content">{txn.user?.name || 'Unknown Entity'}</span>
                                                        <p className="text-[8px] font-black text-brand uppercase mt-1 tracking-widest">{txn.user?.role || 'Guest'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="max-w-[200px]">
                                                    <span className="text-[10px] font-black text-content uppercase leading-tight truncate block">{txn.description}</span>
                                                    <p className="text-[8px] font-bold text-content-subtle mt-1 uppercase tracking-[0.1em]">{txn.category.replace('_', ' ')}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(txn.status)}
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${txn.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                        {txn.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-base font-black text-content text-right tracking-tighter">
                                                {txn.type === 'debit' ? '-' : '+'}₹{txn.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination ── */}
                <div className="p-6 bg-background/50 border-t border-gray-100/5 flex items-center justify-between">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">
                        Showing {transactions.length} of {pagination.total} fiscal nodes
                    </p>
                    <div className="flex items-center gap-1">
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${pagination.page === i + 1 ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'bg-surface text-content-subtle hover:text-content'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Inspector Modal ────────────────────────────────────────────── */}
            < AnimatePresence >
                {selectedTxn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 lg:pb-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTxn(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface w-full max-w-md rounded-[2.5rem] border border-gray-100/10 shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-8 border-b border-gray-100/10 bg-background/30">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 ${getTypeColor(selectedTxn.type)}`}>
                                        <Shield size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Transaction Audit</span>
                                    </div>
                                    <button onClick={() => setSelectedTxn(null)} className="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-content-subtle hover:text-content transition-colors">
                                        <refreshCw size={14} className="rotate-45" />
                                    </button>
                                </div>
                                <h3 className="text-2xl font-black text-content leading-none tracking-tighter mb-2">{selectedTxn.description}</h3>
                                <p className="text-[9px] font-black text-brand uppercase tracking-[0.3em] font-mono">REF: {selectedTxn._id}</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Fiscal Value</p>
                                        <p className="text-xl font-black text-content tracking-tighter">₹{selectedTxn.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Action Protocol</p>
                                        <p className="text-xl font-black text-content tracking-tighter uppercase">{selectedTxn.type}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-background rounded-2xl p-4 border border-gray-100/10 shadow-inner">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-gray-100/10">
                                                <User size={18} className="text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-content leading-none mb-1">{selectedTxn.user?.name}</p>
                                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">{selectedTxn.user?.email || selectedTxn.user?.phone}</p>
                                            </div>
                                        </div>

                                        {selectedTxn.category === 'WITHDRAWAL' && selectedTxn.user?.bankDetails && (
                                            <div className="mb-4 pt-4 border-t border-gray-100/5 space-y-2">
                                                <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-2">Destination Bank Account</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[7px] text-content-subtle uppercase font-bold">Holder</p>
                                                        <p className="text-[10px] font-black text-content">{selectedTxn.user.bankDetails.accountName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] text-content-subtle uppercase font-bold">IFSC</p>
                                                        <p className="text-[10px] font-black text-content">{selectedTxn.user.bankDetails.ifscCode || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[7px] text-content-subtle uppercase font-bold">Account Number</p>
                                                        <p className="text-[10px] font-black text-content font-mono tracking-wider">{selectedTxn.user.bankDetails.accountNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <span className="text-[7px] font-black text-content-subtle uppercase tracking-widest">Temporal Stamp:</span>
                                            <span className="text-[8px] font-bold text-content">{new Date(selectedTxn.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {selectedTxn.status === 'pending' && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 block px-1">Transaction Note (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={adminNote}
                                                    onChange={e => setAdminNote(e.target.value)}
                                                    placeholder="e.g. Verified by finance"
                                                    className="w-full bg-background border border-gray-100/10 rounded-xl px-4 py-3 text-xs font-bold text-content outline-none focus:border-brand"
                                                />
                                            </div>
                                            {selectedTxn.category === 'WITHDRAWAL' && (
                                                <div>
                                                    <label className="text-[8px] font-black text-brand uppercase tracking-widest mb-1 block px-1">Bank UTR / Reference ID</label>
                                                    <input
                                                        type="text"
                                                        value={utr}
                                                        onChange={e => setUtr(e.target.value)}
                                                        placeholder="Enter Bank Ref Number"
                                                        className="w-full bg-background border border-brand/20 rounded-xl px-4 py-3 text-xs font-black text-content outline-none focus:border-brand"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">Administrative Override</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['pending', 'completed', 'rejected'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusUpdate(selectedTxn._id, status)}
                                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedTxn.status === status ? 'bg-content text-white shadow-xl' : 'bg-background text-content-subtle hover:bg-gray-100 hover:text-content'}`}
                                                >
                                                    {status === 'completed' && selectedTxn.category === 'WITHDRAWAL' ? 'Settle' : status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </>
    );
};

export default AdminTransactions;
