import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('phone'); // 'phone' | 'email'
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        if (!identifier) return;
        setLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setLoading(false);
            navigate('/otp-verify', {
                state: {
                    type: loginType,
                    identifier: identifier
                }
            });
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)}
                    className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                </button>
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <button
                        onClick={() => { setLoginType('phone'); setIdentifier(''); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'phone' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}
                    >
                        Phone
                    </button>
                    <button
                        onClick={() => { setLoginType('email'); setIdentifier(''); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'email' ? 'bg-white text-brand shadow-sm' : 'text-content-muted'}`}
                    >
                        Email
                    </button>
                </div>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12"
                >
                    <div className="w-16 h-16 bg-brand/10 rounded-3xl flex items-center justify-center mb-6 shadow-brand/10 shadow-xl">
                        <Fingerprint size={32} className="text-brand" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-black text-content tracking-tighter leading-tight mb-2 italic">
                        Welcome Back.
                    </h1>
                    <p className="text-content-subtle text-[10px] font-black uppercase tracking-[0.2em]">
                        {loginType === 'phone' ? 'Login with Mobile OTP' : 'Login with Email OTP'}
                    </p>
                </motion.div>

                <div className="space-y-8 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={loginType}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="group"
                        >
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3 block ml-1">
                                {loginType === 'phone' ? 'Mobile Number' : 'Email Address'}
                            </label>

                            <div className="relative">
                                {loginType === 'phone' ? (
                                    <div className="flex gap-3">
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm">🇮🇳</span>
                                            <span className="font-black text-content text-sm">+91</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle">
                                                <Phone size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="98765 43210"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content text-lg outline-none focus:border-brand/30 focus:bg-white transition-all tracking-widest font-mono"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle">
                                            <Mail size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content outline-none focus:border-brand/30 focus:bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="pt-2">
                        <motion.button
                            disabled={!identifier || loading}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogin}
                            className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-between px-8 shadow-2xl transition-all ${identifier ? 'bg-brand text-white shadow-brand/25' : 'bg-gray-100 text-content-subtle shadow-transparent'
                                }`}
                        >
                            <span>{loading ? 'Requesting OTP...' : 'Login with OTP'}</span>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowRight size={20} strokeWidth={3} />
                            )}
                        </motion.button>
                    </div>

                    <div className="text-center">
                        <p className="text-content-muted text-[11px] font-bold uppercase tracking-widest">
                            New here?{' '}
                            <Link to="/signup" className="text-brand font-black ml-1 border-b-2 border-brand/20 pb-0.5">Signup Free</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pb-12 flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck size={14} className="text-content" />
                    <p className="text-[9px] font-black text-content uppercase tracking-[0.2em]">End-to-End Encryption</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
