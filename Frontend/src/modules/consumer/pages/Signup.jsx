import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, User, Mail, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

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
            toast.success(`Code sent`, {
                icon: '📩',
                style: { borderRadius: '20px', background: '#000', color: '#fff', fontSize: '12px' }
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
    const inputClass = `w-full rounded-2xl px-6 py-[18px] font-bold text-base outline-none focus:ring-2 focus:ring-[#F59E0B]/20 transition-all placeholder:text-opacity-20 ${
        isDarkMode
            ? 'bg-white/10 text-white placeholder:text-white/20 focus:bg-white/15'
            : 'bg-black/05 text-[#0F172A] placeholder:text-black/20 focus:bg-white focus:border focus:border-black/10'
    }`;

    const iconInputClass = `w-full rounded-2xl pl-14 pr-6 py-[18px] font-bold text-base outline-none focus:ring-2 focus:ring-[#F59E0B]/20 transition-all ${
        isDarkMode
            ? 'bg-white/10 text-white placeholder:text-white/20 focus:bg-white/15'
            : 'bg-black/05 text-[#0F172A] placeholder:text-black/20 focus:bg-white focus:border focus:border-black/10'
    }`;

    return (
        <div className={`h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FAF6EB] text-black'}`}>

            {/* Top Branding */}
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
                    <img src={logo} alt="Logo" className="h-24 w-auto mb-2 drop-shadow-2xl" />
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.25em]">Spare Driver</p>
                </motion.div>
            </div>

            {/* Bottom Form Area */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`rounded-t-[2.5rem] flex-[1.9] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] px-8 pt-10 pb-10 flex flex-col overflow-y-auto transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}
            >
                {/* Header row */}
                <header className="flex items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 -ml-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/05 text-black'}`}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="ml-2">
                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Registration</h2>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Welcome to Spare Driver App Team</p>
                    </div>
                </header>

                <div className="space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase ml-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Full Name</label>
                        <div className="relative group">
                            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#F59E0B] ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>
                                <User size={18} />
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
                        <label className={`text-[10px] font-bold uppercase ml-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Mobile Number</label>
                        <div className="flex gap-3">
                            <div className={`rounded-2xl px-5 flex items-center gap-2 flex-shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-black/05'}`}>
                                <span className="text-base">🇮🇳</span>
                                <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>+91</span>
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
                        <label className={`text-[10px] font-bold uppercase ml-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Email Address</label>
                        <div className="relative group">
                            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#F59E0B] ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>
                                <Mail size={18} />
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
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[11px] font-semibold text-center">
                            {error}
                        </motion.p>
                    )}

                    {/* Submit */}
                    <div className="pt-4">
                        <motion.button
                            disabled={!formData.name || formData.phone.length < 10 || !formData.email || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSignup}
                            className={`w-full h-16 rounded-2xl font-bold text-sm flex items-center justify-center transition-all relative overflow-hidden shadow-lg ${
                                formData.name && formData.phone.length === 10 && formData.email && !loading
                                    ? isDarkMode
                                        ? 'bg-[#F59E0B] text-black shadow-[#F59E0B]/20'
                                        : 'bg-black text-white shadow-black/20'
                                    : isDarkMode
                                        ? 'bg-white/10 text-white/20 shadow-none'
                                        : 'bg-black/05 text-black/20 shadow-none'
                            }`}
                        >
                            <span className="relative z-10">{loading ? 'Creating account...' : 'Create account'}</span>
                            {!loading && <ArrowRight size={18} strokeWidth={3} className="ml-2 relative z-10" />}
                        </motion.button>
                    </div>

                    {/* Login link */}
                    <div className="text-center pt-2">
                        <p className={`text-[11px] font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#F59E0B] font-bold">Log in</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
