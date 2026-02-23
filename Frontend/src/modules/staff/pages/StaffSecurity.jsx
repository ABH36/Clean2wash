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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Authentication</h1>
                <div className="w-10" />
            </header>

            <div className="px-5 pt-8">
                <div className="w-20 h-20 bg-brand/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} className="text-brand" />
                </div>
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-content italic leading-none mb-2">Staff Access Pin</h2>
                    <p className="text-xs font-bold text-content-subtle uppercase tracking-widest">Secure your account access</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Current 4-Digit Pin</p>
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-content-subtle" />
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.current}
                                onChange={(e) => setPinData({ ...pinData, current: e.target.value })}
                                className="w-full text-lg font-black text-content tracking-[0.5em] outline-none placeholder:tracking-normal placeholder:text-gray-200"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">New 4-Digit Pin</p>
                        <div className="flex items-center gap-3">
                            <KeyRound size={18} className="text-brand" />
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.new}
                                onChange={(e) => setPinData({ ...pinData, new: e.target.value })}
                                className="w-full text-lg font-black text-content tracking-[0.5em] outline-none placeholder:tracking-normal placeholder:text-gray-200"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Confirm New Pin</p>
                        <div className="flex items-center gap-3">
                            <KeyRound size={18} className="text-brand" />
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="● ● ● ●"
                                value={pinData.confirm}
                                onChange={(e) => setPinData({ ...pinData, confirm: e.target.value })}
                                className="w-full text-lg font-black text-content tracking-[0.5em] outline-none placeholder:tracking-normal placeholder:text-gray-200"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 mt-4 border border-amber-100/50">
                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[8px] font-bold text-amber-700 uppercase leading-relaxed">
                            Never share your Hoora Access Pin with anyone. Hub managers will never ask for your pin via call or SMS.
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-content/20 flex items-center justify-center gap-3 mt-8"
                    >
                        Update Access Pin <ArrowRight size={18} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default StaffSecurity;
