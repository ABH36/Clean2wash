import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';

import logo from '../../../assets/spareDriverLogo.png';

const Login = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { sendOTP, isLoggedIn } = useAuth();

    // Already logged in → go straight to home
    useEffect(() => {
        if (isLoggedIn('consumer')) navigate('/', { replace: true });
    }, [isLoggedIn, navigate]);

    const handleLogin = async () => {
        if (!identifier || identifier.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setError('');
        setLoading(true);
        const res = await sendOTP(identifier.trim(), 'phone');
        setLoading(false);
        if (res.success) {
            toast.success(`OTP Sent to +91 ${identifier}`, {
                icon: '📩',
                position: 'top-center',
                style: {
                    borderRadius: '20px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });

            navigate('/otp-verify', {
                state: { type: 'phone', identifier: identifier.trim(), devOtp: res.data?.otp }
            });
        } else {
            setError(res.error || 'Identity verification failed. Try again.');
        }
    };

    return (
        <MobileLayout hideNav={true}>
            <div className={`h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300`}>

                {/* Top Section: Branding & Visuals */}
                <div className="relative flex-[0.8] flex flex-col items-center justify-center px-8 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200"
                            alt="Luxury Car"
                            className="w-full h-full object-cover opacity-60 scale-110"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-20 flex flex-col items-center text-center"
                    >
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl">
                            <img src={logo} alt="Spare Driver Logo" className="h-[80%] w-auto drop-shadow-2xl" />
                        </div>
                        <h1 className="text-white text-xl font-black tracking-tight">Spare Driver</h1>
                    </motion.div>
                </div>

                {/* Bottom Section: Action Area */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
                    className={`rounded-t-[3rem] flex-[1] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] px-8 pt-8 pb-10 flex flex-col transition-colors border-t safe-area-bottom ${
                        isDarkMode ? 'bg-[#0A0F0D]/90 backdrop-blur-xl border-white/5' : 'bg-white border-black/5'
                    }`}
                >
                    <div className={`w-12 h-1.5 rounded-full mx-auto mb-8 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                    <div className="mb-8">
                        <motion.h2
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`text-3xl font-[1000] tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
                        >
                            Welcome <span className="text-[#F59E0B]">Back</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className={`text-sm font-bold ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                        >
                            Secure login with your mobile number
                        </motion.p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                {/* Country code box */}
                                <div className={`rounded-2xl px-5 h-[64px] flex items-center justify-center gap-2 flex-shrink-0 border ${isDarkMode ? 'bg-white/10 border-white/5' : 'bg-black/05 border-black/10'}`}>
                                    <span className="text-xl">🇮🇳</span>
                                    <span className={`font-black text-base ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>+91</span>
                                </div>

                                {/* Phone input */}
                                <div className="relative flex-1 group">
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        autoFocus
                                        placeholder="Mobile number"
                                        value={identifier}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setIdentifier(val);
                                            if (error) setError('');
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                        className={`w-full h-[64px] rounded-2xl px-6 font-black text-lg outline-none focus:ring-4 focus:ring-[#F59E0B]/20 transition-all placeholder:font-bold border ${
                                            isDarkMode
                                                ? 'bg-white/10 border-white/10 text-white placeholder:text-white/30'
                                                : 'bg-black/05 border-black/10 text-[#0F172A] placeholder:text-black/30'
                                        }`}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-500 text-xs font-black uppercase tracking-widest text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <motion.button
                                disabled={!identifier || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleLogin}
                                className={`w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[14px] flex items-center justify-center transition-all relative overflow-hidden shadow-2xl ${
                                    identifier.length === 10 && !loading
                                        ? isDarkMode
                                            ? 'bg-[#F59E0B] text-black shadow-[#F59E0B]/30'
                                            : 'bg-[#F59E0B] text-white shadow-[#F59E0B]/30'
                                        : isDarkMode
                                            ? 'bg-white/10 text-white/40 border border-white/5'
                                            : 'bg-black/10 text-black/40 border border-black/5'
                                }`}
                            >
                                <span className="relative z-10">{loading ? 'Verifying...' : 'Next Step'}</span>
                                {!loading && identifier.length === 10 && (
                                    <ArrowRight size={20} strokeWidth={3} className="ml-2 relative z-10" />
                                )}
                            </motion.button>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex flex-col gap-6">
                        <div className={`flex items-center justify-center h-14 rounded-[1.5rem] border transition-colors ${
                            isDarkMode ? 'border-white/5 bg-white/[0.03]' : 'border-black/5 bg-black/[0.02]'
                        }`}>
                            <span className={`flex items-center h-full text-[13px] font-bold !leading-none ${isDarkMode ? 'text-white/40' : 'text-black/50'}`}>
                                New User?
                            </span>
                            <Link
                                to="/signup"
                                className="flex items-center h-full ml-2 text-[13px] font-black text-[#F59E0B] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 !leading-none"
                            >
                                Register Now
                            </Link>
                        </div>

                    </div>
                </motion.div>
            </div>
        </MobileLayout>
    );
};

export default Login;
