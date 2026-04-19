import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Search, Filter, Calendar, Download,
    User, Shield, Edit, Trash2, Eye, Plus,
    Clock, MapPin, Smartphone, AlertTriangle,
    CheckCircle, XCircle, Info, Zap
} from 'lucide-react';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterAdmin, setFilterAdmin] = useState('all');
    const [dateRange, setDateRange] = useState('today');

    // Mock data - replace with actual API calls
    const mockLogs = [
        {
            id: 1,
            admin: { name: 'Super Administrator', email: 'admin@clean2wash.com', role: 'Super Admin' },
            action: 'CREATE_ADMIN',
            resource: 'Admin Management',
            description: 'Created new admin account for Operations Manager',
            details: { targetEmail: 'ops@clean2wash.com', role: 'Admin' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Mumbai, India',
            status: 'success',
            timestamp: '2024-04-17T10:30:00Z'
        },
        {
            id: 2,
            admin: { name: 'Operations Manager', email: 'ops@clean2wash.com', role: 'Admin' },
            action: 'UPDATE_DRIVER',
            resource: 'Driver Management',
            description: 'Updated driver verification status',
            details: { driverId: 'DRV001', field: 'verification_status', oldValue: 'pending', newValue: 'verified' },
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            location: 'Delhi, India',
            status: 'success',
            timestamp: '2024-04-17T09:45:00Z'
        },
        {
            id: 3,
            admin: { name: 'Support Lead', email: 'support@clean2wash.com', role: 'Sub-Admin' },
            action: 'VIEW_USER_DETAILS',
            resource: 'User Management',
            description: 'Accessed user profile for support ticket',
            details: { userId: 'USR12345', ticketId: 'TKT789' },
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            location: 'Bangalore, India',
            status: 'success',
            timestamp: '2024-04-17T08:20:00Z'
        },
        {
            id: 4,
            admin: { name: 'Operations Manager', email: 'ops@clean2wash.com', role: 'Admin' },
            action: 'DELETE_BOOKING',
            resource: 'Booking Management',
            description: 'Attempted to delete completed booking',
            details: { bookingId: 'BKG456', reason: 'Customer request' },
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            location: 'Delhi, India',
            status: 'failed',
            error: 'Insufficient permissions for this action',
            timestamp: '2024-04-16T16:30:00Z'
        },
        {
            id: 5,
            admin: { name: 'Super Administrator', email: 'admin@clean2wash.com', role: 'Super Admin' },
            action: 'LOGIN',
            resource: 'Authentication',
            description: 'Successful admin login',
            details: { loginMethod: 'email_password' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Mumbai, India',
            status: 'success',
            timestamp: '2024-04-16T14:15:00Z'
        }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLogs(mockLogs);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.resource.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
        const matchesAdmin = filterAdmin === 'all' || log.admin.email === filterAdmin;
        
        // Date filtering
        const logDate = new Date(log.timestamp);
        const now = new Date();
        let matchesDate = true;
        
        if (dateRange === 'today') {
            matchesDate = logDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= weekAgo;
        } else if (dateRange === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= monthAgo;
        }
        
        return matchesSearch && matchesAction && matchesAdmin && matchesDate;
    });

    const getActionIcon = (action) => {
        switch (action) {
            case 'CREATE_ADMIN': return <Plus size={16} className="text-green-600" />;
            case 'UPDATE_DRIVER': return <Edit size={16} className="text-blue-600" />;
            case 'DELETE_BOOKING': return <Trash2 size={16} className="text-red-600" />;
            case 'VIEW_USER_DETAILS': return <Eye size={16} className="text-purple-600" />;
            case 'LOGIN': return <Shield size={16} className="text-green-600" />;
            default: return <Activity size={16} className="text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-50 text-green-600 border-green-200';
            case 'failed': return 'bg-red-50 text-red-600 border-red-200';
            case 'warning': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle size={14} />;
            case 'failed': return <XCircle size={14} />;
            case 'warning': return <AlertTriangle size={14} />;
            default: return <Info size={14} />;
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const exportLogs = () => {
        // Implement export functionality
        const csvContent = [
            ['Timestamp', 'Admin', 'Action', 'Resource', 'Description', 'Status', 'IP Address'].join(','),
            ...filteredLogs.map(log => [
                log.timestamp,
                log.admin.name,
                log.action,
                log.resource,
                log.description,
                log.status,
                log.ipAddress
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-[var(--bg-secondary)] rounded w-1/4"></div>
                    <div className="h-12 bg-[var(--bg-secondary)] rounded"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-[var(--bg-secondary)] rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Activity Logs</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Monitor all admin activities and system events</p>
                </div>
                <button
                    onClick={exportLogs}
                    className="btn-primary"
                >
                    <Download size={16} />
                    Export Logs
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Activity size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{logs.length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Total Activities</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{logs.filter(l => l.status === 'success').length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Successful</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{logs.filter(l => l.status === 'failed').length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Failed</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <User size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{new Set(logs.map(l => l.admin.email)).size}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Active Admins</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="admin-input pl-10"
                        />
                    </div>
                    
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="admin-select"
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Create Actions</option>
                        <option value="update">Update Actions</option>
                        <option value="delete">Delete Actions</option>
                        <option value="view">View Actions</option>
                        <option value="login">Login Actions</option>
                    </select>
                    
                    <select
                        value={filterAdmin}
                        onChange={(e) => setFilterAdmin(e.target.value)}
                        className="admin-select"
                    >
                        <option value="all">All Admins</option>
                        {Array.from(new Set(logs.map(l => l.admin.email))).map(email => (
                            <option key={email} value={email}>
                                {logs.find(l => l.admin.email === email)?.admin.name}
                            </option>
                        ))}
                    </select>
                    
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="admin-select"
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="admin-card">
                <div className="space-y-4">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity size={48} className="text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No activities found</h3>
                            <p className="text-[var(--text-secondary)]">Try adjusting your filters to see more results.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex gap-4 p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                                {/* Timeline dot */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-8 h-8 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border)]">
                                        {getActionIcon(log.action)}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-medium text-[var(--text-primary)]">{log.description}</h4>
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${getStatusColor(log.status)}`}>
                                                {getStatusIcon(log.status)}
                                                {log.status}
                                            </span>
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            <span>{log.admin.name} ({log.admin.role})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Shield size={14} />
                                            <span>{log.resource}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            <span>{log.location}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Details */}
                                    {log.details && (
                                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3">
                                            <h5 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Details:</h5>
                                            <div className="text-sm text-[var(--text-primary)] space-y-1">
                                                {Object.entries(log.details).map(([key, value]) => (
                                                    <div key={key} className="flex gap-2">
                                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                                        <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Error message */}
                                    {log.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                            <div className="flex items-center gap-2 text-red-600">
                                                <AlertTriangle size={14} />
                                                <span className="text-sm font-medium">Error:</span>
                                            </div>
                                            <p className="text-sm text-red-700 mt-1">{log.error}</p>
                                        </div>
                                    )}
                                    
                                    {/* Technical details */}
                                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                        <span>IP: {log.ipAddress}</span>
                                        <span className="flex items-center gap-1">
                                            <Smartphone size={12} />
                                            {log.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;