import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Zap, Globe, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

import logo from '../../../assets/spareDriverLogo.png';

const Login = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { sendOTP } = useAuth();

    const handleLogin = async () => {
        if (!identifier || identifier.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setError('');
        setLoading(true);
        // Defaulting to phone for the mobile-first 'Rapido' style
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
        <div className="h-screen bg-black flex flex-col font-sans relative overflow-hidden text-white">
            {/* Top Section: Branding & Visuals */}
            <div className="relative flex-[1.2] flex flex-col items-center justify-center px-8 overflow-hidden">
                {/* Visual Background (luxury noise/gradient) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200" 
                        alt="Luxury Car" 
                        className="w-full h-full object-cover opacity-60 scale-110"
                    />
                </div>

                {/* Logo Area */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-20 flex flex-col items-center text-center"
                >
                    <img 
                        src={logo} 
                        alt="Spare Driver Logo" 
                        className="h-36 w-auto mb-4 drop-shadow-2xl"
                    />
                </motion.div>
            </div>

            {/* Bottom Section: Action Area (The 'Rapido' Bottom Sheet Feel) */}
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
                className="bg-white/5 rounded-t-[2.5rem] flex-[1] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-8 pt-10 pb-10 flex flex-col text-white"
            >
                <div className="mb-8">
                    <motion.h2 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-bold text-[#0F172A] mb-1"
                    >
                        Get <span className="text-[#F59E0B]">started</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs text-white/40 font-medium"
                    >
                        Enter your mobile number to continue
                    </motion.p>
                </div>

                <div className="space-y-6">
                    {/* Phone Input Group */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="bg-black/05 rounded-2xl px-5 flex items-center gap-2 flex-shrink-0">
                                <span className="text-base">🇮🇳</span>
                                <span className="font-bold text-[#0F172A] text-sm">+91</span>
                            </div>
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
                                    className="w-full bg-black/05 rounded-2xl px-6 py-4.5 font-bold text-[#0F172A] text-base outline-none focus:bg-white/5 focus:ring-2 focus:ring-[#F59E0B]/10 transition-all placeholder:text-white/20"
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
                            className={`w-full h-16 rounded-2xl font-bold text-sm flex items-center justify-center transition-all group overflow-hidden relative ${
                                identifier.length === 10 && !loading 
                                ? 'bg-black text-white' 
                                : 'bg-black/05 text-white/20'
                            }`}
                        >
                            <span className="relative z-10">{loading ? 'Verifying...' : 'Next step'}</span>
                            {!loading && identifier.length === 10 && (
                                <ArrowRight size={18} strokeWidth={3} className="ml-2 relative z-10" />
                            )}
                        </motion.button>
                    </div>
                </div>

                <div className="mt-auto text-center pt-8">
                    <p className="text-black/30 text-[10px] font-medium leading-relaxed">
                        By continuing, you agree to our <br/>
                        <span className="text-white/60 font-semibold underline underline-offset-4">Terms of service</span> & <span className="text-white/60 font-semibold underline underline-offset-4">Privacy policy</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
