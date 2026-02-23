import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    Store,
    Lock,
    Mail,
    ChevronRight,
    ShieldCheck,
    ArrowLeft,
    Building2
} from 'lucide-react';

const VendorLogin = () => {
    const navigate = useNavigate();
    const { login, validateCredentials } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const user = validateCredentials('vendor', { email, password });
        if (!user) {
            setError('Invalid credentials. Try: vendor@hoora.in / vendor123');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            login('vendor', user);
            navigate('/vendor');
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-content text-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-content italic tracking-tighter uppercase leading-none">Vendor <br /><span className="text-brand">Workspace</span></h1>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-3">Studio & Hub Management Port</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-10 shadow-soft border border-gray-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5 px-1">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2">
                                    <Mail size={12} /> Registered Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="vendor@hoora.in"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 px-1">
                                <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic flex items-center gap-2">
                                    <Lock size={12} /> Passcode
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-xs font-bold text-content outline-none focus:border-brand transition-all"
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2 mt-1">{error}</p>
                        )}

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-200 text-brand focus:ring-brand" />
                                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">Remember</span>
                            </label>
                            <button type="button" className="text-[10px] font-black text-brand uppercase tracking-widest italic">Forgot Entry?</button>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-content text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-content/20 flex items-center justify-center gap-3 hover:bg-brand transition-all relative overflow-hidden group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Enter Workspace
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex flex-col items-center gap-6">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">
                        New Partner?{' '}
                        <Link to="/vendor/signup" className="text-brand font-black italic">REGISTER NOW</Link>
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-content-subtle hover:text-content transition-colors font-black text-[10px] uppercase tracking-widest italic"
                    >
                        <ArrowLeft size={14} /> Back to Consumer Port
                    </button>

                    <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10">
                        <ShieldCheck size={20} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-tight">Enterprise SSL Encryption Active</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VendorLogin;
