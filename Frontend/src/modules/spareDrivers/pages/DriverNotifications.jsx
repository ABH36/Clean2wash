import React, { useEffect, useState } from 'react';
import { Bell, Trash2, ChevronLeft, Clock, AlertCircle, Info, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const NOTIF_ICONS = {
    booking: <Bell size={16} className="text-blue-500" />,
    payment: <CheckCircle2 size={16} className="text-green-500" />,
    system: <Info size={16} className="text-amber-500" />,
    verification: <AlertCircle size={16} className="text-purple-500" />,
    payout: <CheckCircle2 size={16} className="text-emerald-500" />,
    sos: <AlertCircle size={16} className="text-red-500" />,
};

const normalizeIncomingNotification = (entry) => ({
    _id: entry._id || entry.id,
    title: entry.title,
    message: entry.message,
    type: entry.type || 'system',
    priority: entry.priority || 'medium',
    createdAt: entry.createdAt || new Date().toISOString(),
    isRead: Boolean(entry.isRead),
    actionUrl: entry.actionUrl || entry.metaData?.actionUrl || '',
    actionText: entry.actionText || '',
    data: entry.data || entry.metaData || {}
});

const syncUnreadBadge = (count) => {
    window.dispatchEvent(new CustomEvent('spare-driver-unread-sync', {
        detail: { count }
    }));
};

const DriverNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [clearing, setClearing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await spareDriverAPI.getNotifications();
            const incoming = res?.data?.notifications || [];
            const unread = res?.data?.unreadCount || 0;
            setNotifications(incoming.map(normalizeIncomingNotification));
            setUnreadCount(unread);
            syncUnreadBadge(unread);
        } catch (err) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) return undefined;

        socketService.connect(token);
        const socket = socketService.getSocket();
        if (!socket) return undefined;

        const handleIncomingNotification = (payload) => {
            const incoming = normalizeIncomingNotification(payload.notification || payload);
            setNotifications((current) => {
                const withoutDuplicate = current.filter((item) => item._id !== incoming._id);
                return [incoming, ...withoutDuplicate];
            });
            setUnreadCount((current) => {
                const nextCount = current + 1;
                syncUnreadBadge(nextCount);
                return nextCount;
            });
        };

        socket.on('new_spare_driver_notification', handleIncomingNotification);
        return () => socket.off('new_spare_driver_notification', handleIncomingNotification);
    }, []);

    const markAsRead = async (id) => {
        try {
            await spareDriverAPI.markNotificationRead(id);
            if (id === 'all') {
                setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
                setUnreadCount(0);
                syncUnreadBadge(0);
                toast.success('Marked all as read');
            } else {
                const currentNotification = notifications.find((entry) => entry._id === id);
                if (!currentNotification?.isRead) {
                    const nextUnread = Math.max(0, unreadCount - 1);
                    setUnreadCount(nextUnread);
                    syncUnreadBadge(nextUnread);
                }

                setNotifications((current) => current.map((notification) => (
                    notification._id === id ? { ...notification, isRead: true } : notification
                )));
            }
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const clearAllNotifications = async () => {
        try {
            setClearing(true);
            await spareDriverAPI.clearNotifications();
            setNotifications([]);
            setUnreadCount(0);
            syncUnreadBadge(0);
            toast.success('Notifications cleared');
        } catch (err) {
            toast.error('Could not clear notifications');
        } finally {
            setClearing(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Notifications">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 size={24} className="animate-spin text-[#F29F05]" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Notifications">
            <div className="px-5 py-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-black/40">
                            <ChevronLeft size={20} />
                        </button>
                        <p className="text-[10px] font-black text-black/25 uppercase tracking-widest">
                            Alerts ({unreadCount} New)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                disabled={clearing}
                                className="text-[9px] font-black text-black/35 uppercase tracking-widest border-b border-black/20 flex items-center gap-1"
                            >
                                <Trash2 size={11} />
                                {clearing ? 'Clearing' : 'Clear All'}
                            </button>
                        )}
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead('all')}
                                className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest border-b border-[#F29F05]"
                            >
                                Mark all as Read
                            </button>
                        )}
                    </div>
                </div>

                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`relative p-4 rounded-xl border transition-all cursor-pointer ${notification.isRead
                                    ? 'bg-white border-gray-50'
                                    : 'bg-black/[0.02] border-black/5 shadow-sm'
                                    }`}
                            >
                                {!notification.isRead && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#F29F05] rounded-full" />
                                )}

                                <div className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notification.isRead ? 'bg-gray-50' : 'bg-white shadow-sm'
                                        }`}>
                                        {NOTIF_ICONS[notification.type] || <Bell size={16} className="text-black/30" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`text-[11px] font-black uppercase truncate pr-4 ${notification.isRead ? 'text-black/60' : 'text-black'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[8px] font-bold text-black/20 uppercase whitespace-nowrap">
                                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className={`text-[10px] leading-relaxed ${notification.isRead ? 'text-black/30' : 'text-black/60'}`}>
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-2 mt-2.5">
                                            <Clock size={10} className="text-black/20" />
                                            <span className="text-[8px] font-bold text-black/20 uppercase">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {notification.actionUrl && (
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleNotificationClick(notification);
                                                }}
                                                className="mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#F29F05]"
                                            >
                                                {notification.actionText || 'Open'}
                                                <ChevronRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Bell size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">All Clear</p>
                    </div>
                )}
            </div>
        </DriverLayout>
    );
};

export default DriverNotifications;
