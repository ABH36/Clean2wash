import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Phone, Zap, Star, ArrowRight, Camera, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const CaptainLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [phase, setPhase] = useState('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef([]);

    const handleSendOtp = () => {
        if (phone.length < 10) return;
        setLoading(true);
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

        // Captain usually enters phone first. 
        // For simplicity in mock, any 4 digit works, but we check if phone exists.
        const user = validateCredentials('captain', { phone, password: '' }); // Only phone check for now or mockup

        setTimeout(() => {
            setLoading(false);
            if (user) {
                login('captain', user);
                navigate('/captain');
            } else {
                // If not found, we could redirect to signup or show error
                alert("Phone number not registered. Please signup first.");
                navigate('/captain/signup');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-content flex flex-col font-sans overflow-hidden">
            {/* ── Visual Header ── */}
            <div className="relative h-72 flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80"
                    alt="Captain"
                    className="w-full h-full object-cover grayscale-[0.5] brightness-[0.4]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-content via-content/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-brand p-1.5 rounded-lg shadow-lg shadow-brand/20">
                                <Zap size={14} className="text-white" fill="white" />
                            </div>
                            <span className="text-brand text-[10px] font-black uppercase tracking-[0.2em]">Captain Partner App</span>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tighter leading-tight italic">
                            {phase === 'phone' ? 'Start Earning.\nWash Smarter.' :
                                phase === 'otp' ? 'Verify Your\nIdentity.' : 'Join the\nElite Force.'}
                        </h1>
                        <p className="text-white/40 text-[11px] font-bold">Earn up to ₹45k/month with flexible hours</p>
                    </motion.div>
                </div>

                {phase !== 'phone' && (
                    <button onClick={() => setPhase('phone')} className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                        <ChevronLeft size={20} className="text-white" strokeWidth={3} />
                    </button>
                )}
            </div>

            {/* ── Interaction Area ── */}
            <div className="flex-1 bg-content relative px-6 pt-6 pb-12 flex flex-col">
                <AnimatePresence mode="wait">
                    {phase === 'phone' && (
                        <motion.div key="phone"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col flex-1"
                        >
                            <p className="text-white/60 font-bold text-sm mb-6">Enter your mobile to sign in or register</p>

                            <div className="flex gap-3 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center gap-2 flex-shrink-0">
                                    <span className="text-lg">🇮🇳</span>
                                    <span className="font-black text-white text-sm">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Enter Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-lg outline-none focus:border-brand/40 placeholder:text-white/20 tracking-wider"
                                />
                            </div>

                            <motion.button
                                disabled={phone.length < 10 || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSendOtp}
                                className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all ${phone.length === 10 ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-white/5 text-white/20'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Get OTP <ArrowRight size={18} strokeWidth={3} /></>
                                )}
                            </motion.button>

                            <div className="mt-auto grid grid-cols-2 gap-4 pt-10">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <Star size={16} className="text-yellow-400 mb-2" fill="currentColor" />
                                    <p className="text-white text-sm font-black italic tracking-tight">4.9/5</p>
                                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">Captain Rating</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <ShieldCheck size={16} className="text-blue-400 mb-2" />
                                    <p className="text-white text-sm font-black italic tracking-tight">₹5L</p>
                                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">Accident Cover</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'otp' && (
                        <motion.div key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col flex-1"
                        >
                            <p className="text-white/60 font-bold text-sm mb-2">
                                We sent a 4-digit code to
                            </p>
                            <div className="flex items-center gap-2 mb-8">
                                <span className="text-white font-black text-lg italic tracking-tight">+91 {phone}</span>
                                <button onClick={() => setPhase('phone')} className="text-brand text-[10px] font-black uppercase tracking-widest border-b border-brand/30">Change</button>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        type="tel"
                                        maxLength={1}
                                        value={otp[i]}
                                        autoFocus={i === 0}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                                        }}
                                        className={`h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all ${otp[i] ? 'border-brand bg-brand/10 text-brand ring-4 ring-brand/10' : 'border-white/10 bg-white/5 text-white focus:border-brand/40'
                                            }`}
                                    />
                                ))}
                            </div>

                            <motion.button
                                disabled={otp.join('').length < 4 || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleVerify}
                                className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all ${otp.join('').length === 4 ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-white/5 text-white/20'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : 'Verify & Sign In'}
                            </motion.button>

                            <button className="mt-6 text-[11px] font-black text-brand uppercase tracking-widest text-center">Resend code in 0:24</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Note */}
            <div className="px-8 pb-10 text-center">
                <p className="text-white/20 text-[9px] font-bold leading-relaxed">
                    By continuing, you agree to become a Hoora Partner and accept our
                    <span className="text-white/40"> Partner Terms</span> & <span className="text-white/40">Payout Policies</span>.
                </p>
            </div>
        </div>
    );
};

export default CaptainLogin;
