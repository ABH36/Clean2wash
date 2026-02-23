import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Bell,
    CheckCircle2,
    MessageSquare,
    Clock,
    AlertCircle,
    ChevronRight,
    Settings
} from 'lucide-react';

const StaffNotifications = () => {
    const navigate = useNavigate();

    const NOTIFICATIONS = [
        {
            type: 'job',
            icon: <MessageSquare size={18} />,
            title: 'New Assignment',
            desc: 'Job #TASK-002 assigned from Hub Manager.',
            time: '2 mins ago',
            read: false,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            type: 'success',
            icon: <CheckCircle2 size={18} />,
            title: 'Payment Confirmed',
            desc: 'System has processed payment for JOB-9921.',
            time: '1 hour ago',
            read: true,
            color: 'bg-green-50 text-green-600'
        },
        {
            type: 'alert',
            icon: <AlertCircle size={18} />,
            title: 'Shift Reminder',
            desc: 'Your afternoon shift starts at 02:00 PM today.',
            time: '3 hours ago',
            read: true,
            color: 'bg-amber-50 text-amber-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft size={20} className="text-content" />
                </button>
                <h1 className="text-lg font-black text-content italic uppercase">Alerts</h1>
                <button className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <Settings size={18} className="text-content-subtle" />
                </button>
            </header>

            <div className="px-5 pt-8 space-y-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest italic">Recent Activities</p>
                    <button className="text-[10px] font-black text-brand uppercase tracking-widest italic border-b border-brand/20">Mark all read</button>
                </div>

                {NOTIFICATIONS.map((notif, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-5 rounded-[2rem] border shadow-soft flex items-start gap-4 transition-all ${notif.read ? 'bg-white border-gray-50' : 'bg-brand/5 border-brand/10'
                            }`}
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                            {notif.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-black text-content italic leading-none">{notif.title}</h3>
                                {!notif.read && <div className="w-2 h-2 bg-brand rounded-full shadow-lg shadow-brand/40" />}
                            </div>
                            <p className="text-[10px] font-bold text-content-subtle leading-normal mb-2 uppercase tracking-tight">
                                {notif.desc}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-content-subtle uppercase italic">
                                <Clock size={10} /> {notif.time}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-12 px-10">
                <Bell size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-black text-content-subtle italic leading-tight">
                    Stay tuned! We'll notify you about new tasks and updates here.
                </p>
            </div>
        </div>
    );
};

export default StaffNotifications;
