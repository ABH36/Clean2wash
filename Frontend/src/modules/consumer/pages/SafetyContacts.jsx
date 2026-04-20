import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, User, Phone, Trash2, ShieldCheck, Heart, AlertCircle, CheckCircle2, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';

const SafetyContacts = () => {
    const navigate = useNavigate();
    const { trustedContacts = [], addContact, removeContact } = useAuth();
    const { isDarkMode } = useTheme();
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
            <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                {/* ── Compact Header ── */}
                <header className={`px-5 pt-8 pb-4 sticky top-0 z-[60] border-b backdrop-blur-xl transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/10'
                }`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.05]'
                        }`}>
                            <ChevronLeft size={22} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                        </button>
                        <div>
                            <h1 className={`text-[20px] font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trusted contacts</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-none">Your safety network</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAdd(true)} className={`h-10 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all ${
                        isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0F172A] text-white shadow-lg'
                    }`}>
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
                            <h3 className="text-[15px] font-black text-white leading-none mb-1.5 tracking-tight">Safety net active</h3>
                            <p className="text-white/70 text-[11px] font-medium leading-tight tracking-tight">Contacts will receive live alerts during an SOS trigger</p>
                        </div>
                    </div>

                    {/* ── Contacts List ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className={`text-[11px] font-black tracking-tight leading-none uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Active members ({trustedContacts?.length || 0})</h3>
                        </div>

                        {(trustedContacts?.length || 0) === 0 ? (
                            <div className={`rounded-[2.5rem] border border-dashed p-12 text-center ${
                                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-black/10'
                            }`}>
                                <Heart size={32} className={`mx-auto mb-3 ${isDarkMode ? 'text-white/10' : 'text-black/10'}`} />
                                <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>No safety contacts added</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trustedContacts.map((contact, i) => (
                                    <motion.div key={contact._id || contact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className={`rounded-[2rem] p-5 border flex items-center gap-4 group transition-all ${
                                            isDarkMode ? 'bg-white/[0.03] border-white/05 hover:border-white/10' : 'bg-white border-black/05 hover:border-black/10 shadow-sm'
                                        }`}>
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                            isDarkMode ? 'bg-white/05 text-white/40 border-white/05' : 'bg-black/05 text-black/40 border-black/05'
                                        }`}>
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-[14px] font-black leading-none mb-1.5 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{contact.name}</h4>
                                            <p className={`text-[11px] font-bold tracking-tight ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>{contact.phone} • {contact.relation}</p>
                                        </div>
                                        <button onClick={() => handleRemove(contact._id || contact.id)}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center border active:scale-90 transition-all ${
                                                isDarkMode ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-rose-50 text-rose-500 border-rose-100'
                                            }`}>
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Tips / Security Card ── */}
                    <div className={`p-6 rounded-[2.5rem] border transition-all ${
                        isDarkMode ? 'bg-white/[0.03] border-white/05 shadow-black/20' : 'bg-white border-black/05 shadow-sm'
                    }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle size={18} className="text-[#F59E0B]" />
                            <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SOS protection</p>
                        </div>
                        <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                            Trusted contacts are people you rely on in case of emergencies. When SOS is activated, they will receive your current live location and vehicle status immediately.
                        </p>
                    </div>
                </div>

                {/* ── Add Sheet ── */}
                <AnimatePresence>
                    {showAdd && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
                                className={`fixed inset-x-0 bottom-0 rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl transition-all border-t ${
                                    isDarkMode ? 'bg-[#0A0F0D] border-white/10' : 'bg-white border-black/10'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add safety member</h2>
                                    <button onClick={() => setShowAdd(false)} className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                                        isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/05 border-black/05 text-black/40'
                                    }`}><X size={18} /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className={`text-[11px] font-bold ml-1 uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Contact name</p>
                                        <input placeholder="Ex: Rahul Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className={`w-full h-14 border rounded-2xl px-5 font-bold outline-none transition-all ${
                                                isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/40' : 'bg-black/[0.02] border-black/05 text-slate-900'
                                            }`} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className={`text-[11px] font-bold ml-1 uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Phone number</p>
                                        <input placeholder="Ex: +91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className={`w-full h-14 border rounded-2xl px-5 font-bold outline-none transition-all ${
                                                isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/40' : 'bg-black/[0.02] border-black/05 text-slate-900'
                                            }`} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className={`text-[11px] font-bold ml-1 uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Relationship</p>
                                        <input placeholder="Ex: Father, Sister, Friend" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}
                                            className={`w-full h-14 border rounded-2xl px-5 font-bold outline-none transition-all ${
                                                isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/40' : 'bg-black/[0.02] border-black/05 text-slate-900'
                                            }`} />
                                    </div>
                                    <button onClick={handleSave} disabled={isSaving} className={`w-full h-16 rounded-[1.8rem] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 tracking-[0.1em] uppercase text-[12px] ${
                                        isDarkMode 
                                            ? 'bg-white text-black shadow-white/5' 
                                            : 'bg-[#0F172A] text-white shadow-black/20'
                                    }`}>
                                        <ShieldCheck size={20} /> {isSaving ? 'Processing...' : 'Save safety member'}
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

