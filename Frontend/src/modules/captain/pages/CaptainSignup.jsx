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

import { useTheme } from '../../../context/ThemeContext';

const CaptainSignup = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { register, login } = useAuth();
    // ... logic (same as before)

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex flex-col items-center py-6">
                            <div className="relative">
                                <div className={`w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                    <Camera size={28} className={isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                                </div>
                                <div className={`absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg border-2 transition-colors ${isDarkMode ? 'border-[#0F172A]' : 'border-white'}`}>
                                    <Camera size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                            <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[10px] font-black uppercase tracking-widest mt-4 text-center`}>Identity Photograph</p>
                        </div>
                        <div className="space-y-4">
                            <InputField isDarkMode={isDarkMode} label="Full Name" placeholder="As per govt ID" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <InputField isDarkMode={isDarkMode} label="Phone Number" placeholder="10 Digit Mobile" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
                            <InputField isDarkMode={isDarkMode} label="Create PIN / Passcode" placeholder="4-8 digits recommended" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            <InputField isDarkMode={isDarkMode} label="City" placeholder="Preferred City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            <div>
                                <p className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-3 ml-1`}>Work Experience</p>
                                <div className="flex gap-2">
                                    {['Fresher', '1-2 Years', '2+ Years'].map(exp => (
                                        <button key={exp} onClick={() => setFormData({ ...formData, experience: exp })}
                                            className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${formData.experience === exp
                                                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20'
                                                : isDarkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-white border-gray-100 text-content-subtle shadow-sm'
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
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-content-subtle'} font-bold text-sm`}>Tell us about the vehicle you'll use for deliveries</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Two Wheeler', 'Electric Scouter', 'Three Wheeler', 'Four Wheeler'].map(v => (
                                <button key={v} onClick={() => setFormData({ ...formData, vehicleType: v })}
                                    className={`p-4 rounded-2xl border text-left transition-all ${formData.vehicleType === v
                                        ? (isDarkMode ? 'bg-brand/10 border-brand' : 'bg-white border-brand ring-1 ring-brand shadow-sm')
                                        : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm')
                                        }`}>
                                    <Car size={18} className={formData.vehicleType === v ? 'text-brand' : isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                                    <p className={`font-black text-[10px] uppercase tracking-tighter mt-3 ${formData.vehicleType === v ? 'text-brand' : isDarkMode ? 'text-white' : 'text-content'}`}>{v}</p>
                                </button>
                            ))}
                        </div>
                        <InputField isDarkMode={isDarkMode} label="Vehicle Number" placeholder="e.g. KA 05 MR 7821" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-content-subtle'} font-bold text-sm`}>Do you have your own cleaning equipment?</p>
                        <div className="space-y-3">
                            {['Mini-Pro Kit', 'Full Tech Setup', 'I need a kit from CarWash'].map(k => (
                                <button key={k} onClick={() => setFormData({ ...formData, kit: k })}
                                    className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${formData.kit === k
                                        ? (isDarkMode ? 'bg-brand/10 border-brand' : 'bg-white border-brand ring-1 ring-brand shadow-sm')
                                        : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm')
                                        }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.kit === k ? 'bg-brand' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                            <Zap size={18} className={formData.kit === k ? 'text-white' : isDarkMode ? 'text-white/20' : 'text-gray-300'} fill={formData.kit === k ? 'white' : 'none'} />
                                        </div>
                                        <p className={`font-black text-sm ${formData.kit === k ? (isDarkMode ? 'text-white' : 'text-brand') : isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{k}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.kit === k ? 'border-brand' : isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
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
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-content-subtle'} font-bold text-sm`}>Almost there! Upload your official ID documents</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Aadhar Card (Front & Back)', status: 'Pending' },
                                { label: 'Driving License', status: 'Pending' },
                                { label: 'RC (Vehicle Registration)', status: 'Pending' },
                                { label: 'Bank Account Passbook', status: 'Pending' },
                            ].map(doc => (
                                <div key={doc.label} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'} rounded-2xl border p-4 flex items-center justify-between transition-all`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <Shield size={16} className={isDarkMode ? 'text-white/20' : 'text-gray-300'} />
                                        </div>
                                        <div>
                                            <p className={`font-black text-xs leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{doc.label}</p>
                                            <p className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} text-[9px] font-black italic mt-1 uppercase tracking-widest`}>{doc.status}</p>
                                        </div>
                                    </div>
                                    <button className={`${isDarkMode ? 'bg-brand/10' : 'bg-brand/5'} text-brand px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-brand/20`}>Upload</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            default: return null;
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'} flex flex-col font-sans transition-colors duration-500`}>
            <header className={`px-6 pt-12 pb-6 sticky top-0 backdrop-blur-xl z-50 transition-colors ${isDarkMode ? 'bg-[#0F172A]/80' : 'bg-white/80 border-b border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setStep(s => Math.max(0, s - 1))} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5 text-white' : 'bg-white shadow-soft text-content border border-gray-100'}`}>
                        <ChevronLeft size={20} className={isDarkMode ? 'text-white' : 'text-content'} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Onboarding</h1>
                        <p className="text-brand text-[9px] font-black uppercase tracking-widest mt-0.5">Verification Process</p>
                    </div>
                </div>

                {/* Step Bar */}
                <div className="flex gap-1.5 mt-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex-1 space-y-2">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-brand' : isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                            <p className={`text-[8px] font-black uppercase tracking-widest text-center ${i <= step ? (isDarkMode ? 'text-white' : 'text-brand') : isDarkMode ? 'text-white/20' : 'text-gray-300'}`}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </header>

            <div className="flex-1 px-6 pb-28 pt-4">
                {renderStep()}
            </div>

            {/* Footer CTA */}
            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t px-6 py-6 pb-10 z-50 transition-colors ${isDarkMode ? 'bg-[#0F172A]/90 border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)]' : 'bg-white/90 border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]'}`}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleNext}
                    className="w-full h-14 bg-brand text-white rounded-2xl font-black text-sm shadow-xl shadow-brand/20 flex items-center justify-between px-8 transition-all hover:brightness-110">
                    <span className="tracking-tight uppercase tracking-widest text-[11px] font-black">{step === STEPS.length - 1 ? 'Submit Application' : 'Save & Continue'}</span>
                    <div className="bg-white/20 p-1.5 rounded-xl">
                        <ChevronRight size={18} strokeWidth={4} />
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

const InputField = ({ label, placeholder, value, onChange, type = "text", isDarkMode }) => (
    <div>
        <label className={`${isDarkMode ? 'text-white/40' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-2 block ml-1`}>{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full rounded-2xl px-5 py-4 font-black text-sm outline-none border transition-all ${isDarkMode
                ? 'bg-white/5 border-white/10 text-white focus:border-brand/40 placeholder:text-white/10'
                : 'bg-white border-gray-100 text-content focus:border-brand/40 shadow-sm placeholder:text-gray-300'}`}
        />
    </div>
);

export default CaptainSignup;
