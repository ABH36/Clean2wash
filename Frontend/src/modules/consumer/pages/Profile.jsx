import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    User, Car, MapPin, Gift, ChevronRight,
    ArrowLeft, ShieldCheck, Heart, Settings,
    LogOut, MoreHorizontal, Wallet, Shield,
    Bell, CreditCard, HelpCircle, Activity,
    Clock, X, Package, Crown, Sparkles, Zap, Smartphone,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import apiClient from '../../../utils/api';
import PremiumBadge from '../components/membership/PremiumBadge';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, getUser, bookings, stats, updateUser, isGoldPassMember } = useAuth();
    const user = getUser('consumer');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });
    const [saving, setSaving] = useState(false);

    const instantHistory = (bookings || [])
        .filter(b => b.schedule?.type === 'instant' && b.status === 'completed')
        .slice(0, 3);

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const response = await apiClient.updateProfile({ name: editData.name, email: editData.email });
            if (response.status === 'success') {
                updateUser('consumer', user.id, response.data.consumer);
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 🚨 SPARE DRIVER ONLY MODE - FEATURE FLAGS
    // ═══════════════════════════════════════════════════════════════
    const SHOW_ESHOP = false;           // Hide e-shop/orders
    // ═══════════════════════════════════════════════════════════════

    const MENU_GROUPS = [
        {
            title: 'Activity and rewards',
            items: [
                { label: 'My bookings', icon: Car, path: '/bookings', color: 'blue' },
                ...(SHOW_ESHOP ? [{ label: 'My orders', icon: Package, path: '/orders', color: 'orange' }] : []),
                { label: 'Wallet and rewards', icon: Wallet, path: '/wallet', color: 'purple' },
                { label: 'Refer and earn', icon: Gift, path: '/refer', color: 'brand' },
            ]
        },
        {
            title: 'Settings and preferences',
            items: [
                { label: 'Saved vehicles', icon: Car, path: '/vehicles', color: 'orange' },
                { label: 'Saved addresses', icon: MapPin, path: '/addresses', color: 'green' },
                { label: 'Payment methods', icon: CreditCard, path: '/payments', color: 'indigo' },
                { label: 'Notifications', icon: Bell, path: '/notifications', color: 'pink' },
            ]
        },
        {
            title: 'Safety toolkit',
            items: [
                { label: 'Trusted contacts', icon: ShieldCheck, path: '/safety/contacts', color: 'green' },
                { label: 'SOS configuration', icon: Shield, path: '/safety/sos', color: 'red' },
                { label: 'Incident log', icon: Activity, path: '/safety/incidents', color: 'blue' },
            ]
        },
        {
            title: 'Support',
            items: [
                { label: 'Help center', icon: HelpCircle, path: '/help', color: 'gray' },
            ]
        }
    ];

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-blue-50 text-blue-500',
            orange: 'bg-orange-50 text-orange-500',
            green: 'bg-emerald-50 text-emerald-500',
            purple: 'bg-purple-50 text-purple-500',
            brand: 'bg-brand/10 text-brand',
            indigo: 'bg-indigo-50 text-indigo-500',
            pink: 'bg-pink-50 text-pink-500',
            teal: 'bg-teal-50 text-teal-500',
            gray: 'bg-slate-50 text-slate-500',
            red: 'bg-red-50 text-red-500',
        };
        return classes[color] || classes.gray;
    };

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen pb-32">
                {/* ── Edit Modal ── */}
                <AnimatePresence>
                    {isEditing && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000]" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] z-[1001] p-8 pb-12 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Edit profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Full name</p>
                                        <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 outline-none focus:border-brand/40 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 ml-1">Email address</p>
                                        <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-900 outline-none focus:border-brand/40 transition-all" />
                                    </div>
                                    <button onClick={handleUpdateProfile} disabled={saving} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30">
                                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ── Compact Header ── */}
                <header className="sticky top-0 z-[60] bg-white px-5 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ArrowLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Account</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Profile management</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-5">
                    {/* ── Profile Summary Card ── */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                        {isGoldPassMember && <div className="absolute top-0 right-0 w-24 h-full bg-brand/5 -skew-x-12" />}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                {user?.profile?.avatar ? ( <img src={user.profile.avatar} className="w-full h-full object-cover" alt="" /> ) : ( <User size={32} className="text-slate-300" /> )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-sm">
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-[17px] font-bold text-slate-900 truncate">{user?.name || 'User'}</h2>
                                {isGoldPassMember && <PremiumBadge showText={false} size="sm" />}
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold tracking-tight">{user?.phone || 'Linked phone'}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className={`h-7 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${isGoldPassMember ? 'bg-slate-900 text-brand border border-white/10' : 'bg-brand/10 text-brand'}`}>
                                    {isGoldPassMember ? <><Crown size={12} fill="currentColor" /> Gold Pass</> : <><Sparkles size={12} /> Verified</>}
                                </span>
                                <button onClick={() => setIsEditing(true)} className="text-[11px] font-bold text-slate-300 underline underline-offset-4 decoration-slate-200">Edit</button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Loyalty Stats ── */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-gray-50 shadow-sm">
                            <span className="text-[16px] font-bold text-slate-900">{user?.loyalty?.completedBookingsCount || '0'}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Washes</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-amber-100 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 h-1 bg-amber-400/20 w-full" />
                            <div className="absolute top-0 left-0 h-1 bg-amber-400" style={{ width: `${((user?.loyalty?.completedBookingsCount || 0) % 10) * 10}%` }} />
                            <span className="text-[16px] font-bold text-amber-500">{(user?.loyalty?.completedBookingsCount || 0) % 10}/10</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">To Free</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-gray-50 shadow-sm">
                            <span className="text-[16px] font-bold text-emerald-500">{user?.loyalty?.rewardsAvailable || '0'}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Rewards</span>
                        </div>
                    </div>

                    {/* ── Mini History ── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[13px] font-bold text-slate-900">Recent history</p>
                            {instantHistory.length > 0 && (
                                <button onClick={() => navigate('/bookings')} className="text-[11px] font-bold text-brand">View all</button>
                            )}
                        </div>
                        <div className="bg-white rounded-[1.8rem] border border-gray-100 overflow-hidden shadow-sm">
                            {instantHistory.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Clock size={24} className="text-slate-100 mx-auto mb-3" />
                                    <p className="text-[12px] font-bold text-slate-200 uppercase tracking-widest">History empty</p>
                                </div>
                            ) : (
                                instantHistory.map((b, i) => (
                                    <div key={b._id} className={`p-4 flex items-center justify-between ${i !== instantHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                                                <img src={b.vehicle?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4 className="text-[13px] font-bold text-slate-900 leading-none">{b.service?.name}</h4>
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                </div>
                                                <p className="text-[10px] text-slate-300 font-medium">{new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Completed</p>
                                            </div>
                                        </div>
                                        <p className="text-[15px] font-bold text-slate-900 tabular-nums">₹{b.pricing?.totalAmount}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Menu List ── */}
                    <div className="space-y-6">
                        {MENU_GROUPS.map((group, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="text-[13px] font-bold text-slate-400 px-1">{group.title}</h3>
                                <div className="bg-white rounded-[1.8rem] border border-gray-100 overflow-hidden shadow-sm">
                                    {group.items.map((item, i) => (
                                        <button key={i} onClick={() => navigate(item.path)} className={`w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors ${i !== group.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(item.color)} border border-white/50`}>
                                                    <item.icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[14px] font-bold text-slate-900 leading-none">{item.label}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-200" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Action Banners ── */}
                    <div className="space-y-4">
                        {isGoldPassMember ? (
                            <div className="relative bg-slate-900 rounded-[2rem] p-6 overflow-hidden border border-white/5">
                                <div className="absolute top-0 right-0 w-32 h-full bg-brand/5 -skew-x-12" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Membership active</span>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">Gold pass <Crown size={20} className="text-brand" fill="currentColor" /></h3>
                                        <p className="text-[11px] text-white/40 leading-relaxed max-w-[180px]">Unlimited 30% discount and priority booking activated.</p>
                                    </div>
                                    <Sparkles size={40} className="text-brand/20" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900 rounded-[2rem] p-6 relative overflow-hidden group border border-brand/20" onClick={() => navigate('/')}>
                                <div className="relative z-10 space-y-3">
                                    <h3 className="text-xl font-bold text-white leading-none">Unlock Gold pass</h3>
                                    <p className="text-[11px] text-white/40 max-w-[200px]">Get constant 30% discount on all car services instantly.</p>
                                    <button className="h-10 px-6 bg-white text-slate-900 rounded-xl font-bold text-[11px] active:scale-95 transition-all">Join membership</button>
                                </div>
                                <Crown size={80} className="absolute -right-4 -bottom-4 text-white/5 -rotate-12" />
                            </div>
                        )}

                        <div className="bg-brand rounded-[2rem] p-6 relative overflow-hidden border border-white/10" onClick={() => window.open('/apply-driver', '_blank')}>
                            <div className="relative z-10 space-y-3">
                                <h3 className="text-xl font-bold text-slate-900 leading-none">Become a captain</h3>
                                <p className="text-[11px] text-slate-900/60 max-w-[200px]">Join our elite fleet and earn up to ₹35,000+ monthly.</p>
                                <button className="h-10 px-6 bg-slate-900 text-white rounded-xl font-bold text-[11px] active:scale-95 transition-all">Apply now</button>
                            </div>
                            <ShieldCheck size={80} className="absolute -right-4 -bottom-4 text-slate-900/10 -rotate-12" />
                        </div>
                    </div>

                    {/* ── Logout ── */}
                    <button onClick={() => { logout('consumer'); navigate('/login'); }} className="w-full h-16 rounded-2xl bg-white border border-red-100 text-red-500 font-bold text-[13px] flex items-center justify-center gap-3 active:bg-red-50 transition-all border-dashed">
                        <LogOut size={18} /> Logout session
                    </button>

                    <p className="text-[10px] text-slate-300 font-bold text-center py-6 tracking-widest leading-none">Spare Driver Platform v2.85</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Profile;
