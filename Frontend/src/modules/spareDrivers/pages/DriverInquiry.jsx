import React, { useState, useEffect } from 'react';
import {
    HelpCircle, MessageSquareText, Send, Loader2,
    Clock, RefreshCw, CheckCircle2, AlertCircle,
    ChevronRight, Plus, X, Search, InboxIcon
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    open:        { label: 'Open',        color: 'bg-red-50 text-red-600 border-red-100',        dot: 'bg-red-400' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-400' },
    resolved:    { label: 'Resolved',    color: 'bg-green-50 text-green-700 border-green-100',   dot: 'bg-green-400' },
    closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-300' },
};

const TABS = [
    { id: 'all',         label: 'All Tickets' },
    { id: 'open',        label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved',    label: 'Resolved' },
];

const DriverInquiry = () => {
    const [loading, setLoading]   = useState(false);
    const [fetching, setFetching] = useState(true);
    const [inquiries, setInquiries] = useState([]);
    const [form, setForm]         = useState({ subject: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch]     = useState('');

    const fetchInquiries = async () => {
        setFetching(true);
        try {
            const res = await spareDriverAPI.getInquiries();
            setInquiries(res.data.inquiries || []);
        } catch (e) {
            console.error(e);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchInquiries(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.subject || !form.message) return toast.error('Please fill all fields');
        setLoading(true);
        try {
            await spareDriverAPI.createInquiry(form);
            toast.success('Ticket submitted successfully');
            setForm({ subject: '', message: '' });
            setShowForm(false);
            fetchInquiries();
        } catch {
            toast.error('Failed to submit ticket');
        } finally {
            setLoading(false);
        }
    };

    const filtered = inquiries.filter(iq => {
        const matchTab = activeTab === 'all' || iq.status === activeTab;
        const q = search.toLowerCase();
        const matchSearch = !q || iq.subject?.toLowerCase().includes(q) || iq.message?.toLowerCase().includes(q);
        return matchTab && matchSearch;
    });

    const counts = {
        total:       inquiries.length,
        open:        inquiries.filter(i => i.status === 'open').length,
        in_progress: inquiries.filter(i => i.status === 'in_progress').length,
        resolved:    inquiries.filter(i => i.status === 'resolved').length,
    };

    return (
        <DriverLayout title="Support">
            <div className="px-4 py-4 space-y-4 pb-28">

                {/* ── Header Row ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Support Desk</h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Raise and track your support tickets</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchInquiries}
                            className="w-9 h-9 rounded-xl bg-surface border border-content/[0.06] flex items-center justify-center text-slate-500 hover:text-brand transition-colors active:scale-95"
                        >
                            <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowForm(v => !v)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-black rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-brand/20"
                        >
                            {showForm ? <X size={13} /> : <Plus size={13} />}
                            {showForm ? 'Cancel' : 'New Ticket'}
                        </button>
                    </div>
                </div>

                {/* ── Metric Strip ── */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Total',       value: counts.total,       color: 'text-slate-900 dark:text-white' },
                        { label: 'Open',        value: counts.open,        color: 'text-red-500' },
                        { label: 'In Progress', value: counts.in_progress, color: 'text-yellow-600' },
                        { label: 'Resolved',    value: counts.resolved,    color: 'text-green-600' },
                    ].map((m, i) => (
                        <div key={i} className="bg-surface border border-content/[0.04] rounded-2xl p-3 text-center shadow-sm">
                            <p className={`text-[16px] font-black ${m.color} leading-none`}>{m.value}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── New Ticket Form ── */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="bg-surface border border-content/[0.06] rounded-[1.5rem] p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                                    <HelpCircle size={15} className="text-brand" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">New Support Ticket</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Describe your issue clearly</p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Subject</label>
                                    <input
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        placeholder="Brief description of your issue"
                                        className="w-full h-11 bg-background border border-content/[0.06] rounded-xl px-4 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-brand/40 transition-colors placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Message</label>
                                    <textarea
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        placeholder="Explain your issue in detail..."
                                        rows={4}
                                        className="w-full bg-background border border-content/[0.06] rounded-xl px-4 py-3 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-brand/40 transition-colors resize-none placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-brand text-black rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                                >
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><Send size={13} /> Submit Ticket</>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Search ── */}
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by subject or message..."
                        className="w-full h-10 bg-surface border border-content/[0.06] rounded-xl pl-9 pr-4 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-brand/30 transition-colors placeholder:text-slate-400"
                    />
                </div>

                {/* ── Filter Tabs ── */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id
                                    ? 'bg-content text-background shadow-sm'
                                    : 'bg-surface border border-content/[0.06] text-content/50 hover:text-content'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Ticket List ── */}
                <div className="space-y-2">
                    {fetching ? (
                        <div className="py-16 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-brand" />
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map((iq, i) => {
                            const cfg = STATUS_CONFIG[iq.status] || STATUS_CONFIG.open;
                            return (
                                <motion.div
                                    key={iq._id || i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-surface border border-content/[0.04] rounded-2xl p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <MessageSquareText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{iq.subject}</p>
                                        </div>
                                        <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed ml-5 line-clamp-2">{iq.message}</p>
                                    <div className="mt-3 ml-5 flex items-center gap-3 text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {new Date(iq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        {iq.status === 'resolved' && (
                                            <div className="flex items-center gap-1 text-green-500">
                                                <CheckCircle2 size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Resolved</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-surface border border-content/[0.04] flex items-center justify-center mb-4 shadow-sm">
                                <InboxIcon size={28} className="text-slate-300" />
                            </div>
                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">No Tickets Found</p>
                            <p className="text-[11px] text-slate-400/60 font-medium mt-1">
                                {activeTab !== 'all' ? 'Try switching filter tabs' : 'Tap "New Ticket" to raise an issue'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverInquiry;
