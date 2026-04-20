import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Bell
} from 'lucide-react';
import StaffLayout from '../components/StaffLayout';
import { useTheme } from '../../../context/ThemeContext';

const StaffNotifications = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const NOTIFICATIONS = [
        {
            type: 'job',
            icon: <MessageSquare size={18} />,
            title: 'Critical Assignment',
            desc: 'New task #CW-TSK-402 pushed to your terminal. Report within 15 mins.',
            time: '2 mins ago',
            read: false,
            color: isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
        },
        {
            type: 'success',
            icon: <CheckCircle2 size={18} />,
            title: 'Protocol Verified',
            desc: 'Job #CW-JOB-9921 verification photos approved by Quality Control.',
            time: '1 hour ago',
            read: true,
            color: isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
        },
        {
            type: 'alert',
            icon: <AlertCircle size={18} />,
            title: 'Maintenance Alert',
            desc: 'System maintenance scheduled for 02:00 AM IST. Sync all logs.',
            time: '3 hours ago',
            read: true,
            color: isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
        }
    ];

    return (
        <StaffLayout title="Alert Stream" subtitle="Communication Node">
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Operational Feed</p>
                    <button className="text-[9px] font-black text-brand uppercase tracking-widest border-b border-brand/20 transition-all hover:border-brand">Mark read</button>
                </div>

                <div className="space-y-4">
                    {NOTIFICATIONS.map((notif, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-6 rounded-[2.5rem] border shadow-soft flex items-start gap-5 transition-all group ${notif.read
                                ? (isDarkMode ? 'bg-[#1E293B] border-white/5 hover:border-brand/20 text-white' : 'bg-white/5 border-white/5 hover:border-brand/20 text-content')
                                : (isDarkMode ? 'bg-brand/10 border-brand/20 text-white shadow-2xl shadow-black/50 shadow-brand/5' : 'bg-brand/5 border-brand/10 text-content')
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${notif.color}`}>
                                {notif.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className={`text-sm font-black leading-none uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>{notif.title}</h3>
                                    {!notif.read && <div className="w-2.5 h-2.5 bg-brand rounded-full shadow-lg shadow-brand/40 animate-pulse" />}
                                </div>
                                <p className={`text-[10px] font-bold leading-relaxed mb-3 uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                    {notif.desc}
                                </p>
                                <div className={`flex items-center gap-2 text-[9px] font-black uppercase opacity-60 ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                                    <Clock size={10} /> {notif.time}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center py-12 px-10">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/10'}`}>
                        <Bell size={32} className={isDarkMode ? 'text-white/10' : 'text-gray-200'} />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>
                        End of Alert Stream. <br />
                        Listening for new protocol packets...
                    </p>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffNotifications;
