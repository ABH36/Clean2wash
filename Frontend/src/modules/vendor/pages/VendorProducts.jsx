import React, { useState, useRef } from 'react';
import {
    ShoppingBag, Search, Plus, Trash2, Edit2,
    X, Check, Package, Grid, List as ListIcon,
    Tag, DollarSign, AlertTriangle, ImageIcon,
    Star, ChevronDown, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorLayout from '../components/VendorLayout';

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
];

const CATEGORIES = ['Electronics', 'Accessories', 'Cleaning'];
const BADGES = ['', 'Bestseller', 'Top Rated', 'Popular', 'New', 'Sale'];

const emptyForm = {
    name: '', category: 'Electronics', price: '', salePrice: '',
    stock: '', rating: '4.5', badge: '', description: '', image: ''
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
        const status = Number(form.stock) === 0 ? 'Out of Stock' : Number(form.stock) < 10 ? 'Low Stock' : 'Active';
        onSave({ ...form, price: Number(form.price), salePrice: Number(form.salePrice), stock: Number(form.stock), rating: Number(form.rating), status });
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
        `w-full h-10 bg-gray-50 border rounded-xl px-3 text-[12px] font-bold text-content outline-none transition-all focus:border-brand/50 focus:bg-white ${err ? 'border-red-300' : 'border-gray-200'}`;

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
                        className="fixed right-0 top-0 h-full z-[210] bg-white shadow-2xl flex flex-col"
                        style={{ width: 420 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-black text-content tracking-tight">
                                    {isEdit ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">
                                    {isEdit ? `Editing: ${initial?.id}` : 'Fill in the product details below'}
                                </p>
                            </div>
                            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-content-muted hover:bg-gray-100 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: 'none' }}>

                            {/* Image preview */}
                            <div className="relative h-44 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
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
                                    placeholder="Short product description..."
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={2}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] font-bold text-content outline-none transition-all focus:border-brand/50 focus:bg-white resize-none"
                                />
                            </Field>

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
                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <Check size={13} className="text-green-600" strokeWidth={3} />
                                    <p className="text-[11px] font-black text-green-700">
                                        {Math.round(((form.price - form.salePrice) / form.price) * 100)}% discount applied
                                    </p>
                                </div>
                            )}

                            {/* Stock + Rating */}
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
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 h-11 border border-gray-200 rounded-xl text-[11px] font-black text-content-muted tracking-widest uppercase hover:bg-gray-50 transition-all"
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
        className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[2.5rem] z-10 flex flex-col items-center justify-center gap-3 p-6"
    >
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-500" />
        </div>
        <p className="text-sm font-black text-content text-center">Delete product?</p>
        <p className="text-[10px] font-bold text-content-subtle text-center">This action cannot be undone.</p>
        <div className="flex gap-2 w-full mt-1">
            <button onClick={onCancel} className="flex-1 py-2 border border-gray-200 rounded-xl text-[10px] font-black text-content-muted uppercase tracking-widest">Keep</button>
            <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Delete</button>
        </div>
    </motion.div>
);

// ─── Grid Card ────────────────────────────────────────────────────────────────
const ProductGridCard = ({ product, index, onEdit, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white group rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden flex flex-col hover:border-brand/20 transition-all relative"
        >
            <AnimatePresence>
                {confirmDelete && (
                    <DeleteConfirm
                        onConfirm={() => onDelete(product.id)}
                        onCancel={() => setConfirmDelete(false)}
                    />
                )}
            </AnimatePresence>

            <div className="relative h-48 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-content-muted hover:text-brand shadow-sm transition-colors"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-content-muted hover:text-red-500 shadow-sm transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">Out of Stock</span>
                    </div>
                )}
                {product.badge && (
                    <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-wider text-content px-2 py-1 rounded-lg border border-gray-200">
                            {product.badge}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">{product.category}</span>
                        <h4 className="text-[13px] font-black text-content tracking-tight mt-0.5 group-hover:text-brand transition-colors line-clamp-1">{product.name}</h4>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                        <Star size={9} className="text-yellow-500" fill="currentColor" />
                        <span className="text-[10px] font-black text-yellow-700">{product.rating}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50 font-black italic">
                    <div className="flex-1">
                        <p className="text-[9px] text-content-subtle uppercase tracking-widest leading-none mb-1">Stock</p>
                        <p className={`text-lg transition-colors ${product.stock < 10 ? 'text-amber-500' : 'text-content'}`}>
                            {product.stock} <span className="text-[10px] uppercase font-black not-italic opacity-40">units</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-content-subtle uppercase tracking-widest leading-none mb-1">Price</p>
                        <p className="text-lg text-brand tracking-tighter">
                            ₹{product.salePrice.toLocaleString()}
                            <span className="text-[10px] text-content-subtle line-through ml-1.5 opacity-50 not-italic">₹{product.price.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── List Row ─────────────────────────────────────────────────────────────────
const ProductListRow = ({ product, onEdit, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <tr className="group hover:bg-gray-50 transition-colors relative">
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-content tracking-tight group-hover:text-brand transition-colors">{product.name}</p>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{product.id}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-content-muted text-[10px] font-black uppercase tracking-widest">
                    {product.category}
                </span>
            </td>
            <td className="px-6 py-4">
                <p className={`text-sm font-black italic tracking-tighter ${product.stock < 10 ? 'text-amber-500' : 'text-content'}`}>
                    {product.stock} Units
                </p>
                <div className="w-20 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${product.stock < 10 ? 'bg-amber-500' : 'bg-brand'}`}
                        style={{ width: `${Math.min(product.stock, 100)}%` }}
                    />
                </div>
            </td>
            <td className="px-6 py-4">
                <p className="text-sm font-black italic text-brand tracking-tight">₹{product.salePrice.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-content-subtle line-through opacity-50">₹{product.price.toLocaleString()}</p>
            </td>
            <td className="px-6 py-4 text-right">
                {confirmDelete ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-red-500 mr-1">Delete?</span>
                        <button onClick={() => onDelete(product.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase">Yes</button>
                        <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black text-content-muted uppercase">No</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => onEdit(product)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-content-subtle hover:text-brand hover:border-brand/20 transition-all"
                        >
                            <Edit2 size={13} />
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-content-subtle hover:text-red-500 hover:border-red-200 transition-all"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const VendorProducts = () => {
    const [products, setProducts] = useState(SEED);
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
        if (editTarget) {
            // Edit
            setProducts(ps => ps.map(p => p.id === editTarget.id ? { ...data, id: editTarget.id } : p));
            showToast('Product updated successfully');
        } else {
            // Add — generate new ID
            const newId = `P${String(products.length + 1).padStart(3, '0')}`;
            setProducts(ps => [{ ...data, id: newId }, ...ps]);
            showToast('Product added successfully');
        }
        setDrawerOpen(false);
        setEditTarget(null);
    };

    const handleEdit = (product) => {
        setEditTarget(product);
        setDrawerOpen(true);
    };

    const handleAdd = () => {
        setEditTarget(null);
        setDrawerOpen(true);
    };

    const handleDelete = (id) => {
        setProducts(ps => ps.filter(p => p.id !== id));
        showToast('Product deleted', 'error');
    };

    const filtered = products.filter(p =>
        (activeTab === 'All' || p.category === activeTab) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;
    const totalRevenue = products.reduce((s, p) => s + p.salePrice * Math.max(p.stock, 1), 0);

    return (
        <VendorLayout title="Product Management" subtitle="Manage your shop items & accessories">

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
                        { label: 'Total Products', val: products.length, icon: ShoppingBag, color: 'text-blue-500' },
                        { label: 'Low Stock', val: String(lowStock).padStart(2, '0'), icon: Package, color: 'text-amber-500' },
                        { label: 'Out of Stock', val: String(outOfStock).padStart(2, '0'), icon: Trash2, color: 'text-red-500' },
                        { label: 'Catalogue Value', val: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: 'text-green-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{s.label}</p>
                                <h3 className={`text-xl font-black ${s.color} mt-1`}>{s.val}</h3>
                            </div>
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted">
                                <s.icon size={18} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-soft">
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl">
                        {['All', 'Electronics', 'Accessories', 'Cleaning'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-brand shadow-sm' : 'text-content-muted hover:text-content'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" size={14} />
                            <input
                                type="text" placeholder="Search products..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 bg-gray-50 border-none rounded-xl pl-10 pr-4 text-[11px] font-bold text-content outline-none focus:ring-2 ring-brand/20 transition-all"
                            />
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                                <Grid size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}>
                                <ListIcon size={16} />
                            </button>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAdd}
                            className="h-10 px-5 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={15} strokeWidth={3} /> Add Product
                        </motion.button>
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-16 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                            <Package size={28} className="text-content-muted" />
                        </div>
                        <p className="text-base font-black text-content">No products found</p>
                        <p className="text-[11px] font-bold text-content-subtle">Try a different filter or add a new product</p>
                        <button onClick={handleAdd} className="mt-2 h-10 px-6 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Plus size={14} /> Add Product
                        </button>
                    </div>
                )}

                {/* Products */}
                <AnimatePresence mode="wait">
                    {filtered.length > 0 && viewMode === 'grid' ? (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map((p, i) => (
                                <ProductGridCard key={p.id} product={p} index={i}
                                    onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                        </motion.div>
                    ) : filtered.length > 0 ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-content-subtle uppercase tracking-widest">
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(p => (
                                        <ProductListRow key={p.id} product={p}
                                            onEdit={handleEdit} onDelete={handleDelete} />
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </VendorLayout>
    );
};

export default VendorProducts;
