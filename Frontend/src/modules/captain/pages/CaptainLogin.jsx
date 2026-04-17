import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Zap, Phone, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';

const CaptainLogin = () => {
    const navigate = useNavigate();
    const { captainSendOTP } = useCaptain();
    const [phone, setPhone] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const handleRequestOTP = async () => {
        if (!phone || phone.length !== 10) {
            return toast.error('Enter a valid 10-digit phone number');
        }
        setOtpLoading(true);
        try {
            const result = await captainSendOTP(phone);
            if (result.success) {
                toast.success(`Testing OTP: ${result.data?.otp || 'sent'}`, { duration: 5000 });
                navigate('/captain/otp-verify', {
                    state: {
                        phone,
                        type: 'login',
                        devOtp: result.data?.otp
                    }
                });
            } else {
                toast.error(result.error || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
            {/* Visual Header */}
            <div className="relative h-72 flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80"
                    alt="Captain"
                    className="w-full h-full object-cover grayscale-[0.5] brightness-[0.4] object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-brand p-1.5 rounded-lg shadow-lg shadow-brand/20">
                                <Zap size={14} className="text-white" fill="white" />
                            </div>
                            <span className="text-brand text-[10px] font-black uppercase tracking-[0.2em] not-italic">Captain Partner App</span>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tighter leading-tight not-italic">
                            Welcome Back.<br />Ready to Earn?
                        </h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1 not-italic">Sign in to view new requests</p>
                    </motion.div>
                </div>

                <Link to="/" className="absolute top-12 left-6 w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border bg-white/10 border-white/10 text-white transition-all hover:bg-white/20">
                    <ChevronLeft size={20} strokeWidth={3} />
                </Link>
            </div>

            {/* Form Area */}
            <div className="flex-1 relative px-6 pt-6 pb-12 flex flex-col bg-background">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                className="flex flex-col flex-1"
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleRequestOTP();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-content uppercase tracking-widest flex items-center gap-2 px-2">
                                <Phone size={14} className="text-brand" /> Registered Phone
                            </label>
                            <div className="relative group">
                                <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none">
                                    <span className="text-sm font-black text-brand">+91</span>
                                    <div className="w-px h-4 bg-gray-200 ml-3" />
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="10 Digit Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="w-full h-16 bg-white border-2 border-gray-100 rounded-2xl pl-16 pr-6 text-base font-black text-content outline-none focus:border-brand transition-all placeholder:text-gray-300 shadow-sm"
                                />
                                <div className="absolute right-6 inset-y-0 flex items-center">
                                    <div className={`w-2 h-2 rounded-full ${phone.length === 10 ? 'bg-brand shadow-[0_0_10px_rgba(255,107,0,0.5)]' : 'bg-gray-200'}`} />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={phone.length !== 10 || otpLoading}
                            whileTap={{ scale: 0.97 }}
                            className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all mt-6 ${phone.length === 10
                                ? 'bg-brand text-white shadow-xl shadow-brand/20'
                                : 'bg-white/5 text-white/10 border border-white/5 pointer-events-none'
                                }`}
                        >
                            {otpLoading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Continue with OTP <ArrowRight size={18} strokeWidth={3} /></>
                            )}
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={handleRequestOTP}
                            disabled={phone.length !== 10 || otpLoading}
                            whileTap={{ scale: 0.97 }}
                            className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all border ${phone.length === 10
                                ? 'border-brand text-brand bg-brand/5 hover:bg-brand hover:text-white'
                                : 'border-white/5 text-white/10 pointer-events-none'
                                }`}
                        >
                            {otpLoading ? (
                                <div className="w-4 h-4 border-2 border-brand/50 border-t-brand rounded-full animate-spin" />
                            ) : (
                                <>Send Login OTP <Zap size={14} fill="currentColor" /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100/10 pt-8">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            New to CarWash?{' '}
                            <Link to="/captain/signup" className="text-brand font-black">JOIN FLEET</Link>
                        </p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-4 pt-10">
                        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-soft transition-all">
                            <Star size={18} className="text-yellow-400 mb-2" fill="currentColor" />
                            <p className="text-base font-black tracking-tight text-content">4.9/5 Avg</p>
                            <p className="text-content-subtle text-[9px] font-black uppercase tracking-widest leading-none mt-1">Provider Rating</p>
                        </div>
                        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-soft transition-all">
                            <ShieldCheck size={18} className="text-blue-500 mb-2" />
                            <p className="text-base font-black tracking-tight text-content">Verified</p>
                            <p className="text-content-subtle text-[9px] font-black uppercase tracking-widest leading-none mt-1">Partners Hub</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CaptainLogin;
