import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import {
    Activity, Clock, Users, Wallet, ShieldAlert,
    TrendingUp, Truck, MapPin, AlertCircle, Calendar, BarChart3, Car,
    Zap, Target, Award, TrendingDown, Timer, DollarSign, Percent,
    Phone, Navigation, AlertTriangle, ChevronRight, MessageSquare, 
    Gift, Megaphone, Share2, RefreshCcw, CheckCircle2, MoreHorizontal,
    ChevronDown, X, MessageCircle, LayoutDashboard
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import PageShell, { SectionCard, PageLoader } from '../components/PageShell';

/**
 * ─── INDUSTRIAL PRO DASHBOARD ──────────────────────────────────────
 * Modernized with PageShell architecture.
 * Operational cockpit for the Clean-2-Wash ecosystem.
 */

// ── COMPONENTS ─────────────────────────────────────────────────────────────

const StatCard = ({ title, value, subValue, icon, color, trend, onClick }) => (
    <motion.div 
        whileHover={{ y: -4 }}
        onClick={onClick}
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start justify-between group transition-all hover:shadow-xl hover:border-amber-100 cursor-pointer"
    >
        <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
            {subValue && (
                <div className="flex items-center gap-1.5 pt-1">
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {subValue}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">vs last 7 days</span>
                </div>
            )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 22 })}
        </div>
    </motion.div>
);

const WidgetHeader = ({ title, actionLabel, onAction }) => (
    <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {title}
        </h3>
        {actionLabel && (
            <button onClick={onAction} className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all hover:gap-2 uppercase tracking-tighter">
                {actionLabel} <ChevronRight size={14} strokeWidth={3} />
            </button>
        )}
    </div>
);

// ── MAIN DASHBOARD ──────────────────────────────────────────────────────────

const AdminDashboardUpgraded = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await adminAPI.getDashboard();
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (err) {
            console.error("Dashboard Sync Failed", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        socketService.joinAdminRoom();
        
        const syncHandler = () => fetchDashboard(true);
        
        socketService.on('new_booking', syncHandler);
        socketService.on('sos_alert', syncHandler);
        socketService.on('booking_status_updated', syncHandler);
        
        return () => {
            socketService.off('new_booking', syncHandler);
            socketService.off('sos_alert', syncHandler);
            socketService.off('booking_status_updated', syncHandler);
        };
    }, []);

    if (loading || !stats) return <PageLoader />;

    const { kpis, charts, alertsOverview, operations, bottomRow, footer } = stats;

    return (
        <PageShell
            title="Operational Cockpit"
            subtitle="Centralized Intelligence & Network Overview"
            icon={LayoutDashboard}
            accent="amber"
            badge="Phase 4 Core"
            actions={
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                        <Calendar size={16} className="text-slate-500" />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Real-time Feed</span>
                        <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                
                {/* ── ROW 1: KPIs ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard 
                        title="Total Bookings" 
                        value={kpis.totalBookings.toLocaleString()} 
                        subValue="12.5%" trend="up"
                        icon={<Car size={20} />} color="bg-blue-600" 
                        onClick={() => navigate('/admin/bookings')}
                    />
                    <StatCard 
                        title="Total Revenue" 
                        value={`₹${kpis.totalRevenue.toLocaleString()}`} 
                        subValue="15.8%" trend="up"
                        icon={<Wallet size={20} />} color="bg-emerald-600" 
                        onClick={() => navigate('/admin/finance/transactions')}
                    />
                    <StatCard 
                        title="Active Fleet" 
                        value={kpis.activeDrivers} 
                        subValue="8.2%" trend="up"
                        icon={<Users size={20} />} color="bg-indigo-600" 
                        onClick={() => navigate('/admin/drivers-operations')}
                    />
                    <StatCard 
                        title="Ongoing Trips" 
                        value={kpis.ongoingTrips} 
                        subValue="5.6%" trend="up"
                        icon={<Truck size={20} />} color="bg-amber-600" 
                        onClick={() => navigate('/admin/live-tracking')}
                    />
                    <StatCard 
                        title="Cancelled" 
                        value={kpis.cancelledBookings} 
                        subValue="3.1%" trend="down"
                        icon={<X size={20} />} color="bg-rose-600" 
                        onClick={() => navigate('/admin/bookings')}
                    />
                    <StatCard 
                        title="SOS Alerts" 
                        value={kpis.sosAlerts} 
                        subValue="14.3%" trend="down"
                        icon={<ShieldAlert size={20} />} color="bg-red-600" 
                        onClick={() => navigate('/admin/support/sos')}
                    />
                </div>

                {/* ── ROW 2: TRENDS & ALERTS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Booking Trend */}
                    <div className="lg:col-span-4">
                        <SectionCard title="Booking Volume Trend" actions={<button onClick={() => navigate('/admin/bookings')} className="text-[10px] font-black text-blue-600 uppercase">Analysis</button>}>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.bookingTrend}>
                                        <defs>
                                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" hide />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Revenue Overview */}
                    <div className="lg:col-span-3">
                        <SectionCard title="Revenue Stream" actions={<button onClick={() => navigate('/admin/finance/transactions')} className="text-[10px] font-black text-emerald-600 uppercase">Ledger</button>}>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.revenueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" hide />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Bookings by Status (Donut) */}
                    <div className="lg:col-span-2">
                        <SectionCard title="Status Matrix">
                            <div className="h-[210px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.bookingByStatus}
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={8}
                                            dataKey="count"
                                        >
                                            {charts.bookingByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-black text-slate-800">{kpis.totalBookings.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {charts.bookingByStatus.slice(0, 4).map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][i] }} />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">{s.status || s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Alerts Overview */}
                    <div className="lg:col-span-3">
                        <SectionCard title="Security Pulse" actions={<button onClick={() => navigate('/admin/support/sos')} className="text-[10px] font-black text-rose-600 uppercase">Monitor</button>}>
                            <div className="space-y-2">
                                <AlertItem icon={<ShieldAlert className="text-red-500" />} label="SOS Alerts" count={alertsOverview.sosAlerts} color="red" onClick={() => navigate('/admin/support/sos')} />
                                <AlertItem icon={<RefreshCcw className="text-amber-500" />} label="Refunds" count={alertsOverview.pendingRefunds} color="amber" onClick={() => navigate('/admin/finance/refunds')} />
                                <AlertItem icon={<MessageSquare className="text-blue-500" />} label="Tickets" count={alertsOverview.openTickets} color="blue" onClick={() => navigate('/admin/support/tickets')} />
                                <AlertItem icon={<MessageCircle className="text-purple-500" />} label="Unread" count={alertsOverview.unreadChats} color="purple" onClick={() => navigate('/admin/support/chat')} />
                                <AlertItem icon={<Award className="text-orange-500" />} label="KYC Review" count={alertsOverview.kycPending} color="orange" onClick={() => navigate('/admin/drivers/kyc')} />
                            </div>
                        </SectionCard>
                    </div>
                </div>

                {/* ── ROW 3: OPERATIONS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Recent Bookings */}
                    <div className="lg:col-span-4">
                        <SectionCard title="Recent Network Activity" noPad actions={<button onClick={() => navigate('/admin/bookings')} className="text-[10px] font-black text-slate-400 uppercase">Log</button>}>
                            <div className="adm-table-container">
                                <table className="adm-table">
                                    <tbody>
                                        {operations.recentBookings.map((b, i) => (
                                            <tr key={i} onClick={() => navigate('/admin/bookings')} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                                                <td className="py-4">
                                                    <p className="text-[11px] font-black text-slate-800">#{b.id}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(b.time).toLocaleDateString()}</p>
                                                </td>
                                                <td>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase">{b.city}</p>
                                                </td>
                                                <td className="text-right">
                                                    <p className="text-[11px] font-black text-slate-800">₹{b.amount}</p>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${b.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}>{b.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Live Trips */}
                    <div className="lg:col-span-3">
                        <SectionCard title="Live Specialists" actions={<button onClick={() => navigate('/admin/live-tracking')} className="text-[10px] font-black text-emerald-600 uppercase">Live</button>}>
                            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {operations.liveTrips.map((t, i) => (
                                    <div key={i} onClick={() => navigate('/admin/live-tracking')} className="flex items-center gap-3 cursor-pointer group hover:translate-x-1 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                            <img src={`https://ui-avatars.com/api/?name=${t.driver}&background=random`} alt="driver" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[11px] font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{t.driver}</h4>
                                                <div className="flex items-center gap-0.5 text-amber-500"><Award size={10} fill="currentColor" /> <span className="text-[10px] font-black">4.8</span></div>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold truncate uppercase tracking-widest">{t.location}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Driver Status Overview */}
                    <div className="lg:col-span-2">
                        <SectionCard title="Fleet Status">
                            <div className="h-[160px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Online', value: operations.driverStatus.online },
                                                { name: 'On Trip', value: operations.driverStatus.onTrip },
                                                { name: 'Offline', value: operations.driverStatus.offline }
                                            ]}
                                            innerRadius={45}
                                            outerRadius={60}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#94a3b8" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-black text-slate-800">{(operations.driverStatus.online + operations.driverStatus.onTrip + operations.driverStatus.offline).toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <StatusLegend dot="bg-emerald-500" label="Online" count={operations.driverStatus.online} />
                                <StatusLegend dot="bg-blue-500" label="On Trip" count={operations.driverStatus.onTrip} />
                                <StatusLegend dot="bg-slate-400" label="Offline" count={operations.driverStatus.offline} />
                            </div>
                        </SectionCard>
                    </div>

                    {/* Earnings Overview */}
                    <div className="lg:col-span-3">
                        <SectionCard title="Financial Performance" actions={<button onClick={() => navigate('/admin/finance/transactions')} className="text-[10px] font-black text-amber-600 uppercase">Ledger</button>}>
                            <div className="space-y-4">
                                <div onClick={() => navigate('/admin/finance/transactions')} className="cursor-pointer hover:translate-x-1 transition-transform"><EarningsItem label="Total Revenue" value={`₹${operations.earnings.totalRevenue.toLocaleString()}`} trend="up" /></div>
                                <div onClick={() => navigate('/admin/finance/payouts')} className="cursor-pointer hover:translate-x-1 transition-transform"><EarningsItem label="Driver Payouts" value={`₹${operations.earnings.driverPayouts.toLocaleString()}`} trend="down" /></div>
                                <div onClick={() => navigate('/admin/finance/transactions')} className="cursor-pointer hover:translate-x-1 transition-transform"><EarningsItem label="Platform Com." value={`₹${operations.earnings.platformCommission.toLocaleString()}`} trend="up" /></div>
                                <div onClick={() => navigate('/admin/finance/transactions')} className="cursor-pointer hover:translate-x-1 transition-transform"><EarningsItem label="Other Earnings" value={`₹${operations.earnings.otherEarnings.toLocaleString()}`} trend="up" /></div>
                            </div>
                        </SectionCard>
                    </div>
                </div>

                {/* ── ROW 4: MANAGEMENT ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Task Summary */}
                    <SectionCard title="Internal Tasks" actions={<button onClick={() => navigate('/admin/tasks')} className="text-[10px] font-black text-blue-600 uppercase">Board</button>}>
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            <TaskMiniStat label="Total" count={bottomRow.tasks.total} />
                            <TaskMiniStat label="Pending" count={bottomRow.tasks.pending} />
                            <TaskMiniStat label="Active" count={bottomRow.tasks.inProgress} />
                            <TaskMiniStat label="Done" count={bottomRow.tasks.completed} />
                        </div>
                        <div className="space-y-3">
                            {bottomRow.tasks.recent.map((t, i) => (
                                <div key={i} onClick={() => navigate('/admin/tasks')} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{t.title}</span>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{t.priority}</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Chat Support */}
                    <SectionCard title="Support Intel" actions={<button onClick={() => navigate('/admin/support/chat')} className="text-[10px] font-black text-indigo-600 uppercase">Helpdesk</button>}>
                        <div className="space-y-4 mb-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} onClick={() => navigate('/admin/support/chat')} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Case #{i}20</h4>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">{i*3}m ago</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate font-medium">Logistical assistance required...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/admin/support/chat')} className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg shadow-slate-200">Launch Helpdesk</button>
                    </SectionCard>

                    {/* Coupons / Offers */}
                    <SectionCard title="Growth Engine" actions={<button onClick={() => navigate('/admin/promotions')} className="text-[10px] font-black text-emerald-600 uppercase">Offers</button>}>
                        <div className="adm-table-container">
                            <table className="w-full">
                                <tbody className="divide-y divide-slate-50">
                                    {bottomRow.coupons.map((c, i) => (
                                        <tr key={i} onClick={() => navigate('/admin/promotions')} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5"><span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{c.code}</span></td>
                                            <td className="py-2.5"><span className="text-[10px] font-black text-emerald-600">₹{c.discount} OFF</span></td>
                                            <td className="py-2.5 text-right"><span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Active</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => navigate('/admin/promotions')} className="w-full mt-4 bg-white border border-slate-900 text-slate-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">New Campaign</button>
                    </SectionCard>

                    {/* Advertisements */}
                    <SectionCard title="Display Network" actions={<button onClick={() => navigate('/admin/promotions/ads')} className="text-[10px] font-black text-amber-600 uppercase">Ads</button>}>
                        <div className="space-y-4 mb-4">
                            {bottomRow.advertisements.map((a, i) => (
                                <div key={i} onClick={() => navigate('/admin/promotions/ads')} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-12 h-8 bg-slate-100 rounded-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                        <img src={a.image || 'https://via.placeholder.com/60x40'} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tight">{a.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] font-black text-emerald-500 uppercase">{a.status}</span>
                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{a.impressions?.toLocaleString()} Impressions</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/admin/promotions/ads')} className="w-full bg-white border border-slate-900 text-slate-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">Create Asset</button>
                    </SectionCard>
                </div>

                {/* ── ROW 5: FOOTER FEEDS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SOS Alerts (Live) */}
                    <SectionCard title="Live Emergency Feed" accent="rose">
                        <div className="space-y-4">
                            {footer.sosLive.map((s, i) => (
                                <div key={i} onClick={() => navigate('/admin/support/sos')} className="flex items-center justify-between cursor-pointer group p-3 bg-rose-50/30 rounded-2xl border border-rose-100/50 hover:bg-rose-50 transition-all">
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-black text-slate-800 group-hover:text-red-600 transition-colors uppercase tracking-tight">SOS-{s.id.slice(-4)}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-widest">{s.user} • {s.location?.city}</p>
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded-lg animate-pulse">Critical</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Refund Requests */}
                    <SectionCard title="Refund Verification" accent="amber">
                        <div className="space-y-4">
                            {footer.refundRequests.map((r, i) => (
                                <div key={i} onClick={() => navigate('/admin/finance/refunds')} className="flex items-center justify-between cursor-pointer group p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50 hover:bg-amber-50 transition-all">
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-black text-slate-800 group-hover:text-amber-600 transition-colors uppercase tracking-tight">REF-{r.id.slice(-4)}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-widest">{r.customer} • ₹{r.amount}</p>
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">Pending</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Social Media Campaigns */}
                    <SectionCard title="Engagement Metrics" accent="blue">
                        <div className="space-y-4">
                            {footer.socialCampaigns.map((c, i) => (
                                <div key={i} onClick={() => navigate('/admin/social/campaigns')} className="flex items-center justify-between cursor-pointer group p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Share2 size={14} /></div>
                                        <span className="text-[11px] font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.platform}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-800">{c.clicks.toLocaleString()} Clicks</p>
                                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{c.engagement} engagement</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </PageShell>
    );
};

// ── SUB-COMPONENTS ──

const AlertItem = ({ icon, label, count, color, onClick }) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-100"
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600 group-hover:bg-white transition-colors shadow-sm`}>{icon}</div>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{count}</span>
    </div>
);

const StatusLegend = ({ dot, label, count }) => (
    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-slate-400">{label}</span>
        </div>
        <span className="text-slate-800">{count}</span>
    </div>
);

const EarningsItem = ({ label, value, trend }) => (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="text-right">
            <p className="text-[13px] font-black text-slate-800 leading-tight tracking-tight">{value}</p>
            {trend && <div className="flex items-center justify-end gap-1 mt-0.5">
                {trend === 'up' ? <TrendingUp size={10} className="text-emerald-500" /> : <TrendingDown size={10} className="text-rose-500" />}
                <span className={`text-[8px] font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>15.8%</span>
            </div>}
        </div>
    </div>
);

const TaskMiniStat = ({ label, count }) => (
    <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 shadow-sm">
        <p className="text-[12px] font-black text-slate-800 leading-none">{count}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">{label}</p>
    </div>
);

export default AdminDashboardUpgraded;

