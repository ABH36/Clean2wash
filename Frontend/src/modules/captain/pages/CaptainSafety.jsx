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

const CaptainSafety = () => {
    const navigate = useNavigate();

    const SAFETY_GUIDELINES = [
        'Always wear your Hoora reflective vest and uniform.',
        'Carry your Digital ID at all times during missions.',
        'Report any vehicle damage BEFORE starting the wash.',
        'In case of emergency, use the SOS button on dashboard.',
        'Follow eco-friendly chemical disposal protocols.'
    ];

    return (
        <CaptainLayout>
            <div className="pb-28">
                {/* Header */}
                <div className="bg-content px-4 pt-12 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-white italic tracking-tight uppercase">Safety & Trust</h1>
                    </div>
                </div>

                <div className="px-4 space-y-6">
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
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white text-brand px-3 py-1 rounded-lg italic">Active Policy</span>
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-1">On-Duty Insurance</h3>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Covered up to ₹2,00,000 against accidents and accidental damage while on mission.</p>

                            <div className="mt-8 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Policy Number</p>
                                    <p className="text-xs font-black tracking-widest">HRA-SF-992-01</p>
                                </div>
                                <button className="bg-white/20 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10">View Details</button>
                            </div>
                        </div>
                        <ShieldCheck size={160} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                    </motion.div>

                    {/* SOS Emergency */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 shrink-0">
                            <Phone size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-red-500 font-black italic uppercase tracking-tight text-base">Emergency SOS</h4>
                            <p className="text-red-500/60 text-[10px] font-bold leading-tight mt-1 truncate">Direct line to Hoora Safety Ops & Hub Manager.</p>
                        </div>
                        <button className="ml-auto w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                            <Activity size={18} />
                        </button>
                    </div>

                    {/* Safety Checklist */}
                    <div className="bg-content border border-white/5 rounded-[2.5rem] p-8">
                        <h4 className="text-white font-black italic uppercase tracking-tight text-lg mb-6 flex items-center gap-2">
                            <Info size={18} className="text-brand" />
                            Safety Protocols
                        </h4>
                        <div className="space-y-4">
                            {SAFETY_GUIDELINES.map((g, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <CheckCircle2 size={16} className="text-brand shrink-0" />
                                    </div>
                                    <p className="text-white/60 text-xs font-bold leading-relaxed">{g}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Training & Certification */}
                    <div className="bg-content border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-brand mb-4">
                            <FileText size={32} />
                        </div>
                        <h4 className="text-white font-black italic uppercase tracking-tight text-base">Captain Certification</h4>
                        <p className="text-white/40 text-[10px] font-bold mt-1 mb-6">You've completed all safety modules. Refresh training is due in 14 days.</p>
                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-brand hover:border-brand transition-all">
                            Retake Safety Training
                        </button>
                    </div>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainSafety;
