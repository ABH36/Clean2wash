import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    ChevronLeft,
    User,
    Settings,
    Shield,
    Bell,
    HelpCircle,
    LogOut,
    Navigation,
    Calendar,
    ChevronRight,
    Camera
} from 'lucide-react';

import StaffLayout from '../components/StaffLayout';
import { useTheme } from '../../../context/ThemeContext';

const StaffProfile = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { getUser, logout, registeredUsers } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-000', hub: 'Main Hub' };

    // Find linked vendor name
    const linkedVendor = (registeredUsers.vendor || []).find(v => v.id === user.vendorId);
    const vendorName = linkedVendor ? linkedVendor.name : (user.hub || 'Independent');

    const handleLogout = () => {
        logout('staff');
        navigate('/staff/login');
    };

    const STAFF_DATA = {
        name: user.name,
        role: 'Hub Executive',
        id: user.id,
        hub: vendorName,
        phone: user.phone || '+91 00000 00000',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80'
    };

    const MENU_ITEMS = [
        { icon: <User size={18} />, label: 'Personal Info', sub: 'ID, Phone, Name', path: '/staff/profile/personal' },
        { icon: <Shield size={18} />, label: 'Authentication', sub: 'Reset Access Pin', path: '/staff/profile/security' },
        { icon: <Bell size={18} />, label: 'Notifications', sub: 'Alert preferences', path: '/staff/profile/notifications' },
        { icon: <HelpCircle size={18} />, label: 'Support', sub: 'Contact Manager', path: '/staff/profile/support' },
    ];

    return (
        <StaffLayout title="Terminal Control" subtitle="Staff Node">
            <div className="space-y-8">
                {/* Profile Card */}
                <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[3rem] p-8 border text-center group relative overflow-hidden transition-all duration-500`}>
                    <div className="relative w-28 h-28 mx-auto mb-6">
                        <div className="absolute inset-0 bg-brand/20 rounded-[2.5rem] rotate-6 scale-105 group-hover:rotate-12 transition-transform duration-500" />
                        <img
                            src={STAFF_DATA.image}
                            className={`relative z-10 w-full h-full object-cover rounded-[2.5rem] border-4 ${isDarkMode ? 'border-[#1E293B]' : 'border-white'} shadow-xl`}
                            alt="Profile"
                        />
                        <button className={`absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center border-4 ${isDarkMode ? 'border-[#1E293B]' : 'border-white'} shadow-lg z-20`}>
                            <Camera size={18} />
                        </button>
                    </div>
                    <h2 className={`text-2xl font-black italic leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>{STAFF_DATA.name}</h2>
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">{STAFF_DATA.id}</p>

                    <div className={`flex gap-4 mt-8 pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                        <div className="flex-1">
                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Attached Hub</p>
                            <p className={`text-xs font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>{STAFF_DATA.hub}</p>
                        </div>
                        <div className={`w-px h-8 self-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                        <div className="flex-1">
                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Clearance</p>
                            <p className="text-xs font-black text-brand italic uppercase tracking-tighter">{STAFF_DATA.role}</p>
                        </div>
                    </div>

                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Menu List */}
                <div className="space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Security & Ops</p>
                    {MENU_ITEMS.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(item.path)}
                            className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} w-full flex items-center justify-between p-6 rounded-[2.5rem] border group hover:border-brand/40 transition-all duration-500`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDarkMode ? 'bg-white/5 text-white/40 group-hover:bg-brand group-hover:text-white' : 'bg-gray-50 text-content-subtle group-hover:bg-brand group-hover:text-white'}`}>
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <h4 className={`text-sm font-black italic uppercase leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>{item.label}</h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className={`${isDarkMode ? 'text-white/10' : 'text-gray-200'} group-hover:text-brand group-hover:translate-x-1 transition-all`} />
                        </button>
                    ))}
                </div>

                <div className="pt-8 text-center">
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] opacity-30 select-none ${isDarkMode ? 'text-white' : 'text-content-subtle'}`}>
                        CarWash Secure Identity Terminal <br />
                        v4.2.0-STF
                    </p>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffProfile;
