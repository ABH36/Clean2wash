import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Activity, ShieldCheck, Heart, AlertTriangle,
    Calendar, ArrowRight, CheckCircle2, Info, Bell, Settings,
    FileText, Zap, ChevronRight, Filter, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const ComplianceCenter = () => {
    const navigate = useNavigate();
    const { vehicles } = useAuth();
    const [activeFilter, setActiveFilter] = useState('All');

    const stats = useMemo(() => {
        let totalScore = 0;
        let expiredCount = 0;
        let soonCount = 0;

        vehicles.forEach(v => {
            let vScore = 100;
            const now = new Date();

            if (v.insuranceExpiry) {
                const diff = new Date(v.insuranceExpiry) - now;
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                if (days < 0) { expiredCount++; vScore -= 50; }
                else if (days < 15) { soonCount++; vScore -= 20; }
            } else {
                vScore -= 30; // Missing data penalty
            }

            if (v.pucExpiry) {
                const diff = new Date(v.pucExpiry) - now;
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                if (days < 0) { expiredCount++; vScore -= 50; }
                else if (days < 7) { soonCount++; vScore -= 20; }
            } else {
                vScore -= 30;
            }

            totalScore += Math.max(0, vScore);
        });

        return {
            avgScore: vehicles.length ? Math.round(totalScore / vehicles.length) : 0,
            expired: expiredCount,
            soon: soonCount
        };
    }, [vehicles]);

    const getExpiryStatus = (date, type) => {
        if (!date) return { label: 'Not Set', color: 'text-gray-400', bg: 'bg-white/[0.02]', icon: Info };
        const now = new Date();
        const diff = new Date(date) - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return { label: 'Expired', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle, urgency: 'high' };
        const threshold = type === 'insurance' ? 15 : 7;
        if (days < threshold) return { label: `Due in ${days}d`, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', icon: Bell, urgency: 'medium' };
        return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2, urgency: 'low' };
    };

    return (
        <MobileLayout hideNav>
            <div className="bg-[#0A0F0D] min-h-screen font-outfit pb-24">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-[#0A0F0D]/90 border-b border-white/5 px-5 py-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <ChevronLeft size={16} className="text-white" strokeWidth={2.5} />
                            </motion.button>
                            <div>
                                <h1 className="text-base font-[1000] text-white tracking-tighter leading-none">Compliance center</h1>
                                <p className="text-[8px] font-black text-[#F59E0B] uppercase tracking-[0.3em] mt-1.5 animate-pulse">Certified intelligence active</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                                <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                            </div>
                            <Settings size={18} className="text-white/20" />
                        </div>
                    </div>
                </header>

                <div className="px-5 py-6 space-y-6">
                    {/* ── Fleet Health Score ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0F1412] rounded-[2rem] p-7 text-white relative overflow-hidden shadow-2xl border border-white/10"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fleet Health Score</p>
                                    <h2 className="text-5xl font-black tracking-tighter">{stats.avgScore}<span className="text-[14px] text-[#F59E0B] ml-1 uppercase">%</span></h2>
                                </div>
                                <div className="w-14 h-14 bg-[#F59E0B] text-black rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-[#F59E0B]/20">
                                    <Activity size={28} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${stats.avgScore}%` }}
                                    className={`h-full ${stats.avgScore > 80 ? 'bg-green-500' : stats.avgScore > 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest leading-none mb-1">Critical</p>
                                    <p className="text-sm font-black text-red-400">{stats.expired} Expired</p>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div>
                                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest leading-none mb-1">Warning</p>
                                    <p className="text-sm font-black text-orange-400">{stats.soon} Due Soon</p>
                                </div>
                            </div>
                        </div>
                        <ShieldCheck size={140} className="absolute -bottom-10 -right-10 text-white/[0.03] -rotate-12 pointer-events-none" />
                    </motion.div>

                    {/* ── User KYC Status (The Missing Piece) ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] rounded-[2rem] p-5 border border-white/5 flex items-center justify-between relative overflow-hidden backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${useAuth().user?.isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]'}`}>
                                <ShieldCheck size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-black text-white">Identity protocol</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1.5">
                                    {useAuth().user?.isVerified ? 'Prot Level 2 Active' : 'Unverified Instance'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/kyc-verification')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${useAuth().user?.isVerified ? 'bg-white/5 text-white/40 border border-white/5' : 'bg-[#F59E0B] text-black shadow-2xl shadow-[#F59E0B]/20'}`}
                        >
                            {useAuth().user?.isVerified ? 'Secure' : 'Verify'}
                        </button>
                    </motion.div>

                    {/* ── Filters ── */}
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                        {['All', 'Expired', 'Insurance', 'PUC'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${activeFilter === f ? 'bg-white text-black border-white shadow-2xl' : 'bg-white/[0.03] text-white/20 border-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* ── Vehicle Compliance Cards ── */}
                    <div className="space-y-4">
                        {vehicles.length === 0 ? (
                            <div className="bg-white/5 rounded-2xl border border-dashed border-white/10 py-16 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <Zap size={32} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No vehicles found in garage</p>
                                <button onClick={() => navigate('/vehicles?from=compliance-center')} className="text-[10px] font-black text-brand uppercase underline">Add vehicle</button>
                            </div>
                        ) : (
                            vehicles.map((v, i) => {
                                const ins = getExpiryStatus(v.insuranceExpiry, 'insurance');
                                const puc = getExpiryStatus(v.pucExpiry, 'puc');

                                return (
                                    <motion.div
                                        key={v.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white/[0.03] rounded-[2rem] border border-white/5 p-5 shadow-2xl group"
                                    >
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center text-white/20 border border-white/10 shadow-xl font-black text-xl">
                                                    {v.brand?.[0] || 'V'}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-white leading-none">{v.brand} {v.model}</h3>
                                                    <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-[0.2em] mt-2">{v.plate}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/5">Verified</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={`${ins.bg} rounded-2xl p-4 border border-white/5 transition-all hover:bg-white/[0.05]`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <ins.icon size={16} className={ins.color} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${ins.color}`}>{ins.label}</span>
                                                </div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Insurance</p>
                                                {ins.urgency !== 'low' && (
                                                    <button onClick={() => navigate('/insurance')} className="mt-3 text-[9px] font-black text-[#F59E0B] uppercase flex items-center gap-1.5 underline underline-offset-4 decoration-[#F59E0B]/20">Protocol renewal <ArrowRight size={10} /></button>
                                                )}
                                            </div>

                                            <div className={`${puc.bg} rounded-2xl p-4 border border-white/5 transition-all hover:bg-white/[0.05]`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <puc.icon size={16} className={puc.color} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${puc.color}`}>{puc.label}</span>
                                                </div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">PUC / Emission</p>
                                                {puc.urgency !== 'low' && (
                                                    <button onClick={() => navigate('/services')} className="mt-3 text-[9px] font-black text-[#F59E0B] uppercase flex items-center gap-1.5 underline underline-offset-4 decoration-[#F59E0B]/20">Audit request <ArrowRight size={10} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* ── Action Nodes ── */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-blue-500/5 p-5 rounded-[2rem] border border-blue-500/10 space-y-4">
                            <div className="w-11 h-11 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                <FileText size={20} />
                            </div>
                            <h4 className="text-[11px] font-black text-white tracking-tighter">Underwriting</h4>
                            <p className="text-[9px] font-black text-white/20 uppercase leading-snug tracking-widest">Generate certified reports for claims.</p>
                        </div>
                        <div className="bg-emerald-500/5 p-5 rounded-[2rem] border border-emerald-500/10 space-y-4">
                            <div className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                <AlertCircle size={20} />
                            </div>
                            <h4 className="text-[11px] font-black text-white tracking-tighter">Log history</h4>
                            <p className="text-[9px] font-black text-white/20 uppercase leading-snug tracking-widest">Live incident logging & feedback.</p>
                        </div>
                    </div>
                </div>

                {/* ── Floating AI Assist ── */}
                <div className="fixed bottom-24 right-6">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 bg-[#F59E0B] rounded-[1.5rem] flex items-center justify-center text-black shadow-2xl shadow-[#F59E0B]/30 border border-white/20"
                    >
                        <Activity size={28} className="animate-pulse" />
                    </motion.button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default ComplianceCenter;
