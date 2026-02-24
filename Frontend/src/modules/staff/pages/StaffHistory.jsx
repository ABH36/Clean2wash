import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    ChevronRight,
    Package,
    Truck,
    Navigation,
    User,
    LogOut,
    Search
} from 'lucide-react';

import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const StaffHistory = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { bookings, getUser } = useAuth();
    const user = getUser('staff') || { id: 'STF-DEFAULT' };

    // Filter completed jobs for this staff
    const historyJobs = bookings.filter(b =>
        (b.pickupStaffId === user.id || b.deliveryStaffId === user.id) &&
        b.status === 'completed'
    );

    // If no real history, show some mock ones for "WOW" effect
    const MOCK_HISTORY = [
        { id: 'CW-JOB-9921', date: '22 Feb 2026', customer: 'Aryan Pathak', type: 'Pickup', status: 'Completed', vehicle: 'Fortuner' },
        { id: 'CW-JOB-9920', date: '21 Feb 2026', customer: 'Rahul Verma', type: 'Drop', status: 'Completed', vehicle: 'Creta' },
    ];

    const displayJobs = historyJobs.length > 0 ? historyJobs.map(b => ({
        id: b.id,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        customer: b.userName,
        type: b.pickupStaffId === user.id ? 'Pickup' : 'Delivery',
        vehicle: b.vehicle,
        status: 'Completed'
    })) : MOCK_HISTORY;

    return (
        <StaffLayout title="Job Logs" subtitle="Archive Node">
            <div className="space-y-6">
                {/* Search / Filter bar for WOW */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search size={18} className={`${isDarkMode ? 'text-white/20' : 'text-content-subtle'} group-focus-within:text-brand transition-colors`} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Job ID or Vehicle..."
                        className={`w-full h-16 border rounded-[2rem] pl-16 pr-6 text-sm font-bold outline-none transition-all shadow-soft focus:border-brand/40 ${isDarkMode ? 'bg-[#1E293B] border-white/5 text-white placeholder:text-white/20' : 'bg-white border-gray-100 text-content placeholder:text-content-subtle'}`}
                    />
                </div>

                <div className="space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Recent Success Logs</p>
                    {displayJobs.map((job) => (
                        <motion.div
                            key={job.id}
                            whileTap={{ scale: 0.98 }}
                            className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-gray-100 shadow-soft'} p-6 rounded-[2.5rem] border flex items-center justify-between group hover:border-brand/20 transition-all duration-500`}
                            onClick={() => navigate(`/staff/task/${job.id}`)}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-brand group-hover:text-white ${job.type === 'Pickup'
                                    ? (isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
                                    : (isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')
                                    }`}>
                                    {job.type === 'Pickup' ? <Truck size={24} /> : <Package size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-black italic uppercase text-base tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{job.id}</h4>
                                        <div className="w-1 h-1 bg-green-500 rounded-full" />
                                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Pushed</span>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest italic ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{job.date} · {job.vehicle}</p>
                                </div>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/10 group-hover:text-brand group-hover:bg-brand/5' : 'bg-gray-50 text-gray-200 group-hover:text-brand group-hover:bg-brand/5'}`}>
                                <ChevronRight size={18} strokeWidth={3} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {displayJobs.length === 0 && (
                    <div className={`text-center py-20 opacity-30 ${isDarkMode ? 'text-white' : ''}`}>
                        <Calendar size={48} className="mx-auto mb-4" />
                        <p className="font-black text-sm uppercase tracking-widest italic">No archived logs found</p>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
};

export default StaffHistory;
