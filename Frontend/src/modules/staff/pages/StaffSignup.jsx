import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Truck, User, Phone, Lock, Home, ArrowRight, ShieldCheck, ChevronLeft, Briefcase } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const StaffSignup = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
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
        <div className={`min-h-screen px-8 pt-16 pb-12 flex flex-col relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
            {/* Background elements */}
            <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'}`} />
            <div className={`absolute top-1/2 -right-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 opacity-50 ${isDarkMode ? 'bg-brand/20' : 'bg-brand/10'}`} />

            <button
                onClick={() => navigate(-1)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 border shadow-sm active:scale-95 transition-all relative z-10 ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-content'}`}
            >
                <ChevronLeft size={22} />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1 relative z-10"
            >
                <div className="mb-10 text-center">
                    <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl mx-auto relative group transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] shadow-black/40 border border-white/5' : 'bg-content shadow-content/30'}`}>
                        <Truck size={44} className="text-brand group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic ${isDarkMode ? 'text-brand-light' : 'text-brand'}`}>Personnel Onboarding</p>
                    <h1 className={`text-3xl font-black italic leading-tight uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>Register <br /> Terminal</h1>
                </div>

                <form className="space-y-5" onSubmit={handleSignup}>
                    <InputField
                        label="Member Identity Name"
                        placeholder="e.g. Rahul Sharma"
                        icon={<User size={18} />}
                        isDarkMode={isDarkMode}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <InputField
                        label="Personal Phone Line"
                        placeholder="9876543210"
                        type="tel"
                        icon={<Phone size={18} />}
                        isDarkMode={isDarkMode}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                    <InputField
                        label="Security Access PIN"
                        placeholder="● ● ● ●"
                        type="password"
                        icon={<Lock size={18} />}
                        isDarkMode={isDarkMode}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />

                    <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Assigned Fleet Hub</label>
                        <div className="relative group">
                            <div className={`absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand ${isDarkMode ? 'text-white/10' : 'text-content-subtle'}`}>
                                <Briefcase size={18} />
                            </div>
                            <select
                                value={formData.vendorId}
                                onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                className={`w-full border pl-16 pr-10 py-5 rounded-[2rem] text-sm font-black outline-none transition-all appearance-none shadow-soft ${isDarkMode ? 'bg-white/5 border-white/5 text-white focus:bg-white/10 focus:border-brand/40' : 'bg-gray-50 border-gray-100 text-content focus:bg-white focus:border-brand/40'}`}
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
                        className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mt-10 transition-all ${loading ? 'opacity-70 grayscale' : 'hover:scale-[1.02] active:scale-95'} ${isDarkMode ? 'bg-white text-[#0F172A] shadow-white/5 hover:bg-brand hover:text-white' : 'bg-content text-white shadow-content/30 hover:bg-brand'}`}
                    >
                        {loading ? 'Processing Data...' : (
                            <>Initialize Membership <ArrowRight size={20} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </form>

                <div className={`mt-8 text-center pb-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                        Already Registered?{' '}
                        <Link to="/staff/login" className="text-brand font-black italic border-b border-brand/20 ml-2">Login Terminal</Link>
                    </p>
                </div>

                <div className={`mt-8 flex flex-col items-center gap-2 select-none transition-opacity duration-500 ${isDarkMode ? 'opacity-20 text-white' : 'opacity-30'}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">CarWash HQ Secure Network</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, icon, isDarkMode, ...props }) => (
    <div className="space-y-2">
        <label className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 italic ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{label}</label>
        <div className="relative group">
            <div className={`absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-brand ${isDarkMode ? 'text-white/10' : 'text-content-subtle'}`}>
                {icon}
            </div>
            <input
                {...props}
                required
                className={`w-full border px-16 py-5 rounded-[2rem] text-sm font-black outline-none transition-all shadow-soft placeholder:tracking-normal ${isDarkMode ? 'bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:bg-white/10 focus:border-brand/40' : 'bg-gray-50 border-gray-100 text-content placeholder:text-gray-200 focus:bg-white focus:border-brand/40'}`}
            />
        </div>
    </div>
);

export default StaffSignup;
