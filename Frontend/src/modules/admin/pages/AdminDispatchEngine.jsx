import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Search, RefreshCw, MapPin, Clock, User, Car, Target, 
    TrendingUp, Activity, CheckCircle, AlertTriangle, Eye, Settings,
    Navigation, Shield, Star, Timer, Route, Users, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import PageShell, { SectionCard, PageLoader } from '../components/PageShell';

const AdminDispatchEngine = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoAssign, setAutoAssign] = useState(true);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [dispatchStats, setDispatchStats] = useState(null);

    // 🚀 Real API Integration
    useEffect(() => {
        loadDispatchData();
        
        // Socket Integration for Real-time Updates
        socketService.joinAdminRoom();
        
        // Listen for dispatch events
        socketService.on('booking_escalation', (data) => {
            toast.error(`🚨 Booking Stuck: ${data.message}`, {
                duration: 6000
            });
            loadDispatchData(); // Refresh data
        });

        socketService.on('driver_assigned', (data) => {
            if (data.autoAssigned) {
                toast.success(`🤖 Auto-assigned: ${data.driverName}`, {
                    duration: 4000
                });
            }
            loadDispatchData(); // Refresh data
        });

        socketService.on('new_booking_broadcast', (data) => {
            if (data.booking?.service?.category === 'Chauffeur') {
                loadDispatchData(); // Refresh data
            }
        });

        return () => {
            socketService.off('booking_escalation');
            socketService.off('driver_assigned');
            socketService.off('new_booking_broadcast');
        };
    }, []);

    const loadDispatchData = async () => {
        setLoading(true);
        try {
            // Load pending bookings, available drivers, and dispatch stats
            const [pendingRes, driversRes, statsRes] = await Promise.all([
                adminAPI.getPendingBookings(),
                adminAPI.getSpareDrivers(),
                adminAPI.getDispatchStats()
            ]);

            if (pendingRes.status === 'success') {
                setPendingBookings(pendingRes.data.bookings || []);
            }

            if (driversRes.status === 'success') {
                // Filter only ACTIVE, APPROVED, ONLINE drivers
                const activeDrivers = (driversRes.data.drivers || []).filter(d => 
                    d.status === 'ACTIVE' && 
                    d.verificationStatus === 'APPROVED' &&
                    d.onlineStatus?.isOnline
                );
                setAvailableDrivers(activeDrivers);
            }

            if (statsRes.status === 'success') {
                setDispatchStats(statsRes.data.stats);
            }
        } catch (error) {
            console.error('Failed to load dispatch data:', error);
            toast.error('Failed to load dispatch data');
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (booking, driver) => {
        const bookingLat = booking.location?.address?.coordinates?.lat || booking.coordinates?.lat;
        const bookingLng = booking.location?.address?.coordinates?.lng || booking.coordinates?.lng;
        const driverLat = driver.currentLocation?.coordinates?.lat || driver.coordinates?.lat;
        const driverLng = driver.currentLocation?.coordinates?.lng || driver.coordinates?.lng;
        
        if (!bookingLat || !bookingLng || !driverLat || !driverLng) return 5.0;
        
        const R = 6371; 
        const dLat = (driverLat - bookingLat) * Math.PI / 180;
        const dLng = (driverLng - bookingLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(bookingLat * Math.PI / 180) * Math.cos(driverLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(1);
    };

    const calculateDriverScore = (booking, driver) => {
        const distance = parseFloat(calculateDistance(booking, driver));
        const distanceScore = Math.max(0, 100 - (distance * 10));
        const reliabilityScore = driver.reliabilityScore?.score || 50;
        const totalScore = (distanceScore * 0.4) + (reliabilityScore * 0.4) + (reliabilityScore * 0.2);
        return Math.round(totalScore);
    };

    const getRankedDrivers = (booking) => {
        return availableDrivers
            .map(driver => ({
                ...driver,
                distance: calculateDistance(booking, driver),
                score: calculateDriverScore(booking, driver)
            }))
            .sort((a, b) => b.score - a.score);
    };

    const handleAutoAssign = async (booking) => {
        try {
            const res = await adminAPI.triggerAutoAssign(booking._id);
            if (res.status === 'success') {
                toast.success(`🤖 Auto-assigned: ${res.data.driver.name}`);
                loadDispatchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Auto-assignment failed');
        }
    };

    const handleAssignDriver = async (bookingId, driverId, driverName) => {
        try {
            await adminAPI.assignCaptain(bookingId, driverId);
            toast.success(`Manually assigned ${driverName}`);
            loadDispatchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign driver');
        }
    };

    const filteredBookings = pendingBookings.filter(b => {
        const bookingId = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.user?.name || b.customer || '';
        const serviceName = b.service?.name || b.serviceName || '';
        
        return bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <PageShell
            title="Dispatch Command"
            subtitle="Intelligent Logistics & Neural Assignment Grid"
            icon={Zap}
            accent="amber"
            badge="Engine v5.0"
            actions={
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setAutoAssign(!autoAssign)}
                        className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                            autoAssign 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Zap size={16} className={autoAssign ? 'animate-pulse' : ''} />
                        Auto-Assign {autoAssign ? 'ON' : 'OFF'}
                    </button>
                    <button 
                        onClick={loadDispatchData}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAdvancedView(!showAdvancedView)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            showAdvancedView 
                                ? 'bg-slate-900 text-amber-500' 
                                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* ── KPI GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Pending Load', value: pendingBookings.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Active Fleet', value: availableDrivers.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Auto Success', value: dispatchStats?.autoAssignedToday || 0, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Critical Faults', value: dispatchStats?.stuckBookings || 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' }
                    ].map((stat, idx) => (
                        <div key={idx} className={`p-6 rounded-[2rem] border border-slate-100 ${stat.bg} relative overflow-hidden group`}>
                            <div className="relative z-10">
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-20 h-20 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ── QUEUE MANAGEMENT ── */}
                    <div className="lg:col-span-8 space-y-6">
                        <SectionCard 
                            title="Deployment Queue" 
                            subtitle="Prioritized operational nodes awaiting assignment"
                            icon={Database}
                            actions={
                                <div className="relative w-64 group">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Identify mission..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-amber-500 focus:ring-0 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {loading && filteredBookings.length === 0 ? (
                                    <PageLoader />
                                ) : filteredBookings.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                        <CheckCircle size={48} className="mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Fully Deployed</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredBookings.map((booking) => (
                                            <motion.div
                                                key={booking._id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-6 bg-white rounded-[2rem] border border-slate-100 hover:border-amber-500 hover:shadow-xl transition-all group overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                <Target size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">#{booking.bookingId || booking._id?.slice(-8).toUpperCase()}</h4>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.service?.name}</p>
                                                            </div>
                                                            <div className="ml-auto md:ml-0">
                                                                <span className={`adm-badge ${booking.priority === 'URGENT' ? 'adm-badge-error' : 'adm-badge-warning'}`}>
                                                                    {booking.priority || 'NORMAL'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                                                <p className="text-xs font-black text-slate-700 uppercase">{booking.consumer?.name || 'Anonymous'}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                                                <p className="text-xs font-black text-slate-700 uppercase truncate">{booking.location?.address?.street || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col justify-between items-end gap-4 min-w-[150px]">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-slate-900 leading-none">₹{booking.pricing?.totalAmount || 0}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Valuation</p>
                                                        </div>
                                                        <button onClick={() => handleAutoAssign(booking)} className="w-full h-11 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 transition-all">
                                                            <Zap size={14} /> Auto-Deploy
                                                        </button>
                                                    </div>
                                                </div>

                                                {showAdvancedView && (
                                                    <div className="mt-6 pt-6 border-t border-slate-50">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Neural Ranked Proxies</h5>
                                                            <span className="text-[8px] text-slate-400 font-bold uppercase">Top 3 Candidates</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            {getRankedDrivers(booking).slice(0, 3).map((driver, idx) => (
                                                                <div key={driver._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-500 transition-all">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[14px] font-black text-slate-900">{driver.score}%</span>
                                                                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-400">#{idx + 1}</div>
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-slate-800 uppercase truncate mb-1">{driver.name}</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{driver.distance}km Prox</p>
                                                                    <button onClick={() => handleAssignDriver(booking._id, driver._id, driver.name)} className="w-full h-8 mt-3 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all">Deploy</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </SectionCard>
                    </div>

                    {/* ── FLEET INTELLIGENCE ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <SectionCard 
                            title="Active Fleet" 
                            subtitle="Online operational nodes in sector"
                            icon={Users}
                            noPad
                        >
                            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {availableDrivers.length === 0 ? (
                                    <div className="py-12 text-center opacity-40">
                                        <Users size={32} className="mx-auto mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Nodes</p>
                                    </div>
                                ) : (
                                    availableDrivers.map((driver) => (
                                        <div key={driver._id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-amber-500 transition-all group shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                                                        {driver.name[0]}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-black text-slate-800 uppercase truncate w-[100px]">{driver.name}</h5>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{driver.driverId}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Star size={10} className="text-amber-500 fill-current" />
                                                        <span className="text-xs font-black">{(driver.reliabilityScore?.score / 20).toFixed(1)}</span>
                                                    </div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reliability</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={10} className="text-amber-500" />
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{driver.currentLocation?.address || 'Calibrating...'}</p>
                                                </div>
                                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Trust Index</span>
                                                    <span className="text-[10px] font-black text-slate-900">{driver.reliabilityScore?.score || 50}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SectionCard>

                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                            <Database size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Grid Intelligence</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Yield (Auto)</p>
                                        <p className="text-xl font-black text-amber-500">{dispatchStats?.autoAssignedToday || 0}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Yield (Man)</p>
                                        <p className="text-xl font-black text-blue-500">{dispatchStats?.manualAssignedToday || 0}</p>
                                    </div>
                                </div>
                                <button className="w-full h-12 mt-6 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-500 transition-all">
                                    System Diagnostics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
};

export default AdminDispatchEngine;