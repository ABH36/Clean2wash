import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck, Fingerprint, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('phone'); // 'phone' | 'email'
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { sendOTP } = useAuth();

    const handleLogin = async () => {
        if (!identifier) return;

        if (loginType === 'phone') {
            if (identifier.length < 10) {
                setError('Please enter a valid 10-digit phone number.');
                return;
            }
        } else if (loginType === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(identifier)) {
                setError('Please enter a valid email address.');
                return;
            }
        }

        setError('');
        setLoading(true);
        const res = await sendOTP(identifier.trim(), loginType);
        setLoading(false);
        if (res.success) {
            toast.success(`Otp Sent Successfully`, { 
                icon: '🔑',
                style: {
                    borderRadius: '12px',
                    background: '#0F172A',
                    color: '#fff',
                }
            });
            navigate('/otp-verify', {
                state: { type: loginType, identifier: identifier.trim(), devOtp: res.data?.otp }
            });
        } else {
            setError(res.error || 'Failed to send Otp. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF8EF] flex flex-col font-sans relative overflow-hidden text-black">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none">
                <div className="absolute top-[-15%] right-[-15%] w-[400px] h-[400px] bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] bg-[#FF9900]/10 rounded-full blur-[100px]" />
            </div>

            {/* Header / Logo Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pt-12 pb-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-10 flex flex-col items-center"
                >
                    {/* Premium Spare Driver Monogram */}
                    <div className="w-20 h-20 mb-5 relative">
                        <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-[15px] opacity-20 animate-pulse" />
                        <div className="relative w-full h-full bg-gradient-to-br from-[#FF9900] to-[#D97706] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                            <span className="text-white text-3xl font-[1000] tracking-tighter">SD</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-[1000] tracking-tighter uppercase leading-none text-[#0F172A]">
                        Spare <span className="text-[#F59E0B]">Driver</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4 opacity-40">
                        <div className="h-[1px] w-8 bg-black/20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Safe • Reliable • On Time</span>
                        <div className="h-[1px] w-8 bg-black/20" />
                    </div>
                </motion.div>

                {/* Login Form Container */}
                <div className="w-full max-w-sm space-y-6">
                    {/* Method Toggle */}
                    <div className="flex bg-white p-1.5 rounded-2xl border border-black/05 shadow-sm">
                        <button
                            onClick={() => { setLoginType('phone'); setIdentifier(''); }}
                            className={`flex-1 py-3.5 rounded-xl text-[11px] font-[1000] uppercase tracking-widest transition-all ${loginType === 'phone' ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20' : 'text-black/30'}`}
                        >
                            Phone
                        </button>
                        <button
                            onClick={() => { setLoginType('email'); setIdentifier(''); }}
                            className={`flex-1 py-3.5 rounded-xl text-[11px] font-[1000] uppercase tracking-widest transition-all ${loginType === 'email' ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20' : 'text-black/30'}`}
                        >
                            Email
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={loginType}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="relative"
                            >
                                {loginType === 'phone' ? (
                                    <div className="flex gap-2">
                                        <div className="bg-white border border-black/10 rounded-2xl px-5 flex items-center gap-2 flex-shrink-0 shadow-sm">
                                            <span className="text-sm">🇮🇳</span>
                                            <span className="font-black text-[#0F172A] text-xs">+91</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                autoFocus
                                                placeholder="Enter Phone Number"
                                                value={identifier}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 10) setIdentifier(val);
                                                }}
                                                className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4.5 font-black text-[#0F172A] text-base outline-none focus:border-[#F59E0B] transition-all tracking-[0.1em] placeholder:text-black/10 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="email"
                                        autoFocus
                                        placeholder="Enter Email Address"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4.5 font-black text-[#0F172A] text-sm outline-none focus:border-[#F59E0B] transition-all placeholder:text-black/10 shadow-sm"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</motion.p>
                        )}

                        <motion.button
                            disabled={!identifier || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogin}
                            className={`w-full h-15 rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all ${identifier && !loading ? 'bg-[#0F172A] text-white shadow-2xl shadow-black/20' : 'bg-black/05 text-black/20'
                                }`}
                        >
                            <span>{loading ? 'Verifying...' : 'Continue'}</span>
                            {!loading && <ArrowRight size={18} strokeWidth={4} />}
                        </motion.button>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-black/30 text-[10px] font-black uppercase tracking-[0.2em]">
                            New to Spare Driver?{' '}
                            <Link to="/signup" className="text-[#F59E0B] font-[1000] ml-1 border-b-2 border-[#F59E0B]/30 pb-0.5">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer / Legal */}
            <div className="pb-12 pt-6 px-8 text-center relative z-10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 opacity-30">
                    <ShieldCheck size={16} className="text-[#0F172A]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0F172A]">Safe & Secure Portal</span>
                </div>
                <div className="h-[1px] w-12 bg-[#F59E0B]/30 rounded-full" />
                <p className="text-[8px] text-black/20 uppercase tracking-[0.15em] font-black px-6 leading-relaxed">
                    By logging in, you agree to our Service Terms and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
