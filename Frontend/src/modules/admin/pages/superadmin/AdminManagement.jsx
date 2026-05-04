import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, Search, Shield, Crown, Edit, Trash2, Eye, Lock,
    CheckCircle, Activity, Calendar, Mail, Phone, RefreshCw, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';
import PageShell, { SectionCard, FilterBar, SearchBox, PageLoader } from '../../components/PageShell';

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
        name: '', email: '', phone: '', role: '', password: ''
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
                setAdmins(adminsRes.data.admins || []);
            }
            if (rolesRes.status === 'success') {
                setRoles(rolesRes.data.roles || []);
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

    const getRoleBadge = (roleName) => {
        const map = {
            'Super Admin': 'adm-badge-error',
            'Admin': 'adm-badge-amber',
            'Manager': 'adm-badge-info',
            'Staff': 'adm-badge-success'
        };
        return map[roleName] || 'adm-badge-navy';
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

    const handleCreateAdmin = async () => {
        try {
            if (!formData.name || !formData.email || !formData.password || !formData.role) {
                toast.error('Please fill all required fields');
                return;
            }
            const response = await adminAPI.createAdmin(formData);
            if (response.status === 'success') {
                toast.success('Admin created successfully!');
                setShowCreateModal(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create admin');
        }
    };

    const handleResetPassword = async (adminId) => {
        if (!window.confirm('Reset this administrator\'s credentials?')) return;
        try {
            const response = await adminAPI.resetAdminPassword(adminId);
            if (response.status === 'success') {
                toast.success(`Credentials reset! Temporary pass: ${response.data.temporaryPassword}`, { duration: 10000 });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to reset password');
        }
    };

    return (
        <PageShell
            title="Admin Governance"
            subtitle="Secure management of system administrators and access levels"
            icon={Shield}
            accent="navy"
            badge="Root-v4"
            actions={
                <button
                    onClick={() => {
                        setFormData({ name: '', email: '', phone: '', role: '', password: '' });
                        setShowCreateModal(true);
                    }}
                    className="h-11 px-6 bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Provision Admin
                </button>
            }
        >
            <div className="space-y-8">
                {/* ── METRIC TILES ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'System Root', value: admins.filter(a => a.role?.name === 'Super Admin').length, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Administrators', value: admins.filter(a => a.role?.name === 'Admin').length, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Active Sessions', value: admins.filter(a => a.status === 'ACTIVE').length, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Global Units', value: admins.length, icon: Users, color: 'text-slate-500', bg: 'bg-slate-50' }
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
                        placeholder="Search identity cluster..." 
                    />
                    <div className="ml-auto flex items-center gap-3">
                        <select 
                            value={filterRole} 
                            onChange={e => setFilterRole(e.target.value)}
                            className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all"
                        >
                            <option value="all">All Access Groups</option>
                            {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                        </select>
                        <button 
                            onClick={fetchData}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </FilterBar>

                {loading ? (
                    <PageLoader />
                ) : (
                    <SectionCard title="Administrator Registry" noPad>
                        <div className="overflow-x-auto">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Identity</th>
                                        <th>Access Level</th>
                                        <th>Session Status</th>
                                        <th>Telemetry</th>
                                        <th className="text-right">Governance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdmins.map(admin => (
                                        <tr key={admin._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-xs shadow-lg">
                                                        {admin.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{admin.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{admin.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`adm-badge ${getRoleBadge(admin.role?.name)}`}>{admin.role?.name || 'N/A'}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Level {admin.role?.level || 0}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${admin.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${admin.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>{admin.status}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Activity size={12} />
                                                        <span className="text-[10px] font-black uppercase">{formatLastLogin(admin.lastLogin)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Calendar size={12} />
                                                        <span className="text-[10px] font-bold">Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setSelectedAdmin(admin); setShowDetailsModal(true); }} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all border border-slate-100"><Eye size={16} /></button>
                                                    <button onClick={() => handleResetPassword(admin._id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-slate-900 flex items-center justify-center transition-all border border-slate-100"><Lock size={16} /></button>
                                                    <button onClick={() => { if(window.confirm('Purge this administrator?')) adminAPI.deleteAdmin(admin._id).then(() => fetchData()); }} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all border border-rose-100"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
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
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Provision Admin</h3>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">New access node deployment</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
                                    <input className="adm-input h-12" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Victor Kaine" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Endpoint</label>
                                    <input className="adm-input h-12" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="v.kaine@spare-driver.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Passkey</label>
                                    <input className="adm-input h-12" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Protocol</label>
                                    <select className="adm-input h-12 appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="">Select Level</option>
                                        {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleCreateAdmin} className="w-full h-14 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-all mt-4">Execute Provisioning</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── DETAILS MODAL ── */}
            <AnimatePresence>
                {showDetailsModal && selectedAdmin && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailsModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100">
                            <div className="p-10 text-center">
                                <div className="w-24 h-24 bg-slate-900 text-amber-500 rounded-[2.5rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl">
                                    {selectedAdmin.name.charAt(0)}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedAdmin.name}</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 mb-8">{selectedAdmin.email}</p>
                                
                                <div className="grid grid-cols-3 gap-4 mb-10">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Access</p>
                                        <p className="text-xs font-black text-slate-800">{selectedAdmin.role?.name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Perms</p>
                                        <p className="text-xs font-black text-slate-800">{selectedAdmin.role?.permissions?.length || 0}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-xs font-black text-emerald-500">{selectedAdmin.status}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-left px-4 mb-10">
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <Phone size={18} className="text-slate-300" />
                                        <span className="text-[11px] font-black uppercase tracking-wide">{selectedAdmin.phone || 'NO PHONE RECORD'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <Mail size={18} className="text-slate-300" />
                                        <span className="text-[11px] font-black uppercase tracking-wide">{selectedAdmin.email}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <Calendar size={18} className="text-slate-300" />
                                        <span className="text-[11px] font-black uppercase tracking-wide">Registered {new Date(selectedAdmin.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setShowDetailsModal(false)} className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Dismiss</button>
                                    <button onClick={() => { handleResetPassword(selectedAdmin._id); setShowDetailsModal(false); }} className="flex-1 h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all">Reset Access</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminManagement;
