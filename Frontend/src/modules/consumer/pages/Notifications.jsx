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
import { useTheme } from '../../../context/ThemeContext';
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
    const { isDarkMode } = useTheme();
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
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                {/* ── Header ── */}
                <header className={`px-4 py-6 flex items-center justify-between sticky top-0 z-[60] border-b backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/80 border-black/05'}`}>
                    <div className="flex items-center gap-3">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/05 border-black/05'}`}>
                            <ChevronLeft size={18} className={isDarkMode ? 'text-white' : 'text-black'} strokeWidth={3} />
                        </motion.button>
                        <div>
                            <h1 className={`text-lg font-[1000] tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                            <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                        </div>
                        <button onClick={fetchNotifications} className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-75 transition-all ${loading ? 'animate-spin' : ''} ${isDarkMode ? 'bg-white/5 text-white/20' : 'bg-black/05 text-black/30'}`}>
                            <RefreshCw size={16} strokeWidth={3} />
                        </button>
                        {notifications.length > 0 && (
                            <button onClick={handleClearAll} className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 active:scale-75 transition-all border border-rose-500/10 flex items-center justify-center">
                                <Trash2 size={16} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                </header>

            <div className={`px-5 pb-24 pt-6 min-h-[70vh]`}>
                <AnimatePresence mode="wait">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-10 h-10 border-[3px] border-white/5 border-t-[#F59E0B] rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
                            <p className="mt-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Decrypting feed...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 border relative overflow-hidden group shadow-2xl ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-black/05'}`}>
                                <Inbox size={36} className="text-[#F59E0B] group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B]/5 to-transparent" />
                            </div>
                            <h2 className={`text-[17px] font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>No active data</h2>
                            <p className={`text-[10px] mt-3 max-w-[220px] leading-relaxed uppercase font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                                Your secure encrypted feed is currently empty. We'll alert you on trip updates.
                            </p>
                            <button onClick={() => navigate('/spare-driver')} className="mt-10 h-14 px-10 bg-white text-black rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95 transition-all shadow-2xl shadow-white/5">
                                Return to Driver Hub <ArrowRight size={16} strokeWidth={3} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {newN.length > 0 && (
                                <section className="space-y-5">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse shadow-[0_0_8px_#F59E0B]" />
                                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Fresh pulse</h2>
                                        </div>
                                        <button onClick={handleMarkAllAsRead} className="text-[10px] font-black text-[#F59E0B] uppercase tracking-tighter">Sweep all</button>
                                    </div>
                                    <div className="space-y-2">
                                        {newN.map((n, i) => (
                                            <NotifCard key={n.id} n={n} delay={i * 0.05} onClick={() => handleNotificationClick(n)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {oldN.length > 0 && (
                                <section className="space-y-5">
                                    <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-1">Archived history</h2>
                                    <div className="space-y-2">
                                        {oldN.map((n, i) => (
                                            <NotifCard key={n.id} n={n} delay={i * 0.03} onClick={() => handleNotificationClick(n)} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </MobileLayout>
    );
};

const getIconForType = (type) => {
    switch (type) {
        case 'booking': return { icon: <Calendar size={18} className="text-indigo-400" strokeWidth={3} />, bg: 'bg-indigo-400/10' };
        case 'payment': case 'wallet': case 'payout': return { icon: <Wallet size={18} className="text-emerald-400" strokeWidth={3} />, bg: 'bg-emerald-400/10' };
        case 'promotion': return { icon: <Gift size={18} className="text-rose-400" strokeWidth={3} />, bg: 'bg-rose-400/10' };
        case 'service': return { icon: <Sparkles size={18} className="text-[#F59E0B]" strokeWidth={3} />, bg: 'bg-[#F59E0B]/10' };
        case 'support': case 'sos': return { icon: <ShieldCheck size={18} className="text-rose-500" strokeWidth={3} />, bg: 'bg-rose-500/10' };
        case 'verification': return { icon: <CheckCircle2 size={18} className="text-blue-400" strokeWidth={3} />, bg: 'bg-blue-400/10' };
        default: return { icon: <Bell size={18} className="text-white/20" strokeWidth={3} />, bg: 'bg-white/5' };
    }
};

const NotifCard = ({ n, delay, onClick }) => {
    const { icon, bg } = getIconForType(n.type);
    const { isDarkMode } = useTheme();
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            className={`relative flex items-start gap-4 p-5 rounded-[2rem] border transition-all active:scale-[0.98] cursor-pointer shadow-sm ${n.isNew 
                ? (isDarkMode ? 'bg-white/[0.04] border-[#F59E0B]/30 ring-1 ring-[#F59E0B]/5' : 'bg-white border-[#F59E0B]/40 shadow-md')
                : (isDarkMode ? 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100' : 'bg-white/60 border-black/05 opacity-60 hover:opacity-100')}`}
        >
            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 ${bg} border border-white/5 shadow-inner`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className={`text-[13px] font-black truncate tracking-tighter ${n.isNew ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-white/60' : 'text-black/40')}`}>{n.title}</h3>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] shrink-0 ${isDarkMode ? 'text-white/20' : 'text-black/25'}`}>{n.time}</span>
                </div>
                <p className={`text-[10px] leading-relaxed uppercase font-black tracking-widest ${n.isNew ? (isDarkMode ? 'text-white/40' : 'text-black/50') : (isDarkMode ? 'text-white/20' : 'text-black/25')}`}>{n.desc}</p>
            </div>
            {n.isNew && (
                <div className="absolute top-5 right-5">
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]" />
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
