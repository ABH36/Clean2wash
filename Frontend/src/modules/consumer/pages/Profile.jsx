import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    User, Car, MapPin, Gift, ChevronRight,
    ArrowLeft, ShieldCheck, Heart, Settings,
    LogOut, MoreHorizontal, Wallet, Shield,
    Bell, CreditCard, HelpCircle, Activity,
    Clock, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import apiClient from '../../../utils/api';
import PremiumBadge from '../components/membership/PremiumBadge';
import { Crown, Sparkles, Zap } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, getUser, bookings, stats, updateUser, isBlackPassMember } = useAuth();
    const user = getUser('consumer');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });
    const [saving, setSaving] = useState(false);

    // Filter Instant Wash History (Last 3)
    const instantHistory = (bookings || [])
        .filter(b => b.schedule?.type === 'instant' && b.status === 'completed')
        .slice(0, 3);

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const response = await apiClient.updateProfile({
                name: editData.name,
                email: editData.email
            });

            if (response.status === 'success') {
                updateUser('consumer', user.id, response.data.consumer);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const MENU_GROUPS = [
        {
            title: 'Activity & Rewards',
            items: [
                { label: 'My Bookings', icon: Car, path: '/bookings', color: 'blue' },
                { label: 'Wallet & Rewards', icon: Wallet, path: '/wallet', color: 'purple' },
                { label: 'Refer & Earn', icon: Gift, path: '/refer', color: 'brand' },
            ]
        },
        {
            title: 'Settings & Preferences',
            items: [
                { label: 'Saved Vehicles', icon: Car, path: '/vehicles', color: 'orange' },
                { label: 'Saved Addresses', icon: MapPin, path: '/addresses', color: 'green' },
                { label: 'Payment Methods', icon: CreditCard, path: '/payments', color: 'indigo' },
                { label: 'Notifications', icon: Bell, path: '/notifications', color: 'pink' },
            ]
        },
        {
            title: 'Safety ToolKit',
            items: [
                { label: 'Trusted Contacts', icon: ShieldCheck, path: '/safety/contacts', color: 'green' },
                { label: 'SOS Configuration', icon: Shield, path: '/safety/sos', color: 'red' },
                { label: 'Incident Log', icon: Activity, path: '/safety/incidents', color: 'blue' },
            ]
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', icon: HelpCircle, path: '/help', color: 'gray' },
                { label: 'Privacy & Security', icon: Shield, path: '/security', color: 'teal' },
            ]
        }
    ];

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-[#EFF6FF] text-[#3B82F6]',
            orange: 'bg-[#FFF7ED] text-[#F97316]',
            green: 'bg-[#F0FDF4] text-[#22C55E]',
            purple: 'bg-[#FAF5FF] text-[#A855F7]',
            brand: 'bg-brand/10 text-brand',
            indigo: 'bg-[#EEF2FF] text-[#6366F1]',
            pink: 'bg-[#FDF2F8] text-[#EC4899]',
            teal: 'bg-[#F0FDFA] text-[#14B8A6]',
            gray: 'bg-[#F9FAFB] text-[#6B7280]',
        };
        return classes[color] || classes.gray;
    };

    return (
        <MobileLayout>
            <div className="bg-[#FAFAFA] min-h-screen pb-24">
                {/* Edit Modal */}
                <AnimatePresence>
                    {isEditing && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsEditing(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] z-[1001] p-6 pb-12 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-[1000] text-content italic uppercase tracking-tight">Edit Profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-content">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-brand transition-all outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-content-subtle uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-brand transition-all outline-none"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="w-full h-14 bg-brand text-white rounded-2xl font-[1000] text-sm uppercase tracking-widest italic flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Save Changes</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ── HEADER ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-5 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ArrowLeft size={20} className="text-content" />
                        </button>
                        <h1 className="text-base font-[1000] text-content uppercase tracking-tight italic">Account</h1>
                    </div>
                    <button className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <Settings size={18} className="text-content-subtle" />
                    </button>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── PROFILE CARD ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden"
                    >
                        {isBlackPassMember && (
                            <div className="absolute top-0 right-0 w-32 h-full bg-brand/5 skew-x-[-20deg] pointer-events-none" />
                        )}
                        <div className="relative">
                            <div className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                {user?.profile?.avatar ? (
                                    <img src={user.profile.avatar} className="w-full h-full object-cover" alt={user.name} />
                                ) : (
                                    <User size={32} className="text-content-subtle" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                <ShieldCheck size={10} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-[1000] text-content italic uppercase leading-none">{user?.name || 'Aryan Pathak'}</h2>
                                {isBlackPassMember && <PremiumBadge showText={false} size="sm" />}
                            </div>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">{user?.phone || '+91 98765 43210'}</p>
                            <div className="mt-2 flex items-center gap-2">
                                 <span className={`px-2 py-1 ${isBlackPassMember ? 'bg-gradient-to-r from-brand to-amber-400 text-black shadow-lg shadow-brand/20' : 'bg-brand text-white'} text-[9px] font-black rounded-lg uppercase tracking-tighter italic flex items-center gap-1.5 border border-white/20 transition-all hover:scale-105 active:scale-95`}>
                                    {isBlackPassMember ? <><Crown size={10} fill="currentColor" /> Black Member Elite</> : 'Verified Plus'}
                                </span>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[8px] font-bold text-content-subtle uppercase underline"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── METRICS ── */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Washes', val: stats?.completed || stats?.totalBookings || bookings.length || '0', icon: Car },
                            { label: 'Upcoming', val: stats?.upcomingBookings || '0', icon: Clock },
                            { label: 'Points', val: stats?.walletBalance || '0', icon: Wallet }
                        ].map((m, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-50 p-3 flex flex-col items-center justify-center gap-1">
                                <span className="text-xs font-[1000] text-content italic">{m.val}</span>
                                <span className="text-[8px] font-black text-content-subtle uppercase tracking-widest">{m.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── RECENT INSTANT HISTORY ── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em]">Recent Instant History</h3>
                            {instantHistory.length > 0 && (
                                <button onClick={() => navigate('/bookings')} className="text-[8px] font-black text-brand uppercase tracking-widest border-b border-brand pb-0.5">View All</button>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                            {instantHistory.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50/30">
                                    <Clock size={20} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">No Instant History Yet</p>
                                </div>
                            ) : (
                                instantHistory.map((b, i) => (
                                    <div key={b._id} className={`p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${i !== instantHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-black/[0.03] overflow-hidden">
                                                <img src={b.vehicle?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <h4 className="text-[12px] font-[1000] text-black uppercase tracking-tight">{b.service?.name}</h4>
                                                    <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Done</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{b.bookingId}</p>
                                                    <div className="w-1 h-1 rounded-full bg-black/5" />
                                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[13px] font-[1000] text-black tracking-tight">₹{b.pricing?.totalAmount}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── MENU GROUPS ── */}
                    <div className="space-y-6">
                        {MENU_GROUPS.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-2.5">
                                <h3 className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] ml-1">{group.title}</h3>
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                    {group.items.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => navigate(item.path)}
                                            className={`w-full p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${i !== group.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getColorClass(item.color)}`}>
                                                    <item.icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[11px] font-[1000] text-content uppercase tracking-tight">{item.label}</span>
                                            </div>
                                            <ChevronRight size={14} className="text-content-subtle opacity-30" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── PREMIUM BANNER ── */}
                    {isBlackPassMember ? (
                        <div className="relative bg-[#0A0A0A] rounded-2xl p-6 overflow-hidden group border border-brand/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-48 h-full bg-brand/[0.07] skew-x-[-25deg] -mr-16" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center bg-brand/10 w-fit px-2 py-0.5 rounded-full border border-brand/20 mb-3">
                                    <span className="text-[7.5px] font-black text-brand uppercase tracking-[0.4em] italic leading-none">Subscription Active</span>
                                </div>
                                <h3 className="text-white text-2xl font-[1000] uppercase tracking-tight italic flex items-center gap-3">
                                    <Crown className="text-brand drop-shadow-[0_0_8px_rgba(243,189,144,0.5)]" size={24} fill="currentColor" />
                                    Black Pass Elite
                                </h3>
                                <p className="text-brand/50 text-[10px] font-black uppercase tracking-widest mt-1 mb-6">Unlimited Benefits Activated</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center">
                                            <Sparkles size={14} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-white leading-none">30% OFF</p>
                                            <p className="text-[7px] font-bold text-white/30 uppercase mt-0.5">Applied on All</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center">
                                            <Zap size={14} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-white leading-none">PRIORITY</p>
                                            <p className="text-[7px] font-bold text-white/30 uppercase mt-0.5">Instant Access</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative bg-content rounded-xl p-4 overflow-hidden group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="relative z-10 space-y-1">
                                <span className="text-[8px] font-black text-brand uppercase tracking-widest italic">Exclusive Offer</span>
                                <h3 className="text-white text-base font-[1000] uppercase tracking-tight italic">Upgrade to Black Pass</h3>
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">Unlock 30% discount on all services</p>
                                <button className="mt-3 bg-white text-content px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-transform active:scale-95">Upgrade Now</button>
                            </div>
                            <Crown size={80} className="absolute -right-4 -bottom-4 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
                        </div>
                    )}

                    <div className="relative bg-content rounded-xl p-4 overflow-hidden group cursor-pointer">
                        <div className="relative z-10 space-y-1">
                            <span className="text-[8px] font-black text-brand uppercase tracking-widest italic">Opportunity</span>
                            <h3 className="text-white text-base font-[1000] uppercase tracking-tight italic">Become a Captain</h3>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">Earn ₹30k+ per month</p>
                            <button className="mt-3 bg-white text-content px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-transform active:scale-95">Apply Now</button>
                        </div>
                        <ShieldCheck size={80} className="absolute -right-4 -bottom-4 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* ── LOGOUT ── */}
                    <button
                        onClick={() => { logout('consumer'); navigate('/login'); }}
                        className="w-full py-4 rounded-xl bg-gray-50 border border-gray-200 text-red-500 font-[1000] text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:bg-red-50 active:border-red-100 transition-all border-dashed"
                    >
                        <LogOut size={14} strokeWidth={3} />
                        Logout Session
                    </button>

                    <div className="text-center py-6">
                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-30 italic">clean2wash Platform v2.8.5 • Build 2026-02</p>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Profile;
