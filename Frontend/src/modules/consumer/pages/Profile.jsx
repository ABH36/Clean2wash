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
    Headphones
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
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
            blue: 'bg-blue-50 text-blue-500',
            green: 'bg-emerald-50 text-emerald-500',
            purple: 'bg-purple-50 text-purple-500',
            indigo: 'bg-indigo-50 text-indigo-500',
            pink: 'bg-pink-50 text-pink-500',
            gray: 'bg-slate-50 text-slate-500',
            red: 'bg-red-50 text-red-500'
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
            <div className="bg-slate-50 min-h-screen pb-32">
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
                                className="fixed inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Edit profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Full name</p>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 outline-none focus:border-[#FF9900]/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Email address</p>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 outline-none focus:border-[#FF9900]/40 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
                                    >
                                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <header className="sticky top-0 z-[60] bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <ArrowLeft size={18} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Account</h1>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-5">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                {user?.profile?.avatar ? (
                                    <img src={user.profile.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={32} className="text-slate-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-sm">
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[17px] font-bold text-slate-900 truncate">{user?.name || 'User'}</h2>
                            <p className="text-[12px] text-slate-400 font-bold tracking-tight mt-1">{user?.phone || 'Linked phone'}</p>
                            <div className="mt-3 flex items-center gap-2">
                                {user?.isVerified ? (
                                    <span className="h-7 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 bg-emerald-50 text-emerald-500 border border-emerald-100/50">
                                        <CheckCircle2 size={12} />
                                        Verified account
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/compliance')}
                                        className="h-7 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 bg-orange-50 text-orange-500 border border-orange-100/50"
                                    >
                                        <Shield size={12} />
                                        Complete KYC
                                    </button>
                                )}
                                <button onClick={() => setIsEditing(true)} className="text-[11px] font-bold text-slate-300 underline underline-offset-4 decoration-slate-200 ml-auto">
                                    Edit profile
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-gray-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 rounded-bl-full opacity-50" />
                            <span className="text-[14px] font-[1000] text-slate-900 relative z-10">{completedTrips.length}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest relative z-10">Trips</span>
                        </div>
                        <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-gray-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-[#FF9900]/10 rounded-bl-full opacity-50" />
                            <span className="text-[14px] font-[1000] text-[#FF9900] relative z-10">{activeTrips.length}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest relative z-10">Active</span>
                        </div>
                        <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-gray-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-50 rounded-bl-full opacity-50" />
                            <span className="text-[14px] font-[1000] text-emerald-500 relative z-10">₹{Math.floor(Number(walletBalance || 0))}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest relative z-10">Wallet</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[13px] font-bold text-slate-900">Recent trips</p>
                            {recentTrips.length > 0 && (
                                <button onClick={() => navigate('/bookings')} className="text-[11px] font-bold text-[#FF9900]">View all</button>
                            )}
                        </div>
                        <div className="bg-white rounded-[1.8rem] border border-gray-100 overflow-hidden shadow-sm">
                            {recentTrips.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Clock size={24} className="text-slate-100 mx-auto mb-3" />
                                    <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">No completed trips yet</p>
                                </div>
                            ) : (
                                recentTrips.map((booking, index) => (
                                    <div key={booking._id || booking.id} className={`p-4 flex items-center justify-between ${index !== recentTrips.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                                                <img src={booking?.vehicle?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4 className="text-[13px] font-bold text-slate-900 leading-none">{booking?.service?.name || 'Spare Driver Trip'}</h4>
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                </div>
                                                <p className="text-[10px] text-slate-300 font-medium">
                                                    {new Date(booking.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Completed
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-[15px] font-bold text-slate-900 tabular-nums">₹{booking?.pricing?.totalAmount || booking?.amount || 0}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {menuGroups.map((group) => (
                            <div key={group.title} className="space-y-2.5">
                                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] px-1">{group.title}</h3>
                                <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden shadow-sm">
                                    {group.items.map((item, index) => (
                                        <button key={item.label} onClick={() => navigate(item.path)} className={`w-full p-3.5 flex items-center justify-between active:bg-slate-50 transition-colors ${index !== group.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getColorClass(item.color)} border border-white/50`}>
                                                    <item.icon size={16} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[13px] font-[1000] text-slate-900 uppercase tracking-tight leading-none">{item.label}</span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-200" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/spare-driver/support')}
                        className="w-full bg-slate-900 rounded-[20px] p-4 flex items-center gap-4 active:scale-[0.98] transition-all border border-white/5 shadow-xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF9900]/10 rounded-bl-full -mr-8 -mt-8 blur-2xl" />
                        <div className="w-10 h-10 bg-[#FF9900] rounded-xl flex items-center justify-center shrink-0 relative z-10">
                            <Headphones size={18} className="text-slate-900" />
                        </div>
                        <div className="flex-1 text-left relative z-10">
                            <p className="text-white font-[1000] text-[13px] uppercase tracking-tight leading-tight mb-1">Trip Support desk</p>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider leading-none">24/7 Driver Help Center</p>
                        </div>
                        <ChevronRight size={14} className="text-white/40" />
                    </button>

                    <button
                        onClick={() => {
                            logout('consumer');
                            navigate('/login');
                        }}
                        className="w-full h-16 rounded-2xl bg-white border border-red-100 text-red-500 font-bold text-[13px] flex items-center justify-center gap-3 active:bg-red-50 transition-all border-dashed"
                    >
                        <LogOut size={18} />
                        Logout session
                    </button>

                    <p className="text-[10px] text-slate-300 font-bold text-center py-6 tracking-widest leading-none">Spare Driver Platform v2.9</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Profile;
