import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';

import { useTheme } from '../../../context/ThemeContext';

const TABS = ['Today', 'Week', 'Month'];

const CaptainEarnings = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { bookings, getUser } = useAuth();
    const user = getUser('captain') || { id: 'CPT-DEFAULT' };
    const [tab, setTab] = useState('Week');

    const myJobs = bookings.filter(b => b.captainId === user.id && b.status === 'completed');

    const stats = {
        Today: { earned: '₹0', jobs: 0, rating: '5.0', hours: '0', target: '₹2,000' },
        Week: { earned: '₹0', jobs: 0, rating: '5.0', hours: '0', target: '₹12,000' },
        Month: { earned: '₹0', jobs: 0, rating: '5.0', hours: '0', target: '₹50,000' },
    };

    const total = myJobs.reduce((acc, b) => {
        const val = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
        return acc + (isNaN(val) ? 0 : val);
    }, 0);

    stats.Week.earned = `₹${total.toLocaleString()}`;
    stats.Week.jobs = myJobs.length;
    stats.Week.hours = (myJobs.length * 0.8).toFixed(1);

    stats.Today.earned = `₹${Math.round(total * 0.15).toLocaleString()}`;
    stats.Today.jobs = Math.round(myJobs.length * 0.15);
    stats.Today.hours = (stats.Today.jobs * 0.8).toFixed(1);

    stats.Month.earned = `₹${Math.round(total * 4.2).toLocaleString()}`;
    stats.Month.jobs = Math.round(myJobs.length * 4.2);
    stats.Month.hours = (stats.Month.jobs * 0.8).toFixed(1);

    const activeD = stats[tab];

    return (
        <CaptainLayout>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'} pb-32`}>
                <header className="px-6 pt-16 pb-6">
                    <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-content'}`}>
                        <ChevronLeft size={16} />
                    </button>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Earnings</h1>

                    <div className="flex gap-8 mt-10 overflow-x-auto no-scrollbar">
                        {TABS.map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`pb-2 text-sm font-bold whitespace-nowrap transition-all relative ${tab === t ? 'text-brand' : (isDarkMode ? 'text-white/20' : 'text-content-subtle')}`}>
                                {t}
                                {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="px-6 space-y-12">
                    <section>
                        <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Available Balance</p>
                        <h2 className={`text-6xl font-light tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>{activeD.earned}</h2>
                    </section>

                    <div className={`flex justify-between py-10 border-y ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        {[
                            { label: 'Jobs', value: activeD.jobs },
                            { label: 'Rating', value: activeD.rating },
                            { label: 'Hours', value: activeD.hours },
                        ].map(s => (
                            <div key={s.label}>
                                <p className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{s.label}</p>
                                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-content'}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <section>
                        <h3 className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-8 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Recent Activity</h3>
                        <div className="space-y-8">
                            {myJobs.length > 0 ? myJobs.slice(0, 3).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center">
                                    <div>
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-content'}`}>{tx.serviceName}</p>
                                        <p className={`text-[10px] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{tx.userName} · Recently</p>
                                    </div>
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-content'}`}>+{tx.price}</p>
                                </div>
                            )) : (
                                <p className="text-xs opacity-30 italic">No recent activity</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="fixed bottom-10 left-6 right-6">
                    <button className="w-full h-14 bg-brand text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all">
                        Withdraw Payout
                    </button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainEarnings;
