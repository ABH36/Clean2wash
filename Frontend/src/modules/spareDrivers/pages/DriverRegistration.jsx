import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Lock, ChevronRight, FileText, Camera,
    ShieldCheck, CheckCircle2, Loader2, AlertCircle, MapPin,
    Clock, CreditCard, GraduationCap, Briefcase, Globe, Award,
    Check, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import RegistrationStepWrapper from '../components/RegistrationStepWrapper';
import spareDriverLogo from '../../../assets/spareDriverLogo.png';

const STEPS = {
    IDENTITY: 1,
    DRIVING: 2,
    FINANCIAL: 3,
    PROFILE_EDU: 4,
    SAFETY: 5,
    VERIFYING: 6,
    SUCCESS: 7
};

const DriverRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.IDENTITY);
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '',
        aadhaarNumber: '', panNumber: '',
        licenseNumber: '', licenseExpiry: '', experienceYears: '', badgeNumber: '',
        accountName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '',
        city: '', languages: [], availability: 'full-time',
        qualification: '', university: '', passingYear: '', experienceSummary: '',
        criminalDeclaration: false
    });

    const [docs, setDocs] = useState({
        aadhaarCard: null, panCard: null, passportPhoto: null,
        drivingLicense: null, experienceProof: null, badge: null,
        policeVerification: null, academicDoc: null
    });

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) return;
        spareDriverAPI.getProfile().then(res => {
            const s = res.data?.driver?.status || res.driver?.status;
            if (s === 'pending_verification') setStep(STEPS.VERIFYING);
            else if (s === 'active') setStep(STEPS.SUCCESS);
        }).catch(() => { });
    }, []);

    const handleNext = () => step < STEPS.SAFETY ? setStep(step + 1) : handleSubmit();
    const handleBack = () => step > 1 && setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            // 1. Initial Registration
            await spareDriverAPI.register(form);
            const formData = new FormData();
            formData.append('role', 'spare_driver');
            Object.keys(docs).forEach(key => { if (docs[key]) formData.append(key, docs[key]); });
            await spareDriverAPI.uploadDocs(formData);
            setStep(STEPS.VERIFYING);
        } catch (err) {
            setError(err.message || 'Verification Protocol Failed');
        } finally { setLoading(false); }
    };

    const renderStep = () => {
        switch (step) {
            case STEPS.IDENTITY:
                return (
                    <RegistrationStepWrapper step={1} totalSteps={5} title="Identity Legal" subtitle="Spare Driver Verification Initiated" onNext={handleNext}>
                        <div className="space-y-6">
                            <InputField label="Full Name" icon={User} value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Govt ID Name" />
                            <InputField label="Aadhaar Phone" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="Linked Mobile" />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Aadhaar No" icon={ShieldCheck} value={form.aadhaarNumber} onChange={v => setForm({ ...form, aadhaarNumber: v })} placeholder="12 Digits" />
                                <InputField label="PAN No" icon={CreditCard} value={form.panNumber} onChange={v => setForm({ ...form, panNumber: v })} placeholder="ABCDE1234F" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <DocButton label="Aadhaar Side A" file={docs.aadhaarCard} onChange={f => setDocs({ ...docs, aadhaarCard: f })} />
                                <DocButton label="PAN Card" file={docs.panCard} onChange={f => setDocs({ ...docs, panCard: f })} />
                            </div>
                        </div>
                    </RegistrationStepWrapper>
                );
            case STEPS.DRIVING:
                return (
                    <RegistrationStepWrapper step={2} totalSteps={5} title="Driving Credentials" subtitle="Core Operational Authority layer" onBack={handleBack} onNext={handleNext}>
                        <div className="space-y-6">
                            <InputField label="License Number" icon={Award} value={form.licenseNumber} onChange={v => setForm({ ...form, licenseNumber: v })} placeholder="DL-XXX" />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="DL Expiry" icon={Clock} type="date" value={form.licenseExpiry} onChange={v => setForm({ ...form, licenseExpiry: v })} />
                                <InputField label="Exp Years" icon={Briefcase} type="number" value={form.experienceYears} onChange={v => setForm({ ...form, experienceYears: v })} placeholder="e.g. 5" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <DocButton label="DL Front" file={docs.drivingLicense} onChange={f => setDocs({ ...docs, drivingLicense: f })} />
                                <DocButton label="Exp Proof" file={docs.experienceProof} onChange={f => setDocs({ ...docs, experienceProof: f })} />
                            </div>
                        </div>
                    </RegistrationStepWrapper>
                );
            case STEPS.FINANCIAL:
                return (
                    <RegistrationStepWrapper step={3} totalSteps={5} title="Financial Matrix" subtitle="Secured payout routing system" onBack={handleBack} onNext={handleNext}>
                        <div className="space-y-6">
                            <InputField label="Account Name" icon={User} value={form.accountName} onChange={v => setForm({ ...form, accountName: v })} placeholder="Bank Holder Name" />
                            <InputField label="Account Number" icon={CreditCard} value={form.accountNumber} onChange={v => setForm({ ...form, accountNumber: v })} placeholder="Bank Account No" />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="IFSC Code" icon={Globe} value={form.ifscCode} onChange={v => setForm({ ...form, ifscCode: v })} placeholder="HDFC0001" />
                                <InputField label="UPI ID" icon={Zap} value={form.upiId} onChange={v => setForm({ ...form, upiId: v })} placeholder="user@upi" />
                            </div>
                        </div>
                    </RegistrationStepWrapper>
                );
            case STEPS.PROFILE_EDU:
                return (
                    <RegistrationStepWrapper step={4} totalSteps={5} title="Professional Profile" subtitle="Showcase your background" onBack={handleBack} onNext={handleNext}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="City" icon={MapPin} value={form.city} onChange={v => setForm({ ...form, city: v })} />
                                <SelectField label="Availability" icon={Clock} value={form.availability} onChange={v => setForm({ ...form, availability: v })} options={['full-time', 'part-time']} />
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Education Layer</h4>
                                <InputField label="Degress/Qualification" icon={GraduationCap} value={form.qualification} onChange={v => setForm({ ...form, qualification: v })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="University" icon={Globe} value={form.university} onChange={v => setForm({ ...form, university: v })} />
                                    <InputField label="Year" icon={Clock} value={form.passingYear} onChange={v => setForm({ ...form, passingYear: v })} />
                                </div>
                            </div>
                        </div>
                    </RegistrationStepWrapper>
                );
            case STEPS.SAFETY:
                return (
                    <RegistrationStepWrapper step={5} totalSteps={5} title="Safety Protocol" subtitle="Final trust synchronization" onBack={handleBack} onNext={handleNext} loading={loading}>
                        <div className="space-y-8">
                            <div className="p-6 bg-yellow-500/5 rounded-3xl border border-yellow-500/10">
                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Police Verification
                                </p>
                                <DocButton label="Verification Certificate" file={docs.policeVerification} onChange={f => setDocs({ ...docs, policeVerification: f })} transparent isFull />
                            </div>
                            <label className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl cursor-pointer group">
                                <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${form.criminalDeclaration ? 'bg-yellow-500 border-yellow-500 scale-110' : 'bg-transparent border-white/10'}`}>
                                    {form.criminalDeclaration && <Check size={12} className="text-black" strokeWidth={4} />}
                                </div>
                                <input type="checkbox" className="hidden" checked={form.criminalDeclaration} onChange={e => setForm({ ...form, criminalDeclaration: e.target.checked })} />
                                <p className="text-[9px] font-black text-white/40 uppercase leading-relaxed group-hover:text-white/60 transition-colors">I declare zero criminal records and affirm validity of data.</p>
                            </label>
                            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"><AlertCircle size={16} className="text-red-500" /><p className="text-[10px] font-black text-red-400 uppercase">{error}</p></div>}
                        </div>
                    </RegistrationStepWrapper>
                );
            case STEPS.VERIFYING:
                return (
                    <div className="py-12 text-center space-y-10">
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />
                            <Clock size={48} className="text-yellow-500 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analysis Active</h2>
                        <div className="space-y-4 pt-4">
                            {['Protocol Initiated', 'KYC Analysis', 'Admin Consensus'].map((s, i) => (
                                <div key={i} className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 text-white/20'}`}>
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-white' : 'text-white/20'}`}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case STEPS.SUCCESS:
                return (
                    <div className="py-12 text-center space-y-12">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-yellow-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/40">
                            <CheckCircle2 size={48} className="text-black" strokeWidth={3} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Spare Driver Active</h2>
                        <button onClick={() => navigate('/spare-driver/dashboard')} className="w-full h-16 bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-yellow-500 hover:text-black transition-all active:scale-95 italic">Enter Dashboard</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F0D] font-sans selection:bg-yellow-500/30 select-none overflow-x-hidden">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[50%] bg-yellow-500/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[800px] mx-auto px-4 pt-4 pb-12 relative z-10 text-center">
                {/* 🏷️ Custom Centered Header */}
                <div className="flex flex-col items-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-32 h-32 drop-shadow-[0_15px_40px_rgba(234,179,8,0.2)]"
                    >
                        <img
                            src={spareDriverLogo}
                            alt="Spare Driver Logo"
                            className="w-full h-full object-contain hover:scale-110 transition-all duration-500"
                        />
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02, y: -20 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden text-left"
                    >
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder }) => (
    <div className="space-y-2 group">
        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-2 block group-focus-within:text-yellow-500 transition-colors uppercase leading-none">{label}</label>
        <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-500 transition-all pointer-events-none">
                <Icon size={16} strokeWidth={2.5} />
            </div>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 text-[12px] font-bold text-white placeholder:text-white/10 outline-none focus:border-yellow-500/50 transition-all shadow-inner"
            />
        </div>
    </div>
);

const SelectField = ({ label, icon: Icon, value, onChange, options }) => (
    <div className="space-y-2 group">
        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-2 block group-focus-within:text-yellow-500 transition-colors uppercase leading-none">{label}</label>
        <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-500">
                <Icon size={16} strokeWidth={2.5} />
            </div>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-10 text-[12px] font-black text-white outline-none focus:border-yellow-500/50 appearance-none transition-all uppercase tracking-widest"
            >
                {options.map(opt => <option key={opt} value={opt} className="bg-[#0A0F0D]">{opt}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-yellow-500">
                <ChevronRight size={16} className="rotate-90" />
            </div>
        </div>
    </div>
);

const DocButton = ({ label, file, onChange, isFull, transparent }) => (
    <div className={`space-y-2 group ${isFull ? 'w-full' : ''}`}>
        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-2 block leading-none">{label}</label>
        <label className={`relative flex flex-col items-center justify-center gap-3 h-28 rounded-3xl border border-dashed transition-all cursor-pointer overflow-hidden ${file ? 'bg-yellow-500/10 border-yellow-500/40 shadow-inner' : 'bg-white/[0.02] border-white/10 hover:border-yellow-500/50'}`}>
            {file ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40 border border-white/20 animate-bounce">
                        <Check size={20} className="text-black" strokeWidth={4} />
                    </div>
                </motion.div>
            ) : (
                <>
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-yellow-500 transition-all">
                        <Camera size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Attach Securely</span>
                </>
            )}
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => onChange(e.target.files[0])} />
        </label>
    </div>
);

export default DriverRegistration;