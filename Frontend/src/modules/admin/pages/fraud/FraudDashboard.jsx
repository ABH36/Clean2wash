import React, { useState, useEffect } from 'react';
import { 
    Shield, AlertTriangle, TrendingUp, Users, Ban, 
    Search, Filter, Eye, CheckCircle, XCircle, Clock,
    Activity, BarChart3, AlertCircle
} from 'lucide-react';
import { adminAPI } from '../../../../utils/adminApi.js';
import { toast } from 'react-hot-toast';

const FraudDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({
        status: '',
        severity: '',
        alertType: '',
        page: 1,
        limit: 20
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'alerts') {
            fetchAlerts();
        } else if (activeTab === 'blacklist') {
            fetchBlacklist();
        }
    }, [activeTab, filters]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getFraudDashboard({ timeRange: '30d' });
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to load fraud dashboard');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const response = await adminAPI.getFraudAlerts(filters);
            setAlerts(response.data.alerts);
        } catch (error) {
            toast.error('Failed to load fraud alerts');
            console.error(error);
        }
    };

    const fetchBlacklist = async () => {
        try {
            const response = await adminAPI.getFraudBlacklist({ 
                page: filters.page, 
                limit: filters.limit 
            });
            setBlacklist(response.data.entries);
        } catch (error) {
            toast.error('Failed to load blacklist');
            console.error(error);
        }
    };

    const handleUpdateAlert = async (alertId, updates) => {
        try {
            await adminAPI.updateFraudAlert(alertId, updates);
            toast.success('Alert updated successfully');
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to update alert');
            console.error(error);
        }
    };

    const handleRemoveFromBlacklist = async (entryId) => {
        if (!window.confirm('Are you sure you want to remove this entry from blacklist?')) {
            return;
        }

        try {
            await adminAPI.removeFromBlacklist(entryId);
            toast.success('Removed from blacklist');
            fetchBlacklist();
        } catch (error) {
            toast.error('Failed to remove from blacklist');
            console.error(error);
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            CRITICAL: 'bg-red-100 text-red-800 border-red-200',
            HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
            MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            LOW: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colors[severity] || colors.MEDIUM;
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            INVESTIGATING: 'bg-blue-100 text-blue-800',
            CONFIRMED: 'bg-red-100 text-red-800',
            FALSE_POSITIVE: 'bg-green-100 text-green-800',
            RESOLVED: 'bg-white/[0.05] text-white/90'
        };
        return colors[status] || colors.PENDING;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Shield className="text-red-600" size={28} />
                        Fraud Detection & Prevention
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Monitor and manage suspicious activities</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--border)]">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'alerts', 'blacklist'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                                activeTab === tab
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Total Alerts</p>
                                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                                        {stats.overall.totalAlerts || 0}
                                    </p>
                                </div>
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                                    <AlertTriangle className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Critical Alerts</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                        {stats.overall.criticalAlerts || 0}
                                    </p>
                                </div>
                                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                                    <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Avg Risk Score</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                        {Math.round(stats.overall.avgRiskScore || 0)}
                                    </p>
                                </div>
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                                    <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Blacklisted</p>
                                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                                        {stats.blacklistCount || 0}
                                    </p>
                                </div>
                                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                    <Ban className="text-[var(--text-secondary)]" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts by Type */}
                    <div className="bg-white/5 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} />
                            Alerts by Type
                        </h3>
                        <div className="space-y-3">
                            {stats.alertsByType?.map((item) => (
                                <div key={item._id} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-white/80">
                                                {item._id.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm text-white/60">
                                                {item.count} alerts
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (item.count / (stats.overall.totalAlerts || 1)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white/5 rounded-lg shadow p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                className="border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="INVESTIGATING">Investigating</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="FALSE_POSITIVE">False Positive</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>

                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
                                className="border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">All Severity</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>

                            <select
                                value={filters.alertType}
                                onChange={(e) => setFilters({ ...filters, alertType: e.target.value, page: 1 })}
                                className="border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="">All Types</option>
                                <option value="MULTIPLE_CANCELLATIONS">Multiple Cancellations</option>
                                <option value="RAPID_BOOKINGS">Rapid Bookings</option>
                                <option value="SUSPICIOUS_PAYMENT">Suspicious Payment</option>
                                <option value="REFUND_ABUSE">Refund Abuse</option>
                                <option value="ACCOUNT_SHARING">Account Sharing</option>
                                <option value="DRIVER_FRAUD">Driver Fraud</option>
                            </select>
                        </div>
                    </div>

                    {/* Alerts List */}
                    <div className="bg-white/5 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Alert
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        User/Driver
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Severity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Risk Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/5 divide-y divide-gray-200">
                                {alerts.map((alert) => (
                                    <tr key={alert._id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {alert.alertType.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-sm text-white/40">{alert.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {alert.user?.name || alert.driver?.name || 'N/A'}
                                                </p>
                                                <p className="text-white/40">
                                                    {alert.user?.phone || alert.driver?.phone || ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {alert.riskScore}
                                                </span>
                                                <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            alert.riskScore >= 70 ? 'bg-red-600' :
                                                            alert.riskScore >= 50 ? 'bg-orange-600' :
                                                            'bg-yellow-600'
                                                        }`}
                                                        style={{ width: `${alert.riskScore}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                                                {alert.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => window.location.href = `/admin/fraud/alerts/${alert._id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {alert.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateAlert(alert._id, { status: 'INVESTIGATING' })}
                                                            className="text-yellow-600 hover:text-yellow-800"
                                                            title="Start Investigation"
                                                        >
                                                            <Clock size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateAlert(alert._id, { status: 'FALSE_POSITIVE' })}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Mark as False Positive"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Blacklist Tab */}
            {activeTab === 'blacklist' && (
                <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Entity Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Entity ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Severity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/5 divide-y divide-gray-200">
                                {blacklist.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {entry.entityType}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/40">
                                            {entry.entityId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {entry.reason}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(entry.severity)}`}>
                                                {entry.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/40">
                                            {entry.isPermanent ? 'Permanent' : 'Temporary'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleRemoveFromBlacklist(entry._id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Remove from Blacklist"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudDashboard;
