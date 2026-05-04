import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import {
    Bell, CheckCheck, Clock, Zap, ShoppingBag, ShieldAlert,
    ChevronRight, Search, Activity, Target, Filter, ShieldCheck,
    AlertTriangle, Info, Terminal, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../utils/socket';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
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
            toast.error('IQ Link Sync Failure');
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
            toast.success(`Priority: ${data.notification.title}`, {
                icon: '⚡',
                style: { 
                    borderRadius: '12px', 
                    background: '#0F172A', 
                    color: '#fff', 
                    fontSize: '10px', 
                    fontWeight: '900',
                    border: '1px solid rgba(255,255,255,0.1)' 
                }
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
            toast.error('Command Execution Failed');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await adminAPI.markAllRead();
            if (res.status === 'success') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('System Log Synchronized');
            }
        } catch (error) {
            toast.error('Omni-Sync Failed');
        }
    };

    const getIconConfig = (type, priority) => {
        if (priority === 'urgent') return { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' };
        
        const config = {
            sos: { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
            booking: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
            product: { icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50' },
            verification: { icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            default: { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-50' }
        };
        return config[type.toLowerCase()] || config.default;
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageShell
            title="Operational Intelligence"
            subtitle="Real-time system telemetry and incident registry"
            icon={Terminal}
            accent="slate"
            badge="IQ-v4.2"
            actions={
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleMarkAllRead} 
                        disabled={unreadCount === 0}
                        className="adm-btn adm-btn-secondary flex items-center gap-2 h-10 px-4 disabled:opacity-40 text-[10px] uppercase font-black tracking-widest"
                    >
                        <CheckCheck size={14} /> Synchronize All
                    </button>
                    <button 
                        onClick={fetchNotifications}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin text-slate-900' : ''} />
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <SectionCard title="System Pulse" icon={Activity}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Alerts</span>
                                <span className="text-xl font-black text-slate-900 tracking-tighter">{unreadCount}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${Math.min(100, (unreadCount/50)*100)}%` }} 
                                    className="h-full bg-amber-500" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Uptime</p>
                                    <p className="text-sm font-black text-emerald-700">99.9%</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Latency</p>
                                    <p className="text-sm font-black text-blue-700">42ms</p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <ShieldCheck className="text-emerald-400 mb-4" size={32} />
                            <h3 className="text-xl font-black tracking-tighter mb-2">Protocol Zero</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                System security levels are optimal. All encrypted endpoints verified.
                            </p>
                        </div>
                        <Activity className="absolute -bottom-6 -right-6 text-white w-32 h-32 opacity-[0.05]" />
                    </div>
                </div>

                {/* Main Log Feed */}
                <div className="lg:col-span-3 space-y-6">
                    <FilterBar>
                        <SearchBox 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Query incident registry..." 
                        />
                        <div className="h-6 w-[1px] bg-slate-100" />
                        <StatusTabs 
                            tabs={[
                                { label: 'Omni Feed', value: 'all' },
                                { label: 'Unread Logs', value: 'unread', count: unreadCount }
                            ]}
                            active={activeTab}
                            onChange={setActiveTab}
                        />
                    </FilterBar>

                    <div className="space-y-3 min-h-[500px]">
                        <AnimatePresence mode="popLayout">
                            {loading && notifications.length === 0 ? (
                                <PageLoader />
                            ) : filteredNotifications.length === 0 ? (
                                <EmptyState 
                                    icon={Terminal} 
                                    title="Registry Void" 
                                    subtitle="No telemetry data identified in current frequency." 
                                />
                            ) : (
                                filteredNotifications.map((n, i) => {
                                    const config = getIconConfig(n.type, n.priority);
                                    return (
                                        <motion.div 
                                            key={n._id} 
                                            layout
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`group flex items-center gap-5 p-6 rounded-[2rem] border transition-all duration-300 ${
                                                n.isRead
                                                    ? 'bg-slate-50/50 border-slate-100 opacity-60'
                                                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-xl'
                                            }`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${
                                                n.isRead 
                                                    ? 'bg-slate-100 border-slate-200' 
                                                    : `${config.bg} border-transparent group-hover:bg-white group-hover:border-slate-200`
                                            }`}>
                                                <config.icon className={n.isRead ? 'text-slate-400' : config.color} size={24} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h4 className={`text-sm font-black uppercase tracking-tight truncate ${
                                                        n.isRead ? 'text-slate-400' : 'text-slate-800'
                                                    }`}>{n.title}</h4>
                                                    {!n.isRead && (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Priority</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-xs font-bold leading-relaxed ${
                                                    n.isRead ? 'text-slate-400' : 'text-slate-600'
                                                }`}>{n.message}</p>
                                                
                                                <div className="flex items-center gap-6 mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-slate-300" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            T-{formatDistanceToNow(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <div className={`text-[8px] font-black px-3 py-1 rounded-lg border uppercase tracking-[0.15em] ${
                                                        n.priority === 'urgent' 
                                                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {n.priority}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                {!n.isRead && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(n._id)}
                                                        className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                        title="Acknowledge Intel"
                                                    >
                                                        <CheckCheck size={18} />
                                                    </button>
                                                )}
                                                {n.actionUrl && (
                                                    <button 
                                                        onClick={() => navigate(n.actionUrl)}
                                                        className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg"
                                                        title="Intercept Event"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageShell>
    );
};

export default AdminNotifications;
