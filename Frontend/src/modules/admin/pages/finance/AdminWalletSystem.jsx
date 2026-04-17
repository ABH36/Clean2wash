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
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [adjustmentModal, setAdjustmentModal] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ amount: '', reason: '', type: 'CREDIT' });

    const [stats, setStats] = useState({
        totalDriverWallets: 0,
        totalCustomerWallets: 0,
        totalBalance: 0,
        totalCredits: 0,
        totalDebits: 0
    });

    useEffect(() => {
        fetchWallets();
        fetchStats();
    }, [filterType]);

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

    const handleAdjustment = async () => {
        if (!selectedWallet || !adjustmentData.amount || !adjustmentData.reason) {
            alert('Please fill all fields');
            return;
        }

        try {
            const res = await adminAPI.adjustWallet(selectedWallet._id, adjustmentData);
            if (res.status === 'success') {
                fetchWallets();
                fetchStats();
                setAdjustmentModal(false);
                setAdjustmentData({ amount: '', reason: '', type: 'CREDIT' });
                setSelectedWallet(null);
            }
        } catch (err) {
            console.error("Failed to adjust wallet:", err);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString() || 0}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Wallet System</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">User Wallet Management</p>
                        </div>
                    </div>
                </div>
            </div>

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

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Active Wallets</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{wallets.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-card">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Search by user name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchWallets()}
                            className="admin-input pl-12"
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
                                                        {wallet.user?.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                        {wallet.user?.phone || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <span className={`badge ${wallet.user?.role === 'driver' ? 'badge-warning' : 'badge-neutral'}`}>
                                                {wallet.user?.role || 'customer'}
                                            </span>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                {formatCurrency(wallet.balance || 0)}
                                            </div>
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
                                                    {wallet.lastActivity ? new Date(wallet.lastActivity).toLocaleDateString() : 'No activity'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedWallet(wallet)}
                                                    className="btn-secondary w-8 h-8 p-0 flex items-center justify-center"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedWallet(wallet);
                                                        setAdjustmentModal(true);
                                                    }}
                                                    className="btn-primary w-8 h-8 p-0 flex items-center justify-center"
                                                >
                                                    <TrendingUp size={14} />
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

            {/* Adjustment Modal */}
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
                                {selectedWallet.user?.name}
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
