import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Power, Edit3,
    Trash2, ChevronRight, LayoutGrid, List,
    Sparkles, ShieldCheck, Zap, X, Check,
    Clock, Tag, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../../utils/vendorApi';

const ICON_MAP = {
    'Cleaning': Sparkles,
    'Detailing': Zap,
    'Protection': ShieldCheck,
    'Maintenance': Clock,
    'Enhancement': Sparkles
};

const COLOR_MAP = {
    'Cleaning': { text: 'text-blue-500', bg: 'bg-blue-500/10' },
    'Detailing': { text: 'text-amber-500', bg: 'bg-amber-500/10' },
    'Protection': { text: 'text-purple-500', bg: 'bg-purple-500/10' },
    'Maintenance': { text: 'text-green-500', bg: 'bg-green-500/10' },
    'Enhancement': { text: 'text-rose-500', bg: 'bg-rose-500/10' }
};

const CATEGORIES = ['Cleaning', 'Detailing', 'Protection', 'Maintenance', 'Enhancement'];

const VendorServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    // Modal & Toast States
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // id of service to delete

    const [form, setForm] = useState({ name: '', price: '', time: '1 hour', category: 'Cleaning', type: 'Standard', description: '', isActive: true });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await vendorAPI.getServices();
            if (res.status === 'success') {
                setServices(res.data.services);
            }
        } catch (err) {
            console.error('Failed to fetch services', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'All' || s.category === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [services, searchQuery, activeTab]);

    const handleOpenDrawer = (target = null) => {
        if (target) {
            setEditTarget(target);
            setForm(target);
        } else {
            setEditTarget(null);
            setForm({ name: '', price: '', time: '1 hour', category: 'Cleaning', type: 'Standard', description: '', isActive: true });
        }
        setDrawerOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.price) return;
        setSaving(true);

        try {
            let res;
            if (editTarget) {
                res = await vendorAPI.updateService(editTarget._id, form);
            } else {
                res = await vendorAPI.createService(form);
            }

            if (res.status === 'success') {
                fetchServices();
                setDrawerOpen(false);
            }
        } catch (err) {
            console.error('Failed to save service', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await vendorAPI.deleteService(id);
            if (res.status === 'success') {
                setServices(prev => prev.filter(s => s._id !== id));
                setShowDeleteConfirm(null);
            }
        } catch (err) {
            console.error('Failed to delete service', err);
        }
    };

    const handleToggleActive = async (service) => {
        try {
            const res = await vendorAPI.updateService(service._id, { isActive: !service.isActive });
            if (res.status === 'success') {
                setServices(prev => prev.map(s => s._id === service._id ? { ...s, isActive: !service.isActive } : s));
            }
        } catch (err) {
            console.error('Failed to toggle service status', err);
        }
    };

    const ServiceCard = ({ s, i }) => {
        const Icon = ICON_MAP[s.category] || Sparkles;
        const colors = COLOR_MAP[s.category] || COLOR_MAP.Cleaning;

        return (
            <motion.div
                layout
                key={s._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden group hover:border-brand/30 transition-all relative ${viewMode === 'list' ? 'flex flex-col md:flex-row items-center p-6 md:p-4 gap-6 md:gap-0' : 'p-8 space-y-7'}`}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-colors" />

                <div className={`${viewMode === 'list' ? 'flex items-center gap-5 flex-1 w-full' : 'space-y-7'}`}>
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text} transition-all group-hover:scale-110 shadow-inner shrink-0 relative z-10`}>
                        <Icon size={28} />
                    </div>

                    <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : 'space-y-2'} relative z-10`}>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-content tracking-tight uppercase leading-none truncate">{s.name}</h3>
                            {!s.isActive && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background border border-gray-100/10 text-content-subtle text-[8px] font-black uppercase tracking-widest shrink-0">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                    Paused
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-black text-brand uppercase tracking-widest opacity-80">{s.category} · {s.type} · {s.time}</p>
                    </div>

                    {viewMode === 'list' && (
                        <div className="md:px-8 md:border-x border-gray-100/5 md:mx-8 hidden md:block">
                            <span className="text-2xl font-black tracking-tighter text-content leading-none">₹{s.price}</span>
                        </div>
                    )}
                </div>

                <div className={`w-full ${viewMode === 'grid' ? 'flex items-center justify-between pt-5 border-t border-gray-100/5' : 'flex items-center justify-between md:justify-end gap-4 md:gap-3 w-full md:w-auto relative z-10'}`}>
                    {(viewMode === 'grid' || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                        <div className="flex flex-col">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-0.5 opacity-50">Operational Cost</p>
                            <span className="text-2xl font-black tracking-tighter text-content leading-none">₹{s.price}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleOpenDrawer(s)}
                            className="w-11 h-11 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-subtle hover:text-brand hover:border-brand/40 transition-all shadow-sm group/btn"
                        >
                            <Edit3 size={18} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => handleToggleActive(s)}
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all shadow-sm group/btn ${s.isActive ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}
                        >
                            <Power size={18} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(s._id)}
                            className="w-11 h-11 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all shadow-sm group/btn"
                        >
                            <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <VendorLayout title="Service Forge" subtitle="Manage your studio offerings & pricing">
            <div className="space-y-8">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 bg-surface border border-gray-100/10 p-1 rounded-2xl shadow-soft">
                        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-background text-brand border border-gray-100/10 shadow-sm' : 'text-content-muted'}`}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-background text-brand border border-gray-100/10 shadow-sm' : 'text-content-muted'}`}>
                            <List size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 text-sm font-bold">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                            <input
                                type="text"
                                placeholder="Filter catalog..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-12 bg-surface border border-gray-100/10 rounded-xl pl-12 pr-4 outline-none focus:border-brand shadow-soft text-content"
                            />
                        </div>
                        <button
                            onClick={() => handleOpenDrawer()}
                            className="h-12 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                            <Plus size={16} /> Create Service
                        </button>
                    </div>
                </div>

                {/* Categories Tab */}
                <div className="flex gap-2 bg-surface border border-gray-100/10 p-1 rounded-2xl w-fit overflow-x-auto max-w-full shadow-soft">
                    {['All', ...CATEGORIES].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-background text-brand border border-gray-100/10 shadow-sm' : 'text-content-muted hover:text-content'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Services Area */}
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 text-brand animate-spin" />
                        </div>
                    ) : filteredServices.length > 0 ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                            {filteredServices.map((s, i) => <ServiceCard key={s._id} s={s} i={i} />)}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-20 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-gray-100/10 rounded-[3rem] shadow-soft"
                        >
                            <div className="w-16 h-16 bg-background border border-gray-100/10 rounded-full flex items-center justify-center text-content-subtle">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-content uppercase tracking-tighter">Catalog Empty</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Add your first studio service to begin orders</p>
                            </div>
                            <button
                                onClick={() => handleOpenDrawer()}
                                className="mt-4 px-6 py-3 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                            >
                                Forge New Service
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Service Forge Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
                        />
                        <motion.aside
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface z-[210] shadow-2xl flex flex-col border-l border-gray-100/10"
                        >
                            <div className="px-8 py-8 border-b border-gray-100/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-content tracking-tight uppercase tracking-tighter">Service <span className="text-brand">Forge</span></h2>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">Configure your tactical studio offering</p>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 underline decoration-brand/30 underline-offset-4 mb-2 block">Service Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ceramic Protection Plus"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 mb-2 block">Category</label>
                                        <select
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                            className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c} className="bg-surface text-content">{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 mb-2 block">Base Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="1299"
                                            value={form.price}
                                            onChange={e => setForm({ ...form, price: e.target.value })}
                                            className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 mb-2 block">Service Type</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                    >
                                        {['Standard', 'Premium', 'Elite', 'Waterless', 'Steam', 'Chemical', 'Pro', 'Wash'].map(t => (
                                            <option key={t} value={t} className="bg-surface text-content">{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 mb-2 block">Description</label>
                                    <textarea
                                        placeholder="Describe the tactical advantages of this service..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full h-32 bg-background border border-gray-100/10 rounded-2xl p-6 text-sm font-bold text-content outline-none focus:border-brand transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 mb-2 block">Time Estimate</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['30 mins', '1 hour', '2 hours', '4 hours', '1 day'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setForm({ ...form, time: d })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.time === d ? 'bg-brand/10 border-brand text-brand shadow-sm' : 'bg-background border-gray-100/10 text-content-muted'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-100/10 bg-background/50 backdrop-blur">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-16 bg-content text-surface rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-content/20 hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={18} strokeWidth={3} /> {editTarget ? 'Update Registry' : 'Deploy Service'}</>}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="absolute inset-0 bg-content/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-surface w-full max-w-sm rounded-[3rem] p-10 text-center space-y-6 border border-gray-100/10 shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-500/10 border border-red-500/20">
                                <AlertTriangle size={36} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-content uppercase tracking-tighter">Termination confirmed?</h3>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-2 px-4">This will permanently remove the service from your active studio catalog.</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-14 bg-background border border-gray-100/10 text-content-muted rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-content transition-colors">Cancel</button>
                                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </VendorLayout>
    );
};

export default VendorServices;
