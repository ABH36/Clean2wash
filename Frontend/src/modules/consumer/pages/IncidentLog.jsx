import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, Activity, Eye, FileText,
    Camera, CheckCircle2, AlertTriangle, Info, Clock,
    Download, Share2, Filter, Search
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const IncidentLog = () => {
    const navigate = useNavigate();
    const { bookings } = useAuth();
    const [selectedAudit, setSelectedAudit] = useState(null);

    // Mock specific security audits if none in bookings
    const mockAudits = [
        {
            id: 'AUD-9912',
            date: '24 Feb, 2026',
            time: '04:15 PM',
            type: 'Pre-Wash Audit',
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
            type: 'Surface Guard Sync',
            status: 'Flagged',
            vehicle: 'Honda City · KA 05 MR 7821',
            captain: 'Arjun K.',
            photos: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80'],
            score: 72,
            notes: 'High paint temperature detected. Wash delayed by 15 mins for cooling.'
        }
    ];

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-outfit pb-24">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-content uppercase tracking-tight italic">Security Audit Log</h1>
                            <p className="text-[9px] font-bold text-brand uppercase tracking-widest mt-0.5">certified digital chain of trust</p>
                        </div>
                    </div>
                    <Filter size={18} className="text-content-subtle opacity-30" />
                </header>

                <div className="px-5 py-6 space-y-4">
                    {/* ── Trust Banner ── */}
                    <div className="bg-gray-900 rounded-2xl p-5 text-white flex items-center gap-4 border border-white/5 shadow-xl">
                        <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center text-brand shrink-0">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase italic leading-none">Voucher Lock Active</h3>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-tight mt-1">All pre/post wash audits are hashes on our private node.</p>
                        </div>
                    </div>

                    {/* ── Search ── */}
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" />
                        <input
                            placeholder="SEARCH BY ORDER ID OR VEHICLE..."
                            className="w-full h-12 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand/30"
                        />
                    </div>

                    {/* ── Audit List ── */}
                    <div className="space-y-3">
                        {mockAudits.map((audit) => (
                            <motion.div
                                key={audit.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedAudit(audit)}
                                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-brand/20 transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${audit.status === 'Verified' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {audit.status === 'Verified' ? <Activity size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-[11px] font-black text-content uppercase italic tracking-tight">{audit.type}</h4>
                                        <span className="text-[8px] font-black text-content-subtle uppercase">{audit.date}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none truncate">{audit.vehicle}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${audit.status === 'Verified' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            {audit.status} Node
                                        </span>
                                        <span className="text-[8px] font-bold text-content-subtle opacity-40">ID: {audit.id}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Detailed Audit Modal ── */}
                <AnimatePresence>
                    {selectedAudit && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setSelectedAudit(null)}
                            />
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] max-h-[90vh] overflow-y-auto no-scrollbar"
                            >
                                <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4">
                                    <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-black text-content uppercase italic tracking-tight leading-none">{selectedAudit.type}</h3>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-2">{selectedAudit.id} • {selectedAudit.time}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                            <ShieldCheck size={24} className="text-green-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 pb-12 space-y-8 mt-4">
                                    {/* ── Photo Evidence ── */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Camera size={16} className="text-content-subtle" />
                                            <h4 className="text-[10px] font-black text-content uppercase tracking-widest">Visual Evidence (Digital Hash)</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedAudit.photos.map((p, i) => (
                                                <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shadow-sm">
                                                    <img src={p} className="w-full h-full object-cover" alt="Audit Evidence" />
                                                </div>
                                            ))}
                                            <div className="aspect-[3/4] rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-4">
                                                <CheckCircle2 size={24} className="text-green-500/20 mb-2" />
                                                <p className="text-[8px] font-black text-content-subtle uppercase">All angles<br />verified</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Audit Score ── */}
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[11px] font-black text-content uppercase">Trust Score</h4>
                                            <span className="text-2xl font-black italic text-brand">{selectedAudit.score}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${selectedAudit.score}%` }}
                                                className={`h-full ${selectedAudit.score > 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* ── Feedback & Notes ── */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-content-subtle">
                                            <FileText size={16} />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Technician Feedback</h4>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft">
                                            <p className="text-xs font-bold text-content leading-relaxed italic">"{selectedAudit.notes}"</p>
                                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-white shadow-sm flex items-center justify-center overflow-hidden">
                                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="Rahul" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest leading-none mb-1">Signed by</p>
                                                        <p className="text-[11px] font-[1000] text-content uppercase italic">{selectedAudit.captain}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white transition-all"><Download size={16} /></button>
                                                    <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-subtle hover:bg-brand hover:text-white transition-all"><Share2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                                        <Info size={14} className="text-blue-500 mt-0.5" />
                                        <p className="text-[9px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">This audit record is permanent and cannot be deleted or modified as per safety protocol.</p>
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
