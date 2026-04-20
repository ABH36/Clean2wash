import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Clock, Package, AlertCircle, ShoppingBag, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { vendorAPI } from '../../../utils/vendorApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    // Fetch notifications on mount
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await vendorAPI.getNotifications();
            if (res.status === 'success') {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for real-time notifications
        socketService.on('new_vendor_notification', (data) => {
            const newNotif = data.notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Custom Toast for real-time alert
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-surface shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-5 border border-brand/20 backdrop-blur-xl`}>
                    <div className="flex-1 w-0 p-1">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                                    <Bell className="text-brand" size={20} />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-black text-content uppercase tracking-tighter">
                                    {newNotif.title}
                                </p>
                                <p className="mt-1 text-xs font-bold text-content-subtle lowercase leading-tight">
                                    {newNotif.message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-white/5/10 ml-4 pl-4">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-xs font-black text-content-subtle hover:text-brand transition-colors uppercase tracking-widest"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });
        });

        return () => {
            socketService.off('new_vendor_notification');
        };
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await vendorAPI.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id || n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await vendorAPI.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All cleared!', {
                style: {
                    background: '#0f1117',
                    color: '#fff',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order-assigned': return <Package className="text-brand" size={16} />;
            case 'payment': return <Wallet className="text-green-500" size={16} />;
            case 'system': return <AlertCircle className="text-blue-500" size={16} />;
            case 'payout': return <ShoppingBag className="text-purple-500" size={16} />;
            default: return <Bell className="text-brand" size={16} />;
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-9 h-9 bg-background rounded-xl flex items-center justify-center border border-white/5/10 hover:bg-surface transition-all group"
            >
                <Bell size={16} className={`transition-colors ${unreadCount > 0 ? 'text-brand animate-swing' : 'text-content-muted group-hover:text-brand'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-brand text-[8px] font-black text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Notification Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface border border-white/5/10 shadow-2xl rounded-[2.5rem] z-[110] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/5/10 flex items-center justify-between bg-background/50">
                                <div>
                                    <h3 className="text-sm font-black text-content uppercase tracking-widest leading-none">Intelligence Feed</h3>
                                    <p className="text-[9px] text-content-subtle font-bold uppercase tracking-widest mt-1">
                                        {unreadCount} Unread Alerts Received
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="p-2 bg-background hover:bg-brand/10 text-content-subtle hover:text-brand rounded-xl transition-all"
                                        title="Clear All"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 bg-background hover:bg-red-500/10 text-content-subtle hover:text-red-500 rounded-xl transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <motion.div
                                            key={notif.id || notif._id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className={`relative p-4 rounded-3xl border transition-all ${notif.isRead ? 'bg-background/20 border-transparent' : 'bg-background border-brand/5 shadow-lg shadow-brand/5'}`}
                                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id || notif._id)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-white/[0.05]/5 opacity-40' : 'bg-brand/10'}`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${notif.isRead ? 'text-content-muted' : 'text-content'}`}>
                                                            {notif.title}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-content-subtle uppercase">
                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] leading-tight font-medium ${notif.isRead ? 'text-content-muted/60' : 'text-content-subtle'}`}>
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-brand rounded-full shadow-lg shadow-brand/50" />
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                                        <div className="w-16 h-16 bg-white/[0.05]/10 rounded-full flex items-center justify-center mb-4">
                                            <Clock size={24} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Void Detected</p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest mt-1">No incoming operational alerts</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-background/30 border-t border-white/5/10">
                                <button className="w-full py-3 bg-background hover:bg-surface border border-white/5/10 rounded-2xl text-[9px] font-black text-content-subtle uppercase tracking-widest transition-all">
                                    Archive Protocol Beta
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
