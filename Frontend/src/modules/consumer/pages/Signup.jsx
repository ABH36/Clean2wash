import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, User, Mail, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';

import logo from '../../../assets/spareDriverLogo.png';

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const { sendOTP, isLoggedIn } = useAuth();

    // Already logged in → go straight to home
    useEffect(() => {
        if (isLoggedIn('consumer')) navigate('/', { replace: true });
    }, [isLoggedIn, navigate]);

    const prefilledIdentifier = location.state?.identifier || '';

    const [formData, setFormData] = useState({
        name: '',
        phone: prefilledIdentifier || '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!formData.name || formData.phone.length < 10 || !formData.email) {
            setError('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setLoading(true);

        const userData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            role: 'consumer'
        };

        const res = await sendOTP(formData.phone, 'phone', userData);
        setLoading(false);

        if (res.success) {
            toast.success(`Verification code sent`, {
                icon: '📩',
                style: { borderRadius: '20px', background: '#000', color: '#fff' }
            });
            navigate('/otp-verify', {
                state: {
                    type: 'phone',
                    identifier: formData.phone,
                    userData,
                    devOtp: res.data?.otp
                }
            });
        } else {
            setError(res.error || 'Failed to initialize account. Try again.');
        }
    };

    // Reusable input class builder
    const inputClass = `w-full h-[54px] rounded-2xl px-6 font-black text-sm outline-none focus:ring-4 focus:ring-[#F59E0B]/10 transition-all placeholder:text-opacity-20 border ${isDarkMode
            ? 'bg-white/05 border-white/5 text-white placeholder:text-white/20'
            : 'bg-black/05 border-black/5 text-[#0F172A] placeholder:text-black/20 focus:bg-white'
        }`;

    const iconInputClass = `w-full h-[54px] rounded-2xl pl-[3.5rem] pr-6 font-black text-sm outline-none focus:ring-4 focus:ring-[#F59E0B]/10 transition-all border ${isDarkMode
            ? 'bg-white/05 border-white/5 text-white placeholder:text-white/20'
            : 'bg-black/05 border-black/5 text-[#0F172A] placeholder:text-black/20 focus:bg-white'
        }`;

    return (
        <MobileLayout hideNav={true}>
            <div className={`h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300`}>

                {/* Top Branding */}
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
                        className="relative z-20 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl">
                            <img src={logo} alt="Logo" className="h-[75%] w-auto drop-shadow-2xl" />
                        </div>
                        <h1 className="text-white text-lg font-black tracking-tight uppercase tracking-[0.2em]">Spare Driver</h1>
                    </motion.div>
                </div>

                {/* Bottom Form Area */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`rounded-t-[3rem] flex-[2.2] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-8 pt-6 pb-10 flex flex-col overflow-y-auto transition-colors border-t safe-area-bottom ${
                        isDarkMode ? 'bg-[#0A0F0D]/90 backdrop-blur-xl border-white/5' : 'bg-white border-black/5'
                    }`}
                >
                    <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                    {/* Header row */}
                    <header className="flex items-center mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 text-white shadow-lg' : 'bg-black/05 text-black shadow-sm'}`}
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                        <div className="ml-4">
                            <h2 className={`text-2xl font-[1000] tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Enrollment</h2>
                            <p className={`text-[10px] uppercase tracking-[0.25em] font-black ${isDarkMode ? 'text-[#F59E0B]' : 'text-[#F59E0B]'}`}>Identity verification</p>
                        </div>
                    </header>

                    <div className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className={`text-[11px] font-black uppercase ml-2 tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Full Name</label>
                            <div className="relative group">
                                <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#F59E0B] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={iconInputClass}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className={`text-[11px] font-black uppercase ml-2 tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Mobile Number</label>
                            <div className="flex gap-3">
                                <div className={`rounded-2xl px-5 h-[54px] flex items-center justify-center gap-2 flex-shrink-0 border ${isDarkMode ? 'bg-white/10 border-white/5' : 'bg-black/05 border-black/10'}`}>
                                    <span className="text-xl">🇮🇳</span>
                                    <span className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>+91</span>
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="Phone number"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            if (prefilledIdentifier) return;
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setFormData({ ...formData, phone: val });
                                        }}
                                        readOnly={!!prefilledIdentifier}
                                        className={`${inputClass} ${prefilledIdentifier ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className={`text-[11px] font-black uppercase ml-2 tracking-widest ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>Email Address</label>
                            <div className="relative group">
                                <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#F59E0B] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={iconInputClass}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[11px] font-black uppercase tracking-widest text-center">
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <div className="pt-4">
                            <motion.button
                                disabled={!formData.name || formData.phone.length < 10 || !formData.email || loading}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSignup}
                                className={`w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[14px] flex items-center justify-center transition-all relative overflow-hidden shadow-2xl ${formData.name && formData.phone.length === 10 && formData.email && !loading
                                        ? isDarkMode
                                            ? 'bg-[#F59E0B] text-black shadow-[#F59E0B]/30'
                                            : 'bg-[#F59E0B] text-white shadow-[#F59E0B]/30'
                                        : isDarkMode
                                            ? 'bg-white/10 text-white/40 border border-white/5 shadow-none'
                                            : 'bg-black/10 text-black/40 border border-black/5 shadow-none'
                                    }`}
                            >
                                <span className="relative z-10">{loading ? 'Creating account...' : 'Create account'}</span>
                                {!loading && <ArrowRight size={20} strokeWidth={3} className="ml-2 relative z-10" />}
                            </motion.button>
                        </div>

                        {/* Login link */}
                        <div className={`flex items-center justify-center h-14 rounded-[1.5rem] mt-2 border transition-colors ${
                            isDarkMode ? 'border-white/5 bg-white/[0.03]' : 'border-black/5 bg-black/[0.02]'
                        }`}>
                            <span className={`flex items-center h-full text-[13px] font-bold !leading-none ${isDarkMode ? 'text-white/40' : 'text-black/50'}`}>
                                Joined before?
                            </span>
                            <Link 
                                to="/login" 
                                className="flex items-center h-full ml-2 text-[13px] font-black text-[#F59E0B] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 !leading-none"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </MobileLayout>
    );
};

export default Signup;
