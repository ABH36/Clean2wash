import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Search, Filter, Calendar, Download,
    User, Shield, Edit, Trash2, Eye, Plus,
    Clock, MapPin, Smartphone, AlertTriangle,
    CheckCircle, XCircle, Info, Zap, RefreshCw,
    Terminal, UserCheck, ShieldCheck, Globe
} from 'lucide-react';
import PageShell, { 
    SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader 
} from '../../components/PageShell';

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

    const fetchLogs = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLogs(mockLogs);
            setLoading(false);
        }, 800);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.resource.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
        const matchesAdmin = filterAdmin === 'all' || log.admin.email === filterAdmin;
        
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
            case 'CREATE_ADMIN': return <Plus size={16} className="text-emerald-500" />;
            case 'UPDATE_DRIVER': return <Edit size={16} className="text-blue-500" />;
            case 'DELETE_BOOKING': return <Trash2 size={16} className="text-rose-500" />;
            case 'VIEW_USER_DETAILS': return <Eye size={16} className="text-indigo-500" />;
            case 'LOGIN': return <Shield size={16} className="text-emerald-500" />;
            default: return <Activity size={16} className="text-slate-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success': return 'adm-badge-success';
            case 'failed': return 'adm-badge-error';
            case 'warning': return 'adm-badge-warning';
            default: return 'bg-slate-100 text-slate-400';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const exportLogs = () => {
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
        toast.success('Log Export Triggered');
    };

    return (
        <PageShell
            title="Activity Audit"
            subtitle="Security timeline and administrative action intelligence"
            icon={Terminal}
            accent="slate"
            badge="Security-V1"
            actions={
                <div className="flex items-center gap-3">
                    <button onClick={fetchLogs} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={exportLogs} className="adm-btn adm-btn-primary h-10 px-4 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <Download size={16} /> Export Dataset
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* ── METRIC TILES ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Events', value: logs.length, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Success Rate', value: `${Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Security Failures', value: logs.filter(l => l.status === 'failed').length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Active Admins', value: new Set(logs.map(l => l.admin.email)).size, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border border-slate-100 ${stat.bg} relative overflow-hidden group`}>
                            <div className="relative z-10">
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-20 h-20 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                {/* ── LOGS TABLE ── */}
                <SectionCard
                    title="Audit Timeline"
                    icon={Clock}
                    actions={
                        <FilterBar className="!border-0 !p-0 !bg-transparent">
                            <SearchBox 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                placeholder="Identify event..." 
                            />
                            <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
                            <StatusTabs 
                                tabs={[
                                    { label: 'Today', value: 'today' },
                                    { label: 'Week', value: 'week' },
                                    { label: 'Month', value: 'month' },
                                    { label: 'All', value: 'all' }
                                ]}
                                active={dateRange}
                                onChange={setDateRange}
                            />
                        </FilterBar>
                    }
                    noPad
                >
                    <div className="adm-table-container">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Event Specification</th>
                                    <th>Administrative Actor</th>
                                    <th className="text-center">Protocol Node</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right">Epoch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5}><PageLoader /></td></tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan={5}><EmptyState icon={Terminal} title="No event logs identified" subtitle="Refine your audit parameters" /></td></tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5 truncate">{log.description}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Globe size={10} className="text-slate-400" />
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.location} • {log.ipAddress}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                        {log.admin.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{log.admin.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.admin.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                                                    <Shield size={10} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.resource}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`adm-badge ${getStatusBadge(log.status)}`}>
                                                    {log.status === 'success' ? <CheckCircle size={10} className="mr-1" /> : <AlertTriangle size={10} className="mr-1" />}
                                                    {log.status}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[12px] font-black text-slate-800 tabular-nums">{formatTimestamp(log.timestamp).split(',')[0]}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatTimestamp(log.timestamp).split(',')[1]}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>
        </PageShell>
    );
};

export default ActivityLogs;