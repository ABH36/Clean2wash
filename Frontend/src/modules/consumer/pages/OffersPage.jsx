import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Tag, Copy, Check, Clock, Zap, Gift, ChevronRight } from 'lucide-react';

const OFFERS = [
    {
        id: 1, code: 'HOORAFIRST', type: 'cashback',
        title: '100% Cashback',
        desc: 'Get your entire first wash free as Hoora Wallet balance.',
        expiry: 'Valid till Mar 31, 2026',
        minOrder: 'Min. ₹199',
        bg: 'from-orange-500 to-brand',
        textColor: 'text-white',
        badge: 'First Order',
        icon: <Zap size={20} fill="white" className="text-white" />,
    },
    {
        id: 2, code: 'DEEPCLEAN50', type: 'discount',
        title: '50% Off Deep Clean',
        desc: 'Book a Full Deep Clinical Wash and save up to ₹500.',
        expiry: 'Valid till Feb 28, 2026',
        minOrder: 'Min. ₹799',
        bg: 'from-violet-600 to-indigo-600',
        textColor: 'text-white',
        badge: 'Limited',
        icon: <Tag size={20} className="text-white" strokeWidth={2.5} />,
    },
    {
        id: 3, code: 'REFER100', type: 'referral',
        title: 'Referral Bonus',
        desc: 'Invite a friend and both of you get ₹100 in Hoora Wallet.',
        expiry: 'No expiry',
        minOrder: 'Per referral',
        bg: 'from-green-500 to-teal-500',
        textColor: 'text-white',
        badge: 'Referral',
        icon: <Gift size={20} className="text-white" />,
    },
    {
        id: 4, code: 'WEEKEND30', type: 'discount',
        title: '30% Weekend Offer',
        desc: 'Book any wash on Saturday or Sunday for 30% off.',
        expiry: 'Every weekend',
        minOrder: 'All services',
        bg: 'from-blue-500 to-cyan-400',
        textColor: 'text-white',
        badge: 'Weekly',
        icon: <Clock size={20} className="text-white" />,
    },
];

const OffersPage = () => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(null);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).catch(() => { });
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Offers & Coupons</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">{OFFERS.length} Active Offers</p>
                    </div>
                </div>
            </header>

            <div className="px-4 py-4 space-y-3 pb-24">

                {/* Banner */}
                <div className="bg-content rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">Hoora Rewards</p>
                        <h2 className="text-white text-2xl font-black tracking-tight leading-none">Save up to<br /><span className="text-brand">₹2,000</span> today</h2>
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-brand/20 rounded-full blur-2xl" />
                    <div className="absolute -right-2 -bottom-4 text-[80px] opacity-10 select-none">🎁</div>
                </div>

                {/* Offer Cards */}
                {OFFERS.map((offer, i) => (
                    <motion.div key={offer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                        {/* Gradient header */}
                        <div className={`bg-gradient-to-r ${offer.bg} px-5 py-4`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{offer.icon}</div>
                                    <span className="text-white/80 text-[8px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">{offer.badge}</span>
                                </div>
                                <span className="text-white/60 text-[9px] font-bold">{offer.expiry}</span>
                            </div>
                            <h3 className="text-white text-xl font-black tracking-tight leading-none mb-1">{offer.title}</h3>
                            <p className="text-white/70 text-[11px] font-medium leading-snug">{offer.desc}</p>
                        </div>

                        {/* Code + CTA row */}
                        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-1">Coupon Code</p>
                                <div className="flex items-center gap-2">
                                    <code className="font-black text-base text-content tracking-widest">{offer.code}</code>
                                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleCopy(offer.code)}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${copied === offer.code ? 'bg-green-500' : 'bg-gray-100'}`}>
                                        {copied === offer.code
                                            ? <Check size={13} className="text-white" strokeWidth={3} />
                                            : <Copy size={12} className="text-content-muted" strokeWidth={2.5} />
                                        }
                                    </motion.button>
                                </div>
                                <p className="text-[8px] font-bold text-content-subtle mt-0.5">{offer.minOrder}</p>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/services')}
                                className="flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-brand/20 flex-shrink-0">
                                Apply <ChevronRight size={12} strokeWidth={3} />
                            </motion.button>
                        </div>
                    </motion.div>
                ))}

                <p className="text-center text-[9px] font-bold text-content-subtle px-4 leading-relaxed">
                    Coupons cannot be combined. One offer per booking. Hoora reserves the right to modify any offer.
                </p>
            </div>
        </div>
    );
};

export default OffersPage;
