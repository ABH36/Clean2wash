import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
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
    const { register, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        studioName: '',
        city: '',
        idProof: null
    });

    const handleSignup = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            const userData = {
                ...formData,
                role: 'vendor',
                id: 'VND-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                verificationStatus: 'pending',
                registeredAt: new Date().toISOString(),
                idProof: formData.idProof || 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&q=80' // Placeholder if no file
            };
            register('vendor', userData);
            setLoading(false);
            login('vendor', userData);
            navigate('/vendor');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:py-12 relative overflow-hidden font-sans">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-surface border border-gray-100/10 text-brand rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-content italic tracking-tighter uppercase leading-none">Partner <br /><span className="text-brand">Signup</span></h1>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Register your Studio or Hub</p>
                </div>

                {/* Card */}
                <div className="bg-surface rounded-[3rem] p-8 lg:p-10 shadow-soft border border-gray-100/10">
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField
                                label="Owner Name"
                                icon={<User size={14} />}
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <InputField
                                label="Business Email"
                                icon={<Mail size={14} />}
                                type="email"
                                placeholder="vendor@studio.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                            <InputField
                                label="Phone Number"
                                icon={<Phone size={14} />}
                                type="tel"
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
                                label="Studio Name"
                                icon={<Building2 size={14} />}
                                type="text"
                                placeholder="CarWash Studio X"
                                value={formData.studioName}
                                onChange={e => setFormData({ ...formData, studioName: e.target.value })}
                            />
                            <InputField
                                label="Operating City"
                                icon={<MapPin size={14} />}
                                type="text"
                                placeholder="Mumbai"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        {/* ID Verification Section */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
                                <FileText size={14} /> Identity Verification (Aadhar/PAN/GST)
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-100/10 rounded-[2rem] hover:border-brand/50 hover:bg-brand/5 cursor-pointer bg-background transition-all group shadow-sm">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Camera size={24} className="text-content-subtle group-hover:text-brand mb-2" />
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest group-hover:text-brand">Upload ID Document</p>
                                    <p className="text-[8px] font-bold text-content-subtle/50 mt-1 uppercase tracking-tighter italic">PNG, JPG or PDF (Max. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData({ ...formData, idProof: reader.result });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                            {formData.idProof && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <ShieldCheck size={14} className="text-green-600" />
                                    <span className="text-[9px] font-black text-green-700 uppercase italic">Document Attached Successfully</span>
                                </div>
                            )}
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-brand text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Register My Business <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[11px] font-bold text-content-subtle uppercase tracking-widest">
                            Already a Partner?{' '}
                            <Link to="/vendor/login" className="text-brand font-black italic">LOGIN HERE</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10 shadow-sm shadow-blue-500/5">
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
        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2 px-1">
            {icon} {label}
        </label>
        <input
            {...props}
            required
            className="w-full h-14 bg-background border border-gray-100/10 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
        />
    </div>
);

export default VendorSignup;
