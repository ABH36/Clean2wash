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

const isSpareDriverNotification = (notif = {}) => {
    const meta = notif.metaData || notif.data || {};
    const actionUrl = String(notif.actionUrl || meta.actionUrl || '').toLowerCase();
    const title = String(notif.title || '').toLowerCase();
    const message = String(notif.message || notif.desc || '').toLowerCase();
    const type = String(notif.type || '').toLowerCase();

    return meta.moduleScope === 'spare-driver'
        || meta.serviceType === 'sparedriver'
        || actionUrl.includes('/spare-driver')
        || title.includes('driver')
        || title.includes('chauffeur')
        || message.includes('driver')
        || message.includes('chauffeur')
        || ['payout', 'wallet', 'payment', 'booking', 'support', 'sos', 'verification'].includes(type);
};

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
    return '/spare-driver';
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
                if (!isSpareDriverNotification(newNotif)) return;
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
                const mapped = response.data.notifications
                    .map(n => ({
                        ...n,
                        id: n._id,
                        isNew: !n.isRead,
                        desc: n.message,
                        time: formatTime(n.createdAt),
                        actionUrl: n.actionUrl || n.metaData?.actionUrl || ''
                    }))
                    .filter(isSpareDriverNotification);
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
        navigate(route || '/spare-driver');
    };

    const newN = notifications.filter(n => n.isNew);
    const oldN = notifications.filter(n => !n.isNew);

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-[60] border-b border-gray-100 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                        <ChevronLeft size={18} className="text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Notifications</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={fetchNotifications} className={`p-2 rounded-lg bg-gray-50 text-slate-400 active:scale-75 transition-all ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={14} />
                    </button>
                    {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="p-2 rounded-lg bg-rose-50 text-rose-500 active:scale-75 transition-all border border-rose-100">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-5 pb-24 pt-6 min-h-[70vh]">
                <AnimatePresence mode="wait">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-[3px] border-gray-50 border-t-[#FF9900] rounded-full animate-spin shadow-lg" />
                            <p className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Identifying Alerts</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl border border-white/5 relative overflow-hidden">
                                <Inbox size={32} className="text-[#FF9900]" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF9900]/10 to-transparent opacity-50" />
                            </div>
                            <h2 className="text-[15px] font-[1000] text-slate-900 uppercase tracking-tight">Inbox Clear</h2>
                            <p className="text-[9px] text-slate-400 mt-2 max-w-[200px] leading-relaxed uppercase font-black tracking-tight">
                                No new communication hashes found. We'll notify you for trip and payout updates.
                            </p>
                            <button onClick={() => navigate('/spare-driver')} className="mt-8 h-11 px-8 bg-slate-900 text-[#FF9900] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl">
                                Return to Driver Hub <ArrowRight size={14} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {newN.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF9900] animate-pulse" />
                                            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recent Activity</h2>
                                        </div>
                                        <button onClick={handleMarkAllAsRead} className="text-[9px] font-black text-[#FF9900] uppercase tracking-tighter">Sweep as read</button>
                                    </div>
                                    <div className="space-y-2">
                                        {newN.map((n, i) => (
                                            <NotifCard key={n.id} notif={n} delay={i * 0.05} onClick={() => handleNotificationClick(n)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {oldN.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Archive History</h2>
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
        case 'booking': return { icon: <Calendar size={16} className="text-indigo-500" strokeWidth={3} />, bg: 'bg-indigo-50/50' };
        case 'payment': case 'wallet': case 'payout': return { icon: <Wallet size={16} className="text-emerald-500" strokeWidth={3} />, bg: 'bg-emerald-50/50' };
        case 'promotion': return { icon: <Gift size={16} className="text-rose-500" strokeWidth={3} />, bg: 'bg-rose-50/50' };
        case 'service': return { icon: <Sparkles size={16} className="text-[#FF9900]" strokeWidth={3} />, bg: 'bg-[#FF9900]/10' };
        case 'support': case 'sos': return { icon: <ShieldCheck size={16} className="text-red-500" strokeWidth={3} />, bg: 'bg-red-50/50' };
        case 'verification': return { icon: <CheckCircle2 size={16} className="text-blue-500" strokeWidth={3} />, bg: 'bg-blue-50/50' };
        default: return { icon: <Bell size={16} className="text-slate-400" strokeWidth={3} />, bg: 'bg-slate-50' };
    }
};

const NotifCard = ({ notif: n, delay, onClick }) => {
    const { icon, bg } = getIconForType(n.type);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            onClick={onClick}
            className={`relative flex items-start gap-4 p-4 rounded-[22px] border transition-all active:scale-[0.98] cursor-pointer ${n.isNew 
                ? 'bg-white border-[#FF9900]/20 shadow-lg shadow-[#FF9900]/5 ring-1 ring-[#FF9900]/5' 
                : 'bg-white border-gray-50 opacity-80'}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} border border-white/50 shadow-inner`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-[12px] font-[1000] truncate uppercase tracking-tight ${n.isNew ? 'text-slate-900' : 'text-slate-400'}`}>{n.title}</h3>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest shrink-0">{n.time}</span>
                </div>
                <p className={`text-[10px] leading-relaxed uppercase font-bold tracking-tight ${n.isNew ? 'text-slate-600' : 'text-slate-400'}`}>{n.desc}</p>
            </div>
            {n.isNew && (
                <div className="absolute top-4 right-4 flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF9900] shadow-[0_0_8px_rgba(255,153,0,0.5)]" />
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
