import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    Zap
} from 'lucide-react';

const CaptainSignup = () => {
    const navigate = useNavigate();
    const { captainSendOTP } = useCaptain();
    const [loading, setLoading] = useState(false);
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

    const handleSignup = async (e) => {
        e.preventDefault();

        // Basic validations
        if (!formData.name || !formData.phone || !formData.password || !formData.city || !formData.plate) {
            return toast.error('Please fill all required fields prominently marked');
        }
        if (formData.phone.length !== 10) {
            return toast.error('Enter a valid 10-digit phone number');
        }

        setLoading(true);
        try {
            const res = await captainSendOTP(formData.phone, formData);
            if (res.success) {
                toast.success('OTP sent for verification!');
                navigate('/captain/otp-verify', {
                    state: {
                        phone: formData.phone,
                        userData: formData,
                        type: 'signup',
                        devOtp: res.data?.otp // For testing if provided by backend
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
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-surface border border-gray-100/10 text-brand rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                        <Zap size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-content italic tracking-tighter uppercase leading-none">Captain <br /><span className="text-brand">Signup</span></h1>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Join the Elite Cleaning Force</p>
                </div>

                {/* Card */}
                <div className="bg-surface rounded-[3rem] p-8 lg:p-10 shadow-soft border border-gray-100/10">
                    <form onSubmit={handleSignup} className="space-y-8">

                        {/* Personal Details */}
                        <div>
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
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                        <Briefcase size={14} /> Experience
                                    </label>
                                    <select
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                        value={formData.experience}
                                        onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                    >
                                        <option value="Fresher">Fresher</option>
                                        <option value="1-2 Years">1-2 Years</option>
                                        <option value="2+ Years">2+ Years</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        <div>
                            <h3 className="text-[12px] font-black tracking-widest uppercase mb-4 text-brand">Work Equipment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                        <Car size={14} /> Vehicle
                                    </label>
                                    <select
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none"
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
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                        <Zap size={14} /> Equipment Kit
                                    </label>
                                    <select
                                        className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all appearance-none"
                                        value={formData.kit}
                                        onChange={e => setFormData({ ...formData, kit: e.target.value })}
                                    >
                                        <option value="Mini-Pro Kit">Mini-Pro Kit</option>
                                        <option value="Full Tech Setup">Full Tech Setup</option>
                                        <option value="I need a kit from CarWash">I need a kit from CarWash</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ID Verification Section */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-[12px] font-black tracking-widest uppercase mb-2 text-brand">Identity Verification</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-brand text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Submit Application <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            Already a Captain?{' '}
                            <Link to="/captain/login" className="text-brand font-black italic">LOGIN HERE</Link>
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

const InputField = ({ label, icon, required = true, ...props }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
            {icon} {label}
        </label>
        <input
            {...props}
            required={required}
            className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
        />
    </div>
);

const FileUpload = ({ label, onFileChange, fileData, icon = <FileText size={24} className="text-content-subtle group-hover:text-brand mb-2" /> }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest italic text-center block">
            {label}
        </label>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-100/10 rounded-2xl hover:border-brand/50 hover:bg-brand/5 cursor-pointer bg-background transition-all group shadow-sm">
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
                <span className="text-[8px] font-black text-green-700 uppercase italic">Attached</span>
            </div>
        )}
    </div>
);

export default CaptainSignup;
