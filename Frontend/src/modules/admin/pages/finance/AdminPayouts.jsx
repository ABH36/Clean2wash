import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, Users, Clock, CheckCircle, RefreshCw, 
    Filter, Calendar, Search, Eye, Plus, X, TrendingUp,
    AlertCircle, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

const AdminPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 20
    });
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    useEffect(() => {
        loadPayouts();
        loadStats();
    }, [filters]);

    const loadPayouts = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getPayouts(filters);
            if (res.status === 'success') {
                setPayouts(res.data.payouts);
            }
        } catch (error) {
            console.error('Failed to load payouts:', error);
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await adminAPI.getPayoutStats();
            if (res.status === 'success') {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const generateAllPayouts = async (startDate, endDate) => {
        try {
            const res = await adminAPI.generateAllPayouts({ startDate, endDate });
            if (res.status === 'success') {
                toast.success(res.message);
                loadPayouts();
                loadStats();
                setShowGenerateModal(false);
            }
        } catch (error) {
            console.error('Failed to generate payouts:', error);
            toast.error('Failed to generate payouts');
        }
    };

    const processPayout = async (id, transactionId) => {
        try {
            const res = await adminAPI.processPayout(id, transactionId);
            if (res.status === 'success') {
                toast.success('Payout processed successfully');
                loadPayouts();
                loadStats();
                setShowModal(false);
            }
        } catch (error) {
            console.error('Failed to process payout:', error);
            toast.error('Failed to process payout');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'PROCESSING': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-white/[0.02] text-white/80 border-white/10';
        }
    };

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Driver Payouts</h1>
                        <p className="text-sm text-white/60 mt-1">
                            Manage weekly driver payouts and settlements
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadPayouts}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowGenerateModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Generate Payouts
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Payouts', value: stats.total, icon: <Users size={18} />, color: 'blue' },
                        { label: 'Pending', value: `₹${stats.pending.amount.toLocaleString()}`, count: stats.pending.count, icon: <Clock size={18} />, color: 'amber' },
                        { label: 'Processing', value: `₹${stats.processing.amount.toLocaleString()}`, count: stats.processing.count, icon: <TrendingUp size={18} />, color: 'blue' },
                        { label: 'Completed', value: `₹${stats.completed.amount.toLocaleString()}`, count: stats.completed.count, icon: <CheckCircle size={18} />, color: 'emerald' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="admin-card-compact"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    {stat.count !== undefined && (
                                        <p className="text-xs text-white/40 mt-1">{stat.count} payouts</p>
                                    )}
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-${stat.color}-600`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="admin-card">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="admin-input"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payouts Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>Period</th>
                                <th className="text-center">Trips</th>
                                <th className="text-right">Earnings</th>
                                <th className="text-right">Penalties</th>
                                <th className="text-right">Payout</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <RefreshCw size={24} className="animate-spin mx-auto text-[var(--primary)]" />
                                    </td>
                                </tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <DollarSign size={32} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-white/60">No payouts found</p>
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout._id}>
                                        <td>
                                            <div>
                                                <p className="font-semibold text-gray-900">{payout.driver?.name || 'N/A'}</p>
                                                <p className="text-sm text-white/40">{payout.driver?.driverId || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <p className="text-gray-900">
                                                    {new Date(payout.payoutPeriod.start).toLocaleDateString()}
                                                </p>
                                                <p className="text-white/40">
                                                    to {new Date(payout.payoutPeriod.end).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="font-semibold text-gray-900">{payout.totalTrips}</span>
                                        </td>
                                        <td className="text-right">
                                            <span className="font-semibold text-emerald-600">
                                                ₹{payout.totalEarnings.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span className="font-semibold text-red-600">
                                                -₹{payout.totalPenalties.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span className="font-bold text-[var(--primary)]">
                                                ₹{payout.payoutAmount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(payout.status)}`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedPayout(payout);
                                                    setShowModal(true);
                                                }}
                                                className="btn-secondary-sm flex items-center gap-1"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Payouts Modal */}
            <AnimatePresence>
                {showGenerateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGenerateModal(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="admin-card relative z-10 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Generate Payouts</h3>
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    generateAllPayouts(
                                        formData.get('startDate'),
                                        formData.get('endDate')
                                    );
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        required
                                        className="admin-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        required
                                        className="admin-input"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenerateModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payout Details Modal */}
            <AnimatePresence>
                {showModal && selectedPayout && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="admin-card relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Payout Details</h3>
                                    <p className="text-sm text-white/60">{selectedPayout.driver?.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/[0.02] rounded-lg">
                                        <p className="text-sm text-white/60 mb-1">Total Trips</p>
                                        <p className="text-2xl font-bold text-gray-900">{selectedPayout.totalTrips}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                        <p className="text-sm text-emerald-600 mb-1">Total Earnings</p>
                                        <p className="text-2xl font-bold text-emerald-600">₹{selectedPayout.totalEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-red-600 mb-1">Penalties</p>
                                        <p className="text-2xl font-bold text-red-600">-₹{selectedPayout.totalPenalties.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-[var(--primary-light)] rounded-lg">
                                        <p className="text-sm text-[var(--primary)] mb-1">Payout Amount</p>
                                        <p className="text-2xl font-bold text-[var(--primary)]">₹{selectedPayout.payoutAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Process Payout */}
                                {selectedPayout.status === 'PENDING' && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            processPayout(selectedPayout._id, formData.get('transactionId'));
                                        }}
                                        className="p-4 bg-blue-50 rounded-lg"
                                    >
                                        <h4 className="font-semibold text-gray-900 mb-3">Process Payout</h4>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                name="transactionId"
                                                placeholder="Transaction ID"
                                                required
                                                className="admin-input flex-1"
                                            />
                                            <button type="submit" className="btn-primary">
                                                Process
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPayouts;
