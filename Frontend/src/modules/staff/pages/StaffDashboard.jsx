import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, MapPin, Navigation, CheckCircle2, Calendar,
    ChevronRight, Search, User, Package, ShieldCheck,
    Truck, LogOut, Activity, Zap, Bell, Shield, Car, ArrowRight
} from 'lucide-react';
import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { staffAPI } from '../../../utils/staffApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) { }
};

const vibrateAlert = () => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
};

const CountdownTimer = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState('...');

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const target = new Date(targetTime);
            const diff = target - now;
            if (diff <= 0) return 'STARTING';
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            return `${mins}m ${secs}s`;
        };
        setTimeLeft(calculate());
        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [targetTime]);

    return <span>{timeLeft}</span>;
};

const StaffDashboard = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { getUser } = useAuth();
    const user = getUser('staff') || { name: 'Staff Member', id: 'STF-DEFAULT' };

    const [activeTab, setActiveTab] = useState('assigned');
    const [tasks, setTasks] = useState([]);
    const [productTasks, setProductTasks] = useState([]);
    const [stats, setStats] = useState({ activeTasks: 0, completedTasks: 0, rating: 5.0 });
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(user.isOnline !== false);
    const [isCommitting, setIsCommitting] = useState(null);

    const nonApartmentTasks = tasks.filter(
        (task) => task.service?.category !== 'Apartment' && task.service?.key !== 'APARTMENT_WASH'
    );

    const needsCommitment = nonApartmentTasks.find(t =>
        t.schedule?.type === 'scheduled' &&
        !t.isStaffCommitted &&
        t.status === 'confirmed'
    );

    const handleCommit = async (taskId) => {
        setIsCommitting(taskId);
        try {
            const res = await staffAPI.commitToSlot(taskId);
            if (res.status === 'success') {
                toast.success('Mission Slot Secured 🛡️');
                fetchDashboard();
            }
        } catch (err) {
            toast.error(err.message || 'Operation Timing Failure');
        } finally {
            setIsCommitting(null);
        }
    };

    const handleToggleAvailability = async () => {
        try {
            const res = await staffAPI.toggleAvailability();
            if (res.status === 'success') {
                setIsOnline(res.data.isOnline);
                toast.success(res.data.isOnline ? 'Terminal Active' : 'Terminal Offline');
            }
        } catch (err) {
            toast.error('Sync Error');
        }
    };

    const fetchDashboard = useCallback(async () => {
        try {
            const [tasksRes, statsRes] = await Promise.all([
                staffAPI.getTasks(),
                staffAPI.getDashboard()
            ]);

            if (tasksRes.status === 'success') {
                setTasks(tasksRes.data.tasks || []);
                setProductTasks(tasksRes.data.productTasks || []);
            }
            if (statsRes.status === 'success') setStats(statsRes.data.stats);
        } catch (err) {
            console.error('Terminal Sync Failure:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();

        // 📡 Real-time Synchronization
        socketService.connect();
        const socket = socketService.getSocket();
        if (socket) {
            const userId = user.id || user._id;
            socketService.joinUserRoom(userId);
            socket.on('new_staff_notification', (data) => {
                toast.success('🚨 New Protocol Dispatched!');
                playNotificationSound();
                vibrateAlert();
                fetchDashboard();
            });

            // Listen for general booking updates that might affect local state
            socket.on('booking_status_updated', () => fetchDashboard());
        }

        return () => {
            if (socket) {
                socket.off('new_staff_notification');
                socket.off('booking_status_updated');
            }
        };
    }, [fetchDashboard, user.id, user._id]);

    const serviceTasks = nonApartmentTasks.map(b => {
        const isDelivery = [
            'quality-check', 
            'ready-for-delivery', 
            'delivery-assigned', 
            'out_for_delivery', 
            'at_delivery_address', 
            'completed'
        ].includes(b.status);

        const ongoingStatuses = [
            'en_route', 'arrived', 'picked-up', 'at-studio', 
            'in_progress', 'washing', 'quality-check',
            'out_for_delivery', 'at_delivery_address'
        ];

        return {
            id: b._id || b.id,
            type: isDelivery ? 'Delivery' : 'Pickup',
            customer: b.consumer?.name || 'Guest',
            address: b.location?.address?.street || b.consumer?.profile?.address?.street || 'Site point',
            time: b.schedule?.type === 'instant' ? 'ASAP' : (b.schedule?.timeSlot?.start || 'Scheduled'),
            date: b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today',
            isScheduled: b.schedule?.type === 'scheduled',
            vehicle: b.vehicle?.brand ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Unknown Vehicle',
            plate: b.vehicle?.plate || '--',
            status: ['completed', 'cancelled'].includes(b.status) ? b.status :
                ongoingStatuses.includes(b.status) ? 'ongoing' : 'assigned',
            rawStatus: b.status,
            isProduct: false
        };
    });

    const productMappedTasks = productTasks.map(t => ({
        id: t._id,
        orderId: t.orderId,
        type: 'Product',
        customer: t.consumer?.name || 'Consumer',
        address: t.shippingAddress?.addressLine || 'Delivery Address',
        time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        productName: t.product?.name || 'Product',
        quantity: t.quantity,
        status: ['delivered', 'cancelled'].includes(t.status) ? t.status :
            ['shipped', 'arrived'].includes(t.status) ? 'ongoing' : 'assigned',
        rawStatus: t.status,
        isProduct: true
    }));

    const allMappedTasks = [...serviceTasks, ...productMappedTasks];

    const filteredTasks = allMappedTasks.filter(t => {
        if (activeTab === 'assigned') return t.status === 'assigned';
        if (activeTab === 'ongoing') return t.status === 'ongoing';
        if (activeTab === 'completed') return t.status === 'completed' || t.status === 'delivered';
        return true;
    });

    return (
        <StaffLayout
            title="Terminal"
            subtitle={`Node_${String(user.id || user._id).slice(-4).toUpperCase()}`}
        >
            <div className="space-y-8">
                {/* 🔌 Availability Toggle */}
                <div onClick={handleToggleAvailability} className={`relative p-6 rounded-[2.5rem] border overflow-hidden cursor-pointer group transition-all duration-500 ${isOnline
                    ? (isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/20')
                    : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5')
                    }`}>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOnline ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-gray-400 text-white'
                                }`}>
                                <Activity size={24} className={isOnline ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <h3 className={`text-base font-black uppercase leading-none mb-1.5 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                    {isOnline ? 'Active Protocol' : 'Terminal Offline'}
                                </h3>
                                <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                                    {isOnline ? 'Awaiting Dispatch' : 'Dispatch Paused'}
                                </p>
                            </div>
                        </div>
                        <div className={`w-16 h-8 rounded-full p-1 transition-all duration-500 relative ${isOnline ? 'bg-brand' : 'bg-gray-300'
                            }`}>
                            <motion.div
                                animate={{ x: isOnline ? 32 : 0 }}
                                className="w-6 h-6 bg-white/5 rounded-full shadow-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Scheduled Mission Commitment Alert (Phase 8) ── */}
                {needsCommitment && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-5 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#1E293B] border-brand/30' : 'bg-white/5 border-brand/20'}`}
                    >
                        {/* Pulse effect */}
                        <div className="absolute inset-x-0 inset-y-0 bg-brand/5 animate-pulse" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 text-white">
                                        <Clock size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>Hub Mission Alert</h4>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                                            <p className={`text-[9px] font-black uppercase tracking-widest text-brand`}>Dispatch Commitment Required</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-xl border text-[9px] font-black tabular-nums transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-brand' : 'bg-white/[0.02] border-white/5 text-brand'}`}>
                                    Starts in <CountdownTimer targetTime={needsCommitment.schedule?.date} />
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl mb-4 border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5'}`}>
                                <h3 className={`font-black text-base leading-none mb-1 truncate ${isDarkMode ? 'text-white' : 'text-content'}`}>{needsCommitment.service?.name || 'Studio Wash'}</h3>
                                <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>{needsCommitment.consumer?.profile?.address?.street || needsCommitment.location?.address?.landmark || 'Hub Center'}</p>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                disabled={isCommitting === needsCommitment.id}
                                onClick={() => handleCommit(needsCommitment._id || needsCommitment.id)}
                                className={`w-full h-12 rounded-2xl font-black text-xs text-white shadow-2xl shadow-black/50 transition-all flex items-center justify-center gap-3 bg-brand shadow-brand/30`}
                            >
                                {isCommitting === (needsCommitment._id || needsCommitment.id) ? (
                                    <>Syncing Protocol... <Zap size={14} className="animate-spin" /></>
                                ) : (
                                    <>Acknowledge Mission Slot <ChevronRight size={14} strokeWidth={3} /></>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
                {/* Visual Stats (Elite Ceramic Cards) */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} p-6 rounded-[2.5rem] border relative overflow-hidden group`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={12} className="text-brand animate-pulse" />
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Active Pulse</p>
                            </div>
                            <h4 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>{stats.activeTasks}</h4>
                            <p className={`text-[7px] font-bold uppercase mt-1 ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>Pending Protocols</p>
                        </div>
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand/5 rounded-full blur-2xl transition-all group-hover:bg-brand/10" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} p-6 rounded-[2.5rem] border relative overflow-hidden group`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={12} className="text-amber-500" />
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Completed</p>
                            </div>
                            <h4 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-content'}`}>{stats.completedTasks}</h4>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                                <p className="text-[7px] font-black text-green-500 uppercase tracking-widest">Handshake Validated</p>
                            </div>
                        </div>
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl transition-all group-hover:bg-amber-500/10" />
                    </motion.div>
                </div>

                {/* ── Today's Mission Timeline (Phase 8) ── */}
                {isOnline && nonApartmentTasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>Daily Hub Forecast</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/staff/map')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand hover:bg-brand/20' : 'bg-brand/5 border-brand/10 text-brand hover:bg-brand/10'}`}
                                >
                                    <Navigation size={10} fill="currentColor" />
                                    Mission Map
                                </button>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-brand">
                                    Protocols Active <Shield size={10} className="fill-brand" />
                                </div>
                            </div>
                        </div>
                        <div className={`rounded-3xl border p-4 transition-all duration-500 overflow-hidden space-y-4 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/30' : 'bg-white/5 border-white/5 shadow-soft'}`}>
                            {nonApartmentTasks.filter(t => !['completed', 'cancelled'].includes(t.status)).map((task, i, arr) => {
                                return (
                                    <div key={task._id} className="relative pl-6">
                                        {i < arr.length - 1 && (
                                            <div className={`absolute left-[5px] top-4 w-[2px] h-[calc(100%+8px)] transition-colors ${i === 0 ? 'bg-brand' : isDarkMode ? 'bg-white/5' : 'bg-white/[0.05]'}`} />
                                        )}
                                        <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-white/5 z-10 transition-all ${i === 0 ? 'bg-brand border-white' : isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-white/5 border-white/10'}`} />

                                        <div onClick={() => navigate(`/staff/task/${task._id}`)} className={`p-3 rounded-2xl border transition-all active:scale-95 ${i === 0 ? (isDarkMode ? 'bg-brand/10 border-brand/20' : 'bg-brand/5 border-brand/10') : 'border-transparent'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <h4 className={`text-xs font-black tracking-tight uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                                                        {task.service?.name || 'Studio Wash'}
                                                    </h4>
                                                    <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>{task.vehicle?.brand} {task.vehicle?.model} · {task.vehicle?.plate}</p>
                                                </div>
                                                <p className={`text-[10px] font-black tabular-nums ${i === 0 ? 'text-brand' : isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>
                                                    {task.schedule?.timeSlot?.start || 'Instant'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className={`flex p-2 rounded-[2.2rem] border backdrop-blur-md transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.05]/50 border-white/10/30'}`}>
                    {['assigned', 'ongoing', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${activeTab === tab
                                ? (isDarkMode ? 'bg-white/5 text-[#0F172A] shadow-2xl shadow-black/50 shadow-white/10 scale-[1.03]' : 'bg-content text-white shadow-2xl shadow-black/50 shadow-content/30 scale-[1.03]')
                                : (isDarkMode ? 'text-white/30 hover:text-white/60' : 'text-content-subtle hover:text-content')
                                }`}
                        >
                            <span className="relative z-10">{tab}</span>
                            {activeTab === tab && (
                                <motion.div layoutId="tab-glow" className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Task Engine */}
                <div className="space-y-5">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div key="loading" className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-brand">Synchronizing Logs...</p>
                            </div>
                        ) : filteredTasks.length > 0 ? (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-5"
                            >
                                {filteredTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(task.isProduct ? `/staff/product-task/${task.orderId}/${task.id}` : `/staff/task/${task.id}`)}
                                        className={`${isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white/5 border-white/5 shadow-soft'} rounded-[2.8rem] p-7 border relative overflow-hidden group hover:border-brand/40 transition-all duration-500`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-5">
                                                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${task.type === 'Pickup'
                                                    ? (isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
                                                    : task.type === 'Product'
                                                        ? (isDarkMode ? 'bg-brand/10 text-brand' : 'bg-brand/5 text-brand')
                                                        : (isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')
                                                    }`}>
                                                    {task.type === 'Pickup' ? <Truck size={32} /> : task.type === 'Product' ? <Package size={32} /> : <Package size={32} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${task.status === 'ongoing' ? 'bg-brand' : task.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                                                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">#{String(task.id).slice(-6)}</p>
                                                    </div>
                                                    <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-content'}`}>{task.type} Operation</h3>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`${task.isScheduled ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600') : (isDarkMode ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-brand/5 border-brand/10 text-brand')} px-3 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest`}>
                                                    {task.isScheduled ? 'Scheduled Mission' : 'Instant Protocol'}
                                                </div>
                                                <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5'} px-4 py-2 rounded-2xl border transition-colors flex items-center gap-3`}>
                                                    <div className="flex items-center gap-2 border-r pr-3 border-current/10">
                                                        <Calendar size={12} className="text-brand" />
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{task.date}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-brand" />
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{task.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-5 mb-8">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 shadow-inner'}`}>
                                                    <MapPin size={18} className="text-brand" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 ${isDarkMode ? 'text-white/20' : 'text-content-muted'}`}>{task.customer}</p>
                                                    <h4 className={`text-base font-black leading-tight uppercase truncate ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{task.address}</h4>
                                                </div>
                                            </div>
                                            {task.isProduct ? (
                                                <div className={`p-5 rounded-[2rem] transition-all ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white/[0.02]/50 border border-white/5'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Product Shipment</p>
                                                            <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{task.productName}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Qty</p>
                                                            <p className={`text-[10px] font-black uppercase text-brand`}>{task.quantity}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`grid grid-cols-2 gap-3 p-5 rounded-[2rem] transition-all ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white/[0.02]/50 border border-white/5'}`}>
                                                    <div className="space-y-1">
                                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Vehicle Identity</p>
                                                        <p className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white/80' : 'text-content'}`}>{task.vehicle}</p>
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Plate Number</p>
                                                        <p className={`text-[10px] font-black uppercase text-brand`}>{task.plate}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <button className={`flex-1 h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-content text-white hover:bg-content/90'}`}>
                                                Initialize Protocol <ChevronRight size={20} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank');
                                                }}
                                                className={`w-16 h-16 rounded-3xl border flex items-center justify-center transition-all ${isDarkMode ? 'bg-brand/10 border-brand/20 text-brand hover:bg-brand/20' : 'bg-brand/5 border-brand/10 text-brand hover:bg-brand/10'}`}
                                            >
                                                <Navigation size={22} fill="currentColor" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mb-8 border border-dashed transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/10'}`}>
                                    <Bell size={48} className={isDarkMode ? 'text-white/10' : 'text-gray-200'} />
                                </div>
                                <h3 className={`font-black uppercase tracking-[0.5em] mb-3 ${isDarkMode ? 'text-white' : 'text-content'}`}>Silent Terminal</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest px-14 leading-relaxed ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>
                                    The grid is currently quiet. We'll alert you the moment a new assignment is initialized.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffDashboard;
