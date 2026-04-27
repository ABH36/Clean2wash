import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Database, Eye, Plus, Search, Shield, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

const getRoleColor = (level = 5) => {
    if (level === 1) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (level <= 3) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (level <= 5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
};

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        level: 5
    });
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                adminAPI.getAllRoles(),
                adminAPI.getAllPermissions()
            ]);

            setRoles(rolesRes?.data?.roles || []);
            setPermissions(permissionsRes?.data?.permissions || []);
        } catch (error) {
            console.error('Role management load error:', error);
            toast.error('Failed to load role data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredRoles = useMemo(() => (
        roles.filter((role) => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return (
                String(role?.name || '').toLowerCase().includes(q)
                || String(role?.description || '').toLowerCase().includes(q)
            );
        })
    ), [roles, searchQuery]);

    const groupedPermissions = useMemo(() => (
        permissions.reduce((accumulator, permission) => {
            const moduleName = String(permission?.module || 'general').toUpperCase();
            if (!accumulator[moduleName]) accumulator[moduleName] = [];
            accumulator[moduleName].push(permission);
            return accumulator;
        }, {})
    ), [permissions]);

    const openPermissionsModal = (role) => {
        setSelectedRole(role);
        setSelectedPermissionIds((role?.permissions || []).map((permission) => (
            typeof permission === 'string' ? permission : permission?._id
        )).filter(Boolean));
        setShowPermissionsModal(true);
    };

    const handleCreateRole = async () => {
        if (!createForm.name || !createForm.description || !createForm.level) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const res = await adminAPI.createRole({
                name: createForm.name.trim(),
                description: createForm.description.trim(),
                level: Number(createForm.level),
                permissions: []
            });

            if (res?.status === 'success') {
                toast.success('Role created successfully');
                setShowCreateModal(false);
                setCreateForm({ name: '', description: '', level: 5 });
                await loadData();
            } else {
                toast.error(res?.message || 'Role creation failed');
            }
        } catch (error) {
            toast.error(error?.message || 'Role creation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!selectedRole?._id) return;
        setSaving(true);
        try {
            const res = await adminAPI.updateRolePermissions(selectedRole._id, selectedPermissionIds);
            if (res?.status === 'success') {
                toast.success('Role permissions updated');
                setShowPermissionsModal(false);
                setSelectedRole(null);
                await loadData();
            } else {
                toast.error(res?.message || 'Permission update failed');
            }
        } catch (error) {
            toast.error(error?.message || 'Permission update failed');
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (permissionId) => {
        setSelectedPermissionIds((current) => (
            current.includes(permissionId)
                ? current.filter((id) => id !== permissionId)
                : [...current, permissionId]
        ));
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-[var(--bg-secondary)] rounded w-1/4" />
                    <div className="h-12 bg-[var(--bg-secondary)] rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-32 bg-[var(--bg-secondary)] rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Role Management</h1>
                    <p className="text-xs font-medium text-[var(--text-secondary)] opacity-70">Manage access levels and module permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary h-11 flex items-center gap-2"
                >
                    <Plus size={18} />
                    Create Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Crown size={16} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.filter((role) => role.level === 1).length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Super Roles</div>
                        </div>
                    </div>
                </div>
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Shield size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Total Roles</div>
                        </div>
                    </div>
                </div>
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                            <Users size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{roles.reduce((sum, role) => sum + (role.adminCount || 0), 0)}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Assigned Admins</div>
                        </div>
                    </div>
                </div>
                <div className="admin-card-compact shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                            <Database size={16} className="text-orange-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[var(--text-primary)]">{permissions.length}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Permissions</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="admin-input pl-12"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <motion.div
                        key={role._id}
                        whileHover={{ y: -2 }}
                        className="admin-card"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-[var(--text-primary)]">{role.name}</h3>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(role.level)}`}>
                                    Level {role.level}
                                </span>
                            </div>
                            {role.isSystem && <Crown size={16} className="text-purple-500" />}
                        </div>

                        <p className="text-sm text-[var(--text-secondary)] mb-4">{role.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--text-primary)]">{role.permissions?.length || 0}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Permissions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--text-primary)]">{role.adminCount || 0}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Admins</div>
                            </div>
                        </div>

                        <button
                            onClick={() => openPermissionsModal(role)}
                            className="h-10 w-full rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center gap-2 hover:text-brand hover:border-brand/40 transition-all"
                        >
                            <Eye size={16} />
                            Manage Permissions
                        </button>
                    </motion.div>
                ))}
            </div>

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
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role Name *</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={createForm.name}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description *</label>
                                        <textarea
                                            rows={3}
                                            className="admin-input"
                                            value={createForm.description}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Level *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            className="admin-input"
                                            value={createForm.level}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, level: event.target.value }))}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateRole}
                                            disabled={saving}
                                            className="btn-primary flex-1"
                                        >
                                            {saving ? 'Creating...' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                            <div className="admin-card w-full max-w-3xl max-h-[85vh] overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedRole.name} Permissions</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{selectedRole.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPermissionsModal(false)}
                                        className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="overflow-y-auto max-h-[56vh] pr-1 space-y-3">
                                    {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                                        <div key={moduleName} className="border border-[var(--border)] rounded-lg p-3">
                                            <p className="text-[11px] font-black text-[var(--text-primary)] uppercase mb-2">{moduleName}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => (
                                                    <label key={permission._id} className="flex items-start gap-2 p-2 rounded-md bg-[var(--bg-secondary)] cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissionIds.includes(permission._id)}
                                                            onChange={() => togglePermission(permission._id)}
                                                            className="mt-0.5"
                                                        />
                                                        <span className="text-[11px] font-medium text-[var(--text-primary)]">
                                                            {permission.action.toUpperCase()} • {permission.resource}
                                                            <span className="block text-[10px] text-[var(--text-secondary)]">{permission.description}</span>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={() => setShowPermissionsModal(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdatePermissions}
                                        disabled={saving || selectedRole.isSystem}
                                        className="btn-primary"
                                    >
                                        {selectedRole.isSystem ? 'System Role Locked' : (saving ? 'Saving...' : 'Save Permissions')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoleManagement;
