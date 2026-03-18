import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
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
    Check,
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
    const [isFetching, setIsFetching] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    const [promos, setPromos] = useState({
        Coupons: [], Referrals: [], Offers: [], Banners: []
    });

    const fetchPromos = async () => {
        setIsFetching(true);
        try {
            const res = await adminAPI.getPromotions(activeTab);
            setPromos(prev => ({
                ...prev,
                [activeTab]: res.data.promotions || []
            }));
        } catch (err) {
            console.error(`Failed to fetch ${activeTab}:`, err.message);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, [activeTab]);

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'Percentage', val: '', expiry: '', status: 'Active',
        userGets: '', friendGets: '',
        title: '', subtitle: '', image: '', cta: '', path: '', theme: 'dark',
        applicableServices: []
    });

    const handleOpenAdd = () => {
        setEditingPromo(null);
        setFormData({
            code: '', name: '', type: 'Percentage', val: '', expiry: '', status: 'Active',
            userGets: '', friendGets: '',
            title: '', subtitle: '', image: '', cta: '', path: '', theme: 'dark',
            applicableServices: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({ ...promo, applicableServices: promo.applicableServices || [] });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const finalData = { ...formData, type: activeTab };
            if (activeTab === 'Coupons' || activeTab === 'Offers') {
                finalData.reductionType = formData.type;
                // Note: reductionType in model, but UI uses 'type' dropdown.
            }

            if (editingPromo) {
                await adminAPI.updatePromotion(editingPromo._id, finalData);
            } else {
                await adminAPI.createPromotion(finalData);
            }
            await fetchPromos();
            setIsModalOpen(false);
            toast.success(editingPromo ? 'Promotion updated' : 'Promotion created');
        } catch (err) {
            toast.error('Operation failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        if (!id) return;

        try {
            await adminAPI.deletePromotion(id);
            await fetchPromos();
            toast.success('Promotion terminated');
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (err) {
            toast.error('Delete failed: ' + err.message);
        }
    };

    const handleToggle = async (promo) => {
        try {
            const newStatus = promo.status === 'Active' ? 'Inactive' : 'Active';
            await adminAPI.updatePromotion(promo._id, { status: newStatus });
            await fetchPromos();
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error('Toggle failed: ' + err.message);
        }
    };

    const filteredList = (promos[activeTab] || []).filter(p => {
        const term = search.toLowerCase();
        return (p.code || p.name || p.title || '').toLowerCase().includes(term);
    });

    return (
        <AdminLayout title="Growth & Promotions">
            <div className="space-y-6">
                {/* Control Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        {['Coupons', 'Referrals', 'Offers', 'Banners'].map(tab => (
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
                            key={p._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden group hover:border-brand transition-all flex flex-col relative"
                        >
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-brand group-hover:text-white transition-all shadow-sm ${p.status === 'Active' ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-content-subtle'}`}>
                                        {activeTab === 'Referrals' ? <Gift size={28} /> : (activeTab === 'Banners' ? <LayoutGrid size={28} /> : (activeTab === 'Offers' ? <TrendingUp size={28} /> : <Tag size={28} />))}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <button onClick={() => handleToggle(p)} className="transition-all">
                                            {p.status === 'Active' ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-300" />}
                                        </button>
                                        {activeTab !== 'Banners' && <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{p.usage} Uses</span>}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xl font-black text-content uppercase tracking-tighter truncate group-hover:text-brand transition-colors">
                                        {p.code || p.name || p.title}
                                    </h4>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">
                                        {activeTab === 'Referrals' ? `Reward: ${p.userGets}` : (activeTab === 'Banners' ? `Theme: ${p.theme}` : `${p.val} ${p.type}`)}
                                    </p>
                                </div>
                            </div>

                            {activeTab === 'Banners' && p.image && (
                                <div className="px-8 pb-4">
                                    <div className="h-20 w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                        <img src={p.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                            )}

                            <div className="px-8 py-5 bg-gray-50/50 mt-auto flex items-center justify-between border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-content-subtle" />
                                    <span className="text-[10px] font-bold text-content-subtle uppercase">Exp: {p.expiry || 'LIFETIME'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenEdit(p)} className="p-2 hover:bg-brand hover:text-white rounded-lg text-content-subtle transition-all"><Edit2 size={12} /></button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: p._id })} className="p-2 hover:bg-red-500 hover:text-white rounded-lg text-content-subtle transition-all"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredList.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
                            <Zap size={32} />
                        </div>
                        <h4 className="text-lg font-black text-content uppercase">No Promotions Located</h4>
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
                            className="bg-white w-[95%] sm:max-w-4xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
                        >
                            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-content leading-none uppercase">{editingPromo ? 'Synchronize Protocol' : 'New Growth Entry'}</h2>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2 px-1">Promotional Logic Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 text-content-subtle transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 sm:p-10 overflow-y-auto max-h-[75vh] scrollbar-hide">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2 space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">
                                                {activeTab === 'Referrals' ? 'Campaign Name' : (activeTab === 'Banners' ? 'Banner Title' : 'Protocol Code')}
                                            </label>
                                            <input
                                                required
                                                placeholder={activeTab === 'Referrals' ? 'Standard Growth Referral' : (activeTab === 'Banners' ? 'ENTER TITLE' : 'WASHPRO100')}
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm uppercase"
                                                value={activeTab === 'Referrals' ? formData.name : (activeTab === 'Banners' ? formData.title : formData.code)}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (activeTab === 'Referrals') setFormData({ ...formData, name: val });
                                                    else if (activeTab === 'Banners') setFormData({ ...formData, title: val });
                                                    else setFormData({ ...formData, code: val.toUpperCase() });
                                                }}
                                            />
                                        </div>

                                        {activeTab === 'Banners' ? null : activeTab !== 'Referrals' ? (
                                            <>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Reduction Type</label>
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
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Valuation / Badge</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. 50% or Badge Name"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.val}
                                                        onChange={e => setFormData({ ...formData, val: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Referrer Reward</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. ₹100"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.userGets}
                                                        onChange={e => setFormData({ ...formData, userGets: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Invitee Bonus / Badge</label>
                                                    <input
                                                        required
                                                        placeholder="e.g. ₹50 or Badge Name"
                                                        className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                        value={formData.val || formData.friendGets} // Re-using val for badge here in UI, fallback
                                                        onChange={e => {
                                                            setFormData({ ...formData, friendGets: e.target.value, val: e.target.value })
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="md:col-span-2 space-y-1.5 font-sans pt-4 border-t border-gray-100">
                                            <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1">Visual Representation (Home Display)</label>
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Subtitle / Promo Line</label>
                                            <input
                                                required
                                                placeholder="SUB-TEXT OR PROMO LINE"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm uppercase"
                                                value={formData.subtitle}
                                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Image URL</label>
                                            <input
                                                placeholder="/assets/example.png"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Call to Action (CTA)</label>
                                            <input
                                                placeholder="Explore Now"
                                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm uppercase"
                                                value={formData.cta}
                                                onChange={e => setFormData({ ...formData, cta: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Theme Selection</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['dark', 'light'].map(t => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, theme: t })}
                                                            className={`h-12 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                                                                formData.theme === t 
                                                                    ? 'bg-content text-white border-content shadow-lg' 
                                                                    : 'bg-white text-content-subtle border-gray-100 hover:border-brand/30'
                                                            }`}
                                                        >
                                                            {t} Theme
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Route / Destination Path</label>
                                                <input
                                                    placeholder="/shop, /refer, etc"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.path}
                                                    onChange={e => setFormData({ ...formData, path: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        {activeTab !== 'Referrals' && activeTab !== 'Banners' && (
                                            <div className="md:col-span-2 space-y-1.5 font-sans border-t border-gray-100 pt-4">
                                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Protocol Expiry</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                                                    value={formData.expiry}
                                                    onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {/* Applicable Services Section */}
                                        <div className="md:col-span-2 space-y-4 font-sans border-t border-gray-100 pt-8 mt-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-brand uppercase tracking-[0.2em] ml-1 mb-1">Assign to Services</label>
                                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest ml-1 mb-4">Leave empty to apply system-wide</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {['Instant Wash', 'Studio Wash', 'Apartment Wash', 'Spare Driver'].map(service => (
                                                    <button
                                                        key={service}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.applicableServices || [];
                                                            const next = current.includes(service)
                                                                ? current.filter(s => s !== service)
                                                                : [...current, service];
                                                            setFormData({ ...formData, applicableServices: next });
                                                        }}
                                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all active:scale-[0.98] ${(formData.applicableServices || []).includes(service)
                                                                ? 'bg-brand/5 border-brand text-brand shadow-sm shadow-brand/5'
                                                                : 'bg-gray-50 border-gray-100 text-content-subtle hover:border-brand/30'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${(formData.applicableServices || []).includes(service)
                                                                ? 'bg-brand border-brand text-white'
                                                                : 'border-gray-200 bg-white group-hover:border-brand/30'
                                                            }`}>
                                                            {(formData.applicableServices || []).includes(service) && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span className="text-[11px] font-[1000] uppercase tracking-tight">{service}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

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

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-gray-100 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-content leading-none uppercase tracking-tighter mb-2">Terminate Promo?</h3>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-8 px-4">This action will permanently terminate this promotion protocol.</p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 bg-gray-100 text-content-subtle py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                >
                                    Terminate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminPromotions;
