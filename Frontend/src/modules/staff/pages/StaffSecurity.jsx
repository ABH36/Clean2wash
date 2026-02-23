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

const StaffSecurity = () => {
    const navigate = useNavigate();
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
                    <div className="w-24 h-24 bg-brand/10 rounded-[3rem] flex items-center justify-center mb-6 relative group overflow-hidden">
                        <ShieldCheck size={48} className="text-brand relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-brand/5 blur-xl group-hover:scale-150 transition-transform" />
                    </div>
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-black text-content italic leading-none mb-3 uppercase tracking-tighter">Access Protocol</h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-[0.2em]">Maintain secure terminal entry</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">Current 4-Digit Pin</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.current}
                                onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                className="w-full text-xl font-black text-content tracking-[0.8em] outline-none placeholder:tracking-normal placeholder:text-gray-200 bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">New 4-Digit Pin</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.new}
                                onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                className="w-full text-xl font-black text-content tracking-[0.8em] outline-none placeholder:tracking-normal placeholder:text-gray-200 bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">Verify Protocol</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.confirm}
                                onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                className="w-full text-xl font-black text-content tracking-[0.8em] outline-none placeholder:tracking-normal placeholder:text-gray-200 bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-6 rounded-[2rem] flex items-start gap-4 mt-6 border border-amber-100/30">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-amber-700 uppercase leading-[1.8] tracking-wider italic">
                            Never share your CarWash Access Pin. Hub managers will never request authentication keys via insecure channels.
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full h-16 bg-content text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-content/30 flex items-center justify-center gap-3 mt-10 hover:bg-brand transition-all"
                    >
                        Sign Update <ArrowRight size={20} />
                    </motion.button>
                </form>
            </div>
        </StaffLayout>
    );
};

export default StaffSecurity;
