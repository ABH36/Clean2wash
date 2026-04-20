import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Subscription Matrix Hardened
import {
    Crown,
    Plus,
    Sparkles,
    Edit2,
    Trash2,
    CheckCircle2,
    X,
    Check,
    MoreVertical,
    RefreshCcw,
    Save
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', interval: 'Monthly', status: 'Live', features: '', accent: 'brand', applicableServices: [], credits: 0 });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    // Active Subscriptions State
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'active'
    const [subscriptions, setSubscriptions] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

    // Global Pass Config States
    const [passConfig, setPassConfig] = useState({ discount: 0.3, marketingLine: '' });
    const [savingConfig, setSavingConfig] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getPlans();
            if (res.status === 'success') {
                setPlans(res.data.plans || []);
            }
        } catch (err) {
            console.error("Failed to load plans", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalConfig = async () => {
        try {
            const res = await adminAPI.getSettings();
            if (res.status === 'success') {
                const passConf = res.data.settings.find(s => s.key === 'WASH_PASS_CONFIG');
                if (passConf) setPassConfig(passConf.value || passConf.metadata || { discount: 0.3, marketingLine: '' });
            }
        } catch (err) {
            console.error("Failed to load global pass config", err);
        }
    };

    const handleUpdateGlobalConfig = async () => {
        try {
            setSavingConfig(true);
            await adminAPI.updateSetting('WASH_PASS_CONFIG', passConfig);
            toast.success("Global Pass Strategy Synchronized");
        } catch (err) {
            toast.error("Failed to sync strategy");
        } finally {
            setSavingConfig(false);
        }
    };

    const fetchSubscriptions = async () => {
        setSubLoading(true);
        try {
            const res = await adminAPI.getSubscriptions({ status: 'active' });
            if (res.status === 'success') {
                setSubscriptions(res.data.subscriptions || []);
            }
        } catch (err) {
            console.error("Failed to load subscriptions", err);
            toast.error("Failed to sync live subscriptions");
        } finally {
            setSubLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'plans') {
            fetchPlans();
            fetchGlobalConfig();
        } else {
            fetchSubscriptions();
        }
    }, [activeTab]);

    const handleOpenAdd = () => {
        setEditingPlan(null);
        setFormData({ name: '', price: '', interval: 'Monthly', status: 'Live', features: '', accent: 'brand', applicableServices: [], credits: 0 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({ ...plan, features: plan.features.join('\n'), applicableServices: plan.applicableServices || [], credits: plan.credits || 0 });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
        const updatedData = { ...formData, features: featuresArray };

        try {
            if (editingPlan) {
                await adminAPI.updatePlan(editingPlan._id || editingPlan.id, updatedData);
            } else {
                await adminAPI.createPlan(updatedData);
            }
            await fetchPlans();
            setIsModalOpen(false);
            toast.success(editingPlan ? 'Subscription plan updated' : 'New subscription plan created');
        } catch (err) {
            console.error("Failed to save plan", err);
            toast.error(err.message || "Error saving subscription plan");
        }
    };

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        if (!id) return;

        try {
            await adminAPI.deletePlan(id);
            await fetchPlans();
            toast.success('Plan node deleted');
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (err) {
            console.error("Failed to delete plan", err);
            toast.error(err.message || "Error deleting subscription plan");
        }
    };

    return (
        <>
            <div className="space-y-12 pb-20">
                <div className="rounded-[2rem] border border-brand/15 bg-brand/5 px-6 py-5 text-content">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand/70">Apartment Wash Ops</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-content-subtle">
                                Apartment wash plans aur live apartment subscriptions ab dedicated apartment ops desk me manage honge.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.assign('/admin/apartment-wash')}
                            className="rounded-2xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand"
                        >
                            Open Apartment Desk
                        </button>
                    </div>
                </div>
                {/* Global Pass Strategy Command Center */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black text-white p-8 sm:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Crown size={180} />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1.5 h-6 bg-brand rounded-full" />
                                <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter">Pass Strategy Command</h3>
                            </div>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                                Manage universal discount protocols and marketing headlines for the Spare Driver BLACK ecosystem globally.
                            </p>

                            <div className="flex items-center gap-10 mt-8">
                                <div>
                                    <p className="text-[28px] font-[1000] text-brand leading-none">{(passConfig?.discount * 100) || 30}%</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">Universal Discount</p>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div>
                                    <p className="text-[28px] font-[1000] text-emerald-500 leading-none">Global</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">Applicability Range</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 space-y-5" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Marketing Protocol Headline</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 px-5 py-3 rounded-xl text-[10px] font-black text-white outline-none focus:border-brand transition-all"
                                    value={passConfig?.marketingLine || ''}
                                    placeholder="e.g. Save up to 40% on every service"
                                    onChange={(e) => setPassConfig(prev => ({ ...prev, marketingLine: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Discount Rate (0.1 - 0.9)</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        className="w-full bg-black/40 border border-white/10 px-5 py-3 rounded-xl text-[10px] font-black text-white outline-none focus:border-brand transition-all"
                                        value={passConfig?.discount || 0.3}
                                        onChange={(e) => setPassConfig(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateGlobalConfig}
                                    disabled={savingConfig}
                                    className="self-end h-11 px-6 bg-brand text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 group/sync"
                                >
                                    {savingConfig ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} className="group-hover/sync:scale-110 transition-transform" />}
                                    Sync Protocol
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/[0.02] p-1.5 rounded-[2rem] w-fit border border-white/5">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-black text-white shadow-2xl shadow-black/50' : 'text-content-subtle hover:bg-white/5'}`}
                    >
                        Plan Models
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-black text-white shadow-2xl shadow-black/50' : 'text-content-subtle hover:bg-white/5'}`}
                    >
                        Live Subscriptions
                    </button>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${activeTab === 'plans' ? 'bg-brand/10 text-brand' : 'bg-emerald-50 text-emerald-500'} rounded-2xl flex items-center justify-center `}>
                            <Crown size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-content uppercase tracking-tighter leading-none">
                                {activeTab === 'plans' ? 'Subscription Matrix' : 'Subscribed Userbase'}
                            </h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1.5">
                                {activeTab === 'plans' ? 'Model Node Deployment' : 'Active Operational Instances'}
                            </p>
                        </div>
                    </div>
                    {activeTab === 'plans' && (
                        <button
                            onClick={handleOpenAdd}
                            className="h-12 px-8 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center gap-3 hover:scale-105 transition-all group/new"
                        >
                            <Plus size={20} className="group-hover/new:scale-110 transition-transform" /> Deploy New Model
                        </button>
                    )}
                </div>

                {activeTab === 'plans' ? (
                    /* Plan Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading && (
                            <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5 font-black text-content-subtle uppercase text-xs tracking-widest">
                                <div className="w-8 h-8 mx-auto border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-4" />
                                Loading Neural Models...
                            </div>
                        )}
                        {!loading && plans.map((plan, i) => (
                            <motion.div
                                key={plan._id || plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 rounded-[2.5rem] border border-white/5 shadow-soft p-10 relative overflow-hidden group hover:border-brand transition-all"
                            >
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className={`w-14 h-14 bg-${plan.accent}/10 text-${plan.accent} rounded-2xl flex items-center justify-center transition-all group-hover:bg-brand group-hover:text-white`}>
                                        <Sparkles size={28} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                        <button onClick={() => handleOpenEdit(plan)} className="w-10 h-10 bg-white/[0.02] rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white transition-all group/edit"><Edit2 size={18} className="group-hover/edit:scale-110 transition-transform" /></button>
                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: plan._id || plan.id })} className="w-10 h-10 bg-white/[0.02] rounded-xl flex items-center justify-center text-content-subtle hover:bg-red-500 hover:text-white transition-all group/trash"><Trash2 size={18} className="group-hover/trash:scale-110 transition-transform" /></button>
                                    </div>
                                </div>

                                <div className="mb-8 relative z-10">
                                    <h4 className="text-xl font-black text-content uppercase tracking-tighter leading-none mb-1 group-hover:text-brand transition-colors">{plan.name}</h4>
                                    <div className="flex items-baseline gap-1 mt-4">
                                        <span className="text-4xl font-black text-content tracking-tighter leading-none">₹{plan.price}</span>
                                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">/mo</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 relative z-10 border-t border-gray-50 pt-8">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={10} className="text-green-500" strokeWidth={4} />
                                            </div>
                                            <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none">{feat}</span>
                                        </div>
                                    ))}
                                    {plan.applicableServices?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-50 mt-4">
                                            {plan.applicableServices.map((service, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-brand/5 text-brand rounded text-[7px] font-black uppercase tracking-widest border border-brand/10">
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Crown size={200} className="text-content" />
                                </div>
                            </motion.div>
                        ))}
                        {!loading && plans.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10 font-black text-content-subtle uppercase text-xs tracking-widest">
                                No subscription protocols found in system.
                            </div>
                        )}
                    </div>
                ) : (
                    /* Active Subscriptions List */
                    <div className="space-y-4">
                        {subLoading ? (
                            <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5 font-black text-content-subtle uppercase text-xs tracking-widest">
                                <div className="w-8 h-8 mx-auto border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                                Syncing Userbase Instances...
                            </div>
                        ) : subscriptions.length > 0 ? (
                            <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-soft">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02]/50 border-b border-white/5">
                                            <th className="px-8 py-6 text-[10px] font-black text-content-subtle uppercase tracking-widest">Subscriber</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-content-subtle uppercase tracking-widest">Asset & Plan</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-content-subtle uppercase tracking-widest">Society / Hub</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-content-subtle uppercase tracking-widest">Parking Details</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-content-subtle uppercase tracking-widest">Status / Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {subscriptions.map(sub => (
                                            <tr key={sub._id} className="hover:bg-white/[0.02]/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center font-black text-xs text-content-subtle uppercase">
                                                            {sub.user?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-black text-white uppercase tracking-tight">{sub.user?.name || 'Anonymous'}</p>
                                                            <p className="text-[9px] font-bold text-content-subtle mt-0.5">{sub.user?.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-content-subtle group-hover/row:border-emerald-500/30 transition-all group/refresh">
                                                            <RefreshCcw size={18} className="group-hover/refresh:rotate-180 transition-transform duration-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-[1000] text-emerald-600 uppercase tracking-tight">{sub.plan}</p>
                                                            <p className="text-[9px] font-black text-black/30 uppercase mt-0.5">{sub.vehicle?.brand} {sub.vehicle?.model || 'Car'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-[11px] font-[1000] text-white uppercase tracking-tight">{sub.hub?.name || 'Hub/City'}</p>
                                                        <p className="text-[9px] font-black text-black/30 uppercase mt-0.5">{sub.hub?.city || (sub.user?.profile?.address?.city || 'Roam')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {sub.parkingDetails?.block ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="px-2 py-1 bg-white/[0.05] rounded-md text-[8px] font-black text-content-subtle uppercase tracking-widest">{sub.parkingDetails.block}</span>
                                                            <span className="px-2 py-1 bg-white/[0.05] rounded-md text-[8px] font-black text-content-subtle uppercase tracking-widest">{sub.parkingDetails.basement}</span>
                                                            <span className="px-2 py-1 bg-brand/10 rounded-md text-[8px] font-black text-brand uppercase tracking-widest">Pillar: {sub.parkingDetails.pillar}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-content-subtle uppercase italic">Universal Access</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ACTIVE</span>
                                                        </div>
                                                        <p className="text-[9px] font-black text-white/20 uppercase mt-1">EXPIRES: {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10 font-black text-content-subtle uppercase text-xs tracking-widest">
                                No active subscription instances found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-content/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white/5 w-[95%] sm:max-w-4xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5 max-h-[90vh] overflow-y-auto">
                            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]/50">
                                <h2 className="text-xl font-black text-content tracking-tighter uppercase">{editingPlan ? 'Refactor Logic' : 'New Plan Node'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/[0.02] rounded-2xl border border-white/5 transition-all text-content-subtle"><X size={20} /></button>
                            </div>
                            <div className="p-6 sm:p-10 overflow-y-auto max-h-[75vh] scrollbar-hide">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Plan Identity</label>
                                            <input required placeholder="e.g. Spare Driver Pass Pro" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Price Matrix (₹)</label>
                                            <input required type="number" placeholder="599" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Interval</label>
                                            <select className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all appearance-none" value={formData.interval} onChange={e => setFormData({ ...formData, interval: e.target.value })}>
                                                <option>Monthly</option>
                                                <option>Quarterly</option>
                                                <option>Annual</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Wash Credits (Monthly)</label>
                                            <input required type="number" placeholder="4" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.credits || 0} onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Encapsulated Features (One per line)</label>
                                            <textarea required rows={4} placeholder="2 Premium Washes&#10;Interior Detailing&#10;Priority Support" className="w-full bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                                        </div>

                                        {/* Applicable Services Section */}
                                        <div className="col-span-2 space-y-4 pt-6 border-t border-white/5 mt-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-brand uppercase tracking-[0.2em] ml-1 mb-1">Service Applicability</label>
                                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest ml-1 mb-4">Leave empty to apply to all service categories</p>
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
                                                            ? 'bg-brand/5 border-brand text-brand  shadow-brand/5'
                                                            : 'bg-white/[0.02] border-white/5 text-content-subtle hover:border-brand/30'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center border-white/5 transition-all flex-shrink-0 ${(formData.applicableServices || []).includes(service)
                                                            ? 'bg-brand border-brand text-white'
                                                            : 'border-white/10 bg-white/5 group-hover:border-brand/30'
                                                            }`}>
                                                            {(formData.applicableServices || []).includes(service) && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span className="text-[11px] font-[1000] uppercase tracking-tight">{service}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-black/50 hover:bg-brand transition-all flex items-center justify-center gap-3">
                                        Update Sub-Network <Save size={18} />
                                    </button>
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
                            className="bg-white/5 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 border border-white/5 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-content leading-none uppercase tracking-tighter mb-2">Delete Plan?</h3>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mb-8 px-4">This action will permanently delete this plan node from the system.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 bg-white/[0.05] text-content-subtle py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminSubscriptions;
