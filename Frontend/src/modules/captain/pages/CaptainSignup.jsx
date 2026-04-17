import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../hooks/useCaptain';
import { toast } from 'react-hot-toast';
import {
    Briefcase,
    Mail,
    Lock,
    Phone,
    User,
    MapPin,
    ArrowRight,
    ShieldCheck,
    Camera,
    FileText,
    Car,
    Zap,
    ChevronLeft
} from 'lucide-react';

const CaptainSignup = () => {
    const navigate = useNavigate();
    const { captainSendOTP } = useCaptain();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        city: '',
        vehicleType: 'Two Wheeler',
        plate: '',
        kit: 'Mini-Pro Kit',
        experience: 'Fresher',
        drivingLicense: null,
        aadharCard: null,
        photo: null
    });

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return toast.error('File size should be less than 5MB');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.name || !formData.phone || !formData.password || !formData.city) {
                return toast.error('Required personal fields missing');
            }
            if (formData.phone.length !== 10) {
                return toast.error('Invalid phone number');
            }
        }
        if (currentStep === 2) {
            if (!formData.plate) {
                return toast.error('Vehicle plate number required');
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (currentStep < 3) return nextStep();

        // Final validations for step 3
        if (!formData.drivingLicense || !formData.aadharCard || !formData.photo) {
            return toast.error('All ID documents are mandatory for verification');
        }

        setLoading(true);
        try {
            const res = await captainSendOTP(formData.phone, formData);
            if (res.success) {
                toast.success(`Testing OTP: ${res.data?.otp || 'sent'}`, { duration: 5000 });
                navigate('/captain/otp-verify', {
                    state: {
                        phone: formData.phone,
                        userData: formData,
                        type: 'signup',
                        devOtp: res.data?.otp
                    }
                });
            } else {
                toast.error(res.error || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Signup failed:', error);
            toast.error('Connection failure. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:py-12 relative overflow-hidden font-sans">
            {/* Background Decorative */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
            {/* Visual Header */}
            <div className="relative h-64 w-full flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80"
                    alt="Join Fleet"
                    className="w-full h-full object-cover grayscale-[0.3] brightness-[0.4] object-center"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-16 h-16 bg-brand/20 backdrop-blur-xl border border-white/10 text-brand rounded-[2rem] flex items-center justify-center shadow-2xl mb-4"
                    >
                        <Zap size={32} fill="currentColor" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                        Join the <span className="text-brand">Elite.</span>
                    </h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-3">Captain Onboarding Protocol</p>
                </div>

                <Link to="/captain/login" className="absolute top-12 left-6 w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border bg-white/10 border-white/10 text-white transition-all hover:bg-white/20">
                    <ChevronLeft size={20} strokeWidth={3} />
                </Link>
            </div>

                {/* Card */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-10 shadow-premium border border-gray-100 overflow-hidden">
                    {/* Stepper Progress */}
                    <div className="flex items-center justify-between mb-10 px-2 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                        <div 
                            className="absolute top-1/2 left-0 h-0.5 bg-brand -translate-y-1/2 z-0 transition-all duration-500" 
                            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        />
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s} 
                                className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 font-black text-xs ${
                                    currentStep >= s ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white border-2 border-gray-100 text-gray-300'
                                }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSignup} className="space-y-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-[12px] font-black tracking-widest uppercase mb-4 text-brand">Personal Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField
                                            label="Full Name"
                                            icon={<User size={14} />}
                                            placeholder="Govt ID Name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <InputField
                                            label="Phone Number"
                                            icon={<Phone size={14} />}
                                            type="tel"
                                            placeholder="10 Digits"
                                            maxLength={10}
                                            prefix="+91"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        />
                                        <InputField
                                            label="Email (Optional)"
                                            icon={<Mail size={14} />}
                                            type="email"
                                            placeholder="captain@email.com"
                                            required={false}
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <InputField
                                            label="Create PIN"
                                            icon={<Lock size={14} />}
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <InputField
                                            label="City"
                                            icon={<MapPin size={14} />}
                                            placeholder="Operating City"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-content uppercase tracking-widest flex items-center gap-2 px-2">
                                                <Briefcase size={14} className="text-brand" /> Experience
                                            </label>
                                            <select
                                                className="w-full h-14 bg-white border-2 border-gray-50 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none shadow-sm"
                                                value={formData.experience}
                                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                            >
                                                <option value="Fresher">Fresher</option>
                                                <option value="1-2 Years">1-2 Years</option>
                                                <option value="2+ Years">2+ Years</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-[12px] font-black tracking-widest uppercase mb-4 text-brand">Work Equipment</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-content uppercase tracking-widest flex items-center gap-2 px-2">
                                                <Car size={14} className="text-brand" /> Vehicle
                                            </label>
                                            <select
                                                className="w-full h-14 bg-white border-2 border-gray-50 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none shadow-sm"
                                                value={formData.vehicleType}
                                                onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                            >
                                                <option value="Two Wheeler">Two Wheeler</option>
                                                <option value="Electric Scooter">Electric Scooter</option>
                                                <option value="Three Wheeler">Three Wheeler</option>
                                            </select>
                                        </div>
                                        <InputField
                                            label="Vehicle Plate"
                                            icon={<Car size={14} />}
                                            placeholder="e.g. MH 04 XY 1234"
                                            value={formData.plate}
                                            onChange={e => setFormData({ ...formData, plate: e.target.value })}
                                        />
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-content uppercase tracking-widest flex items-center gap-2 px-2">
                                                <Zap size={14} className="text-brand" /> Equipment Kit
                                            </label>
                                            <select
                                                className="w-full h-14 bg-white border-2 border-gray-50 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none shadow-sm"
                                                value={formData.kit}
                                                onChange={e => setFormData({ ...formData, kit: e.target.value })}
                                            >
                                                <option value="Mini-Pro Kit">Mini-Pro Kit</option>
                                                <option value="Full Tech Setup">Full Tech Setup</option>
                                                <option value="I need a kit from CarWash">I need a kit from CarWash</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-[12px] font-black tracking-widest uppercase mb-2 text-brand">Identity Verification</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                                        <FileUpload
                                            label="Driving License"
                                            onFileChange={(e) => handleFileChange(e, 'drivingLicense')}
                                            fileData={formData.drivingLicense}
                                        />
                                        <FileUpload
                                            label="Aadhar Card"
                                            onFileChange={(e) => handleFileChange(e, 'aadharCard')}
                                            fileData={formData.aadharCard}
                                        />
                                        <FileUpload
                                            label="Recent Photo"
                                            onFileChange={(e) => handleFileChange(e, 'photo')}
                                            fileData={formData.photo}
                                            icon={<Camera size={24} className="text-content-subtle group-hover:text-brand mb-2" />}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4 pt-4">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="h-16 px-8 border-2 border-gray-100 text-content-subtle rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-16 bg-brand text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {currentStep === 3 ? 'Submit Application' : 'Continue to Next Step'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            Already a Captain?{' '}
                            <Link to="/captain/login" className="text-brand font-black">LOGIN HERE</Link>
                        </p>
                    </div>
                </div>


                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10 shadow-sm shadow-blue-500/5">
                        <ShieldCheck size={20} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-tight">Verified Protocol Onboarding</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon, required = true, prefix, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-content uppercase tracking-widest flex items-center gap-2 px-2">
            <span className="text-brand">{icon}</span> {label}
        </label>
        <div className="relative group">
            {prefix && (
                <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-xs font-black text-brand">{prefix}</span>
                    <div className="w-px h-4 bg-gray-100 ml-3" />
                </div>
            )}
            <input
                {...props}
                required={required}
                className={`w-full h-14 bg-white border-2 border-gray-50 rounded-2xl ${prefix ? 'pl-16' : 'px-6'} text-xs font-bold text-content outline-none focus:border-brand transition-all shadow-sm`}
            />
        </div>
    </div>
);

const FileUpload = ({ label, onFileChange, fileData, icon = <FileText size={24} className="text-content-subtle group-hover:text-brand mb-2" /> }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-content-muted uppercase tracking-widest text-center block">
            {label}
        </label>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl hover:border-brand/50 hover:bg-brand/5 cursor-pointer bg-white transition-all group shadow-sm">
            <div className="flex flex-col items-center justify-center pt-2 pb-2">
                {icon}
                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest group-hover:text-brand">Upload</p>
            </div>
            <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={onFileChange}
            />
        </label>
        {fileData && (
            <div className="flex items-center justify-center gap-1.5 mt-1 bg-green-500/10 rounded-lg border border-green-500/20 py-1">
                <ShieldCheck size={12} className="text-green-600" />
                <span className="text-[8px] font-black text-green-700 uppercase">Attached</span>
            </div>
        )}
    </div>
);

export default CaptainSignup;
