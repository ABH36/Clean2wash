import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Phone, ArrowRight, CheckCircle2, LayoutGrid, Lock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, validateCredentials } = useAuth();
    const [phase, setPhase] = useState('phone');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef([]);

    const handleSendOtp = () => {
        if (phone.length < 10 || !password) return;
        setError('');

        // Before sending OTP, we can check if credentials are valid (phone + password)
        const user = validateCredentials('consumer', { phone, password });
        if (!user) {
            setError('Invalid phone or passcode. Please check your credentials.');
            return;
        }

        setLoading(true);
        // Simulate OTP send (though we already verified password, keeping OTP for security layer)
        setTimeout(() => {
            setLoading(false);
            setPhase('otp');
        }, 1200);
    };

    const handleOtpChange = (val, i) => {
        const newOtp = [...otp];
        newOtp[i] = val.slice(-1);
        setOtp(newOtp);
        if (val && i < 3) otpRefs.current[i + 1]?.focus();
    };

    const handleVerify = () => {
        if (otp.join('').length < 4) return;
        setLoading(true);

        const user = validateCredentials('consumer', { phone, password });

        setTimeout(() => {
            if (user) {
                login('consumer', user);
                setLoading(false);
                setPhase('success');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setLoading(false);
                setError('Authentication failed. Please try again.');
                setPhase('phone');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Minimalist Header */}
            <div className="relative h-80 flex-shrink-0 bg-content overflow-hidden">
                {/* Abstract Background Design */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-brand rounded-full blur-3xl " />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-8 pb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-brand/40"
                    >
                        <LayoutGrid size={28} className="text-white" strokeWidth={2.5} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-white text-4xl font-black tracking-tighter leading-none mb-3 italic">
                            Welcome Back.
                        </h1>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                            Continuing your premium car care journey
                        </p>
                    </motion.div>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"
                >
                    <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                </button>
            </div>

            {/* Form Section */}
            <div className="flex-1 bg-white px-8 pt-10 pb-12 flex flex-col -mt-4 rounded-t-3xl relative z-10 transition-all">
                <AnimatePresence mode="wait">
                    {phase === 'phone' && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 flex-1"
                        >
                            <div className="group">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3 block ml-1 transition-colors group-focus-within:text-brand">Mobile Number</label>
                                <div className="flex gap-3">
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 flex items-center gap-2 flex-shrink-0 group-focus-within:border-brand/30 transition-all">
                                        <span className="text-sm">🇮🇳</span>
                                        <span className="font-black text-content text-sm">+91</span>
                                    </div>
                                    <div className="relative flex-1">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                            <Phone size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            placeholder="98765 43210"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-black text-content text-lg outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 tracking-widest font-mono shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3 block ml-1 transition-colors group-focus-within:text-brand">Passcode</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                        <Lock size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-black text-content outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 tracking-widest shadow-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2 mt-1">{error}</p>
                            )}

                            <div className="pt-2">
                                <motion.button
                                    disabled={phone.length < 10 || !password || loading}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSendOtp}
                                    className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-between px-8 shadow-2xl transition-all ${phone.length === 10 && password
                                        ? 'bg-brand text-white shadow-brand/25'
                                        : 'bg-gray-100 text-content-subtle shadow-transparent'
                                        }`}
                                >
                                    <span>{loading ? 'Requesting OTP...' : 'Login with Security Code'}</span>
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight size={20} strokeWidth={3} />
                                    )}
                                </motion.button>
                            </div>

                            <div className="mt-auto pt-8 text-center">
                                <p className="text-content-muted text-[11px] font-bold uppercase tracking-widest">
                                    Don't have an account?{' '}
                                    <Link to="/signup" className="text-brand font-black ml-1 border-b-2 border-brand/20 pb-0.5">Create for Free</Link>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'otp' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col flex-1"
                        >
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-8 text-center block">Verification Code sent to +91 {phone}</label>

                            <div className="grid grid-cols-4 gap-4 mb-10">
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        type="tel"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        maxLength={1}
                                        autoFocus={i === 0}
                                        value={otp[i]}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                                otpRefs.current[i - 1]?.focus();
                                            }
                                        }}
                                        className={`w-full h-16 text-center text-3xl font-black rounded-2xl border-2 outline-none transition-all ${otp[i]
                                            ? 'border-brand bg-brand/5 text-brand ring-4 ring-brand/5'
                                            : 'border-gray-100 bg-gray-50 text-content focus:border-brand/30'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <motion.button
                                    disabled={otp.join('').length < 4 || loading}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleVerify}
                                    className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-2xl ${otp.join('').length === 4
                                        ? 'bg-brand text-white shadow-brand/25'
                                        : 'bg-gray-100 text-content-subtle shadow-transparent'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : 'Verify & Continue'}
                                </motion.button>

                                <button className="w-full py-4 text-[10px] font-black text-brand tracking-[0.2em] uppercase text-center opacity-70">
                                    I didn't get the code <span className="ml-1 text-content-subtle">(0:45)</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center flex-1 py-10"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={40} className="text-green-500" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-black text-content tracking-tight mb-2">Success!</h2>
                            <p className="text-content-subtle text-sm font-medium text-center italic">
                                Signing you in...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-auto pt-8 flex items-center justify-center gap-2 opacity-40">
                    <ShieldCheck size={14} className="text-content" />
                    <p className="text-[9px] font-bold text-content uppercase tracking-[0.1em]">Encryption active • CarWash Secure</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

