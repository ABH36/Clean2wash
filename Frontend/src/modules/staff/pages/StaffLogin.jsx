import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowRight, Lock, Phone as PhoneIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const StaffLogin = () => {
    const navigate = useNavigate();
    const { login, validateCredentials } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const user = validateCredentials('staff', { phone, password });
        if (!user) {
            setError('ACCESS DENIED: INVALID CREDENTIALS');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            login('staff', user);
            navigate('/staff');
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-white px-8 pt-24 pb-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-24 h-24 bg-content rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-content/30 mx-auto relative group"
                >
                    <Truck size={44} className="text-brand relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                <div className="text-center mb-12">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-3 italic">Authorized Personnel Only</p>
                    <h1 className="text-4xl font-black text-content italic leading-none uppercase tracking-tighter">Terminal <br /> Access</h1>
                    <p className="text-content-subtle text-[11px] font-bold mt-4 uppercase tracking-widest leading-relaxed opacity-60">
                        Login to CarWash Node-02 <br /> For Active Field Assignments
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] px-4 italic">Device Identity (Phone)</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                                <PhoneIcon size={18} className="text-content-subtle group-focus-within:text-brand" />
                            </div>
                            <input
                                type="tel"
                                placeholder="+91 00000 00000"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                className="w-full bg-gray-50 border border-gray-100 px-16 py-5 rounded-[2rem] text-sm font-black focus:border-brand/40 focus:bg-white outline-none transition-all placeholder:text-gray-200 shadow-soft"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] px-4 italic">Security Token (PIN)</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                                <Lock size={18} className="text-content-subtle group-focus-within:text-brand" />
                            </div>
                            <input
                                type="password"
                                placeholder="● ● ● ●"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 px-16 py-5 rounded-[2rem] text-sm font-black tracking-[0.8em] focus:border-brand/40 focus:bg-white outline-none transition-all placeholder:text-gray-200 placeholder:tracking-normal shadow-soft"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 border border-red-100 rounded-2xl px-4 py-3 shadow-inner"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className={`w-full h-16 bg-content text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-content/30 flex items-center justify-center gap-3 mt-10 transition-all ${loading ? 'opacity-70 grayscale' : 'hover:bg-brand hover:scale-[1.02]'}`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Validating...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3">
                                <span>Initialize Interface</span>
                                <ArrowRight size={20} strokeWidth={3} />
                            </div>
                        )}
                    </motion.button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none">
                        New Personnel?{' '}
                        <Link to="/staff/signup" className="text-brand font-black italic border-b border-brand/20 ml-2">Register Terminal</Link>
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 opacity-30 select-none">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">CarWash HQ Secure Network</span>
                </div>
                <p className="text-[7px] font-bold uppercase tracking-widest">v4.2.0-STF (STABLE)</p>
            </div>
        </div>
    );
};

export default StaffLogin;
