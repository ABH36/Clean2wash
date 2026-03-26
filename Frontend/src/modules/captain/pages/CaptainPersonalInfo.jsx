import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, User, Mail, Phone, MapPin,
    Truck, Award, ShieldCheck, ShieldAlert,
    CreditCard, FileText, Camera
} from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const CaptainPersonalInfo = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { sessions } = useAuth();
    const user = sessions.captain || {};

    const infoGroups = [
        {
            title: 'Basic Identity',
            items: [
                { label: 'Full Name', value: user.name, icon: User },
                { label: 'Email Address', value: user.email || 'Not provided', icon: Mail },
                { label: 'Phone Number', value: user.phone, icon: Phone },
                { label: 'City of Operation', value: user.profile?.city || user.city || 'Not specified', icon: MapPin },
            ]
        },
        {
            title: 'Professional Details',
            items: [
                { label: 'Vehicle Number', value: user.profile?.plate || 'Not registered', icon: CreditCard },
                { label: 'Experience', value: user.profile?.experience || 'Not set', icon: Award },
                { label: 'Verification Status', value: user.isVerified ? 'Fully Verified' : 'Pending Review', icon: user.isVerified ? ShieldCheck : ShieldAlert, status: user.isVerified ? 'success' : 'warning' },
            ]
        },
        {
            title: 'Payout Information',
            items: [
                { label: 'UPI ID', value: user.bankDetails?.upiId || 'Not connected', icon: CreditCard },
                { label: 'Account number', value: user.bankDetails?.accountNumber?.length > 4 ? `XXXX${user.bankDetails.accountNumber.slice(-4)}` : (user.bankDetails?.accountNumber || 'Not linked'), icon: CreditCard },
                { label: 'IFSC Code', value: user.bankDetails?.ifscCode || 'N/A', icon: FileText },
            ]
        }
    ];

    return (
        <CaptainLayout>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} pb-32 transition-colors duration-500`}>
                {/* Header */}
                <header className={`${isDarkMode ? 'bg-[#1E293B]/80 border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-xl px-4 pt-12 pb-6 sticky top-0 z-40 border-b flex items-center gap-4`}>
                    <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-content'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className={`text-lg font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Personal Info</h1>
                        <p className={`text-[9px] font-black text-brand uppercase tracking-widest`}>Manage your identity</p>
                    </div>
                </header>

                <div className="px-4 py-8 space-y-8">
                    {/* Profile Card */}
                    <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100'} p-6 rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col items-center text-center relative overflow-hidden`}>
                        <div className="relative group mb-4">
                            <div className={`w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 ${isDarkMode ? 'border-brand/20' : 'border-brand/10'} shadow-2xl relative z-10`}>
                                <img src={user.profile?.avatar || user.profile?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -inset-2 bg-brand/10 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className={`text-xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>{user.name}</h2>
                        <div className={`mt-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${user.isVerified ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                            {user.isVerified ? 'IDENTITY VERIFIED' : 'VERIFICATION PENDING'}
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <User size={80} strokeWidth={3} />
                        </div>
                    </div>

                    {/* Info Groups */}
                    {infoGroups.map(group => (
                        <div key={group.title} className="space-y-4">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{group.title}</p>
                            <div className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} rounded-[2.5rem] border overflow-hidden`}>
                                {group.items.map((item, i, arr) => (
                                    <div key={item.label} className={`flex items-center gap-4 px-6 py-5 ${i < arr.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white/5 text-brand/60' : 'bg-brand/5 text-brand'}`}>
                                            <item.icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`${isDarkMode ? 'text-white/30' : 'text-content-subtle'} text-[9px] font-black uppercase tracking-widest mb-1`}>{item.label}</p>
                                            <p className={`font-black text-sm uppercase tracking-tight ${item.status === 'warning' ? 'text-orange-500' : item.status === 'success' ? 'text-green-500' : isDarkMode ? 'text-white' : 'text-content'}`}>
                                                {item.value || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fixed Action Button */}
                <div className="fixed bottom-10 left-6 right-6 z-50">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/captain/profile/edit')}
                        className={`w-full h-14 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 flex items-center justify-center gap-3`}
                    >
                        <Camera size={16} strokeWidth={3} /> Update Profile Info
                    </motion.button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainPersonalInfo;
