import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Plus, Search, Edit, Trash2, Eye, 
    Crown, Users, Settings, Lock, CheckCircle,
    XCircle, AlertTriangle, Star, Zap, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);

    // Mock data - replace with actual API calls
    const mockRoles = [
        {
            id: 1,
            name: 'Super Admin',
            slug: 'super_admin',
            level: 1,
            description: 'Full system access with admin management',
            color: 'purple',
            permissions: ['*:*'],
            permissionCount: 45,
            adminCount: 1,
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 2,
            name: 'Admin',
            slug: 'admin',
            level: 2,
            description: 'Full operational access without admin management',
            color: 'blue',
            permissions: ['bookings:*', 'drivers:*', 'users:*', 'services:*', 'analytics:*'],
            permissionCount: 35,
            adminCount: 3,
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 3,
            name: 'Sub-Admin',
            slug: 'sub_admin',
            level: 3,
            description: 'Limited operational access',
            color: 'green',
            permissions: ['bookings:view', 'drivers:view', 'users:view'],
            permissionCount: 15,
            adminCount: 2,
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 4,
            name: 'Manager',
            slug: 'manager',
            level: 4,
            description: 'Basic management access',
            color: 'orange',
            permissions: ['bookings:view', 'drivers:view'],
            permissionCount: 8,
            adminCount: 1,
            isSystem: false,
            createdAt: '2024-02-15T00:00:00Z'
        }
    ];

    const mockPermissions = [
        { module: 'bookings', action: 'view', description: 'View bookings' },
        { module: 'bookings', action: 'create', description: 'Create bookings' },
        { module: 'bookings', action: 'update', description: 'Update bookings' },
        { module: 'bookings', action: 'delete', description: 'Delete bookings' },
        { module: 'drivers', action: 'view', description: 'View drivers' },
        { module: 'drivers', action: 'create', description: 'Create drivers' },
        { module: 'drivers', action: 'update', description: 'Update drivers' },
        { module: 'drivers', action: 'delete', description: 'Delete drivers' },
        { module: 'users', action: 'view', description: 'View users' },
        { module: 'users', action: 'create', description: 'Create users' },
        { module: 'analytics', action: 'view', description: 'View analytics' },
        { module: 'admins', action: 'view', description: 'View admin list' },
        { module: 'admins', action: 'create', description: 'Create new admins' },
        { module: '*', action: '*', description: 'Full system access' }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setRoles(mockRoles);
            setPermissions(mockPermissions);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleColor = (color) => {
        const colors = {
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200'
        };
        return colors[color] || colors.blue;
    };

    const getRoleIcon = (level) => {
        switch (level) {
            case 1: return <Crown size={18} className="text-purple-600" />;
            case 2: return <Shield size={18} className="text-blue-600" />;
            case 3: return <Users size={18} className="text-green-600" />;
            default: return <Settings size={18} className="text-orange-600" />;
        }
    };

    const handleViewPermissions = (role) => {
        setSelectedRole(role);
        setShowPermissionsModal(true);
    };

    const CreateRoleModal = () => (
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
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Create New Role</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role Name</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="Enter role name"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
                                    <textarea
                                        className="admin-input"
                                        rows="3"
                                        placeholder="Enter role description"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Access Level</label>
                                    <select className="admin-select">
                                        <option value="">Select access level</option>
                                        <option value="4">Level 4 - Basic</option>
                                        <option value="5">Level 5 - Limited</option>
                                        <option value="6">Level 6 - Restricted</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Color Theme</label>
                                    <div className="flex gap-2">
                                        {['blue', 'green', 'orange', 'purple'].map(color => (
                                            <button
                                                key={color}
                                                className={`w-8 h-8 rounded-full border-white/5 ${getRoleColor(color).replace('text-', 'bg-').replace('border-', 'border-')}`}
                                            />
                                        ))}
                                    </div>
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
                                            toast.success('Role created successfully!');
                                            setShowCreateModal(false);
                                        }}
                                        className="btn-primary flex-1"
                                    >
                                        Create Role
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const PermissionsModal = () => (
        <AnimatePresence>
            {showPermissionsModal && selectedRole && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowPermissionsModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="admin-card w-full max-w-2xl max-h-[80vh] overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    {getRoleIcon(selectedRole.level)}
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedRole.name} Permissions</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{selectedRole.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPermissionsModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto max-h-96">
                                {selectedRole.permissions.includes('*:*') ? (
                                    <div className="text-center py-8">
                                        <Star size={48} className="text-[var(--primary)] mx-auto mb-4" />
                                        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">Full System Access</h4>
                                        <p className="text-[var(--text-secondary)]">This role has unrestricted access to all system features and functions.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {permissions
                                            .filter(p => selectedRole.permissions.some(rp => 
                                                rp === `${p.module}:${p.action}` || 
                                                rp === `${p.module}:*` ||
                                                rp === '*:*'
                                            ))
                                            .reduce((acc, permission) => {
                                                const module = permission.module;
                                                if (!acc[module]) acc[module] = [];
                                                acc[module].push(permission);
                                                return acc;
                                            }, {})
                                        }
                                        {Object.entries(
                                            permissions
                                                .filter(p => selectedRole.permissions.some(rp => 
                                                    rp === `${p.module}:${p.action}` || 
                                                    rp === `${p.module}:*`
                                                ))
                                                .reduce((acc, permission) => {
                                                    const module = permission.module;
                                                    if (!acc[module]) acc[module] = [];
                                                    acc[module].push(permission);
                                                    return acc;
                                                }, {})
                                        ).map(([module, modulePermissions]) => (
                                            <div key={module} className="border border-[var(--border)] rounded-lg p-4">
                                                <h5 className="font-medium text-[var(--text-primary)] mb-3 capitalize">{module} Module</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {modulePermissions.map((permission, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle size={18} className="text-green-500" />
                                                            <span className="text-[var(--text-secondary)]">{permission.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-[var(--bg-secondary)] rounded"></div>
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
                    <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Role Management</h1>
                    <p className="text-xs font-medium text-[var(--text-secondary)] opacity-70">Define and manage system access levels</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary h-11 flex items-center gap-2 group/new"
                >
                    <Plus size={20} className="group-hover/new:scale-110 transition-transform" />
                    Create Role
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Crown size={18} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.filter(r => r.level === 1).length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Super Admin</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Shield size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.filter(r => r.isSystem).length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">System Roles</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users size={20} className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.filter(r => !r.isSystem).length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Custom Roles</div>
                        </div>
                    </div>
                </div>
                
                <div className="admin-card-compact">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Database size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{permissions.length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Permissions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="admin-card">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-input pl-10"
                    />
                </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <motion.div
                        key={role.id}
                        whileHover={{ y: -2 }}
                        className="admin-card"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {getRoleIcon(role.level)}
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)]">{role.name}</h3>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(role.color)}`}>
                                        Level {role.level}
                                    </span>
                                </div>
                            </div>
                            {role.isSystem && (
                                <Lock size={18} className="text-[var(--text-secondary)] scale-90" title="System Role" />
                            )}
                        </div>
                        
                        <p className="text-sm text-[var(--text-secondary)] mb-4">{role.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--text-primary)]">{role.permissionCount}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Permissions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--text-primary)]">{role.adminCount}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Admins</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewPermissions(role)}
                                className="h-10 flex-1 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center gap-2 hover:text-brand hover:border-brand/40 transition-all group/view"
                            >
                                <Eye size={18} className="group-hover/view:scale-110 transition-transform" />
                                View Permissions
                            </button>
                            {!role.isSystem && (
                                <button className="h-10 flex-1 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center gap-2 hover:text-amber-600 hover:border-amber-200 transition-all group/edit">
                                    <Edit size={18} className="group-hover/edit:scale-110 transition-transform" />
                                    Edit
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <CreateRoleModal />
            <PermissionsModal />
        </div>
    );
};

export default RoleManagement;