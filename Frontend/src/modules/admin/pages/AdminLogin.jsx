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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[380px] relative z-10"
            >
                {/* Premium Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-[#F59E0B] blur-2xl opacity-20 animate-pulse rounded-full" />
                        <div className="w-16 h-16 bg-[#F59E0B] rounded-[1.2rem] flex items-center justify-center shadow-[0_15px_40px_rgba(245,158,11,0.3)] relative z-10 overflow-hidden">
                             {/* Text Logo for Hoora */}
                             <div className="flex flex-col items-center leading-none">
                                <span className="text-[14px] font-[1000] text-[#0A0F0D]">CLEAN</span>
                                <span className="text-[10px] font-black text-[#0A0F0D] opacity-60">2WASH</span>
                             </div>
                        </div>
                    </div>
                    <h1 className="text-[24px] font-[1000] text-white tracking-tight uppercase leading-none text-center">
                        Admin <span className="text-[#F59E0B]">Portal</span>
                    </h1>
                    <p className="mt-3 text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Fleet Management System</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-7 border border-white/10 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.15em] ml-1">System ID</label>
                                <div className="relative group">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors" size={16} />
                                    <input
                                        type="email"
                                        placeholder="admin@cleannwash.com"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-[13px] font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.15em] ml-1">Cipher Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors" size={16} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-[13px] font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                                <p className="text-red-500 text-[9px] font-black uppercase tracking-tight">{error}</p>
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full h-12 bg-[#F59E0B] text-[#0A0F0D] rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-[#F59E0B]/10 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-[#0A0F0D]/30 border-t-[#0A0F0D] rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify & Unlock
                                    <ChevronRight size={14} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Warning */}
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-3 bg-red-500/5 px-4 py-2.5 rounded-xl border border-red-500/10">
                        <ShieldAlert size={14} className="text-red-500/40" />
                        <p className="text-[8px] font-bold text-red-500/30 uppercase tracking-tight text-center leading-none">
                            Authorized Access Only • System Logged
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;

