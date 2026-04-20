import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    MessageCircle, 
    CheckCircle2, 
    AlertCircle, 
    Search, 
    Filter, 
    MoreHorizontal,
    User,
    ArrowRight,
    RefreshCw,
    X,
    Send
} from 'lucide-react';
import { adminAPI } from '../../../../utils/adminApi';
import { toast } from 'react-hot-toast';

const STATUS_MAP = {
    open: { label: 'Open', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: RefreshCw },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    closed: { label: 'Closed', color: 'bg-white/[0.02] text-white/40 border-white/5', icon: X }
};

const SupportTicketsSection = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', category: 'all' });
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [actioning, setActioning] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.status !== 'all') params.status = filter.status;
            if (filter.category !== 'all') params.category = filter.category;
            
            const res = await adminAPI.getSupportTickets(params);
            if (res.status === 'success') {
                setTickets(res.data.tickets);
            }
        } catch (err) {
            toast.error('Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const handleUpdateTicket = async (id, status, message = '') => {
        try {
            setActioning(true);
            const res = await adminAPI.updateSupportTicket(id, { status, message });
            if (res.status === 'success') {
                toast.success('Ticket updated successfully');
                setTickets(prev => prev.map(t => t._id === id ? res.data.ticket : t));
                if (selectedTicket?._id === id) {
                    setSelectedTicket(res.data.ticket);
                }
                setReplyMessage('');
            }
        } catch (err) {
            toast.error(err.message || 'Update failed');
        } finally {
            setActioning(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = 
            t.subject?.toLowerCase().includes(search.toLowerCase()) || 
            t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.user?.phone?.includes(search);
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 ">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tickets</p>
                    <h4 className="text-2xl font-black text-slate-900">{tickets.length}</h4>
                </div>
                {Object.entries(STATUS_MAP).map(([key, config]) => (
                    <div key={key} className="bg-white/5 p-5 rounded-3xl border border-white/5 ">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{config.label}</p>
                        <h4 className="text-2xl font-black text-slate-900">
                            {tickets.filter(t => t.status === key).length}
                        </h4>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[70vh]">
                {/* Tickets List */}
                <div className="lg:w-2/5 flex flex-col bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden ">
                    <div className="p-4 border-b border-gray-50 bg-slate-50/50 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by subject or user..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none">
                            {['all', 'open', 'in_progress', 'resolved'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(f => ({ ...f, status: s }))}
                                    className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${filter.status === s ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 text-slate-400'}`}
                                >
                                    {s === 'all' ? 'All Tickets' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-12 text-center space-y-3">
                                <RefreshCw className="w-8 h-8 text-brand mx-auto animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Desk...</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <AlertCircle className="w-8 h-8 text-slate-200 mx-auto" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tickets found</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => {
                                const Config = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                                return (
                                    <button 
                                        key={ticket._id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={`w-full p-4 text-left transition-all hover:bg-slate-50 flex gap-4 ${selectedTicket?._id === ticket._id ? 'bg-brand/5 border-l-4 border-l-brand' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${Config.color}`}>
                                            <Config.icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{ticket.subject}</h5>
                                                <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-tight">
                                                    <User size={10} /> {ticket.user?.name || 'Unknown'}
                                                </div>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-[9px] font-black text-brand uppercase tracking-widest">{ticket.category}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 line-clamp-1 uppercase tracking-tight opacity-70">
                                                {ticket.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Ticket Details */}
                <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden ">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-[1000] text-slate-900 uppercase tracking-tight italic">{selectedTicket.subject}</h3>
                                        <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${STATUS_MAP[selectedTicket.status].color}`}>
                                            {selectedTicket.status}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket #{selectedTicket._id?.slice(-6)} • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedTicket.status !== 'resolved' && (
                                        <button 
                                            onClick={() => handleUpdateTicket(selectedTicket._id, 'resolved')}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-black/40 active:scale-95 transition-all"
                                        >
                                            Resolve
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setSelectedTicket(null)}
                                        className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Issue Details */}
                                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-slate-200 ">
                                            <User size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{selectedTicket.user?.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedTicket.user?.phone} • {selectedTicket.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-widest italic">Issue Context:</p>
                                        <p className="text-[12px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                                            {selectedTicket.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Timeline / Responses */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 italic">Protocol History</p>
                                    <div className="space-y-3">
                                        {selectedTicket.responses?.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No response recorded yet</p>
                                            </div>
                                        ) : (
                                            selectedTicket.responses.map((res, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shrink-0 border border-brand/20">
                                                        <MessageCircle size={14} className="text-white" />
                                                    </div>
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 flex-1 ">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Admin Agent</p>
                                                            <p className="text-[8px] font-bold text-slate-400">{new Date(res.createdAt).toLocaleString()}</p>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                                                            {res.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 bg-slate-50/30">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <textarea 
                                            rows={2}
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Write admin response or status note..."
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-[11px] font-bold uppercase outline-none focus:border-brand/30 transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => handleUpdateTicket(selectedTicket._id, 'in_progress', replyMessage)}
                                            disabled={actioning || !replyMessage.trim()}
                                            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30"
                                        >
                                            <Send size={14} /> Reply
                                        </button>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleUpdateTicket(selectedTicket._id, 'resolved', 'Issue resolved by support desk')}
                                                className="flex-1 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase tracking-widest"
                                            >
                                                Resolve Only
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-2 border border-slate-100 shadow-inner">
                                <MessageCircle size={48} className="text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tight">Select a Ticket</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Select specialized issue from the left panel to begin resolution protocol.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportTicketsSection;
