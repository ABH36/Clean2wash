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

const StaffProfile = () => {
    const navigate = useNavigate();
    const { getUser, logout } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-000', hub: 'Main Hub' };

    const handleLogout = () => {
        logout('staff');
        navigate('/staff/login');
    };

    const STAFF_DATA = {
        name: user.name,
        role: 'Hub Executive',
        id: user.id,
        hub: user.hub || 'Studio Hub',
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
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate('/staff')} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Account</h1>
                <button className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <Settings size={18} className="text-content-subtle" />
                </button>
            </header>

            <div className="px-5 pt-8">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-white border border-red-100 text-red-500 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 mb-10"
                >
                    <LogOut size={18} /> End Duty Session
                </button>
                {/* Profile Card */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-soft text-center mb-10">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <img src={STAFF_DATA.image} className="w-full h-full object-cover rounded-[2.5rem] border-4 border-gray-50 shadow-xl" alt="Profile" />
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <Camera size={18} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-content italic leading-none mb-1">{STAFF_DATA.name}</h2>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">{STAFF_DATA.id}</p>

                    <div className="flex gap-4 mt-8 pt-8 border-t border-gray-50">
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Hub</p>
                            <p className="text-xs font-black text-content italic">{STAFF_DATA.hub}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 self-center" />
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest mb-1">Role</p>
                            <p className="text-xs font-black text-brand italic">{STAFF_DATA.role}</p>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="space-y-4">
                    {MENU_ITEMS.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center justify-between p-5 bg-white rounded-[2rem] border border-gray-100 shadow-soft group hover:border-brand transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-content-subtle group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-content italic uppercase leading-none mb-1">{item.label}</h4>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase leading-none">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-200 group-hover:text-brand transition-all" />
                        </button>
                    ))}

                    <button
                        onClick={() => navigate('/staff/login')}
                        className="w-full flex items-center justify-center gap-2 p-5 bg-red-50 rounded-[2rem] border border-red-100 text-accent-red font-black text-xs uppercase tracking-widest mt-6"
                    >
                        <LogOut size={18} /> Logout Session
                    </button>
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
                <button onClick={() => navigate('/staff')} className="flex flex-col items-center gap-1 text-content-muted">
                    <Navigation size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Jobs</span>
                </button>
                <button onClick={() => navigate('/staff/history')} className="flex flex-col items-center gap-1 text-content-muted">
                    <Calendar size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">History</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-brand">
                    <User size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default StaffProfile;
