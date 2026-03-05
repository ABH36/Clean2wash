import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Car, MapPin, Gift, ChevronRight,
    ArrowLeft, ShieldCheck, Heart, Settings,
    LogOut, MoreHorizontal, Wallet, Shield,
    Bell, CreditCard, HelpCircle, Activity,
    Clock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, getUser, bookings } = useAuth();
    const user = getUser('consumer');

    // Filter Instant Wash History (Last 3)
    const instantHistory = bookings
        .filter(b => b.type === 'instant')
        .slice(0, 3);

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
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                <User size={32} className="text-content-subtle" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                <ShieldCheck size={10} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-base font-[1000] text-content italic uppercase leading-none">{user?.name || 'Aryan Pathak'}</h2>
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">{user?.phone || '+91 98765 43210'}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-brand text-white text-[8px] font-black rounded uppercase tracking-tighter italic">Verified Plus</span>
                                <span className="text-[8px] font-bold text-content-subtle uppercase underline">Edit Profile</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── METRICS ── */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Washes', val: bookings.length || '0', icon: Car },
                            { label: 'Points', val: '2,450', icon: Wallet },
                            { label: 'Rating', val: '4.9', icon: Heart }
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
                                    <div key={b.id} className={`p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${i !== instantHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-black/[0.03] overflow-hidden">
                                                <img src={b.vehicleImg || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <h4 className="text-[12px] font-[1000] text-black uppercase tracking-tight">{b.serviceName}</h4>
                                                    <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Done</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{b.id}</p>
                                                    <div className="w-1 h-1 rounded-full bg-black/5" />
                                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{new Date(b.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[13px] font-[1000] text-black tracking-tight">{b.price}</p>
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
