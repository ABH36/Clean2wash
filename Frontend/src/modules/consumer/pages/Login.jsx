import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Phone } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('details'); // 'details' | 'otp'
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef([]);

    const handleSendOtp = () => {
        if (!formData.name || formData.phone.length < 10) return;
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

            {/* Image Section */}
            <div className="relative h-64 flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                    alt="Car Wash"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                    {phase === 'otp' && (
                        <button onClick={() => setPhase('details')} className="absolute top-12 left-4 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <ChevronLeft size={18} className="text-white" strokeWidth={2.5} />
                        </button>
                    )}
                    <h1 className="text-white text-4xl font-black tracking-tighter leading-none mb-2 italic">
                        {phase === 'details' ? 'Welcome to\nHoora Care.' : 'Last Step.\nVerification.'}
                    </h1>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                        {phase === 'details' ? 'Join 50,000+ car owners' : `Code sent to +91 ${formData.phone}`}
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 px-6 pt-8 pb-10 flex flex-col">

                <AnimatePresence mode="wait">

                    {/* Details Phase */}
                    {phase === 'details' && (
                        <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 block ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-black text-content outline-none focus:border-brand/30 placeholder:text-content-subtle/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 block ml-1">Mobile Number</label>
                                <div className="flex gap-3">
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 flex items-center gap-2 flex-shrink-0">
                                        <span className="text-base">🇮🇳</span>
                                        <span className="font-black text-content text-sm">+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-black text-content text-lg outline-none focus:border-brand/30 tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <motion.button
                                    disabled={!formData.name || formData.phone.length < 10 || loading}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSendOtp}
                                    className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand/10 ${formData.name && formData.phone.length === 10 ? 'bg-brand text-white' : 'bg-gray-100 text-content-subtle'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : 'Verify Identity'}
                                </motion.button>
                            </div>

                            <div className="mt-auto pt-6 flex items-start gap-2">
                                <ShieldCheck size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-content-subtle leading-relaxed">
                                    Your data is encrypted by <span className="text-content font-black">Hoora Security</span>. We never share your personal info.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* OTP Phase */}
                    {phase === 'otp' && (
                        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1">
                            <p className="text-content-subtle font-bold text-sm mb-6 uppercase tracking-widest text-[9px] text-center">Enter the code from SMS</p>

                            <div className="grid grid-cols-4 gap-4 mb-8">
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
                                        className={`w-full h-16 text-center text-3xl font-black rounded-2xl border-2 outline-none transition-all ${otp[i] ? 'border-brand bg-brand/5 text-brand ring-8 ring-brand/5' : 'border-gray-100 bg-gray-50 text-content focus:border-brand/30'
                                            }`}
                                    />
                                ))}
                            </div>

                            <motion.button
                                disabled={otp.join('').length < 4 || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleVerify}
                                className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand/10 ${otp.join('').length === 4 ? 'bg-brand text-white' : 'bg-gray-100 text-content-subtle'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : 'Finish & Go Home'}
                            </motion.button>

                            <button className="mt-6 text-[11px] font-black text-brand uppercase tracking-widest text-center">Resend Code (0:45)</button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
