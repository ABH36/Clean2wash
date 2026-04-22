import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Search,
    RefreshCw,
    Eye,
    Plus,
    Minus,
    User,
    TrendingUp,
    Clock
} from 'lucide-react';

const AdminWalletSystem = () => {
    const [activeTab, setActiveTab] = useState('wallets'); // 'wallets' or 'withdrawals'
    const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
    const [processingWithdrawal, setProcessingWithdrawal] = useState(null);
    const [payoutModal, setPayoutModal] = useState(false);
    const [payoutData, setPayoutData] = useState({ utr: '', note: '' });
    
    // Wallet Registry State
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalBalance: 0,
        totalUsers: 0,
        pendingWithdrawals: 0,
        totalWithdrawn: 0
    });
    
    // Adjustment Modal State
    const [adjustmentModal, setAdjustmentModal] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        type: 'CREDIT',
        amount: '',
        reason: ''
    });

    useEffect(() => {
        if (activeTab === 'wallets') {
            fetchWallets();
            fetchStats();
        } else {
            fetchPendingWithdrawals();
        }
    }, [filterType, activeTab]);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const params = {
                ...(filterType !== 'All' && { userType: filterType.toLowerCase() }),
                ...(searchQuery && { search: searchQuery })
            };
            const res = await adminAPI.getWallets(params);
            if (res.status === 'success') {
                setWallets(res.data.wallets || []);
            }
        } catch (err) {
            console.error("Failed to fetch wallets:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getTransactions({ 
                category: 'WITHDRAWAL', 
                status: 'pending',
                limit: 50 
            });
            if (res.status === 'success') {
                setPendingWithdrawals(res.data.transactions || []);
            }
        } catch (err) {
            console.error("Failed to fetch withdrawals:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getWalletStats();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch wallet stats:", err);
        }
    };

    const handlePayoutAction = async (transactionId, action) => {
        if (action === 'completed' && !payoutData.utr) {
            alert('Please enter UTR for bank transfer confirmation');
            return;
        }

        try {
            setLoading(true);
            const res = await adminAPI.updateTransactionStatus(
                transactionId, 
                action, 
                payoutData.note, 
                payoutData.utr
            );
            if (res.status === 'success') {
                alert(`Withdrawal ${action === 'completed' ? 'approved' : 'rejected'} successfully`);
                setPayoutModal(false);
                setPayoutData({ utr: '', note: '' });
                setProcessingWithdrawal(null);
                fetchPendingWithdrawals();
            }
        } catch (err) {
            alert(err.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async () => {
        if (!adjustmentData.amount || !adjustmentData.reason) {
            alert('Please enter amount and reason');
            return;
        }

        try {
            setLoading(true);
            const res = await adminAPI.adjustWallet(selectedWallet._id || selectedWallet.id, {
                type: adjustmentData.type,
                amount: parseFloat(adjustmentData.amount),
                reason: adjustmentData.reason
            });
            
            if (res.status === 'success') {
                alert(`Wallet ${adjustmentData.type.toLowerCase()} successful`);
                setAdjustmentModal(false);
                setAdjustmentData({ type: 'CREDIT', amount: '', reason: '' });
                setSelectedWallet(null);
                fetchWallets();
            }
        } catch (err) {
            alert(err.message || 'Adjustment failed');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString() || 0}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Wallet System</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">
                                {activeTab === 'wallets' ? 'User Wallet Registry' : 'Withdrawal Approval Desk'}
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-inner">
                        <button
                            onClick={() => setActiveTab('wallets')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'wallets' 
                                    ? 'bg-[var(--card)] text-[var(--primary)] ' 
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <User size={14} />
                            Wallet Registry
                        </button>
                        <button
                            onClick={() => setActiveTab('withdrawals')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all relative ${
                                activeTab === 'withdrawals' 
                                    ? 'bg-[var(--card)] text-[var(--primary)] ' 
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <ArrowUpRight size={14} />
                            Withdrawal Desk
                            {pendingWithdrawals.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error)] text-white text-[10px] flex items-center justify-center rounded-full animate-bounce">
                                    {pendingWithdrawals.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'wallets' ? (
                <>
                {/* Wallets View */}
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Balance</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalBalance)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--success-light)] text-[var(--success-text)] rounded-xl flex items-center justify-center">
                                <ArrowDownLeft size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Credits</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalCredits)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--error-light)] text-[var(--error-text)] rounded-xl flex items-center justify-center">
                                <ArrowUpRight size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Debits</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalDebits)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card border-l-4 border-l-[var(--warning)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[var(--warning-light)] text-[var(--warning)] rounded-xl flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">On Hold</p>
                                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">₹{wallets.reduce((acc, w) => acc + (w.holdAmount || 0), 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="admin-card">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[300px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-brand transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by user name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchWallets()}
                                className="w-full h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-brand transition-all placeholder:text-[var(--text-muted)] shadow-inner"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="admin-select"
                            >
                                <option value="All">All Users</option>
                                <option value="Driver">Drivers</option>
                                <option value="Customer">Customers</option>
                            </select>

                            <button 
                                onClick={fetchWallets} 
                                className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Wallets Table */}
                <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User Info</th>
                                    <th className="text-center">User Type</th>
                                    <th className="text-right">Balance</th>
                                    <th className="text-center">Credits</th>
                                    <th className="text-center">Debits</th>
                                    <th className="text-center">Last Activity</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && wallets.length === 0 ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="7" className="px-6 py-6 h-20 bg-[var(--bg-secondary)]" />
                                        </tr>
                                    ))
                                ) : wallets.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Wallet size={48} className="text-[var(--text-muted)]" />
                                                <p className="text-sm font-medium text-[var(--text-secondary)]">No wallets found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    wallets.map((wallet) => (
                                        <tr key={wallet._id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1">
                                                            {wallet.name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                            {wallet.phone || wallet.driverId || 'No phone'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="text-center">
                                                <span className={`badge ${wallet.userType === 'driver' ? 'badge-warning' : 'badge-neutral'}`}>
                                                    {wallet.userType}
                                                </span>
                                            </td>

                                            <td className="text-right">
                                                <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                    {formatCurrency(wallet.balance || 0)}
                                                </div>
                                                {wallet.holdAmount > 0 && (
                                                    <div className="text-xs text-[var(--warning)] font-medium">
                                                        Hold: {formatCurrency(wallet.holdAmount)}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ArrowDownLeft size={12} className="text-[var(--success)]" />
                                                    <span className="text-sm font-semibold text-[var(--success)]">
                                                        {formatCurrency(wallet.totalCredits || 0)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ArrowUpRight size={12} className="text-[var(--error)]" />
                                                    <span className="text-sm font-semibold text-[var(--error)]">
                                                        {formatCurrency(wallet.totalDebits || 0)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Clock size={12} className="text-[var(--text-muted)]" />
                                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                                        {wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : 'No activity'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedWallet(wallet)}
                                                        className="btn-secondary w-9 h-9 p-0 flex items-center justify-center group/view hover:border-brand transition-all"
                                                    >
                                                        <Eye size={18} className="group-hover/view:text-brand transition-colors" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedWallet(wallet);
                                                            setAdjustmentModal(true);
                                                        }}
                                                        className="btn-primary w-9 h-9 p-0 flex items-center justify-center group/adj transition-all"
                                                    >
                                                        <TrendingUp size={18} className="group-hover/adj:scale-110 transition-transform" />
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
                </>
            ) : (
                /* Withdrawal Desk View */
                <div className="space-y-6">
                    <div className="admin-card border-l-4 border-l-[var(--error)] bg-gradient-to-r from-[var(--error-light)]/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--error-light)] text-[var(--error)] rounded-full flex items-center justify-center">
                                <ArrowUpRight size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Pending Outbound Transfers</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Review and settle wallet withdrawals to bank accounts.</p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Beneficiary</th>
                                        <th>Withdrawal Request</th>
                                        <th>Amount</th>
                                        <th className="text-center">Requested At</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-20 animate-pulse">Loading requests...</td></tr>
                                    ) : pendingWithdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <p className="text-sm font-medium text-[var(--text-muted)]">No pending withdrawal requests. Everyone is settled! 🥂</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingWithdrawals.map((txn) => (
                                            <tr key={txn._id} className="hover:bg-[var(--bg-secondary)] transition-all">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--primary)] uppercase">
                                                            {txn.user?.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{txn.user?.name || 'Unknown'}</p>
                                                            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-tight">{txn.user?.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p className="text-xs font-medium text-[var(--text-secondary)] max-w-xs">{txn.description}</p>
                                                    <p className="text-[10px] text-[var(--primary)] font-mono uppercase tracking-tighter">REF: {txn.referenceId}</p>
                                                </td>
                                                <td>
                                                    <div className="text-lg font-black text-[var(--text-primary)]">
                                                        {formatCurrency(txn.amount)}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <p className="text-xs font-medium text-[var(--text-primary)] underline decoration-[var(--border)]">{new Date(txn.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setProcessingWithdrawal(txn);
                                                                setPayoutModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-[var(--success)] text-white text-xs font-bold rounded-lg hover:scale-105 transition-all "
                                                        >
                                                            Approve & Settle
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                if(window.confirm('Are you sure you want to reject this withdrawal? Funds will be returned to user wallet.')) {
                                                                    handlePayoutAction(txn._id, 'rejected');
                                                                }
                                                            }}
                                                            className="px-3 py-2 bg-[var(--error-light)] text-[var(--error-text)] text-xs font-bold rounded-lg hover:bg-[var(--error)] hover:text-white transition-all border border-[var(--error)]"
                                                        >
                                                            Reject
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
                </div>
            )}

            {/* Payout Confirmation Modal */}
            {payoutModal && processingWithdrawal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setPayoutModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="admin-card w-full max-w-md relative z-10 p-0 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] p-8 text-white">
                            <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Settle Payout</h2>
                            <p className="text-sm opacity-80 font-medium">Please confirm you have initiated the bank transfer.</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Amount to Pay</span>
                                    <span className="text-2xl font-black text-[var(--primary)]">{formatCurrency(processingWithdrawal.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Beneficiary</span>
                                    <span className="text-sm font-bold text-[var(--text-primary)]">{processingWithdrawal.user?.name}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">UTR / Transaction ID (Required)</label>
                                    <input 
                                        type="text"
                                        placeholder="Enter Bank UTR Number"
                                        className="admin-input"
                                        value={payoutData.utr}
                                        onChange={(e) => setPayoutData({...payoutData, utr: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Admin Remark (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., Transfer successful"
                                        className="admin-input"
                                        value={payoutData.note}
                                        onChange={(e) => setPayoutData({...payoutData, note: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => handlePayoutAction(processingWithdrawal._id, 'completed')}
                                disabled={loading || !payoutData.utr}
                                className="btn-primary w-full h-14 uppercase tracking-[0.2em] font-black shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                            >
                                {loading ? 'Settling...' : 'Confirm Disbursal'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Adjustment Modal (Existing) */}
            {adjustmentModal && selectedWallet && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setAdjustmentModal(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="admin-card w-full max-w-md relative z-10"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Wallet Adjustment</h2>
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mt-1">
                                {selectedWallet.name}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                    Adjustment Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'CREDIT' }))}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            adjustmentData.type === 'CREDIT' 
                                                ? 'bg-[var(--success)] text-white' 
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        <Plus size={16} className="inline mr-1" />
                                        Credit
                                    </button>
                                    <button
                                        onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'DEBIT' }))}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            adjustmentData.type === 'DEBIT' 
                                                ? 'bg-[var(--error)] text-white' 
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        <Minus size={16} className="inline mr-1" />
                                        Debit
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={adjustmentData.amount}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="Enter amount"
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                    Reason
                                </label>
                                <textarea
                                    value={adjustmentData.reason}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Enter reason for adjustment"
                                    rows={3}
                                    className="admin-input"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setAdjustmentModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdjustment}
                                    className="btn-primary flex-1"
                                >
                                    Apply Adjustment
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminWalletSystem;
