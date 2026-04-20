import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronLeft, Copy, Share2, Users, Trophy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { referralAPI } from '../../../utils/api';
import MobileLayout from '../components/layout/MobileLayout';
import { useTheme } from '../../../context/ThemeContext';

const ReferEarn = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
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
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-white'}`}>
                <div className={`w-10 h-10 border-[3px] rounded-full animate-spin ${isDarkMode ? 'border-white/10 border-t-[#F59E0B]' : 'border-black/5 border-t-black'}`} />
            </div>
        );
    }

    return (
        <MobileLayout>
            <div className={`min-h-screen flex flex-col font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                {/* ── Compact Header ── */}
                <header className={`px-5 pt-8 pb-4 sticky top-0 z-[60] border-b flex items-center justify-between backdrop-blur-md transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/5' : 'bg-white/80 border-black/05'
                }`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center border active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'
                        }`}>
                            <ChevronLeft size={22} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </button>
                        <div>
                            <h1 className={`text-[20px] font-[1000] tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Refer and earn</h1>
                            <p className={`text-[11px] font-black tracking-widest mt-1.5 uppercase ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Share with community</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-3 space-y-3">
                    {/* ── Ultra-Slim Elite Hero ── */}
                    <div className="relative bg-[#0F172A] rounded-3xl p-5 overflow-hidden shadow-2xl group">
                        <div className="absolute top-0 right-0 w-32 h-full bg-white/05 -skew-x-12 group-hover:bg-white/10 transition-all duration-700" />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                                <Gift size={28} className="text-[#FF9900]" />
                            </div>
                            <div>
                                <h2 className="text-[18px] font-[1000] text-white tracking-tight leading-none mb-1.5">Elite rewards</h2>
                                <p className="text-white/40 text-[10px] font-black leading-tight max-w-[180px]">
                                    {referralData.rewardDetails.subtitle}
                                </p>
                            </div>
                        </div>
                        <Sparkles size={40} className="absolute -right-2 -bottom-2 text-white/5 opacity-50" />
                    </div>

                    {/* ── 1-2-3 Guide ── */}
                    <div className="grid grid-cols-3 gap-2 px-1">
                        {[
                            { label: 'Share', icon: Share2, color: 'text-blue-500' },
                            { label: 'Book', icon: Sparkles, color: 'text-[#FF9900]' },
                            { label: 'Earn', icon: Trophy, color: 'text-emerald-500' }
                        ].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${step.color} ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
                                    <step.icon size={14} strokeWidth={3} />
                                </div>
                                <span className={`text-[8px] font-black tracking-widest uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{idx + 1}. {step.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Referral HUD ── */}
                    <div className={`p-4 pb-5 rounded-3xl border space-y-4 transition-all duration-300 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="text-center">
                            <p className={`text-[8px] font-black tracking-[0.2em] mb-3 uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Copy your key</p>
                            <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border border-dashed relative ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-[#FAF6EB] border-black/10'}`}>
                                <span className={`text-[20px] font-black tracking-[0.4em] font-mono leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {referralData.referralCode}
                                </span>
                                <button 
                                    onClick={handleCopy}
                                    className={`absolute right-2 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border text-[#FF9900] active:scale-95 transition-all ${
                                        isDarkMode ? 'bg-white/5 border-white/10 shadow-black/40' : 'bg-white border-black/05'
                                    }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {copied ? <Check key="check" size={16} strokeWidth={3} /> : <Copy key="copy" size={16} strokeWidth={2.5} />}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-3 pt-2">
                            {stats.map((s) => (
                                <div key={s.label} className={`p-3.5 rounded-2xl border flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/05' : 'bg-black/[0.02] border-black/05'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[#FF9900] shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <s.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`text-[14px] font-black leading-none mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>{s.value}</p>
                                        <p className={`text-[7px] font-black tracking-widest leading-none truncate uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* ── Compact Global Share ── */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleShare}
                        className={`w-full h-14 rounded-2xl font-black text-[13px] flex items-center justify-center gap-3 shadow-2xl transition-all border ${
                            isDarkMode ? 'bg-white text-black border-white/5 shadow-black/50' : 'bg-[#0F172A] text-white border-black/5 shadow-black/10'
                        }`}
                    >
                        <Share2 size={16} className="text-[#FF9900]" strokeWidth={3} />
                        Share invitation
                    </motion.button>

                    <div className={`p-5 rounded-3xl border transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/05 shadow-sm'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={14} className="text-emerald-500" strokeWidth={3} />
                            <p className={`text-[10px] font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>Ecosystem rules</p>
                        </div>
                        <p className={`text-[9px] font-black leading-relaxed ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                            Credits are added to your wallet upon your friend's first successful ride. Unlimited invites allowed.
                        </p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default ReferEarn;
