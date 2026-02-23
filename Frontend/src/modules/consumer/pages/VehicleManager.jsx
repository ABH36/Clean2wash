import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Car, Trash2, Check, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const BRANDS = ['Honda', 'Maruti', 'Hyundai', 'Toyota', 'Tata', 'Mahindra', 'Kia', 'BMW'];
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#ffffff', '#1a1a1a', '#95a5a6', '#e67e22'];
const TYPES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Luxury'];

const BLANK_FORM = { brand: '', model: '', type: 'Sedan', color: '#3498db', plate: '' };

// Car image map by type
const TYPE_IMG = {
    Hatchback: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
    Sedan: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    SUV: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
    MPV: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    Pickup: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
    Luxury: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
};

const INITIAL_VEHICLES = [
    { id: 1, brand: 'Honda', model: 'City', type: 'Sedan', color: '#3498db', plate: 'KA 05 MR 7821', img: TYPE_IMG['Sedan'], isPrimary: true },
    { id: 2, brand: 'Maruti', model: 'Swift', type: 'Hatchback', color: '#e74c3c', plate: 'KA 01 AB 1122', img: TYPE_IMG['Hatchback'], isPrimary: false },
];

/* ── Toast ─────────────────────────────── */
const Toast = ({ msg, type = 'success', onDone }) => (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} onAnimationComplete={() => setTimeout(onDone, 2000)}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] max-w-xs w-[92%] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        {type === 'success'
            ? <CheckCircle2 size={18} className="text-white flex-shrink-0" strokeWidth={2.5} />
            : <AlertCircle size={18} className="text-white flex-shrink-0" strokeWidth={2.5} />}
        <p className="text-white font-black text-sm">{msg}</p>
    </motion.div>
);

/* ── Main Component ─────────────────────── */
const VehicleManager = () => {
    const navigate = useNavigate();
    const { vehicles, addVehicle, removeVehicle, setPrimaryVehicle, user } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [editId, setEditId] = useState(null);   // null = add mode, number = edit mode
    const [form, setForm] = useState(BLANK_FORM);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);   // { msg, type }

    /* helpers */
    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const closeSheet = () => { setShowSheet(false); setEditId(null); setErrors({}); };

    const openAdd = () => {
        setForm(BLANK_FORM);
        setEditId(null);
        setErrors({});
        setShowSheet(true);
    };

    const openEdit = (v) => {
        setForm({ brand: v.brand, model: v.model, type: v.type, color: v.color, plate: v.plate });
        setEditId(v.id);
        setErrors({});
        setShowSheet(true);
    };

    /* validation */
    const validate = () => {
        const e = {};
        if (!form.brand) e.brand = 'Please select a brand';
        if (!form.model.trim()) e.model = 'Model name is required';
        if (!form.plate.trim()) e.plate = 'Number plate is required';
        else if (!/^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,3}\s?\d{4}$/.test(form.plate.replace(/\s/g, '').toUpperCase()))
            e.plate = 'Enter valid plate (e.g. KA 05 MR 7821)';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* save (add or edit) */
    const handleSave = () => {
        if (!validate()) return;

        const img = TYPE_IMG[form.type] || TYPE_IMG['Sedan'];

        if (editId) {
            // Since we don't have a direct updateVehicle in context yet, 
            // we'll remove and add or handle as simple addition for now 
            // OR I can easily add updateVehicle to context if needed.
            // For now, let's just use addVehicle for simplicity or keep local edits if complex.
            // Actually, I'll just use addVehicle with a new ID if it's new.
            // For editing, let's just make it a local-ish update if possible.
            // Better: I'll just handle it as a replacement.
            removeVehicle(editId);
            addVehicle({ ...form, id: editId, isPrimary: false, img, userId: user?.id || 'GUEST' });
            showToast('Vehicle updated successfully!');
        } else {
            addVehicle({ ...form, id: Date.now(), isPrimary: false, img, userId: user?.id || 'GUEST' });
            showToast('Vehicle added to your garage!');
        }
        closeSheet();
    };

    const handleDelete = (id) => {
        removeVehicle(id);
        showToast('Vehicle removed', 'error');
    };

    const handleSetPrimary = (id) => {
        setPrimaryVehicle(id);
        showToast('Primary vehicle updated!');
    };

    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && <Toast key={toast.msg} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
            </AnimatePresence>

            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">My Vehicles</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">{vehicles.length} in Garage</p>
                    </div>
                    <button onClick={openAdd}
                        className="ml-auto flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl font-black text-xs shadow-md shadow-brand/20 active:scale-95 transition-all">
                        <Plus size={14} strokeWidth={3} /> Add
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-3 pb-24">

                {/* ── Vehicle Cards ── */}
                <AnimatePresence>
                    {vehicles.map((v, i) => (
                        <motion.div key={v.id} layout
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.04 }}
                            className={`bg-white rounded-2xl border shadow-soft overflow-hidden ${v.isPrimary ? 'border-brand/25 ring-1 ring-brand/10' : 'border-gray-100'}`}>

                            {/* Image */}
                            <div className="relative h-28 overflow-hidden">
                                <img src={v.img} alt={v.model} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                {v.isPrimary && (
                                    <div className="absolute top-3 left-3 bg-brand text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1">
                                        <Check size={9} strokeWidth={3} /> Primary
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3">
                                    <h3 className="text-white font-black text-base tracking-tight leading-none">{v.brand} {v.model}</h3>
                                    <p className="text-white/60 text-[10px] font-bold mt-0.5">{v.type}</p>
                                </div>
                                <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: v.color }} />
                            </div>

                            {/* Actions row */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                                    <p className="font-black text-sm text-content tracking-widest">{v.plate}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!v.isPrimary && (
                                        <button onClick={() => handleSetPrimary(v.id)}
                                            className="text-[9px] font-black text-brand bg-brand/10 px-3 py-1.5 rounded-lg uppercase tracking-widest active:scale-95 transition-all">
                                            Set Primary
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(v)}
                                        className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-content-subtle hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-colors">
                                        <Edit3 size={13} strokeWidth={2.5} />
                                    </button>
                                    <button onClick={() => handleDelete(v.id)}
                                        className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 transition-colors active:scale-95">
                                        <Trash2 size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* ── Empty State ── */}
                {vehicles.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Car size={28} className="text-content-subtle" />
                        </div>
                        <p className="font-black text-content-subtle text-sm">No vehicles added yet</p>
                        <button onClick={openAdd} className="mt-4 text-brand font-black text-xs uppercase tracking-widest">+ Add Vehicle</button>
                    </motion.div>
                )}
            </div>

            {/* ── Add / Edit Bottom Sheet ── */}
            <AnimatePresence>
                {showSheet && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40" onClick={closeSheet} />

                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 flex flex-col"
                            style={{ maxHeight: '88vh' }}>

                            {/* Sheet header — sticky */}
                            <div className="px-5 pt-4 pb-3 flex-shrink-0">
                                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-lg tracking-tight text-content">
                                        {editId ? 'Edit Vehicle' : 'Add Vehicle'}
                                    </h3>
                                    <button onClick={closeSheet} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-content-muted text-sm font-black">✕</button>
                                </div>
                            </div>

                            {/* Scrollable form body */}
                            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">

                                {/* Brand */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">
                                        Brand {errors.brand && <span className="text-red-500 normal-case font-bold tracking-normal">— {errors.brand}</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {BRANDS.map(b => (
                                            <button key={b} onClick={() => setField('brand', b)}
                                                className={`px-3 py-1.5 rounded-xl font-black text-xs border transition-all ${form.brand === b ? 'bg-brand text-white border-brand' : 'bg-gray-50 border-gray-100 text-content-muted'} ${errors.brand ? 'border-red-200' : ''}`}>
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Model */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1.5">
                                        Model {errors.model && <span className="text-red-500 normal-case font-bold tracking-normal">— {errors.model}</span>}
                                    </p>
                                    <input placeholder="e.g. City, Swift, Creta" value={form.model}
                                        onChange={e => setField('model', e.target.value)}
                                        className={`w-full bg-gray-50 border rounded-xl px-4 py-3 font-bold text-sm text-content outline-none transition-colors placeholder:text-content-subtle ${errors.model ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-brand/30'}`} />
                                </div>

                                {/* Type */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">Vehicle Type</p>
                                    <div className="flex flex-wrap gap-2">
                                        {TYPES.map(t => (
                                            <button key={t} onClick={() => setField('type', t)}
                                                className={`px-3 py-1.5 rounded-xl font-black text-xs border transition-all ${form.type === t ? 'bg-content text-white border-content' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">Color</p>
                                    <div className="flex gap-3 flex-wrap">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => setField('color', c)}
                                                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${form.color === c ? 'border-brand scale-110 shadow-md' : 'border-gray-200'}`}
                                                style={{ backgroundColor: c }}>
                                                {form.color === c && <Check size={13} className={c === '#ffffff' ? 'text-black' : 'text-white'} strokeWidth={3} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Plate */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1.5">
                                        Number Plate {errors.plate && <span className="text-red-500 normal-case font-bold tracking-normal">— {errors.plate}</span>}
                                    </p>
                                    <input placeholder="e.g. KA 05 MR 7821" value={form.plate}
                                        onChange={e => setField('plate', e.target.value.toUpperCase())}
                                        className={`w-full bg-gray-50 border rounded-xl px-4 py-3 font-black text-sm text-content outline-none tracking-widest uppercase transition-colors placeholder:font-bold placeholder:text-content-subtle placeholder:normal-case placeholder:tracking-normal ${errors.plate ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-brand/30'}`} />
                                </div>

                                {/* Save Button */}
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                                    className="w-full h-12 bg-brand text-white rounded-xl font-black text-sm shadow-md shadow-brand/20 mt-1 flex items-center justify-center gap-2">
                                    <Check size={16} strokeWidth={3} />
                                    {editId ? 'Update Vehicle' : 'Save Vehicle'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VehicleManager;
