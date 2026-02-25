import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ phone: '', email: '' });
    const [loading, setLoading] = useState(false);

    const handleContinue = () => {
        if (formData.phone.length < 10 || !formData.email) return;
        setLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setLoading(false);
            navigate('/otp-verify', {
                state: {
                    type: 'phone',
                    identifier: formData.phone,
                    userData: {
                        ...formData,
                        name: `User_${formData.phone.slice(-4)}`,
                        role: 'consumer'
                    }
                }
            });
        }, 1200);
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
                        Get Started
                    </h1>
                    <p className="text-content-subtle text-xs font-bold uppercase tracking-[0.2em] mb-12">
                        Premium door-step car care
                    </p>
                </motion.div>

                <div className="space-y-6 flex-1">
                    <div className="group">
                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3 block ml-1 transition-colors group-focus-within:text-brand">Mobile Number</label>
                        <div className="flex gap-3">
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 flex items-center gap-2 flex-shrink-0 group-focus-within:border-brand/30 transition-all">
                                <span className="text-sm">🇮🇳</span>
                                <span className="font-black text-content text-sm">+91</span>
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                    <Phone size={18} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Mobile number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content text-lg outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 tracking-widest font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mb-3 block ml-1 transition-colors group-focus-within:text-brand">Email ID</label>
                        <div className="relative flex-1">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle group-focus-within:text-brand transition-colors">
                                <Mail size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-13 pr-5 py-4.5 font-bold text-content outline-none focus:border-brand/30 focus:bg-white transition-all placeholder:text-content-subtle/40 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <motion.button
                            disabled={formData.phone.length < 10 || !formData.email || loading}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleContinue}
                            className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-between px-8 shadow-2xl transition-all ${formData.phone.length === 10 && formData.email
                                    ? 'bg-brand text-white shadow-brand/25'
                                    : 'bg-gray-100 text-content-subtle shadow-transparent'
                                }`}
                        >
                            <span>{loading ? 'Sending OTP...' : 'Continue'}</span>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowRight size={20} strokeWidth={3} />
                            )}
                        </motion.button>
                    </div>

                    <div className="pt-8 text-center">
                        <p className="text-content-muted text-[11px] font-bold uppercase tracking-widest">
                            Member already?{' '}
                            <Link to="/login" className="text-brand font-black ml-1 border-b border-brand/20 pb-0.5">Log In</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pb-12">
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <ShieldCheck size={14} className="text-content" />
                        <p className="text-[9px] font-black text-content uppercase tracking-[0.2em]">Secure Data Encryption</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
