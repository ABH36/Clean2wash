import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    Fingerprint,
    Lock,
    ChevronRight,
    ShieldAlert,
    Cpu,
    ArrowLeft,
    Terminal
} from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await adminLogin(email, password);

        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.error || 'Invalid System ID or Passcode. Try: admin@CarWash.in / admin123');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            {/* Glow Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/20 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Tech Header */}
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="w-20 h-20 bg-brand text-white rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(var(--brand-rgb),0.3)] mb-8 animate-pulse">
                        <Cpu size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">CarWash <br /><span className="text-brand">Infrastructure</span></h1>
                    <div className="flex items-center gap-2 mt-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                        <Terminal size={12} className="text-brand" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Authorized Access Only</p>
                    </div>
                </div>

                {/* Secure Auth Card */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/10">
                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 px-1">
                                    System ID
                                </label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                    <input
                                        type="email"
                                        placeholder="admin@CarWash.in"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none focus:border-brand transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 px-1">
                                    Cipher Key
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none focus:border-brand transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        {error && (
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
                        )}

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_30px_rgba(var(--brand-rgb),0.3)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify & Unlock
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Warnings */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 bg-red-500/10 px-6 py-4 rounded-3xl border border-red-500/10">
                        <ShieldAlert size={20} className="text-red-500" />
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight text-center">Unauthorised entry attempts are <br />logged and prosecuted.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
