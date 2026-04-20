import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Search,
    RefreshCw,
    User,
    MapPin,
    Clock,
    DollarSign,
    Shield,
    UserPlus,
    X,
    Eye,
    CheckCircle,
    AlertTriangle,
    Info,
    Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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
            console.log('[Admin Operations] Booking status updated:', data);
            setBookings(prev => prev.map(b =>
                b._id === data.bookingId ? { ...b, status: data.status, ...data } : b
            ));
            toast.success(`Booking ${data.bookingId} status: ${data.status}`);
        });

        // Listen for new bookings
        socketService.on('new_booking_broadcast', (data) => {
            console.log('[Admin Operations] New booking:', data);
            if (data.booking?.service?.type === 'sparedriver' || data.booking?.provider?.type === 'sparedriver') {
                setBookings(prev => [data.booking, ...prev]);
                toast.success('New chauffeur booking received!', {
                    icon: '🚗',
                    duration: 4000
                });
            }
        });

        // Listen for driver assignments
        socketService.on('driver_assigned', (data) => {
            console.log('[Admin Operations] Driver assigned:', data);
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
            console.error('Failed to load bookings:', error);
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
        loadAvailableDrivers(); // Load drivers when modal opens
    };

    const openBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingModal(true);
    };

    const handleReassignDriver = (booking) => {
        setSelectedBooking(booking);
        setAssignModalOpen(true);
        loadAvailableDrivers(); // Load drivers when modal opens
    };

    const calculateOvertime = (booking) => {
        if (!booking.actualStartTime || !booking.actualEndTime) return 0;
        const planned = booking.plannedDuration;
        const actual = booking.timeTracking.serviceTime;
        return Math.max(0, actual - planned);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-[var(--warning)] bg-[var(--warning-light)] border-[var(--warning)]';
            case 'NORMAL': return 'text-[var(--primary)] bg-[var(--primary-light)] border-[var(--primary)]';
            default: return 'text-[var(--text-muted)] bg-[var(--bg-secondary)] border-[var(--border)]';
        }
    };

    // 🚀 Real Driver Assignment with API Integration
    const loadAvailableDrivers = async () => {
        setLoadingDrivers(true);
        try {
            const res = await adminAPI.getSpareDrivers();
            if (res.status === 'success') {
                // Filter only ACTIVE and APPROVED drivers
                const activeDrivers = (res.data.drivers || []).filter(d =>
                    d.status === 'ACTIVE' &&
                    d.verificationStatus === 'APPROVED' &&
                    d.onlineStatus?.isOnline
                );
                setAvailableDrivers(activeDrivers);
            }
        } catch (error) {
            console.error('Failed to load drivers:', error);
            toast.error('Failed to load available drivers');
            setAvailableDrivers([]);
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleAssignDriver = async (driver) => {
        if (!selectedBooking || !driver) return;

        try {
            const bookingId = selectedBooking._id;

            // Call real API to assign driver
            await adminAPI.assignCaptain(bookingId, driver._id);

            // Update local state
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? {
                    ...b,
                    provider: { id: driver, name: driver.name },
                    status: 'assigned'
                } : b
            ));

            toast.success(`Driver ${driver.name} assigned successfully`);
            setAssignModalOpen(false);
            setSelectedBooking(null);

            // Reload bookings to get fresh data
            loadBookings();
        } catch (error) {
            console.error('Driver assignment failed:', error);
            toast.error(error.response?.data?.message || 'Failed to assign driver');
        }
    };

    // 🚀 Auto-Assignment Function
    const handleAutoAssign = async (booking) => {
        try {
            const res = await adminAPI.triggerAutoAssign(booking._id);

            if (res.status === 'success') {
                toast.success(`🤖 Auto-assigned: ${res.data.driver.name}`, {
                    duration: 4000
                });

                // Update local state
                setBookings(prev => prev.map(b =>
                    b._id === booking._id ? {
                        ...b,
                        provider: {
                            id: res.data.driver,
                            name: res.data.driver.name
                        },
                        status: 'assigned'
                    } : b
                ));

                // Reload bookings to get fresh data
                loadBookings();
            }
        } catch (error) {
            console.error('Auto-assignment failed:', error);
            toast.error(error.response?.data?.message || 'Auto-assignment failed');
        }
    };

    const filteredBookings = bookings.filter(b => {
        // Map backend data structure to display structure
        const bookingId = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.user?.name || '';
        const customerPhone = b.consumer?.phone || b.user?.phone || '';
        const serviceName = b.service?.name || b.serviceName || '';
        const location = b.location?.address?.street || b.location?.address || '';
        const assignedDriver = b.provider?.id?.name || b.provider?.name || '';
        const amount = b.pricing?.totalAmount || b.amount || 0;
        const status = (b.status || '').toUpperCase();

        const matchesSearch =
            bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            serviceName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'amber';
            case 'ASSIGNED': return 'blue';
            case 'IN_PROGRESS': return 'purple';
            case 'COMPLETED': return 'emerald';
            default: return 'slate';
        }
    };

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header Control Panel */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Booking Operations</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wide">Live Order Management</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="flex-1 lg:w-64 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-[var(--primary)] transition-all">
                            <Search size={14} className="text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                className="bg-transparent outline-none text-sm font-medium text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-11 px-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button
                            onClick={loadBookings}
                            className="w-11 h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all "
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setShowAdvancedView(!showAdvancedView)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${showAdvancedView
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                                }`}
                        >
                            <Clock size={14} />
                            {showAdvancedView ? 'Basic View' : 'Advanced View'}
                        </button>

                        <button
                            onClick={() => window.open('/admin/dispatch-engine', '_blank')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                            <Database size={14} />
                            Dispatch Engine
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Bookings', value: bookings.length, icon: <Briefcase size={18} />, colorClass: 'text-[var(--primary)] bg-[var(--primary-light)]' },
                    { label: 'Pending', value: bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING').length, icon: <Clock size={18} />, colorClass: 'text-[var(--warning)] bg-[var(--warning-light)]' },
                    { label: 'In Progress', value: bookings.filter(b => (b.status || '').toUpperCase() === 'IN_PROGRESS').length, icon: <RefreshCw size={18} />, colorClass: 'text-[var(--info)] bg-[var(--info-light)]' },
                    { label: 'Completed', value: bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length, icon: <Shield size={18} />, colorClass: 'text-[var(--success)] bg-[var(--success-light)]' },
                    { label: 'Overtime Jobs', value: bookings.filter(b => (b.overtimeMinutes || 0) > 0).length, icon: <DollarSign size={18} />, colorClass: 'text-[var(--error)] bg-[var(--error-light)]' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] "
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bookings Table */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]  overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left table-fixed border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Booking Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Service</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Status</th>
                                {showAdvancedView && (
                                    <>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Time Tracking</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Overtime</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">Priority</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Assigned Driver</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? "8" : "6"} className="px-5 py-24 text-center">
                                        <div className="w-10 h-10 mx-auto border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={showAdvancedView ? "8" : "6"} className="px-5 py-24 text-center">
                                        <Shield className="mx-auto opacity-20 mb-3" size={32} />
                                        <p className="text-sm font-semibold text-[var(--text-muted)]">No bookings found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => {
                                    // Map backend data structure to display structure
                                    const bookingId = booking.bookingId || booking._id?.substring(0, 8).toUpperCase() || 'N/A';
                                    const customerName = booking.consumer?.name || booking.user?.name || 'Unknown Customer';
                                    const customerPhone = booking.consumer?.phone || booking.user?.phone || 'N/A';
                                    const serviceName = booking.service?.name || booking.serviceName || 'Unknown Service';
                                    const location = booking.location?.address?.street || booking.location?.address || 'N/A';
                                    const assignedDriver = booking.provider?.id?.name || booking.provider?.name || null;
                                    const amount = booking.pricing?.totalAmount || booking.amount || 0;
                                    const scheduledTime = booking.schedule?.startTime
                                        ? new Date(booking.schedule.startTime).toLocaleString()
                                        : new Date(booking.createdAt).toLocaleString();
                                    const status = (booking.status || 'pending').toUpperCase();
                                    const priority = booking.priority || 'NORMAL';
                                    const plannedDuration = booking.schedule?.duration || booking.estimatedDuration || 60;
                                    const overtimeMinutes = booking.overtimeMinutes || 0;

                                    return (
                                        <motion.tr
                                            key={booking._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-white/[0.02] transition-all duration-300"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-sm border border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all flex items-center justify-center">
                                                        <Briefcase size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] font-mono leading-none mb-1">{bookingId}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={10} className="text-[var(--text-muted)]" />
                                                            <p className="text-xs font-medium text-[var(--text-muted)]">{scheduledTime}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-sm border border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all flex items-center justify-center uppercase">
                                                        {customerName[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] capitalize leading-none mb-1">{customerName}</p>
                                                        <p className="text-xs font-medium text-[var(--text-muted)]">{customerPhone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{serviceName}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={10} className="text-[var(--text-muted)]" />
                                                        <p className="text-xs font-medium text-[var(--text-muted)] truncate">{location}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign size={10} className="text-[var(--primary)]" />
                                                        <p className="text-xs font-semibold text-[var(--primary)]">₹{amount}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${status === 'PENDING' ? 'bg-[var(--warning-light)] text-[var(--warning-text)] border-[var(--warning)]' :
                                                        status === 'ASSIGNED' ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]' :
                                                            status === 'IN_PROGRESS' ? 'bg-[var(--info-light)] text-[var(--info-text)] border-[var(--info)]' :
                                                                status === 'COMPLETED' ? 'bg-[var(--success-light)] text-[var(--success-text)] border-[var(--success)]' :
                                                                    'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                                                    }`}>
                                                    {status.replace('_', ' ')}
                                                </div>
                                            </td>
                                            {showAdvancedView && (
                                                <>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="text-center">
                                                                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                                                                    {booking.timeTracking?.serviceTime || booking.estimatedDuration || plannedDuration}min
                                                                </p>
                                                                <p className="text-xs text-[var(--text-muted)]">
                                                                    of {plannedDuration}min
                                                                </p>
                                                            </div>
                                                            {status === 'IN_PROGRESS' && (
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-[var(--primary)] h-2 rounded-full transition-all"
                                                                        style={{ width: `${Math.min(100, ((booking.timeTracking?.serviceTime || 0) / plannedDuration) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {overtimeMinutes > 0 ? (
                                                                <>
                                                                    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--error-light)] border border-[var(--error)] rounded-lg">
                                                                        <Clock size={12} className="text-[var(--error)]" />
                                                                        <span className="text-sm font-semibold text-[var(--error-text)]">
                                                                            +{overtimeMinutes}min
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-red-500 font-semibold">Overtime</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--success-light)] border border-[var(--success)] rounded-lg">
                                                                        <CheckCircle size={12} className="text-[var(--success)]" />
                                                                        <span className="text-sm font-semibold text-[var(--success-text)]">On Time</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(priority)}`}>
                                                            {priority === 'URGENT' && <AlertTriangle size={10} />}
                                                            {priority}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-6 py-4">
                                                {assignedDriver ? (
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-[var(--primary)]" />
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{assignedDriver}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium text-[var(--text-muted)] italic">Not assigned</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 pr-10">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openBookingDetails(booking)}
                                                        className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        <Eye size={12} />
                                                        Details
                                                    </button>
                                                    {!assignedDriver && status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => openAssignModal(booking)}
                                                                className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success)] hover:bg-[var(--success)] hover:text-white transition-all flex items-center gap-1.5"
                                                            >
                                                                <UserPlus size={12} />
                                                                Assign
                                                            </button>
                                                            <button
                                                                onClick={() => handleAutoAssign(booking)}
                                                                className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--info-light)] text-[var(--info-text)] border border-[var(--info)] hover:bg-[var(--info)] hover:text-white transition-all flex items-center gap-1.5"
                                                            >
                                                                <Database size={12} />
                                                                Auto
                                                            </button>
                                                        </>
                                                    )}
                                                    {assignedDriver && status !== 'COMPLETED' && (
                                                        <button
                                                            onClick={() => handleReassignDriver(booking)}
                                                            className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning)] hover:bg-[var(--warning)] hover:text-white transition-all flex items-center gap-1.5"
                                                        >
                                                            <RefreshCw size={12} />
                                                            Reassign
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Driver Modal */}
            <AnimatePresence>
                {assignModalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAssignModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-[var(--card)] w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-[var(--border)]"
                        >
                            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                                        {selectedBooking.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
                                    </h2>
                                    <p className="text-sm text-[var(--primary)] font-semibold">Booking {selectedBooking.id}</p>
                                </div>
                                <button
                                    onClick={() => setAssignModalOpen(false)}
                                    className="w-10 h-10 bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                                {loadingDrivers ? (
                                    <div className="py-12 text-center">
                                        <div className="w-10 h-10 mx-auto border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
                                        <p className="text-sm font-semibold text-white/40 mt-4">Loading available drivers...</p>
                                    </div>
                                ) : availableDrivers.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <AlertTriangle className="mx-auto text-[var(--warning)] mb-3" size={48} />
                                        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Drivers Available</h4>
                                        <p className="text-sm text-[var(--text-muted)]">All drivers are currently offline or busy</p>
                                    </div>
                                ) : (
                                    availableDrivers.map((driver) => (
                                        <button
                                            key={driver._id}
                                            onClick={() => handleAssignDriver(driver)}
                                            className="w-full p-4 bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] border border-[var(--border)] hover:border-[var(--primary)] rounded-xl text-left transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] group-hover:bg-[var(--primary)] text-[var(--primary)] group-hover:text-white font-bold text-sm flex items-center justify-center uppercase transition-all">
                                                    {driver.name[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{driver.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-medium text-[var(--text-muted)]">{driver.phone}</span>
                                                        {driver.onlineStatus?.isOnline && (
                                                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                Online
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {driver.reliabilityScore?.score && (
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-[var(--primary)]">{driver.reliabilityScore.score}%</p>
                                                        <p className="text-xs text-[var(--text-muted)]">Reliability</p>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Booking Details Modal */}
            <AnimatePresence>
                {showBookingModal && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBookingModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-[var(--card)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-[var(--border)]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white font-bold text-lg flex items-center justify-center">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono">{selectedBooking.id}</h2>
                                        <p className="text-sm text-[var(--text-secondary)] font-semibold">{selectedBooking.service}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="w-10 h-10 bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                                <div className="flex">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
                                        { id: 'tracking', label: 'Time Tracking', icon: <Clock size={16} /> },
                                        { id: 'driver', label: 'Driver Info', icon: <User size={16} /> }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === tab.id
                                                    ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary-light)]'
                                                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                                                }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Booking Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Booking ID:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{selectedBooking.id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Service:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.service}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Amount:</span>
                                                        <span className="text-sm font-bold text-[var(--primary)]">₹{selectedBooking.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Scheduled:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.scheduledTime}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Priority:</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedBooking.priority)}`}>
                                                            {selectedBooking.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Customer Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Name:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.customer}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Phone:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.customerPhone}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-semibold text-[var(--text-muted)]">Location:</span>
                                                        <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'tracking' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Time Tracking Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-[var(--primary-light)] border border-[var(--primary)] rounded-xl p-4 text-center">
                                                <h4 className="text-sm font-bold text-[var(--primary)] mb-2">Planned Duration</h4>
                                                <p className="text-2xl font-bold text-[var(--primary)]">{selectedBooking.plannedDuration}min</p>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                                                <h4 className="text-sm font-bold text-purple-900 mb-2">Actual Duration</h4>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {selectedBooking.timeTracking.serviceTime || selectedBooking.estimatedDuration}min
                                                </p>
                                            </div>
                                            <div className={`border rounded-xl p-4 text-center ${selectedBooking.overtimeMinutes > 0
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-emerald-50 border-emerald-200'
                                                }`}>
                                                <h4 className={`text-sm font-bold mb-2 ${selectedBooking.overtimeMinutes > 0 ? 'text-red-900' : 'text-emerald-900'
                                                    }`}>Overtime</h4>
                                                <p className={`text-2xl font-bold ${selectedBooking.overtimeMinutes > 0 ? 'text-red-600' : 'text-emerald-600'
                                                    }`}>
                                                    {selectedBooking.overtimeMinutes > 0 ? `+${selectedBooking.overtimeMinutes}min` : 'On Time'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-md font-bold text-[var(--text-primary)]">Time Breakdown</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Travel Time:</span>
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.timeTracking.travelTime}min</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Service Time:</span>
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.timeTracking.serviceTime}min</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Waiting Time:</span>
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{selectedBooking.timeTracking.waitingTime}min</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'driver' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">Driver Assignment</h3>
                                        {selectedBooking.assignedDriver ? (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-16 h-16 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center uppercase">
                                                        {selectedBooking.assignedDriver[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-emerald-900">{selectedBooking.assignedDriver}</h4>
                                                        <p className="text-sm text-emerald-700 font-semibold">Assigned Driver</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowBookingModal(false);
                                                        handleReassignDriver(selectedBooking);
                                                    }}
                                                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCw size={14} />
                                                    Reassign Driver
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                                                <AlertTriangle className="mx-auto text-amber-500 mb-3" size={48} />
                                                <h4 className="text-lg font-bold text-amber-900 mb-2">No Driver Assigned</h4>
                                                <p className="text-sm text-amber-700 mb-4">This booking needs a driver assignment</p>
                                                <button
                                                    onClick={() => {
                                                        setShowBookingModal(false);
                                                        openAssignModal(selectedBooking);
                                                    }}
                                                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 mx-auto"
                                                >
                                                    <UserPlus size={14} />
                                                    Assign Driver
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-end">
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="px-4 py-2 bg-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:bg-[var(--card-hover)] transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminBookingsOperations;
