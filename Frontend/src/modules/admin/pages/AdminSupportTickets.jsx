import React, { useState, useEffect } from 'react';
import { FileText, MessageCircle, AlertCircle, Clock, CheckCircle2, Loader2, Trash2, Send, ArrowLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

const STATUS_CONFIG = {
    open:     { badge: 'adm-badge adm-badge-warning', label: 'Open' },
    pending:  { badge: 'adm-badge adm-badge-info',    label: 'Pending' },
    resolved: { badge: 'adm-badge adm-badge-success', label: 'Resolved' },
    closed:   { badge: 'adm-badge',                   label: 'Closed' },
};

const AdminSupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [processing, setProcessing] = useState(false);
    const [activeStatus, setActiveStatus] = useState('open');

    const fetchTickets = async () => {
        try { setLoading(true); const res = await adminAPI.getTickets({ status: activeStatus }); if (res.status === 'success') setTickets(res.data.tickets || []); }
        catch { toast.error("Failed to sync tickets"); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchTickets(); }, [activeStatus]);

    const handleUpdate = async (id, data) => {
        try {
            setProcessing(true);
            const res = await adminAPI.updateTicket(id, data);
            if (res.status === 'success') { if (selected?._id === id) setSelected(res.data.ticket); fetchTickets(); toast.success("Updated"); }
        } catch { toast.error("Failed"); }
        finally { setProcessing(false); }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        try {
            setProcessing(true);
            await adminAPI.updateTicket(selected._id, { message: reply, status: 'pending' });
            setReply('');
            const r = await adminAPI.getTicket(selected._id);
            setSelected(r.data.ticket);
            fetchTickets();
            toast.success("Reply sent");
        } catch { toast.error("Failed to send"); }
        finally { setProcessing(false); }
    };

    const tabs = [
        { value: 'open',     label: 'Open' },
        { value: 'pending',  label: 'Pending' },
        { value: 'resolved', label: 'Resolved' },
    ];

    return (
        <PageShell
            title="Support Tickets"
            subtitle="Async incident management"
            icon={FileText}
            accent="blue"
            actions={<StatusTabs tabs={tabs} active={activeStatus} onChange={setActiveStatus} />}
        >
            <div className="flex gap-5 h-[calc(100vh-220px)] min-h-[500px]">
                {/* ── TICKET LIST ── */}
                <div className={`flex flex-col gap-3 overflow-y-auto pr-1 ${selected ? 'hidden lg:flex w-[380px] shrink-0' : 'flex-1'}`}>
                    {loading ? <PageLoader /> : tickets.length === 0 ? (
                        <div className="flex-1 bg-white rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center">
                            <EmptyState icon={FileText} title={`No ${activeStatus} tickets`} subtitle="All clear!" />
                        </div>
                    ) : tickets.map(t => (
                        <motion.div key={t._id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelected(t)}
                            className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${selected?._id === t._id ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-transparent hover:border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={STATUS_CONFIG[t.status]?.badge}>{STATUS_CONFIG[t.status]?.label}</span>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-black text-slate-800 text-sm leading-tight mb-1 truncate">{t.subject || 'Support Request'}</h3>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{t.description}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">{t.user?.name?.[0]}</div>
                                    <span className="text-[10px] font-bold text-slate-600">{t.user?.name}</span>
                                </div>
                                <span className={`adm-badge ${t.priority === 'high' ? 'adm-badge-error' : 'adm-badge-info'}`}>{t.priority}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── TICKET DETAIL ── */}
                <AnimatePresence>
                    {selected && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden min-w-0">
                            {/* Detail Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg"><ArrowLeft size={16} /></button>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">#{selected._id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Incident Thread</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selected.status !== 'resolved' && (
                                        <button onClick={() => handleUpdate(selected._id, { status: 'resolved' })}
                                            className="adm-btn adm-btn-success adm-btn-sm">
                                            <CheckCircle2 size={13} /> Resolve
                                        </button>
                                    )}
                                    <button className="adm-btn adm-btn-ghost adm-btn-sm text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            {/* Chat Thread */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
                                {/* Original issue */}
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                                        <User size={16} />
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{selected.user?.name} · Initial Report</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{selected.description}</p>
                                        <p className="text-[9px] text-slate-300 font-bold mt-2">{new Date(selected.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                {/* Replies */}
                                {selected.responses?.map((r, i) => (
                                    <div key={i} className={`flex gap-3 ${r.admin ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${r.admin ? 'bg-slate-900 text-white' : 'bg-blue-500 text-white'}`}>
                                            {r.admin ? <CheckCircle2 size={16} /> : <User size={16} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl border shadow-sm max-w-[80%] ${r.admin ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-white border-slate-100 rounded-tl-none'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${r.admin ? 'text-white/40' : 'text-slate-400'}`}>
                                                {r.admin ? 'Admin Response' : selected.user?.name}
                                            </p>
                                            <p className={`text-sm font-medium leading-relaxed ${r.admin ? 'text-white/90' : 'text-slate-700'}`}>{r.message}</p>
                                            <p className={`text-[9px] font-bold mt-2 ${r.admin ? 'text-white/20' : 'text-slate-300'}`}>{new Date(r.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                                <form onSubmit={handleReply} className="relative">
                                    <textarea
                                        className="adm-input resize-none pr-14 rounded-2xl"
                                        placeholder="Type your response..."
                                        rows="3"
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                    />
                                    <button type="submit" disabled={processing || !reply.trim()}
                                        className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-blue-500/20">
                                        {processing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageShell>
    );
};

export default AdminSupportTickets;
