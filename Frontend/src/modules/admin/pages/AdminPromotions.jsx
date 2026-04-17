import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    MoreVertical,
    Activity,
    CloudRain,
    ArrowRight,
    Image as ImageIcon,
    Layout,
    Globe
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
        category: 'promo',
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
            const finalData = {
                ...formData,
                type: activeTab,
                applicableServices: [] // Force Global
            };
            if (activeTab === 'Coupons' || activeTab === 'Offers') {
                finalData.reductionType = formData.type;
            }

            if (editingPromo) {
                await adminAPI.updatePromotion(editingPromo._id || editingPromo.id, finalData);
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
        <div className="space-y-6 pb-20 bg-[var(--bg)] min-h-screen">
            {/* Control Header */}
            <div className="admin-card border-none shadow-soft-xl">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Promotions & Marketing</h1>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                                <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-[0.15em]">Global Campaign Manager</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:w-72 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2.5 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                                <Search size={16} className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                                <input
                                    type="text"
                                    placeholder={`Locate ${activeTab.toLowerCase()}...`}
                                    className="bg-transparent outline-none text-sm font-semibold text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleOpenAdd}
                                className="h-11 px-6 bg-[var(--primary)] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Plus size={18} /> New Campaign
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
                        {['Coupons', 'Referrals', 'Offers', 'Banners'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                                    activeTab === tab 
                                        ? 'border-[var(--primary)] text-[var(--primary)]' 
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isFetching ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mb-4" />
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Fetching Campaigns...</p>
                </div>
            ) : filteredList.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed">
                    <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-[2rem] flex items-center justify-center text-[var(--text-muted)] mb-6 border border-[var(--border)]">
                        <Zap size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">No Promotions Located</h4>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mt-2 max-w-xs px-4">
                        Initialize a new campaign to boost network growth and engagement.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredList.map((p, i) => (
                            <motion.div
                                key={p._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-soft overflow-hidden group hover:border-[var(--primary)] transition-all flex flex-col relative"
                            >
                                <div className="p-6 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all shadow-sm ${p.status === 'Active' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                                            {activeTab === 'Referrals' ? <Gift size={24} /> : (activeTab === 'Banners' ? <LayoutGrid size={24} /> : (activeTab === 'Offers' ? <TrendingUp size={24} /> : <Tag size={24} />))}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <button onClick={() => handleToggle(p)} className="transition-all transform hover:scale-110 active:scale-95">
                                                {p.status === 'Active' ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
                                            </button>
                                            {activeTab !== 'Banners' && (
                                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{p.usage} Uses</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight truncate group-hover:text-[var(--primary)] transition-colors">
                                            {p.code || p.name || p.title}
                                        </h4>
                                        <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest mt-1">
                                            {activeTab === 'Referrals' ? `Reward: ${p.userGets}` : (activeTab === 'Banners' ? `Theme: ${p.theme}` : `${p.val} ${p.type}`)}
                                        </p>
                                    </div>
                                </div>

                                {activeTab === 'Banners' && p.image && (
                                    <div className="px-6 pb-4">
                                        <div className="h-24 w-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                                            <img src={p.image} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x150?text=No+Preview'; }} />
                                        </div>
                                    </div>
                                )}

                                <div className="px-6 py-4 bg-[var(--bg-secondary)] mt-auto flex items-center justify-between border-t border-[var(--border)]">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Exp: {p.expiry ? new Date(p.expiry).toLocaleDateString() : 'LIFETIME'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleOpenEdit(p)} className="p-2 bg-[var(--card)] hover:bg-[var(--primary)] hover:text-white rounded-lg text-[var(--text-muted)] border border-[var(--border)] transition-all shadow-sm"><Edit2 size={12} /></button>
                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: p._id })} className="p-2 bg-[var(--card)] hover:bg-red-500 hover:text-white rounded-lg text-[var(--text-muted)] border border-[var(--border)] transition-all shadow-sm"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal Logic Terminal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[var(--card)] w-[95%] max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-[var(--border)]"
                        >
                            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] leading-none uppercase tracking-tight">{editingPromo ? 'Synchronize Protocol' : 'New Growth Entry'}</h2>
                                    <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest mt-2">{activeTab} Logic Terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-[var(--card)] hover:bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition-all flex items-center justify-center">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                                {activeTab === 'Referrals' ? 'Campaign Name' : (activeTab === 'Banners' ? 'Banner Title' : 'Protocol Code')}
                                            </label>
                                            <input
                                                required
                                                placeholder={activeTab === 'Referrals' ? 'Standard Growth Referral' : (activeTab === 'Banners' ? 'ENTER TITLE' : 'WASHPRO100')}
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm uppercase placeholder:opacity-50"
                                                value={activeTab === 'Referrals' ? formData.name : (activeTab === 'Banners' ? formData.title : formData.code)}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (activeTab === 'Referrals') setFormData({ ...formData, name: val });
                                                    else if (activeTab === 'Banners') setFormData({ ...formData, title: val });
                                                    else setFormData({ ...formData, code: val.toUpperCase() });
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeTab === 'Banners' ? null : activeTab !== 'Referrals' ? (
                                                <>
                                                    <div className="space-y-1.5 font-sans">
                                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Reduction Type</label>
                                                        <select
                                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm appearance-none"
                                                            value={formData.type}
                                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                        >
                                                            <option value="Percentage">Percentage (%)</option>
                                                            <option value="Flat">Flat Value (₹)</option>
                                                            <option value="Freebie">Free Service</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5 font-sans">
                                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Value / Badge</label>
                                                        <input
                                                            required
                                                            placeholder="e.g. 50"
                                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                            value={formData.val}
                                                            onChange={e => setFormData({ ...formData, val: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5 font-sans">
                                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Referrer Reward</label>
                                                        <input
                                                            required
                                                            placeholder="e.g. ₹100"
                                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                            value={formData.userGets}
                                                            onChange={e => setFormData({ ...formData, userGets: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 font-sans">
                                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Invitee Bonus</label>
                                                        <input
                                                            required
                                                            placeholder="e.g. ₹50"
                                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                            value={formData.friendGets}
                                                            onChange={e => setFormData({ ...formData, friendGets: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 font-sans">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Description / Subtitle</label>
                                            <input
                                                required
                                                placeholder="Short display line for customers"
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                value={formData.subtitle}
                                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Image Asset URL</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><ImageIcon size={14} /></div>
                                                    <input
                                                        placeholder="https://..."
                                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] pl-10 pr-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                        value={formData.image}
                                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 font-sans">
                                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Expiry Schedule</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><Clock size={14} /></div>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] pl-10 pr-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                        value={formData.expiry ? formData.expiry.split('T')[0] : ''}
                                                        onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {activeTab === 'Banners' && (
                                            <div className="space-y-4 pt-4 border-t border-[var(--border)] border-dashed">
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Banner Concept / Category</label>
                                                    <div className="flex gap-2">
                                                        {['driver', 'carwash', 'promo'].map(c => (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, category: c })}
                                                                className={`flex-1 h-12 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                                    formData.category === c 
                                                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                                                                }`}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Action Destination (Path)</label>
                                                    <input
                                                        placeholder="/services"
                                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] px-5 py-3.5 rounded-2xl text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:bg-[var(--card)] transition-all shadow-sm"
                                                        value={formData.path}
                                                        onChange={e => setFormData({ ...formData, path: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 font-sans">
                                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">UI Theme</label>
                                                    <div className="flex gap-2">
                                                        {['dark', 'light'].map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, theme: t })}
                                                                className={`flex-1 h-12 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                                    formData.theme === t 
                                                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                                                                }`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full bg-[var(--primary)] text-white py-4.5 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-8"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>{editingPromo ? 'Update Synchronization' : 'Commit Protocol'} <CheckCircle2 size={18} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Terminate Confirmation */}
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
                            className="bg-[var(--card)] w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-[var(--border)] shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-none uppercase tracking-tight mb-2">Terminate Promo?</h3>
                            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-8 px-4 leading-relaxed">
                                This action will permanently terminate this promotion protocol from the network.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--border)] transition-all border border-[var(--border)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                >
                                    Terminate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPromotions;
