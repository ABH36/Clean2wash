import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, Home, Briefcase, MapPin,
    Edit3, Trash2, Check, Star, Navigation
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const INITIAL_ADDRESSES = [
    { id: 1, label: 'Home', icon: 'home', full: 'HSR Layout, Sector 2, Bengaluru 560102', landmark: 'Near Agara Lake', isPrimary: true },
    { id: 2, label: 'Office', icon: 'office', full: 'Koramangala 5th Block, Bengaluru 560095', landmark: 'IndiQube Tower, Floor 3', isPrimary: false },
    { id: 3, label: 'Parents', icon: 'other', full: 'Jayanagar 4th Block, Bengaluru 560041', landmark: 'Opposite BDA Complex', isPrimary: false },
];

const ICONS = { home: Home, office: Briefcase, other: MapPin };

const AddressManager = () => {
    const navigate = useNavigate();
    const { addresses, addAddress, removeAddress, setPrimaryAddress } = useAuth();
    const [showSheet, setShowSheet] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ label: 'Home', icon: 'home', full: '', landmark: '' });

    const openAdd = () => { setEditing(null); setForm({ label: '', icon: 'home', full: '', landmark: '' }); setShowSheet(true); };
    const openEdit = (addr) => { setEditing(addr.id || addr.label); setForm({ label: addr.label, icon: addr.icon || 'other', full: addr.address || addr.full, landmark: addr.landmark || '' }); setShowSheet(true); };
    const handleDelete = (id) => removeAddress(id);
    const handleSetPrimary = (id) => setPrimaryAddress(id);

    const handleSave = () => {
        if (!form.full) return;
        if (editing) {
            removeAddress(editing);
            const newAddr = { ...form, id: editing, address: form.full, isPrimary: false };
            addAddress(newAddr);
        } else {
            addAddress({ ...form, id: Date.now(), address: form.full, isPrimary: false });
        }
        setShowSheet(false);
    };

    const TYPES = [
        { key: 'home', label: 'Home', ico: Home },
        { key: 'office', label: 'Office', ico: Briefcase },
        { key: 'other', label: 'Other', ico: MapPin },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Saved Addresses</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Your Wash Locations</p>
                    </div>
                    <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl font-black text-xs shadow-md">
                        <Plus size={14} strokeWidth={3} /> Add
                    </button>
                </div>
            </header>

            <div className="px-4 py-4 space-y-3 pb-24">
                {/* Map preview */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft h-36">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-blue-900/25" />
                    <button className="absolute bottom-3 right-3 bg-white flex items-center gap-2 px-3 py-2 rounded-xl shadow-md border border-gray-100 text-[9px] font-black uppercase tracking-widest text-content">
                        <Navigation size={12} className="text-brand" strokeWidth={2.5} /> Use Current Location
                    </button>
                </div>

                {/* Address list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    {addresses.map((addr, i) => {
                        const Icon = ICONS[addr.icon] || MapPin;
                        return (
                            <motion.div key={addr.id} layout
                                className={`flex items-start gap-3 px-4 py-4 ${i < addresses.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${addr.isPrimary ? 'bg-brand/10' : 'bg-gray-50 border border-gray-100'}`}>
                                    <Icon size={17} className={addr.isPrimary ? 'text-brand' : 'text-content-subtle'} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-black text-sm text-content">{addr.label}</p>
                                        {addr.isPrimary && (
                                            <span className="bg-brand/10 text-brand text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                <Star size={7} fill="currentColor" /> Primary
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-bold text-content-subtle leading-snug">{addr.full}</p>
                                    {addr.landmark && <p className="text-[9px] font-bold text-content-subtle mt-0.5 opacity-70">📍 {addr.landmark}</p>}
                                    {!addr.isPrimary && (
                                        <button onClick={() => handleSetPrimary(addr.id)}
                                            className="mt-2 text-[9px] font-black text-brand uppercase tracking-widest">
                                            Set as Primary
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button onClick={() => openEdit(addr)} className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-content-subtle hover:text-blue-500 transition-colors">
                                        <Edit3 size={13} strokeWidth={2.5} />
                                    </button>
                                    {!addr.isPrimary && (
                                        <button onClick={() => handleDelete(addr.id)} className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-400">
                                            <Trash2 size={13} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Sheet */}
            <AnimatePresence>
                {showSheet && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSheet(false)} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 px-5 pt-4 pb-10">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                            <h3 className="font-black text-lg tracking-tight text-content mb-5">{editing ? 'Edit Address' : 'Add Address'}</h3>

                            <div className="space-y-4">
                                {/* Type selector */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-2">Address Type</p>
                                    <div className="flex gap-2">
                                        {TYPES.map(t => (
                                            <button key={t.key} onClick={() => setForm(f => ({ ...f, icon: t.key, label: t.label }))}
                                                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${form.icon === t.key ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-gray-50 border-gray-100 text-content-muted'}`}>
                                                <t.ico size={18} strokeWidth={2.5} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom label */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1.5">Label</p>
                                    <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Mom's House"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-content outline-none focus:border-brand/30 placeholder:text-content-subtle" />
                                </div>

                                {/* Full address */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1.5">Full Address</p>
                                    <textarea rows={2} value={form.full} onChange={e => setForm(f => ({ ...f, full: e.target.value }))} placeholder="Street, Area, City, PIN"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-content outline-none focus:border-brand/30 placeholder:text-content-subtle resize-none" />
                                </div>

                                {/* Landmark */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1.5">Landmark (optional)</p>
                                    <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="e.g. Near Main Gate"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-content outline-none focus:border-brand/30 placeholder:text-content-subtle" />
                                </div>

                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                                    className="w-full h-12 bg-brand text-white rounded-xl font-black text-sm shadow-md">
                                    {editing ? 'Save Changes' : 'Add Address'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddressManager;
