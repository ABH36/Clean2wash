import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../../utils/adminApi';
import {
    AlertTriangle,
    Search,
    RefreshCw,
    Plus,
    Eye,
    User,
    Car,
    XCircle,
    Clock,
    DollarSign,
    TrendingDown
} from 'lucide-react';

const AdminPenalties = () => {
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPenalty, setSelectedPenalty] = useState(null);

    const [newPenalty, setNewPenalty] = useState({
        userId: '',
        userType: 'driver',
        type: 'CANCELLATION',
        amount: '',
        reason: ''
    });

    const [stats, setStats] = useState({
        totalPenalties: 0,
        totalAmount: 0,
        driverPenalties: 0,
        customerPenalties: 0
    });

    const penaltyTypes = [
        { value: 'CANCELLATION', label: 'Cancellation Penalty' },
        { value: 'LATE_ARRIVAL', label: 'Late Arrival' },
        { value: 'NO_SHOW', label: 'No Show' },
        { value: 'POOR_BEHAVIOR', label: 'Poor Behavior' },
        { value: 'VEHICLE_CONDITION', label: 'Vehicle Condition' },
        { value: 'OVERTIME', label: 'Overtime Penalty' },
        { value: 'OTHER', label: 'Other' }
    ];

    useEffect(() => {
        fetchPenalties();
        fetchStats();
    }, [filterType]);

    const fetchPenalties = async () => {
        try {
            setLoading(true);
            const params = {
                ...(filterType !== 'All' && { type: filterType }),
                ...(searchQuery && { search: searchQuery })
            };
            const res = await adminAPI.getPenalties(params);
            if (res.status === 'success') {
                setPenalties(res.data.penalties || []);
            }
        } catch (err) {
            console.error("Failed to fetch penalties:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getPenaltyStats();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch penalty stats:", err);
        }
    };

    const handleAddPenalty = async () => {
        if (!newPenalty.userId || !newPenalty.amount || !newPenalty.reason) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const res = await adminAPI.addPenalty(newPenalty);
            if (res.status === 'success') {
                fetchPenalties();
                fetchStats();
                setShowAddModal(false);
                setNewPenalty({
                    userId: '',
                    userType: 'driver',
                    type: 'CANCELLATION',
                    amount: '',
                    reason: ''
                });
                alert('Penalty added successfully');
            }
        } catch (err) {
            console.error("Failed to add penalty:", err);
            alert('Failed to add penalty');
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
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Penalties & Adjustments</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">Financial Penalty Management</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Penalty
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--error-light)] text-[var(--error-text)] rounded-xl flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Penalties</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{stats.totalPenalties}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--warning-light)] text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Amount</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalAmount)}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                            <Car size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Driver Penalties</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{stats.driverPenalties}</h3>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Customer Penalties</p>
                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{stats.customerPenalties}</h3>
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
                            placeholder="Search by user name or penalty type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchPenalties()}
                            className="admin-input pl-12"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="admin-select"
                        >
                            <option value="All">All Types</option>
                            {penaltyTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        <button 
                            onClick={fetchPenalties} 
                            className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Penalties Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User Info</th>
                                <th className="text-center">User Type</th>
                                <th className="text-center">Penalty Type</th>
                                <th className="text-right">Amount</th>
                                <th>Reason</th>
                                <th className="text-center">Date</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && penalties.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-6 h-20 bg-[var(--bg-secondary)]" />
                                    </tr>
                                ))
                            ) : penalties.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertTriangle size={48} className="text-[var(--text-muted)]" />
                                            <p className="text-sm font-medium text-[var(--text-secondary)]">No penalties found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                penalties.map((penalty) => (
                                    <tr key={penalty._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                    penalty.userType === 'driver' 
                                                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                                                        : 'bg-[var(--accent-light)] text-[var(--accent)]'
                                                }`}>
                                                    {penalty.userType === 'driver' ? <Car size={18} /> : <User size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1">
                                                        {penalty.user?.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                                                        {penalty.user?.phone || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <span className={`badge ${
                                                penalty.userType === 'driver' ? 'badge-warning' : 'badge-neutral'
                                            }`}>
                                                {penalty.userType}
                                            </span>
                                        </td>

                                        <td className="text-center">
                                            <span className="badge badge-error">
                                                {penalty.type.replace('_', ' ')}
                                            </span>
                                        </td>

                                        <td className="text-right">
                                            <div className="text-lg font-semibold text-[var(--error)]">
                                                -{formatCurrency(penalty.amount)}
                                            </div>
                                        </td>

                                        <td>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                                {penalty.reason}
                                            </p>
                                        </td>

                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock size={12} className="text-[var(--text-muted)]" />
                                                <span className="text-xs font-medium text-[var(--text-secondary)]">
                                                    {new Date(penalty.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            <button
                                                onClick={() => setSelectedPenalty(penalty)}
                                                className="btn-secondary w-8 h-8 p-0 flex items-center justify-center"
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

            {/* Add Penalty Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="admin-card w-full max-w-md relative z-10"
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Add Penalty</h2>
                                <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mt-1">
                                    Apply financial penalty
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                        User Type
                                    </label>
                                    <select
                                        value={newPenalty.userType}
                                        onChange={(e) => setNewPenalty(prev => ({ ...prev, userType: e.target.value }))}
                                        className="admin-select"
                                    >
                                        <option value="driver">Driver</option>
                                        <option value="customer">Customer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                        User ID / Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={newPenalty.userId}
                                        onChange={(e) => setNewPenalty(prev => ({ ...prev, userId: e.target.value }))}
                                        placeholder="Enter user ID or phone number"
                                        className="admin-input"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                        Penalty Type
                                    </label>
                                    <select
                                        value={newPenalty.type}
                                        onChange={(e) => setNewPenalty(prev => ({ ...prev, type: e.target.value }))}
                                        className="admin-select"
                                    >
                                        {penaltyTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={newPenalty.amount}
                                        onChange={(e) => setNewPenalty(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter penalty amount"
                                        className="admin-input"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                                        Reason
                                    </label>
                                    <textarea
                                        value={newPenalty.reason}
                                        onChange={(e) => setNewPenalty(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="Enter reason for penalty"
                                        rows={3}
                                        className="admin-input"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddPenalty}
                                        className="btn-danger flex-1"
                                    >
                                        Apply Penalty
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Penalty Details Modal */}
            <AnimatePresence>
                {selectedPenalty && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPenalty(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="admin-card w-full max-w-lg relative z-10"
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-none">Penalty Details</h2>
                                <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mt-1">
                                    {selectedPenalty.user?.name}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="admin-card-compact">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] mb-1">User Type</p>
                                            <span className={`badge ${
                                                selectedPenalty.userType === 'driver' ? 'badge-warning' : 'badge-neutral'
                                            }`}>
                                                {selectedPenalty.userType}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] mb-1">Penalty Type</p>
                                            <span className="badge badge-error">
                                                {selectedPenalty.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] mb-1">Amount</p>
                                            <p className="text-lg font-semibold text-[var(--error)]">
                                                -{formatCurrency(selectedPenalty.amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] mb-1">Date</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                {new Date(selectedPenalty.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-card-compact">
                                    <p className="text-xs text-[var(--text-secondary)] mb-2">Reason</p>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {selectedPenalty.reason}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedPenalty(null)}
                                    className="btn-secondary w-full"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPenalties;
