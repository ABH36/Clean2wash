import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Zap, Phone, Lock, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';

const CaptainLogin = () => {
    const navigate = useNavigate();
    const { captainLogin } = useAuth();
    const { captainSendOTP } = useCaptain();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!phone || !password) {
            return toast.error('Please enter phone and password');
        }

        setLoading(true);
        try {
            const result = await captainLogin(phone.replace(/\D/g, ''), password);
            if (result.success) {
                toast.success('Welcome back, Captain!');
                navigate('/captain');
            } else {
                toast.error(result.error || 'Invalid credentials');
            }
        } catch (error) {
            toast.error('Login failed, try again');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async () => {
        if (!phone || phone.length !== 10) {
            return toast.error('Enter a valid 10-digit phone number');
        }
        setOtpLoading(true);
        try {
            const result = await captainSendOTP(phone);
            if (result.success) {
                toast.success('OTP sent successfully!');
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
                    className="w-full h-full object-cover grayscale-[0.5] brightness-[0.4]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-brand p-1.5 rounded-lg shadow-lg shadow-brand/20">
                                <Zap size={14} className="text-white" fill="white" />
                            </div>
                            <span className="text-brand text-[10px] font-black uppercase tracking-[0.2em]">Captain Partner App</span>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tighter leading-tight italic">
                            Welcome Back.<br />Ready to Earn?
                        </h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">Sign in to view new requests</p>
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
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                <Phone size={14} /> Registered Phone
                            </label>
                            <input
                                type="tel"
                                maxLength={10}
                                placeholder="10 Digit Mobile Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-black text-content outline-none focus:border-brand transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                <Lock size={14} /> Password / PIN
                            </label>
                            <input
                                type="password"
                                placeholder="Enter secure PIN"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-sm font-black text-content outline-none focus:border-brand transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={!phone || !password || loading || otpLoading}
                            whileTap={{ scale: 0.97 }}
                            className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all mt-6 ${phone && password
                                    ? 'bg-brand text-white shadow-xl shadow-brand/20'
                                    : 'bg-white/5 text-white/10 border border-white/5 pointer-events-none'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In with Password <ArrowRight size={18} strokeWidth={3} /></>
                            )}
                        </motion.button>

                        <div className="flex items-center gap-4 my-4">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">OR</span>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <motion.button
                            type="button"
                            onClick={handleRequestOTP}
                            disabled={phone.length !== 10 || loading || otpLoading}
                            whileTap={{ scale: 0.97 }}
                            className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all border ${phone.length === 10
                                    ? 'border-brand text-brand bg-brand/5 hover:bg-brand hover:text-white'
                                    : 'border-white/5 text-white/10 pointer-events-none'
                                }`}
                        >
                            {otpLoading ? (
                                <div className="w-4 h-4 border-2 border-brand/50 border-t-brand rounded-full animate-spin" />
                            ) : (
                                <>Login via Secure OTP <Zap size={14} fill="currentColor" /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100/10 pt-8">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            New to CarWash?{' '}
                            <Link to="/captain/signup" className="text-brand font-black italic">JOIN FLEET</Link>
                        </p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-4 pt-10">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl transition-all">
                            <Star size={16} className="text-yellow-400 mb-2" fill="currentColor" />
                            <p className="text-sm font-black italic tracking-tight text-white">4.9/5 Avg</p>
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mt-1">Provider Rating</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl transition-all">
                            <ShieldCheck size={16} className="text-blue-400 mb-2" />
                            <p className="text-sm font-black italic tracking-tight text-white">Verified</p>
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mt-1">Partners Hub</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CaptainLogin;
