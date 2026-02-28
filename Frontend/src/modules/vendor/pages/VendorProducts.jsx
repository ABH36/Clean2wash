import React, { useState, useMemo } from 'react';
import {
    ShoppingBag, Search, Plus, Trash2, Edit2,
    X, Check, Package, Grid, List as ListIcon,
    Tag, DollarSign, AlertTriangle, ImageIcon,
    Star, ChevronDown, Zap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';
import { useAuth } from '../../../context/AuthContext';

// ─── Initial seed data ───────────────────────────────────────────────────────
const SEED = [
    {
        id: 'P001', name: 'CarWash 2-in-1 Adaptive Adapter', category: 'Electronics',
        price: 4999, salePrice: 3499, stock: 25, rating: 4.8, badge: 'Bestseller',
        description: 'Universal adaptive connector for all modern car audio systems.',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80', status: 'Active'
    },
    {
        id: 'P002', name: 'CarWash 3D Carbon Fiber Tape', category: 'Accessories',
        price: 899, salePrice: 599, stock: 142, rating: 4.5, badge: 'Popular',
        description: 'Premium 3D carbon fibre wrap tape for car interior & exterior.',
        image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400&q=80', status: 'Active'
    },
    {
        id: 'P003', name: 'CarWash Wet & Dry Vacuum', category: 'Cleaning',
        price: 7999, salePrice: 5499, stock: 12, rating: 4.9, badge: 'Top Rated',
        description: 'Powerful handheld vacuum with dual wet & dry suction modes.',
        image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80', status: 'Low Stock'
    },
    {
        id: 'P004', name: 'Premium Car Wash Kit', category: 'Cleaning',
        price: 2499, salePrice: 1999, stock: 85, rating: 4.7, badge: '',
        description: 'All-in-one car wash kit with shampoo, wax, and microfiber towels.',
        image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80', status: 'Active'
    },
    {
        id: 'P005', name: 'CarWash Smart GPS Tracker', category: 'Electronics',
        price: 3999, salePrice: 2499, stock: 0, rating: 4.6, badge: 'New',
        description: 'Real-time GPS vehicle tracker with geofencing & mobile alerts.',
        image: 'https://images.unsplash.com/photo-1580672154843-44f2221d41b1?w=400&q=80', status: 'Out of Stock'
    },
    {
        id: 'P006', name: 'Clean2Wash Ultra Foam Shampoo', category: 'Cleaning',
        price: 999, salePrice: 799, stock: 50, rating: 5.0, badge: 'Own Brand',
        isPriority: true, isOwnBrand: true,
        description: 'Professional grade high-foaming car shampoo designed specifically for our captains.',
        image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80', status: 'Active'
    },
];

const CATEGORIES = ['Electronics', 'Accessories', 'Cleaning', 'Enhancement'];
const BADGES = ['', 'Bestseller', 'Top Rated', 'Popular', 'New', 'Sale'];

const emptyForm = {
    name: '', category: 'Electronics', price: '', salePrice: '',
    stock: '', rating: '4.5', badge: '', description: '', image: '',
    video: '', specifications: [{ key: '', value: '' }],
    isPriority: false, isOwnBrand: false, status: 'Pending'
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
    <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-[12px] font-black
            ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
    >
        {type === 'success' ? <Check size={15} strokeWidth={3} /> : <AlertTriangle size={15} />}
        {msg}
    </motion.div>
);

// ─── Product Drawer (Add / Edit) ──────────────────────────────────────────────
const ProductDrawer = ({ open, onClose, initial, onSave }) => {
    const [form, setForm] = useState(initial || emptyForm);
    const [errors, setErrors] = useState({});
    const [imgError, setImgError] = useState(false);

    // Reset form whenever drawer opens
    React.useEffect(() => {
        if (open) { setForm(initial || emptyForm); setErrors({}); setImgError(false); }
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Product name is required';
        if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter a valid MRP';
        if (!form.salePrice || isNaN(form.salePrice) || Number(form.salePrice) <= 0) e.salePrice = 'Enter a valid sale price';
        if (Number(form.salePrice) >= Number(form.price)) e.salePrice = 'Sale price must be less than MRP';
        if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0) e.stock = 'Enter valid stock quantity';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        // Keep existing status if editing, or set to 'Pending' if new/re-verify
        const newStatus = isEdit ? (initial.status === 'Approved' ? 'Approved' : 'Pending') : 'Pending';
        onSave({
            ...form,
            price: Number(form.price),
            salePrice: Number(form.salePrice),
            stock: Number(form.stock),
            rating: Number(form.rating),
            status: newStatus
        });
    };

    const isEdit = !!initial?.id;

    const Field = ({ label, error, children }) => (
        <div>
            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-1.5">{label}</p>
            {children}
            {error && <p className="text-[10px] text-red-500 font-bold mt-1">{error}</p>}
        </div>
    );

    const inputCls = (err) =>
        `w-full h-10 bg-background border rounded-xl px-3 text-[12px] font-bold text-content outline-none transition-all focus:border-brand/50 ${err ? 'border-red-300' : 'border-gray-100/10'}`;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer panel */}
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                        className="fixed right-0 top-0 h-full z-[210] bg-surface shadow-2xl flex flex-col border-l border-gray-100/10"
                        style={{ width: 420 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/10">
                            <div>
                                <h2 className="text-base font-black text-content tracking-tight">
                                    {isEdit ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">
                                    {isEdit ? `Editing: ${initial?.id}` : 'Fill in the product details below'}
                                </p>
                            </div>
                            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-background border border-gray-100/10 flex items-center justify-center text-content-muted hover:text-brand transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: 'none' }}>

                            {/* Image preview */}
                            <div className="relative h-44 bg-background border border-gray-100/10 rounded-2xl overflow-hidden flex items-center justify-center">
                                {form.image && !imgError ? (
                                    <img
                                        src={form.image} alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-content-subtle">
                                        <ImageIcon size={28} strokeWidth={1.5} />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Image Preview</p>
                                    </div>
                                )}
                            </div>

                            {/* Image URL */}
                            <Field label="Image URL" error={null}>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={form.image}
                                    onChange={e => { set('image', e.target.value); setImgError(false); }}
                                    className={inputCls(false)}
                                />
                            </Field>

                            {/* Name */}
                            <Field label="Product Name *" error={errors.name}>
                                <input
                                    type="text"
                                    placeholder="e.g. CarWash Premium Wax Kit"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    className={inputCls(errors.name)}
                                />
                            </Field>

                            {/* Description */}
                            <Field label="Description" error={null}>
                                <textarea
                                    placeholder="Detailed product description..."
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={4}
                                    className="w-full bg-background border border-gray-100/10 rounded-xl px-3 py-2.5 text-[12px] font-bold text-content outline-none transition-all focus:border-brand/50 resize-none"
                                />
                            </Field>

                            {/* Video URL */}
                            <Field label="Video URL (Optional)" error={null}>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/..."
                                    value={form.video}
                                    onChange={e => set('video', e.target.value)}
                                    className={inputCls(false)}
                                />
                            </Field>

                            {/* Specifications */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Specifications</p>
                                    <button
                                        onClick={() => set('specifications', [...(form.specifications || []), { key: '', value: '' }])}
                                        className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add Row
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(form.specifications || []).map((spec, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                placeholder="Key (e.g. Color)"
                                                value={spec.key}
                                                onChange={e => {
                                                    const newSpecs = [...form.specifications];
                                                    newSpecs[i].key = e.target.value;
                                                    set('specifications', newSpecs);
                                                }}
                                                className="flex-1 h-9 bg-background border border-gray-100/10 rounded-lg px-2 text-[10px] font-bold text-content outline-none focus:border-brand/40"
                                            />
                                            <input
                                                placeholder="Value (e.g. Matte Black)"
                                                value={spec.value}
                                                onChange={e => {
                                                    const newSpecs = [...form.specifications];
                                                    newSpecs[i].value = e.target.value;
                                                    set('specifications', newSpecs);
                                                }}
                                                className="flex-1 h-9 bg-background border border-gray-100/10 rounded-lg px-2 text-[10px] font-bold text-content outline-none focus:border-brand/40"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newSpecs = form.specifications.filter((_, idx) => idx !== i);
                                                    set('specifications', newSpecs);
                                                }}
                                                className="p-2 text-content-muted hover:text-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category + Badge */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Category *" error={null}>
                                    <div className="relative">
                                        <select
                                            value={form.category}
                                            onChange={e => set('category', e.target.value)}
                                            className={`${inputCls(false)} appearance-none pr-8 cursor-pointer`}
                                        >
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
                                    </div>
                                </Field>
                                <Field label="Badge" error={null}>
                                    <div className="relative">
                                        <select
                                            value={form.badge}
                                            onChange={e => set('badge', e.target.value)}
                                            className={`${inputCls(false)} appearance-none pr-8 cursor-pointer`}
                                        >
                                            {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                                        </select>
                                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
                                    </div>
                                </Field>
                            </div>

                            {/* MRP + Sale Price */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="MRP (₹) *" error={errors.price}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-content-muted">₹</span>
                                        <input
                                            type="number" min="0"
                                            placeholder="4999"
                                            value={form.price}
                                            onChange={e => set('price', e.target.value)}
                                            className={`${inputCls(errors.price)} pl-7`}
                                        />
                                    </div>
                                </Field>
                                <Field label="Sale Price (₹) *" error={errors.salePrice}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-content-muted">₹</span>
                                        <input
                                            type="number" min="0"
                                            placeholder="3499"
                                            value={form.salePrice}
                                            onChange={e => set('salePrice', e.target.value)}
                                            className={`${inputCls(errors.salePrice)} pl-7`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Discount preview */}
                            {form.price && form.salePrice && Number(form.salePrice) < Number(form.price) && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <Check size={13} className="text-green-500" strokeWidth={3} />
                                    <p className="text-[11px] font-black text-green-500">
                                        {Math.round(((form.price - form.salePrice) / form.price) * 100)}% discount applied
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Stock Qty *" error={errors.stock}>
                                    <input
                                        type="number" min="0"
                                        placeholder="25"
                                        value={form.stock}
                                        onChange={e => set('stock', e.target.value)}
                                        className={inputCls(errors.stock)}
                                    />
                                </Field>
                                <Field label="Rating (0–5)" error={null}>
                                    <div className="relative">
                                        <Star size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" fill="currentColor" />
                                        <input
                                            type="number" min="0" max="5" step="0.1"
                                            placeholder="4.5"
                                            value={form.rating}
                                            onChange={e => set('rating', e.target.value)}
                                            className={`${inputCls(false)} pl-8`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Priority & Own Brand */}
                            <div className="grid grid-cols-2 gap-3 p-4 bg-background border border-gray-100/10 rounded-2xl">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isPriority}
                                        onChange={e => set('isPriority', e.target.checked)}
                                        className="w-4 h-4 accent-brand rounded"
                                    />
                                    <div>
                                        <p className="text-[10px] font-black text-content uppercase tracking-tight">Priority</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase">Top of search</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isOwnBrand}
                                        onChange={e => set('isOwnBrand', e.target.checked)}
                                        className="w-4 h-4 accent-brand rounded"
                                    />
                                    <div>
                                        <p className="text-[10px] font-black text-content uppercase tracking-tight">Own Brand</p>
                                        <p className="text-[7px] font-bold text-content-subtle uppercase">High-Margin</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100/10 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 h-11 border border-gray-100/10 rounded-xl text-[11px] font-black text-content-muted tracking-widest uppercase hover:bg-background transition-all"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                className="flex-[2] h-11 bg-brand text-white rounded-xl text-[11px] font-black tracking-widest uppercase shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                            >
                                <Check size={15} strokeWidth={3} />
                                {isEdit ? 'Save Changes' : 'Add Product'}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Delete Confirm inline ────────────────────────────────────────────────────
const DeleteConfirm = ({ onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-0 bg-surface/95 backdrop-blur-sm rounded-[2.5rem] z-10 flex flex-col items-center justify-center gap-3 p-6"
    >
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-500" />
        </div>
        <p className="text-sm font-black text-content text-center">Delete product?</p>
        <p className="text-[10px] font-bold text-content-subtle text-center">This action cannot be undone.</p>
        <div className="flex gap-2 w-full mt-1">
            <button onClick={onCancel} className="flex-1 py-2 border border-gray-100/10 rounded-xl text-[10px] font-black text-content-muted uppercase tracking-widest hover:bg-background transition-all">Keep</button>
            <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Delete</button>
        </div>
    </motion.div>
);

// ─── Grid Card ────────────────────────────────────────────────────────────────
const ProductCard = ({ p, onEdit, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <motion.div
            layout
            className="bg-surface group rounded-[2.5rem] border border-gray-100/10 shadow-soft overflow-hidden flex flex-col hover:border-brand/20 transition-all relative"
        >
            <AnimatePresence>
                {confirmDelete && (
                    <DeleteConfirm
                        onConfirm={() => onDelete(p.id)}
                        onCancel={() => setConfirmDelete(false)}
                    />
                )}
            </AnimatePresence>

            <div className="relative h-48 overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(p)}
                        className="p-2 bg-surface/90 backdrop-blur-md border border-gray-100/10 rounded-xl text-content-muted hover:text-brand shadow-sm transition-colors"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="p-2 bg-surface/90 backdrop-blur-md border border-gray-100/10 rounded-xl text-content-muted hover:text-red-500 shadow-sm transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
                {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">Out of Stock</span>
                    </div>
                )}
                {p.status && (
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <span className={`backdrop-blur-sm text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border shadow-lg
                            ${p.status === 'Approved' ? 'bg-green-500 text-white border-green-400' :
                                p.status === 'Rejected' ? 'bg-red-500 text-white border-red-400' :
                                    'bg-amber-500 text-white border-amber-400'}`}>
                            {p.status === 'Approved' ? <Check size={8} className="inline mr-1" strokeWidth={4} /> :
                                p.status === 'Rejected' ? <X size={8} className="inline mr-1" strokeWidth={4} /> :
                                    <Zap size={8} className="inline mr-1" fill="white" />}
                            {p.status === 'Approved' ? 'Verified' : p.status === 'Rejected' ? 'Rejected' : 'Pending Verification'}
                        </span>
                    </div>
                )}
                {p.badge && !p.status && (
                    <div className="absolute top-3 left-3">
                        <span className="bg-surface/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-wider text-content px-2 py-1 rounded-lg border border-gray-100/10">
                            {p.badge}
                        </span>
                    </div>
                )}
                {p.isPriority && (
                    <div className="absolute top-12 left-3">
                        <span className="bg-brand text-white text-[7px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg flex items-center gap-1">
                            <Zap size={8} fill="currentColor" /> Priority
                        </span>
                    </div>
                )}
                {p.isOwnBrand && (
                    <div className="absolute top-20 left-3">
                        <span className="bg-emerald-500 text-white text-[7px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg flex items-center gap-1">
                            <Award size={8} fill="currentColor" /> Exclusive
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">{p.category}</span>
                        <h4 className="text-[13px] font-black text-content tracking-tight mt-0.5 group-hover:text-brand transition-colors line-clamp-1">{p.name}</h4>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                        <Star size={9} className="text-yellow-500" fill="currentColor" />
                        <span className="text-[10px] font-black text-yellow-700">{p.rating}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100/10 font-black italic">
                    <div className="flex-1">
                        <p className="text-[9px] text-content-subtle uppercase tracking-widest leading-none mb-1">Stock</p>
                        <p className={`text-lg transition-colors ${p.stock < 10 ? 'text-amber-500' : 'text-content'}`}>
                            {p.stock} <span className="text-[10px] uppercase font-black not-italic opacity-40">units</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-content-subtle uppercase tracking-widest leading-none mb-1">Price</p>
                        <p className="text-lg text-brand tracking-tighter">
                            ₹{p.salePrice.toLocaleString()}
                            <span className="text-[10px] text-content-subtle line-through ml-1.5 opacity-50 not-italic">₹{p.price.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div >
    );
};

// ─── List Row ─────────────────────────────────────────────────────────────────
const ProductRow = ({ p, onEdit, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <motion.div layout className="bg-surface p-4 rounded-3xl border border-gray-100/10 shadow-soft flex items-center gap-6 group hover:border-brand/20 transition-all">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-background border border-gray-100/10 flex-shrink-0">
                <img src={p.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                <span className="text-[8px] font-black text-brand uppercase tracking-widest italic leading-none mb-1 block">{p.category}</span>
                <h4 className="text-sm font-black text-content tracking-tight">{p.name}</h4>
            </div>
            <div className="w-32">
                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest italic mb-0.5 leading-none">Price</p>
                <p className="text-base font-black italic tracking-tighter text-content">₹{p.salePrice}</p>
            </div>
            <div className="w-32">
                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest italic mb-0.5 leading-none">Status</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${p.stock > 10 ? 'text-green-500' : p.stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                    {p.stock > 10 ? 'In Stock' : p.stock > 0 ? `Low (${p.stock})` : 'Sold Out'}
                </span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onEdit(p)} className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted hover:text-brand transition-all font-bold">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted hover:text-red-500 transition-all font-bold">
                    <Trash2 size={16} />
                </button>
            </div>
            <AnimatePresence>
                {confirmDelete && (
                    <DeleteConfirm
                        onConfirm={() => onDelete(p.id)}
                        onCancel={() => setConfirmDelete(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const VendorProducts = () => {
    const { getUser, updateUser } = useAuth();
    const vendor = getUser('vendor') || {};
    const products = vendor.products || SEED;

    const [viewMode, setViewMode] = useState('grid');
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add mode
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2800);
    };

    // ── CRUD ──
    const handleSave = (data) => {
        let updatedProducts;
        if (editTarget) {
            // Edit
            updatedProducts = products.map(p => p.id === editTarget.id ? { ...data, id: editTarget.id } : p);
            showToast('Product updated successfully');
        } else {
            // Add — generate new ID
            const newId = `P${String(products.length + 1).padStart(3, '0')}`;
            updatedProducts = [{ ...data, id: newId }, ...products];
            showToast('Product added successfully');
        }
        updateUser('vendor', vendor.id, { products: updatedProducts });
        setDrawerOpen(false);
        setEditTarget(null);
    };

    const handleDelete = (id) => {
        const updatedProducts = products.filter(p => p.id !== id);
        updateUser('vendor', vendor.id, { products: updatedProducts });
        showToast('Product deleted', 'error');
    };

    const filtered = useMemo(() => {
        return products.filter(p =>
            (activeTab === 'All' || p.category === activeTab) &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, activeTab, searchQuery]);

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;
    const totalRevenue = products.reduce((s, p) => s + p.salePrice * Math.max(p.stock, 0), 0);

    return (
        <VendorLayout title="Tactical Shop" subtitle="Manage your studio inventory & products">

            {/* Drawer */}
            <ProductDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
                initial={editTarget}
                onSave={handleSave}
            />

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast msg={toast.msg} type={toast.type} />}
            </AnimatePresence>

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Stock', val: products.length, icon: ShoppingBag, color: 'text-blue-500' },
                        { label: 'Low Alert', val: String(lowStock).padStart(2, '0'), icon: Package, color: 'text-amber-500' },
                        { label: 'Out of Registry', val: String(outOfStock).padStart(2, '0'), icon: Trash2, color: 'text-red-500' },
                        { label: 'Total Value', val: `₹${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-green-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface p-5 rounded-3xl border border-gray-100/10 shadow-soft flex items-center justify-between transition-all hover:scale-105">
                            <div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mb-2 font-bold">{s.label}</p>
                                <h3 className={`text-xl font-black ${s.color}`}>{s.val}</h3>
                            </div>
                            <div className="w-10 h-10 bg-background border border-gray-100/10 rounded-xl flex items-center justify-center text-content-muted">
                                <s.icon size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-3xl border border-gray-100/10 shadow-soft">
                    <div className="flex gap-2 bg-background p-1 rounded-2xl border border-gray-100/10 overflow-x-auto max-w-full no-scrollbar">
                        {['All', ...CATEGORIES].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-surface text-brand shadow-sm' : 'text-content-subtle hover:text-content'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" size={14} />
                            <input
                                type="text" placeholder="Search weapons..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 bg-background border border-gray-100/10 rounded-xl pl-10 pr-4 text-[11px] font-black text-content outline-none focus:ring-2 ring-brand/20 transition-all font-bold italic"
                            />
                        </div>
                        <div className="flex bg-background border border-gray-100/10 p-1 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface text-brand shadow-sm' : 'text-content-muted'}`}>
                                <Grid size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface text-brand shadow-sm' : 'text-content-muted'}`}>
                                <ListIcon size={16} />
                            </button>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
                            className="h-10 px-5 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={15} strokeWidth={3} /> Add Product
                        </motion.button>
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="bg-surface rounded-3xl border border-dashed border-gray-100/20 p-20 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-gray-100/10">
                            <Package size={32} className="text-content-subtle/20" />
                        </div>
                        <h3 className="text-base font-black text-content italic uppercase tracking-tighter">No items found</h3>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Adjust filters or add a new package to the shop</p>
                    </div>
                )}

                {/* Products */}
                <AnimatePresence mode="popLayout">
                    {filtered.length > 0 && viewMode === 'grid' ? (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map((p) => (
                                <ProductCard key={p.id} p={p}
                                    onEdit={() => { setEditTarget(p); setDrawerOpen(true); }} onDelete={() => handleDelete(p.id)} />
                            ))}
                        </motion.div>
                    ) : filtered.length > 0 ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="space-y-4">
                            {filtered.map(p => (
                                <ProductRow key={p.id} p={p}
                                    onEdit={() => { setEditTarget(p); setDrawerOpen(true); }} onDelete={() => handleDelete(p.id)} />
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </VendorLayout>
    );
};

export default VendorProducts;
