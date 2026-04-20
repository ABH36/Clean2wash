import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Timer, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';

const CaptainOTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { captainVerifyOTP, captainSendOTP } = useCaptain();

    // Get from navigation state
    const { phone, userData, devOtp, type } = location.state || { phone: '', type: 'signup' };

    const [otp, setOtp] = useState(devOtp ? devOtp.split('') : ['', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(45);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('entering');
    const [error, setError] = useState('');
    const otpRefs = useRef([]);

    useEffect(() => {
        if (!phone) {
            navigate(type === 'signup' ? '/captain/signup' : '/captain/login');
        }
    }, [phone, navigate, type]);

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

        try {
            const isSignup = type === 'signup';
            const res = await captainVerifyOTP(phone, otp.join(''), {
                isSignup,
                userData: isSignup ? userData : null
            });

            setLoading(false);
            if (res.success) {
                setStatus('success');
                toast.success('Identity Verified!');
                setTimeout(() => {
                    if (isSignup) {
                        navigate('/captain');
                    } else {
                        navigate('/captain');
                    }
                }, 1500);
            } else {
                setStatus('entering');
                setError(res.error || 'Invalid or expired OTP. Please try again.');
                toast.error(res.error || 'Verification failed');
            }
        } catch (err) {
            setLoading(false);
            setStatus('entering');
            setError('Connection failure. Please retry.');
            toast.error('Network error');
        }
    };

    const handleResend = async () => {
        try {
            const res = await captainSendOTP(phone, type === 'signup' ? userData : null);
            setTimeLeft(45);
            setOtp(['', '', '', '']);
            toast.success(`Testing OTP: ${res?.data?.otp || 'sent'}`, { duration: 5000 });
        } catch (err) {
            toast.error('Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col font-sans relative overflow-hidden text-white">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

            <header className="px-6 pt-12 pb-6 relative z-10">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md active:scale-90 transition-all">
                    <ChevronLeft size={18} className="text-brand" strokeWidth={2.5} />
                </button>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-2 relative z-10 max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 bg-surface border border-white/5/10 text-brand rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 mx-auto">
                        <Zap size={32} />
                    </div>

                    <h1 className="text-3xl font-[1000] text-white tracking-tighter leading-tight mb-2 uppercase">
                        Confirm <span className="text-brand">Protocol.</span>
                    </h1>
                    <p className="text-white/40 text-[9px] font-black mb-10 leading-relaxed uppercase tracking-[0.3em]">
                        Authorization code dispatched to <span className="text-brand font-black ml-1 border-b border-brand/20">+{phone}</span>
                    </p>

                    {devOtp && (
                        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-4 mb-8 text-center animate-pulse">
                            <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em]">
                                Dev System OTP: {devOtp}
                            </p>
                        </div>
                    )}
                </motion.div>

                <div className="flex justify-center gap-3 mb-10">
                    {[0, 1, 2, 3].map((i) => (
                        <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            type="tel"
                            maxLength={1}
                            value={otp[i]}
                            onChange={(e) => handleOtpChange(e.target.value, i)}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                    otpRefs.current[i - 1]?.focus();
                                }
                            }}
                            className={`w-14 h-16 text-center text-2xl font-[1000] rounded-2xl border-white/5 transition-all outline-none  placeholder:opacity-20 ${otp[i]
                                ? 'border-brand bg-white/10 text-brand ring-4 ring-brand/5'
                                : 'border-white/5 bg-white/5 text-white/40 focus:border-brand/30'
                                }`}
                            placeholder="0"
                        />
                    ))}
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mb-6"
                    >
                        {error}
                    </motion.p>
                )}

                <div className="space-y-6">
                    <motion.button
                        disabled={otp.join('').length < 4 || loading}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerify}
                        className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center transition-all shadow-2xl shadow-black/50 ${otp.join('').length === 4
                            ? 'bg-brand text-white shadow-brand/20 hover:scale-[1.02]'
                            : 'bg-white/5 text-white/10 border border-white/5 pointer-events-none'
                            }`}
                    >
                        {status === 'verifying' ? (
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={20} />
                                <span>Verified</span>
                            </div>
                        ) : 'Confirm Verification'}
                    </motion.button>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-white/40 font-bold text-[9px] uppercase tracking-widest">
                            <Timer size={12} className="text-brand" />
                            {timeLeft > 0 ? (
                                <span>Resend window opens in <span className="text-brand font-black">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></span>
                            ) : (
                                <button className="text-brand font-black hover:scale-105 transition-all" onClick={handleResend}>Dispatch New Code</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pb-12 flex items-center justify-center gap-2 opacity-20">
                    <ShieldCheck size={14} className="text-brand" />
                    <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">End-to-End Encrypted Handshake</p>
                </div>
            </div>
        </div>
    );
};

export default CaptainOTPVerification;
