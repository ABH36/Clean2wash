import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
    AlertCircle,
    Zap,
    ShoppingBag,
    ShieldAlert,
    ChevronRight,
    Search,
    Filter,
    MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('all'); // all, unread
    const [searchQuery, setSearchQuery] = React.useState('');

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
            toast.error('Intelligence Retrieval Error: Failed to sync logs');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const handleMarkAsRead = async (id) => {
        try {
            const res = await adminAPI.markNotificationRead(id);
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('System Update Failed');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await adminAPI.markAllRead();
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('Omni-Log Neutralized: All cleared');
            }
        } catch (error) {
            toast.error('Mass Update Failed');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'sos': return <ShieldAlert className="text-red-500" size={18} />;
            case 'booking': return <Zap className="text-blue-500" size={18} />;
            case 'product': return <ShoppingBag className="text-amber-500" size={18} />;
            default: return <Bell className="text-brand" size={18} />;
        }
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-brand/10 text-brand rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-brand/10">
                        <Bell size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-content uppercase tracking-tighter leading-none">System Alerts</h3>
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em] mt-2 px-1">
                            {unreadCount} Pending Intelligence Items
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" size={16} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-[1.25rem] pl-12 pr-4 text-xs font-bold text-content outline-none focus:border-brand focus:bg-white transition-all"
                        />
                    </div>
                    <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="h-14 px-8 bg-content text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-brand transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        <CheckCheck size={18} />
                        Clear All
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 px-2">
                {['all', 'unread'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab
                            ? 'bg-brand text-white shadow-lg shadow-brand/20'
                            : 'bg-white text-content-subtle border border-gray-100'
                            }`}
                    >
                        {tab} Logs
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-4 pb-20">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200"
                        >
                            <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.3em]">Operational Silence: No active logs found</p>
                        </motion.div>
                    ) : (
                        filteredNotifications.map((notification, i) => (
                            <motion.div
                                key={notification._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className={`group bg-white p-6 rounded-[2.5rem] border transition-all flex items-center gap-6 ${notification.isRead ? 'border-gray-100 opacity-60' : 'border-brand/20 shadow-xl shadow-brand/5'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${notification.isRead ? 'bg-gray-50 text-gray-400' : 'bg-brand/10 text-brand'
                                    }`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-sm font-black text-content uppercase tracking-tight truncate">
                                            {notification.title}
                                        </h4>
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest leading-none mb-3">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-[8px] font-black text-content-subtle/50 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={10} /> {formatDistanceToNow(new Date(notification.createdAt))} ago
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                        <span className={`px-2 py-0.5 rounded-md ${notification.priority === 'urgent' ? 'bg-red-50 text-red-500' : 'bg-gray-50'
                                            }`}>
                                            Priority: {notification.priority}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification._id)}
                                            className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                            title="Mark as Neutralized"
                                        >
                                            <CheckCheck size={18} />
                                        </button>
                                    )}
                                    {notification.actionUrl && (
                                        <button
                                            onClick={() => navigate(notification.actionUrl)}
                                            className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-brand/20 shadow-lg"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
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
