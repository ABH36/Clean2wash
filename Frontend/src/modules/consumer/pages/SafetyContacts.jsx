import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, User, Phone, Trash2, ShieldCheck, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const SafetyContacts = () => {
    const navigate = useNavigate();
    const { trustedContacts, addContact, removeContact } = useAuth();
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', relation: '' });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    const handleSave = async () => {
        if (!form.name || !form.phone) return;
        const res = await addContact(form);
        if (res.success) {
            setForm({ name: '', phone: '', relation: '' });
            setShowAdd(false);
            showToast('Contact added to Safety Net');
        } else {
            showToast(res.error || 'Failed to add contact', 'error');
        }
    };

    const handleRemove = async (id) => {
        const res = await removeContact(id);
        if (res.success) {
            showToast('Contact removed');
        } else {
            showToast(res.error || 'Failed to remove contact', 'error');
        }
    };

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-outfit">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-content uppercase tracking-tight italic">Trusted Contacts</h1>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">Your Safety Network</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                </header>

                <div className="px-5 py-6 space-y-4">
                    {/* ── Status Banner ── */}
                    <div className="bg-green-500 rounded-2xl p-4 flex items-center gap-4 border border-green-600/10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic leading-none">Safety Active</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Contacts will be notified on SOS trigger</p>
                        </div>
                    </div>

                    {/* ── Contacts List ── */}
                    <div className="space-y-3">
                        {trustedContacts.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto opacity-30">
                                    <Heart size={32} />
                                </div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">No trusted contacts added</p>
                            </div>
                        ) : (
                            trustedContacts.map((contact, i) => (
                                <motion.div
                                    key={contact.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 bg-brand/5 rounded-xl flex items-center justify-center text-brand shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-content uppercase italic leading-none">{contact.name}</h4>
                                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1.5">{contact.phone} • {contact.relation}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(contact._id || contact.id)}
                                        className="w-9 h-9 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Add Contact Drawer ── */}
                <AnimatePresence>
                    {showAdd && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setShowAdd(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] p-8 pb-12 shadow-2xl"
                            >
                                <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
                                <h3 className="text-xl font-black text-content uppercase italic tracking-tight mb-8">Add Safety Member</h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Member Name</p>
                                        <input
                                            placeholder="e.g. Rahul Sharma"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold text-sm outline-none focus:border-brand/30 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Phone Number</p>
                                        <input
                                            placeholder="e.g. +91 98765 43210"
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold text-sm outline-none focus:border-brand/30 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Relation</p>
                                        <input
                                            placeholder="e.g. Father, Sister, Friend"
                                            value={form.relation}
                                            onChange={e => setForm({ ...form, relation: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold text-sm outline-none focus:border-brand/30 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className="w-full h-16 bg-content text-white rounded-2xl font-black text-sm uppercase tracking-widest italic shadow-xl shadow-content/20 flex items-center justify-center gap-3"
                                    >
                                        <ShieldCheck size={20} strokeWidth={3} />
                                        Save to Safety Net
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ── Toast ── */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-brand text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 whitespace-nowrap"
                        >
                            <CheckCircle2 size={16} strokeWidth={3} />
                            {toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default SafetyContacts;
