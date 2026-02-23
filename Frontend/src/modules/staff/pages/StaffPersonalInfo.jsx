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

const StaffPersonalInfo = () => {
    const navigate = useNavigate();
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
        email: user.email || (user.name.toLowerCase().replace(' ', '.') + '@carwash.in'),
        address: user.address || 'CarWash Hub Dormitory, Sector 15',
        hub: user.hub || 'Studio Hub'
    });

    const handleSave = () => {
        // Mock save logic
        navigate(-1);
    };

    return (
        <StaffLayout title="Identity" subtitle="Personal Node">
            <div className="space-y-8 pb-24">
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4 group">
                        <div className="absolute inset-0 bg-brand/20 rounded-[3rem] rotate-6 scale-105 group-hover:rotate-12 transition-transform duration-500" />
                        <img
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80"
                            className="relative z-10 w-full h-full object-cover rounded-[3rem] border-4 border-white shadow-xl"
                            alt="Profile"
                        />
                        <button className="absolute -bottom-1 -right-1 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg z-20 group-hover:scale-110 transition-transform">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-5">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] px-4 italic">Core Credentials</p>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">Full Legal Name</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full text-base font-black text-content italic outline-none bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">Contact Phone</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <Phone size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full text-base font-black text-content italic outline-none bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group opacity-70">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic">Base Hub (ReadOnly)</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle">
                                <Briefcase size={18} />
                            </div>
                            <p className="w-full text-base font-black text-content italic">{formData.hub}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-soft focus-within:border-brand/40 transition-all group">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-3 italic group-focus-within:text-brand transition-colors">Fleet Residence</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-focus-within:bg-brand group-focus-within:text-white transition-all">
                                <MapPin size={18} />
                            </div>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full text-sm font-black text-content italic outline-none bg-transparent resize-none h-20 pt-1"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="w-full h-16 bg-content text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-content/30 flex items-center justify-center gap-3 mt-10 hover:bg-brand transition-all"
                >
                    Update Identity <Save size={20} />
                </motion.button>
            </div>
        </StaffLayout>
    );
};

export default StaffPersonalInfo;
