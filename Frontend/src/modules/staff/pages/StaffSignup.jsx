import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Truck, User, Phone, Lock, Home, ArrowRight, ShieldCheck, ChevronLeft, Briefcase } from 'lucide-react';

const StaffSignup = () => {
    const navigate = useNavigate();
    const { register, login, registeredUsers } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        vendorId: registeredUsers.vendor?.[0]?.id || ''
    });

    const handleSignup = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            const userData = {
                ...formData,
                role: 'staff',
                id: 'STF-' + Math.random().toString(36).substr(2, 5).toUpperCase()
            };
            register('staff', userData);
            setLoading(false);
            login('staff', userData);
            navigate('/staff');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white px-8 pt-16 pb-12 flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -right-24 w-64 h-64 bg-brand/10 rounded-full blur-3xl opacity-50" />

            <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-8 border border-gray-100 shadow-sm active:scale-95 transition-all relative z-10"
            >
                <ChevronLeft size={22} className="text-content" />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1 relative z-10"
            >
                <div className="mb-10 text-center">
                    <div className="w-24 h-24 bg-content rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-content/30 mx-auto relative group">
                        <Truck size={44} className="text-brand group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-3 italic">Personnel Onboarding</p>
                    <h1 className="text-3xl font-black text-content italic leading-tight uppercase tracking-tighter">Register <br /> Terminal</h1>
                </div>

                <form className="space-y-5" onSubmit={handleSignup}>
                    <InputField
                        label="Member Identity Name"
                        placeholder="e.g. Rahul Sharma"
                        icon={<User size={18} />}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <InputField
                        label="Personal Phone Line"
                        placeholder="9876543210"
                        type="tel"
                        icon={<Phone size={18} />}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                    <InputField
                        label="Security Access PIN"
                        placeholder="● ● ● ●"
                        type="password"
                        icon={<Lock size={18} />}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] px-4 italic">Assigned Fleet Hub</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-content-subtle group-focus-within:text-brand transition-colors">
                                <Briefcase size={18} />
                            </div>
                            <select
                                value={formData.vendorId}
                                onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 pl-16 pr-10 py-5 rounded-[2rem] text-sm font-black focus:border-brand/40 outline-none transition-all appearance-none shadow-soft"
                            >
                                {(registeredUsers.vendor || []).map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                                <option value="">Independent Node</option>
                            </select>
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                <ArrowRight size={14} className="rotate-90 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className={`w-full h-16 bg-content text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-content/30 flex items-center justify-center gap-3 mt-10 transition-all ${loading ? 'opacity-70 grayscale' : 'hover:bg-brand hover:scale-[1.02]'}`}
                    >
                        {loading ? 'Processing Data...' : (
                            <>Initialize Membership <ArrowRight size={20} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center pb-8 border-b border-gray-50">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none">
                        Already Registered?{' '}
                        <Link to="/staff/login" className="text-brand font-black italic border-b border-brand/20 ml-2">Login Terminal</Link>
                    </p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2 opacity-30 select-none">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">CarWash HQ Secure Network</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon, ...props }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] px-4 italic">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-content-subtle group-focus-within:text-brand transition-colors">
                {icon}
            </div>
            <input
                {...props}
                required
                className="w-full bg-gray-50 border border-gray-100 px-16 py-5 rounded-[2rem] text-sm font-black focus:border-brand/40 focus:bg-white outline-none transition-all placeholder:text-gray-200 shadow-soft"
            />
        </div>
    </div>
);

export default StaffSignup;
