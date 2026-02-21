import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Copy, Share2, Gift, Check, Users,
    Zap, ChevronRight, Award, ArrowRight
} from 'lucide-react';

const REFERRED_FRIENDS = [
    { name: 'Saurabh Jain', status: 'Wash Completed', reward: '+₹100', date: 'Feb 19', avatar: 'SJ', color: 'bg-violet-100 text-violet-700' },
    { name: 'Priya Sharma', status: 'Signed Up', reward: 'Pending', date: 'Feb 17', avatar: 'PS', color: 'bg-pink-100 text-pink-700' },
    { name: 'Arjun Mehra', status: 'Wash Completed', reward: '+₹100', date: 'Feb 14', avatar: 'AM', color: 'bg-blue-100 text-blue-700' },
];

const ReferEarn = () => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const code = 'AMAN2024';

    const handleCopy = () => {
        navigator.clipboard.writeText(code).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Refer & Earn</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Invite Friends · Get ₹100</p>
                    </div>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">

                {/* ── Hero Card ── */}
                <div className="bg-content rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Gift size={20} className="text-accent-yellow" />
                            <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">Referral Program</span>
                        </div>
                        <h2 className="text-white text-3xl font-black tracking-tighter leading-tight mb-2">
                            Earn <span className="text-brand">₹100</span><br />per referral
                        </h2>
                        <p className="text-white/50 text-sm font-medium leading-relaxed mb-6">
                            Your friend books their first wash → you both get ₹100 in Hoora Wallet instantly.
                        </p>

                        {/* Referral Code */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
                                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">Your Code</p>
                                <p className="text-white font-black text-xl tracking-[0.2em]">{code}</p>
                            </div>
                            <motion.button whileTap={{ scale: 0.92 }} onClick={handleCopy}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${copied ? 'bg-green-500' : 'bg-brand'}`}>
                                {copied ? <Check size={20} className="text-white" strokeWidth={3} /> : <Copy size={18} className="text-white" strokeWidth={2.5} />}
                            </motion.button>
                        </div>
                    </div>
                    {/* Decorations */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
                </div>

                {/* ── Share CTA ── */}
                <motion.button whileTap={{ scale: 0.97 }}
                    className="w-full h-12 bg-brand text-white rounded-2xl font-black text-sm shadow-md shadow-brand/25 flex items-center justify-center gap-2">
                    <Share2 size={16} strokeWidth={2.5} /> Share Invite Link
                </motion.button>

                {/* ── How It Works ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                    <h3 className="font-black text-sm text-content tracking-tight mb-4">How it works</h3>
                    <div className="space-y-4">
                        {[
                            { icon: <Share2 size={16} className="text-blue-500" />, title: 'Share your code', desc: 'Send your unique referral link or code to any friend.' },
                            { icon: <Users size={16} className="text-violet-500" />, title: 'Friend signs up', desc: 'They register on Hoora using your referral code.' },
                            { icon: <Zap size={16} className="text-brand" fill="currentColor" />, title: 'Both earn ₹100', desc: 'After their first completed wash, you both get rewarded.' },
                        ].map((step, i) => (
                            <div key={step.title} className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">{step.icon}</div>
                                <div>
                                    <p className="font-black text-sm text-content tracking-tight">{step.title}</p>
                                    <p className="text-[10px] font-bold text-content-subtle mt-0.5">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Earnings Summary ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Referred', value: '3', sub: 'Friends' },
                        { label: 'Earned', value: '₹200', sub: 'Total' },
                        { label: 'Pending', value: '₹100', sub: 'In Review' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-soft px-3 py-4 text-center">
                            <p className="text-xl font-black text-content tracking-tight leading-none">{s.value}</p>
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Referral History ── */}
                <section className="space-y-2">
                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Referral History</p>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {REFERRED_FRIENDS.map((f, i) => (
                            <div key={f.name} className={`flex items-center gap-3 px-4 py-3.5 ${i < REFERRED_FRIENDS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs ${f.color}`}>{f.avatar}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-content truncate">{f.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${f.status === 'Wash Completed' ? 'text-green-600' : 'text-amber-500'}`}>{f.status}</span>
                                        <span className="text-[8px] text-content-subtle font-bold">· {f.date}</span>
                                    </div>
                                </div>
                                <span className={`font-black text-sm flex-shrink-0 ${f.reward.startsWith('+') ? 'text-green-600' : 'text-amber-500'}`}>{f.reward}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── T&C ── */}
                <p className="text-[9px] font-bold text-content-subtle text-center px-4 leading-relaxed">
                    Referral rewards credited within 24hrs of friend's first wash. Max 50 referrals per account. <span className="underline text-brand">Terms apply.</span>
                </p>
            </div>
        </div>
    );
};

export default ReferEarn;
