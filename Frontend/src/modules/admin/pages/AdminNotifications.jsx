import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import {
    Bell,
    CheckCheck,
    Clock,
    Zap,
    ShoppingBag,
    ShieldAlert,
    ChevronRight,
    Search,
    Activity,
    Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../utils/socket';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, unread
    const [searchQuery, setSearchQuery] = useState('');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getNotifications({
                limit: 50,
                isRead: activeTab === 'unread' ? false : undefined
            });
            if (res.status === 'success') {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('IQ link error: Failed to sync logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        socketService.joinAdminRoom();
        const handleNewNotif = (data) => {
            const newNotif = { _id: data.notification.id, ...data.notification, isRead: false };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.success(`Priority alert: ${data.notification.title}`, {
                icon: '⚡',
                style: { borderRadius: '12px', background: '#0F172A', color: '#fff', fontSize: '10px', fontBold: 'bold' }
            });
        };
        socketService.on('new_admin_notification', handleNewNotif);
        return () => socketService.off('new_admin_notification', handleNewNotif);
    }, [activeTab]);

    const handleMarkAsRead = async (id) => {
        try {
            const res = await adminAPI.markNotificationRead(id);
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('Internal protocol error');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await adminAPI.markAllRead();
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('Omni-log neutralized: System clean');
            }
        } catch (error) {
            toast.error('System update failed');
        }
    };

    const getIcon = (type) => {
        const iconMap = {
            sos: <ShieldAlert className="text-red-500" size={14} />,
            booking: <Zap className="text-blue-500" size={14} />,
            product: <ShoppingBag className="text-amber-500" size={14} />,
            verification: <CheckCheck className="text-emerald-500" size={14} />,
            default: <Bell className="text-brand" size={14} />
        };
        return iconMap[type.toLowerCase()] || iconMap.default;
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1000px] mx-auto space-y-4 pb-20 px-3 lg:px-0 transition-colors duration-500">
            {/* COMPACT HUD HEADER */}
            <div className="bg-surface p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden transition-colors duration-500">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-[30px] rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/5 border border-brand/10"><Activity size={20} /></div>
                    <div>
                        <h1 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Operational <span className="text-brand">Logs</span></h1>
                        <p className="text-[8.5px] font-black text-content-subtle capitalize tracking-[0.2em] mt-1.5 opacity-40">{unreadCount} Critical priority items</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-30" size={12} />
                        <input type="text" placeholder="Quantum Scan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-xl pl-11 pr-4 text-[11px] font-black text-content outline-none focus:border-brand/40 transition-all placeholder:text-content-subtle opacity-60 tracking-widest shadow-inner" />
                    </div>
                    <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="h-11 px-5 bg-brand text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-brand/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"><Target size={16} /> Mark Safe</button>
                </div>
            </div>

            {/* TABS GRID */}
            <div className="flex gap-2 p-1.5 bg-background rounded-2xl border border-slate-200/40 dark:border-white/5 w-fit shadow-inner">
                {['all', 'unread'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-xl text-[10px] font-black capitalize tracking-widest transition-all ${activeTab === tab ? 'bg-surface text-brand shadow-sm border border-slate-100 dark:border-white/5' : 'text-content-muted hover:text-content'}`}>{tab} items</button>
                ))}
            </div>

            {/* NOTIFICATION FEED */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full" />
                            <span className="text-[9px] font-black capitalize tracking-[0.4em] text-content-subtle opacity-20">Established Link...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center bg-surface rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-soft">
                            <Bell size={40} className="mx-auto text-content-subtle opacity-10 mb-5" />
                            <p className="text-[10px] font-black text-content-subtle capitalize tracking-[0.4em] opacity-40">System Secure: Logs Neutralized</p>
                        </motion.div>
                    ) : (
                        filteredNotifications.map((notification, i) => (
                            <motion.div 
                                key={notification._id} 
                                layout 
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.98 }} 
                                transition={{ delay: i * 0.02 }} 
                                className={`group p-4 rounded-2xl border transition-all flex items-center gap-5 ${notification.isRead 
                                    ? 'bg-background/40 border-slate-200/60 dark:border-white/5 opacity-60' 
                                    : 'bg-surface border-slate-100 dark:border-white/5 shadow-soft'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${notification.isRead ? 'bg-background' : 'bg-brand/10 border border-brand/5'}`}>{getIcon(notification.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className={`text-[13px] font-bold capitalize tracking-tight truncate ${notification.isRead ? 'text-content-muted' : 'text-content'}`}>{notification.title}</h4>
                                        {!notification.isRead && <div className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />}
                                    </div>
                                    <p className={`text-[11.5px] font-bold tracking-tight leading-none mb-3 truncate ${notification.isRead ? 'text-content-subtle' : 'text-content-muted'}`}>{notification.message}</p>
                                    <div className="flex items-center gap-4 text-[9px] font-black text-content-subtle capitalize tracking-widest opacity-40">
                                        <span className="flex items-center gap-2"><Clock size={12} /> {formatDistanceToNow(new Date(notification.createdAt))} ago</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                        <span className={`px-2 py-0.5 rounded-lg border ${notification.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-background border-slate-200/40 dark:border-white/5'}`}>Protocol: {notification.priority}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    {!notification.isRead && (
                                        <button onClick={() => handleMarkAsRead(notification._id)} className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20 active:scale-90" title="Neutralize"><CheckCheck size={16} /></button>
                                    )}
                                    {notification.actionUrl && (
                                        <button onClick={() => navigate(notification.actionUrl)} className="w-9 h-9 bg-brand/10 text-brand rounded-xl flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-lg active:scale-90 border border-brand/10"><ChevronRight size={18} /></button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminNotifications;
