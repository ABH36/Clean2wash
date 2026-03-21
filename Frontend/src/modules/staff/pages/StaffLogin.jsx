import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowRight, Lock, Phone as PhoneIcon, MessageSquare, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const StaffLogin = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { staffLogin, staffSendOTP } = useAuth();
    
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(0);

    // Resend Timer logic
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            toast.error('Invalid Protocol: Mobile Number Required');
            return;
        }

        setLoading(true);
        try {
            const res = await staffSendOTP(phone);
            if (res.success) {
                toast.success('Security Code Dispatched');
                setStep(2);
                setTimer(60);
            } else {
                toast.error(res.error || 'Access Denied: Unrecognized Terminal');
            }
        } catch (err) {
            toast.error('Sync Failure: Check Connection');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndLogin = async (e) => {
        e.preventDefault();
        if (otp.length < 6) {
            toast.error('Incomplete Security Code');
            return;
        }

        setLoading(true);
        try {
            const res = await staffLogin(phone, otp);
            if (res.success) {
                toast.success('Terminal Handshake Successful');
                navigate('/staff');
            } else {
                toast.error(res.error || 'Invalid Security Code');
            }
        } catch (err) {
            toast.error('Handshake Failure: Retry Protocol');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen px-8 pt-20 pb-12 flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
            {/* Ambient Background */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`} />
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/20' : 'bg-brand/10'}`} />

            <div className="relative z-10 w-full max-w-sm mx-auto">
                {/* Back Button for Step 2 */}
                {step === 2 && (
                    <button 
                        onClick={() => setStep(1)}
                        className={`mb-6 p-3 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-gray-100 text-content-subtle hover:text-content'}`}
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl mx-auto relative group transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border border-white/5' : 'bg-content'}`}
                >
                    <Truck size={36} className="text-brand relative z-10" />
                    <div className="absolute inset-0 bg-brand/10 rounded-[2.5rem] blur-xl opacity-50" />
                </motion.div>

                <div className="text-center mb-10">
                    <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-3 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Authorized Personnel Only</p>
                    <h1 className={`text-3xl font-black italic leading-none uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>Terminal <br /> Handshake</h1>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form 
                            key="step1"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6" 
                            onSubmit={handleSendOTP}
                        >
                            <div className="space-y-2">
                                <label className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Mobile Identity</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                                        <PhoneIcon size={18} className={isDarkMode ? 'text-white/10' : 'text-content-subtle'} />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Enter Registered Mobile"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className={`w-full border px-16 py-5 rounded-[2rem] text-sm font-black outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white focus:border-brand/40' : 'bg-gray-50 border-gray-100 text-content focus:border-brand/40'}`}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={loading || phone.length < 10}
                                className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mt-4 transition-all ${loading || phone.length < 10 ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'} ${isDarkMode ? 'bg-white text-[#0F172A]' : 'bg-content text-white'}`}
                            >
                                {loading ? 'Initializing...' : 'Request Auth Code'}
                                {!loading && <ArrowRight size={18} />}
                            </motion.button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6" 
                            onSubmit={handleVerifyAndLogin}
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between px-4">
                                    <label className={`text-[9px] font-black uppercase tracking-[0.25em] italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Security Token</label>
                                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">{phone}</p>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Lock size={18} className={isDarkMode ? 'text-white/10' : 'text-content-subtle'} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="● ● ● ● ● ●"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={`w-full border px-16 py-5 rounded-[2rem] text-sm font-black tracking-[1em] outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white focus:border-brand/40 shadow-inner shadow-black/20' : 'bg-gray-50 border-gray-100 text-content focus:border-brand/40'}`}
                                    />
                                </div>
                                <div className="flex justify-between px-6 pt-2">
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>Secure Checksum v4</p>
                                    {timer > 0 ? (
                                        <p className="text-[8px] font-black text-brand/60 uppercase tracking-widest">Retry in {timer}s</p>
                                    ) : (
                                        <button type="button" onClick={handleSendOTP} className="text-[8px] font-black text-brand uppercase tracking-widest hover:underline decoration-2">Resend Code</button>
                                    )}
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={loading || otp.length < 6}
                                className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mt-4 transition-all ${loading || otp.length < 6 ? 'opacity-50 grayscale' : 'hover:scale-[1.02] active:bg-brand active:text-white'} ${isDarkMode ? 'bg-white text-[#0F172A]' : 'bg-content text-white'}`}
                            >
                                {loading ? 'Syncing...' : 'Validate Terminal'}
                                {!loading && <ShieldCheck size={18} />}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-12 text-center">
                    <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                        New Personnel?{' '}
                        <Link to="/staff/signup" className="text-brand font-black italic border-b border-brand/20 ml-2">Register Terminal</Link>
                    </p>
                </div>
            </div>

            <div className={`flex flex-col items-center gap-2 select-none transition-opacity duration-500 ${isDarkMode ? 'opacity-20 text-white' : 'opacity-30'}`}>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">CarWash HQ Secure Network</span>
                </div>
                <p className="text-[7px] font-bold uppercase tracking-widest">v4.2.0-STF (STABLE)</p>
            </div>
        </div>
    );
};

export default StaffLogin;
