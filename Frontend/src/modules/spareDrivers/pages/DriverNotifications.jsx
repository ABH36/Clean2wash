import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ChevronLeft, Clock, AlertCircle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const NOTIF_ICONS = {
    booking: <Bell size={16} className="text-blue-500" />,
    payment: <CheckCircle2 size={16} className="text-green-500" />,
    system: <Info size={16} className="text-amber-500" />,
    verification: <AlertCircle size={16} className="text-purple-500" />,
    payout: <CheckCircle2 size={16} className="text-emerald-500" />,
};

const DriverNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await spareDriverAPI.getNotifications();
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await spareDriverAPI.markNotificationRead(id);
            if (id === 'all') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success("Read all");
            } else {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            toast.error("Action failed");
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

                {/* ── Header Actions ── */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-black/40">
                            <ChevronLeft size={20} />
                        </button>
                        <p className="text-[10px] font-black text-black/25 uppercase tracking-widest">
                            Alerts ({unreadCount} New)
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAsRead('all')}
                            className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest border-b border-[#F29F05]"
                        >
                            Mark all as Read
                        </button>
                    )}
                </div>

                {/* ── List ── */}
                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((n) => (
                            <div
                                key={n._id}
                                onClick={() => !n.isRead && markAsRead(n._id)}
                                className={`relative p-4 rounded-xl border transition-all ${n.isRead
                                        ? 'bg-white border-gray-50'
                                        : 'bg-black/[0.02] border-black/5 shadow-sm'
                                    }`}
                            >
                                {!n.isRead && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#F29F05] rounded-full" />
                                )}

                                <div className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.isRead ? 'bg-gray-50' : 'bg-white shadow-sm'
                                        }`}>
                                        {NOTIF_ICONS[n.type] || <Bell size={16} className="text-black/30" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`text-[11px] font-black uppercase truncate pr-4 ${n.isRead ? 'text-black/60' : 'text-black'
                                                }`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[8px] font-bold text-black/20 uppercase whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] leading-relaxed ${n.isRead ? 'text-black/30' : 'text-black/60'
                                            }`}>
                                            {n.message}
                                        </p>

                                        <div className="flex items-center gap-2 mt-2.5">
                                            <Clock size={10} className="text-black/20" />
                                            <span className="text-[8px] font-bold text-black/20 uppercase">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
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
