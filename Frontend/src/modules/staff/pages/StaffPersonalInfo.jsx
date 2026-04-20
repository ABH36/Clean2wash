import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Camera,
    Save
} from 'lucide-react';

import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { staffAPI } from '../../../utils/staffApi';
import { toast } from 'react-hot-toast';

const StaffPersonalInfo = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { getUser } = useAuth();
    const user = getUser('staff') || {
        name: 'Staff Member',
        phone: 'Not provided',
        email: 'staff@carwash.in',
        address: 'Hub Dormitory'
    };

    const [formData, setFormData] = useState({
        name: user.name,
        phone: user.phone,
        address: user.profile?.address?.street || user.address || 'CarWash Hub Dormitory, Sector 15',
        hub: user.hub || 'Studio Hub'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const res = await staffAPI.updateProfile(formData);
            if (res.status === 'success') {
                toast.success('Identity Synchronized');
                // Potential session refresh needed if local state caches user
                navigate(-1);
            }
        } catch (err) {
            toast.error('Identity Sync Failure');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <StaffLayout title="Identity" subtitle="Personal Node">
            <div className="space-y-8 pb-24">
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4 group">
                        <div className="absolute inset-0 bg-brand/20 rounded-[3rem] rotate-6 scale-105 group-hover:rotate-12 transition-transform duration-500" />
                        <img
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80"
                            className={`relative z-10 w-full h-full object-cover rounded-[3rem] border-4 ${isDarkMode ? 'border-[#1E293B]' : 'border-white'} shadow-2xl shadow-black/50`}
                            alt="Profile"
                        />
                        <button className={`absolute -bottom-1 -right-1 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center border-4 ${isDarkMode ? 'border-[#1E293B]' : 'border-white'} shadow-lg z-20 group-hover:scale-110 transition-transform`}>
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-5">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Core Credentials</p>

                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Full Legal Name</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-white/[0.02] text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full text-base font-black outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-content'}`}
                            />
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Contact Phone</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-white/[0.02] text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <Phone size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={`w-full text-base font-black outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-content'}`}
                            />
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1E293B]/50 border-white/5 opacity-50' : 'bg-white/5 border-white/5 shadow-soft opacity-70'} p-6 rounded-[2.5rem] border transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Base Hub (ReadOnly)</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-white/20' : 'bg-white/[0.02] text-content-subtle'}`}>
                                <Briefcase size={18} />
                            </div>
                            <p className={`w-full text-base font-black ${isDarkMode ? 'text-white/60' : 'text-content'}`}>{formData.hub}</p>
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} p-6 rounded-[2.5rem] border focus-within:border-brand/40 transition-all group`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-3 group-focus-within:text-brand transition-colors ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Fleet Residence</p>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/40 group-focus-within:bg-brand group-focus-within:text-white' : 'bg-white/[0.02] text-content-subtle group-focus-within:bg-brand group-focus-within:text-white'}`}>
                                <MapPin size={18} />
                            </div>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className={`w-full text-sm font-black outline-none bg-transparent resize-none h-20 pt-1 ${isDarkMode ? 'text-white' : 'text-content'}`}
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/50 flex items-center justify-center gap-3 mt-10 hover:bg-brand transition-all ${isDarkMode ? 'bg-white/5 text-[#0F172A] shadow-white/5' : 'bg-content text-white shadow-content/30'}`}
                >
                    Update Identity <Save size={20} />
                </motion.button>
            </div>
        </StaffLayout>
    );
};

export default StaffPersonalInfo;
