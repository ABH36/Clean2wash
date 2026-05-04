import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Search, RefreshCw, User, MapPin, Clock,
    DollarSign, Shield, UserPlus, X, Eye, CheckCircle,
    AlertTriangle, Info, Database, TrendingUp, Zap, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';

const AdminBookingsOperations = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    // 🚀 Real API Integration
    useEffect(() => {
        loadBookings();

        // Socket Integration for Real-time Updates
        const token = localStorage.getItem('admin_token');
        socketService.connect(token);
        socketService.joinAdminRoom();

        // Listen for booking updates
        socketService.on('booking_status_updated', (data) => {
            setBookings(prev => prev.map(b =>
                b._id === data.bookingId ? { ...b, status: data.status, ...data } : b
            ));
            toast.success(`Booking ${data.bookingId} status: ${data.status}`);
        });

        // Listen for new bookings
        socketService.on('new_booking_broadcast', (data) => {
            if (data.booking?.service?.type === 'sparedriver' || data.booking?.provider?.type === 'sparedriver') {
                setBookings(prev => [data.booking, ...prev]);
                toast.success('New chauffeur booking received!', { icon: '🚗' });
            }
        });

        // Listen for driver assignments
        socketService.on('driver_assigned', (data) => {
            loadBookings(); // Refresh to get updated data
        });

        return () => {
            socketService.off('booking_status_updated');
            socketService.off('new_booking_broadcast');
            socketService.off('driver_assigned');
        };
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSpareDriverBookings({
                status: filterStatus !== 'ALL' ? filterStatus.toLowerCase() : undefined,
                search: searchTerm || undefined,
                limit: 100
            });

            if (res.status === 'success') {
                setBookings(res.data.bookings || []);
            }
        } catch (error) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Reload when filters change
    useEffect(() => {
        loadBookings();
    }, [filterStatus]);

    const openAssignModal = (booking) => {
        setSelectedBooking(booking);
        setAssignModalOpen(true);
        loadAvailableDrivers();
    };

    const openBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingModal(true);
    };

    const handleReassignDriver = (booking) => {
        setSelectedBooking(booking);
        setAssignModalOpen(true);
        loadAvailableDrivers();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'HIGH': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'NORMAL': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const loadAvailableDrivers = async () => {
        setLoadingDrivers(true);
        try {
            const res = await adminAPI.getSpareDrivers();
            if (res.status === 'success') {
                const activeDrivers = (res.data.drivers || []).filter(d =>
                    d.status === 'ACTIVE' &&
                    d.onlineStatus?.isOnline
                );
                setAvailableDrivers(activeDrivers);
            }
        } catch (error) {
            toast.error('Failed to load available drivers');
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleAssignDriver = async (driver) => {
        if (!selectedBooking || !driver) return;

        try {
            const bookingId = selectedBooking._id;
            await adminAPI.assignCaptain(bookingId, driver._id);

            toast.success(`Driver ${driver.name} assigned successfully`);
            setAssignModalOpen(false);
            setSelectedBooking(null);
            loadBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign driver');
        }
    };

    const handleAutoAssign = async (booking) => {
        try {
            const res = await adminAPI.triggerAutoAssign(booking._id);
            if (res.status === 'success') {
                toast.success(`🤖 Auto-assigned: ${res.data.driver.name}`);
                loadBookings();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Auto-assignment failed');
        }
    };

    const filteredBookings = bookings.filter(b => {
        const bookingId = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.user?.name || '';
        const serviceName = b.service?.name || b.serviceName || '';
        const status = (b.status || '').toUpperCase();

        const matchesSearch =
            bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            serviceName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = [
        { label: 'Total Missions', value: bookings.length, icon: Briefcase, accent: 'navy' },
        { label: 'Pending Dispatch', value: bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length, icon: Clock, accent: 'amber' },
        { label: 'In Progress', value: bookings.filter(b => b.status?.toUpperCase() === 'IN_PROGRESS').length, icon: RefreshCw, accent: 'purple' },
        { label: 'Completed', value: bookings.filter(b => b.status?.toUpperCase() === 'COMPLETED').length, icon: Shield, accent: 'emerald' },
        { label: 'High Priority', value: bookings.filter(b => b.priority === 'URGENT').length, icon: AlertTriangle, accent: 'rose' }
    ];

    return (
        <PageShell
            title="Operational Cockpit"
            subtitle="Live Chauffeur Mission Control"
            icon={Briefcase}
            accent="navy"
            actions={
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => window.open('/admin/dispatch-engine', '_blank')}
                        className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Database size={14} />
                        Dispatch Engine
                    </button>
                    <button 
                        onClick={() => setShowAdvancedView(!showAdvancedView)}
                        className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
                            showAdvancedView 
                                ? 'bg-slate-900 text-amber-500 border-slate-900' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-500 hover:text-amber-500'
                        }`}
                    >
                        <Clock size={14} />
                        {showAdvancedView ? 'Standard' : 'Advanced'}
                    </button>
                </div>
            }
        >
            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {stats.map((stat, idx) => (
                    <SectionCard key={idx} noPad className="group hover:border-amber-500 transition-all cursor-default">
                        <div className="p-5 flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                <stat.icon size={18} className="text-slate-600" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{stat.value}</p>
                            </div>
                        </div>
                    </SectionCard>
                ))}
            </div>

            {/* ── MAIN WORKSPACE ── */}
            <SectionCard
                title="Logistical Grid"
                actions={
                    <div className="flex items-center gap-3">
                        <StatusTabs 
                            tabs={[
                                { label: 'All', value: 'ALL' },
                                { label: 'Pending', value: 'PENDING' },
                                { label: 'Active', value: 'IN_PROGRESS' },
                                { label: 'Finished', value: 'COMPLETED' }
                            ]}
                            active={filterStatus}
                            onChange={setFilterStatus}
                        />
                        <SearchBox 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Locate mission..."
                        />
                    </div>
                }
                noPad
            >
                <div className="adm-table-container">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Mission Entity</th>
                                <th>Consumer</th>
                                <th>Sector / Asset</th>
                                <th className="text-center">Protocol Status</th>
                                {showAdvancedView && (
                                    <>
                                        <th className="text-center">Timeline</th>
                                        <th className="text-center">Overtime</th>
                                        <th className="text-center">Priority</th>
                                    </>
                                )}
                                <th>Assigned Unit</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? 10 : 6} className="text-center py-24">
                                        <PageLoader />
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? 10 : 6}>
                                        <EmptyState 
                                            icon={Shield}
                                            title="No mission signals detected"
                                            subtitle="Check your tracking parameters or filters"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => {
                                    const bookingId = booking.bookingId || booking._id?.substring(0, 8).toUpperCase();
                                    const customerName = booking.consumer?.name || booking.user?.name || 'Unknown Entity';
                                    const status = (booking.status || 'pending').toUpperCase();
                                    const assignedDriver = booking.provider?.id?.name || booking.provider?.name || null;

                                    return (
                                        <tr key={booking._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                        <Briefcase size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-800 font-mono tracking-tight leading-none mb-1.5">{bookingId}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 border border-slate-100">
                                                        {customerName[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-black text-slate-700 truncate">{customerName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{booking.consumer?.phone || booking.user?.phone || 'NO_LINK'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="text-[12px] font-black text-slate-700">{booking.service?.name || 'Standard Drive'}</p>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={10} className="text-slate-400" />
                                                        <p className="text-[10px] font-bold text-slate-400 truncate w-32">{booking.location?.address || 'UNMAPPED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`adm-badge ${
                                                    status === 'PENDING' ? 'adm-badge-warning' :
                                                    status === 'ASSIGNED' ? 'adm-badge-info' :
                                                    status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-600' :
                                                    status === 'COMPLETED' ? 'adm-badge-success' :
                                                    'bg-slate-100 text-slate-400'
                                                } px-3 py-1.5 text-[10px]`}>
                                                    {status.replace('_', ' ')}
                                                </div>
                                            </td>
                                            {showAdvancedView && (
                                                <>
                                                    <td className="text-center">
                                                        <div className="text-[12px] font-black text-slate-700">{booking.schedule?.duration || 60}m</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className={`text-[10px] font-black ${booking.overtimeMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {booking.overtimeMinutes > 0 ? `+${booking.overtimeMinutes}m` : 'OPTIMAL'}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className={`adm-badge ${getPriorityColor(booking.priority)} px-2 py-0.5 text-[9px]`}>
                                                            {booking.priority || 'NORMAL'}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            <td>
                                                {assignedDriver ? (
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-amber-500" />
                                                        <p className="text-[12px] font-black text-slate-700">{assignedDriver}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-black text-slate-300 italic uppercase">Awaiting Unit</p>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => openBookingDetails(booking)} className="w-9 h-9 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        <Eye size={16} />
                                                    </button>
                                                    {!assignedDriver && (
                                                        <>
                                                            <button onClick={() => openAssignModal(booking)} className="w-9 h-9 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                                <UserPlus size={16} />
                                                            </button>
                                                            <button onClick={() => handleAutoAssign(booking)} className="w-9 h-9 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                                <Zap size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {/* ── ASSIGN MODAL ── */}
            <AnimatePresence>
                {assignModalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Unit Deployment</h3>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Sector: {selectedBooking.location?.address?.substring(0, 20)}...</p>
                                </div>
                                <button onClick={() => setAssignModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 max-h-96 overflow-y-auto space-y-2">
                                {loadingDrivers ? (
                                    <PageLoader />
                                ) : availableDrivers.length === 0 ? (
                                    <EmptyState icon={AlertTriangle} title="No units available" subtitle="All registered units are currently occupied" />
                                ) : (
                                    availableDrivers.map(driver => (
                                        <button key={driver._id} onClick={() => handleAssignDriver(driver)} className="w-full p-4 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-amber-500 group-hover:text-slate-900">
                                                    {driver.name[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[13px] font-black uppercase tracking-tight">{driver.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300">{driver.phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-black text-amber-500">{driver.reliabilityScore?.score || 100}%</p>
                                                <p className="text-[9px] font-black text-slate-400 group-hover:text-slate-300 uppercase">Signal</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── DETAIL MODAL ── */}
            <AnimatePresence>
                {showBookingModal && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookingModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200">
                             <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-lg">
                                        <Target size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedBooking.bookingId || 'MISSION_LOG'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{selectedBooking.service?.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBookingModal(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <SectionTitle title="Mission Logistics" />
                                    <div className="space-y-4">
                                        <DetailRow label="Strategic Status" value={selectedBooking.status} />
                                        <DetailRow label="Scheduled Signal" value={new Date(selectedBooking.createdAt).toLocaleString()} />
                                        <DetailRow label="Operation Sector" value={selectedBooking.location?.address} />
                                        <DetailRow label="Asset Valuation" value={`₹${selectedBooking.pricing?.totalAmount || 0}`} />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <SectionTitle title="Subject Intelligence" />
                                    <div className="space-y-4">
                                        <DetailRow label="Entity Name" value={selectedBooking.consumer?.name || selectedBooking.user?.name} />
                                        <DetailRow label="Secure Contact" value={selectedBooking.consumer?.phone || selectedBooking.user?.phone} />
                                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit Assignment</p>
                                            {selectedBooking.provider ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-xs">
                                                        {selectedBooking.provider.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-800 uppercase">{selectedBooking.provider.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{selectedBooking.provider.phone || 'ENCRYPTED'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] font-black text-slate-300 italic uppercase">Deployment Pending</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

const SectionTitle = ({ title }) => (
    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
        <span className="w-8 h-px bg-slate-200" />
        {title}
    </h4>
);

const DetailRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight text-right max-w-[200px]">{value}</span>
    </div>
);

export default AdminBookingsOperations;
