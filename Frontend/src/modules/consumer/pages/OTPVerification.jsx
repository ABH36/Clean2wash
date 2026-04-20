import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Timer, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

import logo from '../../../assets/spareDriverLogo.png';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, sendOTP } = useAuth();

    const { type, identifier, userData, devOtp } = location.state || { type: 'phone', identifier: '' };

    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
    const [timeLeft, setTimeLeft] = useState(45);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('entering');
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const otpRefs = useRef([]);

    // Show OTP in toast for development - Single source for verification toast
    useEffect(() => {
        if (devOtp) {
            // Dismiss all existing toasts to prevent stacking
            toast.dismiss();
            
            toast(`Your verification code is: ${devOtp}`, {
                icon: '🔢',
                duration: 8000,
                position: 'top-center',
                style: {
                    borderRadius: '20px',
                    background: '#F59E0B',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 24px',
                    boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
                }
            });
        }
    }, [devOtp]);

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
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
        
        // Auto-verify if last box filled
        if (i === 5 && val) {
            setTimeout(() => {
                const fullOtp = [...newOtp];
                fullOtp[5] = val.slice(-1);
                if (fullOtp.join('').length === 6) {
                    handleVerify(fullOtp.join(''));
                }
            }, 100);
        }
        setError('');
    };

    const handleVerify = async (otpOverride) => {
        const finalOtp = otpOverride || otp.join('');
        if (finalOtp.length < 6) return;
        
        setError('');
        setLoading(true);
        setStatus('verifying');

        const isSignup = !!userData;
        const res = await verifyOTP(identifier, finalOtp, type, {
            isSignup,
            userData: isSignup ? userData : null
        });

        setLoading(false);
        if (res.success) {
            setStatus('success');
            const needsSignup = res.data?.needsSignup;

            toast.success(needsSignup ? 'Mobile Verified' : 'Access Granted', { 
                icon: '🔑',
                style: { 
                    background: '#000', 
                    color: '#fff', 
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                } 
            });

            setTimeout(() => {
                if (needsSignup) {
                    navigate('/signup', { state: { identifier } });
                } else {
                    navigate('/');
                }
            }, 800);
        } else {
            setStatus('entering');
            setError(res.error || 'Invalid code. Try again.');
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0 || resending || !identifier) return;
        setResending(true);
        setError('');
        const response = await sendOTP(identifier, type, userData || null);
        if (response.success) {
            setTimeLeft(45);
            setOtp(['', '', '', '', '', '']);
            if (response.data?.otp) {
                toast.dismiss();
                toast(`New Code: ${response.data.otp}`, { icon: '🔢', position: 'top-center' });
            }
        } else {
            setError(response.error || 'Failed to resend');
        }
        setResending(false);
    };

    return (
        <div className="h-screen bg-black flex flex-col font-sans relative overflow-hidden text-white">
            {/* Top Section: Visual Branding */}
            <div className="relative flex-[1.2] flex flex-col items-center justify-center px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1549399542-7e3f8b79c34b?auto=format&fit=crop&q=80&w=1200" 
                        alt="Security Background" 
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black z-10" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-20 flex flex-col items-center"
                >
                    <img src={logo} alt="Logo" className="h-32 w-auto mb-3 drop-shadow-2xl" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Spare Driver Verification</p>
                </motion.div>
            </div>

            {/* Bottom Section: Action Area */}
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white/5 rounded-t-[2.5rem] flex-[1] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-6 pt-10 pb-8 flex flex-col text-white"
            >
                <header className="flex items-center justify-between mb-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-black/05 rounded-xl flex items-center justify-center"
                    >
                        <ChevronLeft size={18} strokeWidth={3} className="text-[#0F172A]" />
                    </button>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-black/30 mb-0.5 uppercase tracking-wider">Verifying</p>
                        <p className="text-xs font-bold text-[#0F172A]">+91 {identifier}</p>
                    </div>
                </header>

                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-1">
                        Confirm <span className="text-[#F59E0B]">identity</span>
                    </h2>
                    <p className="text-xs text-white/40 font-medium mb-8">
                        Enter the 6-digit code sent to you
                    </p>

                    {/* OTP Inputs: 6 Square Boxes */}
                    <div className="flex justify-between gap-2 mb-10">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
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
                                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-white/5 transition-all duration-300 outline-none ${
                                    otp[i] 
                                        ? 'border-[#F59E0B] bg-white/5 text-[#0F172A] shadow-lg shadow-[#F59E0B]/10' 
                                        : 'border-black/05 bg-black/05 text-white'
                                }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[11px] font-semibold text-center mb-6">
                            {error}
                        </motion.p>
                    )}

                    <motion.button
                        disabled={otp.join('').length < 6 || loading}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVerify()}
                        className={`w-full h-15 rounded-2xl font-bold text-sm flex items-center justify-center transition-all group overflow-hidden relative ${
                            otp.join('').length === 6 
                            ? 'bg-black text-white shadow-2xl shadow-black/50' 
                            : 'bg-black/05 text-white/20'
                        }`}
                    >
                        {status === 'verifying' ? (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-white/5 border-white/10 border-t-white rounded-full" 
                            />
                        ) : status === 'success' ? (
                            <CheckCircle2 size={24} className="text-[#F59E0B]" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Verify and proceed</span>
                                <ArrowRight size={18} strokeWidth={3} />
                            </div>
                        )}
                    </motion.button>

                    <div className="text-center mt-8">
                        {timeLeft > 0 ? (
                            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-white/40">
                                <div className="w-1 h-1 rounded-full bg-[#F59E0B] animate-pulse" />
                                <span>Resend code in 0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                            </div>
                        ) : (
                            <button 
                                onClick={handleResend}
                                className="text-[#F59E0B] font-bold text-xs underline underline-offset-4 decoration-[#F59E0B]/30"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OTPVerification;
