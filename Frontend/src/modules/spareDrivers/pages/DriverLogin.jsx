import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight, Eye, EyeOff, UserPlus, Zap } from 'lucide-react';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';
import spareDriverLogo from '../../../assets/spareDriverLogo.png';

const DriverLogin = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingSession, setCheckingSession] = useState(true);

    // Auto-redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) { setCheckingSession(false); return; }
        spareDriverAPI.getProfile()
            .then(res => {
                const status = res.data?.driver?.status || res.driver?.status;
                if (status === 'ACTIVE' || status === 'active') {
                    navigate('/spare-driver/dashboard', { replace: true });
                } else if (status === 'PENDING' || status === 'pending_verification' || status === 'pending') {
                    navigate('/spare-driver/register', { replace: true });
                } else if (status === 'REJECTED' || status === 'rejected') {
                    const adminNote = res.data?.driver?.adminNote || res.driver?.adminNote;
                    navigate('/spare-driver/register', { replace: true, state: { rejected: true, reason: adminNote } });
                } else {
                    setCheckingSession(false);
                }
            })
            .catch(() => {
                localStorage.removeItem('chauffeur_token');
                setCheckingSession(false);
            });
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone || phone.length !== 10) {
            setError('Enter a valid 10-digit mobile number.');
            return;
        }
        if (!password || password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await spareDriverAPI.login({ phone, password });
            const driver = res?.data?.driver;
            const token = res?.token || res?.data?.token;

            if (token) spareDriverAPI.setToken(token);

            const status = driver?.status;
            if (status === 'ACTIVE' || status === 'active') {
                toast.success(`Welcome back, ${driver?.name?.split(' ')[0] || 'Driver'}!`);
                navigate('/spare-driver/dashboard', { replace: true });
            } else if (status === 'PENDING' || status === 'pending') {
                toast('Your account is pending verification. Complete your registration.', { icon: '⏳' });
                navigate('/spare-driver/register', { replace: true });
            } else if (status === 'REJECTED' || status === 'rejected') {
                toast.error('Your verification was rejected. Please review and re-submit.');
                navigate('/spare-driver/register', { replace: true, state: { rejected: true, reason: driver?.adminNote } });
            } else if (status === 'BLOCKED' || status === 'suspended') {
                setError(driver?.adminNote || 'Your account has been suspended. Please contact support.');
            } else {
                navigate('/spare-driver/dashboard', { replace: true });
            }
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('phone')) {
                setError('No account found with this phone number. Please create an account first.');
            } else if (msg.toLowerCase().includes('password')) {
                setError('Incorrect password. Please try again.');
            } else {
                setError(msg || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center">
                <div className="w-8 h-8 border-white/5 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F0D] flex flex-col font-sans overflow-hidden text-white">
            {/* ── Ambient glow ── */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* ── Compact Logo Header ── */}
            <div className="relative pt-16 pb-8 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center gap-3"
                >
                    <div className="w-20 h-20 drop-shadow-[0_10px_40px_rgba(234,179,8,0.15)]">
                        <img src={spareDriverLogo} alt="Spare Driver" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <div className="bg-yellow-500 p-0.5 rounded  shadow-yellow-500/30">
                                <Zap size={8} className="text-white" fill="black" />
                            </div>
                            <span className="text-[7px] font-black text-yellow-500 uppercase tracking-[0.35em]">Driver portal</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Welcome <span className="text-yellow-500">back</span>
                        </h1>
                        <p className="text-[8px] font-medium text-white/25 uppercase tracking-widest mt-0.5">Sign in to your account</p>
                    </div>
                </motion.div>
            </div>

            {/* ── Form Card ── */}
            <div className="flex-1 px-6 flex flex-col justify-start">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="max-w-md w-full mx-auto"
                >
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Phone */}
                            <div className="space-y-1 group">
                                <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block group-focus-within:text-yellow-500 transition-colors">
                                    Mobile number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none gap-1.5">
                                        <span className="text-[9px] font-bold text-yellow-500">+91</span>
                                        <div className="w-px h-3 bg-white/5" />
                                    </div>
                                    <input
                                        type="tel" maxLength={10} autoFocus
                                        placeholder="10 digit mobile"
                                        value={phone}
                                        onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                                        className="w-full h-12 bg-white/[0.02] border border-white/5 rounded-xl pl-14 pr-4 text-[12px] font-bold text-white outline-none focus:border-yellow-500/25 transition-all placeholder:text-white/5 shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1 group">
                                <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block group-focus-within:text-yellow-500 transition-colors">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-white/10 group-focus-within:text-yellow-500/50 transition-colors">
                                        <Lock size={11} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Your password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        className="w-full h-12 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-11 text-[12px] font-bold text-white outline-none focus:border-yellow-500/25 transition-all placeholder:text-white/5 shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 inset-y-0 flex items-center text-white/10 hover:text-white/40 transition-all"
                                    >
                                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                                            <p className="text-[9px] font-bold text-red-400 leading-relaxed">{error}</p>
                                        </div>
                                        {/* If account not found, show create account nudge */}
                                        {error.toLowerCase().includes('no account') && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="mt-2 flex items-center justify-center gap-1.5 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl cursor-pointer hover:bg-yellow-500/15 transition-all"
                                                onClick={() => navigate('/spare-driver/register')}
                                            >
                                                <UserPlus size={12} className="text-yellow-500" />
                                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Create your account now</span>
                                                <ArrowRight size={10} className="text-yellow-500" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || phone.length !== 10 || !password}
                                className={`w-full h-12 rounded-xl font-black text-[9px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 transition-all mt-2 ${
                                    phone.length === 10 && password
                                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 hover:bg-yellow-400'
                                    : 'bg-white/5 text-white/10 pointer-events-none'
                                }`}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-white/5 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>Sign in <ArrowRight size={14} strokeWidth={4} /></>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[7px] font-black text-white/10 uppercase tracking-widest">Or</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        {/* Create Account CTA */}
                        <Link
                            to="/spare-driver/register"
                            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500/10 active:scale-95 transition-all"
                        >
                            <UserPlus size={13} strokeWidth={2.5} />
                            Create a new account
                        </Link>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-[7px] font-bold text-white/10 uppercase tracking-widest mt-6 leading-relaxed px-4">
                        Authenticated access only. Unauthorized attempts are monitored and logged.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default DriverLogin;
