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
    ArrowRight,
    Search,
    Inbox,
    CheckCircle2
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { notificationAPI } from '../../../utils/api';
import { socketService } from '../../../utils/socket';

const resolveNotificationRoute = (notif) => {
    const meta = notif.metaData || notif.data || {};
    const actionUrl = notif.actionUrl || meta.actionUrl || '';
    if (actionUrl) return actionUrl;

    const isChauffeur = meta.moduleScope === 'spare-driver' || meta.serviceType === 'sparedriver' || String(notif.type).toLowerCase() === 'payout';
    
    if (isChauffeur) {
        if (['payment', 'wallet', 'payout'].includes(notif.type)) return '/wallet';
        if (['support', 'sos'].includes(notif.type)) return meta.bookingId ? `/spare-driver/support?bookingId=${meta.bookingId}` : '/spare-driver/support';
        if (meta.status === 'completed') return '/spare-driver/history';
        return '/spare-driver';
    }
    return '';
};

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
                    time: 'Just now',
                    actionUrl: data.notification.actionUrl || data.notification.metaData?.actionUrl || ''
                };
                setNotifications(prev => [newNotif, ...prev]);
            });
        }
        return () => socketService.off('new_notification');
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
                    time: formatTime(n.createdAt),
                    actionUrl: n.actionUrl || n.metaData?.actionUrl || ''
                }));
                setNotifications(mapped);
            }
        } catch (err) {
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMins = Math.floor((now - date) / (1000 * 60));
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markRead(notificationId);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true, isNew: false } : n));
        } catch (err) {}
    };

    const handleMarkAllAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, isNew: false })));
        } catch (err) {}
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm('Clear all notifications?')) return;
        try {
            setLoading(true);
            await notificationAPI.clearAll();
            setNotifications([]);
        } catch (err) {} finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) handleMarkAsRead(notif.id);
        const route = resolveNotificationRoute(notif);
        if (route) { navigate(route); return; }
        
        const { type, metaData } = notif;
        switch (type) {
            case 'booking': navigate(metaData?.bookingId ? `/booking/${metaData.bookingId}` : '/bookings'); break;
            case 'payment': case 'wallet': navigate('/wallet'); break;
            case 'promotion': navigate('/refer'); break;
            case 'service': navigate('/services'); break;
            default: if (notif.actionUrl) navigate(notif.actionUrl); break;
        }
    };

    const newN = notifications.filter(n => n.isNew);
    const oldN = notifications.filter(n => !n.isNew);

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-5 pt-8 pb-4 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-50/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                        <ChevronLeft size={22} className="text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Notifications</h1>
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5">{newN.length > 0 ? `${newN.length} new alerts` : 'No new updates'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={fetchNotifications} className={`p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={18} />
                    </button>
                    {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-5 pb-24 pt-6 min-h-[70vh]">
                <AnimatePresence mode="wait">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-brand rounded-full animate-spin" />
                            <p className="mt-4 text-[12px] font-bold text-slate-300">Syncing inbox</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                                <Inbox size={32} className="text-slate-200" />
                            </div>
                            <h2 className="text-[17px] font-bold text-slate-900">All caught up</h2>
                            <p className="text-[12px] text-slate-400 mt-2 max-w-[220px] leading-relaxed">
                                You don't have any notifications right now. We'll alert you for your next wash or payment update.
                            </p>
                            <button onClick={() => navigate('/services')} className="mt-8 h-12 px-8 bg-slate-900 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 active:scale-95 transition-all">
                                Explore services <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {newN.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                            <h2 className="text-[13px] font-bold text-slate-900">Recent</h2>
                                        </div>
                                        <button onClick={handleMarkAllAsRead} className="text-[11px] font-bold text-brand">Mark all read</button>
                                    </div>
                                    <div className="space-y-2">
                                        {newN.map((n, i) => (
                                            <NotifCard key={n.id} notif={n} delay={i * 0.05} onClick={() => handleNotificationClick(n)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {oldN.length > 0 && (
                                <section className="space-y-3">
                                    <h2 className="text-[13px] font-bold text-slate-400 px-1">Earlier</h2>
                                    <div className="space-y-2">
                                        {oldN.map((n, i) => (
                                            <NotifCard key={n.id} notif={n} delay={i * 0.03} onClick={() => handleNotificationClick(n)} />
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
        case 'booking': return { icon: <Calendar size={18} className="text-indigo-500" />, bg: 'bg-indigo-50' };
        case 'payment': case 'wallet': case 'payout': return { icon: <Wallet size={18} className="text-emerald-500" />, bg: 'bg-emerald-50' };
        case 'promotion': return { icon: <Gift size={18} className="text-rose-500" />, bg: 'bg-rose-50' };
        case 'service': return { icon: <Sparkles size={18} className="text-amber-500" />, bg: 'bg-amber-50' };
        case 'support': case 'sos': return { icon: <ShieldCheck size={18} className="text-red-500" />, bg: 'bg-red-50' };
        case 'verification': return { icon: <CheckCircle2 size={18} className="text-blue-500" />, bg: 'bg-blue-50' };
        default: return { icon: <Bell size={18} className="text-slate-400" />, bg: 'bg-slate-50' };
    }
};

const NotifCard = ({ notif: n, delay, onClick }) => {
    const { icon, bg } = getIconForType(n.type);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            onClick={onClick}
            className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] ${n.isNew 
                ? 'bg-white border-brand/20 shadow-sm ring-1 ring-brand/5' 
                : 'bg-white border-gray-50 opacity-80'}`}
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-[13px] font-bold truncate ${n.isNew ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</h3>
                    <span className="text-[9px] font-bold text-slate-300 shrink-0">{n.time}</span>
                </div>
                <p className={`text-[11px] leading-snug line-clamp-2 ${n.isNew ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>{n.desc}</p>
            </div>
            {n.isNew && <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
        </motion.div>
    );
};

export default Notifications;
