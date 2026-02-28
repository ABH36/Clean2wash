import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck, Fingerprint, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('phone'); // 'phone' | 'email'
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { sendOTP } = useAuth();

    const handleLogin = async () => {
        if (!identifier) return;
        setError('');
        setLoading(true);
        const res = await sendOTP(identifier.trim(), loginType);
        setLoading(false);
        if (res.success) {
            navigate('/otp-verify', {
                state: { type: loginType, identifier: identifier.trim() }
            });
        } else {
            setError(res.error || 'Failed to send OTP. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden text-content">
            {/* Background Texture/Image */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <img src="/assets/carwash/1.png" className="w-full h-full object-cover scale-150 blur-3xl" alt="" />
            </div>

            {/* Premium Header */}
            <header className="px-6 pt-10 pb-6 flex items-center justify-between relative z-10">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center border border-white shadow-sm active:scale-95 transition-all">
                    <ChevronLeft size={18} className="text-brand" strokeWidth={2.5} />
                </button>
                <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white shadow-sm">
                    <button
                        onClick={() => { setLoginType('phone'); setIdentifier(''); }}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'phone' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-content-subtle'}`}
                    >
                        Phone
                    </button>
                    <button
                        onClick={() => { setLoginType('email'); setIdentifier(''); }}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'email' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-content-subtle'}`}
                    >
                        Email
                    </button>
                </div>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-2 relative z-10">
                {/* Main Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-white shadow-2xl shadow-brand/5 overflow-hidden mb-8"
                >
                    <div className="relative aspect-[16/10]">
                        <img
                            src="/assets/carwash/1.png"
                            className="w-full h-full object-cover"
                            alt="Premium Car Wash"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand">Secure Access</span>
                                </div>
                                <h1 className="text-2xl font-[1000] text-content tracking-tighter uppercase italic leading-none">
                                    Welcome <span className="text-brand">Back.</span>
                                </h1>
                            </div>
                            <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl border border-white shadow-xl flex items-center justify-center">
                                <Fingerprint size={20} className="text-brand" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Input Section */}
                <div className="space-y-6 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={loginType}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <label className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-3 block ml-1 opacity-70">
                                {loginType === 'phone' ? 'Identification Number' : 'Digital Address'}
                            </label>

                            <div className="relative">
                                {loginType === 'phone' ? (
                                    <div className="flex gap-3">
                                        <div className="bg-white border border-gray-100 rounded-xl px-4 flex items-center gap-2 flex-shrink-0 shadow-sm transition-all focus-within:border-brand/40">
                                            <span className="text-sm">🇮🇳</span>
                                            <span className="font-black text-brand text-xs">+91</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30">
                                                <Phone size={16} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="00000 00000"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-4 font-bold text-content text-base outline-none focus:border-brand/40 shadow-sm transition-all tracking-widest font-mono placeholder:text-gray-100"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30">
                                            <Mail size={16} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-4 font-bold text-content text-sm outline-none focus:border-brand/40 shadow-sm transition-all placeholder:text-gray-100"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <p className="text-red-500 text-xs font-bold uppercase tracking-wide">{error}</p>
                    )}
                    <div className="pt-2">
                        <motion.button
                            disabled={!identifier || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogin}
                            className={`w-full h-14 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-between px-10 shadow-2xl transition-all ${identifier ? 'bg-brand text-white shadow-brand/30 ring-4 ring-brand/10' : 'bg-gray-100 text-content-subtle shadow-transparent'
                                }`}
                        >
                            <span>{loading ? 'Processing...' : 'Continue'}</span>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Zap size={18} fill="currentColor" strokeWidth={0} />
                            )}
                        </motion.button>
                    </div>

                    <div className="text-center">
                        <p className="text-content-subtle text-[10px] font-bold uppercase tracking-widest opacity-60">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-brand font-black ml-1 border-b border-brand/20 pb-0.5 opacity-100">JOIN clean2wash</Link>
                        </p>
                    </div>
                </div>

                {/* Footer Security */}
                <div className="mt-auto pb-8 flex items-center justify-center gap-3 opacity-30">
                    <ShieldCheck size={14} className="text-brand" />
                    <p className="text-[8px] font-black text-content uppercase tracking-[0.3em]">End-to-End Encryption</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
