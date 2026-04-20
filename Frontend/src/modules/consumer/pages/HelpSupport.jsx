import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronDown,
    Phone,
    MessageSquare,
    Mail,
    Search,
    Zap,
    Send,
    X,
    Bot,
    Smile,
    AlertCircle,
    ClipboardList,
    CheckCircle2,
    Clock as ClockIcon,
    ArrowRight
} from 'lucide-react';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const FAQS = [
    {
        category: 'Trip Booking',
        items: [
            {
                q: 'How quickly will a driver be assigned?',
                a: 'The system starts matching instantly after payment. Assignment time depends on nearby online drivers and can vary by zone.'
            },
            {
                q: 'Can I cancel my request?',
                a: 'You can cancel until a driver accepts your request. After acceptance, cancellation follows the spare driver policy and charges if applicable.'
            },
            {
                q: 'How can I track my trip status?',
                a: 'Open My Bookings or the live trip screen to see request status, driver movement, and current stage updates.'
            }
        ]
    },
    {
        category: 'Fare and Wallet',
        items: [
            {
                q: 'How are extra charges applied?',
                a: 'Waiting and extension charges are calculated from active trip timing and added before final closure.'
            },
            {
                q: 'Do locked wallet funds get adjusted automatically?',
                a: 'Yes. Locked funds are settled automatically after trip completion based on final fare and deductions.'
            },
            {
                q: 'How do I withdraw wallet balance?',
                a: 'Go to Wallet, choose Withdraw, enter amount, and submit. Transfer timeline depends on your linked payout channel.'
            }
        ]
    },
    {
        category: 'Safety and Support',
        items: [
            {
                q: 'How do I use SOS during a trip?',
                a: 'Tap SOS from the active trip screen. The system opens the emergency flow and shares the required live trip context.'
            },
            {
                q: 'How can I report driver behavior issues?',
                a: 'Open spare driver support and submit an issue with details. Admin can review trip logs and action the case.'
            },
            {
                q: 'How do I contact a human support agent?',
                a: 'Use Call or Live Chat from this page. For urgent situations, call emergency services immediately.'
            }
        ]
    }
];

const BOT_RESPONSES = [
    { trigger: ['driver', 'assign', 'matching', 'eta', 'time'], reply: 'Driver matching starts immediately after payment. You can track progress from the live trip screen.' },
    { trigger: ['cancel', 'cancellation'], reply: 'You can cancel until driver acceptance. After acceptance, cancellation policy rules apply automatically.' },
    { trigger: ['wallet', 'fare', 'extra', 'charge', 'payment'], reply: 'Wallet lock, fare, and extra charges are settled automatically at trip close based on final timing and usage.' },
    { trigger: ['sos', 'emergency', 'unsafe', 'help'], reply: 'For emergency situations, use SOS from active trip immediately. You can also call 112 right now.' },
    { trigger: ['human', 'agent', 'support', 'call'], reply: 'Tap Call us for direct support or use live chat for quick issue guidance.' },
    { trigger: ['hi', 'hello', 'hey'], reply: 'Hello. I can help with spare driver trips, fare, wallet, and safety workflows.' }
];

const QUICK_CHIPS = ['Track my trip', 'Cancel request', 'Fare issue', 'Talk to agent'];

const getBotReply = (message) => {
    const lower = message.toLowerCase();
    for (const item of BOT_RESPONSES) {
        if (item.trigger.some((triggerWord) => lower.includes(triggerWord))) {
            return item.reply;
        }
    }
    return 'I have logged your query. You can also open spare driver support for trip-linked issue handling.';
};

const ChatSheet = ({ onClose }) => {
    const { isDarkMode } = useTheme();
    const [messages, setMessages] = useState([
        { id: 1, from: 'bot', text: 'Welcome to Spare Driver support. How can I help you today?', time: 'just now' }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = (text) => {
        const msg = (text || input).trim();
        if (!msg) return;
        setInput('');
        setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text: msg, time: 'just now' }]);
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'bot', text: getBotReply(msg), time: 'just now' }]);
        }, 1000);
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md rounded-t-[3rem] z-[100] flex flex-col shadow-2xl border-t transition-colors duration-300 ${
                isDarkMode ? 'bg-[#0A0F0D] border-white/10 shadow-black/50' : 'bg-white border-black/5 shadow-black/10'
            }`}
            style={{ height: '88vh' }}
        >
            <div className={`flex items-center gap-4 px-6 pt-8 pb-6 border-b flex-shrink-0 ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                <div className="relative">
                    <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                        <Bot size={24} className="text-[#F59E0B]" strokeWidth={2} />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-[#0A0F0D]" />
                </div>
                <div className="flex-1">
                    <p className={`font-black text-base tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>AI Intelligence</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 ">Operational • Instant Resp</p>
                </div>
                <button onClick={onClose} className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all border ${isDarkMode ? 'bg-white/5 text-white/40 border-white/5' : 'bg-black/5 text-black/40 border-black/5'}`}>
                    <X size={18} strokeWidth={3} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message) => (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${message.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end mb-1 ${
                            message.from === 'bot' 
                                ? (isDarkMode ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/20' : 'bg-[#F59E0B]/05 border border-[#F59E0B]/10') 
                                : (isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10')
                        }`}>
                            {message.from === 'bot' ? <Bot size={14} className="text-[#F59E0B]" strokeWidth={2.5} /> : <div className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>U</div>}
                        </div>
                        <div className={`max-w-[75%] px-5 py-3.5 rounded-[1.5rem] text-[13px] font-black uppercase leading-relaxed ${
                            message.from === 'bot' 
                                ? (isDarkMode ? 'bg-white/[0.03] border border-white/5 text-white/80' : 'bg-black/[0.03] border border-black/5 text-black/80') 
                                : (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                        } ${message.from === 'bot' ? 'rounded-tl-md' : 'rounded-tr-md'}`}>
                            {message.text}
                        </div>
                    </motion.div>
                ))}

                <AnimatePresence>
                    {typing && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 items-end">
                            <div className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                                <Bot size={13} className="text-brand" strokeWidth={2} />
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
                                {[0, 1, 2].map((index) => (
                                    <motion.span key={index} className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            <div className="px-4 pb-4 flex gap-2.5 overflow-x-auto scrollbar-none flex-shrink-0">
                {QUICK_CHIPS.map((chip) => (
                    <button key={chip} onClick={() => sendMessage(chip)} className={`flex-shrink-0 h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap active:scale-95 transition-all hover:text-[#F59E0B] hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/5 border ${
                        isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/40' : 'bg-black/[0.03] border-black/10 text-black/40'
                    }`}>
                        {chip}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4 px-4 py-4 border-t border-white/5 bg-[#0A0F0D] flex-shrink-0 pb-10">
                <div className="flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 shadow-inner">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Transmit intelligence request..."
                        className="flex-1 bg-transparent text-[13px] font-black uppercase italic italic-black text-white outline-none placeholder:text-white/10"
                    />
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage()} disabled={!input.trim()} className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-2xl ${input.trim() ? 'bg-white text-black shadow-white/10' : 'bg-white/5 text-white/10'}`}>
                    <Send size={18} strokeWidth={3} />
                </motion.button>
            </div>
        </motion.div>
    );
};

const TicketSheet = ({ onClose }) => {
    const { isDarkMode } = useTheme();
    const [form, setForm] = useState({ category: 'TRIP_ISSUE', subject: '', description: '', priority: 'medium' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await apiClient.post('/support/tickets', form);
            if (res.status === 'success') {
                setSubmitted(true);
                setTimeout(() => onClose(), 2500);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to submit ticket');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed bottom-0 inset-x-0 rounded-t-[3rem] z-[1002] p-10 text-center flex flex-col items-center justify-center space-y-6 border-t transition-all duration-300 ${isDarkMode ? 'bg-[#0A0F0D] border-white/10' : 'bg-white border-black/5'}`} style={{ height: '70vh' }}>
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-4 border shadow-2xl ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/05' : 'bg-emerald-50 border-emerald-500/10 shadow-emerald-500/05'}`}>
                    <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={3} />
                </div>
                <h3 className={`text-3xl font-black text-white tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>Protocol Lodged</h3>
                <p className={`text-[11px] font-black uppercase tracking-[0.3em] max-w-[240px] leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Intelligence review expected within 120 cycles. Monitoring in dashboard.</p>
                <div className="mt-10 w-12 h-1 bg-[#F59E0B] rounded-full animate-pulse shadow-[0_0_15px_#F59E0B]" />
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed bottom-0 inset-x-0 rounded-t-[3rem] z-[1002] p-8 shadow-2xl flex flex-col border-t transition-all duration-300 ${
            isDarkMode ? 'bg-[#0A0F0D] border-white/10 shadow-black/80' : 'bg-white border-black/5 shadow-black/10'
        }`} style={{ height: '90vh' }}>
            <div className="flex items-center justify-between mb-10 overflow-hidden">
                <div className="flex-1">
                    <h2 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Dossier Submission</h2>
                    <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-[0.2em] mt-2">Operational response in 120m</p>
                </div>
                <button onClick={onClose} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-black/40'}`}>
                    <X size={20} strokeWidth={3} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pb-10 scrollbar-none">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Protocol Categorization</p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'TRIP_ISSUE', label: 'Trip Ops' },
                            { id: 'PAYMENT_WALLET', label: 'Settlement' },
                            { id: 'SAFETY_SOS', label: 'Safeguard' },
                            { id: 'ACCOUNT_APP', label: 'Intelligence' }
                        ].map(cat => (
                            <button type="button" key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                                className={`h-14 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-[0.2em] italic ${form.category === cat.id ? 'bg-white text-black border-white shadow-2xl' : 'bg-white/[0.03] border-white/5 text-white/20'}`}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Subject Vector</p>
                    <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Identify operational gap..." className={`w-full h-15 rounded-2xl px-6 text-[13px] font-black uppercase outline-none transition-all shadow-inner border ${
                        isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/30' : 'bg-black/[0.02] border-black/10 text-black focus:border-[#F59E0B]/30'
                    }`} />
                </div>

                <div className="space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Explanatory Dossier</p>
                    <textarea rows={6} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="Detail the divergence in protocol..." className={`w-full rounded-[2rem] px-6 py-5 text-[13px] font-black uppercase outline-none transition-all resize-none leading-relaxed shadow-inner border ${
                        isDarkMode ? 'bg-white/[0.03] border-white/10 text-white focus:border-[#F59E0B]/30' : 'bg-black/[0.02] border-black/10 text-black focus:border-[#F59E0B]/30'
                    }`} />
                </div>

                <button type="submit" disabled={loading} className="w-full h-16 bg-[#F59E0B] text-black rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 mt-10">
                    {loading ? <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" /> : <Send size={20} strokeWidth={3} />}
                    Transmit Declaration
                </button>
            </form>
        </motion.div>
    );
};

const HelpSupport = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [openItem, setOpenItem] = useState(null);
    const [search, setSearch] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [showTicket, setShowTicket] = useState(false);
    const [myTickets, setMyTickets] = useState([]);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await apiClient.get('/support/tickets');
                if (res.status === 'success') setMyTickets(res.data.tickets);
            } catch (err) {}
        };
        fetchTickets();
    }, []);

    const filtered = FAQS.map((category) => ({
        ...category,
        items: category.items.filter((item) => !search || item.q.toLowerCase().includes(search.toLowerCase()))
    })).filter((category) => category.items.length > 0);

    const handleQuickAction = (label) => {
        if (label === 'Call us') {
            window.location.href = 'tel:+918069100000';
            return;
        }
        if (label === 'Live chat') {
            const message = encodeURIComponent("Hi, I need assistance with my Clean2Wash service issue.");
            window.open(`https://wa.me/918069100000?text=${message}`, '_blank');
            return;
        }
        if (label === 'Raise Ticket') {
            setShowTicket(true);
            return;
        }
        if (label === 'Email') {
            window.location.href = 'mailto:support@clean2wash.com';
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
            <AnimatePresence>
                {showChat && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[99]" onClick={() => setShowChat(false)} />
                        <ChatSheet onClose={() => setShowChat(false)} />
                    </>
                )}
                {showTicket && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[1001]" onClick={() => setShowTicket(false)} />
                        <TicketSheet onClose={() => setShowTicket(false)} />
                    </>
                )}
            </AnimatePresence>

            <header className={`px-4 pt-10 pb-6 sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/80 border-black/5'}`}>
                <div className="flex items-center gap-4 mb-6">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className={`w-9 h-9 border rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                        <ChevronLeft size={18} strokeWidth={3} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </motion.button>
                    <div>
                        <h1 className={`text-lg font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Intelligence Hub</h1>
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#D97706]'}`}>Operational guidance repository</p>
                    </div>
                </div>
                <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-inner border ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-black/10'}`}>
                    <Search size={18} className={`${isDarkMode ? 'text-white/20' : 'text-black/30'} flex-shrink-0`} strokeWidth={3} />
                    <input
                        placeholder="Scan knowledge base..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`flex-1 bg-transparent text-[13px] font-black uppercase outline-none ${isDarkMode ? 'text-white placeholder:text-white/10' : 'text-black placeholder:text-black/20'}`}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className={isDarkMode ? 'text-white/40' : 'text-black/40'}>
                            <X size={16} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { icon: <Phone size={20} className="text-emerald-500" />, label: 'Call', sub: '24/7', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                        { icon: <MessageSquare size={20} className="text-blue-500" />, label: 'Chat', sub: 'WA', bg: 'bg-blue-500/5', border: 'border-blue-500/10' },
                        { icon: <ClipboardList size={20} className="text-[#F59E0B]" />, label: 'Ticket', sub: 'New', bg: 'bg-[#F59E0B]/5', border: 'border-[#F59E0B]/10' },
                        { icon: <Mail size={20} className="text-violet-500" />, label: 'Email', sub: '< 4h', bg: 'bg-violet-500/5', border: 'border-violet-500/10' }
                    ].map((action) => (
                        <motion.button key={action.label} whileTap={{ scale: 0.93 }} onClick={() => handleQuickAction(action.label === 'Ticket' ? 'Raise Ticket' : action.label === 'Chat' ? 'Live chat' : action.label === 'Call' ? 'Call us' : action.label)} className={`flex flex-col items-center gap-3 py-6 rounded-[2rem] border transition-all ${action.border} ${action.bg}`}>
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-black/5'}`}>{action.icon}</div>
                            <div className="text-center">
                                <p className={`font-black text-[10px] uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{action.label}</p>
                                <p className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1.5 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{action.sub}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* My Recent Tickets */}
                {myTickets.length > 0 && (
                    <div className="bg-white/[0.03] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                <ClockIcon size={14} className="text-[#F59E0B]" /> Operational Dossiers
                            </h3>
                            <span className="bg-white text-black text-[9px] font-black px-3 py-1 rounded-full uppercase italic">{myTickets.length} ACTIVE</span>
                        </div>
                        <div className="space-y-3">
                            {myTickets.slice(0, 2).map(ticket => (
                                <div key={ticket._id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between backdrop-blur-xl">
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-black text-white uppercase italic italic-black tracking-tighter truncate">{ticket.subject}</p>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1.5 italic">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic ${ticket.status === 'open' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {ticket.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)} className={`rounded-[2rem] p-5 flex items-center gap-5 cursor-pointer shadow-2xl relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white text-black' : 'bg-[#0F172A] text-white'}`}>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-black/5 blur-3xl -mr-16 -mt-16" />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative shadow-2xl ${isDarkMode ? 'bg-black shadow-black/20' : 'bg-white/10 shadow-black/50'}`}>
                        <Zap size={24} className="text-[#F59E0B]" fill="#F59E0B" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white" />
                    </div>
                    <div className="flex-1">
                        <p className={`font-black text-base uppercase tracking-tighter leading-none ${isDarkMode ? 'text-black' : 'text-white'}`}>AI Specialist</p>
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${isDarkMode ? 'text-black/40' : 'text-white/40'}`}>Instant Trip Guidance</p>
                    </div>
                    <div className={`font-black text-[10px] h-11 px-5 rounded-xl flex items-center gap-3 uppercase tracking-widest ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        <MessageSquare size={14} strokeWidth={3} />
                        Sync
                    </div>
                </motion.div>

                {filtered.map((category) => (
                    <section key={category.category} className="space-y-4">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] px-2 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{category.category}</p>
                        <div className={`rounded-[2.5rem] border overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'}`}>
                            {category.items.map((item, index) => (
                                <div key={item.q} className={index < category.items.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-black/5') : ''}>
                                    <button onClick={() => setOpenItem(openItem === item.q ? null : item.q)} className="w-full flex items-start justify-between gap-4 px-6 py-6 text-left hover:bg-black/[0.02] transition-colors">
                                        <p className={`text-[13px] font-black tracking-tighter uppercase leading-snug flex-1 transition-colors ${openItem === item.q ? 'text-[#F59E0B]' : (isDarkMode ? 'text-white/80' : 'text-black/80')}`}>{item.q}</p>
                                        <motion.div animate={{ rotate: openItem === item.q ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0 mt-1">
                                            <ChevronDown size={18} strokeWidth={3} className={openItem === item.q ? 'text-[#F59E0B]' : (isDarkMode ? 'text-white/20' : 'text-black/20')} />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {openItem === item.q && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "circOut" }} className="overflow-hidden">
                                                <div className="px-6 pb-6">
                                                    <div className={`rounded-2xl p-5 border relative ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-[#FAF6EB] border-black/5'}`}>
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] rounded-full" />
                                                        <p className={`text-[12px] font-black uppercase tracking-widest leading-relaxed ml-2 ${isDarkMode ? 'text-white/40' : 'text-black/50'}`}>{item.a}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="font-black text-slate-400 text-sm">No results for "{search}"</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Try another keyword or open live chat</p>
                        <button onClick={() => setShowChat(true)} className="mt-4 bg-brand text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest">
                            Open chat
                        </button>
                    </div>
                )}

                <div className="text-center space-y-1 pt-2 pb-4">
                <div className="text-center space-y-2 pt-6 pb-12">
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/10' : 'text-black/10'}`}>Operational Support Desk • v2.0</p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/10' : 'text-black/10'}`}>Protocol Window • 06:00 - 23:00 IST</p>
                </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
