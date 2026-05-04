import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, Plus, Sparkles, Edit2, Trash2, CheckCircle2,
    X, Check, RefreshCcw, Save, Users, TrendingUp, Zap, CreditCard
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, FilterBar, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', price: '', interval: 'Monthly', status: 'Live', 
        features: '', accent: 'brand', applicableServices: [], credits: 0 
    });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    const [activeTab, setActiveTab] = useState('plans');
    const [subscriptions, setSubscriptions] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

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
        <PageShell
            title="Subscription Matrix"
            subtitle="Model node deployment and active membership command"
            icon={Crown}
            accent="amber"
            badge="Yield-v3"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenAdd}
                        className="h-10 px-5 bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Deploy Model
                    </button>
                    <button 
                        onClick={() => activeTab === 'plans' ? fetchPlans() : fetchSubscriptions()}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCcw size={18} className={(loading || subLoading) ? 'animate-spin' : ''} />
                    </button>
                </div>
            }
        >
            <div className="space-y-12">
                {/* ── METRIC GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Models', value: plans.length, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Active Nodes', value: subscriptions.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Yield Projection', value: '₹4.2L', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Market Index', value: '+18%', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' }
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

                <SectionCard className="bg-slate-900 text-white border-none overflow-hidden group" noPad>
                    <div className="p-10 relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                            <Crown size={160} />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Pass Strategy Command</h3>
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                                    Universal discount protocols and marketing headlines for the Spare Driver BLACK ecosystem.
                                </p>

                                <div className="flex items-center gap-12 pt-4">
                                    <div>
                                        <p className="text-4xl font-black text-amber-500 tracking-tighter">{(passConfig?.discount * 100) || 30}%</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Universal Discount</p>
                                    </div>
                                    <div className="h-12 w-px bg-slate-800" />
                                    <div>
                                        <p className="text-4xl font-black text-emerald-500 tracking-tighter">Global</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Network Range</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Marketing Headline</label>
                                    <input
                                        className="w-full bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-[11px] font-black text-white outline-none focus:border-amber-500 transition-all"
                                        value={passConfig?.marketingLine || ''}
                                        placeholder="e.g. Save up to 40% on every service"
                                        onChange={(e) => setPassConfig(prev => ({ ...prev, marketingLine: e.target.value }))}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Discount Rate (0.1 - 0.9)</label>
                                        <input
                                            type="number"
                                            step="0.05"
                                            className="w-full bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-[11px] font-black text-white outline-none focus:border-amber-500 transition-all"
                                            value={passConfig?.discount || 0.3}
                                            onChange={(e) => setPassConfig(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateGlobalConfig}
                                        disabled={savingConfig}
                                        className="self-end h-14 px-8 bg-amber-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                    >
                                        {savingConfig ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                                        Sync Protocol
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <FilterBar>
                    <StatusTabs 
                        active={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { label: 'Plan Models', value: 'plans' },
                            { label: 'Live Subscriptions', value: 'active', count: subscriptions.length }
                        ]}
                    />
                </FilterBar>

                {activeTab === 'plans' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <PageLoader />
                        ) : plans.length === 0 ? (
                            <EmptyState icon={Crown} title="Matrix Void" subtitle="No subscription models identified in the current sector." />
                        ) : plans.map((plan) => (
                            <motion.div 
                                key={plan._id || plan.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:border-amber-500 hover:shadow-xl transition-all group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        <Sparkles size={32} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleOpenEdit(plan)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><Edit2 size={18} /></button>
                                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: plan._id || plan.id })} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 group-hover:text-amber-600 transition-colors">{plan.name}</h4>
                                    <div className="flex items-baseline gap-2 pt-2">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">₹{plan.price}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ {plan.interval}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 py-8 border-t border-slate-50 flex-1">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                                <Check size={12} className="text-emerald-500" strokeWidth={4} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{feat}</span>
                                        </div>
                                    ))}
                                    {plan.applicableServices?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {plan.applicableServices.map((service, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100">
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Status</span>
                                    <span className={`adm-badge ${plan.status === 'Live' ? 'adm-badge-success' : 'adm-badge-warning'}`}>{plan.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <SectionCard title="Subscribed Userbase" noPad actions={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscriptions.length} Units</span>}>
                        {subLoading ? (
                            <PageLoader />
                        ) : subscriptions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Subscriber</th>
                                            <th>Asset & Plan</th>
                                            <th>Hub / Cluster</th>
                                            <th>Parking Index</th>
                                            <th className="text-right">Status / Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscriptions.map(sub => (
                                            <tr key={sub._id} className="group">
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-[12px] uppercase">
                                                            {sub.user?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{sub.user?.name || 'Anonymous'}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sub.user?.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <p className="text-[12px] font-black text-amber-600 uppercase tracking-tight">{sub.plan}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{sub.vehicle?.brand} {sub.vehicle?.model || 'Car'}</p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <p className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{sub.hub?.name || 'Global Access'}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{sub.hub?.city || 'Roam'}</p>
                                                    </div>
                                                </td>
                                                <td>
                                                    {sub.parkingDetails?.block ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="px-2 py-1 bg-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest">{sub.parkingDetails.block}</span>
                                                            <span className="px-2 py-1 bg-amber-50 rounded-md text-[8px] font-black text-amber-600 uppercase tracking-widest">Pillar: {sub.parkingDetails.pillar}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Universal</span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ACTIVE</span>
                                                        </div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1.5 tracking-tighter">EXP: {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState icon={Users} title="No Active Nodes" subtitle="The subscriber network is currently offline or empty." />
                        )}
                    </SectionCard>
                )}
            </div>

            {/* ── CONFIGURATION MODAL ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">{editingPlan ? 'Modify Model Protocol' : 'Deploy New Plan Node'}</h2>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">Model configuration terminal</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all flex items-center justify-center shadow-sm"><X size={24} /></button>
                            </div>
                            <div className="p-10 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSave} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Identity</label>
                                            <input required placeholder="e.g. Spare Driver Pass Pro" className="adm-input h-14" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Matrix (₹)</label>
                                            <input required type="number" placeholder="599" className="adm-input h-14" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interval Cycle</label>
                                            <select className="adm-input h-14 appearance-none" value={formData.interval} onChange={e => setFormData({ ...formData, interval: e.target.value })}>
                                                <option>Monthly</option>
                                                <option>Quarterly</option>
                                                <option>Annual</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wash Credits</label>
                                            <input required type="number" placeholder="4" className="adm-input h-14" value={formData.credits || 0} onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment State</label>
                                            <select className="adm-input h-14 appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="Live">OPERATIONAL (LIVE)</option>
                                                <option value="Draft">DRAFT MODE</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Features (One per line)</label>
                                            <textarea required rows={4} placeholder="2 Premium Washes&#10;Interior Detailing" className="adm-input p-5 resize-none" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                                        </div>

                                        <div className="col-span-2 space-y-4 pt-6 border-t border-slate-50">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Applicability Range</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Instant Wash', 'Studio Wash', 'Apartment Wash', 'Spare Driver'].map(service => (
                                                    <button
                                                        key={service}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.applicableServices || [];
                                                            const next = current.includes(service) ? current.filter(s => s !== service) : [...current, service];
                                                            setFormData({ ...formData, applicableServices: next });
                                                        }}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${(formData.applicableServices || []).includes(service) ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-xl shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${(formData.applicableServices || []).includes(service) ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 bg-white'}`}>
                                                            {(formData.applicableServices || []).includes(service) && <Check size={14} strokeWidth={4} />}
                                                        </div>
                                                        <span className="text-[11px] font-black uppercase tracking-tight">{service}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="h-16 w-full bg-slate-900 text-white rounded-[2rem] text-sm font-black tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all">
                                        EXECUTE DEPLOYMENT <Save size={20} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Termination Confirmation */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 relative z-10 border border-slate-200 shadow-2xl text-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">Neutralize Plan?</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 px-4 leading-relaxed">This action will permanently purge the plan node from the neural matrix.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleDelete} className="h-14 w-full bg-rose-600 text-white rounded-2xl text-[10px] font-black tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">PURGE NODE</button>
                                <button onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="h-14 w-full bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black tracking-widest hover:bg-slate-200 transition-all">ABORT ACTION</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminSubscriptions;
