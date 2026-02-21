import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronDown, Phone, MessageSquare,
    Mail, Search, Zap, Send, X, Bot, User, Paperclip, Smile
} from 'lucide-react';

// ─────────────────────────────────────────────
//  FAQ DATA
// ─────────────────────────────────────────────
const FAQS = [
    {
        category: 'Booking',
        items: [
            { q: 'How quickly does a captain arrive?', a: 'Our AI matches a captain within 60 seconds. Typical arrival time is 20–30 minutes for Instant Wash, depending on your city zone.' },
            { q: 'Can I reschedule my booking?', a: 'Yes! You can reschedule up to 2 hours before your scheduled slot without any cancellation fee via My Bookings.' },
            { q: 'What if no captain is available?', a: 'You\'ll receive a full refund instantly to your Hoora Wallet if we can\'t find a match. This happens in less than 0.1% of cases.' },
        ],
    },
    {
        category: 'Payment & Cashback',
        items: [
            { q: 'When is my 100% cashback credited?', a: 'HOORAFIRST cashback is credited within 30 minutes of wash completion, directly to your Hoora Wallet.' },
            { q: 'Can I pay with multiple methods?', a: 'Currently, each booking requires one payment method. You can use Wallet + UPI in a future update.' },
            { q: 'How do I withdraw my wallet balance?', a: 'Go to Wallet → Withdraw. Minimum withdrawal is ₹100. Amount reaches your bank in 2–3 business days.' },
        ],
    },
    {
        category: 'Safety & Quality',
        items: [
            { q: 'Are all captains background verified?', a: 'Yes. Every Hoora Captain undergoes a 3-step verification: govt. ID check, criminal record check, and Hoora skill certification.' },
            { q: 'What if my car gets damaged?', a: 'All washes are covered by Hoora\'s ₹5 Lakh Ecosystem Guarantee. File a claim within 24 hours via the app.' },
            { q: 'Is the cleaning solution safe for my paint?', a: 'Absolutely. We use OECD-certified, pH-neutral, waterless foam that is proven safe on all automotive paint finishes.' },
        ],
    },
];

// ─────────────────────────────────────────────
//  BOT RESPONSE LOGIC
// ─────────────────────────────────────────────
const BOT_RESPONSES = [
    { trigger: ['captain', 'arrive', 'eta', 'time'], reply: 'Our AI matches a captain within 60 seconds! Typical ETA is 20–30 minutes. You can track your captain live on the map. 🗺️' },
    { trigger: ['reschedule', 'cancel', 'change'], reply: 'You can reschedule or cancel up to 2 hours before your slot with zero fee. Go to **My Bookings** → tap on the booking → Reschedule. ✅' },
    { trigger: ['cashback', 'refund', 'wallet', 'money'], reply: 'HOORAFIRST cashback is credited to your Hoora Wallet within 30 minutes of wash completion. Wallet withdrawals take 2–3 business days. 💸' },
    { trigger: ['damage', 'scratch', 'dent', 'safe', 'safety'], reply: 'Every wash is covered by our ₹5 Lakh Ecosystem Guarantee. If you notice any issue, go to Help → Raise a Claim within 24 hours. 🛡️' },
    { trigger: ['payment', 'pay', 'upi', 'card'], reply: 'We accept UPI, Credit/Debit cards, and Hoora Wallet. Each booking currently supports one payment method per transaction. 💳' },
    { trigger: ['hi', 'hello', 'hey', 'namaste'], reply: 'Hello! 👋 I\'m Hoora\'s AI support assistant. I can help you with bookings, payments, safety, and more. What\'s on your mind?' },
    { trigger: ['thank', 'thanks', 'great', 'ok'], reply: 'Happy to help! 😊 Is there anything else you\'d like to know about Hoora?' },
    { trigger: ['human', 'agent', 'person', 'support', 'call'], reply: 'To connect with a live human agent, tap **Call Us** on the Help page. We\'re available Mon–Sun, 6 AM – 11 PM IST. ☎️' },
    { trigger: ['captain', 'verify', 'background', 'trust'], reply: 'All Hoora Captains are 3-step verified: govt. ID check, criminal record check, and Hoora\'s own skill certification. 👮' },
];

const getBotReply = (message) => {
    const lower = message.toLowerCase();
    for (const r of BOT_RESPONSES) {
        if (r.trigger.some(t => lower.includes(t))) return r.reply;
    }
    return 'Thanks for your message! While I process this, you can also browse our FAQ below or call us for immediate help. 📋';
};

const QUICK_CHIPS = ['Track my order', 'Cancel booking', 'Cashback status', 'Talk to agent'];

// ─────────────────────────────────────────────
//  CHAT SHEET
// ─────────────────────────────────────────────
const ChatSheet = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, from: 'bot', text: 'Hey there! 👋 I\'m **Hoora AI**, your 24/7 support assistant. How can I help you today?', time: 'just now' },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');

        const userMsg = { id: Date.now(), from: 'user', text: msg, time: 'just now' };
        setMessages(prev => [...prev, userMsg]);

        // simulate bot typing → reply
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            const reply = getBotReply(msg);
            setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: reply, time: 'just now' }]);
        }, 1200 + Math.random() * 600);
    };

    // Render bold markdown **text**
    const renderText = (text) =>
        text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : part
        );

    return (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-[100] flex flex-col shadow-2xl"
            style={{ height: '85vh' }}>

            {/* ── Chat Header ── */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                        <Bot size={20} className="text-white" strokeWidth={2} />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                    <p className="font-black text-sm text-content tracking-tight">Hoora AI Support</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Online · Replies in &lt;2 min</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-content-muted hover:bg-gray-200 transition-colors">
                    <X size={15} strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 self-end mb-1 ${msg.from === 'bot' ? 'bg-brand/10' : 'bg-content'}`}>
                            {msg.from === 'bot'
                                ? <Bot size={13} className="text-brand" strokeWidth={2} />
                                : <User size={13} className="text-white" strokeWidth={2} />}
                        </div>
                        {/* Bubble */}
                        <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${msg.from === 'bot'
                                ? 'bg-gray-50 border border-gray-100 text-content rounded-tl-md'
                                : 'bg-brand text-white rounded-tr-md'
                            }`}>
                            {renderText(msg.text)}
                        </div>
                    </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typing && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex gap-2 items-end">
                            <div className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                                <Bot size={13} className="text-brand" strokeWidth={2} />
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
                                {[0, 1, 2].map(i => (
                                    <motion.span key={i} className="w-1.5 h-1.5 bg-content-subtle rounded-full"
                                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* ── Quick Chips ── */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                {QUICK_CHIPS.map(chip => (
                    <button key={chip} onClick={() => sendMessage(chip)}
                        className="flex-shrink-0 px-3 py-1.5 bg-brand/8 border border-brand/15 rounded-xl text-[10px] font-black text-brand uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all"
                        style={{ background: 'rgba(255,107,0,0.07)' }}>
                        {chip}
                    </button>
                ))}
            </div>

            {/* ── Input bar ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0 pb-6">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5">
                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message…"
                        className="flex-1 bg-transparent text-sm font-medium text-content outline-none placeholder:text-content-subtle" />
                    <button className="text-content-subtle hover:text-content-muted transition-colors">
                        <Smile size={16} strokeWidth={2} />
                    </button>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${input.trim() ? 'bg-brand shadow-md shadow-brand/25' : 'bg-gray-100'}`}>
                    <Send size={16} className={input.trim() ? 'text-white' : 'text-gray-300'} strokeWidth={2.5} />
                </motion.button>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
const HelpSupport = () => {
    const navigate = useNavigate();
    const [openItem, setOpenItem] = useState(null);
    const [search, setSearch] = useState('');
    const [showChat, setShowChat] = useState(false);

    const filtered = FAQS.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            !search || item.q.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter(cat => cat.items.length > 0);

    const handleQuickAction = (label) => {
        if (label === 'Call Us') { window.location.href = 'tel:+918069100000'; return; }
        if (label === 'Live Chat') { setShowChat(true); return; }
        if (label === 'Email') { window.location.href = 'mailto:support@hoora.in'; return; }
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Chat Overlay ── */}
            <AnimatePresence>
                {showChat && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[99]" onClick={() => setShowChat(false)} />
                        <ChatSheet onClose={() => setShowChat(false)} />
                    </>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Help &amp; Support</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">24/7 Ecosystem Support</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <Search size={16} className="text-content-subtle flex-shrink-0" strokeWidth={2.5} />
                    <input placeholder="Search your question…" value={search} onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold text-content outline-none placeholder:text-content-subtle placeholder:font-medium" />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-content-subtle">
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">

                {/* ── Quick Actions ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <Phone size={20} className="text-green-600" />, label: 'Call Us', sub: '24/7', bg: 'bg-green-50 border-green-100' },
                        { icon: <MessageSquare size={20} className="text-blue-600" />, label: 'Live Chat', sub: '< 2 min', bg: 'bg-blue-50 border-blue-100', active: true },
                        { icon: <Mail size={20} className="text-violet-600" />, label: 'Email', sub: '< 4 hrs', bg: 'bg-violet-50 border-violet-100' },
                    ].map(a => (
                        <motion.button key={a.label} whileTap={{ scale: 0.93 }}
                            onClick={() => handleQuickAction(a.label)}
                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border ${a.bg} transition-all relative overflow-hidden`}>
                            {a.active && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft border border-white">{a.icon}</div>
                            <div className="text-center">
                                <p className="font-black text-xs text-content">{a.label}</p>
                                <p className="text-[8px] font-bold text-content-subtle">{a.sub}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* ── AI Bot Banner ── */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)}
                    className="bg-content rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                    <div className="w-11 h-11 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 relative">
                        <Zap size={20} className="text-white" fill="white" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-content" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Hoora AI Support Bot</p>
                        <p className="text-white/50 text-[9px] font-bold">Instant answers, anytime · Click to chat</p>
                    </div>
                    <div className="bg-brand text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <MessageSquare size={12} strokeWidth={2.5} />
                        Chat
                    </div>
                </motion.div>

                {/* ── FAQ Sections ── */}
                {filtered.map(cat => (
                    <section key={cat.category} className="space-y-2">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">{cat.category}</p>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                            {cat.items.map((item, i) => (
                                <div key={item.q} className={i < cat.items.length - 1 ? 'border-b border-gray-50' : ''}>
                                    <button onClick={() => setOpenItem(openItem === item.q ? null : item.q)}
                                        className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors">
                                        <p className={`text-sm font-black tracking-tight leading-snug flex-1 transition-colors ${openItem === item.q ? 'text-brand' : 'text-content'}`}>{item.q}</p>
                                        <motion.div animate={{ rotate: openItem === item.q ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-0.5">
                                            <ChevronDown size={16} strokeWidth={2.5} className={openItem === item.q ? 'text-brand' : 'text-content-subtle'} />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {openItem === item.q && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.22 }} className="overflow-hidden">
                                                <div className="px-4 pb-4">
                                                    <div className="bg-brand/5 rounded-xl p-3.5 border border-brand/10">
                                                        <p className="text-[11px] font-bold text-content-muted leading-relaxed">{item.a}</p>
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
                        <p className="font-black text-content-subtle text-sm">No results for "{search}"</p>
                        <p className="text-[10px] text-content-subtle font-bold mt-1">Try different keywords or chat with us</p>
                        <button onClick={() => setShowChat(true)} className="mt-4 bg-brand text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest">
                            Open Chat
                        </button>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="text-center space-y-1 pt-2 pb-4">
                    <p className="text-[9px] font-bold text-content-subtle">Hoora Ecosystem Support · v4.2.0</p>
                    <p className="text-[9px] font-bold text-content-subtle">Mon–Sun · 6 AM – 11 PM IST</p>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
