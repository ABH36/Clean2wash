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
    User,
    Smile
} from 'lucide-react';

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
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-[100] flex flex-col shadow-2xl"
            style={{ height: '85vh' }}
        >
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                        <Bot size={20} className="text-white" strokeWidth={2} />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                    <p className="font-black text-sm text-slate-900 tracking-tight">Spare Driver Assistant</p>
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Online • Replies in under 2 min</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-200 transition-colors">
                    <X size={15} strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message) => (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${message.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 self-end mb-1 ${message.from === 'bot' ? 'bg-brand/10' : 'bg-slate-900'}`}>
                            {message.from === 'bot' ? <Bot size={13} className="text-brand" strokeWidth={2} /> : <User size={13} className="text-white" strokeWidth={2} />}
                        </div>
                        <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${message.from === 'bot' ? 'bg-gray-50 border border-gray-100 text-slate-900 rounded-tl-md' : 'bg-brand text-white rounded-tr-md'}`}>
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
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
                                {[0, 1, 2].map((index) => (
                                    <motion.span key={index} className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                {QUICK_CHIPS.map((chip) => (
                    <button key={chip} onClick={() => sendMessage(chip)} className="flex-shrink-0 px-3 py-1.5 bg-brand/8 border border-brand/15 rounded-xl text-[10px] font-black text-brand uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all">
                        {chip}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0 pb-6">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Smile size={16} strokeWidth={2} />
                    </button>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => sendMessage()} disabled={!input.trim()} className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${input.trim() ? 'bg-brand shadow-md shadow-brand/25' : 'bg-gray-100'}`}>
                    <Send size={16} className={input.trim() ? 'text-white' : 'text-gray-300'} strokeWidth={2.5} />
                </motion.button>
            </div>
        </motion.div>
    );
};

const HelpSupport = () => {
    const navigate = useNavigate();
    const [openItem, setOpenItem] = useState(null);
    const [search, setSearch] = useState('');
    const [showChat, setShowChat] = useState(false);

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
            setShowChat(true);
            return;
        }
        if (label === 'Email') {
            window.location.href = 'mailto:support@clean2wash.com';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AnimatePresence>
                {showChat && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[99]" onClick={() => setShowChat(false)} />
                        <ChatSheet onClose={() => setShowChat(false)} />
                    </>
                )}
            </AnimatePresence>

            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Spare Driver Support</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Live trip and account help</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <Search size={16} className="text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                    <input
                        placeholder="Search your question..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-slate-400">
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <Phone size={20} className="text-green-600" />, label: 'Call us', sub: '24/7', bg: 'bg-green-50 border-green-100' },
                        { icon: <MessageSquare size={20} className="text-blue-600" />, label: 'Live chat', sub: '< 2 min', bg: 'bg-blue-50 border-blue-100', active: true },
                        { icon: <Mail size={20} className="text-violet-600" />, label: 'Email', sub: '< 4 hrs', bg: 'bg-violet-50 border-violet-100' }
                    ].map((action) => (
                        <motion.button key={action.label} whileTap={{ scale: 0.93 }} onClick={() => handleQuickAction(action.label)} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border ${action.bg} transition-all relative overflow-hidden`}>
                            {action.active && <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white">{action.icon}</div>
                            <div className="text-center">
                                <p className="font-black text-xs text-slate-900">{action.label}</p>
                                <p className="text-[8px] font-bold text-slate-400">{action.sub}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setShowChat(true)} className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                    <div className="w-11 h-11 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 relative">
                        <Zap size={20} className="text-white" fill="white" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Spare driver live assistant</p>
                        <p className="text-white/50 text-[9px] font-bold">Instant guidance for trip, wallet, and safety issues</p>
                    </div>
                    <div className="bg-brand text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <MessageSquare size={12} strokeWidth={2.5} />
                        Chat
                    </div>
                </motion.div>

                {filtered.map((category) => (
                    <section key={category.category} className="space-y-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">{category.category}</p>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            {category.items.map((item, index) => (
                                <div key={item.q} className={index < category.items.length - 1 ? 'border-b border-gray-50' : ''}>
                                    <button onClick={() => setOpenItem(openItem === item.q ? null : item.q)} className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors">
                                        <p className={`text-sm font-black tracking-tight leading-snug flex-1 transition-colors ${openItem === item.q ? 'text-brand' : 'text-slate-900'}`}>{item.q}</p>
                                        <motion.div animate={{ rotate: openItem === item.q ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-0.5">
                                            <ChevronDown size={16} strokeWidth={2.5} className={openItem === item.q ? 'text-brand' : 'text-slate-400'} />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {openItem === item.q && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                                                <div className="px-4 pb-4">
                                                    <div className="bg-brand/5 rounded-xl p-3.5 border border-brand/10">
                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{item.a}</p>
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
                    <p className="text-[9px] font-bold text-slate-400">Spare Driver Support Desk • v1.0</p>
                    <p className="text-[9px] font-bold text-slate-400">Mon-Sun • 6 AM - 11 PM IST</p>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
