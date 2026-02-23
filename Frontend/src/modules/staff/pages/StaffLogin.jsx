import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, LogIn, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const StaffLogin = () => {
    const navigate = useNavigate();
    const { login, validateCredentials } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const user = validateCredentials('staff', { phone, password });
        if (!user) {
            setError('Invalid Staff ID or PIN. Try: 8888888888 / staff123');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            login('staff', user);
            navigate('/staff');
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-white px-8 pt-24 pb-12 flex flex-col justify-between">
            <div>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-brand rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-brand/20 mx-auto"
                >
                    <Truck size={40} className="text-white" />
                </motion.div>

                <div className="text-center mb-12">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Hoora Partners</p>
                    <h1 className="text-3xl font-black text-content italic leading-none">Staff Login</h1>
                    <p className="text-content-subtle text-xs font-bold mt-3">Enter your credentials to access <br /> pickup & drop assignments.</p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4">Staff Phone</label>
                        <input
                            type="tel"
                            placeholder="e.g. 8888888888"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-black focus:border-brand focus:bg-white outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-4">Access Pin / Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-black tracking-[0.5em] focus:border-brand focus:bg-white outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className={`w-full bg-content text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-content/20 flex items-center justify-center gap-2 mt-8 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? 'Authenticating...' : (
                            <>Authorize <ArrowRight size={18} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none">
                        New Staff?{' '}
                        <Link to="/staff/signup" className="text-brand font-black italic">REGISTER HERE</Link>
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 opacity-30 select-none">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Hoora Secure Staff Node</span>
            </div>
        </div>
    );
};

export default StaffLogin;
