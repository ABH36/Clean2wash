import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

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
        <div className={`h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FAF6EB] text-black'}`}>

            {/* Top Section: Branding & Visuals */}
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-20 flex flex-col items-center text-center"
                >
                    <img src={logo} alt="Spare Driver Logo" className="h-24 w-auto mb-2 drop-shadow-2xl" />
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.25em]">Spare Driver</p>
                </motion.div>
            </div>

            {/* Bottom Section: Action Area */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
                className={`rounded-t-[2.5rem] flex-[1] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-8 pt-10 pb-10 flex flex-col transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}
            >
                <div className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}
                    >
                        Get <span className="text-[#F59E0B]">started</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-xs font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                    >
                        Enter your mobile number to continue
                    </motion.p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            {/* Country code box */}
                            <div className={`rounded-2xl px-5 flex items-center gap-2 flex-shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-black/05'}`}>
                                <span className="text-base">🇮🇳</span>
                                <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>+91</span>
                            </div>

                            {/* Phone input */}
                            <div className="relative flex-1 group">
                                <input
                                    type="tel"
                                    maxLength={10}
                                    autoFocus
                                    placeholder="Enter your phone number"
                                    value={identifier}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setIdentifier(val);
                                        if (error) setError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className={`w-full rounded-2xl px-6 py-[18px] font-bold text-base outline-none focus:ring-2 focus:ring-[#F59E0B]/20 transition-all placeholder:text-opacity-20 ${
                                        isDarkMode
                                            ? 'bg-white/10 text-white placeholder:text-white/20 focus:bg-white/15'
                                            : 'bg-black/05 text-[#0F172A] placeholder:text-black/20 focus:bg-white focus:border focus:border-black/10'
                                    }`}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 text-[11px] font-semibold text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            disabled={!identifier || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogin}
                            className={`w-full h-16 rounded-2xl font-bold text-sm flex items-center justify-center transition-all relative overflow-hidden ${
                                identifier.length === 10 && !loading
                                    ? isDarkMode
                                        ? 'bg-[#F59E0B] text-black'
                                        : 'bg-black text-white'
                                    : isDarkMode
                                        ? 'bg-white/10 text-white/20'
                                        : 'bg-black/05 text-black/20'
                            }`}
                        >
                            <span className="relative z-10">{loading ? 'Verifying...' : 'Next step'}</span>
                            {!loading && identifier.length === 10 && (
                                <ArrowRight size={18} strokeWidth={3} className="ml-2 relative z-10" />
                            )}
                        </motion.button>
                    </div>
                </div>

                <div className="mt-auto pt-6 space-y-4">
                    {/* Terms */}
                    <p className={`text-[10px] font-medium leading-relaxed text-center ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                        By continuing, you agree to our <br />
                        <span className={`font-semibold underline underline-offset-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Terms of service</span>
                        {' '}&amp;{' '}
                        <span className={`font-semibold underline underline-offset-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Privacy policy</span>
                    </p>

                    {/* Create Account CTA for new users */}
                    <div className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-colors ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-black/05 bg-black/[0.02]'}`}>
                        <p className={`text-[12px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            New here?
                        </p>
                        <Link
                            to="/signup"
                            className="text-[12px] font-black text-[#F59E0B] underline underline-offset-4 decoration-[#F59E0B]/30"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
