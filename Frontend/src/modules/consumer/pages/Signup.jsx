import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck, Zap, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Signup = () => {
    const navigate = useNavigate();
    const { sendOTP } = useAuth();
    const [formData, setFormData] = useState({ 
        name: '', 
        phone: '', 
        email: '', 
        emergencyContact: '' 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        metadata: {
            emergencyContact: formData.emergencyContact
        },
        role: 'consumer'
    };

    const handleContinue = async () => {
        if (!formData.name || formData.phone.length < 10 || !formData.email) {
            setError('Please Fill In All Primary Fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please Enter A Valid Email Address.');
            return;
        }

        setError('');
        setLoading(true);
        const res = await sendOTP(formData.phone, 'phone', userData);
        setLoading(false);
        if (res.success) {
            toast.success(`Welcome To Spare Driver`, { 
                icon: '✨',
                style: { background: '#0F172A', color: '#fff', borderRadius: '12px' }
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
            setError(res.error || 'Failed To Send Otp. Please Try Again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF8EF] flex flex-col font-sans relative overflow-hidden text-black">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none">
                <div className="absolute top-[-15%] left-[-15%] w-[400px] h-[400px] bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] right-[-15%] w-[400px] h-[400px] bg-[#F59E0B]/10 rounded-full blur-[100px]" />
            </div>

            {/* Header / Logo */}
            <div className="flex flex-col items-center pt-12 pb-4 relative z-10 px-8">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
                    {/* Premium Spare Driver Monogram */}
                    <div className="w-16 h-16 mb-5 relative">
                        <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-[12px] opacity-20 animate-pulse" />
                        <div className="relative w-full h-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center shadow-lg border-[3px] border-white">
                            <span className="text-white text-2xl font-[1000] tracking-tighter">SD</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-30 mb-1">
                        <div className="h-[1px] w-5 bg-black" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Premium • Trusted • Secure</span>
                        <div className="h-[1px] w-5 bg-black" />
                    </div>
                    <h1 className="text-2xl font-[1000] tracking-tighter uppercase leading-none text-[#0F172A]">
                        Create <span className="text-[#F59E0B]">Account</span>
                    </h1>
                </motion.div>
            </div>

            <div className="flex-1 px-8 flex flex-col relative z-10 pt-2">
                <div className="space-y-4 max-w-sm mx-auto w-full">
                    {/* Input Fields */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#F59E0B] transition-colors">
                            <User size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white border border-black/10 rounded-2xl pl-12 pr-4 py-4 font-black text-[#0F172A] text-xs outline-none focus:border-[#F59E0B] transition-all placeholder:text-black/10 uppercase tracking-widest shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="bg-white border border-black/10 rounded-2xl px-5 flex items-center gap-2 flex-shrink-0 shadow-sm">
                            <span className="text-sm">🇮🇳</span>
                            <span className="font-black text-[#0F172A] text-[10px] tracking-tight">+91</span>
                        </div>
                        <div className="relative flex-1 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#F59E0B] transition-colors">
                                <Phone size={14} />
                            </div>
                            <input
                                type="tel"
                                maxLength={10}
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setFormData({ ...formData, phone: val });
                                }}
                                className="w-full bg-white border border-black/10 rounded-2xl pl-11 pr-4 py-4 font-black text-[#0F172A] text-xs outline-none focus:border-[#F59E0B] transition-all tracking-[0.1em] placeholder:text-black/10 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#F59E0B] transition-colors">
                            <Mail size={14} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white border border-black/10 rounded-2xl pl-11 pr-4 py-4 font-black text-[#0F172A] text-xs outline-none focus:border-[#F59E0B] transition-all placeholder:text-black/10 uppercase tracking-widest shadow-sm"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/20 group-focus-within:text-red-500 transition-colors">
                            <AlertCircle size={14} />
                        </div>
                        <input
                            type="tel"
                            maxLength={10}
                            placeholder="Emergency Contact (Optional)"
                            value={formData.emergencyContact}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 10) setFormData({ ...formData, emergencyContact: val });
                            }}
                            className="w-full bg-white/50 border border-black/05 rounded-2xl pl-11 pr-4 py-3.5 font-black text-[#0F172A]/40 text-[10px] outline-none focus:border-[#F59E0B]/30 transition-all tracking-[0.1em] placeholder:text-black/05"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
                    )}

                    <div className="pt-2">
                        <motion.button
                            disabled={formData.phone.length < 10 || !formData.email || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleContinue}
                            className={`w-full h-15 rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all ${formData.name && formData.phone.length === 10 && formData.email
                                ? 'bg-[#0F172A] text-white shadow-2xl shadow-black/20'
                                : 'bg-black/05 text-black/20'
                                }`}
                        >
                            <span>{loading ? 'Processing...' : 'Create Account'}</span>
                            {!loading && <ArrowRight size={18} strokeWidth={4} />}
                        </motion.button>
                    </div>

                    <div className="text-center pt-2 pb-6">
                        <p className="text-black/30 text-[10px] font-black uppercase tracking-[0.2em]">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#F59E0B] font-[1000] ml-1 border-b-2 border-[#F59E0B]/30 pb-0.5">Login</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pb-10 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 opacity-20">
                        <ShieldCheck size={16} className="text-[#0F172A]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0F172A]">Encrypted User Data Vault</span>
                    </div>
                    <div className="h-[1px] w-12 bg-[#F59E0B]/30 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default Signup;
