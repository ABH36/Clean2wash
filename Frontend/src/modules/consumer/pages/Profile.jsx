import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Car,
    MapPin,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    LogOut,
    Wallet,
    Shield,
    Bell,
    CreditCard,
    HelpCircle,
    Activity,
    Clock,
    X,
    CheckCircle2,
    Headphones,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import MobileLayout from '../components/layout/MobileLayout';
import apiClient from '../../../utils/api';

const ACTIVE_TRIP_STATUSES = ['pending', 'confirmed', 'accepted', 'assigned', 'en_route', 'arrived', 'active'];
const isSpareDriverBooking = (booking = {}) => (
    booking?.service?.type === 'sparedriver'
    || booking?.type === 'sparedriver'
    || booking?.service?.category === 'Chauffeur'
    || String(booking?.serviceName || '').toLowerCase().includes('chauffeur')
    || String(booking?.serviceName || '').toLowerCase().includes('spare driver')
);

const Profile = () => {
    const navigate = useNavigate();
    const { logout, getUser, bookings, updateUser, walletBalance } = useAuth();
    const { isDarkMode } = useTheme();
    const user = getUser('consumer');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [saving, setSaving] = useState(false);

    const spareBookings = useMemo(() => (bookings || []).filter(isSpareDriverBooking), [bookings]);
    const completedTrips = spareBookings.filter((booking) => booking?.status === 'completed');
    const activeTrips = spareBookings.filter((booking) => ACTIVE_TRIP_STATUSES.includes(booking?.status));
    const recentTrips = completedTrips.slice(0, 3);

    const menuGroups = [
        {
            title: 'Trips and payouts',
            items: [
                { label: 'My bookings', icon: Car, path: '/bookings', color: 'blue' },
                { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'purple' },
                { label: 'Spare driver support', icon: HelpCircle, path: '/spare-driver/support', color: 'gray' }
            ]
        },
        {
            title: 'Account and preferences',
            items: [
                { label: 'Saved addresses', icon: MapPin, path: '/addresses', color: 'green' },
                { label: 'Account Trust & KYC', icon: ShieldCheck, path: '/compliance', color: 'blue' },
                { label: 'Payment methods', icon: CreditCard, path: '/payments', color: 'indigo' },
                { label: 'Notifications', icon: Bell, path: '/notifications', color: 'pink' }
            ]
        },
        {
            title: 'Safety toolkit',
            items: [
                { label: 'Trusted contacts', icon: ShieldCheck, path: '/safety/contacts', color: 'green' },
                { label: 'SOS configuration', icon: Shield, path: '/safety/sos', color: 'red' },
                { label: 'Incident log', icon: Activity, path: '/safety/incidents', color: 'blue' }
            ]
        }
    ];

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-blue-500/10 text-blue-500',
            green: 'bg-emerald-500/10 text-emerald-500',
            purple: 'bg-purple-500/10 text-purple-500',
            indigo: 'bg-indigo-500/10 text-indigo-500',
            pink: 'bg-pink-500/10 text-pink-500',
            gray: 'bg-white/5 text-white/40',
            red: 'bg-rose-500/10 text-rose-500'
        };
        return classes[color] || classes.gray;
    };

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const response = await apiClient.updateProfile({ name: editData.name, email: editData.email });
            if (response.status === 'success') {
                updateUser('consumer', user.id, response.data.consumer);
                setIsEditing(false);
                toast.success('Profile updated');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <MobileLayout>
            <div className={`min-h-screen pb-16 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <AnimatePresence>
                    {isEditing && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsEditing(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000]"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                className="fixed inset-x-0 bottom-0 bg-[#0F1412] rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl border-t border-white/10"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-[1000] text-white tracking-tighter">Edit profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-white/20 uppercase tracking-widest ml-1">Full name</p>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-white/20 uppercase tracking-widest ml-1">Email address</p>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 font-bold text-white outline-none focus:border-[#F59E0B]/40 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
                                    >
                                        {saving ? <div className="w-5 h-5 border-black/5 border-black/30 border-t-black rounded-full animate-spin" /> : 'Save changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <header className={`sticky top-0 z-[60] backdrop-blur-md px-4 py-3 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/80 border-black/5'
                    }`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all border ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'
                            }`}>
                            <ArrowLeft size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </button>
                        <div>
                            <h1 className={`text-[17px] font-[1000] tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Account</h1>
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center border border-[#F59E0B]/20">
                        <Sparkles size={14} className="text-[#F59E0B]" fill="currentColor" />
                    </div>
                </header>

                <div className="px-5 pt-3 space-y-2">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-[2rem] p-4 border shadow-2xl transition-all duration-300 ${isDarkMode
                                ? 'bg-white/[0.03] border-white/5 shadow-black/20'
                                : 'bg-white border-black/5 shadow-black/5'
                            } flex items-center gap-4`}
                    >
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10  flex items-center justify-center overflow-hidden">
                                {user?.profile?.avatar ? (
                                    <img src={user.profile.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={32} className="text-slate-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-white/5 border-white rounded-full flex items-center justify-center text-white ">
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className={`text-[17px] font-black tracking-tighter truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{user?.name || 'User'}</h2>
                            <p className={`text-[12px] font-black tracking-tight mt-1 leading-none ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Linked phone</p>
                            <div className="mt-3 flex items-center gap-2">
                                {(user?.kyc?.status === 'verified' || user?.isVerified) ? (
                                    <span className="h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 ">
                                        <Shield size={12} className="text-[#F59E0B]" fill="currentColor" />
                                        Verified Elite
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => navigate('/compliance')}
                                        className="h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                    >
                                        <Shield size={12} />
                                        {user?.kyc?.status === 'pending' ? 'Pending' : 'Complete KYC'}
                                    </button>
                                )}
                                <button onClick={() => setIsEditing(true)} className="text-[11px] font-black uppercase text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors ml-auto">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-2">
                        {bookings === null ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="bg-white/[0.03] rounded-2xl h-16 border border-white/5 shimmer-effect opacity-50" />
                            ))
                        ) : (
                            <>
                                <div className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                    }`}>
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full opacity-50" />
                                    <span className={`text-[14px] font-[1000] relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>{completedTrips.length}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest relative z-10 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Trips</span>
                                </div>
                                <div className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                    }`}>
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-[#F59E0B]/10 rounded-bl-full opacity-50" />
                                    <span className="text-[14px] font-[1000] text-[#F59E0B] relative z-10">{activeTrips.length}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest relative z-10 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Active</span>
                                </div>
                                <div className={`rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                    }`}>
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full opacity-50" />
                                    <span className="text-[14px] font-[1000] text-emerald-500 relative z-10">₹{Math.floor(Number(walletBalance || 0))}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest relative z-10 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Wallet</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <p className={`text-[10px] font-black tracking-[0.2em] uppercase ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Recent trips</p>
                            {bookings !== null && recentTrips.length > 0 && (
                                <button onClick={() => navigate('/bookings')} className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B]">View all</button>
                            )}
                        </div>
                        <div className={`rounded-[1.8rem] border overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                            }`}>
                            {bookings === null ? (
                                <div className="p-4 space-y-2">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-14 bg-white/5 rounded-xl shimmer-effect opacity-50" />
                                    ))}
                                </div>
                            ) : recentTrips.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Clock size={24} className="text-white/10 mx-auto mb-3" />
                                    <p className="text-[12px] font-black text-white/20 uppercase tracking-widest">No history found</p>
                                </div>
                            ) : (
                                recentTrips.map((booking, index) => (
                                    <div key={booking._id || booking.id} className={`p-4 flex items-center justify-between ${index !== recentTrips.length - 1 ? 'border-b border-white/5' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                                                <img src={booking?.vehicle?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4 className={`text-[13px] font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{booking?.service?.name || 'Spare driver trip'}</h4>
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                </div>
                                                <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                                    {new Date(booking.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Completed
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`text-[15px] font-[1000] tracking-tighter tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{booking?.pricing?.totalAmount || booking?.amount || 0}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {menuGroups.map((group) => (
                            <div key={group.title} className="space-y-2">
                                <h3 className={`text-[9px] font-black tracking-[0.2em] px-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{group.title}</h3>
                                <div className={`rounded-[20px] border overflow-hidden shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                    }`}>
                                    {group.items.map((item, index) => (
                                        <button key={item.label} onClick={() => navigate(item.path)} className={`w-full p-4 flex items-center justify-between active:bg-white/5 transition-all ${index !== group.items.length - 1 ? (isDarkMode ? 'border-b border-white/5/50' : 'border-b border-black/5') : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getColorClass(item.color)} border ${isDarkMode ? 'border-white/10' : 'border-black/5'} shadow-lg`}>
                                                    <item.icon size={16} strokeWidth={2.5} />
                                                </div>
                                                <span className={`text-[13px] font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.label}</span>
                                            </div>
                                            <ChevronRight size={14} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/spare-driver/support')}
                        className={`rounded-[1.5rem] p-4 flex items-center gap-4 active:scale-[0.98] transition-all border shadow-2xl relative overflow-hidden group ${isDarkMode ? 'bg-[#0F1412] border-white/10 shadow-black/50' : 'bg-white border-black/5 shadow-black/5'
                            }`}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/10 rounded-bl-full -mr-8 -mt-8 blur-2xl" />
                        <div className="w-10 h-10 bg-[#F59E0B] rounded-xl flex items-center justify-center shrink-0 relative z-10 shadow-lg">
                            <Headphones size={18} className="text-black" />
                        </div>
                        <div className="flex-1 text-left relative z-10">
                            <p className={`font-black text-[13px] tracking-tighter leading-tight mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Trip support desk</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>24/7 help center</p>
                        </div>
                        <ChevronRight size={14} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
                    </button>

                    <button
                        onClick={() => {
                            logout('consumer');
                            navigate('/login');
                        }}
                        className={`w-full h-16 rounded-2xl border font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all border-dashed ${isDarkMode ? 'bg-white/[0.03] border-rose-500/10 text-rose-500 active:bg-rose-500/10' : 'bg-rose-500/05 border-rose-500/20 text-rose-600 active:bg-rose-500/10'
                            }`}
                    >
                        <LogOut size={18} />
                        Logout session
                    </button>

                    <p className={`text-[10px] font-black text-center py-6 tracking-[0.3em] uppercase leading-none ${isDarkMode ? 'text-white/10' : 'text-black/10'}`}>Elite Platform v2.9</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Profile;
