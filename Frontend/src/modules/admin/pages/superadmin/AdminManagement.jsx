import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, Search, Filter, MoreVertical, 
    Shield, Crown, Edit, Trash2, Eye, Lock,
    CheckCircle, XCircle, AlertTriangle, Activity,
    Calendar, Mail, Phone, MapPin, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        password: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [adminsRes, rolesRes] = await Promise.all([
                adminAPI.getAllAdmins(),
                adminAPI.getAllRoles()
            ]);
            
            if (adminsRes.status === 'success') {
                setAdmins(adminsRes.data.admins);
            }
            
            if (rolesRes.status === 'success') {
                setRoles(rolesRes.data.roles);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            admin.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || admin.role?.name.toLowerCase().includes(filterRole.toLowerCase());
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role) => {
        if (!role) return 'bg-gray-50 text-gray-600 border-gray-200';
        const colors = {
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200'
        };
        return colors[role.color] || colors.blue;
    };

    const getStatusColor = (status) => {
        const statusMap = {
            'ACTIVE': 'bg-green-50 text-green-600 border-green-200',
            'INACTIVE': 'bg-gray-50 text-gray-600 border-gray-200',
            'SUSPENDED': 'bg-red-50 text-red-600 border-red-200'
        };
        return statusMap[status] || statusMap.ACTIVE;
    };

    const formatLastLogin = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    const handleCreateAdmin = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: '',
            password: ''
        });
        setShowCreateModal(true);
    };

    const handleSubmitCreate = async () => {
        try {
            if (!formData.name || !formData.email || !formData.password || !formData.role) {
                toast.error('Please fill all required fields');
                return;
            }

            const response = await adminAPI.createAdmin(formData);
            
            if (response.status === 'success') {
                toast.success('Admin created successfully!');
                setShowCreateModal(false);
                fetchData(); // Refresh list
            } else {
                toast.error(response.message || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'Failed to create admin');
        }
    };

    const handleViewDetails = (admin) => {
        setSelectedAdmin(admin);
        setShowDetailsModal(true);
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!confirm('Are you sure you want to delete this admin?')) return;
        
        try {
            const response = await adminAPI.deleteAdmin(adminId);
            if (response.status === 'success') {
                toast.success('Admin deleted successfully');
                fetchData();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete admin');
        }
    };

    const handleResetPassword = async (adminId) => {
        if (!confirm('Are you sure you want to reset this admin\'s password?')) return;
        
        try {
            const response = await adminAPI.resetAdminPassword(adminId);
            if (response.status === 'success') {
                toast.success(`Password reset! Temporary password: ${response.data.temporaryPassword}`);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to reset password');
        }
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
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        className="admin-input"
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="admin-input"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password *</label>
                                    <input
                                        type="password"
                                        className="admin-input"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role *</label>
                                    <select 
                                        className="admin-select"
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="">Select role</option>
                                        {roles.map(role => (
                                            <option key={role._id} value={role._id}>{role.name}</option>
                                        ))}
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
                                        onClick={handleSubmitCreate}
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
                                        <div className="text-lg font-bold text-[var(--text-primary)]">
                                            {selectedAdmin.role?.permissions?.length || 0}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Permissions</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="text-lg font-bold text-[var(--text-primary)]">
                                            {selectedAdmin.activityCount || 0}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Activities</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="text-lg font-bold text-[var(--text-primary)]">
                                            Level {selectedAdmin.role?.level || 'N/A'}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Access Level</div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone size={18} className="text-[var(--primary)]" />
                                        <span className="text-[var(--text-primary)] font-medium">{selectedAdmin.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={18} className="text-[var(--primary)]" />
                                        <span className="text-[var(--text-primary)] font-medium">{selectedAdmin.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={18} className="text-[var(--primary)]" />
                                        <span className="text-[var(--text-primary)] font-medium">
                                            Joined {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Activity size={18} className="text-[var(--primary)]" />
                                        <span className="text-[var(--text-primary)] font-medium">
                                            Last active {formatLastLogin(selectedAdmin.lastLogin)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                                    <button 
                                        className="btn-secondary flex-1 flex items-center justify-center gap-2 group/edit"
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        <Edit size={18} className="group-hover/edit:scale-110 transition-transform" />
                                        Edit Admin
                                    </button>
                                    <button 
                                        className="btn-danger flex-1 flex items-center justify-center gap-2 group/lock"
                                        onClick={() => {
                                            handleResetPassword(selectedAdmin._id);
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        <Lock size={18} className="group-hover/lock:scale-110 transition-transform" />
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Admin Management</h1>
                    <p className="text-xs font-medium text-[var(--text-secondary)] opacity-70">Manage system administrators and their permissions</p>
                </div>
                <button
                    onClick={handleCreateAdmin}
                    className="btn-primary flex items-center gap-2 group/new"
                >
                    <Plus size={18} className="group-hover/new:scale-125 transition-transform" />
                    Create Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-card-compact border-l-4 border-l-purple-500 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Crown size={16} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">1</div>
                            <div className="text-sm text-[var(--text-secondary)]">Super Admins</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact border-l-4 border-l-blue-500 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Shield size={16} className="text-blue-600" />
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
                            <div className="text-lg font-bold text-[var(--text-primary)]">{admins.filter(a => a.status === 'ACTIVE').length}</div>
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
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="admin-input pl-12"
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
                                <tr key={admin._id}>
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
                                            {admin.role?.permissions?.length || 0} permissions
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(admin)}
                                                className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-brand hover:border-brand/40 transition-all group/view"
                                                title="View Details"
                                            >
                                                <Eye size={18} className="group-hover/view:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-amber-600 hover:border-amber-200 transition-all group/edit"
                                                title="Edit Admin"
                                            >
                                                <Edit size={18} className="group-hover/edit:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all"
                                                title="More Actions"
                                            >
                                                <MoreVertical size={18} />
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
