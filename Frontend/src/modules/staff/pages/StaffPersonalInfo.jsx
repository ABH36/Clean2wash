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

const StaffPersonalInfo = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: 'Vicky Kaushal',
        phone: '+91 99999 88888',
        email: 'vicky.k@hoora.in',
        address: 'Sec-19, Faridabad, Haryana',
        hub: 'Sec-15 Studio Hub'
    });

    const handleSave = () => {
        // Mock save logic
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Personal Info</h1>
                <div className="w-10" />
            </header>

            <div className="px-5 pt-8 space-y-6 pb-24">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-24 h-24 mb-4">
                        <img
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80"
                            className="w-full h-full object-cover rounded-[2.5rem] border-4 border-white shadow-xl"
                            alt="Profile"
                        />
                        <button className="absolute -bottom-1 -right-1 w-9 h-9 bg-brand text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <Camera size={16} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Full Name</p>
                        <div className="flex items-center gap-3">
                            <User size={18} className="text-brand" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full text-sm font-black text-content italic outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Contact Phone</p>
                        <div className="flex items-center gap-3">
                            <Phone size={18} className="text-brand" />
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full text-sm font-black text-content italic outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Work Email</p>
                        <div className="flex items-center gap-3">
                            <Mail size={18} className="text-brand" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full text-sm font-black text-content italic outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Base Hub</p>
                        <div className="flex items-center gap-3">
                            <Briefcase size={18} className="text-brand" />
                            <p className="w-full text-sm font-black text-content italic opacity-60">{formData.hub}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-2 italic">Residential Address</p>
                        <div className="flex items-center gap-3">
                            <MapPin size={18} className="text-brand" />
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full text-sm font-black text-content italic outline-none resize-none h-16"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="w-full bg-content text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-content/20 flex items-center justify-center gap-3 mt-8"
                >
                    Update Profile <Save size={18} />
                </motion.button>
            </div>
        </div>
    );
};

export default StaffPersonalInfo;
