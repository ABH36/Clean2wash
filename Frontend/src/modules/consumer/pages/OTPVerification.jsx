import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Timer, RefreshCw, CheckCircle2, ArrowRight, Zap, Lock } from 'lucide-react';
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
            toast.success('Access Granted', { 
                icon: '🔓',
                style: { 
                    background: '#0F172A', 
                    color: '#fff', 
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                } 
            });
            setTimeout(() => navigate('/'), 800);
        } else {
            setStatus('entering');
            setError(res.error || 'Invalid Sequence. Try Again.');
            toast.error(res.error || 'Identity Mismatch');
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
            toast.success(`Protocol Refreshed`, { 
                icon: '📨', 
                style: { 
                    background: '#0F172A', 
                    color: '#fff', 
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase'
                } 
            });
        } else {
            setError(response.error || 'Failed To Initialize Resend');
        }
        setResending(false);
    };

    return (
        <div className="min-h-screen bg-[#FBF8EF] flex flex-col font-sans relative overflow-hidden text-black">
            {/* ── Cinematic Background ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF9900]/10 rounded-full blur-[120px] opacity-40" />
            </div>

            {/* ── Custom Header ── */}
            <header className="px-6 pt-16 pb-4 relative z-10 flex items-center justify-between">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 bg-white border border-black/05 shadow-md shadow-black/5 rounded-[16px] flex items-center justify-center active:scale-95 transition-all text-[#FF9900]"
                >
                    <ChevronLeft size={22} strokeWidth={3} />
                </motion.button>
                <div className="bg-black text-white px-5 py-2.5 rounded-full border border-white/10 shadow-xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF9900] animate-pulse" />
                    <span className="text-[9px] font-[1000] uppercase tracking-[0.2em] leading-none">Safe Link Active</span>
                </div>
            </header>

            <div className="flex-1 px-8 flex flex-col relative z-10 pt-6">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col items-center mb-12 text-center"
                >
                    {/* Elite Monogram */}
                    <div className="w-20 h-20 mb-7 relative group">
                        <div className="absolute inset-0 bg-[#FF9900] rounded-full blur-[20px] opacity-20 animate-pulse" />
                        <div className="relative w-18 h-18 bg-black rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                            <span className="text-white text-2xl font-[1000] tracking-tighter">SD</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-[1000] tracking-tighter leading-tight mb-3 uppercase text-[#0F172A]">
                        Final <span className="text-[#FF9900]">Validation</span>
                    </h1>
                    <p className="text-black/30 text-[9px] font-black leading-relaxed uppercase tracking-[0.2em] max-w-[240px]">
                        Verify the sequence sent to <span className="text-red-500 font-black">{identifier}</span>
                    </p>
                </motion.div>

                {/* Dev Mode Notification */}
                {devOtp && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="bg-black/80 backdrop-blur-md rounded-[18px] p-4 mb-10 text-center shadow-xl border border-white/10"
                    >
                        <p className="text-[10px] font-black text-[#FF9900] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <Zap size={14} fill="#FF9900" /> Dev Instance: Sequence Pre-Loaded
                        </p>
                    </motion.div>
                )}

                <div className="flex justify-center gap-4 mb-12">
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
                            className={`w-15 h-18 text-center text-3xl font-[1000] rounded-[22px] border-2 transition-all duration-300 outline-none shadow-sm ${
                                otp[i] 
                                    ? 'border-[#FF9900] bg-white text-black shadow-[#FF9900]/10' 
                                    : 'border-black/05 bg-white text-black/10 focus:border-[#FF9900]/30'
                            }`}
                        />
                    ))}
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="flex items-center justify-center gap-2 text-red-500 mb-8"
                    >
                        <Zap size={12} fill="currentColor" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
                    </motion.div>
                )}

                <div className="space-y-8 max-w-sm mx-auto w-full">
                    <motion.button
                        disabled={otp.join('').length < 4 || loading}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleVerify}
                        className={`w-full h-16 rounded-[24px] font-[1000] text-[11px] uppercase tracking-[0.4em] flex items-center justify-center transition-all shadow-2xl relative overflow-hidden group ${
                            otp.join('').length === 4 
                                ? 'bg-[#FF9900] text-black shadow-[#FF9900]/20' 
                                : 'bg-black/[0.03] text-black/10 border border-black/05'
                            }`}
                    >
                        {status === 'verifying' ? (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full" 
                            />
                        ) : status === 'success' ? (
                            <CheckCircle2 size={24} className="animate-bounce" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <span>Recall Account</span>
                                <ArrowRight size={18} strokeWidth={4} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                        
                        {/* Shine Effect */}
                        <motion.div 
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-y-0 w-32 bg-white/10 skew-x-12"
                        />
                    </motion.button>

                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="text-black/20 font-black text-[9px] uppercase tracking-[0.3em]">
                            {timeLeft > 0 ? (
                                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-black/05">
                                    <Timer size={14} className="text-[#FF9900]" />
                                    <span>Signal Recalibration in <span className="text-black font-black">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></span>
                                </div>
                            ) : (
                                <button 
                                    className="text-[#FF9900] font-[1000] px-6 py-2 border-b-2 border-[#FF9900]/20 hover:border-[#FF9900] transition-all" 
                                    onClick={handleResend} 
                                    disabled={resending}
                                >
                                    {resending ? 'SIGNALING...' : 'RE-INITIALIZE SEQUENCE'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secure Trust Mark */}
                <div className="mt-auto pb-14 flex flex-col items-center">
                    <div className="flex items-center gap-4 bg-black/[0.02] border border-black/05 px-6 py-2.5 rounded-full mb-6">
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-[#FF9900]" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/40">Secure Perimeter</span>
                        </div>
                    </div>
                    
                    <p className="text-[7.5px] text-black/15 uppercase tracking-[0.2em] font-black max-w-[280px] leading-loose text-center">
                        SESSION ACCESS PROTOCOLS ARE FULLY ENCRYPTED AND COMPLIANT WITH ELITE SERVICE STANDARDS.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
