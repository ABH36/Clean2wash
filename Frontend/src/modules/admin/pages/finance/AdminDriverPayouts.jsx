import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
import {
    Users,
    Car,
    Search,
    RefreshCw,
    Eye,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp,
    AlertCircle,
    Download
} from 'lucide-react';

const AdminDriverPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedPayout, setSelectedPayout] = useState(null);

    const [stats, setStats] = useState({
        totalPending: 0,
        totalPaid: 0,
        totalDrivers: 0,
        avgPayout: 0
    });

    useEffect(() => {
        fetchPayouts();
        fetchStats();
    }, [statusFilter]);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const params = {
                ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
                ...(searchQuery && { search: searchQuery })
            };
            const res = await adminAPI.getDriverPayouts(params);
            if (res.status === 'success') {
                setPayouts(res.data.payouts || []);
            }
        } catch (err) {
            console.error("Failed to fetch payouts:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getPayoutStats();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch payout stats:", err);
        }
    };

    const handleMarkAsPaid = async (payoutId) => {
        const utrNumber = prompt('Enter UTR Reference Number:');
        if (!utrNumber) return;

        try {
            const res = await adminAPI.markPayoutAsPaid(payoutId, { utrNumber });
            if (res.status === 'success') {
                fetchPayouts();
                fetchStats();
                alert('Payout marked as paid successfully');
            }
        } catch (err) {
            console.error("Failed to mark payout as paid:", err);
            alert('Failed to update payout status');
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
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Driver Payouts</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">Earnings & Settlement Management</p>
                        </div>
                    </div>

                    <button className="btn-secondary flex items-center gap-2">
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--warning-light)] text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Pending Payouts</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalPending)}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--success-light)] text-[var(--success-text)] rounded-xl flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Paid</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalPaid)}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Active Drivers</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{stats.totalDrivers}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Avg Payout</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.avgPayout)}</h3>
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
                            placeholder="Search by driver name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchPayouts()}
                            className="admin-input pl-12"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="admin-select"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Processing">Processing</option>
                        </select>

                        <button 
                            onClick={fetchPayouts} 
                            className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Payouts Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Driver Info</th>
                                <th className="text-center">Trips</th>
                                <th className="text-right">Earnings</th>
                                <th className="text-right">Incentives</th>
                                <th className="text-right">Penalties</th>
                                <th className="text-right">Final Amount</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">UTR</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && payouts.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="9" className="px-6 py-6 h-20 bg-[var(--bg-secondary)]" />
                                    </tr>
                                ))
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <DollarSign size={48} className="text-[var(--text-muted)]" />
                                            <p className="text-sm font-medium text-[var(--text-secondary)]">No payouts found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                                                    <Car size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1">
                                                        {payout.driver?.name || 'Unknown Driver'}
                                                    </p>
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                        {payout.driver?.phone || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                {payout.tripsCount || 0}
                                            </span>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">
                                                {formatCurrency(payout.totalEarnings || 0)}
                                            </div>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-sm font-semibold text-[var(--success)]">
                                                +{formatCurrency(payout.incentives || 0)}
                                            </div>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-sm font-semibold text-[var(--error)]">
                                                -{formatCurrency(payout.penalties || 0)}
                                            </div>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                {formatCurrency(payout.finalAmount || 0)}
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <span className={`badge ${
                                                payout.status === 'completed' ? 'badge-success' :
                                                payout.status === 'pending' ? 'badge-warning' :
                                                'badge-neutral'
                                            }`}>
                                                {payout.status}
                                            </span>
                                        </td>

                                        <td className="text-center">
                                            <span className="text-xs font-mono text-[var(--text-secondary)]">
                                                {payout.utrNumber || '-'}
                                            </span>
                                        </td>

                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {payout.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(payout._id)}
                                                        className="btn-primary text-xs px-3 py-1"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedPayout(payout)}
                                                    className="btn-secondary w-8 h-8 p-0 flex items-center justify-center"
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

            {/* Payout Details Modal */}
            {selectedPayout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedPayout(null)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="admin-card w-full max-w-2xl relative z-10"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Payout Details</h2>
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mt-1">
                                {selectedPayout.driver?.name}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="admin-card-compact">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">Earnings Breakdown</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">Base Earnings</span>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(selectedPayout.totalEarnings)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--success)]">Incentives</span>
                                        <span className="text-sm font-semibold text-[var(--success)]">+{formatCurrency(selectedPayout.incentives)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--error)]">Penalties</span>
                                        <span className="text-sm font-semibold text-[var(--error)]">-{formatCurrency(selectedPayout.penalties)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                                        <span className="text-base font-semibold text-[var(--text-primary)]">Final Amount</span>
                                        <span className="text-base font-semibold text-[var(--text-primary)]">{formatCurrency(selectedPayout.finalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-card-compact">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">Payment Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] mb-1">Status</p>
                                        <span className={`badge ${
                                            selectedPayout.status === 'completed' ? 'badge-success' : 'badge-warning'
                                        }`}>
                                            {selectedPayout.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] mb-1">UTR Number</p>
                                        <p className="text-sm font-mono text-[var(--text-primary)]">{selectedPayout.utrNumber || 'Not available'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] mb-1">Trips Completed</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedPayout.tripsCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-secondary)] mb-1">Period</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            {selectedPayout.period || 'Current week'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="btn-secondary w-full"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDriverPayouts;
