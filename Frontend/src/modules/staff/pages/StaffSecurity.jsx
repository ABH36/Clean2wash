import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ShieldCheck,
    Lock,
    KeyRound,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import StaffLayout from '../components/StaffLayout';
import { useTheme } from '../../../context/ThemeContext';

const StaffSecurity = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [pinData, setPinData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        // Mock update logic
        navigate(-1);
    };

    return (
        <StaffLayout title="Authentication" subtitle="Security Node">
            <div className="space-y-8">
                <div className="flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 relative group overflow-hidden transition-all ${isDarkMode ? 'bg-brand/20 shadow-2xl shadow-brand/10' : 'bg-brand/10'}`}>
                        <ShieldCheck size={48} className="text-brand relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-brand/5 blur-xl group-hover:scale-150 transition-transform" />
                    </div>
                    <div className="text-center mb-4">
                        <h2 className={`text-2xl font-black leading-none mb-3 uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>Access Protocol</h2>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Maintain secure terminal entry</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Current 4-Digit Pin</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-gray-50 text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.current}
                                onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                className={`w-full text-xl font-black tracking-[0.8em] outline-none placeholder:tracking-normal bg-transparent ${isDarkMode ? 'text-white placeholder:text-white/10' : 'text-content placeholder:text-gray-200'}`}
                            />
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>New 4-Digit Pin</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-gray-50 text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.new}
                                onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                className={`w-full text-xl font-black tracking-[0.8em] outline-none placeholder:tracking-normal bg-transparent ${isDarkMode ? 'text-white placeholder:text-white/10' : 'text-content placeholder:text-gray-200'}`}
                            />
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Verify Protocol</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-gray-50 text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.confirm}
                                onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                className={`w-full text-xl font-black tracking-[0.8em] outline-none placeholder:tracking-normal bg-transparent ${isDarkMode ? 'text-white placeholder:text-white/10' : 'text-content placeholder:text-gray-200'}`}
                            />
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] flex items-start gap-4 mt-6 border transition-all ${isDarkMode ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50/50 border-amber-100/30'}`}>
                        <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className={`text-[9px] font-bold uppercase leading-[1.8] tracking-wider ${isDarkMode ? 'text-amber-200/50' : 'text-amber-700'}`}>
                            Never share your CarWash Access Pin. Hub managers will never request authentication keys via insecure channels.
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full h-16 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl flex items-center justify-center gap-3 mt-10 hover:bg-brand transition-all ${isDarkMode ? 'bg-white text-[#0F172A] shadow-white/5' : 'bg-content text-white shadow-content/30'}`}
                    >
                        Sign Update <ArrowRight size={20} />
                    </motion.button>
                </form>
            </div>
        </StaffLayout>
    );
};

export default StaffSecurity;
