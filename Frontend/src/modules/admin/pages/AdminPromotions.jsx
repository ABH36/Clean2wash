import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, CheckCircle2 } from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';

const TABS = ['Coupons', 'Referrals', 'Offers', 'Banners'];

const defaultForm = {
    code: '',
    name: '',
    title: '',
    subtitle: '',
    type: 'Percentage',
    val: '',
    userGets: '',
    friendGets: '',
    image: '',
    expiry: '',
    status: 'Active',
    cta: '',
    path: '/spare-driver',
    theme: 'dark',
    category: 'driver',
    applicableServices: []
};

const AdminPromotions = () => {
    const [activeTab, setActiveTab] = useState('Coupons');
    const [search, setSearch] = useState('');
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [promos, setPromos] = useState({ Coupons: [], Referrals: [], Offers: [], Banners: [] });

    const loadPromotions = async () => {
        setIsFetching(true);
        try {
            const res = await adminAPI.getPromotions(activeTab);
            setPromos((prev) => ({
                ...prev,
                [activeTab]: res?.data?.promotions || []
            }));
        } catch (error) {
            toast.error(error.message || `Unable to load ${activeTab.toLowerCase()}`);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        loadPromotions();
    }, [activeTab]);

    const filteredPromos = useMemo(() => {
        const term = search.toLowerCase().trim();
        if (!term) return promos[activeTab] || [];
        return (promos[activeTab] || []).filter((promo) => {
            const key = `${promo.code || ''} ${promo.name || ''} ${promo.title || ''}`.toLowerCase();
            return key.includes(term);
        });
    }, [activeTab, promos, search]);

    const handleOpenCreate = () => {
        setEditingPromo(null);
        setFormData(defaultForm);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({
            ...defaultForm,
            ...promo,
            applicableServices: promo?.applicableServices || []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                type: activeTab,
                applicableServices: []
            };
            if (activeTab === 'Coupons' || activeTab === 'Offers') payload.reductionType = formData.type;
            if (editingPromo?._id || editingPromo?.id) {
                await adminAPI.updatePromotion(editingPromo._id || editingPromo.id, payload);
            } else {
                await adminAPI.createPromotion(payload);
            }
            toast.success(editingPromo ? 'Campaign updated' : 'Campaign created');
            setIsModalOpen(false);
            await loadPromotions();
        } catch (error) {
            toast.error(error.message || 'Unable to save campaign');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (promo) => {
        const id = promo?._id || promo?.id;
        if (!id) return;
        const confirmed = window.confirm('Delete this promotion?');
        if (!confirmed) return;
        try {
            await adminAPI.deletePromotion(id);
            toast.success('Campaign deleted');
            await loadPromotions();
        } catch (error) {
            toast.error(error.message || 'Unable to delete campaign');
        }
    };

    const handleToggleStatus = async (promo) => {
        const id = promo?._id || promo?.id;
        if (!id) return;
        const nextStatus = promo.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await adminAPI.updatePromotion(id, { status: nextStatus });
            await loadPromotions();
            toast.success(`Campaign marked ${nextStatus}`);
        } catch (error) {
            toast.error(error.message || 'Unable to update status');
        }
    };

    return (
        <div className="space-y-6 pb-20 bg-[var(--bg)] min-h-screen">
            <div className="admin-card border-none shadow-soft-xl">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Promotions & Campaigns</h1>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-2 uppercase tracking-widest">Spare driver growth desk</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2.5 flex items-center gap-3 w-full lg:w-72">
                            <Search size={16} className="text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                className="bg-transparent outline-none text-sm font-semibold text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            className="h-11 px-6 bg-[var(--primary)] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2 group/new"
                        >
                            <Plus size={20} className="group-hover/new:scale-110 transition-transform" /> New
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-[var(--border)] mt-5 overflow-x-auto scrollbar-hide">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                                activeTab === tab ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {isFetching ? (
                <div className="py-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPromos.map((promo) => (
                        <div key={promo._id || promo.id} className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-soft overflow-hidden">
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{promo.code || promo.name || promo.title || 'Campaign'}</h3>
                                    <button onClick={() => handleToggleStatus(promo)}>
                                        {promo.status === 'Active' ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
                                    </button>
                                </div>
                                <p className="text-xs font-semibold text-[var(--text-secondary)]">{promo.subtitle || 'No subtitle added yet.'}</p>
                                <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">{promo.status || 'Inactive'}</p>
                            </div>
                            <div className="px-5 py-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-end gap-2">
                                <button onClick={() => handleOpenEdit(promo)} className="w-10 h-10 bg-[var(--card)] rounded-xl text-[var(--text-muted)] border border-[var(--border)] flex items-center justify-center hover:text-brand hover:border-brand/40 transition-all group/edit">
                                    <Edit2 size={18} className="group-hover/edit:scale-110 transition-transform" />
                                </button>
                                <button onClick={() => handleDelete(promo)} className="w-10 h-10 bg-[var(--card)] rounded-xl text-[var(--text-muted)] border border-[var(--border)] flex items-center justify-center hover:text-red-500 hover:border-red-200 transition-all group/trash">
                                    <Trash2 size={18} className="group-hover/trash:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!filteredPromos.length && (
                        <div className="col-span-full py-16 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl text-[var(--text-secondary)] font-semibold">
                            No campaigns found in this bucket.
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            className="bg-[var(--card)] w-full max-w-2xl rounded-[2rem] border border-[var(--border)] relative z-10"
                        >
                            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">{editingPromo ? 'Edit campaign' : 'Create campaign'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center">
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Code / Name / Title" value={activeTab === 'Referrals' ? formData.name : activeTab === 'Banners' ? formData.title : formData.code} onChange={(e) => {
                                        const val = e.target.value;
                                        if (activeTab === 'Referrals') setFormData({ ...formData, name: val });
                                        else if (activeTab === 'Banners') setFormData({ ...formData, title: val });
                                        else setFormData({ ...formData, code: val.toUpperCase() });
                                    }} required />
                                    <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Subtitle" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} required />
                                    {activeTab !== 'Referrals' && activeTab !== 'Banners' && (
                                        <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Value" value={formData.val} onChange={(e) => setFormData({ ...formData, val: e.target.value })} required />
                                    )}
                                    {activeTab === 'Referrals' && (
                                        <>
                                            <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Referrer reward" value={formData.userGets} onChange={(e) => setFormData({ ...formData, userGets: e.target.value })} required />
                                            <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Invitee bonus" value={formData.friendGets} onChange={(e) => setFormData({ ...formData, friendGets: e.target.value })} required />
                                        </>
                                    )}
                                    <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                                    <input type="date" className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" value={formData.expiry ? formData.expiry.split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} />
                                    {activeTab === 'Banners' && (
                                        <input className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] md:col-span-2" placeholder="Destination path (default: /spare-driver)" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} />
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-12 rounded-xl bg-[var(--primary)] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {isSaving ? 'Saving...' : editingPromo ? 'Update Campaign' : 'Create Campaign'}
                                    {!isSaving && <CheckCircle2 size={16} />}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPromotions;
