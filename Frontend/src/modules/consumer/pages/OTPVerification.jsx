import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Timer, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    // Get phone/email from navigation state (passed from login/signup)
    const { type, identifier, userData } = location.state || { type: 'phone', identifier: '98765 43210' };

    const [otp, setOtp] = useState(['', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(45);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('entering'); // 'entering' | 'verifying' | 'success'
    const otpRefs = useRef([]);

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
    };

    const handleVerify = () => {
        if (otp.join('').length < 4) return;
        setLoading(true);
        setStatus('verifying');

        // Simulate OTP verification
        setTimeout(() => {
            setLoading(false);

            // If it was a signup, register first
            if (userData) {
                register('consumer', userData);
                login('consumer', userData);
            } else {
                // Mock login logic - find user by phone or email or create guest
                const user = userData || {
                    id: 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    role: 'consumer',
                    [type]: identifier
                };
                login('consumer', user);
            }

            setStatus('success');
            setTimeout(() => navigate('/'), 1500);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <header className="px-6 pt-12 pb-6">
                <button onClick={() => navigate(-1)}
                    className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" strokeWidth={2.5} />
                </button>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-black text-content tracking-tighter leading-tight mb-2">
                        Verify Identity
                    </h1>
                    <p className="text-content-subtle text-sm font-bold mb-10 leading-relaxed uppercase tracking-wider">
                        We've sent a 4-digit code to <br />
                        <span className="text-content font-black tracking-widest">{identifier}</span>
                    </p>
                </motion.div>

                <div className="flex justify-between gap-4 mb-10">
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
                            className={`w-full h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none ${otp[i] ? 'border-brand bg-brand/5 text-brand shadow-lg shadow-brand/10' : 'border-gray-100 bg-gray-50 text-content'
                                }`}
                        />
                    ))}
                </div>

                <div className="space-y-6">
                    <motion.button
                        disabled={otp.join('').length < 4 || loading}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerify}
                        className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-center transition-all shadow-2xl ${otp.join('').length === 4 ? 'bg-brand text-white shadow-brand/20' : 'bg-gray-100 text-content-subtle'
                            }`}
                    >
                        {status === 'verifying' ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <CheckCircle2 size={24} />
                        ) : 'Continue'}
                    </motion.button>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-content-muted font-bold text-[10px] uppercase tracking-widest">
                            <Timer size={14} className="text-brand" />
                            {timeLeft > 0 ? (
                                <span>Resend code in <span className="text-brand">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></span>
                            ) : (
                                <button className="text-brand font-black" onClick={() => setTimeLeft(45)}>Resend Now</button>
                            )}
                        </div>
                        {timeLeft === 0 && (
                            <button className="flex items-center gap-1.5 text-brand font-black text-[10px] uppercase tracking-widest">
                                <RefreshCw size={12} />
                                Get via Email
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-auto pb-12">
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <ShieldCheck size={16} className="text-brand flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-content-muted leading-relaxed uppercase tracking-widest">
                            Your security is our priority. OTP verification ensures your account stays <span className="text-content font-black text-brand">100% Secure</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
