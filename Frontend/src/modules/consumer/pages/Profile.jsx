import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Settings, LogOut, ChevronRight, CreditCard, MapPin,
    Bell, ShieldCheck, Smartphone, Zap, Wallet, History,
    HelpCircle, Share2, Award, Star, Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const { getUser, logout } = useAuth();
    const user = getUser('consumer') || { name: 'User' };

    const handleLogout = () => {
        logout('consumer');
        navigate('/login');
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-xl font-black tracking-tight text-content">My <span className="text-brand">Account</span></h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/notifications')} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-content-muted">
                            <Bell size={18} strokeWidth={2.5} />
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-content-muted">
                            <Settings size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* User row */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-brand p-0.5 shadow-md">
                            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                                <User size={28} className="text-brand" />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-accent-yellow p-1 rounded-lg shadow border border-white">
                            <Award size={12} fill="currentColor" strokeWidth={2} className="text-black" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-content leading-none mb-0.5">{user.name}</h2>
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-2">Hoora Elite Member</p>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            <Star size={10} className="text-yellow-500" fill="currentColor" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-content-muted">4.8 Rating</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 py-4 space-y-4 pb-24">

                {/* ── Wallet Banner ── */}
                <div className="bg-brand rounded-2xl p-5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Hoora Wallet</p>
                                <h3 className="text-3xl font-black tracking-tight leading-none text-white">₹1,240</h3>
                            </div>
                            <button onClick={() => navigate('/wallet')} className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                                <Wallet size={20} className="text-white" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20"><Zap size={12} className="text-yellow-300" fill="currentColor" /></div>
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20 text-white text-[9px] font-black">+7</div>
                            </div>
                            <button onClick={() => navigate('/wallet')} className="bg-white text-brand px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all">
                                Manage
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                </div>

                {/* ── Menu Sections ── */}
                <MenuSection title="Vehicle Ecosystem">
                    <MenuItem icon={<Zap />} label="My Bookings" sub="Active & Past Washes" count="3" onClick={() => navigate('/bookings')} />
                    <MenuItem icon={<Car />} label="My Vehicles" sub="Manage your garage" onClick={() => navigate('/vehicles')} />
                    <MenuItem icon={<MapPin />} label="Saved Addresses" sub="Home, Office, Other" onClick={() => navigate('/addresses')} />
                </MenuSection>

                <MenuSection title="Payments & Trust">
                    <MenuItem icon={<CreditCard />} label="Payment Methods" sub="Cards, UPI, Netbanking" onClick={() => navigate('/payments')} />
                    <MenuItem icon={<ShieldCheck />} label="Insurance Center" sub="Manage Vehicle Policies" onClick={() => navigate('/insurance')} />
                    <MenuItem icon={<History />} label="Transactions" sub="History & Statements" onClick={() => navigate('/wallet')} />
                </MenuSection>

                <MenuSection title="Support & Community">
                    <MenuItem icon={<HelpCircle />} label="Help & Support" sub="FAQ, Chat, Call" onClick={() => navigate('/help')} />
                    <MenuItem icon={<Share2 />} label="Refer & Earn" sub="Get ₹100 per referral" badge="NEW" onClick={() => navigate('/refer')} last />
                </MenuSection>

                {/* ── Footer ── */}
                <div className="text-center space-y-3 pt-2">
                    <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest">Hoora v4.2.0</p>
                    <button
                        onClick={() => {
                            if (window.confirm('Do you want to logout?')) {
                                handleLogout();
                            }
                        }}
                        className="flex items-center gap-2 bg-red-50 text-red-500 border border-red-100 px-6 py-3 rounded-xl mx-auto font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

const MenuSection = ({ title, children }) => (
    <section className="space-y-2">
        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">{title}</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
            {children}
        </div>
    </section>
);

const MenuItem = ({ icon, label, sub, onClick, count, badge, last }) => (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors group ${!last && 'border-b border-gray-50'}`}>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content-muted group-hover:bg-brand/10 group-hover:text-brand transition-all">
                {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
            </div>
            <div className="text-left">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-content tracking-tight group-hover:text-brand transition-colors">{label}</h3>
                    {count && <span className="bg-brand text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{count}</span>}
                    {badge && <span className="bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md">{badge}</span>}
                </div>
                <p className="text-[9px] font-bold text-content-subtle mt-0.5">{sub}</p>
            </div>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} className="text-gray-300 group-hover:text-brand transition-colors" />
    </motion.button>
);

export default Profile;
