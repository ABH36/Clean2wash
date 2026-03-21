import React, { useState, useMemo, useEffect } from 'react';
import {
    Check, X, Search, Filter, ShoppingBag,
    ExternalLink, Eye, AlertCircle, TrendingUp,
    ShieldCheck, Clock, Layers, ChevronRight, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const AdminProductVerification = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Pending'); // Pending, Approved, Rejected, All
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [processingId, setProcessingId] = useState(null);

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
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };



    const filtered = products.filter(p => {
        const vendorName = p.vendor?.profile?.studioName || p.vendor?.name || 'Unknown Vendor';
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendorName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleAction = async (product, newStatus) => {
        try {
            setProcessingId(product._id || product.id);
            await adminAPI.verifyProduct({
                productId: product._id || product.id,
                status: newStatus
            });
            await fetchProducts();
            setSelectedProduct(null);
            toast.success(`Product ${newStatus.toLowerCase()} successfully`);
        } catch (error) {
            toast.error('Moderation failed: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    // We might need a separate call for stats if we want total across all statuses
    // For now, let's just use what's loaded if filterStatus is 'All', otherwise show partial
    const stats = {
        pending: products.filter(p => p.status === 'Pending').length,
        approved: products.filter(p => p.status === 'Approved').length,
        rejected: products.filter(p => p.status === 'Rejected').length,
        total: products.length
    };

    return (
        <AdminLayout title="Product Governance">
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h2 className="text-xl font-black text-content uppercase tracking-tight">Product Governance</h2>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mt-2">Verify and moderate vendor listing requests</p>
                </div>
                <button
                    onClick={() => navigate('/admin/product-war-room')}
                    className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all"
                >
                    <TrendingUp size={14} />
                    Open War-Room
                </button>
            </div>
            <div className="space-y-6 pb-20">
                {/* Tactical Stats Rack */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Review', val: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
                        { label: 'Live Products', val: stats.approved, color: 'text-green-500', bg: 'bg-green-500/10', icon: ShieldCheck },
                        { label: 'Refused Entry', val: stats.rejected, color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
                        { label: 'Total Catalog', val: stats.total, color: 'text-content', bg: 'bg-gray-100/10', icon: Layers },
                    ].map((s, i) => (
                        <div key={i} className="bg-surface p-5 rounded-3xl border border-gray-100/10 shadow-soft">
                            <div className="flex items-start justify-between mb-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                    <s.icon size={18} />
                                </div>
                                <div className="text-[10px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                                    <TrendingUp size={10} /> +100%
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mb-1">{s.label}</p>
                            <h3 className={`text-2xl font-black ${s.color} tracking-tighter`}>{s.val}</h3>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="bg-surface p-4 rounded-3xl border border-gray-100/10 shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-background p-1 rounded-2xl border border-gray-100/10">
                        {['Pending', 'Approved', 'Rejected', 'All'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterStatus(t)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === t ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Search protocol names or vendors..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-background border border-gray-100/10 rounded-2xl pl-11 pr-4 text-[12px] font-bold text-content outline-none focus:border-brand/40 transition-all placeholder:text-content-subtle/30"
                        />
                    </div>
                </div>

                {/* Listing Grid */}
                {filtered.length === 0 ? (
                    <div className="bg-surface rounded-3xl border border-dashed border-gray-100/20 p-20 flex flex-col items-center gap-4 text-center">
                        <ShoppingBag size={48} className="text-gray-100/10" />
                        <h3 className="text-lg font-black text-content uppercase tracking-tight">Clearance Complete</h3>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">No pending items found in this sector</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((item, i) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-surface rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden group hover:border-brand/20 transition-all flex flex-col"
                            >
                                <div className="relative h-48 bg-background group-hover:scale-105 transition-transform duration-700">
                                    <img src={item.image} alt="" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 shadow-2xl backdrop-blur-md text-white
                                            ${item.status === 'Approved' ? 'bg-green-500/80' :
                                                item.status === 'Rejected' ? 'bg-red-500/80' :
                                                    'bg-amber-500/80 animate-pulse'}`}>
                                            {item.status === 'Approved' ? 'Verified' : item.status === 'Rejected' ? 'Refused' : 'Action Required'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProduct(item)}
                                        className="absolute bottom-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 hover:bg-brand transition-colors"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] font-black text-brand uppercase tracking-[0.2em]">{item.category}</span>
                                            <div className="w-1 h-1 bg-gray-100/20 rounded-full" />
                                            <span className="text-[8px] font-black text-content-subtle uppercase tracking-[0.2em]">{item._id}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-content uppercase tracking-tight leading-tight line-clamp-1">{item.name}</h4>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-background border border-gray-100/10 rounded-2xl mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-black text-[10px]">
                                            {(item.vendor?.profile?.studioName || item.vendor?.name || 'U')[0]}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[9px] font-black text-content uppercase tracking-tight leading-none mb-1 truncate">
                                                {item.vendor?.profile?.studioName || item.vendor?.name || 'Unknown Vendor'}
                                            </p>
                                            <p className="text-[7px] font-bold text-content-subtle uppercase tracking-widest truncate">
                                                {item.vendor?.email || 'No Email'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <button
                                            disabled={processingId === item._id}
                                            onClick={() => handleAction(item, 'Rejected')}
                                            className="flex-1 h-10 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                        >
                                            Refuse
                                        </button>
                                        <button
                                            disabled={processingId === item._id}
                                            onClick={() => handleAction(item, 'Approved')}
                                            className="flex-[2] h-10 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {processingId === item._id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check size={14} strokeWidth={3} />
                                            )}
                                            Verify Item
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Investigation Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-5">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/5"
                        >
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div className="h-[400px] md:h-auto relative bg-background">
                                        {selectedProduct.video ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black/40">
                                                <Play size={48} className="text-white fill-white animate-pulse" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Video Stream Loaded</p>
                                                <p className="text-[8px] font-bold text-white/40">{selectedProduct.video}</p>
                                            </div>
                                        ) : (
                                            <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-8 left-8">
                                            <div className="bg-brand text-white px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Visual Audit</div>
                                        </div>
                                    </div>

                                    <div className="p-10 space-y-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] text-brand font-black uppercase tracking-widest">{selectedProduct.category}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand/20" />
                                                <span className="text-[10px] text-content-subtle font-black uppercase tracking-widest">{selectedProduct._id}</span>
                                            </div>
                                            <h2 className="text-3xl font-[1000] text-content uppercase tracking-tighter leading-none mb-4">{selectedProduct.name}</h2>
                                            <p className="text-sm font-bold text-content-subtle leading-loose">{selectedProduct.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-background p-4 rounded-3xl border border-gray-100/10">
                                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1.5">MRP Integration</p>
                                                <p className="text-xl font-black text-content">₹{selectedProduct.price}</p>
                                            </div>
                                            <div className="bg-background p-4 rounded-3xl border border-gray-100/10">
                                                <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1.5">Platform Valuation</p>
                                                <p className="text-xl font-black text-brand">₹{selectedProduct.salePrice}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-content uppercase tracking-widest mb-4 border-b border-gray-100/10 pb-2">Technical Specifications</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {(selectedProduct.specifications || []).map((spec, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-background/50 px-4 py-2.5 rounded-xl border border-gray-100/5">
                                                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{spec.key || 'Protocol'}</span>
                                                        <span className="text-[10px] font-black text-content uppercase tracking-widest">{spec.value || 'Verified'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                disabled={processingId === selectedProduct._id}
                                                onClick={() => handleAction(selectedProduct, 'Rejected')}
                                                className="flex-1 h-14 bg-red-500/10 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg disabled:opacity-50"
                                            >
                                                Reject Entry
                                            </button>
                                            <button
                                                disabled={processingId === selectedProduct._id}
                                                onClick={() => handleAction(selectedProduct, 'Approved')}
                                                className="flex-[2] h-14 bg-brand text-white rounded-2xl text-[11px] font-[1000] uppercase tracking-widest shadow-2xl shadow-brand/30 flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {processingId === selectedProduct._id ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check size={20} strokeWidth={3} /> Approve protocol
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminProductVerification;
