import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, User, Mail, Phone, MapPin, Truck, Save, Briefcase } from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../context/CaptainContext';
import { useTheme } from '../../../context/ThemeContext';

const CaptainProfileEdit = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { sessions, login } = useAuth();
    const { captainUpdateProfile } = useCaptain();
    const user = sessions.captain || {};

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        vehicle: user.profile?.plate || user.plate || '',
        city: user.profile?.city || user.city || 'Bengaluru',
        experience: user.profile?.experience || user.experience || 'Fresher',
        photo: user.profile?.avatar || user.profile?.photo || user.photo || null
    });
    const [saving, setSaving] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                return toast.error('File size should be less than 2MB');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            return toast.error('Name cannot be empty');
        }

        try {
            setSaving(true);
            const updatePayload = {
                name: formData.name,
                email: formData.email,
                profile: {
                    ...user.profile,
                    plate: formData.vehicle,
                    city: formData.city,
                    experience: formData.experience,
                    avatar: formData.photo
                }
            };

            const result = await captainUpdateProfile(updatePayload);

            if (result.success) {
                // Persist updated session to both state AND localStorage via login()
                login('captain', {
                    ...user,
                    name: formData.name,
                    email: formData.email,
                    profile: {
                        ...(user.profile || {}),
                        plate: formData.vehicle,
                        city: formData.city,
                        experience: formData.experience,
                        avatar: formData.photo
                    }
                });
                toast.success('Profile updated successfully! ✅');
                navigate('/captain/profile/personal');
            } else {
                toast.error(result.error || 'Update failed. Please retry.');
            }
        } catch (err) {
            toast.error(err.message || 'Connection error. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', readOnly = false }) => (
        <div className="space-y-2">
            <label className={`text-[10px] uppercase tracking-[0.2em] font-black italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                {label}
            </label>
            <div className={`relative flex items-center border rounded-2xl px-4 transition-all focus-within:border-brand ${
                readOnly
                    ? isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-100 border-gray-200'
                    : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
                <Icon size={16} className={`${isDarkMode ? 'text-brand/40' : 'text-brand/50'} mr-3 flex-shrink-0`} />
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`flex-1 py-4 bg-transparent outline-none text-sm font-black ${
                        readOnly
                            ? isDarkMode ? 'text-white/30 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                            : isDarkMode ? 'text-white' : 'text-content'
                    } placeholder:opacity-30`}
                />
                {readOnly && (
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Locked</span>
                )}
            </div>
        </div>
    );

    return (
        <CaptainLayout>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} pb-36 transition-colors duration-500`}>
                {/* Header */}
                <header className={`${isDarkMode ? 'bg-[#1E293B]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-xl px-4 pt-12 pb-6 sticky top-0 z-40 border-b flex items-center gap-4`}>
                    <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-content'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className={`text-lg font-black italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Edit Profile</h1>
                        <p className={`text-[9px] font-black uppercase tracking-widest text-brand`}>Update your details</p>
                    </div>
                </header>

                <div className="px-4 py-8 space-y-8">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className={`w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 shadow-2xl ${isDarkMode ? 'border-brand/20' : 'border-brand/10'} bg-brand/5 flex items-center justify-center`}>
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand/10">
                                        <span className="text-brand font-black text-4xl">{formData.name?.charAt(0) || 'C'}</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-inherit transition-transform active:scale-90 hover:bg-brand/90 cursor-pointer">
                                <Camera size={18} strokeWidth={2.5} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <div className="absolute -inset-2 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className={`text-[10px] uppercase tracking-widest font-black mt-5 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                            Tap camera to change photo · Max 2MB
                        </p>
                    </div>

                    {/* Editable Fields */}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] italic px-2 mb-4 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Personal Details</p>
                        <div className="space-y-4">
                            <InputField
                                label="Full Name"
                                icon={User}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your government name"
                            />
                            <InputField
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="captain@email.com"
                            />
                            <InputField
                                label="Phone Number (Registered)"
                                icon={Phone}
                                type="tel"
                                value={formData.phone}
                                readOnly={true}
                                placeholder="+91"
                            />
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] italic px-2 mb-4 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Work Details</p>
                        <div className="space-y-4">
                            <InputField
                                label="Vehicle Number"
                                icon={Truck}
                                value={formData.vehicle}
                                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value.toUpperCase() })}
                                placeholder="KA-00-XX-0000"
                            />
                            <InputField
                                label="Operating City"
                                icon={MapPin}
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Bengaluru"
                            />
                            <div className="space-y-2">
                                <label className={`text-[10px] uppercase tracking-[0.2em] font-black italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                                    Experience Level
                                </label>
                                <div className={`relative flex items-center border rounded-2xl px-4 transition-all focus-within:border-brand ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <Briefcase size={16} className={`${isDarkMode ? 'text-brand/40' : 'text-brand/50'} mr-3 flex-shrink-0`} />
                                    <select
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        className={`flex-1 py-4 bg-transparent outline-none text-sm font-black appearance-none ${isDarkMode ? 'text-white' : 'text-content'}`}
                                    >
                                        <option value="Fresher">Fresher</option>
                                        <option value="1-2 Years">1-2 Years</option>
                                        <option value="2+ Years">2+ Years</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Save Button */}
                <div className="fixed bottom-8 left-4 right-4 z-50">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full h-14 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic shadow-2xl shadow-brand/40 flex items-center justify-center gap-3 transition-all ${saving ? 'opacity-70' : ''}`}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Save size={16} strokeWidth={3} /> Save Changes</>
                        )}
                    </motion.button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainProfileEdit;
