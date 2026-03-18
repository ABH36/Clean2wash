import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronLeft, Copy, Share2, Users, Trophy, Check } from 'lucide-react';
import { referralAPI } from '../../../utils/api';

const ReferEarn = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [referralData, setReferralData] = useState({
        referralCode: 'WASH50PA',
        referralsCount: 0,
        totalEarnings: 0,
        rewardDetails: {
            userGets: '₹50',
            friendGets: '₹50',
            subtitle: 'Refer a friend and you both get ₹50 credits on the next premium wash!'
        }
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await referralAPI.getStats();
                if (res.status === 'success') {
                    setReferralData(res.data);
                }
            } catch (err) {
                console.error("Failed to load referral stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralData.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Clean-2-Wash Referral',
            text: `Get ${referralData.rewardDetails.friendGets} off on your first premium car wash with my code: ${referralData.referralCode}`,
            url: window.location.origin
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopy();
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const stats = [
        { label: 'Referrals', value: referralData.referralsCount.toString().padStart(2, '0'), icon: Users },
        { label: 'Earned', value: `₹${referralData.totalEarnings}`, icon: Trophy }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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
                            {referralData.rewardDetails.subtitle}
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
                        <span className="flex-1 font-mono text-xl font-black text-content tracking-[0.3em] uppercase italic text-center">
                            {referralData.referralCode}
                        </span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                            <button 
                                onClick={handleCopy}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 text-brand active:scale-95 transition-all"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Check size={16} />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Copy size={16} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Primary CTA */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShare}
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
