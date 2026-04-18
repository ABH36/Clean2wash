import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronLeft, Copy, Share2, Users, Trophy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { referralAPI } from '../../../utils/api';
import MobileLayout from '../components/layout/MobileLayout';

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
            title: 'Spare Driver referral',
            text: `Get ${referralData.rewardDetails.friendGets} off on your first premium car wash with my code: ${referralData.referralCode}`,
            url: window.location.origin
        };

        try {
            if (navigator.share) { await navigator.share(shareData); } 
            else { handleCopy(); }
        } catch (err) {}
    };

    const stats = [
        { label: 'Referrals', value: referralData.referralsCount.toString().padStart(2, '0'), icon: Users },
        { label: 'Total earned', value: `₹${referralData.totalEarnings}`, icon: Trophy }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-[3px] border-slate-100 border-t-brand rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <MobileLayout>
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Refer and earn</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Share with community</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Hero Card ── */}
                    <div className="relative bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden shadow-xl border border-white/5">
                        <div className="absolute top-0 right-0 w-48 h-full bg-brand/10 -skew-x-12" />
                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/10 shadow-inner">
                                <Gift size={32} className="text-brand" />
                            </div>
                            <h2 className="text-[24px] font-bold text-white tracking-tight leading-tight mb-2">Share the shine</h2>
                            <p className="text-white/40 text-[12px] font-medium leading-relaxed max-w-[85%] mx-auto">
                                {referralData.rewardDetails.subtitle}
                            </p>
                        </div>
                        <Sparkles size={60} className="absolute -left-4 -bottom-4 text-white/5 -rotate-12" />
                    </div>

                    {/* ── Referral Code ── */}
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-4">Your referral code</p>
                        <div className="flex items-center justify-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 border-dashed relative group">
                            <span className="text-[24px] font-bold text-slate-900 tracking-[0.3em] font-mono leading-none">
                                {referralData.referralCode}
                            </span>
                            <button 
                                onClick={handleCopy}
                                className="absolute right-3 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-50 text-brand active:scale-95 transition-all"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? <Check key="check" size={18} /> : <Copy key="copy" size={18} />}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <s.icon size={18} />
                                </div>
                                <p className="text-[18px] font-bold text-slate-900 leading-none mb-1.5">{s.value}</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Action ── */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleShare}
                        className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-bold text-[15px] flex items-center justify-center gap-3 shadow-xl active:bg-slate-800 transition-all border border-white/5"
                    >
                        <Share2 size={18} />
                        Share with friends
                    </motion.button>

                    <div className="bg-white/50 p-6 rounded-[2rem] border border-gray-100/50">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck size={18} className="text-emerald-500" />
                            <p className="text-[12px] font-bold text-slate-900">Program details</p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Credits will be automatically added to your wallet after your friend's first successful service completion. There is no limit on how many friends you can invite.
                        </p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default ReferEarn;
