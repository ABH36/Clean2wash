import React, { useState, useEffect, useRef } from 'react';
import { 
    Megaphone, Plus, Search, Filter, Eye, MousePointer2, 
    TrendingUp, Image as ImageIcon, X, Loader2, CheckCircle2,
    Calendar, Link as LinkIcon, Trash2, Edit3, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

/**
 * ─── ADMIN ADVERTISEMENTS & BANNERS (PHASE 5 WIRING) ───────────────────
 * Dynamic management of in-app banners and promotional campaigns.
 */

const AdminAdvertisements = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        path: '/spare-driver',
        status: 'Active',
        expiry: '',
        cta: 'Book Now'
    });

    const fetchAds = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getPromotions('Banners');
            if (res.status === 'success') {
                setAds(res.data.promotions || []);
            }
        } catch (err) {
            toast.error("Failed to fetch advertisement data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAds(); }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const fd = new FormData();
            fd.append('file', file);
            // Reusing chat upload for now as it handles Cloudinary/Local storage
            const res = await adminAPI.uploadChatFile(fd);
            if (res.status === 'success') {
                setFormData(prev => ({ ...prev, image: res.data.url }));
                toast.success("Asset uploaded successfully");
            }
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setProcessing(true);
            const payload = { ...formData, type: 'Banners' };
            
            if (editingAd) {
                await adminAPI.updatePromotion(editingAd._id, payload);
                toast.success("Campaign updated successfully");
            } else {
                await adminAPI.createPromotion(payload);
                toast.success("New campaign launched!");
            }
            
            setIsModalOpen(false);
            fetchAds();
        } catch (err) {
            toast.error(err.message || "Failed to save campaign");
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleStatus = async (ad) => {
        try {
            const nextStatus = ad.status === 'Active' ? 'Inactive' : 'Active';
            await adminAPI.updatePromotion(ad._id, { status: nextStatus });
            fetchAds();
            toast.success(`Ad campaign ${nextStatus.toLowerCase()}`);
        } catch (err) {
            toast.error("Status update failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently remove this campaign?")) return;
        try {
            await adminAPI.deletePromotion(id);
            fetchAds();
            toast.success("Campaign terminated");
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    const openEdit = (ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title || '',
            subtitle: ad.subtitle || '',
            image: ad.image || '',
            path: ad.path || '/spare-driver',
            status: ad.status || 'Active',
            expiry: ad.expiry ? ad.expiry.split('T')[0] : '',
            cta: ad.cta || 'Book Now'
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingAd(null);
        setFormData({
            title: '',
            subtitle: '',
            image: '',
            path: '/spare-driver',
            status: 'Active',
            expiry: '',
            cta: 'Book Now'
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Advertisement Center</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">In-App Banner Management</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} /> Launch New Ad
                </button>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { icon: <Eye size={20} />, label: 'Impressions', val: '12.4K', color: 'bg-blue-50 text-blue-600' },
                    { icon: <MousePointer2 size={20} />, label: 'Interactions', val: '842', color: 'bg-emerald-50 text-emerald-600' },
                    { icon: <TrendingUp size={20} />, label: 'Avg CTR', val: '6.8%', color: 'bg-purple-50 text-purple-600' },
                    { icon: <Megaphone size={20} />, label: 'Active Ads', val: ads.filter(a => a.status === 'Active').length, color: 'bg-amber-50 text-amber-600' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className={`p-3 w-fit rounded-2xl ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Ads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {ads.map((ad, i) => (
                        <motion.div 
                            key={ad._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all"
                        >
                            <div className="aspect-[16/9] relative bg-slate-100 overflow-hidden">
                                {ad.image ? (
                                    <img src={ad.image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <ImageIcon size={40} />
                                        <span className="text-[10px] font-black uppercase">No Creative Loaded</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button 
                                        onClick={() => handleToggleStatus(ad)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                                            ad.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'
                                        }`}
                                    >
                                        {ad.status === 'Active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <h4 className="text-white font-black text-lg leading-tight truncate">{ad.title}</h4>
                                    <p className="text-white/70 text-xs font-medium truncate mt-1">{ad.subtitle}</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400"><Calendar size={14} /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Expiry</p>
                                            <p className="text-xs font-bold text-slate-700">{ad.expiry ? new Date(ad.expiry).toLocaleDateString() : 'Evergreen'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                                        <p className={`text-xs font-black uppercase tracking-tighter ${ad.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {ad.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <LinkIcon size={12} /> <span className="truncate">{ad.path}</span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={() => openEdit(ad)}
                                        className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={14} /> Edit Campaign
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(ad._id)}
                                        className="w-12 bg-rose-50 text-rose-500 py-3 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Create Trigger Card */}
                <motion.div 
                    onClick={openCreate}
                    className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all min-h-[400px]"
                >
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Plus size={40} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">New Ad Campaign</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 max-w-[200px]">Launch a visual banner to boost engagement.</p>
                    </div>
                </motion.div>
            </div>

            {/* Ad Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !processing && setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingAd ? 'Refine Campaign' : 'Launch Campaign'}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Advertisement Configuration</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                                {/* Visual Asset Upload */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Banner Creative (16:9 recommended)</label>
                                    <div className="relative aspect-[21/9] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group">
                                        {formData.image ? (
                                            <>
                                                <img src={formData.image} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Replace</button>
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, image: '' }))} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Remove</button>
                                                </div>
                                            </>
                                        ) : (
                                            <button 
                                                type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                                className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
                                            >
                                                {uploading ? <Loader2 size={32} className="animate-spin text-blue-600" /> : <ImageIcon size={32} className="text-slate-300" />}
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Click to upload JPG/PNG</span>
                                            </button>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Title</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                            placeholder="e.g. Summer Wash Sale" 
                                            value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtitle / Punchline</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                            placeholder="e.g. 20% off on all deep cleans" 
                                            value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Path</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                            placeholder="/spare-driver" 
                                            value={formData.path} onChange={e => setFormData(p => ({ ...p, path: e.target.value }))} required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Call to Action (CTA)</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                            placeholder="Book Now" 
                                            value={formData.cta} onChange={e => setFormData(p => ({ ...p, cta: e.target.value }))} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiration Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" 
                                            value={formData.expiry} onChange={e => setFormData(p => ({ ...p, expiry: e.target.value }))} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                                        <div className="flex gap-3">
                                            {['Active', 'Inactive'].map(s => (
                                                <button 
                                                    key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        formData.status === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </form>
                            <div className="p-8 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                                <button 
                                    onClick={handleSave} disabled={processing || uploading}
                                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                                    {editingAd ? 'Apply Changes' : 'Confirm & Launch Campaign'}
                                </button>
                            </div>
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

export default AdminAdvertisements;
