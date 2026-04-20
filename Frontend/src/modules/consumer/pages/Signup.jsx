import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, User, Mail, Phone, AlertCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

import logo from '../../../assets/spareDriverLogo.png';

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sendOTP } = useAuth();

    // Prefill from location state if coming from verified-but-not-signed-up-flow
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

    return (
        <div className="h-screen bg-black flex flex-col font-sans relative overflow-hidden text-white">
            {/* Top Section: Branding */}
            <div className="relative flex-[1.1] flex flex-col items-center justify-center px-8 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40 grayscale">
                    <img 
                        src="https://images.unsplash.com/photo-1493238507154-203698ad19fb?auto=format&fit=crop&q=80&w=1200" 
                        alt="High-end Drive" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-20 flex flex-col items-center text-center"
                >
                    <img src={logo} alt="Logo" className="h-32 w-auto mb-4 drop-shadow-2xl" />
                    <h1 className="text-xl font-bold tracking-tight text-white/90">Create your account</h1>
                </motion.div>
            </div>

            {/* Bottom Section: Form Area */}
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white/5 rounded-t-[2.5rem] flex-[1.9] z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-8 pt-10 pb-10 flex flex-col text-white overflow-y-auto"
            >
                <header className="flex items-center mb-8">
                   <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-black/05 rounded-full transition-all">
                      <ChevronLeft size={24} />
                   </button>
                    <div className="ml-2">
                        <h2 className="text-xl font-bold text-[#0F172A]">Registration</h2>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-black/30">Personal details</p>
                    </div>
                </header>

                <div className="space-y-5">
                    {/* Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Full Name</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/05 rounded-2xl pl-14 pr-6 py-4.5 font-bold text-[#0F172A] text-base outline-none focus:bg-white/5 focus:ring-2 focus:ring-[#F59E0B]/10 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* Phone Input (Read-only if prefilled) */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Mobile Number</label>
                        <div className="flex gap-3">
                            <div className="bg-black/05 rounded-2xl px-5 flex items-center gap-2 flex-shrink-0">
                                <span className="text-base">🇮🇳</span>
                                <span className="font-bold text-[#0F172A] text-sm">+91</span>
                            </div>
                            <div className="relative flex-1 group">
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
                                    className={`w-full bg-black/05 rounded-2xl px-6 py-4.5 font-bold text-[#0F172A] text-base outline-none transition-all placeholder:text-white/20 ${prefilledIdentifier ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white/5 focus:ring-2 focus:ring-[#F59E0B]/10'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Email Address</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#F59E0B] transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black/05 rounded-2xl pl-14 pr-6 py-4.5 font-bold text-[#0F172A] text-base outline-none focus:bg-white/5 focus:ring-2 focus:ring-[#F59E0B]/10 transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[11px] font-semibold text-center">
                            {error}
                        </motion.p>
                    )}

                    <div className="pt-4">
                        <motion.button
                            disabled={!formData.name || formData.phone.length < 10 || !formData.email || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSignup}
                            className={`w-full h-16 rounded-2xl font-bold text-sm flex items-center justify-center transition-all group overflow-hidden relative shadow-lg ${
                                formData.name && formData.phone.length === 10 && formData.email && !loading
                                ? 'bg-black text-white shadow-black/20'
                                : 'bg-black/05 text-white/20 shadow-none'
                            }`}
                        >
                            <span className="relative z-10">{loading ? 'Creating account...' : 'Create account'}</span>
                            {!loading && <ArrowRight size={18} strokeWidth={3} className="ml-2 relative z-10" />}
                        </motion.button>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-black/30 text-[11px] font-medium">
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
