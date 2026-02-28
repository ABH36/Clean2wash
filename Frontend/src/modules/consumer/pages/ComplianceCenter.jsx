import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Activity, ShieldCheck, Heart, AlertTriangle,
    Calendar, ArrowRight, CheckCircle2, Info, Bell, Settings,
    FileText, Zap, ChevronRight, Filter, AlertCircle
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
        if (!date) return { label: 'Not Set', color: 'text-gray-400', bg: 'bg-gray-50', icon: Info };
        const now = new Date();
        const diff = new Date(date) - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return { label: 'Expired', color: 'text-red-500', bg: 'bg-red-50', icon: AlertTriangle, urgency: 'high' };
        const threshold = type === 'insurance' ? 15 : 7;
        if (days < threshold) return { label: `Due in ${days}d`, color: 'text-orange-500', bg: 'bg-orange-50', icon: Bell, urgency: 'medium' };
        return { label: 'Active', color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2, urgency: 'low' };
    };

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-outfit pb-24">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                                <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className="text-base font-black text-content uppercase tracking-tight italic">Compliance Hub</h1>
                                <p className="text-[9px] font-bold text-brand uppercase tracking-[0.2em] mt-0.5">certified intelligence node</p>
                            </div>
                        </div>
                        <Settings size={18} className="text-content-subtle opacity-30" />
                    </div>
                </header>

                <div className="px-5 py-6 space-y-6">
                    {/* ── Fleet Health Score ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-content rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-content/20"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Fleet Health Score</p>
                                    <h2 className="text-4xl font-black italic tracking-tighter">{stats.avgScore}%</h2>
                                </div>
                                <div className="w-12 h-12 bg-brand/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                                    <Activity size={24} strokeWidth={2.5} />
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

                    {/* ── Filters ── */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {['All', 'Expired', 'Insurance', 'PUC'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white text-content-subtle border border-gray-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* ── Vehicle Compliance Cards ── */}
                    <div className="space-y-4">
                        {vehicles.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <Zap size={32} />
                                </div>
                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">No vehicles found in garage</p>
                                <button onClick={() => navigate('/vehicles')} className="text-[10px] font-black text-brand uppercase underline">Add Vehicle</button>
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
                                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle border border-gray-100">
                                                    <Zap size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-content uppercase italic leading-none">{v.brand} {v.model}</h3>
                                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1.5">{v.plate}</p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-tighter">Verified</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`${ins.bg} rounded-xl p-3 border border-black/5`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <ins.icon size={14} className={ins.color} />
                                                    <span className={`text-[8px] font-black uppercase ${ins.color}`}>{ins.label}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-tight">Insurance</p>
                                                {ins.urgency !== 'low' && (
                                                    <button onClick={() => navigate('/insurance')} className="mt-2 text-[8px] font-black text-brand uppercase flex items-center gap-1">Renew Now <ArrowRight size={8} /></button>
                                                )}
                                            </div>

                                            <div className={`${puc.bg} rounded-xl p-3 border border-black/5`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <puc.icon size={14} className={puc.color} />
                                                    <span className={`text-[8px] font-black uppercase ${puc.color}`}>{puc.label}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-tight">PUC / Emission</p>
                                                {puc.urgency !== 'low' && (
                                                    <button onClick={() => navigate('/services')} className="mt-2 text-[8px] font-black text-brand uppercase flex items-center gap-1">Book Test <ArrowRight size={8} /></button>
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
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                                <FileText size={18} />
                            </div>
                            <h4 className="text-[10px] font-black text-content uppercase italic tracking-tight">Underwriting Node</h4>
                            <p className="text-[8px] font-bold text-content-subtle uppercase leading-tight tracking-tight">Get certified reports for resale or insurance claims</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <AlertCircle size={18} />
                            </div>
                            <h4 className="text-[10px] font-black text-content uppercase italic tracking-tight">Intelligence Log</h4>
                            <p className="text-[8px] font-bold text-content-subtle uppercase leading-tight tracking-tight">View live incident logging and technician feedback</p>
                        </div>
                    </div>
                </div>

                {/* ── Floating AI Assist ── */}
                <div className="fixed bottom-24 right-5">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 bg-content rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-content/30 border border-white/10"
                    >
                        <Activity size={24} className="animate-pulse" />
                    </motion.button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default ComplianceCenter;
