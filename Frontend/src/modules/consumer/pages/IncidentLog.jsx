import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, Activity, Eye, FileText,
    Camera, CheckCircle2, AlertTriangle, Info, Clock,
    Download, Share2, Filter, Search, X, CheckSquare, Zap, Target
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const IncidentLog = () => {
    const navigate = useNavigate();
    const { bookings } = useAuth();
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const mockAudits = [
        {
            id: 'AUD-9912',
            date: '24 Feb, 2026',
            time: '04:15 PM',
            type: 'Pre-wash audit',
            status: 'Verified',
            vehicle: 'Honda City · KA 05 MR 7821',
            captain: 'Rahul S.',
            photos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80'],
            score: 98,
            notes: 'Minor scratch detected on rear bumper (left). Documented for safety.'
        },
        {
            id: 'AUD-9871',
            date: '20 Feb, 2026',
            time: '11:30 AM',
            type: 'Surface guard sync',
            status: 'Flagged',
            vehicle: 'Honda City · KA 05 MR 7821',
            captain: 'Arjun K.',
            photos: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80'],
            score: 72,
            notes: 'High paint temperature detected. Wash delayed by 15 mins for cooling.'
        }
    ];

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Incident log</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Security audit history</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Trust Banner ── */}
                    <div className="bg-slate-900 p-5 rounded-[2.5rem] flex items-center gap-4 shadow-xl shadow-slate-900/10 border border-white/5 relative overflow-hidden">
                        <div className="w-12 h-12 bg-brand/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand shrink-0 border border-brand/20 shadow-inner z-10">
                            <ShieldCheck size={26} />
                        </div>
                        <div className="z-10">
                            <h3 className="text-[15px] font-bold text-white leading-none mb-1.5">Voucher lock active</h3>
                            <p className="text-white/40 text-[10px] font-medium leading-tight">All audits are verified hashes on our private node.</p>
                        </div>
                        <Zap size={100} className="absolute -bottom-10 -right-10 text-white/5 opacity-40 rotate-12" />
                    </div>

                    {/* ── Search ── */}
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder="Search by ID or vehicle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-11 pr-4 text-[13px] font-bold text-slate-900 outline-none focus:border-brand/40 shadow-sm"
                        />
                    </div>

                    {/* ── Audit List ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">Recent records ({mockAudits.length})</h3>
                        </div>

                        <div className="space-y-3">
                            {mockAudits.map((audit) => (
                                <motion.div
                                    key={audit.id}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setSelectedAudit(audit)}
                                    className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-slate-200 transition-all"
                                >
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${audit.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {audit.status === 'Verified' ? <CheckSquare size={18} /> : <AlertTriangle size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-[14px] font-bold text-slate-900 truncate">{audit.type}</h4>
                                            <span className="text-[9px] font-bold text-slate-400">{audit.date}</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-400 truncate">{audit.vehicle}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold ${audit.status === 'Verified' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                {audit.status}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300">ID: {audit.id}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Detail Sheet ── */}
                <AnimatePresence>
                    {selectedAudit && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAudit(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedAudit.type}</h2>
                                        <p className="text-[11px] font-bold text-brand mt-1 uppercase tracking-widest">{selectedAudit.id} • {selectedAudit.time}</p>
                                    </div>
                                    <button onClick={() => setSelectedAudit(null)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X size={18} /></button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 ml-1 text-slate-400">
                                            <Camera size={16} />
                                            <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Visual proof</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedAudit.photos.map((p, i) => (
                                                <div key={i} className="aspect-[3/4] rounded-[1.8rem] bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                                                    <img src={p} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            ))}
                                            <div className="aspect-[3/4] rounded-[1.8rem] bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-5">
                                                <CheckCircle2 size={24} className="text-emerald-500/20 mb-2" />
                                                <p className="text-[9px] font-bold text-slate-300 uppercase leading-relaxed">Verification<br />complete</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <Target size={16} className="text-brand" />
                                                <h4 className="text-[12px] font-bold text-slate-900">Trust score</h4>
                                            </div>
                                            <span className="text-[20px] font-bold text-slate-900">{selectedAudit.score}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${selectedAudit.score}%` }} transition={{ duration: 1 }} className={`h-full ${selectedAudit.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 ml-1 text-slate-400">
                                            <FileText size={16} />
                                            <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Notes</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                            <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic pr-4">"{selectedAudit.notes}"</p>
                                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
                                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Signed by</p>
                                                        <p className="text-[12px] font-bold text-slate-900 tracking-tight">{selectedAudit.captain}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:bg-brand active:text-slate-900 transition-all"><Download size={16} /></button>
                                                    <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 active:bg-brand active:text-slate-900 transition-all"><Share2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                                        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-medium text-blue-800/60 leading-relaxed uppercase tracking-tight">Audit records are immutable and linked to the digital signature of the technician.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default IncidentLog;
