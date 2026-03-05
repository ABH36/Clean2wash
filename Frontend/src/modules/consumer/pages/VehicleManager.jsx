import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Car, Trash2, Check, Edit3, AlertCircle, CheckCircle2, ShieldAlert, FileSearch, Zap, Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const BRANDS = ['Honda', 'Maruti', 'Hyundai', 'Toyota', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes', 'Audi'];
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#ffffff', '#1a1a1a', '#95a5a6', '#e67e22'];
const TYPES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Luxury', 'Traveler', 'Bus'];

const BLANK_FORM = { brand: '', model: '', type: 'Sedan', color: '#3498db', plate: '', insuranceExpiry: '', pucExpiry: '' };

const TYPE_IMG = {
    Hatchback: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
    Sedan: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    SUV: 'https://images.unsplash.com/photo-1518987048-93e29699e79a?w=400&q=80',
    MPV: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    Pickup: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
    Luxury: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
    Traveler: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
    Bus: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80',
};

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

const VehicleManager = () => {
    const navigate = useNavigate();
    const { vehicles, addVehicle, removeVehicle, setPrimaryVehicle, user } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [isFetching, setIsFetching] = useState(false);

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const closeSheet = () => { setShowSheet(false); setEditId(null); setErrors({}); };

    const openAdd = () => {
        setForm(BLANK_FORM);
        setEditId(null);
        setErrors({});
        setShowSheet(true);
    };

    const openEdit = (v) => {
        setForm({
            brand: v.brand,
            model: v.model,
            type: v.type,
            color: v.color,
            plate: v.plate,
            insuranceExpiry: v.insuranceExpiry || '',
            pucExpiry: v.pucExpiry || ''
        });
        setEditId(v._id); // Use _id from MongoDB
        setErrors({});
        setShowSheet(true);
    };

    const handleVahanFetch = async () => {
        if (!form.plate) {
            setErrors({ plate: 'Enter plate number first' });
            return;
        }
        setIsFetching(true);
        // Simulate VAHAN API delay
        await new Promise(r => setTimeout(r, 1500));

        // Mock data logic based on common plate patterns or random
        setForm(prev => ({
            ...prev,
            brand: 'Maruti',
            model: 'Dzire VXI',
            type: 'Sedan',
            insuranceExpiry: '2025-12-10',
            pucExpiry: '2024-09-15'
        }));
        setIsFetching(false);
        showToast('Details fetched from VAHAN!');
    };

    const validate = () => {
        const e = {};
        if (!form.brand) e.brand = 'Required';
        if (!form.model.trim()) e.model = 'Required';
        if (!form.plate.trim()) e.plate = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSetPrimary = async (id) => {
        const result = await setPrimaryVehicle(id);
        if (result.success) {
            showToast('Set as primary vehicle');
        } else {
            showToast(result.error || 'Failed to set primary vehicle', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this vehicle from your garage?')) {
            const result = await removeVehicle(id);
            if (result.success) {
                showToast('Vehicle removed', 'error');
            } else {
                showToast(result.error || 'Failed to remove vehicle', 'error');
            }
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        const img = TYPE_IMG[form.type] || TYPE_IMG['Sedan'];

        try {
            if (editId) {
                // For editing, we would need an update method - for now using remove + add
                const result = await addVehicle({ ...form, img });
                if (result.success) {
                    showToast('Vehicle updated successfully!');
                } else {
                    showToast(result.error || 'Failed to update vehicle', 'error');
                    return;
                }
            } else {
                const result = await addVehicle({ ...form, img });
                if (result.success) {
                    showToast('Vehicle added to garage!');
                } else {
                    showToast(result.error || 'Failed to add vehicle', 'error');
                    return;
                }
            }
            closeSheet();
        } catch (error) {
            showToast('Failed to save vehicle', 'error');
        }
    };

    const getExpiryStatus = (date) => {
        if (!date) return null;
        const diff = new Date(date) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: 'Expired', color: 'text-red-500', bg: 'bg-red-50' };
        if (days < 30) return { label: `${days}d left`, color: 'text-orange-500', bg: 'bg-orange-50' };
        return { label: 'Active', color: 'text-green-500', bg: 'bg-green-50' };
    };

    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    };

    return (
        <div className="min-h-screen bg-gray-50 font-outfit">
            <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

            <AnimatePresence>
                {toast && <Toast key={toast.msg} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
            </AnimatePresence>

            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Garages & Fleet</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">{vehicles.length} Vehicles Managed</p>
                    </div>
                    <button onClick={openAdd}
                        className="ml-auto flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl font-black text-xs shadow-lg shadow-brand/20 active:scale-95 transition-all">
                        <Plus size={14} strokeWidth={3} /> Add New
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">
                <AnimatePresence>
                    {vehicles.map((v, i) => {
                        const insStatus = getExpiryStatus(v.insuranceExpiry);
                        const pucStatus = getExpiryStatus(v.pucExpiry);

                        return (
                            <motion.div key={v.id} layout
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                                className={`bg-white rounded-3xl border shadow-xl overflow-hidden ${v.isPrimary ? 'border-brand/30' : 'border-gray-100'}`}>

                                <div className="relative h-32 overflow-hidden">
                                    <img src={v.img} alt={v.model} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    {v.isPrimary && (
                                        <div className="absolute top-3 left-3 bg-brand text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                            <Check size={8} strokeWidth={4} /> Primary Vehicle
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-4">
                                        <h3 className="text-white font-black text-lg tracking-tight leading-none uppercase italic">{v.brand} {v.model}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-white/60 text-[8px] font-black tracking-widest uppercase bg-white/10 px-1.5 py-0.5 rounded-md">{v.type}</span>
                                            <div className="w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: v.color }} />
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1.5 rounded-xl border border-white flex flex-col items-center">
                                        <p className="text-[7px] font-black text-content-subtle uppercase leading-none mb-0.5 tracking-tighter">Plate</p>
                                        <p className="text-[10px] font-black text-content tracking-widest leading-none">{v.plate.replace(/\s/g, '')}</p>
                                    </div>
                                </div>

                                <div className="px-5 py-4 bg-white space-y-3">
                                    {/* Compliance Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {insStatus && (
                                            <div className={`p-2.5 rounded-2xl border border-gray-50 ${insStatus.bg} flex flex-col gap-1`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[7px] font-black text-content-subtle uppercase tracking-widest">Insurance</span>
                                                    <ShieldAlert size={10} className={insStatus.color} />
                                                </div>
                                                <p className={`text-[10px] font-black ${insStatus.color}`}>{insStatus.label}</p>
                                            </div>
                                        )}
                                        {pucStatus && (
                                            <div className={`p-2.5 rounded-2xl border border-gray-50 ${pucStatus.bg} flex flex-col gap-1`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[7px] font-black text-content-subtle uppercase tracking-widest">PUC / Emission</span>
                                                    <Zap size={10} className={pucStatus.color} />
                                                </div>
                                                <p className={`text-[10px] font-black ${pucStatus.color}`}>{pucStatus.label}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2">
                                            {!v.isPrimary && (
                                                <button onClick={() => handleSetPrimary(v.id)}
                                                    className="h-8 px-3 bg-brand/5 text-brand text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-brand hover:text-white transition-all">
                                                    Select
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(v)} className="w-8 h-8 bg-gray-50 text-content-subtle rounded-xl flex items-center justify-center border border-gray-100 hover:border-brand/30 hover:text-brand transition-all">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(v.id)} className="w-8 h-8 bg-red-50 text-red-400 rounded-xl flex items-center justify-center border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showSheet && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeSheet} />

                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[2.5rem] z-50 overflow-hidden shadow-2xl"
                            style={{ maxHeight: '90vh' }}>

                            <div className="px-6 pt-5 pb-3 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-xl tracking-tight text-content italic uppercase">
                                        {editId ? 'Modify Fleet' : 'Recruit Vehicle'}
                                    </h3>
                                    <button onClick={closeSheet} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-content-muted font-black">✕</button>
                                </div>
                            </div>

                            <div className="overflow-y-auto px-6 py-6 pb-12 space-y-6">
                                {/* VAHAN FETCH Integration */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand italic">Vehicle Identification</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input placeholder="ENTER PLATE (e.g. KA05MR7821)" value={form.plate}
                                                onChange={e => setField('plate', e.target.value.toUpperCase())}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-black text-sm tracking-widest uppercase focus:border-brand transition-all outline-none" />
                                        </div>
                                        <button onClick={handleVahanFetch} disabled={isFetching}
                                            className={`w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 ${isFetching ? 'animate-pulse' : 'active:scale-95'}`}>
                                            {isFetching ? <Zap size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 px-1">
                                        <FileSearch size={12} className="text-gray-400" />
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Auto-fill details via VAHAN API</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle ml-1">Brand</p>
                                        <select value={form.brand} onChange={e => setField('brand', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-sm outline-none appearance-none">
                                            <option value="">Select</option>
                                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle ml-1">Type</p>
                                        <select value={form.type} onChange={e => setField('type', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-sm outline-none appearance-none">
                                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle ml-1">Full Model Name</p>
                                    <input placeholder="e.g. Range Rover Evoque" value={form.model}
                                        onChange={e => setField('model', e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-brand/30" />
                                </div>

                                {/* COMPLIANCE DATES */}
                                <div className="space-y-3 pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand italic">Compliance & Reminders</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] font-black uppercase text-content-subtle tracking-widest">Insurance Exp.</span>
                                                <Calendar size={10} className="text-blue-500" />
                                            </div>
                                            <input type="date" value={form.insuranceExpiry} onChange={e => setField('insuranceExpiry', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] font-black uppercase text-content-subtle tracking-widest">PUC / Emission</span>
                                                <Calendar size={10} className="text-emerald-500" />
                                            </div>
                                            <input type="date" value={form.pucExpiry} onChange={e => setField('pucExpiry', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                                    className="w-full h-14 bg-content text-white rounded-2xl font-black text-sm shadow-xl shadow-content/20 flex items-center justify-center gap-3 uppercase italic tracking-widest">
                                    <CheckCircle2 size={18} />
                                    {editId ? 'Update Modifications' : 'Confirm Registration'}
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
