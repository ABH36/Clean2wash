import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Shield,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    X,
    User,
    Lock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const AdminUsers = () => {
    const { validateCredentials, register } = useAuth();
    const [activeTab, setActiveTab] = useState('Consumers');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: 'consumer', hub: '', city: '' });
    const [loading, setLoading] = useState(false);

    // Fetch users from localStorage/AuthContext
    const getStoredUsers = () => {
        const saved = localStorage.getItem('hoora_registered_users');
        const parsed = saved ? JSON.parse(saved) : { consumer: [], captain: [], vendor: [], staff: [] };
        return parsed;
    };

    const [allUsers, setAllUsers] = useState(getStoredUsers());

    const USERS_LIST = {
        Consumers: [
            { id: 'USR-001', name: 'Aryan Pathak', email: 'aryan@example.com', role: 'Elite', status: 'Active', joined: '12 Feb 2026' },
            ...(allUsers.consumer || []).map(u => ({ ...u, status: 'Active', joined: 'New' }))
        ],
        Captains: [
            { id: 'CPT-001', name: 'Amit Singh', email: 'amit@hoora.in', hub: 'HSR Layout', status: 'Active', rating: '4.9' },
            ...(allUsers.captain || []).map(u => ({ ...u, status: 'Active', joined: 'New' }))
        ],
        Staff: [
            { id: 'STF-0019', name: 'Vicky Kaushal', role: 'Hub Executive', hub: 'Faridabad', status: 'Active' },
            ...(allUsers.staff || []).map(u => ({ ...u, status: 'Active', joined: 'New' }))
        ]
    };

    const handleAddUser = (e) => {
        e.preventDefault();
        setLoading(true);

        const roleKey = activeTab.toLowerCase().slice(0, activeTab.length === 8 ? -1 : -1);
        // Consumers -> consumer, Captains -> captain, Staff -> staff
        const finalRole = activeTab === 'Consumers' ? 'consumer' : activeTab === 'Captains' ? 'captain' : 'staff';

        const newUser = {
            ...formData,
            role: finalRole,
            id: (finalRole === 'consumer' ? 'USR-' : finalRole === 'captain' ? 'CPT-' : 'STF-') + Math.random().toString(36).substr(2, 5).toUpperCase(),
            joined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        setTimeout(() => {
            register(finalRole, newUser);
            setAllUsers(getStoredUsers());
            setLoading(false);
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', email: '', password: '', role: 'consumer', hub: '', city: '' });
        }, 800);
    };

    return (
        <AdminLayout title="User Management">
            <div className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto">
                        {['Consumers', 'Captains', 'Staff'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft">
                            <Search size={16} className="text-content-subtle" />
                            <input
                                type="text"
                                placeholder="Search by name, ID or email..."
                                className="bg-transparent outline-none text-xs font-bold text-content w-full"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0"
                        >
                            <UserPlus size={16} /> Add {activeTab === 'Staff' ? 'Staff' : activeTab.slice(0, -1)}
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">User Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">
                                        {activeTab === 'Captains' ? 'Hub' : activeTab === 'Staff' ? 'Designation' : 'Tier'}
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Joined Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {USERS_LIST[activeTab].map((user, i) => (
                                    <tr key={i} className="group hover:bg-gray-50/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center font-black text-brand text-xs italic">
                                                    {user.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-content italic leading-none mb-1">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-content-subtle">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                                                {user.role || user.hub}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${user.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-bold text-content-subtle italic">{user.joined || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-content-subtle hover:text-brand transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded-lg text-content-subtle hover:text-red-500 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Showing 1-10 of 4,290 Users</p>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-content-subtle"><ChevronLeft size={16} /></button>
                            <button className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-black">1</button>
                            <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-content-subtle font-black text-xs">2</button>
                            <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-content-subtle"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add New ${activeTab === 'Staff' ? 'Staff' : activeTab.slice(0, -1)}`}>
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ModalInput
                            label="Full Name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <ModalInput
                            label="Phone Number"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <ModalInput
                            label="Email Address"
                            type="email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <ModalInput
                            label="Password / PIN"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        {activeTab !== 'Consumers' && (
                            <ModalInput
                                label={activeTab === 'Captains' ? 'Work Hub' : 'Designation'}
                                placeholder={activeTab === 'Captains' ? 'Koramangala Hub' : 'Hub Executive'}
                                value={activeTab === 'Captains' ? formData.hub : formData.role}
                                onChange={e => activeTab === 'Captains' ? setFormData({ ...formData, hub: e.target.value }) : setFormData({ ...formData, role: e.target.value })}
                            />
                        )}
                        <ModalInput
                            label="Operating City"
                            placeholder="Bengaluru"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-brand text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 mt-6 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creating Account...' : (
                            <>Create User Account <Plus size={16} /></>
                        )}
                    </button>
                </form>
            </AdminModal>
        </AdminLayout>
    );
};

const AdminModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-content/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
            >
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-content italic leading-none">{title}</h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-2 ml-1 italic">Enterprise Management System</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl border border-gray-100 text-content-subtle transition-all">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-10">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

const ModalInput = ({ label, icon, ...props }) => (
    <div className="space-y-1.5 font-sans">
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">{label}</label>
        <input
            {...props}
            required
            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
        />
    </div>
);

export default AdminUsers;
