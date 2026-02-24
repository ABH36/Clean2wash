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

// ─── Initial Seed Data ────────────────────────────────────────────────────────
const INITIAL_INVENTORY = [
    { id: 'INV-001', name: 'Premium Eco Soap', category: 'Cleaning', stock: 12, unit: 'Liters', status: 'Healthy', threshold: 5 },
    { id: 'INV-002', name: 'Carnauba Wax', category: 'Detailing', stock: 2, unit: 'Tubs', status: 'Low Stock', threshold: 10 },
    { id: 'INV-003', name: 'Microfiber Towels', category: 'Tools', stock: 45, unit: 'Units', status: 'Healthy', threshold: 20 },
    { id: 'INV-004', name: 'Tire Shine Spray', category: 'Cleaning', stock: 0, unit: 'Bottles', status: 'Out of Stock', threshold: 15 },
    { id: 'INV-005', name: 'Interior Leather Care', category: 'Detailing', stock: 8, unit: 'Bottles', status: 'Healthy', threshold: 10 },
];

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
                                    type="text" placeholder="e.g. Ultra Foam Shampoo"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={`w-full h-11 bg-background border ${errors.name ? 'border-red-400' : 'border-gray-100/10'} rounded-xl px-4 text-[12px] font-bold outline-none focus:border-brand transition-all text-content`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Category</label>
                                    <select
                                        value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full h-11 bg-background border border-gray-100/10 rounded-xl px-4 text-[12px] font-bold outline-none cursor-pointer text-content"
                                    >
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Unit Type</label>
                                    <select
                                        value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                                        className="w-full h-11 bg-background border border-gray-100/10 rounded-xl px-4 text-[12px] font-bold outline-none cursor-pointer text-content"
                                    >
                                        {UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest focus:text-brand">Initial Stock</label>
                                    <input
                                        type="number" placeholder="0"
                                        value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                                        className={`w-full h-11 bg-background border ${errors.stock ? 'border-red-400' : 'border-gray-100/10'} rounded-xl px-4 text-[12px] font-bold outline-none text-content`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Warning Point</label>
                                    <input
                                        type="number" placeholder="5"
                                        value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })}
                                        className={`w-full h-11 bg-background border ${errors.threshold ? 'border-red-400' : 'border-gray-100/10'} rounded-xl px-4 text-[12px] font-bold outline-none text-content`}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <p className="text-[9px] font-bold text-content-subtle leading-relaxed italic">
                                    * Warning point will trigger a "Low Stock" alert when inventory falls below this number.
                                </p>
                            </div>
                        </form>

                        <div className="p-6 border-t border-gray-100/10 flex gap-3">
                            <button onClick={onClose} className="flex-1 h-11 border border-gray-100/10 rounded-xl text-[10px] font-black uppercase text-content-subtle hover:bg-background transition-all">Cancel</button>
                            <button onClick={handleSubmit} className="flex-[2] h-11 bg-brand text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-brand/20">
                                {initial ? 'Update Supply' : 'Add Supply Item'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Main Inventory Component ───────────────────────────────────────────────────
const VendorInventory = () => {
    const { getUser, updateUser } = useAuth();
    const vendor = getUser('vendor') || {};
    const inventory = vendor.inventory || INITIAL_INVENTORY;

    const [activeTab, setActiveTab] = useState('All Items');
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── CRUD Handlers ──
    const handleSave = (item) => {
        let updatedInventory;
        if (editTarget) {
            updatedInventory = inventory.map(p => p.id === item.id ? item : p);
            showToast('Supply updated successfully');
        } else {
            updatedInventory = [item, ...inventory];
            showToast('New supply logged');
        }
        updateUser('vendor', vendor.id, { inventory: updatedInventory });
        setDrawerOpen(false);
        setEditTarget(null);
    };

    const handleRefill = (id) => {
        const updatedInventory = inventory.map(p => p.id === id ? {
            ...p,
            stock: p.stock + 10,
            status: 'Healthy'
        } : p);
        updateUser('vendor', vendor.id, { inventory: updatedInventory });
        showToast('Inventory Refilled +10');
    };

    const handleDelete = (id) => {
        const updatedInventory = inventory.filter(p => p.id !== id);
        updateUser('vendor', vendor.id, { inventory: updatedInventory });
        showToast('Supply removed from inventory', 'error');
    };

    const filtered = inventory.filter(p =>
        (activeTab === 'All Items' || p.category === activeTab) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Inventory Items', val: inventory.length, icon: Package, color: 'text-blue-500' },
        { label: 'Low Alert', val: inventory.filter(i => i.stock > 0 && i.stock < i.threshold).length, icon: AlertTriangle, color: 'text-amber-500' },
        { label: 'Stock Value', val: `₹${(inventory.length * 1500).toLocaleString()}`, icon: BarChart3, color: 'text-green-500' },
    ];

    return (
        <VendorLayout title="Supplies & Inventory" subtitle="Track Studio Resources">

            <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

            <SupplyDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
                initial={editTarget}
                onSave={handleSave}
            />

            <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map(s => (
                        <div key={s.label} className="bg-surface p-6 rounded-[2.5rem] border border-gray-100/10 shadow-soft flex items-center justify-between group overflow-hidden relative">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.2em] mb-1.5 italic font-bold">{s.label}</p>
                                <h2 className={`text-2xl font-black ${s.color} tracking-tighter italic`}>{s.val}</h2>
                            </div>
                            <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-content-muted group-hover:bg-brand/5 group-hover:text-brand transition-all relative z-10 border border-gray-100/10">
                                <s.icon size={22} />
                            </div>
                            <div className={`absolute -right-2 -bottom-2 w-16 h-16 ${s.color.replace('text-', 'bg-')} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-3xl border border-gray-100/10 shadow-soft">
                    <div className="flex gap-1.5 bg-background p-1.5 rounded-2xl w-full md:w-auto border border-gray-100/10">
                        {['All Items', 'Cleaning', 'Tools', 'Detailing'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" size={14} />
                            <input
                                type="text" placeholder="Search stock..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-background border border-gray-100/10 rounded-2xl pl-10 pr-4 text-[11px] font-bold text-content outline-none focus:ring-2 ring-brand/20 transition-all font-bold italic"
                            />
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
                            className="h-11 px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} /> Add
                        </motion.button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-surface p-7 rounded-[3rem] border border-gray-100/10 shadow-soft space-y-6 relative overflow-hidden group hover:border-brand/20 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em] italic">{item.category}</span>
                                        <span className="text-[8px] font-bold text-content-subtle tracking-widest uppercase opacity-40">{item.id}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-content tracking-tight">{item.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditTarget(item); setDrawerOpen(true); }} className="p-2.5 rounded-xl bg-background text-content-muted hover:bg-brand/10 hover:text-brand transition-all border border-gray-100/10"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-xl bg-background text-content-muted hover:bg-red-500/10 hover:text-red-500 transition-all border border-gray-100/10"><Trash2 size={13} /></button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] italic opacity-50">Usage Tracking</p>
                                    <p className="text-3xl font-black italic tracking-tighter text-content">
                                        {item.stock} <span className="text-[10px] text-content-subtle uppercase tracking-widest font-black leading-none italic">{item.unit}</span>
                                    </p>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRefill(item.id)}
                                    className="h-11 px-5 bg-content text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-content/20"
                                >
                                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Refill
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest italic">
                                    <span className="text-content-subtle opacity-60">Inventory Health</span>
                                    <span className={item.stock === 0 ? 'text-red-500' : item.stock < item.threshold ? 'text-amber-500' : 'text-green-500'}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-background rounded-full overflow-hidden p-[1px] border border-gray-100/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((item.stock / 50) * 100, 100)}%` }}
                                        className={`h-full rounded-full ${item.stock === 0 ? 'bg-red-500' : item.stock < item.threshold ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}
                                    />
                                </div>
                            </div>

                            <div className={`absolute -right-4 -bottom-4 w-28 h-28 bg-brand opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none`} />
                        </motion.div>
                    ))}
                </div>

                {/* Consumer Insights */}
                <div className="bg-[#0f1117] rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="space-y-4 max-w-md">
                            <div className="w-12 h-12 bg-brand/20 border border-brand/30 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="text-brand" size={24} />
                            </div>
                            <h2 className="text-4xl font-black italic tracking-tighter leading-none">Smart Supply<br />Analytics</h2>
                            <p className="text-[13px] font-bold text-white/40 leading-relaxed italic">Soap consumption is up by 12% this week. We recommend scheduling a bulk refill by Monday to avoid peak hour shortages.</p>
                            <button className="flex items-center gap-2 text-brand text-[11px] font-black uppercase tracking-widest border-b-2 border-brand/30 pb-1 mt-2">
                                Export Full Report <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <div className="flex-1 w-full lg:w-auto grid grid-cols-7 items-end gap-3 h-48 px-4">
                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                <div key={i} className="group relative flex-1">
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.1, duration: 1 }}
                                        className="bg-brand/20 hover:bg-brand rounded-t-xl transition-all relative overflow-hidden group cursor-pointer"
                                    >
                                        <motion.div
                                            initial={{ y: '100%' }} animate={{ y: '0%' }}
                                            transition={{ delay: i * 0.15, duration: 1 }}
                                            className="absolute inset-0 bg-brand/30"
                                        />
                                    </motion.div>
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                        Day {i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorInventory;
