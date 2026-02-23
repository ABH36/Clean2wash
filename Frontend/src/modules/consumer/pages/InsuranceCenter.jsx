import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShieldCheck,
    FileText,
    Info,
    Activity,
    CheckCircle2,
    Lock,
    Zap,
    ChevronRight,
    HelpCircle
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const InsuranceCenter = () => {
    const navigate = useNavigate();

    return (
        <MobileLayout>
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-content">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-content italic tracking-tight uppercase">Insurance <span className="text-brand">Center</span></h1>
                </div>
            </header>

            <div className="px-4 py-6 space-y-6 pb-24">
                {/* Active Protection Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-content rounded-[2.5rem] p-7 text-white relative overflow-hidden shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div className="p-3 bg-brand rounded-2xl shadow-lg">
                                <ShieldCheck size={28} />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-green-500 text-white px-3 py-1 rounded-lg italic">Active Protection</span>
                                <p className="text-[10px] font-bold text-white/40 mt-1">HRA-INS-4491</p>
                            </div>
                        </div>

                        <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-2">₹5,00,000 <br /><span className="text-brand text-xl">Service Guarantee</span></h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-[240px]">Every wash is protected against accidental damage by our comprehensive insurance policy.</p>

                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                                <CheckCircle2 size={16} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest italic">All vehicles covered globally</p>
                        </div>
                    </div>
                    <Lock size={180} className="absolute -bottom-20 -right-20 text-white/5 -rotate-12" />
                </motion.div>

                {/* Covered items */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">What's Covered?</p>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { icon: <Zap size={18} />, title: 'Accidental Damage', desc: 'During the wash process' },
                            { icon: <ShieldCheck size={18} />, title: 'Theft Protection', desc: 'On-site mission security' },
                            { icon: <Activity size={18} />, title: 'Service Errors', desc: 'Technical or chemical mishaps' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-brand">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-content italic uppercase tracking-tight leading-none mb-1">{item.title}</h4>
                                    <p className="text-[10px] font-bold text-content-subtle">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Claim Section */}
                <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-content-subtle shadow-sm mb-4">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-sm font-black text-content italic uppercase tracking-tight mb-2">Need to file a claim?</h3>
                    <p className="text-[10px] font-bold text-content-subtle max-w-[220px] mb-6">If you're unhappy with your service or suspect damage, our claims engine is here.</p>
                    <button className="w-full py-4 bg-content text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-content/20 hover:bg-brand transition-all">
                        Launch Claims Engine
                    </button>
                </div>

                {/* FAQ */}
                <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-soft group">
                    <div className="flex items-center gap-3">
                        <HelpCircle size={20} className="text-content-subtle" />
                        <span className="text-xs font-black text-content italic uppercase tracking-tight">Insurance FAQ</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-brand transition-all" />
                </div>
            </div>
        </MobileLayout>
    );
};

export default InsuranceCenter;
