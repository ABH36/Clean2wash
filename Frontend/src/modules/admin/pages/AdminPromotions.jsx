import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, 
    CheckCircle2, Tag, RefreshCcw, Megaphone, Gift, Share2, TrendingUp
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

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
        if (!window.confirm('Delete this promotion?')) return;
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
        <PageShell
            title="Growth Engine"
            subtitle="Marketing logistics and campaign deployment desk"
            icon={Megaphone}
            accent="indigo"
            badge="Campaign-v4"
            actions={
                <button
                    onClick={handleOpenCreate}
                    className="h-10 px-5 bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> New Campaign
                </button>
            }
        >
            <div className="space-y-8">
                {/* ── METRIC TILES ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Campaigns', value: Object.values(promos).flat().filter(p => p.status === 'Active').length, icon: Tag, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Total Reach', value: '1.2M', icon: Share2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Conversion', value: '8.4%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Growth Index', value: '+12%', icon: Gift, color: 'text-rose-500', bg: 'bg-rose-50' }
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

                <SectionCard
                    title="Campaign Registry"
                    actions={
                        <FilterBar className="!border-0 !p-0 !bg-transparent">
                            <SearchBox 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                placeholder={`Scan ${activeTab.toLowerCase()}...`} 
                            />
                            <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
                            <StatusTabs 
                                tabs={TABS.map(tab => ({ label: tab, value: tab }))}
                                active={activeTab}
                                onChange={setActiveTab}
                            />
                        </FilterBar>
                    }
                >
                    {isFetching ? (
                        <PageLoader />
                    ) : filteredPromos.length === 0 ? (
                        <EmptyState 
                            icon={Tag} 
                            title="Campaign Void" 
                            subtitle={`No ${activeTab.toLowerCase()} identified in current deployment.`} 
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPromos.map((promo) => (
                                <motion.div 
                                    key={promo._id || promo.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all group overflow-hidden flex flex-col"
                                >
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                {activeTab === 'Banners' ? <Share2 size={24} /> : activeTab === 'Referrals' ? <Gift size={24} /> : <Tag size={24} />}
                                            </div>
                                            <button onClick={() => handleToggleStatus(promo)} className="flex-shrink-0 hover:scale-110 transition-transform">
                                                {promo.status === 'Active' ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">
                                                    {promo.code || promo.name || promo.title || 'Campaign'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {promo.subtitle || 'No subtitle provided'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <span className={`adm-badge ${promo.status === 'Active' ? 'adm-badge-success' : 'adm-badge-error'}`}>
                                                    {promo.status}
                                                </span>
                                                {promo.expiry && (
                                                    <span className="adm-badge adm-badge-navy">
                                                        EXP: {new Date(promo.expiry).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {promo.val && (
                                                    <span className="adm-badge bg-amber-50 text-amber-600 border-amber-100">
                                                        VALUE: {promo.val}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto px-4 py-4 border-t border-slate-50 flex gap-2">
                                        <button 
                                            onClick={() => handleOpenEdit(promo)}
                                            className="flex-1 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(promo)}
                                            className="flex-1 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── CONFIGURATION MODAL ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingPromo ? 'Sync Protocol' : 'Deploy Campaign'}</h2>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">Growth Engine Configuration Hub</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                            </div>
                            
                            <div className="p-10 overflow-y-auto">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                {activeTab === 'Referrals' ? 'Campaign Name' : activeTab === 'Banners' ? 'Banner Title' : 'Promo Code'}
                                            </label>
                                            <input required className="adm-input h-12" value={activeTab === 'Referrals' ? formData.name : activeTab === 'Banners' ? formData.title : formData.code} onChange={(e) => {
                                                const val = e.target.value;
                                                if (activeTab === 'Referrals') setFormData({ ...formData, name: val });
                                                else if (activeTab === 'Banners') setFormData({ ...formData, title: val });
                                                else setFormData({ ...formData, code: val.toUpperCase() });
                                            }} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtitle</label>
                                            <input required className="adm-input h-12" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
                                        </div>

                                        {activeTab !== 'Referrals' && activeTab !== 'Banners' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Value</label>
                                                <input required className="adm-input h-12" placeholder="e.g. 20% or ₹500" value={formData.val} onChange={(e) => setFormData({ ...formData, val: e.target.value })} />
                                            </div>
                                        )}
                                        {activeTab === 'Referrals' && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referrer Reward</label>
                                                    <input required className="adm-input h-12" value={formData.userGets} onChange={(e) => setFormData({ ...formData, userGets: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invitee Bonus</label>
                                                    <input required className="adm-input h-12" value={formData.friendGets} onChange={(e) => setFormData({ ...formData, friendGets: e.target.value })} />
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image Uplink</label>
                                            <input className="adm-input h-12" placeholder="https://..." value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Epoch</label>
                                            <input type="date" className="adm-input h-12" value={formData.expiry ? formData.expiry.split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} />
                                        </div>
                                    </div>

                                    {activeTab === 'Banners' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Routing</label>
                                            <input className="adm-input h-12" placeholder="e.g. /spare-driver" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} />
                                        </div>
                                    )}

                                    <button disabled={isSaving} className="adm-btn adm-btn-primary h-14 w-full text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-200 mt-4">
                                        {isSaving ? <RefreshCcw className="animate-spin mx-auto" size={24} /> : (editingPromo ? 'Confirm Protocol Update' : 'Authorize Deployment')}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminPromotions;
