import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Tag,
    Percent,
    Calendar,
    Plus,
    Trash2,
    Edit2,
    ToggleLeft,
    ToggleRight,
    Search,
    ChevronRight,
    Gift,
    Zap,
    X,
    Clock,
    CheckCircle2
} from 'lucide-react';

const AdminPromotions = () => {
    const [activeTab, setActiveTab] = useState('Coupons');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial state / Persistence
    const getInitialPromos = () => {
        const saved = localStorage.getItem('CarWash_promotions');
        if (saved) return JSON.parse(saved);
        return {
            Coupons: [
                { id: 1, code: 'CarWash50', type: 'Percentage', val: '50%', expiry: '2026-03-01', usage: '1.2k', status: 'Active' },
                { id: 2, code: 'FIRSTWASH', type: 'Flat', val: '₹100', expiry: '2026-12-31', usage: '4.5k', status: 'Active' },
            ],
            Referrals: [
                { id: 3, name: 'Standard Refer', userGets: '₹100', friendGets: '₹50', status: 'Active' },
            ],
            Offers: []
        };
    };

    const [promos, setPromos] = useState(getInitialPromos());
    const [formData, setFormData] = useState({ code: '', type: 'Percentage', val: '', expiry: '', status: 'Active' });

    const savePromos = (updated) => {
        setPromos(updated);
        localStorage.setItem('CarWash_promotions', JSON.stringify(updated));
    };

    const handleAddPromotion = (e) => {
        e.preventDefault();
        setLoading(true);

        const newPromo = {
            ...formData,
            id: Date.now(),
            usage: '0'
        };

        setTimeout(() => {
            const updated = {
                ...promos,
                [activeTab]: [...promos[activeTab], newPromo]
            };
            savePromos(updated);
            setLoading(false);
            setIsModalOpen(false);
            setFormData({ code: '', type: 'Percentage', val: '', expiry: '', status: 'Active' });
        }, 800);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        const updated = {
            ...promos,
            [activeTab]: promos[activeTab].filter(p => p.id !== id)
        };
        savePromos(updated);
    };

    const handleToggle = (id) => {
        const updated = {
            ...promos,
            [activeTab]: promos[activeTab].map(p =>
                p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
            )
        };
        savePromos(updated);
    };

    return (
        <AdminLayout title="Growth & Promotions">
            <div className="space-y-6">
                {/* Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto">
                        {['Coupons', 'Referrals', 'Offers'].map(tab => (
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

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 w-full lg:w-auto justify-center"
                    >
                        <Plus size={16} /> New {activeTab.slice(0, -1)}
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(activeTab === 'Coupons' || activeTab === 'Offers') && promos[activeTab].map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                                    <Tag size={24} />
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${p.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {p.status}
                                    </span>
                                    <p className="text-[10px] font-bold text-content-subtle mt-1 uppercase italic tracking-tighter">Exp: {p.expiry}</p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-3xl font-black italic tracking-tighter text-content leading-none mb-2">{p.code}</h3>
                                <p className="text-brand font-black text-sm uppercase italic tracking-widest mb-6">{p.val} OFF • {p.type}</p>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-content-subtle" />
                                        <span className="text-[10px] font-black italic text-content-subtle uppercase">{p.usage} Uses</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggle(p.id)}
                                            className="p-2 hover:bg-gray-50 rounded-lg text-content-subtle transition-all"
                                        >
                                            {p.status === 'Active' ? <ToggleRight size={20} className="text-brand" /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Tag size={120} className="absolute -bottom-10 -right-10 text-gray-50 -rotate-12 group-hover:text-brand/5 transition-colors" />
                        </motion.div>
                    ))}

                    {activeTab === 'Referrals' && promos.Referrals.map((r, i) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft group relative overflow-hidden"
                        >
                            <div className="flex justify-between mb-8 relative z-10">
                                <div className="w-12 h-12 bg-content/5 text-content rounded-2xl flex items-center justify-center">
                                    <Gift size={24} />
                                </div>
                                <button onClick={() => handleToggle(r.id)} className={r.status === 'Active' ? 'text-brand' : 'text-gray-200'}>
                                    {r.status === 'Active' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                            <h4 className="text-xl font-black italic tracking-tight text-content uppercase mb-6 relative z-10">{r.name}</h4>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="bg-gray-50 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase text-content-subtle mb-1">User Gets</p>
                                    <p className="text-lg font-black italic text-content">{r.userGets}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase text-content-subtle mb-1">Friend Gets</p>
                                    <p className="text-lg font-black italic text-content">{r.friendGets}</p>
                                </div>
                            </div>
                            <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleDelete(r.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Add Promotion Modal */}
            <AdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`New ${activeTab.slice(0, -1)} Entry`}
            >
                <form onSubmit={handleAddPromotion} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <ModalInput
                                label={activeTab === 'Referrals' ? 'Campaign Name' : 'Promo Code'}
                                placeholder={activeTab === 'Referrals' ? 'Summer Refer-a-Friend' : 'WELCOME100'}
                                value={activeTab === 'Referrals' ? formData.name : formData.code}
                                onChange={e => activeTab === 'Referrals' ? setFormData({ ...formData, name: e.target.value }) : setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>

                        {activeTab !== 'Referrals' ? (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Voucher Type</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none transition-all appearance-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Percentage</option>
                                        <option>Flat Value</option>
                                        <option>Freebie</option>
                                    </select>
                                </div>
                                <ModalInput
                                    label="Bonus Value"
                                    placeholder="50% or ₹200"
                                    value={formData.val}
                                    onChange={e => setFormData({ ...formData, val: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <ModalInput
                                        label="Expiry Date"
                                        type="date"
                                        value={formData.expiry}
                                        onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <ModalInput
                                    label="Referrer Bonus"
                                    placeholder="e.g. ₹100"
                                    value={formData.userGets}
                                    onChange={e => setFormData({ ...formData, userGets: e.target.value })}
                                />
                                <ModalInput
                                    label="Invitee Bonus"
                                    placeholder="e.g. ₹50"
                                    value={formData.friendGets}
                                    onChange={e => setFormData({ ...formData, friendGets: e.target.value })}
                                />
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-brand/5 rounded-2xl border border-brand/10">
                        <CheckCircle2 size={18} className="text-brand" />
                        <p className="text-[10px] font-bold text-brand uppercase tracking-tighter">This promotion will be active across all user nodes.</p>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-15 bg-content text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-content/20 flex items-center justify-center gap-2 hover:bg-brand transition-all mt-4"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Initialize Promotion <ChevronRight size={18} /></>
                        )}
                    </button>
                </form>
            </AdminModal>
        </AdminLayout>
    );
};

// Reusable Modal Component
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
                className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
            >
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-content italic leading-none">{title}</h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-2 ml-1 italic">CarWash Growth Protocol</p>
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

const ModalInput = ({ label, ...props }) => (
    <div className="space-y-1.5 font-sans">
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">{label}</label>
        <input
            {...props}
            required
            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
        />
    </div>
);

export default AdminPromotions;
