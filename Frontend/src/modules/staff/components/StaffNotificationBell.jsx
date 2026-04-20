import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Check, Clock, Package,
    AlertCircle, ShoppingBag, Wallet, Trash2,
    Calendar, Truck, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { staffAPI } from '../../../utils/staffApi';
import { socketService } from '../../../utils/socket';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const StaffNotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isDarkMode } = useTheme();
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getNotifications();
            if (res.status === 'success') {
                setNotifications(res.data.notifications);
            }
        } catch (err) {
            console.error('Failed to load operational alerts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // 📡 Real-time Operational Alerts
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('new_staff_notification', (data) => {
                setNotifications(prev => [data, ...prev]);
                // 🔊 Pro-audio Chime for Dispatch
                try {
                    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    chime.volume = 0.5;
                    chime.play();
                } catch (e) {
                    console.log('Audio Blocked by Terminal Policy');
                }
                toast.success('🚨 New Protocol Dispatched');
            });
        }

        return () => {
            if (socket) socket.off('new_staff_notification');
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            const res = await staffAPI.markNotificationRead(id);
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (err) {
            console.error('Failed to sync alert status', err);
        }
    };

    const clearAll = async () => {
        try {
            await staffAPI.clearNotifications();
            setNotifications([]);
            toast.success('Terminal Logs Purged');
        } catch (err) {
            toast.error('Failed to purge logs');
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        switch (type) {
            case 'assignment': return <Truck size={18} className="text-brand" />;
            case 'payout': return <Wallet size={18} className="text-green-500" />;
            case 'alert': return <AlertCircle size={18} className="text-amber-500" />;
            case 'security': return <ShieldCheck size={18} className="text-purple-500" />;
            default: return <Bell size={18} className="text-brand" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                animate={{
                    scale: unreadCount > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                    repeat: unreadCount > 0 ? Infinity : 0,
                    duration: 2
                }}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode
                        ? (isOpen ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white')
                        : (isOpen ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 border border-white/5 text-content shadow-soft')
                    }`}
            >
                <Bell size={22} strokeWidth={2.5} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0, x: 5, y: -5 }}
                            animate={{ scale: 1, x: 0, y: 0 }}
                            exit={{ scale: 0, x: 5, y: -5 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[9px] font-black border-4 border-inherit rounded-full flex items-center justify-center shadow-lg z-20"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
                {/* 🌟 Luxury Outer Glow Pulse */}
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-2xl bg-brand/20 -z-10"
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className={`absolute right-0 mt-4 w-[340px] rounded-[2.5rem] shadow-2xl border backdrop-blur-3xl overflow-hidden z-[100] ${isDarkMode ? 'bg-[#1E293B]/95 border-white/10' : 'bg-white/95 border-white/5'
                            }`}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-inherit flex items-center justify-between">
                            <div>
                                <h3 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Terminal Alerts</h3>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Sync Node: Operational</p>
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-white/20 hover:text-white' : 'bg-white/[0.02] text-content-subtle hover:text-content'
                                        }`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-8 h-8 border-white/5 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand">Fetching Protocol Logs...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="p-2 space-y-1">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification._id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className={`p-4 rounded-3xl flex gap-4 transition-all relative group ${!notification.isRead
                                                    ? (isDarkMode ? 'bg-white/5' : 'bg-white/[0.02]/50')
                                                    : 'opacity-60 grayscale-[0.5]'
                                                }`}
                                            onClick={() => markAsRead(notification._id)}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/5 '
                                                }`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className={`text-xs font-black uppercase leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed line-clamp-2 ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock size={10} className="text-brand opacity-40" />
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center">
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 mx-auto border-white/5 border-dashed ${isDarkMode ? 'bg-white/5 border-white/10 text-white/10' : 'bg-white/[0.02] border-white/5 text-gray-200'}`}>
                                        <Bell size={28} />
                                    </div>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>All protocols synchronized.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-5 border-t border-inherit">
                                <button className={`w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-brand hover:text-white' : 'bg-white/[0.02] text-content-subtle hover:bg-brand hover:text-white'
                                    }`}>
                                    Operation Logs History
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffNotificationBell;
