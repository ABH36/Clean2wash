import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Database, Eye, Plus, Search, Shield, Users, 
    X, Check, Lock, ShieldAlert, RefreshCw, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';
import PageShell, { SectionCard, FilterBar, SearchBox, PageLoader } from '../../components/PageShell';

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
        name: '', description: '', level: 5
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
                String(role?.name || '').toLowerCase().includes(q) ||
                String(role?.description || '').toLowerCase().includes(q)
            );
        })
    ), [roles, searchQuery]);

    const groupedPermissions = useMemo(() => (
        permissions.reduce((acc, permission) => {
            const moduleName = String(permission?.module || 'general').toUpperCase();
            if (!acc[moduleName]) acc[moduleName] = [];
            acc[moduleName].push(permission);
            return acc;
        }, {})
    ), [permissions]);

    const getLevelBadge = (level) => {
        if (level === 1) return 'adm-badge-error';
        if (level <= 3) return 'adm-badge-amber';
        return 'adm-badge-navy';
    };

    const handleCreateRole = async () => {
        if (!createForm.name || !createForm.description) {
            toast.error('Please fill required fields');
            return;
        }
        setSaving(true);
        try {
            const res = await adminAPI.createRole({
                ...createForm,
                level: Number(createForm.level),
                permissions: []
            });
            if (res?.status === 'success') {
                toast.success('Role cluster deployed');
                setShowCreateModal(false);
                setCreateForm({ name: '', description: '', level: 5 });
                await loadData();
            }
        } catch (error) {
            toast.error(error?.message || 'Deployment failed');
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
                toast.success('Permission matrix updated');
                setShowPermissionsModal(false);
                await loadData();
            }
        } catch (error) {
            toast.error(error?.message || 'Sync failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell
            title="Access Architecture"
            subtitle="Hierarchical role management and permission matrix control"
            icon={ShieldAlert}
            accent="navy"
            badge="Perm-v2"
            actions={
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="adm-btn adm-btn-primary h-11 px-6 flex items-center gap-2"
                >
                    <Plus size={18} /> New Access Role
                </button>
            }
        >
            <div className="space-y-8">
                {/* ── METRICS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Root Entities', value: roles.filter(r => r.level === 1).length, icon: Crown, color: 'text-rose-500', bg: 'bg-rose-50' },
                        { label: 'Role Clusters', value: roles.length, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Auth Endpoints', value: permissions.length, icon: Database, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Total Subjects', value: roles.reduce((s, r) => s + (r.adminCount || 0), 0), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border border-slate-100 ${stat.bg} relative overflow-hidden group`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-16 h-16 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                <FilterBar>
                    <SearchBox 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        placeholder="Search permission schema..." 
                    />
                    <div className="ml-auto">
                        <button 
                            onClick={loadData}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </FilterBar>

                {loading ? (
                    <PageLoader />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map((role, i) => (
                            <motion.div
                                key={role._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="adm-card group hover:border-amber-500 transition-all flex flex-col"
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            {role.level === 1 ? <Crown size={24} /> : <Shield size={24} />}
                                        </div>
                                        <span className={`adm-badge ${getLevelBadge(role.level)}`}>Level {role.level}</span>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-amber-600 transition-colors">{role.name}</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed mb-8 line-clamp-2">{role.description}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Endpoints</p>
                                            <p className="text-sm font-black text-slate-800">{role.permissions?.length || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Subjects</p>
                                            <p className="text-sm font-black text-slate-800">{role.adminCount || 0}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedRole(role);
                                            setSelectedPermissionIds((role.permissions || []).map(p => typeof p === 'string' ? p : p._id));
                                            setShowPermissionsModal(true);
                                        }}
                                        className="w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl"
                                    >
                                        <Eye size={16} /> Manage Perms
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── CREATE MODAL ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">New Role Cluster</h3>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">Define access parameters</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Identifier</label>
                                    <input className="adm-input h-12" value={createForm.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Regional Supervisor" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hierarchy Level</label>
                                    <input className="adm-input h-12" type="number" min="1" max="10" value={createForm.level} onChange={e => setFormData({...formData, level: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea className="adm-input min-h-[100px] py-4" value={createForm.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe access scope..." />
                                </div>
                                <button onClick={handleCreateRole} className="w-full h-14 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-all">Authorize Deployment</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── PERMISSIONS MODAL ── */}
            <AnimatePresence>
                {showPermissionsModal && selectedRole && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPermissionsModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{selectedRole.name} Matrix</h3>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">Module level permission assignment</p>
                                </div>
                                <button onClick={() => setShowPermissionsModal(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"><X size={24} /></button>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                                <div className="space-y-8">
                                    {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                                        <div key={moduleName} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{moduleName}</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {modulePerms.map(p => (
                                                    <label key={p._id} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-amber-500 transition-all group">
                                                        <input 
                                                            type="checkbox" 
                                                            className="mt-1.5 accent-slate-900" 
                                                            checked={selectedPermissionIds.includes(p._id)}
                                                            onChange={() => setSelectedPermissionIds(prev => prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id])}
                                                        />
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                                                {p.action} <span className="w-1 h-1 bg-slate-300 rounded-full" /> {p.resource}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 leading-relaxed">{p.description}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-50 flex justify-end gap-4 bg-white">
                                <button onClick={() => setShowPermissionsModal(false)} className="h-14 px-8 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Abort Sync</button>
                                <button 
                                    onClick={handleUpdatePermissions}
                                    disabled={saving || selectedRole.isSystem}
                                    className="h-14 px-12 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {selectedRole.isSystem ? <div className="flex items-center gap-2"><Lock size={16}/> SYSTEM LOCKED</div> : (saving ? 'Synchronizing...' : 'Update Matrix')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default RoleManagement;
