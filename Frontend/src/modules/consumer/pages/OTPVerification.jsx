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
    const { type, identifier, userData } = location.state || { type: 'phone', identifier: '00000 00000' };

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
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/20 to-white flex flex-col font-sans relative overflow-hidden text-content">
            {/* Subtle Brand Blobs */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

            <header className="px-6 pt-12 pb-6 relative z-10">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-orange-100 shadow-sm active:scale-90 transition-all">
                    <ChevronLeft size={18} className="text-brand" strokeWidth={2.5} />
                </button>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-2 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Hero Image Section - More Compact */}
                    <div className="w-full aspect-[16/7] bg-orange-50 rounded-xl overflow-hidden mb-6 border border-orange-100 shadow-lg shadow-brand/5 relative group">
                        <img
                            src="/assets/carwash/6.png"
                            alt="Security Verification"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand/20 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="w-7 h-7 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center border border-orange-100 shadow-sm">
                                <ShieldCheck size={14} className="text-brand" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-[1000] text-content tracking-tighter leading-tight mb-1.5 uppercase italic">
                        Verify <span className="text-brand">Identity.</span>
                    </h1>
                    <p className="text-content-subtle text-[8px] font-black mb-8 leading-relaxed uppercase tracking-[0.2em] opacity-80">
                        Code sent to <span className="text-brand font-black ml-1 border-b border-brand/20">{identifier}</span>
                    </p>
                </motion.div>

                <div className="flex justify-center gap-2.5 mb-8">
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
                            className={`w-11 h-13 text-center text-lg font-[1000] rounded-xl border-2 transition-all outline-none shadow-sm ${otp[i] ? 'border-brand bg-white text-brand ring-4 ring-brand/5' : 'border-orange-100 bg-white text-content-subtle focus:border-brand/30'
                                }`}
                        />
                    ))}
                </div>

                <div className="space-y-5">
                    <motion.button
                        disabled={otp.join('').length < 4 || loading}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerify}
                        className={`w-full h-13 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center transition-all shadow-xl ${otp.join('').length === 4 ? 'bg-brand text-white shadow-brand/20' : 'bg-gray-100 text-content-subtle'
                            }`}
                    >
                        {status === 'verifying' ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <CheckCircle2 size={20} />
                        ) : 'Confirm OTP'}
                    </motion.button>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-content-subtle font-bold text-[8px] uppercase tracking-widest opacity-80">
                            <Timer size={10} className="text-brand" />
                            {timeLeft > 0 ? (
                                <span>Resend in <span className="text-brand">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span></span>
                            ) : (
                                <button className="text-brand font-black" onClick={() => setTimeLeft(45)}>Resend Code</button>
                            )}
                        </div>
                        {timeLeft === 0 && (
                            <button className="flex items-center gap-1.5 text-brand font-black text-[8px] uppercase tracking-widest">
                                <RefreshCw size={8} />
                                via Email
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-auto pb-8 flex items-center justify-center gap-2 opacity-20">
                    <ShieldCheck size={10} className="text-brand" />
                    <p className="text-[7px] font-black text-content uppercase tracking-[0.2em]">Verified Secure Access</p>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
