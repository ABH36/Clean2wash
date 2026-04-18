import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Timer, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, sendOTP } = useAuth();

    // Get from navigation state (login = no userData, signup = userData)
    const { type, identifier, userData, devOtp } = location.state || { type: 'phone', identifier: '' };

    const [otp, setOtp] = useState(devOtp ? devOtp.split('') : ['', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(45);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('entering');
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (!identifier) {
            navigate('/login');
        }
    }, [identifier, navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleOtpChange = (val, i) => {
        const newOtp = [...otp];
        newOtp[i] = val.slice(-1);
        setOtp(newOtp);
        if (val && i < 3) otpRefs.current[i + 1]?.focus();
        setError('');
    };

    const handleVerify = async () => {
        if (otp.join('').length < 4) return;
        setError('');
        setLoading(true);
        setStatus('verifying');

        const isSignup = !!userData;
        const res = await verifyOTP(identifier, otp.join(''), type, {
            isSignup,
            userData: isSignup ? userData : null
        });

        setLoading(false);
        if (res.success) {
            setStatus('success');
            toast.success('Verification Successful', { style: { background: '#0F172A', color: '#fff', borderRadius: '12px' } });
            setTimeout(() => navigate('/'), 800);
        } else {
            setStatus('entering');
            setError(res.error || 'Invalid Verification Code');
            toast.error(res.error || 'Verification Failed');
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0 || resending || !identifier) return;
        setResending(true);
        setError('');
        const response = await sendOTP(identifier, type, userData || null);
        if (response.success) {
            setTimeLeft(45);
            setOtp(['', '', '', '']);
            toast.success(`New Code Sent`, { icon: '📨', style: { background: '#0F172A', color: '#fff', borderRadius: '12px' } });
        } else {
            setError(response.error || 'Failed To Resend Code');
        }
        setResending(false);
    };

    return (
        <div className="min-h-screen bg-[#FBF8EF] flex flex-col font-sans relative overflow-hidden text-black">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none">
                <div className="absolute top-[-15%] left-[-15%] w-[400px] h-[400px] bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] right-[-15%] w-[400px] h-[400px] bg-[#F59E0B]/10 rounded-full blur-[100px]" />
            </div>

            <header className="px-6 pt-12 pb-4 relative z-10 flex items-center justify-between">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-black/05 shadow-sm rounded-xl flex items-center justify-center active:scale-95 transition-all text-[#F59E0B]">
                    <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
                <div className="bg-white px-3 py-1.5 rounded-full border border-black/05 shadow-sm flex items-center gap-2">
                    <ShieldCheck size={12} className="text-[#0F172A]" />
                    <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider leading-none">Secure Link</span>
                </div>
            </header>

            <div className="flex-1 px-8 flex flex-col relative z-10 pt-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-10 text-center">
                    {/* Premium Spare Driver Monogram */}
                    <div className="w-20 h-20 mb-6 relative">
                        <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-[15px] opacity-20 animate-pulse" />
                        <div className="relative w-full h-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                            <span className="text-white text-3xl font-[1000] tracking-tighter">SD</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-[1000] tracking-tighter leading-tight mb-2 uppercase text-[#0F172A]">
                        Verify <span className="text-[#F59E0B]">Account</span>
                    </h1>
                    <p className="text-black/30 text-[9px] font-black leading-relaxed uppercase tracking-[0.2em] max-w-[220px]">
                        We've sent a code to your registered <span className="text-black font-black">{identifier}</span>
                    </p>
                </motion.div>

                {/* Dev Mode Notification */}
                {devOtp && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-black/05 rounded-xl p-3.5 mb-8 text-center shadow-sm">
                        <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">
                            Testing Mode: Code Pre-Filled
                        </p>
                    </motion.div>
                )}

                <div className="flex justify-center gap-3 mb-10">
                    {[0, 1, 2, 3].map((i) => (
                        <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            type="tel"
                            maxLength={1}
                            autoFocus={i === 0}
                            value={otp[i]}
                            onChange={(e) => handleOtpChange(e.target.value, i)}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                    otpRefs.current[i - 1]?.focus();
                                }
                            }}
                            className={`w-14 h-16 text-center text-2xl font-[1000] rounded-2xl border-2 transition-all outline-none shadow-sm ${otp[i] ? 'border-[#F59E0B] bg-white text-[#0F172A]' : 'border-black/05 bg-white text-black/20 focus:border-[#F59E0B]/50'
                                }`}
                        />
                    ))}
                </div>

                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{error}</motion.p>
                )}

                <div className="space-y-6 max-w-sm mx-auto w-full">
                    <motion.button
                        disabled={otp.join('').length < 4 || loading}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVerify}
                        className={`w-full h-15 rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.4em] flex items-center justify-center transition-all shadow-2xl ${otp.join('').length === 4 ? 'bg-[#0F172A] text-white shadow-black/20' : 'bg-black/05 text-black/20'
                            }`}
                    >
                        {status === 'verifying' ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <CheckCircle2 size={24} />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Verify Code</span>
                                <ArrowRight size={18} strokeWidth={4} />
                            </div>
                        )}
                    </motion.button>

                    <div className="flex items-center justify-center px-1">
                        <div className="text-black/20 font-black text-[10px] uppercase tracking-widest">
                            {timeLeft > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Timer size={14} className="text-[#F59E0B]" />
                                    <span>Resend in <span className="text-black">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></span>
                                </div>
                            ) : (
                                <button className="text-[#F59E0B] font-[1000] border-b-2 border-[#F59E0B]/30 pb-0.5" onClick={handleResend} disabled={resending}>
                                    {resending ? 'Sending...' : 'Request New Code'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secure Trust Mark */}
                <div className="mt-auto pb-10 flex flex-col items-center gap-4 opacity-20">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#0F172A]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0F172A]">Safe Link Protocol Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
