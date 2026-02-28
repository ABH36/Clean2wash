import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Navigation, Zap, Gift, Tag, ShieldCheck, Bell, ChevronRight, RefreshCw } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { notificationAPI } from '../../../utils/api';

const MOCK_PROMOS = [
    { id: 'p2', type: 'offer', icon: <Gift size={17} className="text-pink-600" />, iconBg: 'bg-pink-50', title: 'Weekend Special Offer', desc: 'Get 30% off on Full Deep Clean every Sat & Sun. Use WEEKEND30.', time: '2 days ago', isNew: false },
    { id: 'p3', type: 'security', icon: <ShieldCheck size={17} className="text-violet-600" />, iconBg: 'bg-violet-50', title: 'New Login Detected', desc: 'A new login was detected from Android in Bengaluru.', time: 'Feb 17', isNew: false },
];

const Notifications = () => {
    const navigate = useNavigate();
    const { bookings, user, vehicles } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch notifications from backend
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications();
            setNotifications(response.data.notifications || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications');
            // Fallback to mock notifications
            generateMockNotifications();
        } finally {
            setLoading(false);
        }
    };

    const generateMockNotifications = () => {
        // Map real bookings to notification format
        const bookingNotifs = bookings.filter(b => b.userId === user?.id || b.userId === 'GUEST').map(b => {
            let title = 'Booking Update';
            let desc = `Your booking for ${b.serviceName} is moving forward.`;
            let icon = <Navigation size={17} className="text-blue-600" />;
            let bg = 'bg-blue-50';

            if (b.status === 'CREATED') {
                title = 'Finding Captain';
                desc = `We are matching you with the best captain for your ${b.serviceName}.`;
                icon = <Zap size={17} className="text-violet-600" />;
                bg = 'bg-violet-50';
            } else if (b.status === 'ASSIGNED') {
                title = 'Captain Assigned!';
                desc = `Captain has accepted your request for ${b.serviceName}.`;
                icon = <ShieldCheck size={17} className="text-blue-600" />;
                bg = 'bg-blue-50';
            } else if (b.status === 'IN_PROGRESS') {
                title = 'Service Started';
                desc = `Your ${b.serviceName} is currently in progress.`;
                icon = <CheckCircle2 size={17} className="text-brand" />;
                bg = 'bg-brand/10';
            } else if (b.status === 'COMPLETED') {
                title = 'Wash Completed! ✨';
                desc = `Your car is now sparkling clean. Order #${b.id} is finished.`;
                icon = <CheckCircle2 size={17} className="text-green-600" />;
                bg = 'bg-green-50';
            }

            return {
                id: b.id,
                type: 'booking',
                icon,
                iconBg: bg,
                title,
                desc,
                time: 'Just now',
                isNew: true,
                bookingId: b.id
            };
        });

        // Strategy: Generate Compliance Alerts from Vehicles
        const complianceNotifs = vehicles.flatMap(v => {
            const alerts = [];
            if (v.insuranceExpiry) {
                const daysLeft = Math.ceil((new Date(v.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 15) {
                    alerts.push({
                        id: `ins-${v.id}`,
                        type: 'compliance',
                        icon: <ShieldCheck size={17} className="text-red-600" />,
                        iconBg: 'bg-red-50',
                        title: 'Insurance Expiry Alert',
                        desc: `Insurance for your ${v.brand} ${v.model} expires in ${daysLeft} days. Renew now at best rates.`,
                        time: 'High Priority',
                        isNew: true
                    });
                }
            }
            if (v.pucExpiry) {
                const daysLeft = Math.ceil((new Date(v.pucExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 7) {
                    alerts.push({
                        id: `puc-${v.id}`,
                        type: 'compliance',
                        icon: <CheckCircle2 size={17} className="text-orange-600" />,
                        iconBg: 'bg-orange-50',
                        title: 'PUC / Emission Due',
                        desc: `Pollution certificate for ${v.plate} expires in ${daysLeft} days. Get it checked to avoid fines.`,
                        time: 'Action Required',
                        isNew: true
                    });
                }
            }
            return alerts;
        });

        const allNotifs = [...complianceNotifs, ...bookingNotifs, ...MOCK_PROMOS];
        setNotifications(allNotifs);
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
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true, isNew: false }))
            );
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const newN = notifications.filter(n => n.isNew);
    const oldN = notifications.filter(n => !n.isNew);

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">Notifications</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">{newN.length} New</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchNotifications} className="p-2 text-gray-500 hover:text-brand transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleMarkAllAsRead} className="text-brand text-[9px] font-black uppercase tracking-widest">
                        Mark all read
                    </button>
                </div>
            </header>

            <div className="px-4 pb-24 pt-4 space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p className="text-red-600 text-xs font-black">{error}</p>
                    </div>
                )}
                
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {newN.length > 0 && (
                            <section className="space-y-2">
                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">New</p>
                                {newN.map((n, i) => <NotifCard key={n.id} notif={n} delay={i * 0.04} onMarkRead={handleMarkAsRead} />)}
                            </section>
                        )}
                        <section className="space-y-2">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest px-1">Earlier</p>
                            {oldN.map((n, i) => <NotifCard key={n.id} notif={n} delay={i * 0.04} onMarkRead={handleMarkAsRead} />)}
                        </section>
                    </>
                )}
            </div>
        </MobileLayout>
    );
};

const NotifCard = ({ notif: n, delay, onMarkRead }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
        onClick={() => onMarkRead && onMarkRead(n.id)}
        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${n.isNew ? 'bg-brand/5 border-brand/10' : 'bg-white border-gray-100'} hover:shadow-md`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.iconBg}`}>{n.icon}</div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
                <h3 className="font-black text-sm text-content tracking-tight leading-tight">{n.title}</h3>
                {n.isNew && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1" />}
            </div>
            <p className="text-[10px] font-bold text-content-subtle leading-relaxed">{n.desc}</p>
            <p className="text-[8px] font-black text-content-subtle/50 uppercase tracking-widest mt-1.5">{n.time}</p>
        </div>
    </motion.div>
);

export default Notifications;
