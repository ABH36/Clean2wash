import React, { useState, useEffect } from 'react';
import {
    Check, X, Search, Filter, ShoppingBag,
    TrendingUp, ShieldCheck, Clock, Layers,
    ChevronRight, Play, Plus, Trash2, Edit3,
    Percent, DollarSign, Package, Image as ImageIcon,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminProductVerification = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // Form State for New Product
    const [newProduct, setNewProduct] = useState({
        name: '', category: 'Cleaning', price: '', salePrice: '',
        description: '', image: '', commission: 10
    });

    useEffect(() => {
        fetchProducts();
    }, [filterStatus]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getProducts({ status: filterStatus });
            if (response.status === 'success') {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error('Failed to sync catalog:', error);
            toast.error('Tactical link failure: Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (productId, newStatus) => {
        try {
            setProcessingId(productId);
            const res = await adminAPI.verifyProduct({ productId, status: newStatus });
            if (res.status === 'success') {
                toast.success(`Protocol ${newStatus.toLowerCase()} secured`);
                fetchProducts();
            }
        } catch (error) {
            toast.error('Moderation failed: System interference');
        } finally {
            setProcessingId(null);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Admin products are pre-approved
            const data = { ...newProduct, status: 'Approved', isAdminProduct: true };
            const res = await adminAPI.request('/products', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.status === 'success') {
                toast.success('Admin asset deployed successfully');
                setIsAddModalOpen(false);
                fetchProducts();
                setNewProduct({ name: '', category: 'Cleaning', price: '', salePrice: '', description: '', image: '', commission: 10 });
            }
        } catch (error) {
            toast.error('Deployment failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCommission = async (productId, commission) => {
        try {
            setProcessingId(productId);
            const res = await adminAPI.request(`/products/${productId}/commission`, {
                method: 'PATCH',
                body: JSON.stringify({ commission })
            });
            if (res.status === 'success') {
                toast.success(`Commission pivoted to ${commission}%`);
                setIsCommissionModalOpen(false);
                fetchProducts();
            }
        } catch (error) {
            toast.error('Pivot failed: Data mismatch');
        } finally {
            setProcessingId(null);
        }
    };

    const stats = {
        pending: products.filter(p => p.status === 'Pending').length,
        approved: products.filter(p => p.status === 'Approved').length,
        total: products.length
    };

    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.vendor?.name || p.vendor?.profile?.studioName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1450px] mx-auto space-y-4 pb-20 px-3 lg:px-2 transition-colors duration-500">
            {/* ── COMMAND HEADER ── */}
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/5 border border-brand/10"><ShoppingBag size={20} /></div>
                    <div>
                        <h1 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Quality Governance</h1>
                        <p className="text-[8.5px] font-black text-content-subtle capitalize tracking-[0.2em] mt-1.5 opacity-40">Operational integrity & asset moderation</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 sm:flex-none h-11 px-6 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} /> Deploy Asset
                    </button>
                    <button
                        onClick={() => navigate('/admin/product-war-room')}
                        className="flex-1 sm:flex-none h-11 px-6 bg-background border border-slate-100 dark:border-white/5 text-content-muted rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface transition-all shadow-inner"
                    >
                        <TrendingUp size={16} /> War-Room
                    </button>
                </div>
            </header>

            {/* ── TACTICAL STATS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Gate', val: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
                    { label: 'Active Pipeline', val: stats.approved, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: ShieldCheck },
                    { label: 'Omni Loadout', val: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Layers },
                    { label: 'System Health', val: '99.8%', color: 'text-content', bg: 'bg-background', icon: Activity }
                ].map((s, i) => (
                    <div key={i} className="bg-surface p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft group hover:translate-y-[-2px] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border border-transparent`}>
                                <s.icon size={20} />
                            </div>
                            <span className="text-[9px] font-black text-content-subtle opacity-20 uppercase tracking-widest font-mono">NODE_{i}</span>
                        </div>
                        <p className="text-[10px] font-black text-content-subtle capitalize tracking-widest mb-1 opacity-40">{s.label}</p>
                        <h4 className={`text-2xl font-black ${s.color} leading-none tracking-tighter tabular-nums`}>{s.val}</h4>
                    </div>
                ))}
            </div>

            {/* ── FILTER & SEARCH HUD ── */}
            <div className="bg-surface p-3 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft flex flex-col md:flex-row gap-3 items-center justify-between transition-all">
                <div className="flex bg-background p-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner w-full md:w-auto">
                    {['Pending', 'Approved', 'Rejected', 'All'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterStatus(t)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[9.5px] font-black capitalize tracking-widest transition-all ${filterStatus === t ? 'bg-surface text-brand shadow-sm border border-slate-100 dark:border-white/5' : 'text-content-muted hover:text-content'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-30 group-focus-within:text-brand transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Scan Assets or Vendors..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-11 pr-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all placeholder:text-content-subtle opacity-60 tracking-widest shadow-inner"
                    />
                </div>
            </div>

            {/* ── ASSET GRID ── */}
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full" />
                        <span className="text-[9px] font-black capitalize tracking-[0.4em] text-content-subtle opacity-20 font-mono">Synchronizing Catalogs...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-surface rounded-3xl border border-dashed border-slate-200/60 dark:border-white/5 p-24 flex flex-col items-center gap-5 text-center shadow-soft">
                        <ShoppingBag size={48} className="text-content-subtle opacity-10" />
                        <div>
                            <h3 className="text-lg font-black text-content capitalize tracking-tight">Catalog Neutralized</h3>
                            <p className="text-[10px] font-bold text-content-subtle capitalize tracking-[0.2em] opacity-40 mt-1">No operational assets found in this sector</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((item, i) => (
                            <motion.div
                                key={item._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.02 }}
                                className="bg-surface rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft overflow-hidden group hover:border-brand/30 transition-all flex flex-col relative"
                            >
                                <div className="relative h-44 bg-background overflow-hidden">
                                    <img src={item.image} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black capitalize tracking-widest border border-white/10 shadow-xl backdrop-blur-md text-white
                                            ${item.status === 'Approved' ? 'bg-emerald-500/80' :
                                                item.status === 'Rejected' ? 'bg-red-500/80' :
                                                    'bg-amber-500/80'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <button
                                            onClick={() => { setSelectedProduct(item); setIsCommissionModalOpen(true); }}
                                            className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white border border-white/20 hover:bg-brand transition-all"
                                        >
                                            <Percent size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[8px] font-black text-brand capitalize tracking-widest opacity-60">HQ-{item.category}</span>
                                            <div className="w-1 h-1 bg-content-subtle opacity-20 rounded-full" />
                                            <span className="text-[8.5px] font-black text-content-subtle opacity-40 tabular-nums">ID-{item._id?.slice(-4)}</span>
                                        </div>
                                        <h4 className="text-[13px] font-bold text-content capitalize tracking-tight leading-tight line-clamp-1">{item.name}</h4>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-background border border-slate-100 dark:border-white/5 rounded-2xl mb-4 shadow-inner">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-brand font-black text-[10px] shadow-sm border border-slate-100 dark:border-white/5 shrink-0">
                                                {(item.vendor?.profile?.studioName || item.vendor?.name || 'V')[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9.5px] font-bold text-content capitalize tracking-tight truncate">
                                                    {item.vendor?.profile?.studioName || item.vendor?.name || 'Verified Vendor'}
                                                </p>
                                                <p className="text-[7.5px] font-black text-content-subtle uppercase tracking-widest opacity-40 truncate">
                                                    Commission: <span className="text-brand opacity-100">{item.commission || 10}%</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[12.5px] font-black text-content tabular-nums tracking-tighter">₹{item.salePrice}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        {item.status === 'Pending' ? (
                                            <>
                                                <button
                                                    disabled={processingId === item._id}
                                                    onClick={() => handleAction(item._id, 'Rejected')}
                                                    className="flex-1 h-10 bg-background border border-slate-100 dark:border-white/5 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-inner disabled:opacity-50"
                                                >
                                                    Refuse
                                                </button>
                                                <button
                                                    disabled={processingId === item._id}
                                                    onClick={() => handleAction(item._id, 'Approved')}
                                                    className="flex-[2.5] h-10 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === item._id ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Check size={14} strokeWidth={3} />
                                                    )}
                                                    Verify Asset
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedProduct(item)}
                                                className="w-full h-10 bg-background border border-slate-100 dark:border-white/5 text-content-muted hover:text-brand rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-inner"
                                            >
                                                <Edit3 size={12} /> Inspect Protocol
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* ── ADD ASSET MODAL ── */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-surface w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-slate-200/60 dark:border-white/5 transition-colors duration-500">
                            <form onSubmit={handleAddProduct} className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Plus size={20} /></div>
                                        <div>
                                            <h2 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Deploy New Asset</h2>
                                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mt-1.5 opacity-40">Direct HQ Onboarding</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-content-subtle hover:text-red-500 transition-all shadow-inner"><X size={16} /></button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Asset Name</label>
                                            <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Quantum Kit X-1" className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Category</label>
                                            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner capitalize">
                                                {['Cleaning', 'Detailing', 'Studio', 'Accessories', 'Protection'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">MRP Value (₹)</label>
                                            <input required type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="4999" className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">HQ Val (₹)</label>
                                            <input required type="number" value={newProduct.salePrice} onChange={e => setNewProduct({ ...newProduct, salePrice: e.target.value })} placeholder="3999" className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl px-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Image Endpoint (URL)</label>
                                        <div className="relative">
                                            <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-30" />
                                            <input required type="text" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="https://cloud.cdn/asset.jpg" className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-11 pr-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Technical Descriptor</label>
                                        <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Explain operational specifications..." className="w-full h-24 bg-background border border-slate-100 dark:border-white/5 rounded-xl p-4 text-[11px] font-bold text-content outline-none focus:border-brand/40 transition-all shadow-inner resize-none" />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full h-12 bg-brand text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 mt-8 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Package size={16} /> Deploy HQ Asset</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── COMMISSION MODAL ── */}
            <AnimatePresence>
                {isCommissionModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCommissionModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-slate-200/60 dark:border-white/5">
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Percent size={20} /></div>
                                    <div>
                                        <h2 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Pivot Commission</h2>
                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mt-1.5 opacity-40">Dynamic Revenue Scaling</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-background border border-slate-100 dark:border-white/5 rounded-2xl mb-6 shadow-inner text-center">
                                    <p className="text-[10px] font-black text-content-subtle capitalize mb-1 opacity-40">Active Asset</p>
                                    <p className="text-sm font-black text-content capitalize">{selectedProduct.name}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Percent size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-30 group-focus-within:text-brand" />
                                        <input
                                            type="number"
                                            defaultValue={selectedProduct.commission || 10}
                                            id="commission-input"
                                            className="w-full h-14 bg-background border border-slate-100 dark:border-white/5 rounded-2xl pl-11 pr-4 text-xl font-black text-content outline-none focus:border-brand/40 transition-all shadow-inner text-center"
                                        />
                                    </div>
                                    <p className="text-[8px] font-black text-content-subtle uppercase tracking-[0.2em] text-center opacity-30">Enter percentage (0-100)</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button onClick={() => setIsCommissionModalOpen(false)} className="h-12 bg-background border border-slate-100 dark:border-white/5 text-content-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all">Cancel</button>
                                    <button
                                        onClick={() => handleUpdateCommission(selectedProduct._id, document.getElementById('commission-input').value)}
                                        className="h-12 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Update Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── INSPECTION MODAL ── */}
            <AnimatePresence>
                {selectedProduct && !isCommissionModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/5">
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div className="h-[350px] md:h-auto relative bg-background">
                                        <img src={selectedProduct.image} alt="" className="w-full h-full object-cover opacity-90" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <span className="bg-brand text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl border border-white/10">Visual Protocol Check</span>
                                        </div>
                                    </div>
                                    <div className="p-8 lg:p-10 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[10px] text-brand font-black capitalize tracking-[0.2em]">{selectedProduct.category} Node</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                                <span className="text-[10px] text-content-subtle font-black tracking-widest uppercase opacity-40">System-ID: {selectedProduct._id}</span>
                                            </div>
                                            <h2 className="text-[28px] font-black text-content capitalize tracking-tighter leading-tight mb-4">{selectedProduct.name}</h2>
                                            <p className="text-[12px] font-bold text-content-subtle leading-relaxed opacity-60">{selectedProduct.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1.5 opacity-30">Asset Base (₹)</p>
                                                <p className="text-[20px] font-black text-content tabular-nums tracking-tighter">₹{selectedProduct.price}</p>
                                            </div>
                                            <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10 shadow-inner">
                                                <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1.5 opacity-60">HQ Valuation (₹)</p>
                                                <p className="text-[20px] font-black text-brand tabular-nums tracking-tighter">₹{selectedProduct.salePrice}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                                            {selectedProduct.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleAction(selectedProduct._id, 'Rejected')} className="flex-1 h-12 bg-background border border-slate-100 dark:border-white/5 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Refuse Protocol</button>
                                                    <button onClick={() => handleAction(selectedProduct._id, 'Approved')} className="flex-[2] h-12 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] flex items-center justify-center gap-3 transition-all">
                                                        <Check size={18} strokeWidth={3} /> Approve Asset
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-10 h-10 bg-background/50 backdrop-blur-md rounded-full flex items-center justify-center text-content border border-slate-200/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={20} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminProductVerification;
