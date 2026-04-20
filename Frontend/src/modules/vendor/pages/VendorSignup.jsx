import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { vendorAPI } from '../../../utils/vendorApi';
import { toast } from 'react-hot-toast';
import {
    Building2,
    Mail,
    Lock,
    Phone,
    User,
    MapPin,
    ArrowRight,
    ChevronLeft,
    ShieldCheck,
    Camera,
    FileText
} from 'lucide-react';

const VendorSignup = () => {
    const navigate = useNavigate();
    const { vendorSignup, vendorSendOTP } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        studioName: '',
        city: '',
        idProof: null,
        otp: '',
        agreeToTerms: false
    });

    const handleSendOTP = async (e) => {
        e.preventDefault();

        // 1. Validation
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passcodes do not match!');
        }
        if (!formData.agreeToTerms) {
            return toast.error('Please agree to the Partner Terms & Conditions');
        }
        if (!formData.idProof) {
            return toast.error('Identity Verification document is required');
        }

        setLoading(true);
        try {
            const res = await vendorSendOTP(formData.phone);
            if (res.success) {
                toast.success('Security OTP sent! Check terminal/SMS.');
                setStep(2);
            } else {
                toast.error(res.error || 'Failed to trigger security protocol');
            }
        } catch (error) {
            setLoading(false);
        }
    };

    const handleFinalSignup = async (e) => {
        e.preventDefault();
        if (formData.otp.length < 6) {
            return toast.error('Please enter the 6-digit security code');
        }

        setLoading(true);
        try {
            const res = await vendorSignup(formData);
            if (res.success) {
                toast.success('Business Authenticated! Redirecting to Workspace...');
                setTimeout(() => navigate('/vendor'), 1500);
            } else {
                toast.error(res.error || 'Identity verification failed');
            }
        } catch (error) {
            toast.error('System failure during transmission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:py-12 relative overflow-hidden font-sans">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-surface border border-white/5/10 text-brand rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Building2 size={32} className="relative z-10" />
                    </div>
                    <h1 className="text-3xl font-[1000] text-content tracking-tighter uppercase leading-none">Partner <br /><span className="text-brand">Signup</span></h1>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Elite Hub Onboarding</p>
                </div>

                {/* Card */}
                <div className="bg-surface rounded-[3rem] p-8 lg:p-10 shadow-soft border border-white/5/10 backdrop-blur-sm">
                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField
                                    label="Owner Name"
                                    icon={<User size={14} />}
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <InputField
                                    label="Business Email"
                                    icon={<Mail size={14} />}
                                    type="email"
                                    placeholder="office@studio.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <InputField
                                    label="Phone Number"
                                    icon={<Phone size={14} />}
                                    type="tel"
                                    placeholder="10-digit primary"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <InputField
                                    label="Studio Name"
                                    icon={<Building2 size={14} />}
                                    type="text"
                                    placeholder="Enterprise Name"
                                    value={formData.studioName}
                                    onChange={e => setFormData({ ...formData, studioName: e.target.value })}
                                />
                                <InputField
                                    label="Create Passcode"
                                    icon={<Lock size={14} />}
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <InputField
                                    label="Confirm Passcode"
                                    icon={<Lock size={14} />}
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <InputField
                                label="Operating City"
                                icon={<MapPin size={14} />}
                                type="text"
                                placeholder="Service Location"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />

                            {/* ID Verification Section */}
                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2 px-1">
                                    <FileText size={14} /> Identity Document (KYC)
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-white/5 border-dashed border-white/5/10 rounded-[2rem] hover:border-brand/50 hover:bg-brand/5 cursor-pointer bg-background transition-all group ">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {formData.idProof ? (
                                            <div className="flex flex-col items-center">
                                                <ShieldCheck size={32} className="text-green-500 mb-2" />
                                                <p className="text-[9px] font-black text-green-600 uppercase">Document Attached</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Camera size={24} className="text-content-subtle group-hover:text-brand mb-2" />
                                                <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest group-hover:text-brand">Upload ID Proof</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setFormData({ ...formData, idProof: reader.result });
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer group px-1">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 rounded border-white/10 text-brand focus:ring-brand"
                                    checked={formData.agreeToTerms}
                                    onChange={e => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                />
                                <span className="text-[9px] font-bold text-content-subtle uppercase leading-relaxed group-hover:text-content transition-colors">
                                    I certify that I am authorized to represent this business and agree to the <span className="text-brand underline">Service Provider Pact</span>.
                                </span>
                            </label>

                            <button
                                disabled={loading}
                                className="w-full h-16 bg-brand text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Verify Identity <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleFinalSignup}
                            className="space-y-8 py-4"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-xl font-[1000] text-content uppercase tracking-tighter">Enter Security Code</h2>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Sent to +91 {formData.phone}</p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="0 0 0 0 0 0"
                                    required
                                    className="w-full h-20 bg-background border-white/5 border-brand/20 rounded-[1.5rem] text-center text-3xl font-black text-content tracking-[0.5em] focus:border-brand outline-none transition-all shadow-inner"
                                    value={formData.otp}
                                    onChange={e => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                />
                                <p className="text-center text-[9px] font-black text-brand uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setStep(1)}>
                                    <ChevronLeft size={10} className="inline mr-1" /> Edit Phone Number
                                </p>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full h-16 bg-brand text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Authorize & Open Hub <ShieldCheck size={18} /></>
                                )}
                            </button>
                        </motion.form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            Already a Partner?{' '}
                            <Link to="/vendor/login" className="text-brand font-black">LOGIN HERE</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10  shadow-blue-500/5">
                        <ShieldCheck size={20} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-tight">Enterprise Onboarding Protocol</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon, ...props }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest flex items-center gap-2 px-1">
            {icon} {label}
        </label>
        <input
            {...props}
            required
            className="w-full h-14 bg-background border border-white/5/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
        />
    </div>
);

export default VendorSignup;
