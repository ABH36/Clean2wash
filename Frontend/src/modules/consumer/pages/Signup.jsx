import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Signup = () => {
    const navigate = useNavigate();
    const { sendOTP } = useAuth();
    const [formData, setFormData] = useState({ phone: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userData = {
        name: `User_${formData.phone.slice(-4)}`,
        phone: formData.phone,
        email: formData.email,
        role: 'consumer'
    };

    const handleContinue = async () => {
        if (formData.phone.length < 10 || !formData.email) return;
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setLoading(true);
        const res = await sendOTP(formData.phone, 'phone', userData);
        setLoading(false);
        if (res.success) {
            navigate('/otp-verify', {
                state: {
                    type: 'phone',
                    identifier: formData.phone,
                    userData,
                    devOtp: res.data?.otp
                }
            });
        } else {
            setError(res.error || 'Failed to send OTP. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden text-content">
            {/* Background Texture/Image */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <img src="/assets/carwash/2.png" className="w-full h-full object-cover scale-150 blur-3xl rotate-180" alt="" />
            </div>

            {/* Premium Header */}
            <header className="px-6 pt-10 pb-6 relative z-10">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center border border-white shadow-sm active:scale-95 transition-all">
                    <ChevronLeft size={18} className="text-brand" strokeWidth={2.5} />
                </button>
            </header>

            <div className="flex-1 px-8 flex flex-col pt-2 relative z-10">
                {/* Main Hero Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-white shadow-2xl shadow-brand/5 overflow-hidden mb-8"
                >
                    <div className="relative aspect-[16/9]">
                        <img
                            src="/assets/carwash/2.png"
                            className="w-full h-full object-cover"
                            alt="Join clean2wash"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />

                        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1 text-brand">
                                    <Star size={10} fill="currentColor" />
                                    <span className="text-[8px] font-[1000] uppercase tracking-[0.2em]">Premium Membership</span>
                                </div>
                                <h1 className="text-2xl font-[1000] text-content tracking-tighter uppercase italic leading-none">
                                    Get <span className="text-brand">Started.</span>
                                </h1>
                            </div>
                            <div className="w-10 h-10 bg-brand rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center text-white">
                                <Zap size={20} fill="currentColor" strokeWidth={0} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6 flex-1">
                    <div className="group">
                        <label className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-3 block ml-1 opacity-70">Mobile Identity</label>
                        <div className="flex gap-3">
                            <div className="bg-white border border-gray-100 rounded-xl px-4 flex items-center gap-2 flex-shrink-0 shadow-sm group-focus-within:border-brand/40 transition-all">
                                <span className="text-sm">🇮🇳</span>
                                <span className="font-black text-brand text-xs">+91</span>
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-brand transition-colors">
                                    <Phone size={16} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Number"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setFormData({ ...formData, phone: val });
                                    }}
                                    className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-4 font-bold text-content text-base outline-none focus:border-brand/40 shadow-sm transition-all placeholder:text-gray-100 tracking-widest font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-3 block ml-1 transition-colors opacity-70">Email Access</label>
                        <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-brand transition-colors">
                                <Mail size={16} strokeWidth={2.5} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-4 font-bold text-content text-sm outline-none focus:border-brand/40 shadow-sm transition-all placeholder:text-gray-100"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold uppercase tracking-wide">{error}</p>
                    )}
                    <div className="pt-2">
                        <motion.button
                            disabled={formData.phone.length < 10 || !formData.email || loading}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleContinue}
                            className={`w-full h-14 rounded-xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-between px-10 shadow-2xl transition-all ${formData.phone.length === 10 && formData.email
                                ? 'bg-brand text-white shadow-brand/30 ring-4 ring-brand/10'
                                : 'bg-gray-100 text-content-subtle shadow-transparent'
                                }`}
                        >
                            <span>{loading ? 'Requesting...' : 'Continue'}</span>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowRight size={18} strokeWidth={3} />
                            )}
                        </motion.button>
                    </div>

                    <div className="pt-6 text-center">
                        <p className="text-content-subtle text-[10px] font-bold uppercase tracking-widest opacity-60">
                            Already a member?{' '}
                            <Link to="/login" className="text-brand font-black ml-1 border-b border-brand/20 pb-0.5 opacity-100">LOG IN</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pb-8 flex items-center justify-center gap-2 opacity-20">
                    <ShieldCheck size={12} className="text-brand" />
                    <p className="text-[8px] font-black text-content uppercase tracking-[0.3em]">Verified Secure Data</p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
