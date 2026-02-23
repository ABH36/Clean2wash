import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Truck, User, Phone, Lock, Home, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';

const StaffSignup = () => {
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        hub: 'Mumbai Central Hub'
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
        <div className="min-h-screen bg-white px-8 pt-16 pb-12 flex flex-col font-sans">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-8 border border-gray-100">
                <ChevronLeft size={20} className="text-content" />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1"
            >
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-brand rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-brand/20 mx-auto">
                        <Truck size={40} className="text-white" />
                    </div>
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Join the Force</p>
                    <h1 className="text-3xl font-black text-content italic leading-none">Staff Registration</h1>
                </div>

                <form className="space-y-4" onSubmit={handleSignup}>
                    <InputField
                        label="Full Name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <InputField
                        label="Phone Number"
                        placeholder="9876543210"
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                    <InputField
                        label="Create Access PIN"
                        placeholder="••••"
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 italic">Assigned Hub</label>
                        <select
                            value={formData.hub}
                            onChange={e => setFormData({ ...formData, hub: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-black focus:border-brand outline-none transition-all appearance-none"
                        >
                            <option>Mumbai Central Hub</option>
                            <option>Pune West Hub</option>
                            <option>Bangalore South Hub</option>
                            <option>Delhi North Hub</option>
                        </select>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full bg-content text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-content/20 flex items-center justify-center gap-2 mt-8"
                    >
                        {loading ? 'Processing...' : (
                            <>Join Hoora Team <ArrowRight size={18} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link to="/staff/login" className="text-brand font-black italic">LOGIN</Link>
                    </p>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hoora Secure Staff Node</span>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ label, ...props }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4 italic">{label}</label>
        <input
            {...props}
            required
            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-black focus:border-brand focus:bg-white outline-none transition-all placeholder:text-gray-300"
        />
    </div>
);

export default StaffSignup;
