import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
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
    User,
    Users,
    Wallet,
    Car,
    CreditCard,
    TrendingUp,
    DollarSign,
    Eye,
    Target,
    Activity,
    PieChart,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    X
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

    // Enhanced State for Transaction Features
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
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [activeTab, setActiveTab] = useState('transactions');
    const [walletData, setWalletData] = useState([]);
    const [payoutData, setPayoutData] = useState([]);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [selectedPayout, setSelectedPayout] = useState(null);

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

    const fetchAnalytics = async () => {
        try {
            const res = await adminAPI.getFinancialAnalytics();
            if (res.status === 'success') {
                setAnalyticsData(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
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

    const handlePayoutUpdate = async (id, status, utr) => {
        try {
            const res = await adminAPI.updatePayoutStatus(id, { status, utr });
            if (res.status === 'success') {
                setPayoutData(prev => prev.map(p => p._id === id ? { ...p, status } : p));
            }
        } catch (err) {
            console.error("Failed to update payout:", err);
        }
    };

    const handlePricingUpdate = async () => {
        // Logic for pricing update would go here
        setShowPricingModal(false);
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString() || 0}`;
    };

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

    const getTypeColor = (type) => {
        return type === 'credit' ? 'text-[var(--success)] bg-[var(--success-light)]' : 'text-[var(--error)] bg-[var(--error-light)]';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} className="text-[var(--success)]" />;
            case 'pending': return <Clock size={12} className="text-[var(--warning)] animate-pulse" />;
            case 'failed': return <XCircle size={12} className="text-[var(--error)]" />;
            default: return <AlertCircle size={12} className="text-[var(--text-muted)]" />;
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="admin-card">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Payments & Transactions</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">Financial Control System</p>
                            </div>
                        </div>

                        <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]">
                            {[
                                { id: 'transactions', label: 'Recent Activity' },
                                { id: 'wallets', label: 'Wallet System' },
                                { id: 'payouts', label: 'Driver Payouts' },
                                { id: 'analytics', label: 'Risk & Margins' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-brand text-white shadow-lg'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--success-light)] text-[var(--success-text)] rounded-xl flex items-center justify-center">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Revenue</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(analyticsData.totalRevenue)}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Platform Earnings</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--warning-light)] text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Pending Settlements</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.pendingWithdrawals)}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Awaiting Processing</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Payouts</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(analyticsData.totalPayouts)}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Driver Earnings</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                                <Target size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Profit Margin</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{analyticsData.profitMargin}%</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Net Margin</span>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filters */}
                <div className="admin-card">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-brand transition-all">
                            <Search className="text-[var(--text-muted)] group-focus-within:text-brand" size={16} />
                            <input
                                type="text"
                                placeholder="Search by transaction ID, user, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                                className="bg-transparent outline-none text-sm text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`h-11 px-6 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    showFilters 
                                        ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--card)]'
                                }`}
                            >
                                <Filter size={18} />
                                Filters
                            </button>

                            <button 
                                onClick={fetchTransactions} 
                                className="w-11 h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-brand hover:border-brand/40 transition-all flex items-center justify-center"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin text-brand' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-[var(--border)]"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Date Range</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={dateFilter.start}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                                                className="admin-input text-xs"
                                            />
                                            <input
                                                type="date"
                                                value={dateFilter.end}
                                                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                                                className="admin-input text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="admin-select"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Failed">Failed</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Transaction Type</label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="admin-select"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Credit">Credit</option>
                                            <option value="Debit">Debit</option>
                                            <option value="Withdrawals">Withdrawals</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">User Filter</label>
                                        <input
                                            type="text"
                                            placeholder="User name or ID"
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                            className="admin-input"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => {
                                            setDateFilter({ start: '', end: '' });
                                            setStatusFilter('All');
                                            setFilterType('All');
                                            setUserFilter('');
                                        }}
                                        className="text-xs font-medium text-[var(--error)] uppercase tracking-wide hover:underline"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Transactions Table */}
                {activeTab === 'transactions' && (
                    <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Transaction Info</th>
                                    <th>User Details</th>
                                    <th>Payment Breakdown</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && transactions.length === 0 ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-6 py-6 h-20 bg-[var(--bg-secondary)]" />
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <CreditCard size={48} className="text-[var(--text-muted)]" />
                                                <p className="text-sm font-medium text-[var(--text-secondary)]">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((txn) => {
                                        const breakdown = getPaymentBreakdown(txn);
                                        return (
                                            <tr key={txn._id}>
                                                {/* Transaction Info */}
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(txn.type)}`}>
                                                            {txn.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1">
                                                                {new Date(txn.createdAt).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                                ID: {txn._id.slice(-8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* User Details */}
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                                                            <User size={14} className="text-[var(--text-secondary)]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1">
                                                                {txn.user?.name || 'Unknown User'}
                                                            </p>
                                                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide">
                                                                {txn.user?.role || 'Guest'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Payment Breakdown */}
                                                <td>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium text-[var(--text-secondary)]">Base:</span>
                                                            <span className="text-xs font-semibold text-[var(--text-primary)]">{formatCurrency(breakdown.baseAmount)}</span>
                                                        </div>
                                                        {breakdown.extras.length > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-[var(--text-secondary)]">Extras:</span>
                                                                <span className="text-xs font-semibold text-[var(--warning)]">
                                                                    +{formatCurrency(breakdown.extras.reduce((sum, item) => sum + item.amount, 0))}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {breakdown.advancePaid > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-[var(--success)]">Paid:</span>
                                                                <span className="text-xs font-semibold text-[var(--success)]">{formatCurrency(breakdown.advancePaid)}</span>
                                                            </div>
                                                        )}
                                                        {breakdown.pendingAmount > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-[var(--error)]">Pending:</span>
                                                                <span className="text-xs font-semibold text-[var(--error)]">{formatCurrency(breakdown.pendingAmount)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {getStatusIcon(txn.status)}
                                                        <span className={`badge ${
                                                            txn.status === 'completed' ? 'badge-success' :
                                                            txn.status === 'pending' ? 'badge-warning' :
                                                            'badge-error'
                                                        }`}>
                                                            {txn.status}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="text-right">
                                                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                        {txn.type === 'debit' ? '-' : '+'}{formatCurrency(txn.amount)}
                                                    </div>
                                                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                                                        {txn.category.replace('_', ' ')}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => setSelectedPayment(txn)}
                                                        className="w-11 h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-brand transition-all flex items-center justify-center mx-auto"
                                                    >
                                                        <Eye size={18} />
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
                    <div className="px-6 py-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-between">
                        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                            Showing {transactions.length} of {pagination.total || 0} transactions
                        </p>                         <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-brand disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-all flex items-center justify-center"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs font-black text-[var(--text-primary)]">
                                {pagination.page} / {pagination.pages || 1}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
                                disabled={pagination.page === pagination.pages}
                                className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-brand disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-all flex items-center justify-center"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                )}

                {/* Wallet Management Tab */}
                {activeTab === 'wallets' && (
                    <div className="bg-white/5 rounded-2xl border border-white/5 shadow-soft overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-black text-content uppercase tracking-wide mb-2">Wallet Management System</h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest">User Wallet Balances & Transaction History</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest">User Info</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Wallet Balance</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Recent Activity</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Overtime Deductions</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {walletData.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Wallet size={48} className="text-gray-300" />
                                                    <p className="text-sm font-bold text-content-subtle">No wallet data available</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        walletData.map((wallet) => (
                                            <tr key={wallet.userId} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <Wallet size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-content leading-none mb-1">
                                                                {wallet.user?.name || 'Unknown User'}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                                                                {wallet.user?.phone || 'No phone'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-xl font-black text-content">
                                                            {formatCurrency(wallet.balance || 0)}
                                                        </div>
                                                        <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                                                            (wallet.balance || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-white/[0.05] text-white/60'
                                                        }`}>
                                                            {(wallet.balance || 0) > 0 ? 'Active' : 'Empty'}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <ArrowDownLeft size={12} className="text-green-500" />
                                                            <span className="text-[10px] font-bold text-green-600">
                                                                +{formatCurrency(wallet.totalCredits || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <ArrowUpRight size={12} className="text-red-500" />
                                                            <span className="text-[10px] font-bold text-red-600">
                                                                -{formatCurrency(wallet.totalDebits || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-orange-600">
                                                            {formatCurrency(wallet.overtimeDeductions || 0)}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">
                                                            {wallet.overtimeCount || 0} Instances
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedWallet(wallet)}
                                                        className="w-8 h-8 bg-white/[0.05] hover:bg-brand hover:text-white rounded-lg flex items-center justify-center transition-all"
                                                    >
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
                )}

                {/* Driver Payouts Tab */}
                {activeTab === 'payouts' && (
                    <div className="bg-white/5 rounded-2xl border border-white/5 shadow-soft overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-black text-content uppercase tracking-wide mb-2">Driver Payout Management</h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest">Driver Earnings & Settlement Processing</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest">Driver Info</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Earnings</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Payout Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">UTR Reference</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-content-subtle uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payoutData.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users size={48} className="text-gray-300" />
                                                    <p className="text-sm font-bold text-content-subtle">No payout data available</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        payoutData.map((payout) => (
                                            <tr key={payout._id} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                                            <Car size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-content leading-none mb-1">
                                                                {payout.driver?.name || 'Unknown Driver'}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                                                                {payout.driver?.phone || 'No phone'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-xl font-black text-content">
                                                            {formatCurrency(payout.amount || 0)}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">
                                                            {payout.tripsCount || 0} Trips
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {payout.status === 'completed' ? (
                                                            <CheckCircle2 size={12} className="text-green-500" />
                                                        ) : (
                                                            <Clock size={12} className="text-orange-500" />
                                                        )}
                                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                                                            payout.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                            {payout.status}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-[10px] font-bold text-content font-mono">
                                                        {payout.utr || 'Not Available'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {payout.status === 'pending' && (
                                                            <button
                                                                onClick={() => {
                                                                    const utrRef = prompt('Enter UTR Reference:');
                                                                    if (utrRef) {
                                                                        handlePayoutUpdate(payout._id, 'completed', utrRef);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded hover:bg-green-200 transition-all"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setSelectedTxn(payout)}
                                                            className="w-8 h-8 bg-white/[0.05] hover:bg-brand hover:text-white rounded-lg flex items-center justify-center transition-all"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Financial Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-soft">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Daily Revenue</p>
                                        <h3 className="text-2xl font-black text-content tracking-tight">
                                            {formatCurrency(analyticsData.dailyRevenue || 0)}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-[8px] font-black text-green-600 uppercase tracking-widest">
                                    +12% from yesterday
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-soft">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Active Transactions</p>
                                        <h3 className="text-2xl font-black text-content tracking-tight">
                                            {analyticsData.activeTransactions || 0}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-[8px] font-black text-blue-600 uppercase tracking-widest">
                                    Real-time processing
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-soft">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                        <PieChart size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Commission Rate</p>
                                        <h3 className="text-2xl font-black text-content tracking-tight">
                                            {analyticsData.commissionRate || 15}%
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-[8px] font-black text-purple-600 uppercase tracking-widest">
                                    Platform average
                                </div>
                            </div>
                        </div>

                        {/* Daily Earnings Chart Placeholder */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-soft">
                            <h3 className="text-lg font-black text-content uppercase tracking-wide mb-4">Daily Earnings Trend</h3>
                            <div className="h-64 bg-white/[0.02] rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-content-subtle">Chart visualization would be implemented here</p>
                                    <p className="text-[10px] text-content-subtle mt-1">Integration with charting library required</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Payment Breakdown Modal */}
            <AnimatePresence>
                {selectedPayment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPayment(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="admin-card w-full max-w-2xl relative z-10 overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div>
                                    <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Payment Breakdown</h2>
                                    <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mt-1">Transaction Analysis</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedPayment(null)} 
                                    className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Payment Breakdown */}
                                <div className="admin-card-compact">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Payment Structure</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-[var(--text-primary)]">Base Amount</span>
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(getPaymentBreakdown(selectedPayment).baseAmount)}</span>
                                        </div>

                                        {getPaymentBreakdown(selectedPayment).extras.map((extra, index) => (
                                            <div key={index} className="flex items-center justify-between py-2 border-t border-[var(--border-light)]">
                                                <span className="text-sm font-medium text-[var(--text-primary)]">{extra.name || `Extra ${index + 1}`}</span>
                                                <span className="text-sm font-semibold text-[var(--warning)]">+{formatCurrency(extra.amount)}</span>
                                            </div>
                                        ))}

                                        <div className="border-t-2 border-[var(--border)] pt-3 mt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-semibold text-[var(--text-primary)]">Total Amount</span>
                                                <span className="text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(selectedPayment.amount)}</span>
                                            </div>
                                        </div>

                                        {getPaymentBreakdown(selectedPayment).advancePaid > 0 && (
                                            <>
                                                <div className="flex items-center justify-between py-2 border-t border-[var(--border-light)]">
                                                    <span className="text-sm font-medium text-[var(--success)]">Advance Paid</span>
                                                    <span className="text-sm font-semibold text-[var(--success)]">{formatCurrency(getPaymentBreakdown(selectedPayment).advancePaid)}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm font-medium text-[var(--error)]">Pending Amount</span>
                                                    <span className="text-sm font-semibold text-[var(--error)]">{formatCurrency(getPaymentBreakdown(selectedPayment).pendingAmount)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* User Information */}
                                <div className="admin-card-compact">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">User Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">Name</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedPayment.user?.name || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">Phone</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedPayment.user?.phone || 'Not available'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pricing Configuration Modal */}
            <AnimatePresence>
                {showPricingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPricingModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white/5 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-white/5"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h2 className="text-xl font-black text-content uppercase tracking-tight leading-none">Dynamic Pricing Configuration</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">Platform Pricing Controls</p>
                                </div>
                                <button 
                                    onClick={() => setShowPricingModal(false)} 
                                    className="w-10 h-10 bg-white/5 hover:bg-white/[0.05] rounded-xl border border-white/10 text-content-subtle transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block">Base Price (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingConfig.basePrice}
                                            onChange={(e) => setPricingConfig(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block">Per KM Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingConfig.perKmRate}
                                            onChange={(e) => setPricingConfig(prev => ({ ...prev, perKmRate: Number(e.target.value) }))}
                                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block">Per Minute Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingConfig.perMinRate}
                                            onChange={(e) => setPricingConfig(prev => ({ ...prev, perMinRate: Number(e.target.value) }))}
                                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block">Scheduled Premium (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingConfig.scheduledPremium}
                                            onChange={(e) => setPricingConfig(prev => ({ ...prev, scheduledPremium: Number(e.target.value) }))}
                                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Surge Pricing */}
                                <div className="bg-orange-50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-content uppercase tracking-wide">Surge Pricing</h3>
                                        <button
                                            onClick={() => setPricingConfig(prev => ({ ...prev, surgeEnabled: !prev.surgeEnabled }))}
                                            className={`w-12 h-6 rounded-full relative transition-all ${pricingConfig.surgeEnabled ? 'bg-brand' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white/5 rounded-full  transition-all ${pricingConfig.surgeEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    
                                    {pricingConfig.surgeEnabled && (
                                        <div>
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-2 block">Surge Multiplier</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={pricingConfig.surgeMultiplier}
                                                onChange={(e) => setPricingConfig(prev => ({ ...prev, surgeMultiplier: Number(e.target.value) }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowPricingModal(false)}
                                        className="flex-1 py-3 bg-white/[0.05] text-content rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePricingUpdate}
                                        className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-brand/90 transition-all"
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Enhanced Transaction Inspector Modal */}
            <AnimatePresence>
                {selectedTxn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTxn(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white/5 w-full max-w-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 ${getTypeColor(selectedTxn.type)}`}>
                                        <Shield size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Transaction Audit</span>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedTxn(null)} 
                                        className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-content transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <h3 className="text-2xl font-black text-content leading-none tracking-tighter mb-2">{selectedTxn.description}</h3>
                                <p className="text-[9px] font-black text-brand uppercase tracking-[0.3em] font-mono">REF: {selectedTxn._id}</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Amount</p>
                                        <p className="text-xl font-black text-content tracking-tighter">{formatCurrency(selectedTxn.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Type</p>
                                        <p className="text-xl font-black text-content tracking-tighter uppercase">{selectedTxn.type}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                                <User size={18} className="text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-content leading-none mb-1">{selectedTxn.user?.name}</p>
                                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest">{selectedTxn.user?.email || selectedTxn.user?.phone}</p>
                                            </div>
                                        </div>

                                        {selectedTxn.category === 'WITHDRAWAL' && selectedTxn.user?.bankDetails && (
                                            <div className="mb-4 pt-4 border-t border-white/5 space-y-2">
                                                <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-2">Bank Account Details</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[7px] text-content-subtle uppercase font-bold">Account Holder</p>
                                                        <p className="text-[10px] font-black text-content">{selectedTxn.user.bankDetails.accountName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] text-content-subtle uppercase font-bold">IFSC Code</p>
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
                                            <span className="text-[7px] font-black text-content-subtle uppercase tracking-widest">Date:</span>
                                            <span className="text-[8px] font-bold text-content">{new Date(selectedTxn.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {selectedTxn.status === 'pending' && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1 block px-1">Admin Note (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={adminNote}
                                                    onChange={e => setAdminNote(e.target.value)}
                                                    placeholder="e.g. Verified by finance team"
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-content outline-none focus:border-brand"
                                                />
                                            </div>
                                            {selectedTxn.category === 'WITHDRAWAL' && (
                                                <div>
                                                    <label className="text-[8px] font-black text-brand uppercase tracking-widest mb-1 block px-1">UTR Reference</label>
                                                    <input
                                                        type="text"
                                                        value={utr}
                                                        onChange={e => setUtr(e.target.value)}
                                                        placeholder="Enter Bank Reference Number"
                                                        className="w-full bg-white/[0.02] border border-brand/20 rounded-xl px-4 py-3 text-xs font-black text-content outline-none focus:border-brand"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">Admin Actions</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['pending', 'completed', 'rejected'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusUpdate(selectedTxn._id, status)}
                                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        selectedTxn.status === status 
                                                            ? 'bg-brand text-white shadow-lg' 
                                                            : 'bg-white/[0.05] text-content-subtle hover:bg-gray-200 hover:text-content'
                                                    }`}
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
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminTransactions;
