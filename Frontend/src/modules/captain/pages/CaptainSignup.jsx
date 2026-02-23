import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Car, Shield, Briefcase, ChevronRight, Zap, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const STEPS = [
    { id: 0, label: 'Personal', icon: Briefcase },
    { id: 1, label: 'Vehicle', icon: Car },
    { id: 2, label: 'Equipment', icon: Zap },
    { id: 3, label: 'Documents', icon: Shield },
];

const CaptainSignup = () => {
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '', phone: '', password: '', city: '', experience: 'Fresher',
        vehicleType: 'Two Wheeler', plate: '',
        kit: 'Mini-Pro Kit',
        idType: 'Aadhar Card'
    });

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
        else {
            const userData = { ...formData, role: 'captain', id: 'CPT-' + Math.random().toString(36).substr(2, 6).toUpperCase() };
            register('captain', userData);
            login('captain', userData);
            navigate('/captain');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex flex-col items-center py-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <Camera size={28} className="text-white/20" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-content">
                                    <Camera size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-4 text-center">Identity Photograph</p>
                        </div>
                        <div className="space-y-4">
                            <InputField label="Full Name" placeholder="As per govt ID" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <InputField label="Phone Number" placeholder="10 Digit Mobile" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
                            <InputField label="Create PIN / Passcode" placeholder="4-8 digits recommended" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            <InputField label="City" placeholder="Preferred City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3 ml-1">Work Experience</p>
                                <div className="flex gap-2">
                                    {['Fresher', '1-2 Years', '2+ Years'].map(exp => (
                                        <button key={exp} onClick={() => setFormData({ ...formData, experience: exp })}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${formData.experience === exp ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-white/5 border-white/5 text-white/40'
                                                }`}>
                                            {exp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <p className="text-white/60 font-medium text-sm">Tell us about the vehicle you'll use for deliveries</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Two Wheeler', 'Electric Scouter', 'Three Wheeler', 'Four Wheeler'].map(v => (
                                <button key={v} onClick={() => setFormData({ ...formData, vehicleType: v })}
                                    className={`p-4 rounded-2xl border text-left transition-all ${formData.vehicleType === v ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/5'
                                        }`}>
                                    <Car size={18} className={formData.vehicleType === v ? 'text-brand' : 'text-white/20'} />
                                    <p className={`font-black text-xs uppercase tracking-tight mt-3 ${formData.vehicleType === v ? 'text-brand' : 'text-white'}`}>{v}</p>
                                </button>
                            ))}
                        </div>
                        <InputField label="Vehicle Number" placeholder="e.g. KA 05 MR 7821" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <p className="text-white/60 font-medium text-sm">Do you have your own cleaning equipment?</p>
                        <div className="space-y-3">
                            {['Mini-Pro Kit', 'Full Tech Setup', 'I need a kit from CarWash'].map(k => (
                                <button key={k} onClick={() => setFormData({ ...formData, kit: k })}
                                    className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${formData.kit === k ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/5'
                                        }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.kit === k ? 'bg-brand' : 'bg-white/5'}`}>
                                            <Zap size={18} className={formData.kit === k ? 'text-white' : 'text-white/20'} fill={formData.kit === k ? 'white' : 'none'} />
                                        </div>
                                        <p className={`font-black text-sm ${formData.kit === k ? 'text-white' : 'text-white/40'}`}>{k}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.kit === k ? 'border-brand' : 'border-white/10'}`}>
                                        {formData.kit === k && <div className="w-2.5 h-2.5 bg-brand rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <p className="text-white/60 font-medium text-sm">Almost there! Upload your official ID documents</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Aadhar Card (Front & Back)', status: 'Pending' },
                                { label: 'Driving License', status: 'Pending' },
                                { label: 'RC (Vehicle Registration)', status: 'Pending' },
                                { label: 'Bank Account Passbook', status: 'Pending' },
                            ].map(doc => (
                                <div key={doc.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
                                            <Shield size={16} className="text-white/20" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-xs leading-none">{doc.label}</p>
                                            <p className="text-white/20 text-[9px] font-bold mt-1 uppercase tracking-widest">{doc.status}</p>
                                        </div>
                                    </div>
                                    <button className="bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Upload</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-content flex flex-col font-sans">
            <header className="px-6 pt-12 pb-6 sticky top-0 bg-content/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => setStep(s => Math.max(0, s - 1))} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                        <ChevronLeft size={20} className="text-white" strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-white text-xl font-black tracking-tight">Onboarding</h1>
                        <p className="text-brand text-[9px] font-black uppercase tracking-widest mt-0.5">Verification Process</p>
                    </div>
                </div>

                {/* Step Bar */}
                <div className="flex gap-1.5 mt-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex-1 space-y-2">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-brand' : 'bg-white/5'}`} />
                            <p className={`text-[8px] font-black uppercase tracking-widest text-center ${i <= step ? 'text-white' : 'text-white/20'}`}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </header>

            <div className="flex-1 px-6 pb-28 pt-4">
                {renderStep()}
            </div>

            {/* Footer CTA */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-content/90 backdrop-blur-md border-t border-white/10 px-6 py-6 pb-10 z-50">
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleNext}
                    className="w-full h-14 bg-brand text-white rounded-2xl font-black text-base shadow-xl shadow-brand/20 flex items-center justify-between px-8">
                    <span className="tracking-tight">{step === STEPS.length - 1 ? 'Submit Application' : 'Save & Continue'}</span>
                    <div className="bg-white/20 p-1.5 rounded-xl">
                        <ChevronRight size={18} strokeWidth={4} />
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

const InputField = ({ label, placeholder, value, onChange }) => (
    <div>
        <label className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2 block ml-1">{label}</label>
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-white outline-none focus:border-brand/40 placeholder:text-white/20 tracking-tight"
        />
    </div>
);

export default CaptainSignup;
