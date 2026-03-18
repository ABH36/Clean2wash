import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowRight, Lock, Phone as PhoneIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const StaffLogin = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { staffLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await staffLogin(email, password);
            if (result.success) {
                navigate('/staff');
            } else {
                setError(result.error || 'ACCESS DENIED: INVALID CREDENTIALS');
            }
        } catch (err) {
            setError('CONNECTION FAILURE — RETRY');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen px-8 pt-24 pb-12 flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
            {/* Background elements */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`} />
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/20' : 'bg-brand/10'}`} />

            <div className="relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl mx-auto relative group transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] shadow-black/40 border border-white/5' : 'bg-content shadow-content/30'}`}
                >
                    <Truck size={44} className="text-brand relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                <div className="text-center mb-12">
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Authorized Personnel Only</p>
                    <h1 className={`text-4xl font-black italic leading-none uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>Terminal <br /> Access</h1>
                    <p className={`text-[11px] font-bold mt-4 uppercase tracking-widest leading-relaxed opacity-60 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                        Login to CarWash Node-02 <br /> For Active Field Assignments
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Staff Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                                <PhoneIcon size={18} className={`${isDarkMode ? 'text-white/10' : 'text-content-subtle'} group-focus-within:text-brand transition-colors`} />
                            </div>
                            <input
                                type="email"
                                placeholder="staff@clean2wash.in"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={`w-full border px-16 py-5 rounded-[2rem] text-sm font-black outline-none transition-all shadow-soft placeholder:tracking-normal ${isDarkMode ? 'bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:bg-white/10 focus:border-brand/40' : 'bg-gray-50 border-gray-100 text-content placeholder:text-gray-200 focus:bg-white focus:border-brand/40'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Security Token (PIN)</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                                <Lock size={18} className={`${isDarkMode ? 'text-white/10' : 'text-content-subtle'} group-focus-within:text-brand transition-colors`} />
                            </div>
                            <input
                                type="password"
                                placeholder="● ● ● ●"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`w-full border px-16 py-5 rounded-[2rem] text-sm font-black tracking-[0.8em] outline-none transition-all shadow-soft placeholder:tracking-normal ${isDarkMode ? 'bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:bg-white/10 focus:border-brand/40' : 'bg-gray-50 border-gray-100 text-content placeholder:text-gray-200 focus:bg-white focus:border-brand/40'}`}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-[10px] font-black uppercase tracking-widest text-center border rounded-2xl px-4 py-3 shadow-inner ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-500'}`}
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mt-10 transition-all ${loading ? 'opacity-70 grayscale' : 'hover:scale-[1.02] active:scale-95'} ${isDarkMode ? 'bg-white text-[#0F172A] shadow-white/5 hover:bg-brand hover:text-white' : 'bg-content text-white shadow-content/30 hover:bg-brand'}`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode ? 'border-content/20 border-t-content' : 'border-white/20 border-t-white'}`} />
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
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                        New Personnel?{' '}
                        <Link to="/staff/signup" className="text-brand font-black italic border-b border-brand/20 ml-2">Register Terminal</Link>
                    </p>
                </div>
            </div>

            <div className={`flex flex-col items-center gap-2 select-none transition-opacity duration-500 ${isDarkMode ? 'opacity-20 text-white' : 'opacity-30'}`}>
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
