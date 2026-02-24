import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    CheckCircle2,
    TrendingUp,
    LayoutGrid,
    List,
    MoreVertical
} from 'lucide-react';

const AdminPromotions = () => {
    const [activeTab, setActiveTab] = useState('Coupons');
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [loading, setLoading] = useState(false);

    const getInitialPromos = () => {
        const saved = localStorage.getItem('CarWash_promotions');
        if (saved) return JSON.parse(saved);
        return {
            Coupons: [
                { id: 1, code: 'WASH50', type: 'Percentage', val: '50%', expiry: '2026-03-01', usage: '1.2k', status: 'Active' },
                { id: 2, code: 'FIRSTWASH', type: 'Flat', val: '₹100', expiry: '2026-12-31', usage: '4.5k', status: 'Active' },
            ],
            Referrals: [
                { id: 3, name: 'Standard Refer', userGets: '₹100', friendGets: '₹50', status: 'Active', usage: '842' },
            ],
            Offers: [
                { id: 4, name: 'Weekend Blitz', type: 'Flash Sale', val: '20%', expiry: '2026-02-28', usage: '210', status: 'Active' }
            ]
        };
    };

    const [promos, setPromos] = useState(getInitialPromos());
    const [formData, setFormData] = useState({ code: '', name: '', type: 'Percentage', val: '', expiry: '', status: 'Active', userGets: '', friendGets: '' });

    useEffect(() => {
        localStorage.setItem('CarWash_promotions', JSON.stringify(promos));
    }, [promos]);

    const handleOpenAdd = () => {
        setEditingPromo(null);
        setFormData({ code: '', name: '', type: 'Percentage', val: '', expiry: '', status: 'Active', userGets: '', friendGets: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({ ...promo });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            const updatedSection = editingPromo
                ? promos[activeTab].map(p => p.id === editingPromo.id ? { ...p, ...formData } : p)
                : [...promos[activeTab], { ...formData, id: Date.now(), usage: '0' }];

            setPromos({ ...promos, [activeTab]: updatedSection });
            setLoading(false);
            setIsModalOpen(false);
        }, 600);
    };

    const handleDelete = (id) => {
        if (window.confirm('Terminate this promotion protocol?')) {
            setPromos({
                ...promos,
                [activeTab]: promos[activeTab].filter(p => p.id !== id)
            });
        }
    };

    const handleToggle = (id) => {
        setPromos({
            ...promos,
            [activeTab]: promos[activeTab].map(p =>
                p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
            )
        });
    };

    const filteredList = promos[activeTab].filter(p => {
        const term = search.toLowerCase();
        return (p.code || p.name || '').toLowerCase().includes(term);
    });

    return (
        <AdminLayout title="Growth & Promotions">
            <div className="space-y-6">
                {/* Control Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        {['Coupons', 'Referrals', 'Offers'].map(tab => (
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
                                placeholder={`Locate ${activeTab.toLowerCase()}...`}
                                className="bg-transparent outline-none text-xs font-bold text-content w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={18} /> Create Entry
                        </button>
                    </div>
                </div>

                {/* Promotion Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredList.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand transition-all flex flex-col relative"
                        >
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all shadow-sm ${p.status === 'Active' ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-content-subtle'}`}>
                                        {activeTab === 'Referrals' ? <Gift size={28} /> : (activeTab === 'Offers' ? <TrendingUp size={28} /> : <Tag size={28} />)}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <button onClick={() => handleToggle(p.id)} className="transition-all">
                                            {p.status === 'Active' ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-300" />}
                                        </button>
                                        <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest italic">{p.usage} Uses</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-2xl font-black text-content italic uppercase tracking-tighter truncate group-hover:text-brand transition-colors">
                                        {p.code || p.name}
                                    </h4>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1 italic">
                                        {activeTab === 'Referrals' ? `Reward: ${p.userGets}` : `${p.val} ${p.type}`}
                                    </p>
                                </div>
                            </div>

                            <div className="px-8 py-5 bg-gray-50/50 mt-auto flex items-center justify-between border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-content-subtle" />
                                    <span className="text-[10px] font-bold text-content-subtle uppercase italic">Exp: {p.expiry || 'LIFETIME'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenEdit(p)} className="p-2 hover:bg-brand hover:text-white rounded-lg text-content-subtle transition-all"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-500 hover:text-white rounded-lg text-content-subtle transition-all"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredList.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-300 mb-6 italic border border-gray-100">
                            <Zap size={32} />
                        </div>
                        <h4 className="text-lg font-black text-content italic uppercase">No Promotions Located</h4>
                        <p className="text-xs font-bold text-content-subtle uppercase tracking-widest mt-2">Initialize a new campaign to boost network growth</p>
                    </div>
                )}
            </div>

            {/* Promotion Configuration Terminal */}
            <AnimatePresence>
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
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
                        >
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content italic leading-none uppercase">{editingPromo ? 'Synchronize Protocol' : 'New Growth Entry'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 italic px-1">Promotional Logic Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2 space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">{activeTab === 'Referrals' ? 'Campaign Name' : 'Protocol Code'}</label>
                                            <input
                                                required
                                                placeholder={activeTab === 'Referrals' ? 'Standard Growth Referral' : 'WASHPRO100'}
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm uppercase"
                                                value={activeTab === 'Referrals' ? formData.name : formData.code}
                                                onChange={e => activeTab === 'Referrals' ? setFormData({ ...formData, name: e.target.value }) : setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>

                                        {activeTab !== 'Referrals' ? (
                                            <>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Reduction Type</label>
                                                    <select
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm appearance-none"
                                                        value={formData.type}
                                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    >
                                                        <option value="Percentage">Percentage (%)</option>
                                                        <option value="Flat">Flat Value (₹)</option>
                                                        <option value="Freebie">Free Service</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Valuation</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. 50% or 100"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.val}
                                                        onChange={e => setFormData({ ...formData, val: e.target.value })}
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Protocol Expiry</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.expiry}
                                                        onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Referrer Reward</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. ₹100"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.userGets}
                                                        onChange={e => setFormData({ ...formData, userGets: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Invitee Bonus</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. ₹50"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.friendGets}
                                                        onChange={e => setFormData({ ...formData, friendGets: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={loading}
                                            className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Initializing Protocol...' : (
                                                <>{editingPromo ? 'Update Synchronization' : 'Commit Protocol'} <CheckCircle2 size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminPromotions;
