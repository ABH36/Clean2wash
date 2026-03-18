import React, { useState, useEffect } from 'react';
import {
    Package, AlertTriangle, RefreshCw, Search,
    Plus, X, Check, BarChart3, ChevronRight,
    TrendingUp, Droplets, ShieldCheck, Zap,
    Edit2, Trash2, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';
import { vendorAPI } from '../../../utils/vendorApi';

const CATEGORIES = ['Cleaning', 'Detailing', 'Tools', 'Maintenance'];
const UNITS = ['Liters', 'Tubs', 'Units', 'Bottles', 'Kgs', 'Packs'];

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
    <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl text-white text-[11px] font-black uppercase tracking-widest
            ${type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}
    >
        {type === 'error' ? <AlertTriangle size={14} /> : <Check size={14} strokeWidth={3} />}
        {msg}
    </motion.div>
);

// ─── Supply Form Drawer ────────────────────────────────────────────────────────
const SupplyDrawer = ({ open, onClose, initial, onSave }) => {
    const [form, setForm] = useState(initial || { name: '', category: 'Cleaning', stock: '', unit: 'Liters', threshold: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setForm(initial || { name: '', category: 'Cleaning', stock: '', unit: 'Liters', threshold: '' });
            setErrors({});
        }
    }, [open, initial]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (form.stock === '' || isNaN(form.stock)) errs.stock = 'Invalid stock';
        if (form.threshold === '' || isNaN(form.threshold)) errs.threshold = 'Invalid threshold';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        onSave({
            ...form,
            stock: Number(form.stock),
            threshold: Number(form.threshold),
            id: initial?.id || `INV-${Math.floor(Math.random() * 900) + 100}`,
            status: Number(form.stock) === 0 ? 'Out of Stock' : Number(form.stock) < Number(form.threshold) ? 'Low Stock' : 'Healthy'
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
                    />
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        className="fixed right-0 top-0 h-full bg-surface z-[210] shadow-2xl flex flex-col border-l border-gray-100/10"
                        style={{ width: 400 }}
                    >
                        <div className="px-6 py-5 border-b border-gray-100/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-content tracking-tight uppercase">
                                    {initial ? 'Edit Supply' : 'Add New Supply'}
                                </h2>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1 italic">Resource Logging</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-background rounded-xl transition-all border border-gray-100/10">
                                <X size={18} className="text-content-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Supply Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Premium Wax"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={`w-full h-12 bg-background border rounded-xl px-4 text-sm font-bold text-content outline-none focus:border-brand transition-all ${errors.name ? 'border-red-500/50' : 'border-gray-100/10'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full h-12 bg-background border border-gray-100/10 rounded-xl px-4 text-xs font-bold text-content outline-none focus:border-brand cursor-pointer"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={e => setForm({ ...form, unit: e.target.value })}
                                        className="w-full h-12 bg-background border border-gray-100/10 rounded-xl px-4 text-xs font-bold text-content outline-none focus:border-brand cursor-pointer"
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Stock Level</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={form.stock}
                                        onChange={e => setForm({ ...form, stock: e.target.value })}
                                        className={`w-full h-12 bg-background border rounded-xl px-4 text-sm font-bold text-content outline-none focus:border-brand transition-all ${errors.stock ? 'border-red-500/50' : 'border-gray-100/10'}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Alert Threshold</label>
                                    <input
                                        type="number"
                                        placeholder="5"
                                        value={form.threshold}
                                        onChange={e => setForm({ ...form, threshold: e.target.value })}
                                        className={`w-full h-12 bg-background border rounded-xl px-4 text-sm font-bold text-content outline-none focus:border-brand transition-all ${errors.threshold ? 'border-red-500/50' : 'border-gray-100/10'}`}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-blue-500" />
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tactical Note</p>
                                </div>
                                <p className="text-[9px] font-bold text-content-subtle uppercase leading-relaxed">
                                    Setting an accurate threshold ensures your studio never runs out of critical supplies during high-demand service windows.
                                </p>
                            </div>
                        </form>

                        <div className="p-6 border-t border-gray-100/10 flex gap-3">
                            <button onClick={onClose} className="flex-1 h-12 border border-gray-100/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-content-subtle hover:bg-background transition-all">Cancel</button>
                            <button onClick={handleSubmit} className="flex-[2] h-12 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">Commit Changes</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Main Inventory View ───────────────────────────────────────────────────────
const VendorInventory = () => {
    const { getUser } = useAuth();
    const vendor = getUser('vendor') || {};

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchInventory = async () => {
        try {
            const res = await vendorAPI.getProfile();
            if (res.status === 'success') {
                setInventory(res.data.vendor.profile?.inventory || []);
            }
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (item) => {
        try {
            let newInventory;
            if (editingItem) {
                newInventory = inventory.map(i => i.id === item.id ? item : i);
            } else {
                newInventory = [...inventory, item];
            }

            const res = await vendorAPI.updateProfile({ 'profile.inventory': newInventory });
            if (res.status === 'success') {
                setInventory(newInventory);
                setDrawerOpen(false);
                setEditingItem(null);
                showToast(editingItem ? 'Supply Updated' : 'Supply Added');
            }
        } catch (err) {
            showToast('Failed to save changes', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            const newInventory = inventory.filter(i => i.id !== id);
            const res = await vendorAPI.updateProfile({ 'profile.inventory': newInventory });
            if (res.status === 'success') {
                setInventory(newInventory);
                showToast('Supply Removed', 'error');
            }
        } catch (err) {
            showToast('Failed to remove supply', 'error');
        }
    };

    const handleRefill = async (id) => {
        try {
            const item = inventory.find(i => i.id === id);
            if (!item) return;

            const newStock = item.stock + 10;
            const updatedItem = {
                ...item,
                stock: newStock,
                status: newStock === 0 ? 'Out of Stock' : newStock < item.threshold ? 'Low Stock' : 'Healthy'
            };

            const newInventory = inventory.map(i => i.id === id ? updatedItem : i);
            const res = await vendorAPI.updateProfile({ 'profile.inventory': newInventory });
            if (res.status === 'success') {
                setInventory(newInventory);
                showToast(`Refilled +10 ${item.unit}`);
            }
        } catch (err) {
            showToast('Refill failed', 'error');
        }
    };

    const filtered = inventory.filter(i =>
        (activeCategory === 'All' || i.category === activeCategory) &&
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: inventory.length,
        outOfStock: inventory.filter(i => i.stock === 0).length,
        lowStock: inventory.filter(i => i.stock > 0 && i.stock < i.threshold).length,
        healthy: inventory.filter(i => i.stock >= i.threshold).length
    };

    return (
        <VendorLayout title="Supply Web" subtitle="Logistics & resource management for your studio">
            <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

            <SupplyDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditingItem(null); }}
                initial={editingItem}
                onSave={handleSave}
            />

            <div className="space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total items', val: stats.total, icon: Package, color: 'text-content' },
                        { label: 'Healthy', val: stats.healthy, icon: ShieldCheck, color: 'text-green-500' },
                        { label: 'Low Stock', val: stats.lowStock, icon: AlertTriangle, color: 'text-amber-500' },
                        { label: 'Exhausted', val: stats.outOfStock, icon: Droplets, color: 'text-red-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface p-6 rounded-[2rem] border border-gray-100/10 shadow-soft flex items-center justify-between transition-all hover:scale-105">
                            <div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mb-2">{s.label}</p>
                                <h3 className={`text-2xl font-black ${s.color}`}>{String(s.val).padStart(2, '0')}</h3>
                            </div>
                            <div className="w-12 h-12 bg-background border border-gray-100/10 rounded-2xl flex items-center justify-center text-content-muted">
                                <s.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between bg-surface p-4 rounded-3xl border border-gray-100/10 shadow-soft">
                    <div className="flex gap-2 bg-background p-1.5 rounded-2xl border border-gray-100/10 overflow-x-auto no-scrollbar">
                        {['All', ...CATEGORIES].map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveCategory(c)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === c ? 'bg-surface text-brand shadow-sm border border-gray-100/10' : 'text-content-subtle hover:text-content'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                            <input
                                type="text"
                                placeholder="Locate supply..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-64 h-12 bg-background border border-gray-100/10 rounded-2xl pl-12 pr-6 text-[11px] font-black text-content italic outline-none focus:border-brand transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="px-8 h-12 bg-brand text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                            <Plus size={18} strokeWidth={3} /> Log New Supply
                        </button>
                    </div>
                </div>

                {/* Inventory List */}
                <div className="bg-surface rounded-[2.5rem] border border-gray-100/10 overflow-hidden shadow-soft">
                    <div className="p-8 border-b border-gray-100/10 flex items-center justify-between">
                        <h3 className="text-xl font-black text-content italic uppercase tracking-tighter">Tactical <span className="text-brand">Stock</span></h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-content-subtle uppercase">
                                <span className="w-2 h-2 rounded-full bg-green-500" /> Healthy
                                <span className="w-2 h-2 rounded-full bg-amber-500 ml-4" /> Low
                                <span className="w-2 h-2 rounded-full bg-red-500 ml-4" /> Exhausted
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4 text-center">
                            <Droplets size={40} className="text-content-subtle/10" />
                            <div>
                                <p className="text-base font-black text-content italic uppercase">Registry Empty</p>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">No supplies found matching your criteria</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Item Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic text-center">In-Stock</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Inventory Health</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest italic text-right">Strategic Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(i => (
                                        <motion.tr
                                            layout
                                            key={i.id}
                                            className="border-b border-gray-100/5 group hover:bg-background/40 transition-all font-black"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">
                                                        <Droplets size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-content tracking-tight">{i.name}</p>
                                                        <p className="text-[9px] font-bold text-brand uppercase tracking-widest italic">{i.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <p className="text-base font-black italic tracking-tighter text-content">{i.stock} <span className="text-[10px] uppercase font-black not-italic opacity-40">{i.unit}</span></p>
                                                <div className="w-20 mx-auto h-1.5 bg-background border border-gray-100/10 rounded-full mt-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((i.stock / (i.threshold * 2)) * 100, 100)}%` }}
                                                        className={`h-full ${i.status === 'Healthy' ? 'bg-green-500' : i.status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest
                                                    ${i.status === 'Healthy' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                        i.status === 'Low Stock' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                            'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i.status === 'Healthy' ? 'bg-green-500' : i.status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                    {i.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                    <button
                                                        onClick={() => handleRefill(i.id)}
                                                        className="p-2.5 bg-background border border-gray-100/10 rounded-xl text-content-muted hover:text-brand hover:border-brand/40 transition-all font-bold"
                                                        title="Quick Refill (+10)"
                                                    >
                                                        <RefreshCw size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingItem(i); setDrawerOpen(true); }}
                                                        className="p-2.5 bg-background border border-gray-100/10 rounded-xl text-content-muted hover:text-blue-500 hover:border-blue-500/40 transition-all font-bold"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(i.id)}
                                                        className="p-2.5 bg-background border border-gray-100/10 rounded-xl text-content-muted hover:text-red-500 hover:border-red-500/40 transition-all font-bold"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorInventory;
