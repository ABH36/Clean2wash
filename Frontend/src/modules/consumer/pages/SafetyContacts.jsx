import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, User, Phone, Trash2, ShieldCheck, Heart, AlertCircle, CheckCircle2, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';

const SafetyContacts = () => {
    const navigate = useNavigate();
    const { trustedContacts, addContact, removeContact } = useAuth();
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', relation: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.phone) { toast.error('Enter name and phone'); return; }
        setIsSaving(true);
        const res = await addContact(form);
        setIsSaving(false);
        if (res.success) {
            setForm({ name: '', phone: '', relation: '' });
            setShowAdd(false);
            toast.success('Contact added');
        } else {
            toast.error(res.error || 'Failed to add contact');
        }
    };

    const handleRemove = async (id) => {
        if (window.confirm('Remove this contact from safety network?')) {
            const res = await removeContact(id);
            if (res.success) { toast.success('Contact removed'); } 
            else { toast.error('Removal failed'); }
        }
    };

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Trusted contacts</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Your safety network</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                        <Plus size={16} /> Add contact
                    </button>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Status Banner ── */}
                    <div className="bg-emerald-500 p-5 rounded-[2.5rem] flex items-center gap-4 shadow-lg shadow-emerald-500/20 border border-white/10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
                            <ShieldCheck size={26} />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-white leading-none mb-1.5">Safety net active</h3>
                            <p className="text-white/60 text-[11px] font-medium leading-tight">Contacts will receive live alerts during an SOS trigger</p>
                        </div>
                    </div>

                    {/* ── Contacts List ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">Active members ({trustedContacts.length})</h3>
                        </div>

                        {trustedContacts.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-12 text-center">
                                <Heart size={32} className="text-slate-100 mx-auto mb-3" />
                                <p className="text-[12px] font-bold text-slate-300">No safety contacts added</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trustedContacts.map((contact, i) => (
                                    <motion.div key={contact._id || contact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4 group">
                                        <div className="w-11 h-11 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-brand group-hover:text-slate-900 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[14px] font-bold text-slate-900 leading-none mb-1.5">{contact.name}</h4>
                                            <p className="text-[11px] font-medium text-slate-400 truncate">{contact.phone} • {contact.relation}</p>
                                        </div>
                                        <button onClick={() => handleRemove(contact._id || contact.id)}
                                            className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 active:scale-90 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Tips / Security Card ── */}
                    <div className="bg-white/50 p-6 rounded-[2.5rem] border border-gray-100/50">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle size={18} className="text-brand" />
                            <p className="text-[12px] font-bold text-slate-900">SOS protection</p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Trusted contacts are people you rely on in case of emergencies. When SOS is activated, they will receive your current live location and vehicle status immediately.
                        </p>
                    </div>
                </div>

                {/* ── Add Sheet ── */}
                <AnimatePresence>
                    {showAdd && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Add safety member</h2>
                                    <button onClick={() => setShowAdd(false)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Contact name</p>
                                        <input placeholder="Ex: Rahul Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-slate-900 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Phone number</p>
                                        <input placeholder="Ex: +91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-slate-900 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Relationship</p>
                                        <input placeholder="Ex: Father, Sister, Friend" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-50 rounded-2xl px-5 font-bold text-slate-900 outline-none" />
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className="w-full h-16 bg-slate-900 text-white rounded-[1.8rem] font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <ShieldCheck size={20} /> {isSaving ? 'Saving...' : 'Save member'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default SafetyContacts;
