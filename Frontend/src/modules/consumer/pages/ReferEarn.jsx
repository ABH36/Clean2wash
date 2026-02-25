import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronLeft, Copy, Share2, Users, Trophy } from 'lucide-react';

const ReferEarn = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Referrals', value: '04', icon: Users },
        { label: 'Earned', value: '₹450', icon: Trophy }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white border-b border-gray-100">
                <button onClick={() => navigate(-1)}
                    className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-black text-content tracking-tight">Refer & Earn</h1>
                <div className="w-11" />
            </header>

            <div className="flex-1 px-6 py-8">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-[#FF6B00] to-[#FF9100] rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-brand/20 mb-8">
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-xl">
                            <Gift size={40} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-3">Share the Shine!</h2>
                        <p className="text-white/80 text-xs font-bold leading-relaxed max-w-[80%] mx-auto">
                            Refer a friend and you both get ₹50 credits on the next premium wash!
                        </p>
                    </div>
                    {/* Decorative Blur */}
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft text-center group">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-content-subtle group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                <s.icon size={20} />
                            </div>
                            <p className="text-sm font-black text-content leading-none">{s.value}</p>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Referral Code Box */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft mb-8">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-4 text-center">Your Referral Code</p>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed relative">
                        <span className="flex-1 font-mono text-xl font-black text-content tracking-[0.3em] uppercase italic text-center">WASH50PA</span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                            <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 text-brand active:scale-95 transition-all">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Primary CTA */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-16 bg-content text-white rounded-[2rem] font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-gray-200"
                >
                    <Share2 size={20} />
                    Share with Friends
                </motion.button>

                <p className="text-center mt-12 text-[10px] font-bold text-content-muted leading-relaxed uppercase tracking-widest">
                    *Credits will be added after your friend's <br />
                    first successful service completion.
                </p>
            </div>
        </div>
    );
};

export default ReferEarn;
