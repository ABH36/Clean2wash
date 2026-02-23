import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, User, Phone, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Signup = () => {
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const [phase, setPhase] = useState('details'); // 'details' | 'otp' | 'success'
    const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef([]);

    const handleSendOtp = () => {
        if (!formData.name || formData.phone.length < 10 || !formData.password) return;
        setLoading(true);
        // Simulate API call
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
        // Register the user
        setTimeout(() => {
            const userData = { ...formData, role: 'consumer', id: 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase() };
            register('consumer', userData);
            setLoading(false);
            setPhase('success');
            // Auto-login after success delay
            setTimeout(() => {
                login('consumer', userData);
                navigate('/');
            }, 2000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header / Banner Section */}
            <div className="relative h-72 flex-shrink-0 overflow-hidden">
                <motion.img
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                    src="https://images.unsplash.com/photo-1607860108855-6497f5cd2b70?w=800&q=80"
                    alt="Premium Car Care"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-black/30" />

                <div className="absolute top-12 left-6 right-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-gray-100"
                    >
                        <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                    </button>
                    <div className="px-4 py-2 bg-brand/10 backdrop-blur-md rounded-full border border-brand/20">
                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.15em]">New Member</span>
                    </div>
                </div>

                <div className="absolute bottom-10 left-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-content text-4xl font-black tracking-tighter leading-none mb-1">
                            {phase === 'otp' ? 'Confirm Identity' : phase === 'success' ? 'All Set!' : 'Create Account'}
                        </h1>
                        <p className="text-content-muted text-xs font-bold uppercase tracking-wider">
                            {phase === 'otp' ? 'Enter the security code' : phase === 'success' ? 'Your journey begins now' : 'Start your premium experience'}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 px-8 pt-4 pb-12 flex flex-col">
                <AnimatePresence mode="wait">
                    {phase === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 flex-1"
                        >
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 block ml-1 transition-colors group-focus-within:text-brand">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                            <User size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 block ml-1 transition-colors group-focus-within:text-brand">Mobile Number</label>
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
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content text-lg outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 tracking-widest font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-2 block ml-1 transition-colors group-focus-within:text-brand">Create Passcode</label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 tracking-widest"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <motion.button
                                    disabled={!formData.name || formData.phone.length < 10 || !formData.password || loading}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSendOtp}
                                    className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-between px-8 shadow-2xl transition-all ${formData.name && formData.phone.length === 10 && formData.password
                                        ? 'bg-brand text-white shadow-brand/25'
                                        : 'bg-gray-100 text-content-subtle shadow-transparent'
                                        }`}
                                >
                                    <span>{loading ? 'Processing...' : 'Send Verification Code'}</span>
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight size={20} strokeWidth={3} />
                                    )}
                                </motion.button>
                            </div>

                            <div className="mt-auto pt-8 text-center">
                                <p className="text-content-muted text-xs font-bold">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-brand font-black uppercase tracking-widest text-[10px] ml-1">Log In</Link>
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
                            <p className="text-content-subtle font-bold text-sm mb-8 text-center">
                                We've sent a 4-digit code to <br />
                                <span className="text-content font-black tracking-widest">+91 {formData.phone}</span>
                            </p>

                            <div className="grid grid-cols-4 gap-4 mb-10 px-2">
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
                                            ? 'border-brand bg-white text-brand shadow-lg shadow-brand/10 ring-4 ring-brand/5'
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
                                    ) : 'Complete Signup'}
                                </motion.button>

                                <button className="w-full py-4 text-[10px] font-black text-brand uppercase tracking-[0.2em] text-center">
                                    Resend Code <span className="text-content-subtle ml-1">0:45</span>
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
                            <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6 relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                >
                                    <CheckCircle2 size={48} className="text-brand" strokeWidth={3} />
                                </motion.div>
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-brand"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </div>
                            <h2 className="text-2xl font-black text-content tracking-tight mb-2">Welcome Aboard!</h2>
                            <p className="text-content-subtle text-sm font-medium text-center">
                                Your account has been created.<br />
                                Redirecting you to the dashboard...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <ShieldCheck size={16} className="text-brand flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-content-muted leading-relaxed uppercase tracking-wider">
                        Protected by <span className="text-content font-black">CarWash Secure Identity</span>.
                        Your data is encrypted end-to-end.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
