import React, { useState, useEffect } from 'react';
import { 
    Share2, Instagram, Facebook, Twitter, TrendingUp, Users, 
    MousePointer2, Plus, Target, BarChart, Calendar, 
    Trash2, Edit3, Loader2, CheckCircle2, Globe, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

/**
 * ─── ADMIN SOCIAL MEDIA CAMPAIGNS (PHASE 5 WIRING) ────────────────────
 * Dynamically manage and track performance across social platforms.
 */

const AdminSocialCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        platform: 'Instagram',
        status: 'Draft',
        budget: { amount: 0 },
        startDate: '',
        endDate: '',
        trackingUrl: ''
    });

    const platforms = [
        { id: 'Instagram', icon: <Instagram size={20} />, color: 'bg-rose-50 text-rose-500', hover: 'hover:border-rose-200' },
        { id: 'Facebook', icon: <Facebook size={20} />, color: 'bg-blue-50 text-blue-600', hover: 'hover:border-blue-200' },
        { id: 'Twitter', icon: <Twitter size={20} />, color: 'bg-slate-900 text-white', hover: 'hover:border-slate-400' },
        { id: 'Google', icon: <Globe size={20} />, color: 'bg-amber-50 text-amber-600', hover: 'hover:border-amber-200' }
    ];

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getCampaigns();
            if (res.status === 'success') {
                setCampaigns(res.data.campaigns || []);
            }
        } catch (err) {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setProcessing(true);
            if (editingCampaign) {
                await adminAPI.updateCampaign(editingCampaign._id, formData);
                toast.success("Campaign metrics updated");
            } else {
                await adminAPI.createCampaign(formData);
                toast.success("New campaign launched");
            }
            setIsModalOpen(false);
            fetchCampaigns();
        } catch (err) {
            toast.error("Process failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Archive this campaign?")) return;
        try {
            await adminAPI.deleteCampaign(id);
            fetchCampaigns();
            toast.success("Campaign archived");
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const openEdit = (c) => {
        setEditingCampaign(c);
        setFormData({
            name: c.name,
            platform: c.platform,
            status: c.status,
            budget: c.budget || { amount: 0 },
            startDate: c.startDate ? c.startDate.split('T')[0] : '',
            endDate: c.endDate ? c.endDate.split('T')[0] : '',
            trackingUrl: c.trackingUrl || ''
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingCampaign(null);
        setFormData({
            name: '',
            platform: 'Instagram',
            status: 'Draft',
            budget: { amount: 0 },
            startDate: '',
            endDate: '',
            trackingUrl: ''
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Growth Center</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Social Media Campaign Console</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} /> New Campaign
                </button>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Engagement', val: '7.4%', icon: <Target />, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Total Clicks', val: '48.2K', icon: <MousePointer2 />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Active Reach', val: '1.2M', icon: <Users />, color: 'bg-rose-50 text-rose-600' },
                    { label: 'Ad Spend', val: '₹14.5K', icon: <TrendingUp />, color: 'bg-amber-50 text-amber-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className={`p-3 w-fit rounded-2xl ${stat.color} mb-3`}>{stat.icon}</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{stat.val}</h4>
                    </div>
                ))}
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Campaigns List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Share2 size={18} className="text-blue-500" /> Active Campaigns
                        </h3>
                        <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                            Total: {campaigns.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-slate-200" size={40} /></div>
                    ) : campaigns.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-50 rounded-[2rem]">
                            <BarChart size={48} />
                            <p className="text-xs font-black uppercase tracking-widest">No Active Campaigns</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {campaigns.map((c) => (
                                <motion.div 
                                    key={c._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    className="p-5 rounded-3xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className={`p-4 rounded-2xl ${platforms.find(p => p.id === c.platform)?.color || 'bg-slate-100'}`}>
                                            {platforms.find(p => p.id === c.platform)?.icon || <Globe size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-slate-800 truncate">{c.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-blue-500 uppercase">{c.status}</span>
                                                <span className="text-[10px] font-bold text-slate-400">•</span>
                                                <span className="text-[10px] font-bold text-slate-400">Budget: ₹{c.budget?.amount || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(c)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleDelete(c._id)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tracking & Analytics Simulation */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><TrendingUp size={200} /></div>
                    <div className="relative z-10 space-y-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Performance Graph</h3>
                            <h2 className="text-2xl font-black mt-1">Cross-Platform Reach</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {platforms.map(p => (
                                <div key={p.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-xl bg-white/10 ${p.color.replace('bg-', 'text-')}`}>{p.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{p.id}</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.random() * 80 + 20}%` }} className="h-full bg-blue-500" />
                                    </div>
                                    <p className="text-[10px] font-bold text-white/40 mt-2">Conversion: {Math.floor(Math.random() * 10 + 2)}%</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button className="w-full py-4 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                                Export Analytics Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingCampaign ? 'Update Metrics' : 'Configure Campaign'}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Campaign Parameters</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Identity</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                        placeholder="e.g. Diwali Cleaning Drive" 
                                        value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none"
                                            value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value }))}
                                        >
                                            {platforms.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none"
                                            value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Paused">Paused</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Draft">Draft</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget (INR)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" 
                                            value={formData.budget.amount} onChange={e => setFormData(p => ({ ...p, budget: { ...p.budget, amount: Number(e.target.value) } }))} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Launch Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" 
                                            value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} 
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" disabled={processing}
                                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                                    {editingCampaign ? 'Save Analytics' : 'Launch Campaign'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AdminSocialCampaigns;
