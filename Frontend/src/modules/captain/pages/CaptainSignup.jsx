import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';
import {
    Briefcase, Mail, Lock, Phone, User, MapPin, ArrowRight,
    ShieldCheck, Camera, FileText, Car, Zap, ChevronLeft, Check,
    Eye, EyeOff, Package, CreditCard
} from 'lucide-react';
import spareDriverLogo from '../../../assets/spareDriverLogo.png';

const KITS = [
    { id: 'mini', name: 'Mini-Pro Kit', price: '₹1,499', desc: 'Essential tools for new drivers', icon: '🧰', features: ['Kit bag', 'ID jacket', 'App guide'] },
    { id: 'full', name: 'Full Tech Setup', price: '₹2,999', desc: 'Advanced professional package', icon: '💼', features: ['Kit bag', 'Uniform', 'Tablet mount', 'Priority listing'] },
    { id: 'own', name: 'I have my kit', price: 'Free', desc: 'Verification required by admin', icon: '✅', features: ['Own equipment', 'Admin review needed'] },
];

const CaptainSignup = () => {
    const navigate = useNavigate();
    const { captainSendOTP } = useCaptain();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        city: '', vehicleType: 'Two Wheeler', plate: '',
        kitOption: 'mini', kit: 'Mini-Pro Kit', experience: 'Fresher',
        drivingLicense: null, aadharCard: null, photo: null
    });

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) return toast.error('File size should be less than 5MB');
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const validate = (step) => {
        if (step === 1) {
            if (!formData.name || !formData.phone || !formData.password || !formData.city) return toast.error('All required fields must be filled') || false;
            if (formData.phone.length !== 10) return toast.error('Enter a valid 10-digit phone') || false;
            if (formData.password.length < 4) return toast.error('Password must be at least 4 characters') || false;
            if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match') || false;
        }
        if (step === 2 && !formData.plate) return toast.error('Vehicle plate is required') || false;
        if (step === 3 && !formData.kitOption) return toast.error('Select a kit option') || false;
        if (step === 4 && (!formData.drivingLicense || !formData.aadharCard || !formData.photo)) return toast.error('All ID documents are mandatory') || false;
        return true;
    };

    const nextStep = () => validate(currentStep) && setCurrentStep(p => p + 1);

    const handleSignup = async (e) => {
        e.preventDefault();
        if (currentStep < 4) return nextStep();
        if (!validate(4)) return;

        setLoading(true);
        try {
            const selectedKit = KITS.find(k => k.id === formData.kitOption);
            const payload = { ...formData, kit: selectedKit?.name || formData.kit };
            const res = await captainSendOTP(formData.phone, payload);
            if (res.success) {
                toast.success('OTP sent!');
                navigate('/captain/otp-verify', { state: { phone: formData.phone, userData: payload, type: 'signup', devOtp: res.data?.otp } });
            } else toast.error(res.error || 'Failed to send OTP');
        } catch { toast.error('Connection failure'); }
        finally { setLoading(false); }
    };

    const steps = ['Bio', 'Gear', 'Kit', 'Legal'];
    const totalSteps = steps.length;

    return (
        <div className="min-h-screen bg-[#0A0F0D] flex flex-col font-sans overflow-hidden text-white">
            {/* Header */}
            <div className="relative pt-8 pb-3 flex flex-col items-center">
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={spareDriverLogo} alt="Logo" className="w-12 h-12 mb-2 object-contain" />
                <h1 className="text-xl font-bold tracking-tight text-center">Fleet <span className="text-yellow-500">Signup</span></h1>
                <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Captain onboarding protocol</p>
                <Link to="/captain/login" className="absolute top-6 left-6 w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 text-white/40 active:scale-90 transition-all">
                    <ChevronLeft size={16} strokeWidth={3} />
                </Link>
            </div>

            <div className="flex-1 px-5 pb-8 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-4 px-3 py-2 bg-white/[0.01] border border-white/5 rounded-xl">
                        {steps.map((label, idx) => {
                            const s = idx + 1;
                            return (
                                <div key={s} className="flex items-center gap-1.5 relative z-10">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] transition-all ${currentStep > s ? 'bg-yellow-500 text-white' : currentStep === s ? 'bg-yellow-500/90 text-white ring-2 ring-yellow-500/20' : 'bg-white/5 text-white/10'}`}>
                                        {currentStep > s ? <Check size={11} strokeWidth={4} /> : s}
                                    </div>
                                    <span className={`text-[7px] font-bold uppercase tracking-widest hidden sm:block ${currentStep === s ? 'text-yellow-500' : 'text-white/10'}`}>{label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${(currentStep / totalSteps) * 100}%` }} className="h-full bg-yellow-500 rounded-full" />
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-5 shadow-2xl">
                        <form onSubmit={handleSignup} className="space-y-3.5">
                            <AnimatePresence mode="wait">
                                {/* ── STEP 1: Bio ── */}
                                {currentStep === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                        <StepLabel title="Personal Details" />
                                        <InputField label="Full name" icon={<User size={10} />} placeholder="Name in ID" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <InputField label="Mobile" icon={<Phone size={10} />} type="tel" placeholder="10 digits" maxLength={10} prefix="+91" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
                                        <InputField label="Email (optional)" icon={<Mail size={10} />} type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        <div className="space-y-1 group">
                                            <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block leading-none">Secure password</label>
                                            <div className="relative">
                                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none text-white/5"><Lock size={10} /></div>
                                                <input type={showPassword ? 'text' : 'password'} placeholder="Min 4 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-10 text-[11px] font-bold text-white outline-none focus:border-yellow-500/20 placeholder:text-white/5 transition-all" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 inset-y-0 flex items-center text-white/10 hover:text-white/40 transition-all">
                                                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1 group">
                                            <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block leading-none">Confirm password</label>
                                            <div className="relative">
                                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none text-white/5"><Lock size={10} /></div>
                                                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className={`w-full h-11 bg-white/[0.02] border rounded-xl pl-11 pr-10 text-[11px] font-bold text-white outline-none transition-all placeholder:text-white/5 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:border-yellow-500/20'}`} />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 inset-y-0 flex items-center text-white/10 hover:text-white/40 transition-all">
                                                    {showConfirmPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                                </button>
                                            </div>
                                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                                <p className="text-[7px] text-red-400 px-4">Passwords do not match</p>
                                            )}
                                        </div>
                                        <InputField label="City" icon={<MapPin size={10} />} placeholder="Operating city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </motion.div>
                                )}

                                {/* ── STEP 2: Vehicle ── */}
                                {currentStep === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                        <StepLabel title="Vehicle Details" />
                                        <SelectField label="Vehicle type" icon={<Car size={10} />} value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} options={['Two Wheeler', 'Electric Scooter', 'Three Wheeler', 'Car']} />
                                        <InputField label="Number plate" icon={<Car size={10} />} placeholder="MH 01 AB 1234" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
                                        <SelectField label="Experience" icon={<Briefcase size={10} />} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} options={['Fresher', '1-2 Years', '2+ Years']} />
                                    </motion.div>
                                )}

                                {/* ── STEP 3: Kit Selection ── */}
                                {currentStep === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                        <StepLabel title="Choose your kit" />
                                        <p className="text-[8px] text-white/30 px-1">Kit cost is deducted in monthly installments from your earnings.</p>
                                        <div className="space-y-2">
                                            {KITS.map(kit => (
                                                <button
                                                    key={kit.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, kitOption: kit.id, kit: kit.name })}
                                                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${formData.kitOption === kit.id ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{kit.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className={`text-[10px] font-bold ${formData.kitOption === kit.id ? 'text-yellow-500' : 'text-white'}`}>{kit.name}</p>
                                                                <p className={`text-[9px] font-black ${formData.kitOption === kit.id ? 'text-yellow-500' : 'text-white/30'}`}>{kit.price}</p>
                                                            </div>
                                                            <p className="text-[7px] text-white/20 mt-0.5">{kit.desc}</p>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-white/5 flex items-center justify-center flex-shrink-0 ${formData.kitOption === kit.id ? 'border-yellow-500 bg-yellow-500' : 'border-white/10'}`}>
                                                            {formData.kitOption === kit.id && <Check size={8} strokeWidth={4} className="text-white" />}
                                                        </div>
                                                    </div>
                                                    {formData.kitOption === kit.id && (
                                                        <div className="mt-2 flex flex-wrap gap-1 pl-8">
                                                            {kit.features.map(f => (
                                                                <span key={f} className="text-[6px] bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">{f}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 4: Legal Docs ── */}
                                {currentStep === 4 && (
                                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                        <StepLabel title="Identity documents" />
                                        <p className="text-[8px] text-white/30 px-1">All documents required for compliance. Images are stored securely.</p>
                                        <div className="space-y-2">
                                            <FileUpload label="Driving license copy" onFileChange={(e) => handleFileChange(e, 'drivingLicense')} fileData={formData.drivingLicense} />
                                            <FileUpload label="Aadhar card copy" onFileChange={(e) => handleFileChange(e, 'aadharCard')} fileData={formData.aadharCard} />
                                            <FileUpload label="Profile photo" onFileChange={(e) => handleFileChange(e, 'photo')} fileData={formData.photo} icon={<Camera size={14} />} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-2.5 pt-2">
                                {currentStep > 1 && (
                                    <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="h-11 w-11 bg-white/5 border border-white/5 text-white/20 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                                        <ChevronLeft size={16} strokeWidth={3} />
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className="flex-1 h-11 bg-yellow-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    {loading ? <div className="w-4 h-4 border-white/5 border-black/20 border-t-black rounded-full animate-spin" /> : <>{currentStep === 4 ? 'Submit application' : 'Continue'} <ArrowRight size={14} strokeWidth={4} /></>}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-5 text-center">
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                            Already a captain?{' '}<Link to="/captain/login" className="text-yellow-500">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepLabel = ({ title }) => (
    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">{title}</p>
);

const InputField = ({ label, icon, prefix, ...props }) => (
    <div className="space-y-1 group">
        <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block leading-none">{label}</label>
        <div className="relative">
            {prefix && <div className="absolute left-10 inset-y-0 flex items-center pointer-events-none text-[9px] font-bold text-yellow-500">{prefix}</div>}
            <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none text-white/5">{icon}</div>
            <input {...props} className={`w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl ${prefix ? 'pl-20' : 'pl-11'} pr-4 text-[11px] font-bold text-white outline-none focus:border-yellow-500/20 placeholder:text-white/5 transition-all`} />
        </div>
    </div>
);

const SelectField = ({ label, icon, value, onChange, options }) => (
    <div className="space-y-1 group">
        <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-4 block leading-none">{label}</label>
        <div className="relative">
            <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none text-white/5">{icon}</div>
            <select value={value} onChange={onChange} className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-8 text-[10px] font-bold text-white outline-none focus:border-yellow-500/20 appearance-none transition-all">
                {options.map(opt => <option key={opt} value={opt} className="bg-[#0A0F0D]">{opt}</option>)}
            </select>
        </div>
    </div>
);

const FileUpload = ({ label, onFileChange, fileData, icon = <FileText size={14} /> }) => (
    <div className="space-y-1">
        <label className="text-[7px] font-bold text-white/10 uppercase tracking-widest px-4 block leading-none">{label}</label>
        <label className={`relative flex items-center gap-3 px-4 h-13 rounded-xl border transition-all cursor-pointer ${fileData ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${fileData ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white/10'}`}>
                {fileData ? <Check size={16} strokeWidth={4} /> : icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-[8px] font-bold uppercase tracking-widest truncate ${fileData ? 'text-yellow-500' : 'text-white/20'}`}>{fileData ? 'Attached' : 'Choose file'}</p>
                {!fileData && <p className="text-[6px] font-bold text-white/5 uppercase tracking-widest mt-0.5">Max 5MB • JPG/PDF</p>}
            </div>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={onFileChange} />
        </label>
    </div>
);

export default CaptainSignup;
