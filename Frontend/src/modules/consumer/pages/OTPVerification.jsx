import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

import logo from '../../../assets/spareDriverLogo.png';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const { verifyOTP, sendOTP } = useAuth();

    const { type, identifier, userData, devOtp } = location.state || { type: 'phone', identifier: '' };

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(45);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('entering'); // entering | verifying | success
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const otpRefs = useRef([]);

    // Dev: show OTP in toast
    useEffect(() => {
        if (devOtp) {
            toast.dismiss();
            toast(`Code: ${devOtp}`, {
                icon: '🔢',
                duration: 8000,
                position: 'top-center',
                style: {
                    borderRadius: '16px',
                    background: '#111',
                    color: '#F59E0B',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    padding: '10px 18px',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)'
                }
            });
        }
    }, [devOtp]);

    useEffect(() => {
        if (!identifier) navigate('/login');
    }, [identifier, navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleOtpChange = (val, i) => {
        const newOtp = [...otp];
        newOtp[i] = val.slice(-1);
        setOtp(newOtp);
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
        if (i === 5 && val) {
            setTimeout(() => {
                const fullOtp = [...newOtp];
                fullOtp[5] = val.slice(-1);
                if (fullOtp.join('').length === 6) handleVerify(fullOtp.join(''));
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
                if (needsSignup) navigate('/signup', { state: { identifier } });
                else navigate('/');
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

    const otpFilled = otp.join('').length === 6;

    return (
        <div className={`h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FAF6EB] text-black'}`}>

            {/* Top: Branding with BG image */}
            <div className="relative flex-[0.7] flex flex-col items-center justify-center px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200"
                        alt="Luxury Car"
                        className="w-full h-full object-cover opacity-60 scale-110"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-20 flex flex-col items-center text-center"
                >
                    <img src={logo} alt="Logo" className="h-24 w-auto mb-2 drop-shadow-2xl" />
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.25em]">Spare Driver</p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.15em] mt-1">Welcome to Spare Driver App Team</p>
                </motion.div>
            </div>

            {/* Bottom: OTP Form */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`rounded-t-[2.5rem] flex-[1] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-6 pt-10 pb-8 flex flex-col transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}
            >
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/05 text-black'}`}
                    >
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>
                    <div className="text-right">
                        <p className={`text-[9px] font-bold mb-0.5 uppercase tracking-wider ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Verifying</p>
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>+91 {identifier}</p>
                    </div>
                </header>

                <div className="flex-1">
                    {/* Title */}
                    <h2 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                        Confirm <span className="text-[#F59E0B]">identity</span>
                    </h2>
                    <p className={`text-xs font-medium mb-8 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                        Enter the 6-digit code sent to you
                    </p>

                    {/* OTP Boxes */}
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
                                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 outline-none ${
                                    otp[i]
                                        ? isDarkMode
                                            ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-white shadow-lg shadow-[#F59E0B]/10'
                                            : 'border-[#F59E0B] bg-[#FFF8E7] text-[#0F172A] shadow-md shadow-[#F59E0B]/10'
                                        : isDarkMode
                                            ? 'border-white/10 bg-white/5 text-white'
                                            : 'border-black/10 bg-black/05 text-[#0F172A]'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-[11px] font-semibold text-center mb-6"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Verify Button */}
                    <motion.button
                        disabled={!otpFilled || loading}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVerify()}
                        className={`w-full h-[60px] rounded-2xl font-bold text-sm flex items-center justify-center transition-all relative overflow-hidden ${
                            otpFilled
                                ? isDarkMode
                                    ? 'bg-[#F59E0B] text-black shadow-xl shadow-[#F59E0B]/20'
                                    : 'bg-black text-white shadow-xl shadow-black/20'
                                : isDarkMode
                                    ? 'bg-white/10 text-white/20'
                                    : 'bg-black/05 text-black/20'
                        }`}
                    >
                        {status === 'verifying' ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className={`w-5 h-5 border-2 rounded-full border-t-transparent ${isDarkMode ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`}
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

                    {/* Resend timer */}
                    <div className="text-center mt-8">
                        {timeLeft > 0 ? (
                            <div className={`flex items-center justify-center gap-2 text-[11px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                <div className="w-1 h-1 rounded-full bg-[#F59E0B] animate-pulse" />
                                <span>Resend code in 0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="text-[#F59E0B] font-bold text-xs underline underline-offset-4 decoration-[#F59E0B]/30 disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Resend OTP'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OTPVerification;
