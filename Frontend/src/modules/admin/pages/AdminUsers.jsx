import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    UserPlus,
    Edit2,
    Trash2,
    X,
    Filter,
    Shield,
    Mail,
    Phone,
    MapPin,
    Crown,
    CheckCircle2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Eye,
    Check,
    AlertCircle,
    Clock,
    XCircle,
    Car,
    Briefcase
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';

const AdminUsers = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('Consumers');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        if (type === 'vendors') {
            setActiveTab('Vendors');
        } else if (type === 'captains') {
            setActiveTab('Captains');
        } else if (type === 'staff') {
            setActiveTab('Staff');
        } else {
            setActiveTab('Consumers');
        }
    }, [location.search]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: '', hub: '', city: '' });
    const [loading, setLoading] = useState(false);
    const [viewingIdProof, setViewingIdProof] = useState(null);

    const TABS = ['Consumers', 'Captains', 'Spare Drivers', 'Staff', 'Vendors'];

    const getRoleKey = (tab) => {
        switch (tab) {
            case 'Consumers': return 'consumer';
            case 'Captains': return 'captain';
            case 'Spare Drivers': return 'sparedriver';
            case 'Staff': return 'staff';
            case 'Vendors': return 'vendor';
            default: return 'consumer';
        }
    };

    const currentRole = getRoleKey(activeTab);
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers(currentRole);
            if (res.status === 'success') {
                setUsers(res.data.users || []);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentRole]);

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u._id || u.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({ name: '', phone: '', email: '', password: '', role: activeTab === 'Staff' ? 'Field Agent' : '', hub: '', city: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            role: user.role || '',
            hub: user.profile?.hub || '',
            city: user.profile?.address?.city || user.profile?.city || '',
            studioName: user.profile?.studioName || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingUser) {
                await adminAPI.updateUser(editingUser._id || editingUser.id, formData);
            } else {
                await adminAPI.createUser({
                    ...formData,
                    role: currentRole,
                    status: 'Active'
                });
            }
            await fetchUsers();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save user", err);
            toast.error(err.message || "Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight">Are you sure you want to purge this user from the system?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                // For soft delete, we just set isActive to false
                                await adminAPI.updateUser(userId, { isActive: false });
                                await fetchUsers();
                                toast.success("User purged successfully");
                            } catch (err) {
                                console.error("Failed to delete user", err);
                                toast.error("Failed to delete user");
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Purge Entity
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Keep Node
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleVerifyVendor = async (vendorId, status) => {
        try {
            await adminAPI.updateUser(vendorId, { verificationStatus: status });
            await fetchUsers();
            toast.success(`Vendor status updated to ${status}`);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status");
        }
    };

    const handleVerifyCaptain = async (captainId, isVerified) => {
        try {
            await adminAPI.updateUser(captainId, { isVerified, status: isVerified ? 'Active' : 'Inactive' });
            await fetchUsers();
            toast.success(`Captain verification updated`);
        } catch (err) {
            console.error("Failed to update captain verify status", err);
            toast.error("Failed to update captain verify status");
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Tactical Selection Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-72 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft group focus-within:border-brand transition-all">
                            <Search size={16} className="text-content-subtle group-focus-within:text-brand" />
                            <input
                                type="text"
                                placeholder="Filter entities..."
                                className="bg-transparent outline-none text-xs font-bold text-content w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95 transition-all"
                        >
                            <UserPlus size={16} /> New {activeTab.slice(0, -1)}
                        </button>
                    </div>
                </div>

                {/* Registry Terminal */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
                    <div className="admin-table-container">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Identity Node</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Attributes</th>
                                    {activeTab === 'Captains' && (
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Clearance Status</th>
                                    )}
                                    {activeTab === 'Vendors' && (
                                        <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Clearance Status</th>
                                    )}
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-center">Protocol Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest">Sync Date</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <div className="w-8 h-8 mx-auto border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                                            <p className="text-xs mt-4 font-black text-content-subtle uppercase">Loading Registry...</p>
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredUsers.map((user, i) => (
                                    <tr key={user._id || user.id} className="group hover:bg-gray-50/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border transition-all ${user.isVerified ? 'border-green-500 bg-green-50 text-green-600' : 'bg-brand/5 text-brand border-brand/10'} group-hover:bg-brand group-hover:text-white group-hover:border-brand`}>
                                                    {(user.name || 'U')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-content leading-none mb-1.5 uppercase truncate max-w-[150px]">{user.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-content-subtle truncate block max-w-[100px]">{user._id || user.id}</span>
                                                        {user.isEnterprise && <Shield size={10} className="text-brand" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-content-muted uppercase tracking-wider flex items-center gap-1.5">
                                                    {activeTab === 'Captains' ? (
                                                        <><MapPin size={10} className="text-brand" /> {user.profile?.city || 'External Hub'}</>
                                                    ) : activeTab === 'Staff' ? (
                                                        <><Shield size={10} className="text-brand" /> {user.profile?.role || 'Agent'}</>
                                                    ) : activeTab === 'Vendors' ? (
                                                        <><Crown size={10} className="text-brand" /> {user.profile?.studioName || 'Standard'}</>
                                                    ) : (
                                                        <><Crown size={10} className="text-brand" /> {user.role || 'Elite'}</>
                                                    )}
                                                </p>
                                                <p className="text-[9px] font-bold text-content-subtle flex items-center gap-1.5 truncate">
                                                    <Mail size={10} /> {user.email || user.phone}
                                                </p>
                                                {activeTab === 'Captains' && (
                                                    <p className="text-[9px] font-bold text-content-subtle flex items-center gap-1.5 truncate">
                                                        <Car size={10} /> {user.profile?.vehicleType || 'No Vehicle'} - {user.profile?.plate || 'N/A'}
                                                    </p>
                                                )}
                                                {activeTab === 'Captains' && (
                                                    <p className="text-[9px] font-bold text-content-subtle flex items-center gap-1.5 truncate">
                                                        <Briefcase size={10} /> Exp: {user.profile?.experience || 'Fresher'}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        {activeTab === 'Captains' && (
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${user.isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        {user.isVerified ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </span>
                                                    {(user.profile?.drivingLicense || user.profile?.aadharCard) && (
                                                        <button
                                                            onClick={() => setViewingIdProof(user)}
                                                            className="text-[8px] font-black text-brand uppercase tracking-widest hover:underline flex items-center gap-1"
                                                        >
                                                            <Eye size={10} /> Inspect Docs
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === 'Vendors' && (
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${user.profile?.verificationStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        user.profile?.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            'bg-orange-50 text-orange-600 border-orange-100'
                                                        }`}>
                                                        {user.profile?.verificationStatus === 'verified' ? <CheckCircle2 size={10} /> :
                                                            user.profile?.verificationStatus === 'rejected' ? <AlertCircle size={10} /> : <Clock size={10} />}
                                                        {user.profile?.verificationStatus || 'Pending'}
                                                    </span>
                                                    {user.profile?.idProof && (
                                                        <button
                                                            onClick={() => setViewingIdProof(user)}
                                                            className="text-[8px] font-black text-brand uppercase tracking-widest hover:underline flex items-center gap-1"
                                                        >
                                                            <Eye size={10} /> Inspect ID
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-8 py-6 text-center">
                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${user.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {user.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-bold text-content-subtle">{new Date(user.createdAt).toLocaleDateString() || 'Legacy'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {activeTab === 'Captains' && !user.isVerified && (
                                                    <button onClick={() => handleVerifyCaptain(user._id || user.id, true)} className="p-2.5 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl text-green-600 transition-all shadow-sm" title="Verify Captain">
                                                        <Check size={13} />
                                                    </button>
                                                )}
                                                {activeTab === 'Vendors' && user.profile?.verificationStatus !== 'verified' && (
                                                    <>
                                                        <button onClick={() => handleVerifyVendor(user._id || user.id, 'verified')} className="p-2.5 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl text-green-600 transition-all shadow-sm" title="Approve Identity">
                                                            <Check size={13} />
                                                        </button>
                                                        {user.profile?.verificationStatus !== 'rejected' && (
                                                            <button onClick={() => handleVerifyVendor(user._id || user.id, 'rejected')} className="p-2.5 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl text-red-600 transition-all shadow-sm" title="Reject Identity">
                                                                <X size={13} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                <button onClick={() => handleOpenEdit(user)} className="p-2.5 bg-gray-50 hover:bg-brand hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => handleDelete(user._id || user.id)} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-content-subtle transition-all shadow-sm">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                                <Search size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">No matching entities in {activeTab} registry</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Nav */}
                <div className="px-10 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.2em]">Displaying {filteredUsers.length} Nodes in Secure Hub</p>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-content-subtle hover:text-brand transition-all shadow-sm"><ChevronLeft size={16} /></button>
                        <button className="h-9 px-4 rounded-xl bg-brand text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">1</button>
                        <button className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-content-subtle hover:text-brand transition-all shadow-sm font-black text-[10px]">2</button>
                        <button className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-content-subtle hover:text-brand transition-all shadow-sm"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Entity Configuration Modal */}
            < AnimatePresence >
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-content/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-[95%] md:w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content leading-none uppercase">{editingUser ? 'Update Protocol' : `New ${activeTab.slice(0, -1)}`}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2">Entity Synchronization Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 md:p-10">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Full Identity</label>
                                            <input
                                                required
                                                placeholder="e.g. Aryan Pathak"
                                                className="w-full bg-gray-50 border border-gray-100 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="entity@network.in"
                                                className="w-full bg-gray-50 border border-gray-100 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Phone Number</label>
                                            <input
                                                required
                                                type="tel"
                                                placeholder="98XXXXXXXX"
                                                className="w-full bg-gray-50 border border-gray-100 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        {!editingUser && (
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Secure PIN / Password</label>
                                                <input
                                                    required
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        {activeTab === 'Captains' ? (
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Operational Hub</label>
                                                <input
                                                    placeholder="e.g. Sector 15 Node"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.hub}
                                                    onChange={e => setFormData({ ...formData, hub: e.target.value })}
                                                />
                                            </div>
                                        ) : activeTab === 'Staff' ? (
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Access Designation</label>
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                >
                                                    <option value="Field Agent">Field Agent</option>
                                                    <option value="Hub Executive">Hub Executive</option>
                                                    <option value="Dispatch Command">Dispatch Command</option>
                                                </select>
                                            </div>
                                        ) : activeTab === 'Vendors' ? (
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Enterprise Tier</label>
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                    value={formData.tier}
                                                    onChange={e => setFormData({ ...formData, tier: e.target.value })}
                                                >
                                                    <option value="Standard">Standard Node</option>
                                                    <option value="Premium">Premium Partner</option>
                                                    <option value="Elite">Elite Enterprise</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Account Tier</label>
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                >
                                                    <option value="Basic">Basic User</option>
                                                    <option value="Elite">Elite Member</option>
                                                    <option value="Platinum">Platinum Plus</option>
                                                </select>
                                            </div>
                                        )}
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">City Node</label>
                                            <input
                                                placeholder="e.g. Faridabad"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 md:pt-4">
                                        <button
                                            disabled={loading}
                                            className="w-full bg-content text-white py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : (
                                                <>{editingUser ? 'Synchronize Entity' : 'Commit to Registry'} <CheckCircle2 size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
            {/* ID Proof Inspection Modal */}
            < AnimatePresence >
                {viewingIdProof && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingIdProof(null)}
                            className="absolute inset-0 bg-content/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 flex flex-col md:flex-row h-[80vh] md:h-auto"
                        >
                            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative overflow-y-auto max-h-[80vh]">
                                {activeTab === 'Captains' ? (
                                    <div className="flex flex-col gap-8 w-full">
                                        {viewingIdProof.profile?.drivingLicense && (
                                            <div className="w-full">
                                                <p className="text-xs font-black text-content-subtle uppercase mb-2">Driving License</p>
                                                <img src={viewingIdProof.profile.drivingLicense} alt="Driving License" className="max-w-full h-auto object-contain rounded-2xl shadow-md border-4 border-white" />
                                            </div>
                                        )}
                                        {viewingIdProof.profile?.aadharCard && (
                                            <div className="w-full">
                                                <p className="text-xs font-black text-content-subtle uppercase mb-2">Aadhar Card</p>
                                                <img src={viewingIdProof.profile.aadharCard} alt="Aadhar Card" className="max-w-full h-auto object-contain rounded-2xl shadow-md border-4 border-white" />
                                            </div>
                                        )}
                                        {viewingIdProof.profile?.photo && (
                                            <div className="w-full">
                                                <p className="text-xs font-black text-content-subtle uppercase mb-2">Captain Photo</p>
                                                <img src={viewingIdProof.profile.photo} alt="Captain Photo" className="max-w-[200px] h-auto object-contain rounded-2xl shadow-md border-4 border-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={viewingIdProof.profile?.idProof}
                                        alt="ID Proof"
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white"
                                    />
                                )}

                                <div className="fixed top-10 left-10 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-gray-100 shadow-sm z-10">
                                    <Shield size={14} className="text-brand" />
                                    <span className="text-[10px] font-black text-content uppercase tracking-widest">Identity Document</span>
                                </div>
                            </div>
                            <div className="w-full md:w-80 p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Inspection Protocol</p>
                                        <h3 className="text-2xl font-black text-content leading-none uppercase tracking-tighter">
                                            {activeTab === 'Captains' ? viewingIdProof.name : viewingIdProof.profile?.studioName}
                                        </h3>
                                        <p className="text-[9px] font-bold text-content-subtle uppercase tracking-[0.2em] mt-2 px-0.5">Entity: {viewingIdProof._id || viewingIdProof.id}</p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Legal Name</p>
                                            <p className="text-xs font-bold text-content">{viewingIdProof.name}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Contact</p>
                                            <p className="text-xs font-bold text-content">{viewingIdProof.phone || viewingIdProof.email}</p>
                                        </div>
                                        {activeTab === 'Captains' && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Operating City</p>
                                                    <p className="text-xs font-bold text-content">{viewingIdProof.profile?.city || 'N/A'}</p>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Vehicle Details</p>
                                                    <p className="text-xs font-bold text-content">{viewingIdProof.profile?.vehicleType} ({viewingIdProof.profile?.plate || 'No Plate'})</p>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Experience & Kit</p>
                                                    <p className="text-xs font-bold text-content">{viewingIdProof.profile?.experience} | {viewingIdProof.profile?.kit}</p>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Status</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${activeTab === 'Captains' ? (viewingIdProof.isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100') : (viewingIdProof.profile?.verificationStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100')
                                                }`}>
                                                {activeTab === 'Captains' ? (viewingIdProof.isVerified ? 'Verified' : 'Pending') : viewingIdProof.profile?.verificationStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-10">
                                    {activeTab === 'Captains' && !viewingIdProof.isVerified && (
                                        <button
                                            onClick={() => { handleVerifyCaptain(viewingIdProof._id || viewingIdProof.id, true); setViewingIdProof(null); }}
                                            className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:bg-green-600 transition-all hover:scale-[1.02]"
                                        >
                                            Approve Identity <Check size={16} />
                                        </button>
                                    )}
                                    {activeTab === 'Vendors' && viewingIdProof.profile?.verificationStatus !== 'verified' && (
                                        <button
                                            onClick={() => { handleVerifyVendor(viewingIdProof._id || viewingIdProof.id, 'verified'); setViewingIdProof(null); }}
                                            className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:bg-green-600 transition-all hover:scale-[1.02]"
                                        >
                                            Approve Identity <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewingIdProof(null)}
                                        className="w-full bg-gray-50 text-content-subtle py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-gray-100 hover:bg-white transition-all"
                                    >
                                        Close Terminal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </>
    );
};

export default AdminUsers;
