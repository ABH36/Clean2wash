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
    ShieldCheck
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
        city: ''
    });

    const handleSignup = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            const userData = {
                ...formData,
                role: 'vendor',
                id: 'VND-' + Math.random().toString(36).substr(2, 6).toUpperCase()
            };
            register('vendor', userData);
            setLoading(false);
            login('vendor', userData);
            navigate('/vendor');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-content text-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-content italic tracking-tighter uppercase leading-none">Partner <br /><span className="text-brand">Signup</span></h1>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Register your Studio or Hub</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-10 shadow-soft border border-gray-100">
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

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-content text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all mt-4"
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
                    <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10">
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
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
        />
    </div>
);

export default VendorSignup;
