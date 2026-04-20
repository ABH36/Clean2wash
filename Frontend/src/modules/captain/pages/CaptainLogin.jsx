import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Zap, Phone, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';
import spareDriverLogo from '../../../assets/spareDriverLogo.png';

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
                toast.success(`OTP Sent`, { duration: 5000 });
                navigate('/captain/otp-verify', {
                    state: { phone, type: 'login', devOtp: result.data?.otp }
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
        <div className="min-h-screen bg-[#0A0F0D] flex flex-col font-sans overflow-hidden text-white">
            {/* ── Compact Header ── */}
            <div className="relative pt-12 pb-6 flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center text-center"
                >
                    <div className="w-20 h-20 drop-shadow-2xl shadow-black/50 mb-3">
                        <img src={spareDriverLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="bg-yellow-500 p-0.5 rounded shadow shadow-yellow-500/20">
                            <Zap size={8} className="text-white" fill="black" />
                        </div>
                        <span className="text-yellow-500 text-[7px] font-black uppercase tracking-[0.3em]">Partner portal</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Protocol <span className="text-yellow-500">Login</span>
                    </h1>
                </motion.div>

                <Link to="/" className="absolute top-8 left-6 w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 text-white/40 active:scale-90 transition-all">
                    <ChevronLeft size={16} strokeWidth={3} />
                </Link>
            </div>

            {/* ── Compact Form ── */}
            <div className="flex-1 px-6 flex flex-col">
                <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 shadow-2xl relative">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleRequestOTP();
                        }}
                        className="space-y-5"
                    >
                        <div className="space-y-1.5 group">
                            <label className="text-[7px] font-bold text-white/30 uppercase tracking-[0.3em] px-4 block group-focus-within:text-yellow-500 transition-colors">
                                Registered Mobile
                            </label>
                            <div className="relative">
                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-yellow-500">+91</span>
                                    <div className="w-px h-3 bg-white/5 ml-3" />
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="10 digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="w-full h-13 bg-white/[0.02] border border-white/5 rounded-xl pl-14 pr-6 text-[12px] font-bold text-white outline-none focus:border-yellow-500/20 transition-all placeholder:text-white/5"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={phone.length !== 10 || otpLoading}
                            className={`w-full h-13 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all ${
                                phone.length === 10
                                ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                                : 'bg-white/5 text-white/10 pointer-events-none'
                            }`}
                        >
                            {otpLoading ? (
                                <div className="w-4 h-4 border-white/5 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>Initiate Login <ArrowRight size={16} strokeWidth={4} /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center pt-6 border-t border-white/5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                            New partner?{' '}
                            <Link to="/captain/signup" className="text-yellow-500">Join Fleet</Link>
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-2xl">
                            <Star size={14} className="text-yellow-500 mb-1.5" fill="currentColor" />
                            <p className="text-xs font-bold tracking-tight">4.9 Elite</p>
                            <p className="text-[6px] font-black text-white/10 uppercase tracking-widest mt-0.5">Rating</p>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-2xl">
                            <ShieldCheck size={14} className="text-yellow-500 mb-1.5" />
                            <p className="text-xs font-bold tracking-tight">Verified</p>
                            <p className="text-[6px] font-black text-white/10 uppercase tracking-widest mt-0.5">Status</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pb-8 text-center px-10">
                <p className="text-white/10 text-[6px] font-black uppercase tracking-widest leading-relaxed">
                    Authenticated access only. Monitored protocol.
                </p>
            </div>
        </div>
    );
};

export default CaptainLogin;
