import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    UserPlus,
    Edit2,
    X,
    Filter,
    Mail,
    Phone,
    MapPin,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Clock,
    Briefcase,
    Activity,
    Key,
    Users as UsersIcon,
    RefreshCw,
    Calendar,
    Ban,
    TrendingUp,
    DollarSign,
    History,
    Flag,
    CheckCircle,
    XOctagon,
    CreditCard,
    FileText,
    MapPin as LocationIcon,
    Calendar as CalendarIcon
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';

const AdminUsers = () => {
    const location = useLocation();
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: '', hub: '', city: '', status: 'Active' });
    const [users, setUsers] = useState([]);
    
    // Enhanced State for Customer Features Only
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [kycFilter, setKycFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState('All');
    
    // Filtering State
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Helper Functions for New Features
    const calculateRiskScore = (user) => {
        let score = 0;
        
        // Cancellation rate (0-40 points)
        const cancellationRate = (user.stats?.cancellations || 0) / Math.max(user.stats?.totalBookings || 1, 1);
        score += Math.min(cancellationRate * 100, 40);
        
        // Complaint rate (0-30 points)
        const complaintRate = (user.stats?.complaints || 0) / Math.max(user.stats?.totalBookings || 1, 1);
        score += Math.min(complaintRate * 150, 30);
        
        // Account age factor (0-20 points - newer accounts are riskier)
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) score += 20;
        else if (daysSinceCreation < 30) score += 10;
        
        // Activity pattern (0-10 points)
        const lastActivity = user.lastActivity ? Date.now() - new Date(user.lastActivity).getTime() : 0;
        const daysSinceActivity = lastActivity / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 30) score += 10;
        
        return Math.min(Math.round(score), 100);
    };

    const getRiskBadge = (score) => {
        if (score <= 30) return { label: 'Low', color: 'text-[var(--success-text)]', bg: 'bg-[var(--success-light)]', border: 'border-[var(--success)]' };
        if (score <= 60) return { label: 'Medium', color: 'text-[var(--warning-text)]', bg: 'bg-[var(--warning-light)]', border: 'border-[var(--warning)]' };
        return { label: 'High', color: 'text-[var(--error-text)]', bg: 'bg-[var(--error-light)]', border: 'border-[var(--error)]' };
    };

    const getKycStatus = (user) => {
        if (user.kyc?.status === 'verified' || user.isVerified) return 'Verified';
        if (user.kyc?.status === 'rejected') return 'Rejected';
        return 'Pending';
    };

    const getKycBadge = (status) => {
        switch (status) {
            case 'Verified': return { label: 'Verified', color: 'text-[var(--success-text)]', bg: 'bg-[var(--success-light)]', border: 'border-[var(--success)]', icon: <CheckCircle size={14} /> };
            case 'Rejected': return { label: 'Rejected', color: 'text-[var(--error-text)]', bg: 'bg-[var(--error-light)]', border: 'border-[var(--error)]', icon: <XOctagon size={14} /> };
            default: return { label: 'Pending', color: 'text-[var(--warning-text)]', bg: 'bg-[var(--warning-light)]', border: 'border-[var(--warning)]', icon: <Clock size={14} /> };
        }
    };

    const getRoleContext = () => {
        // Users module only handles consumers/customers
        return { key: 'consumer', label: 'Consumer Base' };
    };

    const currentRole = getRoleContext();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Only fetch consumer users
            const res = await adminAPI.getUsers('consumer', page, limit);
            if (res.status === 'success') {
                setUsers(res.data.users || []);
                setTotalPages(res.totalPages || 1);
                setTotalUsers(res.total || 0);
            }
        } catch (err) {
            console.error("Failed to load consumers", err);
            toast.error("Failed to load consumers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    // Remove the effect that depends on currentRole.key since we only handle consumers

    const filteredUsers = useMemo(() => {
        let result = users.filter(u =>
            (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone || '').includes(searchTerm) ||
            (u._id || u.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(u => (u.status || 'Active') === statusFilter);
        }

        // KYC Filter
        if (kycFilter !== 'All') {
            result = result.filter(u => getKycStatus(u) === kycFilter);
        }

        // Risk Filter
        if (riskFilter !== 'All') {
            result = result.filter(u => {
                const score = calculateRiskScore(u);
                const risk = getRiskBadge(score);
                return risk.label === riskFilter;
            });
        }

        if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start).getTime();
            const end = new Date(dateRange.end).getTime();
            result = result.filter(u => {
                const created = new Date(u.createdAt).getTime();
                return created >= start && created <= end;
            });
        }
        return result;
    }, [users, searchTerm, dateRange, statusFilter, kycFilter, riskFilter]);

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({ name: '', phone: '', email: '', password: '', role: 'Elite', hub: '', city: '', status: 'Active' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            role: user.role || 'Elite',
            hub: user.profile?.hub || '',
            city: user.profile?.address?.city || user.profile?.city || '',
            status: user.status || 'Active'
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await adminAPI.updateUser(editingUser._id || editingUser.id, formData);
                toast.success('Consumer updated successfully');
            } else {
                await adminAPI.createUser({ ...formData, role: 'consumer' });
                toast.success('Consumer added successfully');
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.message || "Failed to save consumer");
        } finally { setLoading(false); }
    };

    const handleDelete = async (userId) => {
        toast((t) => (
            <div className="flex flex-col gap-2 p-1 text-[var(--text-primary)]">
                <p className="text-xs font-bold">Delete this consumer?</p>
                <div className="flex gap-2">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await adminAPI.updateUser(userId, { isActive: false });
                            fetchUsers();
                            toast.success("Consumer deleted");
                        } catch (err) { toast.error("Failed to delete consumer"); }
                    }} className="btn-danger text-[10px] font-bold">Confirm</button>
                    <button onClick={() => toast.dismiss(t.id)} className="btn-secondary text-[10px] font-bold">Cancel</button>
                </div>
            </div>
        ));
    };

    const handleStatusUpdate = async (userId, updates) => {
        try {
            await adminAPI.updateUser(userId, updates);
            fetchUsers();
            toast.success('Consumer status updated');
        } catch (err) { 
            toast.error('Failed to update consumer status'); 
        }
    };

    const handleKycAction = async (userId, action, note = '') => {
        try {
            await adminAPI.updateUserKyc(userId, { status: action, note });
            fetchUsers();
            toast.success(`KYC ${action} successfully`);
        } catch (err) {
            toast.error('KYC action failed');
        }
    };

    const handleBlockUser = async (userId, block = true) => {
        try {
            await adminAPI.updateUser(userId, { 
                status: block ? 'Blocked' : 'Active',
                blockedAt: block ? new Date() : null 
            });
            fetchUsers();
            toast.success(`Consumer ${block ? 'blocked' : 'unblocked'} successfully`);
        } catch (err) {
            toast.error(`Failed to ${block ? 'block' : 'unblock'} consumer`);
        }
    };

    const handleFlagUser = async (userId, flagged = true) => {
        try {
            await adminAPI.updateUser(userId, { 
                flagged,
                flaggedAt: flagged ? new Date() : null 
            });
            fetchUsers();
            toast.success(`Consumer ${flagged ? 'flagged as risky' : 'unflagged'}`);
        } catch (err) {
            toast.error('Failed to update consumer flag status');
        }
    };

    const openUserDetails = (user) => {
        setSelectedUser(user);
        setIsUserDetailsOpen(true);
    };

    return (
        <div className="space-y-4 pb-10 max-w-full mx-auto px-1 transition-colors duration-500">
            {/* ── HIGH-DENSITY PREMIUM CONTROL ── */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight capitalize leading-none">Consumer Base</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide opacity-80">Customer Management System</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="relative flex-1 lg:w-72 group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                className="w-full h-11 bg-background/50 border border-border rounded-xl pl-12 pr-4 text-xs font-bold text-content outline-none focus:border-brand transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`btn-secondary flex items-center gap-2 ${showFilters ? 'btn-primary' : ''}`}
                            >
                                <Filter size={15} />
                                Filters
                            </button>
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full right-0 mt-3 p-6 admin-card z-50 w-80 border-t-4 border-t-[var(--primary)]"
                                    >
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Advanced Filters</h4>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Status</label>
                                                    <select 
                                                        value={statusFilter} 
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="admin-select"
                                                    >
                                                        <option value="All">All Status</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Blocked">Blocked</option>
                                                        <option value="Suspended">Suspended</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">KYC Status</label>
                                                    <select 
                                                        value={kycFilter} 
                                                        onChange={(e) => setKycFilter(e.target.value)}
                                                        className="admin-select"
                                                    >
                                                        <option value="All">All KYC</option>
                                                        <option value="Verified">Verified</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Risk Level</label>
                                                    <select 
                                                        value={riskFilter} 
                                                        onChange={(e) => setRiskFilter(e.target.value)}
                                                        className="admin-select"
                                                    >
                                                        <option value="All">All Risk Levels</option>
                                                        <option value="Low">Low Risk</option>
                                                        <option value="Medium">Medium Risk</option>
                                                        <option value="High">High Risk</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    setStatusFilter('All');
                                                    setKycFilter('All');
                                                    setRiskFilter('All');
                                                }}
                                                className="text-xs font-medium text-[var(--error)] uppercase hover:underline"
                                            >
                                                Clear All Filters
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={fetchUsers} className="btn-secondary w-12 h-12 p-0 flex items-center justify-center rounded-xl">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handleOpenAdd}
                                className="btn-primary flex items-center gap-2 h-12 px-6 rounded-xl text-sm font-bold"
                            >
                                <UserPlus size={18} /> Add Consumer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PROFESSIONAL HIGH-DENSITY REGISTRY ── */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Consumer Profile</th>
                                <th>Contact & Location</th>
                                <th className="text-center">KYC Status</th>
                                <th className="text-center">Risk Score</th>
                                <th className="text-center">Activity</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-24">
                                        <div className="w-10 h-10 mx-auto border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => {
                                const riskScore = calculateRiskScore(user);
                                const riskBadge = getRiskBadge(riskScore);
                                const kycStatus = getKycStatus(user);
                                const kycBadge = getKycBadge(kycStatus);
                                const totalSpent = user.stats?.totalSpent || 0;
                                const bookingCount = user.stats?.totalBookings || 0;
                                const lastActivity = user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never';

                                return (
                                    <tr key={user._id || user.id}>
                                        {/* Customer Profile */}
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-sm border border-[var(--border)] flex items-center justify-center uppercase">
                                                        {(user.name || 'C')[0]}
                                                    </div>
                                                    {user.flagged && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error)] rounded-full flex items-center justify-center">
                                                            <Flag size={8} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] capitalize leading-none truncate">{user.name}</p>
                                                        {user.flagged && (
                                                            <span className="badge badge-error text-xs">
                                                                RISKY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xs font-medium text-[var(--text-muted)] font-mono truncate">
                                                            ID-{(user._id || user.id).slice(-8).toUpperCase()}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            <CreditCard size={14} className="text-[var(--primary)]" />
                                                            <span className="text-xs font-semibold text-[var(--primary)]">₹{totalSpent.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Briefcase size={14} className="text-[var(--text-secondary)]" />
                                                            <span className="text-xs font-semibold text-[var(--text-secondary)]">{bookingCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact & Location */}
                                        <td>
                                            <div className="flex flex-col gap-2 min-w-0">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Phone size={16} className="text-[var(--primary)] shrink-0" />
                                                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{user.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Mail size={16} className="text-[var(--text-secondary)] shrink-0" />
                                                    <span className="text-xs font-bold text-[var(--text-secondary)] truncate">{user.email || 'No email'}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <LocationIcon size={16} className="text-[var(--text-secondary)] shrink-0" />
                                                    <span className="text-xs font-bold text-[var(--text-secondary)] capitalize truncate">
                                                        {user.profile?.city || user.profile?.address?.city || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                {/* KYC Status */}
                                <td className="text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`badge ${kycStatus === 'Verified' ? 'badge-success' : kycStatus === 'Rejected' ? 'badge-error' : 'badge-warning'} flex items-center gap-1`}>
                                            {kycBadge.icon}
                                            {kycBadge.label}
                                        </div>
                                        {kycStatus === 'Pending' && user.kyc?.document && (
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => handleKycAction(user._id || user.id, 'verified')}
                                                    className="px-2 py-1 bg-[var(--success-light)] text-[var(--success-text)] text-xs font-medium rounded hover:bg-[var(--success)] hover:text-white transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleKycAction(user._id || user.id, 'rejected')}
                                                    className="px-2 py-1 bg-[var(--error-light)] text-[var(--error-text)] text-xs font-medium rounded hover:bg-[var(--error)] hover:text-white transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                        {/* Risk Score */}
                                        <td className="text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center relative ${
                                                    riskScore <= 30 ? 'border-[var(--success)] bg-[var(--success-light)]' :
                                                    riskScore <= 60 ? 'border-[var(--warning)] bg-[var(--warning-light)]' :
                                                    'border-[var(--error)] bg-[var(--error-light)]'
                                                }`}>
                                                    <span className={`text-xs font-semibold ${
                                                        riskScore <= 30 ? 'text-[var(--success-text)]' :
                                                        riskScore <= 60 ? 'text-[var(--warning-text)]' :
                                                        'text-[var(--error-text)]'
                                                    }`}>{riskScore}</span>
                                                </div>
                                                <span className={`text-xs font-medium uppercase ${
                                                    riskScore <= 30 ? 'text-[var(--success-text)]' :
                                                    riskScore <= 60 ? 'text-[var(--warning-text)]' :
                                                    'text-[var(--error-text)]'
                                                }`}>
                                                    {riskBadge.label} Risk
                                                </span>
                                            </div>
                                        </td>

                                        {/* Activity */}
                                        <td className="text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon size={16} className="text-[var(--primary)] shrink-0" />
                                                    <span className="text-xs font-bold text-[var(--text-primary)]">{lastActivity}</span>
                                                </div>
                                                <button 
                                                    onClick={() => openUserDetails(user)}
                                                    className="text-xs font-medium text-[var(--primary)] uppercase hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="text-center">
                                            <div className={`badge ${
                                                user.status === 'Blocked' ? 'badge-error' : 'badge-success'
                                            } flex items-center gap-2`}>
                                                <div className={`w-2 h-2 rounded-full ${user.status === 'Blocked' ? 'bg-[var(--error)]' : 'bg-[var(--success)]'} animate-pulse`} />
                                                {user.status || 'Active'}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openUserDetails(user)} 
                                                    title="View Profile"
                                                    className="btn-secondary w-11 h-11 p-0 flex items-center justify-center rounded-xl hover:text-brand transition-colors group/view"
                                                >
                                                    <Eye size={18} className="group-hover/view:scale-110 transition-transform" />
                                                </button>
                                                
                                                {user.status !== 'Blocked' ? (
                                                    <button 
                                                        onClick={() => handleBlockUser(user._id || user.id, true)} 
                                                        title="Block User"
                                                        className="btn-danger w-11 h-11 p-0 flex items-center justify-center rounded-xl shadow-lg shadow-red-500/10 group/ban"
                                                    >
                                                        <Ban size={18} className="group-hover/ban:scale-110 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleBlockUser(user._id || user.id, false)} 
                                                        title="Unblock User"
                                                        className="w-11 h-11 bg-[var(--success-light)] text-[var(--success-text)] hover:bg-[var(--success)] hover:text-white rounded-xl transition-all flex items-center justify-center border border-[var(--success)] shadow-lg shadow-emerald-500/10 group/unban"
                                                    >
                                                        <CheckCircle size={18} className="group-hover/unban:scale-110 transition-transform" />
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => handleFlagUser(user._id || user.id, !user.flagged)} 
                                                    title={user.flagged ? "Remove Flag" : "Flag as Risky"}
                                                    className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center border group/flag ${
                                                        user.flagged 
                                                            ? 'bg-[var(--warning-light)] text-[var(--warning-text)] border-[var(--warning)] hover:bg-[var(--warning)] hover:text-white' 
                                                            : 'btn-secondary'
                                                    }`}
                                                >
                                                    <Flag size={18} className="group-hover/flag:scale-110 transition-transform" />
                                                </button>

                                                <button 
                                                    onClick={() => handleOpenEdit(user)} 
                                                    title="Edit User"
                                                    className="btn-secondary w-11 h-11 p-0 flex items-center justify-center rounded-xl group/edit"
                                                >
                                                    <Edit2 size={18} className="group-hover/edit:rotate-12 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <footer className="px-8 py-5 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-between">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-4">
                        <Activity size={18} className="text-[var(--primary)]" />
                        Total Consumers: {totalUsers}
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary w-10 h-10 p-0 flex items-center justify-center disabled:opacity-30"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <div className="h-10 px-6 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center gap-5">
                            <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">Page {page}</span>
                            <span className="w-px h-4 bg-[var(--border)]" />
                            <span className="text-[11px] font-black text-[var(--text-secondary)] lowercase tracking-tight">{totalPages} clusters</span>
                        </div>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-secondary w-10 h-10 p-0 flex items-center justify-center disabled:opacity-30"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </footer>
            </div>

            {/* Entity Configuration Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50" />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                            className="admin-card w-full max-w-lg relative z-10 overflow-hidden flex flex-col"
                        >
                            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter capitalize leading-none mb-1.5">{editingUser ? 'Update Consumer' : 'Add New Consumer'}</h2>
                                    <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest pl-1">Consumer Management System</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary w-12 h-12 p-0 flex items-center justify-center">
                                    <X size={26} />
                                </button>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: 'Consumer Name', key: 'name', type: 'text', icon: <UsersIcon size={18} />, placeholder: 'Full Name' },
                                            { label: 'Phone Number', key: 'phone', type: 'tel', icon: <Phone size={18} />, placeholder: 'Contact Number' },
                                            { label: 'Email Address', key: 'email', type: 'email', icon: <Mail size={18} />, placeholder: 'Email Address' },
                                            ...(!editingUser ? [{ label: 'Password', key: 'password', type: 'password', icon: <Key size={18} />, placeholder: 'Account Password' }] : [])
                                        ].map((field) => (
                                            <div key={field.key} className="space-y-2.5">
                                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{field.label}</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-all pointer-events-none z-10">{field.icon}</div>
                                                    <input
                                                        required
                                                        type={field.type}
                                                        placeholder={field.placeholder}
                                                        className="admin-input"
                                                        style={{ paddingLeft: '48px' }}
                                                        value={formData[field.key]}
                                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button disabled={loading} className="btn-primary w-full h-16 text-[12px] uppercase tracking-[0.4em] disabled:opacity-50 mt-4 relative group">
                                         <span className="relative z-10">{loading ? <RefreshCw size={24} className="animate-spin mx-auto" /> : (editingUser ? 'UPDATE CONSUMER' : 'ADD CONSUMER')}</span>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* User Details Modal */}
            <AnimatePresence>
                {isUserDetailsOpen && selectedUser && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsUserDetailsOpen(false)} 
                            className="absolute inset-0 bg-black/50" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                            className="admin-card w-full max-w-6xl h-[90vh] relative z-10 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)] shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-[var(--primary)]/20 border-2 border-white/10">
                                        {(selectedUser.name || 'U')[0]}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none">{selectedUser.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <Activity size={10} className="text-[var(--primary)]" />
                                            <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] opacity-80">Consumer Profile & Intelligence</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsUserDetailsOpen(false)} 
                                    className="w-10 h-10 bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column - Profile & Stats */}
                                    <div className="space-y-6">
                                        {/* Basic Info Card */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Consumer Overview</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Phone size={16} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Mail size={16} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.email || 'No email'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <LocationIcon size={16} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
                                                        {selectedUser.profile?.city || selectedUser.profile?.address?.city || 'Unknown Location'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CalendarIcon size={16} className="text-[var(--primary)]" />
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">
                                                        Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Card */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Consumer Statistics</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                                    <div className="text-xl font-bold text-[var(--primary)] mb-0.5">
                                                        {selectedUser.stats?.totalBookings || 0}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                        Total Bookings
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                                    <div className="text-xl font-bold text-[var(--primary)] mb-0.5">
                                                        ₹{(selectedUser.stats?.totalSpent || 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                        Total Spent
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                                    <div className="text-xl font-bold text-[var(--error)] mb-0.5">
                                                        {selectedUser.stats?.cancellations || 0}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                        Cancellations
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                                    <div className="text-xl font-bold text-[var(--warning)] mb-0.5">
                                                        {selectedUser.stats?.complaints || 0}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                        Complaints
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Risk Assessment */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Risk Assessment</h3>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className={`w-24 h-24 rounded-full border-white/5 ${getRiskBadge(calculateRiskScore(selectedUser)).border} ${getRiskBadge(calculateRiskScore(selectedUser)).bg} flex items-center justify-center relative`}>
                                                    <span className={`text-xl font-black ${getRiskBadge(calculateRiskScore(selectedUser)).color}`}>
                                                        {calculateRiskScore(selectedUser)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-sm font-black uppercase tracking-widest ${getRiskBadge(calculateRiskScore(selectedUser)).color}`}>
                                                    {getRiskBadge(calculateRiskScore(selectedUser)).label} Risk Consumer
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Column - Activity & History */}
                                    <div className="space-y-6">
                                        {/* Recent Activity */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Recent Activity</h3>
                                            <div className="space-y-3">
                                                {selectedUser.recentBookings?.length > 0 ? (
                                                    selectedUser.recentBookings.slice(0, 5).map((booking, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-bold text-[var(--text-primary)]">{booking.service || 'Service'}</p>
                                                                <p className="text-[10px] text-[var(--text-secondary)]">
                                                                    {new Date(booking.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-[var(--primary)]">₹{booking.amount || 0}</p>
                                                                <span className={`badge text-[8px] ${
                                                                    booking.status === 'completed' ? 'badge-success' :
                                                                    booking.status === 'cancelled' ? 'badge-error' :
                                                                    'badge-warning'
                                                                }`}>
                                                                    {booking.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                                        <History size={32} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm font-bold">No recent activity</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* KYC Status */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">KYC Verification</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">Status</span>
                                                    <div className={`badge ${getKycBadge(getKycStatus(selectedUser)).bg} ${getKycBadge(getKycStatus(selectedUser)).color}`}>
                                                        {getKycStatus(selectedUser)}
                                                    </div>
                                                </div>
                                                
                                                {selectedUser.kyc?.documents?.front && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2 p-3 bg-[var(--primary-light)] rounded-xl border border-[var(--primary)]/30">
                                                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[var(--primary)]">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest leading-none mb-1">ID Number</p>
                                                                <span className="text-xs font-bold text-[var(--text-primary)]">{selectedUser.kyc.documentId || 'Not provided'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="group relative aspect-[3/2] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
                                                                <img 
                                                                    src={selectedUser.kyc.documents.front} 
                                                                    alt="Front Proof" 
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <button 
                                                                        onClick={() => setViewingDoc({ url: selectedUser.kyc.documents.front, side: 'Front' })}
                                                                        className="p-3 bg-white/5 rounded-full text-slate-900 shadow-2xl shadow-black/50"
                                                                    >
                                                                        <Eye size={20} />
                                                                    </button>
                                                                </div>
                                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-black text-white uppercase tracking-widest">Front View</div>
                                                            </div>

                                                            {selectedUser.kyc.documents.back && (
                                                                <div className="group relative aspect-[3/2] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
                                                                    <img 
                                                                        src={selectedUser.kyc.documents.back} 
                                                                        alt="Back Proof" 
                                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <button 
                                                                            onClick={() => setViewingDoc({ url: selectedUser.kyc.documents.back, side: 'Back' })}
                                                                            className="p-3 bg-white/5 rounded-full text-slate-900 shadow-2xl shadow-black/50"
                                                                        >
                                                                            <Eye size={20} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-black text-white uppercase tracking-widest">Back View</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {getKycStatus(selectedUser) === 'Pending' && (
                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            onClick={async () => {
                                                                if(window.confirm('Approve this user for higher trust limits?')) {
                                                                    handleKycAction(selectedUser._id || selectedUser.id, 'verified');
                                                                }
                                                            }}
                                                            className="flex-1 py-3 bg-[var(--success)] text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-[var(--success)]/20 hover:translate-y-[-2px] transition-all"
                                                        >
                                                            Approve Identity
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                const reason = prompt('Reason for rejection:');
                                                                if(reason) {
                                                                    handleKycAction(selectedUser._id || selectedUser.id, 'rejected', reason);
                                                                }
                                                            }}
                                                            className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--error)] border border-[var(--error)] text-[10px] font-black uppercase rounded-xl hover:bg-[var(--error)] hover:text-white transition-all"
                                                        >
                                                            Reject Proof
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Admin Actions */}
                                    <div className="space-y-6">
                                        {/* Admin Actions */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Admin Actions</h3>
                                            <div className="space-y-3">
                                                {selectedUser.status !== 'Blocked' ? (
                                                    <button 
                                                        onClick={() => {
                                                            handleBlockUser(selectedUser._id || selectedUser.id, true);
                                                            setIsUserDetailsOpen(false);
                                                        }}
                                                        className="w-full py-4 bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error)] text-xs font-black uppercase rounded-xl hover:bg-[var(--error)] hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/10"
                                                    >
                                                        <Ban size={18} />
                                                        Block Consumer
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            handleBlockUser(selectedUser._id || selectedUser.id, false);
                                                            setIsUserDetailsOpen(false);
                                                        }}
                                                        className="w-full py-4 bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success)] text-xs font-black uppercase rounded-xl hover:bg-[var(--success)] hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10"
                                                    >
                                                        <CheckCircle size={18} />
                                                        Unblock Consumer
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => {
                                                        handleFlagUser(selectedUser._id || selectedUser.id, !selectedUser.flagged);
                                                        setIsUserDetailsOpen(false);
                                                    }}
                                                    className={`w-full py-4 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/10 border border-[var(--warning)] ${
                                                        selectedUser.flagged 
                                                            ? 'bg-[var(--warning)] text-white' 
                                                            : 'bg-[var(--warning-light)] text-[var(--warning-text)] hover:bg-[var(--warning)] hover:text-white'
                                                    }`}
                                                >
                                                    <Flag size={18} />
                                                    {selectedUser.flagged ? 'Remove Flag' : 'Flag as Risky'}
                                                </button>

                                                <button 
                                                    onClick={() => {
                                                        setIsUserDetailsOpen(false);
                                                        handleOpenEdit(selectedUser);
                                                    }}
                                                    className="w-full py-4 bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)] text-xs font-black uppercase rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--primary)]/10"
                                                >
                                                    <Edit2 size={18} />
                                                    Edit Consumer
                                                </button>
                                            </div>
                                        </div>

                                        {/* User Flags & Notes */}
                                        <div className="admin-card-compact">
                                            <h3 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-wide">Flags & Notes</h3>
                                            <div className="space-y-3">
                                                {selectedUser.flagged && (
                                                    <div className="p-3 bg-[var(--error-light)] border border-[var(--error)] rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Flag size={14} className="text-[var(--error)]" />
                                                            <span className="text-sm font-black text-[var(--error-text)] uppercase">Risky Consumer</span>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--error-text)]">
                                                            Flagged on {selectedUser.flaggedAt ? new Date(selectedUser.flaggedAt).toLocaleDateString() : 'Unknown date'}
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedUser.status === 'Blocked' && (
                                                    <div className="p-3 bg-[var(--error-light)] border border-[var(--error)] rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Ban size={14} className="text-[var(--error)]" />
                                                            <span className="text-sm font-black text-[var(--error-text)] uppercase">Blocked Consumer</span>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--error-text)]">
                                                            Blocked on {selectedUser.blockedAt ? new Date(selectedUser.blockedAt).toLocaleDateString() : 'Unknown date'}
                                                        </p>
                                                    </div>
                                                )}

                                                {!selectedUser.flagged && selectedUser.status !== 'Blocked' && (
                                                    <div className="p-3 bg-[var(--success-light)] border border-[var(--success)] rounded-lg text-center">
                                                        <CheckCircle size={24} className="text-[var(--success)] mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-[var(--success-text)]">Clean Record</p>
                                                        <p className="text-[10px] text-[var(--success-text)]">No flags or restrictions</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Viewer Modal */}
            <AnimatePresence>
                {viewingDoc && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setViewingDoc(null)} 
                            className="absolute inset-0 bg-black/95 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 max-w-4xl w-full max-h-[90vh] bg-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b flex justify-between items-center bg-white/5">
                                <div>
                                     <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Verification Proof</h2>
                                     <p className="text-xs font-medium text-white/40">Inspecting {viewingDoc.side} ID document for {selectedUser?.name}</p>
                                </div>
                                <button 
                                     onClick={() => setViewingDoc(null)}
                                     className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-all"
                                >
                                     <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-8">
                                <img 
                                     src={viewingDoc.url.startsWith('http') ? viewingDoc.url : `${import.meta.env.VITE_API_URL || ''}${viewingDoc.url}`} 
                                     alt="KYC Proof" 
                                     className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
                                />
                            </div>
                            <div className="p-6 bg-white/5 border-t flex justify-center gap-4">
                                <button onClick={() => setViewingDoc(null)} className="btn-secondary px-8 font-black uppercase">Close Viewer</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsers;
