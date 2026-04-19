import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, Search, Filter, MoreVertical, 
    Shield, Crown, Edit, Trash2, Eye, Lock,
    CheckCircle, XCircle, AlertTriangle, Activity,
    Calendar, Mail, Phone, MapPin, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Mock data - replace with actual API calls
    const mockAdmins = [
        {
            id: 1,
            name: 'Super Administrator',
            email: 'admin@clean2wash.com',
            phone: '+91 98765 43210',
            role: { name: 'Super Admin', level: 1, color: 'purple' },
            status: 'active',
            lastLogin: '2024-04-17T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            permissions: 45,
            activityCount: 1250,
            location: 'Mumbai, India'
        },
        {
            id: 2,
            name: 'Operations Manager',
            email: 'ops@clean2wash.com',
            phone: '+91 98765 43211',
            role: { name: 'Admin', level: 2, color: 'blue' },
            status: 'active',
            lastLogin: '2024-04-17T09:15:00Z',
            createdAt: '2024-02-15T00:00:00Z',
            permissions: 35,
            activityCount: 890,
            location: 'Delhi, India'
        },
        {
            id: 3,
            name: 'Support Lead',
            email: 'support@clean2wash.com',
            phone: '+91 98765 43212',
            role: { name: 'Sub-Admin', level: 3, color: 'green' },
            status: 'active',
            lastLogin: '2024-04-16T18:45:00Z',
            createdAt: '2024-03-01T00:00:00Z',
            permissions: 15,
            activityCount: 456,
            location: 'Bangalore, India'
        }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setAdmins(mockAdmins);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            admin.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || admin.role.name.toLowerCase().includes(filterRole.toLowerCase());
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role) => {
        const colors = {
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200'
        };
        return colors[role.color] || colors.blue;
    };

    const getStatusColor = (status) => {
        return status === 'active' 
            ? 'bg-green-50 text-green-600 border-green-200'
            : 'bg-red-50 text-red-600 border-red-200';
    };

    const formatLastLogin = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    const handleCreateAdmin = () => {
        setShowCreateModal(true);
    };

    const handleViewDetails = (admin) => {
        setSelectedAdmin(admin);
        setShowDetailsModal(true);
    };

    const CreateAdminModal = () => (
        <AnimatePresence>
            {showCreateModal && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="admin-card w-full max-w-md">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Create New Admin</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="admin-input"
                                        placeholder="Enter email address"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="admin-input"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role</label>
                                    <select className="admin-select">
                                        <option value="">Select role</option>
                                        <option value="admin">Admin</option>
                                        <option value="sub-admin">Sub-Admin</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.success('Admin created successfully!');
                                            setShowCreateModal(false);
                                        }}
                                        className="btn-primary flex-1"
                                    >
                                        Create Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const AdminDetailsModal = () => (
        <AnimatePresence>
            {showDetailsModal && selectedAdmin && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowDetailsModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="admin-card w-full max-w-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Admin Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Profile Section */}
                                <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                                    <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {selectedAdmin.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[var(--text-primary)]">{selectedAdmin.name}</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">{selectedAdmin.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(selectedAdmin.role)}`}>
                                                {selectedAdmin.role.name}
                                            </span>
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(selectedAdmin.status)}`}>
                                                {selectedAdmin.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="text-lg font-bold text-[var(--text-primary)]">{selectedAdmin.permissions}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Permissions</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="text-lg font-bold text-[var(--text-primary)]">{selectedAdmin.activityCount}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Activities</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="text-lg font-bold text-[var(--text-primary)]">Level {selectedAdmin.role.level}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Access Level</div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone size={16} className="text-[var(--text-secondary)]" />
                                        <span className="text-[var(--text-primary)]">{selectedAdmin.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin size={16} className="text-[var(--text-secondary)]" />
                                        <span className="text-[var(--text-primary)]">{selectedAdmin.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={16} className="text-[var(--text-secondary)]" />
                                        <span className="text-[var(--text-primary)]">
                                            Joined {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Activity size={16} className="text-[var(--text-secondary)]" />
                                        <span className="text-[var(--text-primary)]">
                                            Last active {formatLastLogin(selectedAdmin.lastLogin)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                                    <button className="btn-secondary flex-1">
                                        <Edit size={16} />
                                        Edit Admin
                                    </button>
                                    <button className="btn-danger flex-1">
                                        <Lock size={16} />
                                        Reset Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-[var(--bg-secondary)] rounded w-1/4"></div>
                    <div className="h-12 bg-[var(--bg-secondary)] rounded"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded"></div>
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
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Management</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage system administrators and their permissions</p>
                </div>
                <button
                    onClick={handleCreateAdmin}
                    className="btn-primary"
                >
                    <Plus size={16} />
                    Create Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Crown size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">1</div>
                            <div className="text-sm text-[var(--text-secondary)]">Super Admins</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{admins.filter(a => a.role.name === 'Admin').length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Admins</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users size={20} className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{admins.filter(a => a.status === 'active').length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Active</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Activity size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{admins.filter(a => formatLastLogin(a.lastLogin).includes('h ago')).length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Online Today</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-card">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="admin-input pl-10"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="admin-select w-full sm:w-48"
                    >
                        <option value="all">All Roles</option>
                        <option value="super">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="sub">Sub-Admin</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
            </div>

            {/* Admin List */}
            <div className="admin-card">
                <div className="admin-table">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Admin</th>
                                <th>Role & Level</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Permissions</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-medium">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[var(--text-primary)]">{admin.name}</div>
                                                <div className="text-sm text-[var(--text-secondary)]">{admin.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-1">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(admin.role)}`}>
                                                {admin.role.name}
                                            </span>
                                            <div className="text-xs text-[var(--text-secondary)]">Level {admin.role.level}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(admin.status)}`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="text-sm text-[var(--text-primary)]">
                                            {formatLastLogin(admin.lastLogin)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">
                                            {admin.permissions} permissions
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(admin)}
                                                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                                title="Edit Admin"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                                title="More Actions"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateAdminModal />
            <AdminDetailsModal />
        </div>
    );
};

export default AdminManagement;