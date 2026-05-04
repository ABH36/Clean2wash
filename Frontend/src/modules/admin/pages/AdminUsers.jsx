import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, UserPlus, Edit2, X, Filter, Mail, Phone, MapPin, CheckCircle2,
    ChevronLeft, ChevronRight, Eye, Clock, Briefcase, Activity, Key,
    Users as UsersIcon, RefreshCw, Calendar, Ban, TrendingUp, DollarSign,
    History, Flag, CheckCircle, XOctagon, CreditCard, FileText, 
    ShieldAlert, ShieldCheck, Zap, MoreVertical, Globe
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';
import PageShell, { 
    SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader 
} from '../components/PageShell';

const AdminUsers = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: '', hub: '', city: '', status: 'Active' });
    const [users, setUsers] = useState([]);
    
    // Enhanced State
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [kycFilter, setKycFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Helper Functions
    const calculateRiskScore = (user) => {
        let score = 0;
        const cancellationRate = (user.stats?.cancellations || 0) / Math.max(user.stats?.totalBookings || 1, 1);
        score += Math.min(cancellationRate * 100, 40);
        const complaintRate = (user.stats?.complaints || 0) / Math.max(user.stats?.totalBookings || 1, 1);
        score += Math.min(complaintRate * 150, 30);
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) score += 20;
        else if (daysSinceCreation < 30) score += 10;
        const lastActivity = user.lastActivity ? Date.now() - new Date(user.lastActivity).getTime() : 0;
        const daysSinceActivity = lastActivity / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 30) score += 10;
        return Math.min(Math.round(score), 100);
    };

    const getRiskConfig = (score) => {
        if (score <= 30) return { label: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ShieldCheck };
        if (score <= 60) return { label: 'Mid', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: Activity };
        return { label: 'High', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: ShieldAlert };
    };

    const getKycStatus = (user) => {
        if (user.kyc?.status === 'verified' || user.isVerified) return 'Verified';
        if (user.kyc?.status === 'rejected') return 'Rejected';
        return 'Pending';
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers('consumer', page, limit);
            if (res.status === 'success') {
                setUsers(res.data.users || []);
                setTotalPages(res.totalPages || 1);
                setTotalUsers(res.total || 0);
            }
        } catch (err) {
            toast.error("Cluster Sync Failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const filteredUsers = useMemo(() => {
        let result = users.filter(u =>
            (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone || '').includes(searchTerm) ||
            (u._id || u.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (statusFilter !== 'All') result = result.filter(u => (u.status || 'Active') === statusFilter);
        if (kycFilter !== 'All') result = result.filter(u => getKycStatus(u) === kycFilter);
        if (riskFilter !== 'All') {
            result = result.filter(u => {
                const score = calculateRiskScore(u);
                return getRiskConfig(score).label === riskFilter;
            });
        }
        return result;
    }, [users, searchTerm, statusFilter, kycFilter, riskFilter]);

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
                toast.success('Protocol Updated');
            } else {
                await adminAPI.createUser({ ...formData, role: 'consumer' });
                toast.success('Consumer Registered');
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (err) {
            toast.error("Command Execution Failure");
        } finally { setLoading(false); }
    };

    const handleKycAction = async (userId, action, note = '') => {
        try {
            await adminAPI.updateUserKyc(userId, { status: action, note });
            fetchUsers();
            toast.success(`Identity ${action}`);
        } catch (err) {
            toast.error('Identity Audit Failed');
        }
    };

    const handleBlockUser = async (userId, block = true) => {
        try {
            await adminAPI.updateUser(userId, { 
                status: block ? 'Blocked' : 'Active',
                blockedAt: block ? new Date() : null 
            });
            fetchUsers();
            toast.success(`Registry ${block ? 'Suspended' : 'Restored'}`);
        } catch (err) {
            toast.error('Registry Update Failed');
        }
    };

    const handleFlagUser = async (userId, flagged = true) => {
        try {
            await adminAPI.updateUser(userId, { 
                flagged,
                flaggedAt: flagged ? new Date() : null 
            });
            fetchUsers();
            toast.success(`Threat Level ${flagged ? 'Escalated' : 'Neutralized'}`);
        } catch (err) {
            toast.error('Security Flag Failed');
        }
    };

    const openUserDetails = (user) => {
        setSelectedUser(user);
        setIsUserDetailsOpen(true);
    };

    return (
        <PageShell
            title="Consumer Intelligence"
            subtitle="Central registry for customer demographics and trust scoring"
            icon={UsersIcon}
            accent="slate"
            badge="v4.2 PRO"
            actions={
                <div className="flex items-center gap-3">
                    <button onClick={fetchUsers} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleOpenAdd} className="adm-btn adm-btn-primary h-10 px-4 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <UserPlus size={16} /> Register Consumer
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* ── METRIC TILES ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Global Pool', value: totalUsers, icon: UsersIcon, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Active Sessions', value: users.filter(u => u.status === 'Active').length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'KYC Backlog', value: users.filter(u => getKycStatus(u) === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Security Flags', value: users.filter(u => u.flagged).length, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' }
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

                {/* ── REGISTRY GRID ── */}
                <SectionCard 
                    title="Cluster Telemetry" 
                    icon={Globe}
                    actions={
                        <FilterBar className="!border-0 !p-0 !bg-transparent">
                            <SearchBox 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Identify entity..." 
                            />
                            <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
                            <StatusTabs 
                                tabs={[
                                    { label: 'Omni', value: 'All' },
                                    { label: 'Active', value: 'Active' },
                                    { label: 'Blocked', value: 'Blocked' }
                                ]}
                                active={statusFilter}
                                onChange={setStatusFilter}
                            />
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                            >
                                <Filter size={16} />
                            </button>
                        </FilterBar>
                    }
                >
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Audit</label>
                                    <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} className="adm-input h-10 text-[11px] font-bold uppercase">
                                        <option value="All">All Identities</option>
                                        <option value="Verified">Verified</option>
                                        <option value="Pending">Pending Audit</option>
                                        <option value="Rejected">Flagged</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Risk Profile</label>
                                    <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="adm-input h-10 text-[11px] font-bold uppercase">
                                        <option value="All">All Risk Profiles</option>
                                        <option value="Low">Low Risk (Safe)</option>
                                        <option value="Mid">Moderate (Watch)</option>
                                        <option value="High">Critical (High)</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Consumer Identification</th>
                                    <th>Linkage & Geolocation</th>
                                    <th className="text-center">Audit Node</th>
                                    <th className="text-center">Threat Level</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right">Operational Logic</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading && users.length === 0 ? (
                                        <tr><td colSpan={6}><PageLoader /></td></tr>
                                    ) : filteredUsers.map((user) => {
                                        const risk = getRiskConfig(calculateRiskScore(user));
                                        const kycStatus = getKycStatus(user);
                                        return (
                                            <motion.tr key={user._id || user.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group">
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform">
                                                                {(user.name || 'C')[0]}
                                                            </div>
                                                            {user.flagged && <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center"><Flag size={8} className="text-white" /></div>}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">UUID: {(user._id || user.id).slice(-8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-700">
                                                            <Phone size={12} className="text-slate-300" />
                                                            <span className="text-[11px] font-black">{user.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <MapPin size={12} />
                                                            <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{user.profile?.city || 'Unlinked'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`adm-badge mx-auto ${kycStatus === 'Verified' ? 'adm-badge-success' : kycStatus === 'Rejected' ? 'adm-badge-error' : 'adm-badge-warning'}`}>
                                                        {kycStatus}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`flex flex-col items-center gap-1 ${risk.color}`}>
                                                        <risk.icon size={16} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{risk.label}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`adm-badge mx-auto ${user.status === 'Blocked' ? 'adm-badge-error' : 'adm-badge-success'}`}>
                                                        {user.status || 'Active'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openUserDetails(user)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all border border-slate-100"><Eye size={18} /></button>
                                                        <button onClick={() => handleOpenEdit(user)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all border border-slate-100"><Edit2 size={18} /></button>
                                                        <button 
                                                            onClick={() => handleBlockUser(user._id || user.id, user.status !== 'Blocked')}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${user.status === 'Blocked' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white'}`}
                                                        >
                                                            {user.status === 'Blocked' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Sync: {totalUsers} Entities Detected</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-20"><ChevronLeft size={20} /></button>
                            <div className="h-10 px-4 bg-slate-900 rounded-xl flex items-center gap-3 text-white">
                                <span className="text-[10px] font-black uppercase">Batch {page}</span>
                                <div className="w-px h-3 bg-white/20" />
                                <span className="text-[10px] font-bold opacity-60 uppercase">{totalPages} Clusters</span>
                            </div>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center disabled:opacity-20"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ── ENTITY CONFIGURATION MODAL ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editingUser ? 'Sync Protocol' : 'Initial Registry'}</h2>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Consumer Configuration Hub</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSave} className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Tag</label>
                                        <input required type="text" placeholder="Full Registry Name" className="adm-input h-12" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Link</label>
                                        <input required type="tel" placeholder="Primary Contact" className="adm-input h-12" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Frequency</label>
                                        <input required type="email" placeholder="Verification Email" className="adm-input h-12" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    {!editingUser && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                                            <input required type="password" placeholder="Initial Access Key" className="adm-input h-12" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                    )}
                                    <button disabled={loading} className="adm-btn adm-btn-primary h-14 w-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 mt-4">
                                        {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : (editingUser ? 'Confirm Protocol Update' : 'Authorize New Entity')}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── CONSUMER INTELLIGENCE MODAL ── */}
            <AnimatePresence>
                {isUserDetailsOpen && selectedUser && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserDetailsOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl relative z-10 border border-slate-100 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-500 font-black flex items-center justify-center text-3xl shadow-xl">
                                        {(selectedUser.name || 'U')[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1.5">{selectedUser.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Intelligence Node</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsUserDetailsOpen(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Column 1: Core Telemetry */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Core Telemetry</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Linkage', val: selectedUser.phone, icon: Phone },
                                                    { label: 'Frequency', val: selectedUser.email || 'None', icon: Mail },
                                                    { label: 'Geoloc', val: selectedUser.profile?.city || 'Unlinked', icon: MapPin },
                                                    { label: 'Epoch', val: new Date(selectedUser.createdAt).toLocaleDateString(), icon: Calendar }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between py-1">
                                                        <div className="flex items-center gap-3 text-slate-400">
                                                            <item.icon size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                                        </div>
                                                        <span className="text-xs font-black text-slate-800 uppercase">{item.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                                            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-4 relative z-10">Economic Output</h3>
                                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                                <div>
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Yield (Total)</p>
                                                    <p className="text-2xl font-black tracking-tighter">₹{(selectedUser.stats?.totalSpent || 0).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Batch Frequency</p>
                                                    <p className="text-2xl font-black tracking-tighter">{selectedUser.stats?.totalBookings || 0}</p>
                                                </div>
                                            </div>
                                            <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
                                        </div>
                                    </div>

                                    {/* Column 2: Audit & Identity */}
                                    <div className="lg:col-span-5 space-y-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Identity Audit</h3>
                                                <div className={`adm-badge ${getKycStatus(selectedUser) === 'Verified' ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                                                    {getKycStatus(selectedUser)}
                                                </div>
                                            </div>
                                            
                                            {selectedUser.kyc?.documents?.front ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <FileText size={20} className="text-slate-400" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registry ID</p>
                                                            <span className="text-sm font-black text-slate-800 uppercase">{selectedUser.kyc.documentId || 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {[
                                                            { side: 'Front', url: selectedUser.kyc.documents.front },
                                                            { side: 'Back', url: selectedUser.kyc.documents.back }
                                                        ].filter(d => d.url).map((doc, i) => (
                                                            <div key={i} className="group relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                                                <img src={doc.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={doc.side} />
                                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <button onClick={() => setViewingDoc({ url: doc.url, side: doc.side })} className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><Eye size={18} /></button>
                                                                </div>
                                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[8px] font-black text-white uppercase tracking-widest">{doc.side} Node</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {getKycStatus(selectedUser) === 'Pending' && (
                                                        <div className="flex gap-3 pt-4">
                                                            <button onClick={() => handleKycAction(selectedUser._id || selectedUser.id, 'verified')} className="flex-1 adm-btn adm-btn-primary h-12 text-[10px] font-black uppercase">Authorize Entity</button>
                                                            <button onClick={() => handleKycAction(selectedUser._id || selectedUser.id, 'rejected', 'Audit failure')} className="flex-1 adm-btn h-12 text-[10px] font-black uppercase border border-rose-100 text-rose-500">Revoke Proof</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                                    <XOctagon size={48} className="text-slate-200 mb-4" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Identity Records Detected</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 3: Risk & Governance */}
                                    <div className="lg:col-span-3 space-y-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Threat Governance</h3>
                                            <div className="flex flex-col items-center gap-4 py-4">
                                                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center relative ${getRiskConfig(calculateRiskScore(selectedUser)).border} ${getRiskConfig(calculateRiskScore(selectedUser)).color}`}>
                                                    <span className="text-3xl font-black">{calculateRiskScore(selectedUser)}</span>
                                                    <div className="absolute -bottom-2 px-3 py-1 bg-white border border-inherit rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">{getRiskConfig(calculateRiskScore(selectedUser)).label}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <button onClick={() => { handleBlockUser(selectedUser._id || selectedUser.id, selectedUser.status !== 'Blocked'); setIsUserDetailsOpen(false); }} className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border flex items-center justify-center gap-3 ${selectedUser.status === 'Blocked' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white'}`}>
                                                    {selectedUser.status === 'Blocked' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                                                    {selectedUser.status === 'Blocked' ? 'Restore Entity' : 'Suspend Entity'}
                                                </button>
                                                <button onClick={() => { handleFlagUser(selectedUser._id || selectedUser.id, !selectedUser.flagged); setIsUserDetailsOpen(false); }} className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border flex items-center justify-center gap-3 ${selectedUser.flagged ? 'bg-slate-900 text-white border-slate-900' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white'}`}>
                                                    <Flag size={18} />
                                                    {selectedUser.flagged ? 'Neutralize Flag' : 'Escalate Threat'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4 mb-4">Registry Notes</h3>
                                            <div className="p-4 bg-slate-50 rounded-2xl min-h-[100px]">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed">{selectedUser.adminNotes || 'No administrative notations provided for this entity.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── DOCUMENT INSPECTION VIEW ── */}
            <AnimatePresence>
                {viewingDoc && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingDoc(null)} className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 max-w-4xl w-full bg-transparent flex flex-col items-center">
                            <button onClick={() => setViewingDoc(null)} className="absolute -top-16 right-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"><X size={24} /></button>
                            <div className="w-full aspect-video bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                                <img src={viewingDoc.url} alt="Proof" className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-8 px-6 py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em]">{viewingDoc.side} Specification Proof</div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminUsers;
