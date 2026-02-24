import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, User, Mail, Phone, MapPin, Truck, Save } from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const CaptainProfileEdit = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { getUser } = useAuth();
    const user = getUser('captain') || { name: 'Aryan Pathak', email: 'aryan@example.com', phone: '+91 9876543210', vehicle: 'KA-01-AB-1234', city: 'Bengaluru' };

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle: user.vehicle,
        city: user.city || 'Bengaluru'
    });

    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            navigate('/captain/profile');
        }, 1500);
    };

    const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = "text" }) => (
        <div className="space-y-2">
            <label className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{label}</label>
            <div className={`relative flex items-center ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} border rounded-2xl px-4 transition-all focus-within:border-brand`}>
                <Icon size={16} className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} mr-3`} />
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`flex-1 py-4 bg-transparent outline-none text-sm font-bold ${isDarkMode ? 'text-white' : 'text-content'} placeholder:opacity-30`}
                />
            </div>
        </div>
    );

    return (
        <CaptainLayout>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'} pb-32`}>
                {/* ── Header ── */}
                <header className="px-6 pt-16 pb-6 bg-inherit sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-content'}`}>
                            <ChevronLeft size={16} />
                        </button>
                        <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Edit Profile</h1>
                    </div>
                </header>

                <div className="px-6 mt-8 space-y-10">
                    {/* ── Profile Photo ── */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className={`w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 ${isDarkMode ? 'border-white/10' : 'border-gray-50'} shadow-2xl`}>
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-inherit transition-transform active:scale-90">
                                <Camera size={18} />
                            </button>
                        </div>
                        <p className={`text-[10px] uppercase tracking-widest font-bold mt-4 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Max size 2MB (JPG/PNG)</p>
                    </div>

                    {/* ── Form ── */}
                    <div className="space-y-6">
                        <InputField
                            label="Full Name"
                            icon={User}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                        />
                        <InputField
                            label="Email Address"
                            icon={Mail}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            type="email"
                        />
                        <InputField
                            label="Phone Number"
                            icon={Phone}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91"
                            type="tel"
                        />
                        <InputField
                            label="Vehicle Number"
                            icon={Truck}
                            value={formData.vehicle}
                            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                            placeholder="KA-00-XX-0000"
                        />
                        <InputField
                            label="Work City"
                            icon={MapPin}
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Select city"
                        />
                    </div>
                </div>

                {/* ── Fixed Save Button ── */}
                <div className="fixed bottom-10 left-6 right-6 z-50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full h-14 bg-brand text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-brand/30 active:scale-95 transition-all flex items-center justify-center gap-2 ${saving ? 'opacity-70' : ''}`}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainProfileEdit;
