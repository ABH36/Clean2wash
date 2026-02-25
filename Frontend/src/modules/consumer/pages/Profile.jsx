import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Car, MapPin, Gift, ChevronRight,
    ArrowLeft, ShieldCheck, Heart, Settings,
    LogOut, MoreHorizontal, Wallet
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, getUser } = useAuth();
    const user = getUser('consumer');

    const menuItems = [
        { label: 'My Bookings', icon: Car, path: '/bookings', color: 'blue' },
        { label: 'Saved Vehicles', icon: Car, path: '/vehicles', color: 'orange' },
        { label: 'Saved Addresses', icon: MapPin, path: '/addresses', color: 'green' },
        { label: 'Wallet & Rewards', icon: Wallet, path: '/wallet', color: 'purple' },
        { label: 'Refer & Earn', icon: Gift, path: '/refer', color: 'brand' },
        { label: 'Help & Support', icon: Settings, path: '/help', color: 'gray' },
    ];

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-blue-50 text-blue-500',
            orange: 'bg-orange-50 text-orange-500',
            green: 'bg-green-50 text-green-500',
            purple: 'bg-purple-50 text-purple-500',
            brand: 'bg-brand/10 text-brand',
            gray: 'bg-gray-50 text-gray-500',
        };
        return classes[color] || classes.gray;
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white border-b border-gray-100">
                <button onClick={() => navigate(-1)}
                    className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ArrowLeft size={20} className="text-content" strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-black text-content tracking-tight">Account Profile</h1>
                <button className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-content-muted">
                    <MoreHorizontal size={20} />
                </button>
            </header>

            <div className="flex-1 px-6 py-8">
                {/* User Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-gray-100 flex flex-col items-center mb-10"
                >
                    <div className="w-24 h-24 bg-brand/10 rounded-[2.5rem] flex items-center justify-center border-4 border-[#FAFAFA] shadow-xl mb-4 relative overflow-hidden group">
                        <User size={40} className="text-brand" strokeWidth={2.5} />
                        <div className="absolute inset-0 bg-brand/5 group-hover:bg-brand/10 transition-colors" />
                    </div>

                    <h2 className="text-2xl font-black text-content italic tracking-tight">{user?.name || 'Aryan Pathak'}</h2>
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] mt-1">{user?.phone || '+91 98765 43210'}</p>

                    <div className="flex gap-4 mt-6">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-content">12</span>
                            <span className="text-[9px] font-black text-content-subtle uppercase">Washes</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-content tracking-tight">₹2,450</span>
                            <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Saved</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-brand flex items-center gap-1">4.9 <Heart size={12} fill="currentColor" /></span>
                            <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest">Rating</span>
                        </div>
                    </div>
                </motion.div>

                {/* Profile Menu */}
                <div className="space-y-3">
                    {menuItems.map((item, idx) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(item.path)}
                            className="w-full bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-50 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getColorClass(item.color)}`}>
                                    <item.icon size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-black text-content tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" strokeWidth={3} />
                        </motion.button>
                    ))}

                    <div className="pt-8 pb-12">
                        <div className="bg-gray-900 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl mb-6 group cursor-pointer">
                            <div className="relative z-10">
                                <h3 className="text-white text-lg font-black tracking-tight leading-none mb-1 group-hover:text-brand transition-colors">Become a Captain</h3>
                                <p className="text-white/40 text-[11px] font-bold">Start earning with CarWash today</p>
                            </div>
                            <ShieldCheck size={80} className="absolute -right-4 -top-4 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
                        </div>

                        <button
                            onClick={() => { logout('consumer'); navigate('/login'); }}
                            className="w-full py-5 rounded-2xl bg-red-50 text-red-500 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <LogOut size={16} strokeWidth={3} />
                            Log out Account
                        </button>

                        <p className="text-center mt-6 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50 italic">CarWash v2.4.0 • Built for Performance</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
