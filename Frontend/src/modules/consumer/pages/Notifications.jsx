import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Zap,
    Gift,
    ShieldCheck,
    Bell,
    RefreshCw,
    CreditCard,
    Trash2,
    Calendar,
    Wallet,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { notificationAPI } from '../../../utils/api';
import { socketService } from '../../../utils/socket';

const Notifications = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotifications();

        if (user?.id) {
            socketService.connect();
            socketService.joinUserRoom(user.id);

            socketService.on('new_notification', (data) => {
                const newNotif = {
                    ...data.notification,
                    id: data.notification.id || data.notification._id,
                    isNew: true,
                    desc: data.notification.message,
                    time: 'Just now'
                };
                setNotifications(prev => [newNotif, ...prev]);
            });
        }

        return () => {
            socketService.off('new_notification');
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications();
            if (response.status === 'success' && response.data.notifications) {
                const mapped = response.data.notifications.map(n => ({
                    ...n,
                    id: n._id,
                    isNew: !n.isRead,
                    desc: n.message,
                    time: formatTime(n.createdAt)
                }));
                setNotifications(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMins / 60);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true, isNew: false } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true, isNew: false }))
            );
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;

        try {
            setLoading(true);
            await notificationAPI.clearAll();
            setNotifications([]);
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notif) => {
        // Mark as read first
        if (!notif.isRead) {
            handleMarkAsRead(notif.id);
        }

        // Navigate based on type
        const { type, metaData } = notif;

        switch (type) {
            case 'booking':
                if (metaData?.bookingId) {
                    navigate(`/booking/${metaData.bookingId}`);
                } else {
                    navigate('/bookings');
                }
                break;
            case 'payment':
            case 'wallet':
                navigate('/wallet');
                break;
            case 'promotion':
                navigate('/refer');
                break;
            case 'service':
                navigate('/services');
                break;
            default:
                // No navigation for system alerts unless data provides URL
                if (notif.actionUrl) {
                    navigate(notif.actionUrl);
                }
                break;
        }
    };

    const newN = notifications.filter(n => n.isNew);
    const oldN = notifications.filter(n => !n.isNew);

    return (
        <MobileLayout>
            {/* ── Premium Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-content leading-none">Activity</h1>
                        <p className="text-[10px] text-brand font-black uppercase tracking-widest mt-1">
                            {newN.length > 0 ? `${newN.length} Unread Alerts` : 'System up to date'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={fetchNotifications}
                        className="p-2 text-gray-400 hover:text-brand transition-colors active:rotate-180 duration-500"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-4 pb-24 pt-4 min-h-[70vh]">
                <AnimatePresence mode="wait">
                    {loading && notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-content-subtle">Refreshing Inbox...</p>
                        </motion.div>
                    ) : notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6 relative">
                                <Bell size={40} className="text-gray-200" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-brand/10 rounded-[40px]"
                                />
                            </div>
                            <h2 className="text-lg font-black text-content tracking-tight">All Caught Up!</h2>
                            <p className="text-xs font-bold text-content-subtle max-w-[200px] mt-2 leading-relaxed">
                                No new notifications at the moment. We'll alert you for your next wash!
                            </p>
                            <button
                                onClick={() => navigate('/services')}
                                className="mt-8 px-8 py-3 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-transform flex items-center gap-2"
                            >
                                Book a Service <ArrowRight size={14} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-8">
                            {newN.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                            <p className="text-[10px] font-black text-content uppercase tracking-widest">New Priority</p>
                                        </div>
                                        <button onClick={handleMarkAllAsRead} className="text-[10px] font-black text-brand tracking-tight">
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {newN.map((n, i) => (
                                            <NotifCard
                                                key={n.id}
                                                notif={n}
                                                delay={i * 0.1}
                                                onClick={() => handleNotificationClick(n)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {oldN.length > 0 && (
                                <section className="space-y-3">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">History</p>
                                    <div className="space-y-3">
                                        {oldN.map((n, i) => (
                                            <NotifCard
                                                key={n.id}
                                                notif={n}
                                                delay={i * 0.05}
                                                onClick={() => handleNotificationClick(n)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

const getIconForType = (type) => {
    switch (type) {
        case 'booking': return { icon: <Calendar size={20} className="text-violet-600" />, bg: 'bg-violet-50', color: 'text-violet-600' };
        case 'payment': return { icon: <Wallet size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', color: 'text-emerald-600' };
        case 'promotion': return { icon: <Gift size={20} className="text-rose-500" />, bg: 'bg-rose-50', color: 'text-rose-500' };
        case 'service': return { icon: <Sparkles size={20} className="text-brand" />, bg: 'bg-brand/10', color: 'text-brand' };
        case 'vehicle': return { icon: <ShieldCheck size={20} className="text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-600' };
        default: return { icon: <Bell size={20} className="text-gray-500" />, bg: 'bg-gray-50', color: 'text-gray-500' };
    }
};

const NotifCard = ({ notif: n, delay, onClick }) => {
    const { icon, bg, color } = getIconForType(n.type);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.4 }}
            onClick={onClick}
            className={`group relative flex items-start gap-4 p-4 rounded-3xl border transition-all active:scale-[0.98] ${n.isNew
                    ? 'bg-white border-brand/20 shadow-lg shadow-brand/5 ring-1 ring-brand/5'
                    : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200'
                }`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg} shadow-inner`}>
                {icon}
            </div>

            <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-black text-sm tracking-tight leading-none ${n.isNew ? 'text-content' : 'text-content-subtle'}`}>
                        {n.title}
                    </h3>
                    <span className="text-[8px] font-black text-content-subtle/40 uppercase tracking-widest whitespace-nowrap">
                        {n.time}
                    </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${n.isNew ? 'text-content-subtle font-bold' : 'text-content-subtle/70 font-medium'}`}>
                    {n.desc}
                </p>

                {n.isNew && (
                    <div className="mt-3 flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${bg} ${color}`}>
                            Tap to view
                        </span>
                        <ArrowRight size={10} className={color} />
                    </div>
                )}
            </div>

            {n.isNew && (
                <motion.div
                    layoutId={`pulse-${n.id}`}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand"
                />
            )}
        </motion.div>
    );
};

export default Notifications;
