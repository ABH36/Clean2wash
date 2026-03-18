import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronLeft, Briefcase } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const StaffSignup = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    
    return (
        <div className={`min-h-screen px-8 pt-16 pb-12 flex flex-col relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
            {/* Background elements */}
            <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`} />
            <div className={`absolute top-1/2 -right-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 opacity-50 ${isDarkMode ? 'bg-brand/20' : 'bg-brand/10'}`} />

            <button
                onClick={() => navigate(-1)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 border shadow-sm active:scale-95 transition-all relative z-10 ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-content'}`}
            >
                <ChevronLeft size={22} />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1 relative z-10 items-center justify-center text-center max-w-sm mx-auto"
            >
                <div className="mb-10">
                    <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl mx-auto relative group transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] shadow-black/40 border border-white/5' : 'bg-content shadow-content/30'}`}>
                        <ShieldCheck size={44} className="text-brand group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Inventory & Personnel</p>
                    <h1 className={`text-4xl font-black italic leading-tight uppercase tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-content'}`}>Managed <br /> Onboarding</h1>
                    
                    <div className={`p-8 rounded-[2.5rem] border backdrop-blur-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-xs font-bold leading-relaxed mb-6 ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>
                            Staff and Field Agent accounts are strictly managed by <span className="text-brand font-black italic uppercase">Hub Managers</span> & <span className="text-brand font-black italic uppercase">Vendors</span>.
                        </p>
                        <p className={`text-[11px] font-medium leading-relaxed opacity-80 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                            If you have been recruited, please contact your supervisor for your <span className="font-bold underline decoration-brand/30">Security Access PIN</span> and System ID.
                        </p>
                    </div>

                    <div className="mt-10 space-y-4 w-full">
                        <Link to="/staff/login" className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all ${isDarkMode ? 'bg-white text-[#0F172A] hover:bg-brand hover:text-white' : 'bg-content text-white hover:bg-brand'}`}>
                            Go to Terminal Login <ArrowRight size={18} />
                        </Link>
                        
                        <Link to="/vendor/signup" className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] border flex items-center justify-center gap-3 transition-all ${isDarkMode ? 'border-white/10 text-white/40 hover:text-brand hover:border-brand' : 'border-gray-200 text-content-subtle hover:text-brand hover:border-brand'}`}>
                            Become a Partner <Briefcase size={18} />
                        </Link>
                    </div>
                </div>

                <div className={`mt-12 flex flex-col items-center gap-2 select-none transition-opacity duration-500 opacity-30 ${isDarkMode ? 'text-white' : ''}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">CarWash secure protocols active</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StaffSignup;
