import React, { useEffect, useRef, useState } from 'react';
import {
    User, Mail, Phone, Lock, FileText, Camera, ShieldCheck, Clock, CheckCircle2, 
    Loader2, AlertCircle, MapPin, CreditCard, RefreshCw, Trophy, Sparkles, 
    ChevronRight, ArrowRight, Navigation, Shield, Fingerprint, ChevronLeft, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const STEPS = { REGISTER: 0, OTP_VERIFY: 1, UPLOAD_DOCS: 2, VERIFYING: 3, KIT_REQUIRED: 4, KIT_REVIEW: 5, SUCCESS: 6 };
const DRIVER_STATUS = {
    PENDING_DOCS: 'pending_docs',
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED_PENDING_KIT: 'verified_pending_kit',
    KIT_PAYMENT_PENDING: 'kit_payment_pending',
    ACTIVE: 'active'
};

const resolveDriverStep = (status) => {
    if (status === DRIVER_STATUS.PENDING_DOCS) return STEPS.UPLOAD_DOCS;
    if (status === DRIVER_STATUS.PENDING_VERIFICATION) return STEPS.VERIFYING;
    if (status === DRIVER_STATUS.VERIFIED_PENDING_KIT) return STEPS.KIT_REQUIRED;
    if (status === DRIVER_STATUS.KIT_PAYMENT_PENDING) return STEPS.KIT_REVIEW;
    if (status === DRIVER_STATUS.ACTIVE) return STEPS.SUCCESS;
    return STEPS.REGISTER;
};

const normalizeIndianPhone = (value = '') => String(value).replace(/\D/g, '').slice(0, 10);
const isValidIndianMobile = (value = '') => /^[6-9]\d{9}$/.test(String(value || ''));

const DocUpload = ({ label, icon: Icon, file, onChange, captureMode = '', helperText = 'JPG, PNG, WEBP - MAX 5MB' }) => {
    const [preview, setPreview] = useState(null);
    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <label className={`block group relative overflow-hidden rounded-[1.8rem] border-2 transition-all duration-300 cursor-pointer ${file 
            ? 'border-brand bg-brand/5' 
            : 'border-content/[0.03] bg-content/[0.02] hover:border-brand/30 hover:bg-surface active:scale-95'}`}>
            <input type="file" accept="image/*" capture={captureMode || undefined} className="hidden" onChange={onChange} />
            <div className="p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all overflow-hidden relative ${file ? 'bg-black text-brand' : 'bg-surface border border-content/[0.03] text-content/15 group-hover:scale-105'}`}>
                    {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : <Icon size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-black uppercase tracking-tight transition-colors ${file ? 'text-content' : 'text-content/40'}`}>{label}</span>
                        {file && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 bg-brand text-black rounded-full flex items-center justify-center"><CheckCircle2 size={10} strokeWidth={4} /></motion.div>}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 truncate transition-opacity ${file ? 'text-brand' : 'text-content/20'}`}>
                        {file ? 'Saved Successfully' : helperText}
                    </p>
                </div>
                {!file && <div className="w-10 h-10 rounded-xl border border-content/[0.05] bg-surface flex items-center justify-center text-content/15 group-hover:bg-black group-hover:text-brand transition-all"><ArrowRight size={16} /></div>}
            </div>
        </label>
    );
};

const DriverRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.REGISTER);
    const [authMode, setAuthMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [driverSnapshot, setDriverSnapshot] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [docs, setDocs] = useState({ aadhaarFront: null, aadhaarBack: null, panCard: null, drivingLicense: null, selfie: null });
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
    const [otpTimeLeft, setOtpTimeLeft] = useState(45);
    const [selfieCameraOpen, setSelfieCameraOpen] = useState(false);
    const [selfieTimeLeft, setSelfieTimeLeft] = useState(30);
    const otpInputRefs = useRef([]);
    const selfieVideoRef = useRef(null);
    const selfieStreamRef = useRef(null);

    const completedDocCount = Object.values(docs).filter(Boolean).length;

    useEffect(() => {
        if (step === STEPS.OTP_VERIFY && otpTimeLeft > 0) {
            const t = setTimeout(() => setOtpTimeLeft(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [step, otpTimeLeft]);

    useEffect(() => {
        if (selfieCameraOpen) {
            const t = setInterval(() => setSelfieTimeLeft(c => {
                if (c <= 1) { clearInterval(t); setSelfieCameraOpen(false); return 0; }
                return c - 1;
            }), 1000);
            return () => clearInterval(t);
        }
    }, [selfieCameraOpen]);

    useEffect(() => {
        if (!selfieCameraOpen) return;
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                selfieStreamRef.current = stream;
                if (selfieVideoRef.current) selfieVideoRef.current.srcObject = stream;
            } catch (e) { setError('Camera denied'); setSelfieCameraOpen(false); }
        })();
        return () => selfieStreamRef.current?.getTracks().forEach(t => t.stop());
    }, [selfieCameraOpen]);

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (token) {
            spareDriverAPI.getProfile()
                .then(res => {
                    setDriverSnapshot(res.data.driver);
                    setStep(resolveDriverStep(res.data.driver.status));
                }).catch(() => spareDriverAPI.clearToken());
        }
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        const p = normalizeIndianPhone(form.phone);
        if (!isValidIndianMobile(p)) return setError('Invalid Indian Mobile');
        setLoading(true); setError('');
        try {
            const res = await spareDriverAPI.sendSignupOTP(p, { ...form, phone: p });
            setOtpDigits(['', '', '', '']); setOtpTimeLeft(45); setStep(STEPS.OTP_VERIFY);
            toast.success(`OTP: ${res.data.otp || 'sent'}`);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const p = normalizeIndianPhone(form.phone);
        if (!isValidIndianMobile(p)) return setError('Invalid Mobile');
        setLoading(true); setError('');
        try {
            const res = await spareDriverAPI.login({ phone: p, password: form.password });
            setDriverSnapshot(res.data.driver);
            setStep(resolveDriverStep(res.data.driver.status));
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 4) return setError('Enter 4 digits');
        setLoading(true);
        try {
            const res = await spareDriverAPI.verifySignupOTP(form.phone, otp);
            setDriverSnapshot(res.data.driver); setStep(STEPS.UPLOAD_DOCS);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            await spareDriverAPI.sendSignupOTP(form.phone, form);
            setOtpTimeLeft(45); toast.success("New code sent");
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const handleCaptureSelfie = async () => {
        if (!selfieVideoRef.current) return;
        const v = selfieVideoRef.current;
        const c = document.createElement('canvas');
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext('2d').drawImage(v, 0, 0);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
        setDocs(d => ({ ...d, selfie: new File([blob], 'selfie.jpg', { type: 'image/jpeg' }) }));
        setSelfieCameraOpen(false);
    };

    const handleUpload = async () => {
        if (completedDocCount < 5) return setError('Upload all files');
        setLoading(true);
        try {
            const fd = new FormData();
            Object.keys(docs).forEach(k => fd.append(k, docs[k]));
            const res = await spareDriverAPI.uploadDocs(fd);
            setDriverSnapshot(res.data.driver); setStep(STEPS.VERIFYING);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    if (step === STEPS.REGISTER) return (
        <div className="min-h-[100svh] px-6 flex flex-col justify-center bg-background mx-auto max-w-[430px] transition-colors duration-500 driver-theme">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface rounded-[2.8rem] p-8 shadow-2xl relative overflow-hidden border border-content/[0.04]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[40px]" />
                <div className="relative z-10 space-y-8">
                    <div>
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Driver Portal</p>
                        <h1 className="text-[28px] font-black text-content tracking-tighter uppercase leading-tight">Driver <span className="text-brand">{authMode === 'register' ? 'Sign Up' : 'Login'}</span></h1>
                    </div>
                    <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="space-y-4">
                        {authMode === 'register' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-content/20 uppercase tracking-widest px-2">Full Name</label>
                                    <div className="h-15 bg-content/[0.04] border border-content/[0.03] rounded-2xl flex items-center px-6 gap-3 focus-within:border-brand transition-all">
                                        <User size={18} className="text-content/20" />
                                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ENTER FULL NAME" className="flex-1 bg-transparent text-[14px] font-black text-content outline-none placeholder:text-content/10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-content/20 uppercase tracking-widest px-2">Email Address</label>
                                    <div className="h-15 bg-content/[0.04] border border-content/[0.03] rounded-2xl flex items-center px-6 gap-3 focus-within:border-brand transition-all">
                                        <Mail size={18} className="text-content/20" />
                                        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="EMAIL@EXAMPLE.COM" className="flex-1 bg-transparent text-[14px] font-black text-content outline-none placeholder:text-content/10" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-content/20 uppercase tracking-widest px-2">Phone Number</label>
                            <div className="h-15 bg-content/[0.04] border border-content/[0.03] rounded-2xl flex items-center px-6 gap-3 focus-within:border-brand transition-all">
                                <Phone size={18} className="text-content/20" />
                                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="MOBILE NUMBER" className="flex-1 bg-transparent text-[14px] font-black text-content outline-none placeholder:text-content/10" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-content/20 uppercase tracking-widest px-2">Password</label>
                            <div className="h-15 bg-content/[0.04] border border-content/[0.03] rounded-2xl flex items-center px-6 gap-3 focus-within:border-brand transition-all">
                                <Lock size={18} className="text-content/20" />
                                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="flex-1 bg-transparent text-[14px] font-black text-content outline-none placeholder:text-content/10" />
                            </div>
                        </div>
                        {error && <p className="text-[10px] font-black text-red-500 uppercase px-2">{error}</p>}
                        <button disabled={loading} className="w-full h-15 bg-brand text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-brand/10">
                            {loading ? <Loader2 className="animate-spin" /> : <>{authMode === 'register' ? 'Create Account' : 'Login Now'} <ArrowRight size={18} /></>}
                        </button>
                    </form>
                    <button onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} className="w-full text-center text-[10px] font-black text-content/30 uppercase tracking-[0.2em]">
                        {authMode === 'login' ? 'New Driver? Sign Up' : 'Already have an account? Login'}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    if (step === STEPS.OTP_VERIFY) return (
        <div className="min-h-[100svh] px-6 flex flex-col justify-center bg-background mx-auto max-w-[430px] transition-colors duration-500 driver-theme">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-content/[0.04] rounded-[2.8rem] p-8 shadow-2xl space-y-10">
                <div className="text-center">
                    <div className="w-20 h-20 bg-brand/10 rounded-[2.2rem] flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20">
                        <Fingerprint size={36} />
                    </div>
                    <h2 className="text-[24px] font-black text-content tracking-tighter uppercase">Verification</h2>
                    <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.2em] mt-2">Enter code sent to link</p>
                </div>
                <div className="flex justify-center gap-3">
                    {otpDigits.map((d, i) => (
                        <input key={i} ref={el => otpInputRefs.current[i] = el} type="tel" maxLength={1} value={d} onChange={e => {
                            const n = [...otpDigits]; n[i] = e.target.value.slice(-1); setOtpDigits(n);
                            if (e.target.value && i < 3) otpInputRefs.current[i+1]?.focus();
                        }} className="w-16 h-20 bg-content/[0.04] border border-content/[0.05] rounded-2xl text-center text-3xl font-black text-content outline-none focus:border-brand" />
                    ))}
                </div>
                {error && <p className="text-center text-[10px] font-black text-red-500 uppercase">{error}</p>}
                <div className="space-y-4">
                    <button onClick={handleVerifyOtp} disabled={loading} className="w-full h-15 bg-brand text-black rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand/10 active:scale-95 transition-all">Verify & Link</button>
                    <div className="text-center">{otpTimeLeft > 0 ? <p className="text-[10px] font-black text-content/20 uppercase tracking-widest">Resend in {otpTimeLeft}s</p> : <button onClick={handleResendOtp} className="text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand pb-0.5">Request New Code</button>}</div>
                </div>
            </motion.div>
        </div>
    );

    if (step === STEPS.UPLOAD_DOCS) return (
        <div className="min-h-[100svh] px-6 py-10 bg-background mx-auto max-w-[430px] transition-colors duration-500 driver-theme">
            <div className="mb-8">
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Registry Dossier</p>
                <h2 className="text-[28px] font-black text-content tracking-tighter uppercase leading-tight">Compliance Setup</h2>
                <div className="mt-8 flex items-center gap-4 p-5 bg-surface rounded-[2.2rem] border border-content/[0.03] transition-colors shadow-sm">
                    <div className="w-12 h-12 bg-black text-brand rounded-2xl flex items-center justify-center font-black text-lg">{completedDocCount}/5</div>
                    <div className="flex-1 bg-content/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand h-full transition-all duration-700" style={{ width: `${(completedDocCount/5)*100}%` }} />
                    </div>
                </div>
            </div>
            <div className="space-y-3 pb-32">
                <DocUpload label="Aadhaar Front" icon={FileText} file={docs.aadhaarFront} onChange={e => setDocs({...docs, aadhaarFront: e.target.files[0]})} />
                <DocUpload label="Aadhaar Back" icon={FileText} file={docs.aadhaarBack} onChange={e => setDocs({...docs, aadhaarBack: e.target.files[0]})} />
                <DocUpload label="PAN Identity" icon={CreditCard} file={docs.panCard} onChange={e => setDocs({...docs, panCard: e.target.files[0]})} />
                <DocUpload label="Driving License" icon={Shield} file={docs.drivingLicense} onChange={e => setDocs({...docs, drivingLicense: e.target.files[0]})} />
                <div onClick={() => setSelfieCameraOpen(true)}>
                    <DocUpload label="Live Photo (Selfie)" icon={Camera} file={docs.selfie} onChange={() => {}} helperText="SCAN OPERATOR FACE" />
                </div>
                {error && <p className="p-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
            </div>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full px-6 max-w-[430px]">
                <button onClick={handleUpload} disabled={loading || completedDocCount < 5} className={`w-full h-18 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${completedDocCount === 5 ? 'bg-brand text-black' : 'bg-content/10 text-content/20 opacity-30 cursor-not-allowed'}`}>
                    {loading ? <Loader2 className="animate-spin" /> : <>Complete Enrollment <Navigation size={20} className="rotate-45" /></>}
                </button>
            </div>
            <AnimatePresence>
                {selfieCameraOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
                        <div className="absolute top-10 text-center">
                            <p className="text-[11px] font-black text-brand uppercase tracking-[0.4em] mb-2">Biometric Analysis</p>
                            <p className="text-white uppercase font-black text-sm">Position Inside Scanner</p>
                        </div>
                        <div className="relative w-full aspect-[3/4] max-w-[320px] rounded-[3rem] overflow-hidden bg-slate-900 border border-brand/20 shadow-2xl shadow-brand/10">
                            <video ref={selfieVideoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-110" />
                            <div className="absolute inset-0 border-[30px] border-black/40 rounded-[3rem] pointer-events-none" />
                        </div>
                        <div className="mt-12 flex gap-4 w-full max-w-[320px]">
                            <button onClick={() => setSelfieCameraOpen(false)} className="px-8 h-15 rounded-2xl border border-white/10 text-white/30 text-[11px] font-black uppercase">Abort</button>
                            <button onClick={handleCaptureSelfie} className="flex-1 h-15 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Capture Photo</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="min-h-[100svh] px-10 flex flex-col items-center justify-center bg-background text-center transition-colors duration-500 driver-theme">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-8">
                <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mx-auto animate-pulse text-brand border border-brand/20">
                    <ShieldCheck size={48} />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-content">Verification Pending</h1>
                    <p className="text-[11px] font-black text-content/30 uppercase tracking-[0.3em] mt-4 max-w-[200px] mx-auto leading-relaxed">Your profile is synced with the hub. Awaiting final operational clearance from Admin.</p>
                </div>
                <button onClick={() => navigate('/spare-driver/dashboard')} className="w-full h-15 bg-brand text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-brand/20">Go to Dashboard</button>
            </motion.div>
        </div>
    );
};

export default DriverRegistration;
