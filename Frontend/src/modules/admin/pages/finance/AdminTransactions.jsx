import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
import {
    ArrowDownLeft, ArrowUpRight, Search, Filter, RefreshCw,
    Clock, CheckCircle2, XCircle, AlertCircle, User, Users,
    Wallet, Car, CreditCard, TrendingUp, DollarSign, Eye,
    Target, Activity, PieChart, BarChart3, ChevronLeft, ChevronRight, X,
    FileText, Zap, ShieldCheck
} from 'lucide-react';
import PageShell, { SectionCard, FilterBar, SearchBox, PageLoader } from '../../components/PageShell';

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

    const [analyticsData, setAnalyticsData] = useState({
        totalRevenue: 0,
        totalPayouts: 0,
        profitMargin: 0,
        dailyEarnings: []
    });
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('All');
    const [userFilter, setUserFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('transactions');
    const [walletData, setWalletData] = useState([]);
    const [payoutData, setPayoutData] = useState([]);

    useEffect(() => {
        fetchTransactions();
        fetchStats();
        fetchAnalytics();
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
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
                ...(userFilter && { user: userFilter }),
                ...(dateFilter.start && { startDate: dateFilter.start }),
                ...(dateFilter.end && { endDate: dateFilter.end })
            };
            const res = await adminAPI.getTransactions(params);
            if (res.status === 'success') {
                setTransactions(res.data.transactions);
                setPagination(res.data.pagination);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getSettlementStats();
            if (res.status === 'success') setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await adminAPI.getFinancialAnalytics();
            if (res.status === 'success') setAnalyticsData(res.data);
        } catch (err) { console.error(err); }
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
        } catch (err) { console.error(err); }
    };

    const handlePayoutUpdate = async (id, status, utr) => {
        try {
            const res = await adminAPI.updatePayoutStatus(id, { status, utr });
            if (res.status === 'success') {
                setPayoutData(prev => prev.map(p => p._id === id ? { ...p, status } : p));
            }
        } catch (err) { console.error(err); }
    };

    const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

    const getPaymentBreakdown = (transaction) => {
        const breakdown = transaction.breakdown || [];
        const baseAmount = transaction.baseAmount || transaction.amount;
        const extras = breakdown.filter(item => item.type !== 'base');
        return {
            baseAmount,
            extras,
            totalAmount: transaction.amount,
            advancePaid: transaction.advancePaid || 0,
            pendingAmount: (transaction.amount || 0) - (transaction.advancePaid || 0)
        };
    };

    const getTypeColor = (type) => type === 'credit' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} className="text-emerald-500" />;
            case 'pending': return <Clock size={12} className="text-amber-500 animate-pulse" />;
            case 'failed': return <XCircle size={12} className="text-rose-500" />;
            default: return <AlertCircle size={12} className="text-slate-400" />;
        }
    };

    const tabs = [
        { id: 'transactions', label: 'Ledger Feed' },
        { id: 'wallets',      label: 'Wallet Grid' },
        { id: 'payouts',      label: 'Disbursements' },
        { id: 'analytics',    label: 'Risk Audit' }
    ];

    return (
        <PageShell
            title="Financial Command"
            subtitle="Centralized transaction monitoring and settlement gateway"
            icon={CreditCard}
            accent="emerald"
            badge="ECON-v2"
            actions={
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            }
        >
            {/* Control Matrix Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Revenue', value: analyticsData.totalRevenue, icon: TrendingUp,  accent: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' },
                    { label: 'Settlements',  value: stats.pendingWithdrawals,  icon: Clock,       accent: 'bg-amber-50 text-amber-600',   border: 'border-amber-100',   dot: 'bg-amber-500' },
                    { label: 'Driver Payouts',value: analyticsData.totalPayouts, icon: DollarSign,  accent: 'bg-blue-50 text-blue-600',    border: 'border-blue-100',    dot: 'bg-blue-500' },
                    { label: 'Profit Margin', value: `${analyticsData.profitMargin}%`, icon: Target,      accent: 'bg-slate-50 text-slate-600',  border: 'border-slate-100',   dot: 'bg-slate-400' },
                ].map((s, idx) => (
                    <div key={idx} className={`bg-white border ${s.border} rounded-2xl p-6 shadow-sm group hover:shadow-lg transition-all relative overflow-hidden`}>
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                                <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                                    {typeof s.value === 'string' ? s.value : formatCurrency(s.value)}
                                </h4>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${s.accent} flex items-center justify-center shadow-sm`}>
                                <s.icon size={18} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 relative z-10">
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Active</span>
                        </div>
                        <s.icon className="absolute -bottom-4 -right-4 text-slate-100 w-20 h-20 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                    </div>
                ))}
            </div>

            {/* Filter Hub */}
            <FilterBar>
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <SearchBox value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Query ledger / transaction ID / entity..." />
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-11 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <Filter size={16} /> Refine
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchTransactions} className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="adm-btn adm-btn-primary h-11 px-5 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Export Audit
                    </button>
                </div>
            </FilterBar>

            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 mt-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><ShieldCheck size={120} /></div>
                        
                        <div>
                            <label className="adm-label mb-2">Temporal Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({ ...p, start: e.target.value }))} className="adm-input h-11 text-[11px]" />
                                <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({ ...p, end: e.target.value }))} className="adm-input h-11 text-[11px]" />
                            </div>
                        </div>

                        <div>
                            <label className="adm-label mb-2">Protocol Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="adm-input h-11 text-[11px] font-black uppercase">
                                <option value="All">All Signals</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="adm-label mb-2">Channel Type</label>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="adm-input h-11 text-[11px] font-black uppercase">
                                <option value="All">All Channels</option>
                                <option value="Credit">Credits Only</option>
                                <option value="Debit">Debits Only</option>
                                <option value="Withdrawals">Withdrawal Ops</option>
                            </select>
                        </div>

                        <div>
                            <label className="adm-label mb-2">Entity ID</label>
                            <input type="text" placeholder="User hash or name" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="adm-input h-11 text-[11px]" />
                        </div>

                        <div className="lg:col-span-4 flex justify-end pt-4 border-t border-slate-200/60 mt-2">
                            <button onClick={() => { setDateFilter({ start: '', end: '' }); setStatusFilter('All'); setFilterType('All'); setUserFilter(''); }}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all">
                                Neutralize Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Logic */}
            <div className="mt-8">
                {activeTab === 'transactions' && (
                    <SectionCard title="Ledger Registry" noPad>
                        <div className="overflow-x-auto">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Transaction Sequence</th>
                                        <th>Entity Profile</th>
                                        <th>Settlement Breakdown</th>
                                        <th className="text-center">Protocol Status</th>
                                        <th className="text-right">Magnitude</th>
                                        <th className="text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && transactions.length === 0 ? (
                                        [...Array(6)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="6" className="py-8"><div className="h-10 bg-slate-50 rounded-xl w-full" /></td>
                                            </tr>
                                        ))
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6"><EmptyState icon={CreditCard} title="No transaction logs identified" /></td>
                                        </tr>
                                    ) : (
                                        transactions.map((txn) => {
                                            const breakdown = getPaymentBreakdown(txn);
                                            return (
                                                <tr key={txn._id} className="group">
                                                    <td>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getTypeColor(txn.type)}`}>
                                                                {txn.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-800 leading-none mb-1.5 uppercase tracking-tight">
                                                                    {new Date(txn.createdAt).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    ID: {txn._id.slice(-8)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <User size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700 leading-none mb-1.5 uppercase tracking-tight">
                                                                    {txn.user?.name || 'Protocol-Anonymous'}
                                                                </p>
                                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                                    {txn.user?.role || 'External'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                                <span className="text-slate-400 uppercase">Base:</span>
                                                                <span className="text-slate-700">{formatCurrency(breakdown.baseAmount)}</span>
                                                            </div>
                                                            {breakdown.extras.length > 0 && (
                                                                <div className="flex items-center justify-between text-[10px] font-black">
                                                                    <span className="text-slate-400 uppercase">Extras:</span>
                                                                    <span className="text-amber-600">+{formatCurrency(breakdown.extras.reduce((sum, item) => sum + item.amount, 0))}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {getStatusIcon(txn.status)}
                                                            <span className={`adm-badge ${
                                                                txn.status === 'completed' ? 'adm-badge-success' :
                                                                txn.status === 'pending' ? 'adm-badge-warning' : 'adm-badge-error'
                                                            }`}>
                                                                {txn.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="text-base font-black text-slate-900 tracking-tighter">
                                                            {txn.type === 'debit' ? '-' : '+'}{formatCurrency(txn.amount)}
                                                        </div>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => setSelectedTxn(txn)}
                                                            className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.page} of {pagination.pages}
                            </p>
                            <div className="flex gap-2">
                                <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={18} /></button>
                                <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </SectionCard>
                )}

                {activeTab === 'wallets' && (
                    <SectionCard title="Wallet Management System" noPad>
                        <div className="overflow-x-auto">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Entity Identity</th>
                                        <th className="text-center">Live Balance</th>
                                        <th className="text-center">Lifecycle Velocity</th>
                                        <th className="text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {walletData.map((wallet) => (
                                        <tr key={wallet.userId} className="group">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><Wallet size={18} /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 leading-none mb-1.5 uppercase tracking-tight">{wallet.user?.name || 'Protocol-Anonymous'}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wallet.user?.phone || 'UNLINKED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-xl font-black text-slate-900 tracking-tighter">{formatCurrency(wallet.balance || 0)}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px]">
                                                        <ArrowDownLeft size={12} /> +{formatCurrency(wallet.totalCredits || 0)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-rose-600 font-black text-[10px]">
                                                        <ArrowUpRight size={12} /> -{formatCurrency(wallet.totalDebits || 0)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button onClick={() => setSelectedTxn(wallet)} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"><Eye size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {activeTab === 'payouts' && (
                    <SectionCard title="Driver Settlement Grid" noPad>
                        <div className="overflow-x-auto">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Contractor Identity</th>
                                        <th className="text-center">Earnings Matrix</th>
                                        <th className="text-center">Settlement Status</th>
                                        <th className="text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutData.map((payout) => (
                                        <tr key={payout._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Car size={18} /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 leading-none mb-1.5 uppercase tracking-tight">{payout.driver?.name || 'Protocol-Anonymous'}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payout.driver?.phone || 'UNLINKED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-xl font-black text-slate-900 tracking-tighter">{formatCurrency(payout.amount || 0)}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`adm-badge ${payout.status === 'completed' ? 'adm-badge-success' : 'adm-badge-warning'}`}>{payout.status}</div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {payout.status === 'pending' && (
                                                        <button onClick={() => { const utrRef = prompt('Enter UTR Hash:'); if (utrRef) handlePayoutUpdate(payout._id, 'completed', utrRef); }} className="adm-btn adm-btn-success h-9 px-3 text-[9px] font-black uppercase">Authorize</button>
                                                    )}
                                                    <button onClick={() => setSelectedTxn(payout)} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"><Eye size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SectionCard title="Revenue Distribution" icon={PieChart}>
                                <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                                    <PieChart size={32} className="text-slate-200" />
                                </div>
                            </SectionCard>
                            <SectionCard title="Performance Trajectory" icon={BarChart3}>
                                <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                                    <Activity size={32} className="text-slate-200" />
                                </div>
                            </SectionCard>
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Risk Audit: STABLE</p>
                                <h3 className="text-3xl font-black tracking-tighter mb-2">94.2%</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">System Health Index</p>
                                <ShieldCheck className="absolute -bottom-6 -right-6 text-white w-24 h-24 opacity-10" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Inspector Modal */}
            <AnimatePresence>
                {selectedTxn && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTxn(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10">
                            <div className="bg-slate-900 p-8 text-white">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Activity size={20} /></div>
                                        <h3 className="text-xl font-black tracking-tighter uppercase">Audit Intel</h3>
                                    </div>
                                    <button onClick={() => setSelectedTxn(null)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20} /></button>
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-2">{formatCurrency(selectedTxn.amount)}</div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Hash: {selectedTxn._id}</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                                    <div className="flex justify-between text-[11px] font-black uppercase">
                                        <span className="text-slate-400">Identity:</span> <span className="text-slate-800">{selectedTxn.user?.name || 'ROOT'}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase">
                                        <span className="text-slate-400">Timestamp:</span> <span className="text-slate-800">{new Date(selectedTxn.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase">
                                        <span className="text-slate-400">Category:</span> <span className="text-slate-800">{selectedTxn.category || 'GENERAL'}</span>
                                    </div>
                                </div>

                                {selectedTxn.status === 'pending' && (
                                    <div className="space-y-4">
                                        <input type="text" placeholder="UTR Reference" value={utr} onChange={e => setUtr(e.target.value)} className="adm-input" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handleStatusUpdate(selectedTxn._id, 'completed')} className="adm-btn adm-btn-success h-12 uppercase font-black text-[11px]">Approve</button>
                                            <button onClick={() => handleStatusUpdate(selectedTxn._id, 'rejected')} className="adm-btn adm-btn-error h-12 uppercase font-black text-[11px]">Reject</button>
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => setSelectedTxn(null)} className="w-full h-12 rounded-2xl bg-slate-900 text-white uppercase font-black text-[11px] tracking-widest hover:bg-slate-800 transition-all">Close Portal</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

const EmptyState = ({ icon: Icon, title }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
            <Icon size={40} strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
);

export default AdminTransactions;
