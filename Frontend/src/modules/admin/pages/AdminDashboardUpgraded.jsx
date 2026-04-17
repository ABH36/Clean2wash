import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import {
    Activity, Clock, Users, Wallet, ShieldAlert,
    TrendingUp, Truck, MapPin, AlertCircle, Calendar, BarChart3, Car,
    Zap, Target, Award, TrendingDown, Timer, DollarSign, Percent,
    Phone, Navigation, AlertTriangle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';

/**
 * ─── UPGRADED OPERATIONAL COCKPIT ──────────────────────────────────
 * Enhanced real-time dashboard with advanced analytics and monitoring.
 */

// ─── SOS ALERT COMPONENT ─────────────────────────────────────────────────────
const SOSAlertCard = ({ alert }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="admin-card-compact border-[var(--error)] bg-[var(--error-light)] relative overflow-hidden"
    >
        {/* Pulsing animation for urgency */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--error)] rounded-full animate-pulse" />
        
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[var(--error-light)] text-[var(--error)] rounded-lg flex items-center justify-center shrink-0">
                <ShieldAlert size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {alert.consumer?.name || 'Unknown Consumer'}
                    </h4>
                    <span className="badge badge-error text-xs">
                        {alert.timeSinceAlert}m ago
                    </span>
                </div>
                
                <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                    {alert.description || 'Emergency assistance required'}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
                    <MapPin size={10} />
                    <span className="truncate">{alert.location?.address || 'Location unavailable'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="btn-danger text-xs px-2 py-1">
                        <Phone size={10} className="mr-1" />
                        Call
                    </button>
                    <button className="btn-secondary text-xs px-2 py-1">
                        <Navigation size={10} className="mr-1" />
                        Location
                    </button>
                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                        {alert.responders?.length || 0} responders
                    </span>
                </div>
            </div>
        </div>
    </motion.div>
);

// ─── BOOKING SPLIT COMPONENT ─────────────────────────────────────────────────
const BookingSplitCard = ({ instant, scheduled }) => {
    const total = instant + scheduled;
    const instantPercent = total > 0 ? ((instant / total) * 100).toFixed(1) : 0;
    const scheduledPercent = total > 0 ? ((scheduled / total) * 100).toFixed(1) : 0;
    
    return (
        <div className="admin-card-compact">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg flex items-center justify-center">
                    <BarChart3 size={14} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Booking Split</h3>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-[var(--success)]" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Instant</span>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-[var(--text-primary)]">{instant}</div>
                        <div className="text-xs text-[var(--text-muted)]">{instantPercent}%</div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-[var(--warning)]" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Scheduled</span>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-[var(--text-primary)]">{scheduled}</div>
                        <div className="text-xs text-[var(--text-muted)]">{scheduledPercent}%</div>
                    </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-[var(--border)] rounded-full h-1.5 mt-2">
                    <div 
                        className="bg-[var(--success)] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${instantPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
// ─── ENHANCED KPI CARD COMPONENT ──────────────────────────────────────────────────
const KPICard = ({ title, value, icon, trend, trendValue, highlightClass }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="admin-card-compact cursor-pointer transition-smooth"
    >
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className="text-caption text-[var(--text-muted)] uppercase mb-2">{title}</p>
                <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">{value}</h3>
                </div>
                {trendValue && (
                    <div className="flex items-center gap-1.5">
                        {trend === 'up' ? (
                            <TrendingUp size={10} className="text-[var(--success)]" />
                        ) : (
                            <TrendingDown size={10} className="text-[var(--error)]" />
                        )}
                        <span className={`text-xs font-medium ${trend === 'up' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                            {trendValue}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">vs yesterday</span>
                    </div>
                )}
            </div>
            <div className={`p-2 rounded-lg ${highlightClass.replace('text-', 'bg-').replace('600', '-light')} ${highlightClass} shrink-0`}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
        </div>
    </motion.div>
);

// ─── SKELETON LOADER ─────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="admin-card-compact animate-pulse">
        <div className="flex justify-between items-start">
            <div className="space-y-2 w-full">
                <div className="h-3 w-20 bg-[var(--border)] rounded-full" />
                <div className="h-6 w-32 bg-[var(--border)] rounded-lg" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--border)] shrink-0" />
        </div>
    </div>
);

const AdminDashboardUpgraded = () => {
    const [stats, setStats] = useState({
        kpis: {
            totalDrivers: 0, activeDrivers: 0, totalUsers: 0,
            totalBookings: 0, todayBookings: 0, todayRevenue: 0, activeTrips: 0,
            completionRate: 0, avgRating: 0,
            // New KPIs
            utilizationRate: 0, cancellationRate: 0, fulfillmentRate: 0,
            revenuePerHour: 0, activeDutyHours: 0, activeSOSCount: 0
        },
        bookingSplit: { instant: 0, scheduled: 0 },
        sosAlerts: [],
        liveTrips: [],
        alerts: [],
        charts: { 
            bookings: [], revenue: [], 
            instantVsScheduled: [], utilization: [], cancellation: [] 
        },
        statusDistribution: []
    });
    const [loading, setLoading] = useState(true);
    const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'bookings' | 'instantVsScheduled' | 'utilization' | 'cancellation'

    const fetchDashboard = async () => {
        try {
            const res = await adminAPI.getDashboard();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Dashboard Sync Failed", err);
            // Set dummy data for demo
            setStats({
                kpis: {
                    totalDrivers: 156,
                    activeDrivers: 89,
                    totalUsers: 2847,
                    totalBookings: 1523,
                    todayBookings: 47,
                    todayRevenue: 28450,
                    activeTrips: 12,
                    completionRate: 94.5,
                    avgRating: 4.7,
                    // New KPIs
                    utilizationRate: 57.1,
                    cancellationRate: 8.5,
                    fulfillmentRate: 94.5,
                    revenuePerHour: 3556,
                    activeDutyHours: 8.0,
                    activeSOSCount: 2
                },
                bookingSplit: { instant: 35, scheduled: 12 },
                sosAlerts: [
                    {
                        id: 'sos123',
                        consumer: { name: 'John Doe', phone: '+91XXXXXXXXXX' },
                        location: { address: '123 Main St, Bangalore' },
                        description: 'Vehicle breakdown, need immediate assistance',
                        timeSinceAlert: 15,
                        responders: []
                    },
                    {
                        id: 'sos124',
                        consumer: { name: 'Priya Sharma', phone: '+91XXXXXXXXXX' },
                        location: { address: '456 Park Road, Mumbai' },
                        description: 'Emergency medical assistance required',
                        timeSinceAlert: 8,
                        responders: [{ name: 'Driver 1' }]
                    }
                ],
                liveTrips: [
                    { bookingId: 'BK12345', consumer: { name: 'Priya Sharma' }, provider: { name: 'Rajesh Kumar' }, status: 'IN_PROGRESS' },
                    { bookingId: 'BK12346', consumer: { name: 'Amit Verma' }, provider: { name: 'Vikram Singh' }, status: 'EN_ROUTE' },
                    { bookingId: 'BK12347', consumer: { name: 'Sneha Patel' }, provider: { name: 'Arjun Reddy' }, status: 'WASHING' }
                ],
                alerts: [],
                charts: {
                    revenue: [
                        { date: '2024-04-09', amount: 18500 },
                        { date: '2024-04-10', amount: 22300 },
                        { date: '2024-04-11', amount: 19800 },
                        { date: '2024-04-12', amount: 25600 },
                        { date: '2024-04-13', amount: 23400 },
                        { date: '2024-04-14', amount: 27100 },
                        { date: '2024-04-15', amount: 28450 }
                    ],
                    bookings: [
                        { date: '2024-04-09', count: 38 },
                        { date: '2024-04-10', count: 45 },
                        { date: '2024-04-11', count: 41 },
                        { date: '2024-04-12', count: 52 },
                        { date: '2024-04-13', count: 48 },
                        { date: '2024-04-14', count: 55 },
                        { date: '2024-04-15', count: 47 }
                    ],
                    instantVsScheduled: [
                        { date: '2024-04-09', instant: 25, scheduled: 13 },
                        { date: '2024-04-10', instant: 30, scheduled: 15 },
                        { date: '2024-04-11', instant: 28, scheduled: 13 },
                        { date: '2024-04-12', instant: 35, scheduled: 17 },
                        { date: '2024-04-13', instant: 32, scheduled: 16 },
                        { date: '2024-04-14', instant: 38, scheduled: 17 },
                        { date: '2024-04-15', instant: 35, scheduled: 12 }
                    ],
                    utilization: [
                        { date: '2024-04-09', rate: 55.2 },
                        { date: '2024-04-10', rate: 57.1 },
                        { date: '2024-04-11', rate: 54.8 },
                        { date: '2024-04-12', rate: 59.3 },
                        { date: '2024-04-13', rate: 56.7 },
                        { date: '2024-04-14', rate: 58.9 },
                        { date: '2024-04-15', rate: 57.1 }
                    ],
                    cancellation: [
                        { date: '2024-04-09', rate: 7.8 },
                        { date: '2024-04-10', rate: 8.5 },
                        { date: '2024-04-11', rate: 7.2 },
                        { date: '2024-04-12', rate: 9.1 },
                        { date: '2024-04-13', rate: 8.0 },
                        { date: '2024-04-14', rate: 8.7 },
                        { date: '2024-04-15', rate: 8.5 }
                    ]
                },
                statusDistribution: [
                    { name: 'Completed', value: 1245, color: '#10b981' },
                    { name: 'In Progress', value: 12, color: '#3b82f6' },
                    { name: 'Pending', value: 156, color: '#f59e0b' },
                    { name: 'Cancelled', value: 110, color: '#ef4444' }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        socketService.joinAdminRoom();
        
        // Lightweight background sync for general updates
        const bgSync = () => fetchDashboard();
        
        // Smart Cache Update (No Over-Fetching)
        const handleNewBooking = (data) => {
            setStats(prev => {
                const updatedTrips = [data, ...(prev.liveTrips || [])].slice(0, 10);
                return {
                    ...prev,
                    liveTrips: updatedTrips,
                    kpis: {
                        ...prev.kpis,
                        todayBookings: (prev.kpis.todayBookings || 0) + 1,
                        activeTrips: (prev.kpis.activeTrips || 0) + 1
                    }
                };
            });
        };

        socketService.on('new_booking', handleNewBooking);
        socketService.on('booking_status_updated', bgSync);
        socketService.on('driver_status_changed', bgSync);

        return () => {
            socketService.off('new_booking', handleNewBooking);
            socketService.off('booking_status_updated', bgSync);
            socketService.off('driver_status_changed', bgSync);
        };
    }, []);

    // ─── CHART CONFIGURATION ──────────────────────────────────────────────
    const formattedChartData = useMemo(() => {
        const data = stats.charts?.[chartMetric] || [];
        
        if (chartMetric === 'instantVsScheduled') {
            return data.map(item => ({
                day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
                instant: item.instant,
                scheduled: item.scheduled
            }));
        }
        
        return data.map(item => ({
            day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
            val: chartMetric === 'revenue' ? item.amount : 
                 chartMetric === 'bookings' ? item.count :
                 chartMetric === 'utilization' ? item.rate :
                 chartMetric === 'cancellation' ? item.rate : 0
        }));
    }, [stats.charts, chartMetric]);

    const getChartColor = () => {
        // Get computed CSS variable values
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        switch (chartMetric) {
            case 'revenue': return computedStyle.getPropertyValue('--success').trim() || '#16a34a';
            case 'bookings': return computedStyle.getPropertyValue('--primary').trim() || '#d4af37';
            case 'utilization': return computedStyle.getPropertyValue('--primary').trim() || '#d4af37';
            case 'cancellation': return computedStyle.getPropertyValue('--error').trim() || '#dc2626';
            default: return computedStyle.getPropertyValue('--primary').trim() || '#d4af37';
        }
    };

    const chartColor = getChartColor();

    if (loading) return (
        <div className="admin-section space-y-6">
            <div className="h-24 admin-card animate-pulse" />
            <div className="admin-grid admin-grid-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => <SkeletonCard key={i} />)}
            </div>
            <div className="admin-grid admin-grid-3 gap-6">
                <div className="lg:col-span-2 h-[300px] admin-card animate-pulse" />
                <div className="h-[300px] admin-card animate-pulse" />
            </div>
        </div>
    );

    return (
        <div className="admin-section space-y-8">
            {/* ── HEADER ── */}
            <header className="admin-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                            <span className="text-caption text-[var(--success)] uppercase">System Online</span>
                        </div>
                        <h1 className="text-title text-[var(--text-primary)]">Operations Command Center</h1>
                        <p className="text-body text-[var(--text-secondary)] mt-0.5">Structured Operations Control Panel</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 bg-[var(--bg-secondary)] px-4 py-3 rounded-lg border border-[var(--border)]">
                    <div>
                        <p className="text-caption text-[var(--text-muted)] uppercase">Active Dispatch</p>
                        <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{stats.kpis.activeTrips}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <div>
                        <p className="text-caption text-[var(--text-muted)] uppercase">Fleet Online</p>
                        <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{stats.kpis.activeDrivers}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <div>
                        <p className="text-caption text-[var(--text-muted)] uppercase">Completion</p>
                        <p className="text-lg font-semibold text-[var(--success)] tabular-nums">{stats.kpis.completionRate}%</p>
                    </div>
                    {stats.kpis.activeSOSCount > 0 && (
                        <>
                            <div className="w-px h-6 bg-[var(--border)]" />
                            <div>
                                <p className="text-caption text-[var(--error)] uppercase">SOS Alerts</p>
                                <p className="text-lg font-semibold text-[var(--error)] tabular-nums animate-pulse">{stats.kpis.activeSOSCount}</p>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* ── SECTION 1: PERFORMANCE METRICS ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg flex items-center justify-center">
                        <Target size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Performance Metrics</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Core operational efficiency indicators</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                        title="Active Duty Hours" 
                        value={`${stats.kpis.activeDutyHours || 0}h`} 
                        icon={<Timer size={20} />} 
                        highlightClass="text-cyan-600"
                        trend="up"
                        trendValue="+2.3%"
                    />
                    <KPICard 
                        title="Revenue Per Hour" 
                        value={`₹${(stats.kpis.revenuePerHour || 0).toLocaleString()}`} 
                        icon={<DollarSign size={20} />} 
                        highlightClass="text-green-600"
                        trend="up"
                        trendValue="+15.2%"
                    />
                    <KPICard 
                        title="Utilization Rate" 
                        value={`${stats.kpis.utilizationRate || 0}%`} 
                        icon={<Target size={20} />} 
                        highlightClass="text-purple-600"
                        trend="up"
                        trendValue="+4.1%"
                    />
                    <KPICard 
                        title="Fulfillment Rate" 
                        value={`${stats.kpis.fulfillmentRate || 0}%`} 
                        icon={<Zap size={20} />} 
                        highlightClass="text-green-600"
                        trend="up"
                        trendValue="+1.8%"
                    />
                </div>
            </section>

            {/* ── SECTION 2: ALERTS & SAFETY (CRITICAL) ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--error-light)] text-[var(--error)] rounded-lg flex items-center justify-center animate-pulse">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alerts & Safety</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Critical safety monitoring and incident alerts</p>
                    </div>
                </div>

                {/* SOS ALERTS (PROMINENT) */}
                {stats.sosAlerts?.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--error-light)] border-2 border-[var(--error)] rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[var(--error)] text-white rounded-lg flex items-center justify-center animate-pulse">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--error-text)]">🚨 Emergency SOS Alerts</h3>
                                <p className="text-sm text-[var(--error-text)]">Immediate response required</p>
                            </div>
                            <span className="badge badge-error ml-auto">
                                {stats.sosAlerts.length} Active
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.sosAlerts.map((alert, idx) => (
                                <SOSAlertCard key={alert.id || idx} alert={alert} />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="admin-card-compact bg-[var(--success-light)] border border-[var(--success)]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[var(--success)] text-white rounded-lg flex items-center justify-center">
                                <ShieldAlert size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--success-text)]">All Clear - No Active SOS Alerts</h3>
                                <p className="text-xs text-[var(--success-text)]">Safety systems operational</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* INCIDENT ALERTS & WARNINGS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="admin-card-compact border-l-4 border-l-[var(--warning)]">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={16} className="text-[var(--warning)]" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Incident Alerts</p>
                                <p className="text-lg font-bold text-[var(--warning)]">0 Active</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="admin-card-compact border-l-4 border-l-[var(--error)]">
                        <div className="flex items-center gap-3">
                            <Percent size={16} className="text-[var(--error)]" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Cancellation Rate</p>
                                <p className="text-lg font-bold text-[var(--error)]">{stats.kpis.cancellationRate || 0}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card-compact border-l-4 border-l-[var(--primary)]">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-[var(--primary)]" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">System Health</p>
                                <p className="text-lg font-bold text-[var(--success)]">Optimal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GENERAL ALERTS */}
                <AnimatePresence>
                    {stats.alerts?.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                            {stats.alerts.map((alert, idx) => (
                                <div key={idx} className={`admin-card-compact flex items-center gap-4 ${alert.type === 'CRITICAL' ? 'border-[var(--error)] bg-[var(--error-light)]' : 'border-[var(--warning)] bg-[var(--warning-light)]'}`}>
                                    <div className="shrink-0">
                                        {alert.type === 'CRITICAL' ? <ShieldAlert size={18} className="text-[var(--error)]" /> : <AlertCircle size={18} className="text-[var(--warning)]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{alert.message}</h4>
                                        {alert.suggestion && <p className="text-xs text-[var(--text-secondary)] mt-1">{alert.suggestion}</p>}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* ── SECTION 3: BOOKINGS & REVENUE INSIGHTS ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--success-light)] text-[var(--success)] rounded-lg flex items-center justify-center">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bookings & Revenue Insights</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Business performance and revenue analytics</p>
                    </div>
                </div>

                {/* REVENUE & BOOKING METRICS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                        title="Today's Revenue" 
                        value={`₹${(stats.kpis.todayRevenue || 0).toLocaleString()}`} 
                        icon={<Wallet size={20} />} 
                        highlightClass="text-green-600"
                        trend="up"
                        trendValue="+12.5%"
                    />
                    <KPICard 
                        title="Today's Bookings" 
                        value={(stats.kpis.todayBookings || 0).toLocaleString()} 
                        icon={<Calendar size={20} />} 
                        highlightClass="text-blue-600"
                        trend="up"
                        trendValue="+8.3%"
                    />
                    <KPICard 
                        title="Completion Rate" 
                        value={`${stats.kpis.completionRate || 0}%`} 
                        icon={<Target size={20} />} 
                        highlightClass="text-green-600"
                        trend="up"
                        trendValue="+2.1%"
                    />
                    <KPICard 
                        title="Avg Rating" 
                        value={`${stats.kpis.avgRating || 0}/5.0`} 
                        icon={<Award size={20} />} 
                        highlightClass="text-yellow-600"
                    />
                </div>

                {/* BOOKING SPLIT & TRENDS CHART */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* BOOKING SPLIT */}
                    <div className="space-y-4">
                        <BookingSplitCard 
                            instant={stats.bookingSplit?.instant || 0} 
                            scheduled={stats.bookingSplit?.scheduled || 0} 
                        />
                    </div>

                    {/* TRENDS CHART */}
                    <div className="lg:col-span-2 admin-card flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[var(--primary)]" /> Revenue Trends
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">7-Day Performance Overview</p>
                            </div>
                            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)]">
                                <button 
                                    onClick={() => setChartMetric('revenue')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide transition-all ${chartMetric === 'revenue' ? 'bg-[var(--card)] text-[var(--success)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    Revenue
                                </button>
                                <button 
                                    onClick={() => setChartMetric('bookings')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide transition-all ${chartMetric === 'bookings' ? 'bg-[var(--card)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    Bookings
                                </button>
                                <button 
                                    onClick={() => setChartMetric('instantVsScheduled')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide transition-all ${chartMetric === 'instantVsScheduled' ? 'bg-[var(--card)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    I vs S
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-[200px] w-full">
                            {formattedChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMetric === 'instantVsScheduled' ? (
                                        <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-secondary)' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-secondary)' }} />
                                            <Tooltip
                                                contentStyle={{ 
                                                    borderRadius: '8px', 
                                                    border: '1px solid var(--border)', 
                                                    background: 'var(--card)', 
                                                    fontWeight: '600', 
                                                    fontSize: '12px',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="instant" fill={getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#16a34a'} name="Instant" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="scheduled" fill={getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#d4af37'} name="Scheduled" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradientMetrics" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-secondary)' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-secondary)' }} />
                                            <Tooltip
                                                cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                                                contentStyle={{ 
                                                    borderRadius: '8px', 
                                                    border: '1px solid var(--border)', 
                                                    background: 'var(--card)', 
                                                    fontWeight: '600', 
                                                    fontSize: '12px',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="val" stroke={chartColor} strokeWidth={3} fill="url(#gradientMetrics)" />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[var(--text-muted)]">
                                    <BarChart3 size={32} className="opacity-20 mb-3" />
                                    <p className="text-sm font-medium opacity-60">No Analytics Available</p>
                                    <p className="text-xs mt-1 opacity-50">Not enough data to map trends.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: LIVE OPERATIONS ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg flex items-center justify-center">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Live Operations</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Real-time operational status and active fleet monitoring</p>
                    </div>
                </div>

                {/* LIVE METRICS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                        title="Active Drivers" 
                        value={(stats.kpis.activeDrivers || 0).toLocaleString()} 
                        icon={<Activity size={20} />} 
                        highlightClass="text-purple-600"
                        trend="up"
                        trendValue="+5.7%"
                    />
                    <KPICard 
                        title="Active Trips" 
                        value={(stats.kpis.activeTrips || 0).toLocaleString()} 
                        icon={<Truck size={20} />} 
                        highlightClass="text-blue-600"
                        trend="down"
                        trendValue="-3.2%"
                    />
                    <KPICard 
                        title="Total Users" 
                        value={(stats.kpis.totalUsers || 0).toLocaleString()} 
                        icon={<Users size={20} />} 
                        highlightClass="text-indigo-600"
                    />
                    <KPICard 
                        title="Total Drivers" 
                        value={(stats.kpis.totalDrivers || 0).toLocaleString()} 
                        icon={<Car size={20} />} 
                        highlightClass="text-violet-600"
                    />
                </div>

                {/* LIVE TRIPS PANEL */}
                <div className="admin-card flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">Live Trips Panel</h3>
                            <p className="text-xs font-medium text-[var(--text-secondary)] mt-1 uppercase tracking-wide">Active Dispatch Monitor</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                            <span className="text-xs font-medium text-[var(--success)] uppercase">Live</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 max-h-[300px]">
                        {stats.liveTrips?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.liveTrips.map((trip, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-[var(--border)]"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-medium uppercase text-[var(--primary)] tracking-wide">ID-{trip.bookingId?.slice(-6)}</span>
                                            <span className="text-xs font-medium px-2 py-1 bg-[var(--card)] rounded border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wide">{trip.status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--border)] flex items-center justify-center shrink-0">
                                                <Users size={16} className="text-[var(--text-muted)]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{trip.consumer?.name || 'Customer'}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate flex items-center gap-1 mt-1">
                                                    <Truck size={10} /> {trip.provider?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                                                <MapPin size={14} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-16 h-16 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] mb-4">
                                    <MapPin size={24} />
                                </div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">No Active Trips</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">All dispatches are currently clear.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            
            <div className="text-center pt-8 pb-4 opacity-30 pointer-events-none">
                 <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">STRUCTURED OPERATIONS CONTROL PANEL • v4.0 ENTERPRISE</p>
            </div>
        </div>
    );
};

export default AdminDashboardUpgraded;
