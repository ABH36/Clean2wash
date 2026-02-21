import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Phone } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('phone'); // 'phone' | 'otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef([]);

    const handleSendOtp = () => {
        if (phone.length < 10) return;
        setLoading(true);
        setTimeout(() => { setLoading(false); setPhase('otp'); }, 1200);
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
        setTimeout(() => { setLoading(false); navigate('/'); }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Image */}
            <div className="relative h-56 flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                    alt="Car Wash"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                    {phase === 'otp' && (
                        <button onClick={() => setPhase('phone')} className="absolute top-12 left-4 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <ChevronLeft size={18} className="text-white" strokeWidth={2.5} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-brand p-1.5 rounded-lg">
                            <Phone size={14} className="text-white" fill="white" strokeWidth={1.5} />
                        </div>
                        <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">Hoora · Smart Vehicle Care</span>
                    </div>
                    <h1 className="text-white text-3xl font-black tracking-tighter leading-tight">
                        {phase === 'phone' ? 'Your phone.\nYour garage.' : 'Verify\nyour number.'}
                    </h1>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 px-5 pt-7 pb-8 flex flex-col">

                <AnimatePresence mode="wait">

                    {/* Phone Phase */}
                    {phase === 'phone' && (
                        <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1">
                            <p className="text-content-subtle font-bold text-sm mb-5">Enter your mobile number to continue</p>

                            <div className="flex gap-2 mb-5">
                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-base">🇮🇳</span>
                                    <span className="font-black text-content text-sm">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black text-content text-lg outline-none focus:border-brand/30 placeholder:font-bold placeholder:text-content-subtle tracking-widest"
                                />
                            </div>

                            <motion.button
                                disabled={phone.length < 10 || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSendOtp}
                                className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md ${phone.length === 10 ? 'bg-brand text-white shadow-brand/25' : 'bg-gray-100 text-content-subtle'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : 'Get OTP'}
                            </motion.button>

                            <div className="mt-auto pt-6 flex items-start gap-2">
                                <ShieldCheck size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-content-subtle leading-relaxed">
                                    By continuing, you agree to Hoora's{' '}
                                    <span className="text-brand underline">Terms of Service</span> &{' '}
                                    <span className="text-brand underline">Privacy Policy</span>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* OTP Phase */}
                    {phase === 'otp' && (
                        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1">
                            <p className="text-content-subtle font-bold text-sm mb-1">
                                OTP sent to <span className="text-content font-black">+91 {phone}</span>
                            </p>
                            <p className="text-[9px] font-bold text-content-subtle mb-6 uppercase tracking-widest">Check your messages</p>

                            {/* OTP Inputs */}
                            <div className="flex gap-3 mb-6">
                                {otp.map((d, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        type="tel"
                                        maxLength={1}
                                        value={d}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && otpRefs.current[i - 1]?.focus()}
                                        className={`flex-1 h-14 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all ${d ? 'border-brand bg-brand/5 text-brand' : 'border-gray-100 bg-gray-50 text-content'
                                            }`}
                                    />
                                ))}
                            </div>

                            <motion.button
                                disabled={otp.join('').length < 4 || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleVerify}
                                className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md ${otp.join('').length === 4 ? 'bg-brand text-white shadow-brand/25' : 'bg-gray-100 text-content-subtle'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : 'Verify & Continue'}
                            </motion.button>

                            <button className="mt-4 text-[11px] font-black text-brand uppercase tracking-widest text-center">Resend OTP</button>

                            <div className="mt-auto pt-4 flex items-start gap-2">
                                <ShieldCheck size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-content-subtle">End-to-end encrypted OTP by Hoora Security</p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
