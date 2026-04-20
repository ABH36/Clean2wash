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
    ShieldCheck,
    LockIcon
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
            setError(result.error || 'Invalid System ID or Passcode');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Elite Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] relative z-10"
            >
                {/* Premium Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#F59E0B] rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(245,158,11,0.2)] mb-6">
                        <ShieldCheck size={32} className="text-[#0A0F0D]" />
                    </div>
                    <h1 className="text-[28px] font-black text-white tracking-tight uppercase leading-none text-center">
                        Spare Driver<br />
                        <span className="text-[#F59E0B] text-[22px]">Infrastructure</span>
                    </h1>
                    <div className="mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Authorized Access Only</p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em] ml-1">System ID</label>
                                <div className="relative group">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors" size={18} />
                                    <input
                                        type="email"
                                        placeholder="admin@SpareDriver.in"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em] ml-1">Cipher Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-tight leading-tight">{error}</p>
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full h-14 bg-[#F59E0B] text-[#0A0F0D] rounded-2xl font-black uppercase text-[11px] tracking-[0.15em] shadow-xl shadow-[#F59E0B]/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#0A0F0D]/30 border-t-[#0A0F0D] rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify & Unlock
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Warning */}
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-3 bg-red-500/5 px-5 py-3 rounded-2xl border border-red-500/10">
                        <ShieldAlert size={16} className="text-red-500/60" />
                        <p className="text-[9px] font-bold text-red-500/40 uppercase tracking-tight text-center leading-tight">
                            Attempts are logged & prosecuted.<br />Unauthorized access is a felony.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;

