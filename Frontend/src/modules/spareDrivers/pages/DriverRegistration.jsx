import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Lock, ChevronRight, FileText, Camera,
    ShieldCheck, CheckCircle2, AlertCircle, MapPin,
    Clock, CreditCard, Briefcase, Globe, Award,
    Check, Zap, Eye, EyeOff, Package, ChevronLeft
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import RegistrationStepWrapper from '../components/RegistrationStepWrapper';
import spareDriverLogo from '../../../assets/spareDriverLogo.png';

const STEPS = { IDENTITY: 1, DRIVING: 2, FINANCIAL: 3, SAFETY: 4, VERIFYING: 5, SUCCESS: 6 };

const DriverRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.IDENTITY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const location = useLocation();
    const [rejectReason, setRejectReason] = useState(location.state?.reason || '');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        aadhaarNumber: '', panNumber: '',
        licenseNumber: '', licenseExpiry: '', experienceYears: '',
        accountName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '',
        city: '', availability: 'full-time',
        criminalDeclaration: false
    });

    const [docs, setDocs] = useState({
        aadhaarCard: null, panCard: null, passportPhoto: null,
        drivingLicense: null, policeVerification: null
    });

    useEffect(() => {
        if (location.state?.rejected) {
            setStep(STEPS.VERIFYING);
            setRejectReason(location.state?.reason);
        }

        const token = localStorage.getItem('chauffeur_token');
        if (!token) return;
        spareDriverAPI.getProfile().then(res => {
            const s = (res.data?.driver?.status || res.driver?.status || '').toLowerCase();
            if (['pending_verification', 'pending'].includes(s)) {
                setStep(STEPS.VERIFYING);
            } else if (['verified_pending_kit', 'kit_payment_pending', 'active'].includes(s)) {
                // If verified but kit is pending, or already active, go to dashboard/success
                if (s === 'active') {
                    setStep(STEPS.SUCCESS);
                } else {
                    navigate('/spare-driver/dashboard');
                }
            } else if (s === 'rejected') {
                setStep(STEPS.VERIFYING);
                setRejectReason(res.data?.driver?.adminNote || res.driver?.adminNote);
            }
        }).catch(() => { });
    }, [location.state]);

    const validateStep = (stepNumber) => {
        switch (stepNumber) {
            case STEPS.IDENTITY:
                if (!form.name?.trim()) return 'Full name is required';
                if (!form.phone || form.phone.length !== 10) return 'Valid 10-digit phone number required';
                if (!form.password || form.password.length < 4) return 'Password must be at least 4 characters';
                if (form.password !== form.confirmPassword) return 'Passwords do not match';
                if (!form.city?.trim()) return 'City is required';
                if (!form.aadhaarNumber?.trim()) return 'Aadhaar number is required';
                if (!form.panNumber?.trim()) return 'PAN number is required';
                if (!docs.aadhaarCard) return 'Aadhaar card photo is required';
                if (!docs.panCard) return 'PAN card photo is required';
                return null;
                
            case STEPS.DRIVING:
                if (!form.licenseNumber?.trim()) return 'License number is required';
                if (!form.licenseExpiry) return 'License expiry date is required';
                if (!form.experienceYears || form.experienceYears < 0) return 'Experience years required';
                if (!docs.drivingLicense) return 'Driving license photo is required';
                if (!docs.passportPhoto) return 'Selfie/photo is required';
                return null;
                
            case STEPS.FINANCIAL:
                if (!form.accountName?.trim()) return 'Account holder name is required';
                if (!form.accountNumber?.trim()) return 'Account number is required';
                if (!form.ifscCode?.trim()) return 'IFSC code is required';
                if (!form.bankName?.trim()) return 'Bank name is required';
                return null;
                
            case STEPS.SAFETY:
                if (!form.criminalDeclaration) return 'You must accept the declaration to proceed';
                return null;
                
            default:
                return null;
        }
    };

    const handleNext = () => {
        const validationError = validateStep(step);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError('');
        step < STEPS.SAFETY ? setStep(step + 1) : handleSubmit();
    };

    const handleBack = () => step > 1 && setStep(step - 1);

    const handleSubmit = async () => {
        // Final validation
        if (!form.criminalDeclaration) { 
            setError('You must accept the declaration to proceed.'); 
            return; 
        }
        
        // Validate all documents are present
        if (!docs.aadhaarCard) {
            setError('Aadhaar card photo is required');
            return;
        }
        if (!docs.panCard) {
            setError('PAN card photo is required');
            return;
        }
        if (!docs.drivingLicense) {
            setError('Driving license photo is required');
            return;
        }
        if (!docs.passportPhoto) {
            setError('Selfie/photo is required');
            return;
        }
        
        setLoading(true); 
        setError('');
        
        try {
            // Create FormData with ALL fields + documents
            const formData = new FormData();
            
            // Basic info
            formData.append('name', form.name);
            if (form.email) formData.append('email', form.email);
            formData.append('phone', form.phone);
            formData.append('password', form.password);
            formData.append('city', form.city);
            formData.append('availability', form.availability);
            
            // Identity documents
            formData.append('aadhaarNumber', form.aadhaarNumber);
            formData.append('panNumber', form.panNumber);
            
            // Driving credentials
            formData.append('licenseNumber', form.licenseNumber);
            formData.append('licenseExpiry', form.licenseExpiry);
            formData.append('experienceYears', form.experienceYears || 0);
            
            // Bank details as JSON string
            formData.append('bankDetails', JSON.stringify({
                accountName: form.accountName,
                accountNumber: form.accountNumber,
                ifscCode: form.ifscCode,
                bankName: form.bankName,
                upiId: form.upiId || ''
            }));
            
            // Documents
            formData.append('aadhaarFront', docs.aadhaarCard);
            formData.append('aadhaarBack', docs.aadhaarCard); // Use same image for both sides
            formData.append('panCard', docs.panCard);
            formData.append('drivingLicense', docs.drivingLicense);
            formData.append('selfie', docs.passportPhoto);
            
            // Optional police verification
            if (docs.policeVerification) {
                formData.append('policeVerification', docs.policeVerification);
            }
            
            console.log('📤 Submitting complete registration with all data and documents');
            
            // Single API call with everything
            const registerRes = await spareDriverAPI.registerComplete(formData);
            
            console.log('✅ Registration complete:', registerRes);
            
            // Store token
            if (registerRes?.token) {
                localStorage.setItem('chauffeur_token', registerRes.token);
            }
            
            setStep(STEPS.VERIFYING);
            
        } catch (err) {
            console.error('❌ Registration failed:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally { 
            setLoading(false); 
        }
    };

    const renderStep = () => {
        switch (step) {
            case STEPS.IDENTITY:
                return (
                    <RegistrationStepWrapper step={1} totalSteps={5} title="Identity legal" subtitle="Secure account creation" onNext={handleNext}>
                        <div className="space-y-3">
                            <InputField label="Full name" icon={User} value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="As per Govt ID" />
                            <InputField label="Mobile number" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit number" type="tel" />
                            <InputField label="Email (optional)" icon={Mail} value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="your@email.com" type="email" />
                            <div className="space-y-1">
                                <label className="text-[7px] font-bold text-white/50 uppercase tracking-widest px-1 block">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Lock size={12} strokeWidth={2.5} /></div>
                                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 4 characters" className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-10 text-[11px] font-medium text-white placeholder:text-white/5 outline-none focus:border-yellow-500/20 transition-all" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 transition-all">{showPassword ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[7px] font-bold text-white/50 uppercase tracking-widest px-1 block">Confirm password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Lock size={12} strokeWidth={2.5} /></div>
                                    <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" className={`w-full h-11 bg-white/[0.02] border rounded-xl pl-11 pr-10 text-[11px] font-medium text-white placeholder:text-white/5 outline-none transition-all ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/30' : 'border-white/5 focus:border-yellow-500/20'}`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 transition-all">{showConfirmPassword ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                                </div>
                                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-[7px] text-red-400 px-1">Passwords do not match</p>}
                            </div>
                            <InputField label="City" icon={MapPin} value={form.city} onChange={v => setForm({ ...form, city: v })} placeholder="Operating city" />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Aadhaar no" icon={ShieldCheck} value={form.aadhaarNumber} onChange={v => setForm({ ...form, aadhaarNumber: v })} placeholder="12 digits" />
                                <InputField label="PAN no" icon={CreditCard} value={form.panNumber} onChange={v => setForm({ ...form, panNumber: v })} placeholder="ABCDE1234F" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <DocButton label="Aadhaar photo" file={docs.aadhaarCard} onChange={f => setDocs({ ...docs, aadhaarCard: f })} />
                                <DocButton label="PAN photo" file={docs.panCard} onChange={f => setDocs({ ...docs, panCard: f })} />
                            </div>
                            {error && <ErrorMsg msg={error} />}
                        </div>
                    </RegistrationStepWrapper>
                );

            case STEPS.DRIVING:
                return (
                    <RegistrationStepWrapper step={2} totalSteps={5} title="Driving credentials" subtitle="License and experience" onBack={handleBack} onNext={handleNext}>
                        <div className="space-y-3">
                            <InputField label="License number" icon={Award} value={form.licenseNumber} onChange={v => setForm({ ...form, licenseNumber: v })} placeholder="DL-XXXX-XXXX" />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="DL expiry" icon={Clock} type="date" value={form.licenseExpiry} onChange={v => setForm({ ...form, licenseExpiry: v })} />
                                <InputField label="Exp years" icon={Briefcase} type="number" value={form.experienceYears} onChange={v => setForm({ ...form, experienceYears: v })} placeholder="Years" />
                            </div>
                            <SelectField label="Availability" icon={Clock} value={form.availability} onChange={v => setForm({ ...form, availability: v })} options={['full-time', 'part-time']} />
                            <div className="grid grid-cols-2 gap-3">
                                <DocButton label="DL photo" file={docs.drivingLicense} onChange={f => setDocs({ ...docs, drivingLicense: f })} />
                                <DocButton label="Selfie / Photo" file={docs.passportPhoto} onChange={f => setDocs({ ...docs, passportPhoto: f })} />
                            </div>
                        </div>
                    </RegistrationStepWrapper>
                );

            case STEPS.FINANCIAL:
                return (
                    <RegistrationStepWrapper step={3} totalSteps={4} title="Bank details" subtitle="Payout routing setup" onBack={handleBack} onNext={handleNext}>
                        <div className="space-y-3">
                            <InputField label="Account holder name" icon={User} value={form.accountName} onChange={v => setForm({ ...form, accountName: v })} placeholder="Name as in bank" />
                            <InputField label="Account number" icon={CreditCard} value={form.accountNumber} onChange={v => setForm({ ...form, accountNumber: v })} placeholder="Bank account number" />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="IFSC code" icon={Globe} value={form.ifscCode} onChange={v => setForm({ ...form, ifscCode: v })} placeholder="HDFC0001234" />
                                <InputField label="Bank name" icon={Globe} value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} placeholder="Bank name" />
                            </div>
                            <InputField label="UPI ID (optional)" icon={Zap} value={form.upiId} onChange={v => setForm({ ...form, upiId: v })} placeholder="user@upi" />
                        </div>
                    </RegistrationStepWrapper>
                );

            case STEPS.SAFETY:
                return (
                    <RegistrationStepWrapper step={4} totalSteps={4} title="Safety protocol" subtitle="Final declarations" onBack={handleBack} onNext={handleNext} loading={loading} nextLabel="Submit Application">
                        <div className="space-y-4">
                            <DocButton label="Police verification certificate" file={docs.policeVerification} onChange={f => setDocs({ ...docs, policeVerification: f })} isFull />
                            <label className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer">
                                <div
                                    onClick={() => setForm({ ...form, criminalDeclaration: !form.criminalDeclaration })}
                                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${form.criminalDeclaration ? 'bg-yellow-500' : 'bg-transparent border border-white/10'}`}
                                >
                                    {form.criminalDeclaration && <Check size={10} className="text-white" strokeWidth={4} />}
                                </div>
                                <p className="text-[8px] font-medium text-white/40 leading-relaxed">I declare that I have no criminal records and all submitted information is accurate and complete.</p>
                            </label>
                            {error && <ErrorMsg msg={error} />}
                        </div>
                    </RegistrationStepWrapper>
                );

            case STEPS.VERIFYING:
                if (rejectReason) {
                    return (
                        <div className="py-10 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl animate-pulse" />
                                <AlertCircle size={32} className="text-red-500 relative z-10" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Verification Failed</h2>
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                    {rejectReason}
                                </p>
                            </div>
                            <div className="pt-2">
                                <button onClick={() => { setRejectReason(''); setStep(STEPS.IDENTITY); }} className="w-full h-11 border border-yellow-500 bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500/20 active:scale-95 transition-all">
                                    Update Documents
                                </button>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="py-10 text-center space-y-6">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-xl animate-pulse" />
                            <Clock size={32} className="text-yellow-500 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Under review</h2>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-2">Our team will verify your documents within 24-48 hours</p>
                        </div>
                        <div className="space-y-2 pt-2">
                            {['Application submitted', 'Document analysis pending', 'Final activation'].map((s, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white/10'}`}>
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${i === 0 ? 'text-white' : 'text-white/20'}`}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case STEPS.SUCCESS:
                return (
                    <div className="py-10 text-center space-y-8">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-yellow-500 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-black/50 shadow-yellow-500/30">
                            <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Account active</h2>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-2">Welcome to the elite fleet</p>
                        </div>
                        <button onClick={() => navigate('/spare-driver/dashboard')} className="w-full h-12 bg-yellow-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-black/50 active:scale-95 transition-all">
                            Enter dashboard
                        </button>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F0D] font-sans overflow-x-hidden text-white">
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[30%] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-md mx-auto px-5 pt-4 pb-12 relative z-10 text-center">
                <div className="flex flex-col items-center mb-4">
                    <motion.img initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} src={spareDriverLogo} alt="Logo" className="w-14 h-14 object-contain drop-shadow-2xl shadow-black/50" />
                    <p className="text-[6px] font-black text-white/20 uppercase tracking-[0.5em] mt-1">Spare Driver</p>
                </div>

                {(step < STEPS.VERIFYING) && (
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                        <p className="text-[8px] font-medium text-white/20">Already have an account?</p>
                        <Link to="/spare-driver/login" className="text-[8px] font-black text-yellow-500 uppercase tracking-widest hover:underline">Sign in</Link>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden text-left"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                {(step < STEPS.VERIFYING) && (
                    <p className="text-center text-[7px] font-bold text-white/10 uppercase tracking-widest mt-4">
                        Already registered?{' '}
                        <Link to="/spare-driver/login" className="text-yellow-500 font-black">Login here</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder }) => (
    <div className="space-y-1">
        <label className="text-[7px] font-bold text-white/50 uppercase tracking-widest px-1 block">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Icon size={12} strokeWidth={2.5} /></div>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-4 text-[11px] font-medium text-white placeholder:text-white/5 outline-none focus:border-yellow-500/20 transition-all shadow-inner" />
        </div>
    </div>
);

const SelectField = ({ label, icon: Icon, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-[7px] font-bold text-white/50 uppercase tracking-widest px-1 block">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10"><Icon size={12} strokeWidth={2.5} /></div>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-8 text-[10px] font-bold text-white outline-none focus:border-yellow-500/20 appearance-none transition-all uppercase tracking-widest">
                {options.map(opt => <option key={opt} value={opt} className="bg-[#0A0F0D]">{opt}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none"><ChevronRight size={12} className="rotate-90" strokeWidth={3} /></div>
        </div>
    </div>
);

const DocButton = ({ label, file, onChange, isFull }) => (
    <div className={`space-y-1 ${isFull ? 'w-full' : ''}`}>
        <label className="text-[7px] font-bold text-white/30 uppercase tracking-widest px-1 block">{label}</label>
        <label className={`relative flex flex-col items-center justify-center gap-1.5 ${isFull ? 'h-16' : 'h-24'} rounded-2xl border-white/5 border-dashed transition-all cursor-pointer ${file ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
            {file ? (
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={16} className="text-white" strokeWidth={4} />
                </div>
            ) : (
                <>
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/20"><Camera size={16} strokeWidth={2} /></div>
                    <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.2em]">Attach file</span>
                </>
            )}
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => onChange(e.target.files[0])} />
        </label>
    </div>
);

const ErrorMsg = ({ msg }) => (
    <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-[9px] font-bold text-red-400">{msg}</p>
    </div>
);

export default DriverRegistration;