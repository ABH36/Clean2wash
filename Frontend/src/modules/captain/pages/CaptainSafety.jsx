import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    AlertCircle,
    Phone,
    Info,
    ArrowLeft,
    CheckCircle2,
    FileText,
    Activity,
    LifeBuoy
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';

import { useTheme } from '../../../context/ThemeContext';

const CaptainSafety = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const SAFETY_GUIDELINES = [
        'Always wear your CarWash reflective vest and uniform.',
        'Carry your Digital ID at all times during missions.',
        'Report any vehicle damage BEFORE starting the wash.',
        'In case of emergency, use the SOS button on dashboard.',
        'Follow eco-friendly chemical disposal protocols.'
    ];

    return (
        <CaptainLayout>
            <div className={`pb-28 transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-[#0F172A]' : 'bg-white/[0.02]'} px-4 pt-12 pb-6 sticky top-0 z-40 transition-colors border-b ${isDarkMode ? 'border-white/5' : 'border-white/5'}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white/5 border border-white/5  text-content'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={`text-xl font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Safety & Trust</h1>
                    </div>
                </div>

                <div className="px-4 space-y-6 mt-6">
                    {/* Insurance Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-brand/20"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <ShieldCheck size={28} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${isDarkMode ? 'bg-white/5 text-brand' : 'bg-[#0F172A] text-white'}`}>Active Policy</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter leading-none mb-1">On-Duty Insurance</h3>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest leading-relaxed">Covered up to ₹2,00,000 against accidents and accidental damage while on mission.</p>

                            <div className="mt-8 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Policy Number</p>
                                    <p className="text-xs font-black tracking-widest">HRA-SF-992-01</p>
                                </div>
                                <button className="bg-white/10 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">View Details</button>
                            </div>
                        </div>
                        <ShieldCheck size={160} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                    </motion.div>

                    {/* SOS Emergency */}
                    <div className={`${isDarkMode ? 'bg-red-500/10 border-red-500/20 shadow-2xl shadow-red-500/5' : 'bg-red-50 border-red-100 shadow-soft'} border rounded-3xl p-5 flex items-center gap-4 transition-all`}>
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 shrink-0">
                            <Phone size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-red-500 font-black uppercase tracking-tight text-base">Emergency SOS</h4>
                            <p className={`${isDarkMode ? 'text-red-500/60' : 'text-red-600/80'} text-[10px] font-black uppercase tracking-tight mt-1 truncate`}>Direct line to Safety Ops & Hub Manager.</p>
                        </div>
                        <button className={`ml-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600'}`}>
                            <Activity size={18} />
                        </button>
                    </div>

                    {/* Safety Checklist */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 shadow-soft'} border rounded-[2.5rem] p-8 transition-all`}>
                        <h4 className={`font-black uppercase tracking-tight text-lg mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                            <Info size={18} className="text-brand" />
                            Safety Protocols
                        </h4>
                        <div className="space-y-4">
                            {SAFETY_GUIDELINES.map((g, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <CheckCircle2 size={16} className="text-brand shrink-0" />
                                    </div>
                                    <p className={`${isDarkMode ? 'text-white/60' : 'text-content-subtle'} text-xs font-bold leading-relaxed`}>{g}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Training & Certification */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/40' : 'bg-white/5 border-white/5 shadow-soft'} border rounded-[2.5rem] p-6 flex flex-col items-center text-center transition-all`}>
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-brand mb-4 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                            <FileText size={32} />
                        </div>
                        <h4 className={`font-black uppercase tracking-tight text-base ${isDarkMode ? 'text-white' : 'text-content'}`}>Captain Certification</h4>
                        <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[10px] font-bold mt-1 mb-6`}>You've completed all safety modules. Refresh training is due in 14 days.</p>
                        <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white/5 border border-white/5 text-content-subtle hover:bg-white/[0.02] '}`}>
                            Retake Safety Training
                        </button>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSafety;
