import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageSquare, Phone, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';

const SpareDriverSupport = () => {
    const navigate = useNavigate();

    const supportCategories = [
        { title: 'Billing Issue', icon: MessageSquare, color: '#3B82F6', desc: 'Queries related to trip fares and payments' },
        { title: 'Safety Concerns', icon: HelpCircle, color: '#EF4444', desc: 'Driver conduct and safety reporting' },
        { title: 'Emergency Contact', icon: Phone, color: '#10B981', desc: 'Urgent help during an active trip' }
    ];

    return (
        <MobileLayout>
            <div className="min-h-screen bg-white flex flex-col">
                <header className="px-5 pt-12 pb-4 flex items-center gap-4 border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-black tracking-tight uppercase leading-none">Chauffeur Support</h1>
                </header>

                <div className="p-5 space-y-6">
                    <div className="bg-brand/5 rounded-[2.5rem] p-6 border border-brand/20 relative overflow-hidden text-center flex flex-col items-center">
                        <div className="absolute top-0 right-0 w-32 h-full bg-brand/10 skew-x-[-15deg]" />
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand mb-4 shadow-xl border border-brand/10">
                            <Mail size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[20px] font-black text-black uppercase tracking-tight leading-none mb-1">Help Desk</h2>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Available 24/7 for you</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {supportCategories.map((cat) => (
                            <motion.button
                                key={cat.title}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white border border-gray-100 rounded-3xl p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-5 group"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:scale-110">
                                    <cat.icon size={22} style={{ color: cat.color }} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[14px] font-black text-black uppercase tracking-tight mb-1">{cat.title}</h3>
                                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-none">{cat.desc}</p>
                                </div>
                                <ArrowRight size={18} className="text-black/10 transition-transform group-hover:translate-x-1" />
                            </motion.button>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-black/[0.03] space-y-4">
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] text-center">Frequently Asked Questions</p>
                        {[
                            'How is waiting time calculated?',
                            'Can I extend an active hourly trip?',
                            'What if my driver cancels?'
                        ].map((q, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-black/[0.02]">
                                <span className="text-[11px] font-black text-black/60 uppercase">{q}</span>
                                <ChevronRight size={14} className="text-black/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default SpareDriverSupport;
