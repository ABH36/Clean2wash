import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Bell, Star, Zap, Navigation,
    Shield, CheckCircle2, Trash2, Clock, Info, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaptainLayout from '../components/CaptainLayout';
import { useTheme } from '../../../context/ThemeContext';
import { captainAPI } from '../../../utils/captainApi';
import { toast } from 'react-hot-toast';

const CaptainNotifications = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await captainAPI.getNotifications();
            if (res.status === 'success') {
                setNotifications(res.notifications || []);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
            toast.error("Cloud sync failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await captainAPI.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const clearAll = async () => {
        try {
            await captainAPI.clearNotifications();
            setNotifications([]);
            toast.success("Notifications cleared");
        } catch (err) {
            console.error("Failed to clear notifications", err);
            toast.error("Action failed");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return Zap;
            case 'payment': return Star;
            case 'verification': return Shield;
            case 'system': return Info;
            default: return Bell;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'booking': return 'text-brand';
            case 'payment': return 'text-amber-500';
            case 'verification': return 'text-green-500';
            case 'system': return 'text-blue-500';
            default: return isDarkMode ? 'text-white' : 'text-content';
        }
    };

    const getBg = (type) => {
        switch (type) {
            case 'booking': return isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10';
            case 'payment': return isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100';
            case 'verification': return isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100';
            case 'system': return isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100';
            default: return isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000 / 60);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <CaptainLayout hideNav>
            <div className={`min-h-[100dvh] pb-24 transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                {/* Header */}
                <header className={`${isDarkMode ? 'bg-[#1E293B]/70 border-white/5' : 'bg-white/70 border-gray-100'} backdrop-blur-xl px-4 pt-10 pb-4 border-b sticky top-0 z-40 relative overflow-hidden`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-content hover:bg-gray-100'}`}>
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className={`text-xl font-black tracking-tight leading-none uppercase ${isDarkMode ? 'text-white' : 'text-content'}`}>Notifications</h1>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>Command Intelligence</p>
                            </div>
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white'}`}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Notifications List */}
                <div className="px-4 py-6 space-y-4">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-24 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-6 border-4 border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                <Clock size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest">No Active Alerts</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((notif, index) => {
                                const Icon = getIcon(notif.type);
                                return (
                                    <motion.div
                                        key={notif._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => !notif.isRead && markAsRead(notif._id)}
                                        className={`relative p-4 rounded-3xl border transition-all duration-300 cursor-pointer ${isDarkMode ? 'bg-[#1E293B] border-white/10 shadow-2xl shadow-black/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} ${notif.isRead ? 'opacity-60 grayscale-[0.5]' : 'scale-[1.02] border-brand/30 shadow-brand/10'}`}
                                    >
                                        {!notif.isRead && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand shadow-lg shadow-brand/50 border-2 border-white dark:border-[#1E293B]" />
                                        )}
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${getBg(notif.type)}`}>
                                                <Icon size={20} className={getColor(notif.type)} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className={`font-black text-sm tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-content'} ${!notif.isRead ? 'text-brand' : ''}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className={`text-[8px] font-bold whitespace-nowrap bg-gray-500/10 px-2 py-0.5 rounded-full ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                                                        {formatTime(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-[11px] font-bold leading-relaxed pr-2 ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainNotifications;
