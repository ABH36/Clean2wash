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
import { useTheme } from '../../../context/ThemeContext';

const IncidentLog = () => {
    const navigate = useNavigate();
    const { bookings } = useAuth();
    const { isDarkMode } = useTheme();
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
            <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-4 py-3 flex items-center justify-between sticky top-0 z-[60] border-b backdrop-blur-xl transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/10'
                }`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.05]'
                        }`}>
                            <ChevronLeft size={18} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                        </button>
                        <div>
                            <h1 className={`text-[17px] font-[1000] tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Incident Log</h1>
                        </div>
                    </div>
                </header>

                <div className="px-4 pt-4 space-y-5">
                    <div className="bg-[#0F172A] p-4 rounded-[28px] flex items-center gap-4 shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="w-10 h-10 bg-[#FF9900]/20 backdrop-blur-md rounded-xl flex items-center justify-center text-[#FF9900] shrink-0 border border-[#FF9900]/20 shadow-inner z-10">
                            <ShieldCheck size={20} strokeWidth={3} />
                        </div>
                        <div className="z-10">
                            <h3 className="text-[13px] font-[1000] text-white uppercase tracking-tight leading-none mb-1">Immutable Logs Active</h3>
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-tight">Records are cryptographically hashed.</p>
                        </div>
                        <Zap size={80} className="absolute -bottom-8 -right-8 text-white/5 opacity-40 rotate-12" />
                    </div>

                    <div className="relative">
                        <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`} />
                        <input
                            placeholder="SEARCH BY ID OR VEHICLE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-11 border rounded-xl pl-10 pr-4 text-[11px] font-[1000] uppercase tracking-widest outline-none transition-all ${
                                isDarkMode ? 'bg-white/[0.03] border-white/05 text-white focus:border-[#FF9900]/20' : 'bg-white border-black/05 text-slate-900 shadow-sm focus:border-[#FF9900]/40'
                            }`}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Record Archive ({mockAudits.length})</h3>
                        </div>

                        <div className="space-y-2.5">
                            {mockAudits.map((audit) => (
                                <motion.div
                                    key={audit.id}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setSelectedAudit(audit)}
                                    className={`rounded-[22px] p-4 border flex items-center gap-4 cursor-pointer transition-all ${
                                        isDarkMode ? 'bg-white/[0.03] border-white/05 active:bg-white/5' : 'bg-white border-black/05 shadow-sm active:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${audit.status === 'Verified' ? 'bg-[#FF9900] text-black border-[#FF9900]/10' : 'bg-rose-500 text-white border-rose-600/10'}`}>
                                        {audit.status === 'Verified' ? <CheckSquare size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className={`text-[12px] font-[1000] uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{audit.type}</h4>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{audit.date}</span>
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-tighter truncate ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>{audit.vehicle}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-[1000] uppercase tracking-widest ${audit.status === 'Verified' ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20' : 'bg-rose-600 text-white'}`}>
                                                {audit.status}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>#{audit.id}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedAudit && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAudit(null)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
                                className={`fixed inset-x-0 bottom-0 rounded-t-[32px] z-[1001] p-6 pb-10 shadow-2xl max-h-[88vh] overflow-y-auto border-t transition-all ${
                                    isDarkMode ? 'bg-[#0A0F0D] border-white/10' : 'bg-white border-black/10'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className={`text-[16px] font-[1000] uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedAudit.type}</h2>
                                        <p className="text-[9px] font-black text-[#FF9900] mt-1 uppercase tracking-widest leading-none">{selectedAudit.id} • {selectedAudit.time}</p>
                                    </div>
                                    <button onClick={() => setSelectedAudit(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        isDarkMode ? 'bg-white/5 text-white/40 active:bg-white/10' : 'bg-black/05 text-black/40 active:bg-black/10'
                                    }`}><X size={16} /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className={`flex items-center gap-2 ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                            <Camera size={14} />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Visual Forensic Log</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedAudit.photos.map((p, i) => (
                                                <div key={i} className={`aspect-[3/4] rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-white/05 border-white/10' : 'bg-gray-100 border-black/05'}`}>
                                                    <img src={p} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            ))}
                                            <div className={`aspect-[3/4] rounded-2xl border border-dashed flex flex-col items-center justify-center text-center p-4 ${
                                                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-black/05'
                                            }`}>
                                                <CheckCircle2 size={20} className="text-[#FF9900]/20 mb-2" />
                                                <p className={`text-[7px] font-black uppercase leading-relaxed tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Record<br />Verified</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-5 rounded-[22px] border transition-all ${
                                        isDarkMode ? 'bg-white/[0.03] border-white/05' : 'bg-black/05 border-black/05'
                                    }`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <Target size={14} className="text-[#FF9900]" />
                                                <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Service Integrity</h4>
                                            </div>
                                            <span className={`text-[16px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedAudit.score}%</span>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${selectedAudit.score}%` }} transition={{ duration: 1 }} className={`h-full ${selectedAudit.score > 80 ? 'bg-[#FF9900]' : 'bg-rose-500'}`} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className={`flex items-center gap-2 ml-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                            <FileText size={14} />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Auditor Comments</p>
                                        </div>
                                        <div className={`p-5 rounded-[22px] border relative overflow-hidden transition-all ${
                                            isDarkMode ? 'bg-white/[0.03] border-white/05' : 'bg-gray-50 border-black/05 shadow-inner'
                                        }`}>
                                            <p className={`text-[12px] font-bold leading-relaxed uppercase tracking-tight italic pr-2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>"{selectedAudit.notes}"</p>
                                            <div className={`mt-6 pt-5 border-t flex items-center justify-between ${isDarkMode ? 'border-white/05' : 'border-black/05'}`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl border overflow-hidden ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-white border-black/05'}`}>
                                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-[7px] font-black uppercase tracking-widest leading-none mb-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Authenticated By</p>
                                                        <p className={`text-[11px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedAudit.captain}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                                        isDarkMode ? 'bg-white/5 text-white/40 active:bg-[#FF9900] active:text-black' : 'bg-white border border-black/05 text-black/40 active:bg-[#0F172A] active:text-white shadow-sm'
                                                    }`}><Download size={14} /></button>
                                                    <button className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                                        isDarkMode ? 'bg-white/5 text-white/40 active:bg-[#FF9900] active:text-black' : 'bg-white border border-black/05 text-black/40 active:bg-[#0F172A] active:text-white shadow-sm'
                                                    }`}><Share2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                                        isDarkMode ? 'bg-[#FF9900]/05 border-[#FF9900]/10' : 'bg-[#FF9900]/05 border-[#FF9900]/20'
                                    }`}>
                                        <Info size={14} className="text-[#FF9900] shrink-0 mt-0.5" />
                                        <p className="text-[8px] font-black text-[#FF9900]/60 leading-relaxed uppercase tracking-[0.05em]">All incident logs are final, immutable, and cryptographically secured in the Spare Driver cloud.</p>
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
