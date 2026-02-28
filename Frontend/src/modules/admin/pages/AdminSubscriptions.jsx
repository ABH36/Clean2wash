import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    CheckCircle2,
    Crown,
    Zap,
    Shield,
    Star,
    Sparkles,
    Save,
    Trash
} from 'lucide-react';

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState(() => {
        const saved = localStorage.getItem('CarWash_subscription_plans');
        return saved ? JSON.parse(saved) : [
            { id: 'SUB-001', name: 'clean2wash Lite', price: '299', interval: 'Monthly', status: 'Live', features: ['2 Doorstep Washes', 'Standard Interior Clean', 'Priority Booking'], accent: 'orange-500' },
            { id: 'SUB-002', name: 'clean2wash Pro', price: '599', interval: 'Monthly', status: 'Live', features: ['4 Premium Washes', 'Interior Vacuuming', 'Underbody Cleaning', 'Dedicated Captain'], accent: 'brand' },
            { id: 'SUB-003', name: 'clean2wash Ultra', price: '999', interval: 'Monthly', status: 'Live', features: ['Unlimited Washes', 'Ceramic Shield Coat', 'Full Detailing (Monthly)', 'VIP Support'], accent: 'indigo-500' },
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', interval: 'Monthly', status: 'Live', features: '', accent: 'brand' });

    useEffect(() => {
        localStorage.setItem('CarWash_subscription_plans', JSON.stringify(plans));
    }, [plans]);

    const handleOpenAdd = () => {
        setEditingPlan(null);
        setFormData({ name: '', price: '', interval: 'Monthly', status: 'Live', features: '', accent: 'brand' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({ ...plan, features: plan.features.join('\n') });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
        const updatedData = { ...formData, features: featuresArray };

        if (editingPlan) {
            setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...updatedData } : p));
        } else {
            const newId = `SUB-${String(plans.length + 1).padStart(3, '0')}`;
            setPlans(prev => [{ ...updatedData, id: newId }, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this plan legacy protocol?')) {
            setPlans(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <AdminLayout title="Subscription Matrix">
            <div className="space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-sm">
                            <Crown size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-content italic uppercase tracking-tighter leading-none">Global Plans</h3>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1.5 italic">clean2wash PASS ARCHITECTURE</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="h-12 px-8 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center gap-3 hover:scale-105 transition-all"
                    >
                        <Plus size={18} /> New Model
                    </button>
                </div>

                {/* Plan Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft p-10 relative overflow-hidden group hover:border-brand transition-all"
                        >
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`w-14 h-14 bg-${plan.accent}/10 text-${plan.accent} rounded-2xl flex items-center justify-center transition-all group-hover:bg-brand group-hover:text-white`}>
                                    <Sparkles size={28} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                    <button onClick={() => handleOpenEdit(plan)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white shadow-sm"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(plan.id)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-red-500 hover:text-white shadow-sm"><Trash size={14} /></button>
                                </div>
                            </div>

                            <div className="mb-8 relative z-10">
                                <h4 className="text-xl font-black text-content italic uppercase tracking-tighter leading-none mb-1 group-hover:text-brand transition-colors">{plan.name}</h4>
                                <div className="flex items-baseline gap-1 mt-4">
                                    <span className="text-4xl font-black text-content italic tracking-tighter leading-none">₹{plan.price}</span>
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
                            </div>

                            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <Crown size={200} className="text-content" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-content/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100">
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h2 className="text-xl font-black text-content italic tracking-tighter uppercase">{editingPlan ? 'Refactor Logic' : 'New Plan Node'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all"><X size={20} /></button>
                            </div>
                            <div className="p-10">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Plan Identity</label>
                                            <input required placeholder="e.g. clean2wash Pass Pro" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Price Matrix (₹)</label>
                                            <input required type="number" placeholder="599" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Interval</label>
                                            <select className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all appearance-none" value={formData.interval} onChange={e => setFormData({ ...formData, interval: e.target.value })}>
                                                <option>Monthly</option>
                                                <option>Quarterly</option>
                                                <option>Annual</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1 italic">Encapsulated Features (One per line)</label>
                                            <textarea required rows={4} placeholder="2 Premium Washes&#10;Interior Detailing&#10;Priority Support" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:border-brand transition-all" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                                        </div>
                                    </div>
                                    <button className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-3">
                                        Update Sub-Network <Save size={18} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminSubscriptions;
