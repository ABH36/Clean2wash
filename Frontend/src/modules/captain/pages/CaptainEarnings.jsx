import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CaptainLayout from '../components/CaptainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useCaptain } from '../../../context/CaptainContext';

import { useTheme } from '../../../context/ThemeContext';

const TABS = ['Today', 'Week', 'Month'];

const CaptainEarnings = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { captainJobs, captainEarnings, captainEarningsLoading, withdrawEarnings } = useCaptain();
    const [tab, setTab] = useState('Week');

    const balance = captainEarnings.balance || 0;

    const handleWithdraw = async () => {
        if (balance <= 0) return toast.error('No balance to withdraw');
        try {
            const result = await withdrawEarnings(balance);
            if (result.success) {
                toast.success('Withdrawal request sent!');
            } else {
                toast.error(result.error || 'Withdrawal failed');
            }
        } catch (error) {
            toast.error('Withdrawal failed');
        }
    };

    const myJobs = captainJobs.filter(job => job.status === 'completed');

    // Use backend earnings data if available
    const today = captainEarnings.today || { earned: 0, jobs: 0 };
    const week = captainEarnings.week || { earned: 0, jobs: 0 };
    const month = captainEarnings.month || { earned: 0, jobs: 0 };

    const stats = {
        Today: { earned: `₹${today.earned || 0}`, jobs: today.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((today.jobs || 0) * 0.8).toFixed(1) },
        Week: { earned: `₹${week.earned || 0}`, jobs: week.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((week.jobs || 0) * 0.8).toFixed(1) },
        Month: { earned: `₹${month.earned || 0}`, jobs: month.jobs || 0, rating: (captainEarnings.rating || 5.0).toFixed(1), hours: ((month.jobs || 0) * 0.8).toFixed(1) },
    };

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
                        <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Current Balance</p>
                        <h2 className={`text-6xl font-light tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>₹{balance.toLocaleString()}</h2>
                        <p className={`text-[10px] mt-2 font-bold ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{tab} Earnings: {activeD.earned}</p>
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
                    <button 
                        onClick={handleWithdraw}
                        disabled={captainEarningsLoading || balance <= 0}
                        className={`w-full h-14 bg-brand text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale`}>
                        {captainEarningsLoading ? 'Processing...' : 'Withdraw Payout'}
                    </button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainEarnings;
