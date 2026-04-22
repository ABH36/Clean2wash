import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import {
    Search,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Truck,
    Navigation2,
    User,
    Package,
    ExternalLink,
    AlertCircle,
    UserCheck,
    MapPin,
    Map as MapIcon,
    List,
    ShieldAlert,
    Phone,
    Star,
    Car,
    RefreshCw,
    Zap,
    ChevronDown,
    Hash
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignmentType, setAssignmentType] = useState('pickup');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef(null);

    const fetchBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await adminAPI.getAllBookings();
            if (res.status === 'success') {
                const freshBookings = res.data.bookings || [];
                setBookings(freshBookings);
                // Keep selected booking in sync
                if (selectedBooking) {
                    const updated = freshBookings.find(b => b._id === selectedBooking._id);
                    if (updated) setSelectedBooking(updated);
                }
            }
        } catch (err) {
            console.error('Failed to load bookings', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await adminAPI.getUsers('captain');
            if (res.status === 'success') {
                setStaffList(res.data.users || []);
            }
        } catch (err) {
            console.error('Failed to load captains', err);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchStaff();

        // Socket Integration
        // Join the elite admin control room (Role-restricted on backend)
        socketService.joinAdminRoom();

        // Reactive Listeners
        const handleBookingUpdate = (data) => {
            console.log('[Admin Bookings] 📡 Booking update received:', data);
            fetchBookings(true); // Silent refresh
        };

        const handleLocationPulse = (data) => {
            console.log('[Admin Bookings] 📍 Location pulse received:', data.bookingId);
            setBookings(prev => prev.map(b => {
                if (b._id === data.bookingId || b.id === data.bookingId) {
                    return {
                        ...b,
                        driverLocation: {
                            lat: data.lat,
                            lng: data.lng,
                            lastUpdated: new Date()
                        }
                    };
                }
                return b;
            }));
        };

        socketService.on('booking_status_updated', handleBookingUpdate);
        socketService.on('new_booking', handleBookingUpdate);
        socketService.on('new_booking_broadcast', handleBookingUpdate);
        socketService.on('specialist_location_pulse', handleLocationPulse);
        socketService.on('consumer_location_pulse', (data) => {
            console.log('[Admin Bookings] 📍 Consumer pulse received:', data.bookingId);
            setBookings(prev => prev.map(b => {
                if (b._id === data.bookingId || b.id === data.bookingId) {
                    return {
                        ...b,
                        consumerLocation: {
                            lat: data.lat || data.location?.lat,
                            lng: data.lng || data.location?.lng,
                            lastUpdated: new Date()
                        }
                    };
                }
                return b;
            }));
        });
        socketService.on('SOS_EMERGENCY_ALERT', (data) => {
            console.log('[Admin SOS] 🚨 Emergency received:', data);
            toast.error(`🚨 SOS ALERT: Booking #${data.bookingId}`, {
                duration: 10000,
                position: 'top-right'
            });
            fetchBookings(true);
        });

        return () => {
            socketService.off('booking_status_updated', handleBookingUpdate);
            socketService.off('new_booking', handleBookingUpdate);
            socketService.off('new_booking_broadcast', handleBookingUpdate);
            socketService.off('specialist_location_pulse', handleLocationPulse);
            socketService.off('consumer_location_pulse');
            socketService.off('SOS_EMERGENCY_ALERT');
        };
    }, []);

    // Filter logic
    const filteredBookings = bookings.filter(b => {
        const id = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.userName || '';
        const matchesSearch =
            id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || b.service?.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]';
            case 'pickup-assigned': return 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]';
            case 'en_route': return 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]';
            case 'at-studio': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'in_progress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'quality-check': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'delivery-assigned': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-white/[0.02] text-white/60 border-white/5';
        }
    };

    const handleUpdateStatus = async (bookingId, status) => {
        try {
            await adminAPI.updateBookingStatus(bookingId, status);
            await fetchBookings(true);
            if (selectedBooking && (selectedBooking._id === bookingId || selectedBooking.id === bookingId)) {
                setSelectedBooking(prev => ({ ...prev, status }));
            }
            toast.success(`Booking status updated to ${status}`);
        } catch (err) {
            console.error('Status update failed', err);
            toast.error('Failed to update status');
        }
    };


    const handleAssign = async (captain) => {
        if (!selectedBooking) return;
        try {
            const bId = selectedBooking._id;
            // Use admin assignCaptain endpoint
            await adminAPI.assignCaptain(bId, captain._id);
            await fetchBookings(true);
            setIsAssignModalOpen(false);
            toast.success(`Captain ${captain.name} assigned successfully`);
        } catch (err) {
            console.error('Assignment failed', err);
            toast.error('Failed to assign captain');
        }
    };

    // SOS count for badge
    const sosCount = bookings.filter(b => b.issues?.some(i => i.type === 'SOS' && i.status === 'open')).length;

    return (
        <>
            <div className="space-y-6">
                {/* SOS Banner */}
                {sosCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-red-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <ShieldAlert size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm">{sosCount} Active SOS alert{sosCount > 1 ? 's' : ''}</p>
                                <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">Immediate response required</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white/5 animate-ping" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                        </div>
                    </motion.div>
                )}

                {/* Tactical Action Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner">
                        {['all', 'pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white/5 dark:bg-brand text-brand dark:text-white ' : 'text-content-subtle opacity-60 hover:opacity-100'}`}
                            >
                                {f === 'en_route' ? 'En Route' : f}
                                {f === 'all' && <span className={statusFilter === f ? "ml-1" : "ml-1 text-brand"}>{bookings.length}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-80 bg-surface border border-slate-200/60 dark:border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-3  transition-all focus-within:border-brand/50">
                            <Search size={16} className="text-brand opacity-60" />
                            <input
                                type="text"
                                placeholder="Scan payload IDs..."
                                className="bg-transparent outline-none text-xs font-black text-content w-full placeholder:text-content-subtle placeholder:opacity-30 uppercase tracking-tight"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => fetchBookings(true)}
                            className={`h-11 w-11 bg-surface border border-slate-200/60 dark:border-white/5 rounded-2xl  text-content-subtle hover:text-brand transition-all flex items-center justify-center hover:rotate-180 duration-500 ${refreshing ? 'animate-spin text-brand' : ''}`}
                        >
                            <RefreshCw size={20} />
                        </button>
                        <div className="flex bg-surface border border-slate-200/60 dark:border-white/5 p-1 rounded-2xl ">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-brand shadow-lg' : 'text-content-subtle hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                <List size={16} />
                            </button>
                            <button onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-black text-brand shadow-lg' : 'text-content-subtle hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                <MapIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Terminal Tabs */}
                <div className="flex gap-2 p-1 bg-surface border border-slate-200/60 dark:border-white/5 rounded-2xl w-fit ">
                    {['all', 'Doorstep', 'Studio', 'Chauffeur'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-brand text-white shadow-[0_10px_20px_rgba(242,159,5,0.2)]' : 'text-content-subtle hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Main Data Terminal */}
                {viewMode === 'list' ? (
                    <div className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-premium overflow-hidden">
                        <div className="admin-table-container">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">Order Node</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">User Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">Service Protocol</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">Current Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">Valuation</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loading && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-32 text-center bg-background/50 backdrop-blur-sm">
                                                <div className="w-10 h-10 mx-auto border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                                                <p className="text-[10px] mt-6 font-black text-content uppercase tracking-[0.25em] opacity-40">Synchronizing network data...</p>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredBookings.map((booking) => {
                                        const id = booking.bookingId || booking._id?.substring(0, 8).toUpperCase();
                                        const customerName = booking.consumer?.name || 'Authorized Guest';
                                        const serviceName = booking.service?.name || booking.serviceName || 'Standard Service';
                                        const captainName = booking.provider?.id?.name || booking.provider?.name;
                                        const hasSOS = booking.issues?.some(i => i.type === 'SOS' && i.status === 'open');
                                        const price = booking.price || (booking.pricing?.totalAmount ? `₹${booking.pricing.totalAmount}` : '₹0');

                                        return (
                                            <tr
                                                key={booking._id}
                                                className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all cursor-pointer group ${hasSOS ? 'bg-red-500/5' : serviceName.toLowerCase().includes('outstation') ? 'bg-brand/5' : ''}`}
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        {hasSOS && <ShieldAlert size={14} className="text-red-500 animate-pulse" />}
                                                        <div>
                                                            <p className="text-[12px] font-black text-content leading-none tracking-tight uppercase">{id}</p>
                                                            <p className="text-[9px] font-bold text-content-subtle mt-1.5 opacity-40 uppercase tracking-widest leading-none">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center font-black text-brand text-[11px] group-hover:bg-brand group-hover:text-white transition-all">
                                                            {customerName[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-black text-content leading-none truncate uppercase tracking-tight">{customerName}</p>
                                                            <p className="text-[9px] font-bold text-content-subtle mt-1.5 opacity-40 uppercase tracking-widest leading-none">{booking.consumer?.phone || 'No phone identified'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[12px] font-black text-content leading-none uppercase tracking-tight">{serviceName}</p>
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5 opacity-80">
                                                        {booking.schedule?.type === 'scheduled' ? <><Calendar size={10} /> Scheduled flow</> : <><Zap size={10} /> Instant dispatch</>}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border tracking-widest ${getStatusColor(booking.status)}`}>
                                                        {booking.status.replace(/[-_]/g, ' ')}
                                                    </span>
                                                    {captainName && (
                                                        <p className="text-[9px] font-bold text-content-subtle mt-2 opacity-40 uppercase truncate max-w-[120px]">{captainName}</p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[14px] font-black text-content tabular-nums tracking-tighter">{price}</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                                                            className="h-10 w-10 bg-slate-100 dark:bg-white/10 hover:bg-black dark:hover:bg-brand rounded-xl text-content-subtle hover:text-brand dark:hover:text-white transition-all flex items-center justify-center border border-slate-200/50 dark:border-white/5 group/link"
                                                        >
                                                            <ExternalLink size={18} className="group-hover/link:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredBookings.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-32 text-center bg-slate-50/20 dark:bg-white/[0.01]">
                                                <AlertCircle size={48} className="mx-auto text-content-subtle opacity-10 mb-6" />
                                                <h3 className="text-lg font-black text-content uppercase tracking-tight">Signal loss</h3>
                                                <p className="text-[10px] font-black text-content-subtle mt-2 uppercase tracking-widest opacity-40">No matching logistical records identified in current network bandwidth.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <LiveMapView bookings={filteredBookings} onSelectBooking={setSelectedBooking} />
                )}
            </div >

            {/* Sidebar Details Drawer */}
            < AnimatePresence >
                {selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-content/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-surface h-full relative z-10 shadow-2xl flex flex-col border-l border-slate-200/60 dark:border-white/5"
                        >
                            {/* Drawer Header */}
                            <div className="p-8 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                                <div>
                                    <h3 className="text-xl font-black text-content leading-none tracking-tight uppercase">{selectedBooking.bookingId || selectedBooking._id?.substring(0, 10).toUpperCase()}</h3>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mt-2 opacity-80">Mission payload dispatch</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-content-subtle hover:bg-black dark:hover:bg-brand hover:text-brand dark:hover:text-white transition-all"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Status Badge + Booking Type */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${getStatusColor(selectedBooking.status)}`}>
                                        {selectedBooking.status?.replace(/[-_]/g, ' ')}
                                    </span>
                                    <span className="text-[9px] font-black text-brand bg-brand/10 px-3 py-1.5 rounded-full">
                                        {selectedBooking.schedule?.type === 'scheduled' ? '📅 Scheduled' : '⚡ Instant'}
                                    </span>
                                    {selectedBooking.issues?.some(i => i.type === 'SOS' && i.status === 'open') && (
                                        <span className="text-[9px] font-black text-white bg-red-600 px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1">
                                            <ShieldAlert size={10} /> SOS active
                                        </span>
                                    )}
                                    {selectedBooking.service?.name?.toLowerCase().includes('outstation') && (
                                        <span className="text-[9px] font-black text-white bg-[var(--primary)] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-[var(--primary)]/20">
                                            <Navigation2 size={10} /> High risk mission
                                        </span>
                                    )}
                                </div>

                                {/* Customer Section */}
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] px-1 opacity-50">Unit Authority</h4>
                                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-4 group">
                                        <div className="w-11 h-11 rounded-xl bg-black text-brand flex items-center justify-center font-black text-base shadow-lg group-hover:scale-110 transition-all border border-black">
                                            {(selectedBooking.consumer?.name || 'G')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-content truncate uppercase tracking-tight">{selectedBooking.consumer?.name || 'Anonymous Entity'}</p>
                                            <p className="text-[9px] text-content-subtle font-black uppercase tracking-widest mt-1 opacity-40">{selectedBooking.consumer?.phone || 'NO SECURE LINE'}</p>
                                        </div>
                                        {selectedBooking.consumer?.phone && (
                                            <a href={`tel:${selectedBooking.consumer.phone}`} className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                                <Phone size={14} className="text-white" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Specialist/Provider Section */}
                                {(selectedBooking.provider || selectedBooking.service?.category === 'Chauffeur') && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">
                                            {selectedBooking.service?.category === 'Chauffeur' ? 'Assigned Driver' : 'Assigned Captain'}
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-[#0F172A] text-white">
                                            {selectedBooking.provider ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center font-black text-brand text-base">
                                                        {(selectedBooking.provider?.id?.name || selectedBooking.provider?.name || 'C')[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-white truncate">
                                                            {selectedBooking.provider?.id?.name || selectedBooking.provider?.name || '—'}
                                                        </p>
                                                        <p className="text-[10px] text-white/50 font-bold">
                                                            {selectedBooking.provider?.id?.phone || selectedBooking.provider?.phone || '—'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Star size={8} className="text-yellow-400" fill="currentColor" />
                                                            <span className="text-[8px] font-black text-white/60">
                                                                {selectedBooking.provider?.id?.rating || selectedBooking.provider?.rating || '—'}
                                                            </span>
                                                            <span className="text-[8px] font-black text-brand uppercase tracking-widest">{selectedBooking.provider.type}</span>
                                                        </div>
                                                    </div>
                                                    {(selectedBooking.provider?.id?.phone || selectedBooking.provider?.phone) && (
                                                        <a href={`tel:${selectedBooking.provider?.id?.phone || selectedBooking.provider?.phone}`}
                                                            className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
                                                            <Phone size={14} className="text-white" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-4 text-white/40">
                                                    <User size={24} className="mb-2 opacity-20" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No driver assigned</p>
                                                    <button
                                                        onClick={() => { setAssignmentType('driver'); setIsAssignModalOpen(true); }}
                                                        className="mt-3 px-4 py-2 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/20"
                                                    >
                                                        Assign Now
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Booking Details */}
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Booking Details</h4>
                                    <div className="space-y-2">
                                        <DetailItem icon={<Package size={14} />} label="Service" value={selectedBooking.service?.name || selectedBooking.serviceName || '—'} />
                                        <DetailItem icon={<Car size={14} />} label="Vehicle" value={[
                                            selectedBooking.vehicle?.brand,
                                            selectedBooking.vehicle?.model,
                                            selectedBooking.vehicle?.plate && `(${selectedBooking.vehicle.plate})`
                                        ].filter(Boolean).join(' ') || '—'} />
                                        <DetailItem icon={<MapPin size={14} />} label="Location" value={[
                                            selectedBooking.location?.address?.street,
                                            selectedBooking.location?.address?.city
                                        ].filter(Boolean).join(', ') || '—'} />
                                        {selectedBooking.location?.parkingDetails && (
                                            <div className="mx-1 mt-1 p-3 rounded-xl bg-brand/5 border border-brand/10 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Car size={12} className="text-brand" />
                                                    <span className="text-[9px] font-black uppercase text-brand tracking-widest">Parking logistics</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-white/20">Basement</span>
                                                        <span className="text-[11px] font-[1000] text-white uppercase">{selectedBooking.location.parkingDetails.basement || '—'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-white/20">Block</span>
                                                        <span className="text-[11px] font-[1000] text-white uppercase">{selectedBooking.location.parkingDetails.block || '—'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-white/20">Pillar</span>
                                                        <span className="text-[11px] font-[1000] text-white uppercase">{selectedBooking.location.parkingDetails.pillar || '—'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-white/20">Slot</span>
                                                        <span className="text-[11px] font-[1000] text-white uppercase">{selectedBooking.location.parkingDetails.slotNumber || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedBooking.schedule?.type === 'scheduled' ? (
                                            <>
                                                <DetailItem icon={<Calendar size={14} />} label="Date" value={selectedBooking.schedule?.date ? new Date(selectedBooking.schedule.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                                                <DetailItem icon={<Clock size={14} />} label="Time Slot" value={selectedBooking.schedule?.timeSlot ? `${selectedBooking.schedule.timeSlot.start} – ${selectedBooking.schedule.timeSlot.end}` : '—'} />
                                            </>
                                        ) : (
                                            <DetailItem icon={<Zap size={14} />} label="Booked At" value={selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'} />
                                        )}
                                        <DetailItem icon={<Hash size={14} />} label="Security PIN" value={selectedBooking.securityPin || '—'} />
                                        <DetailItem icon={<Package size={14} />} label="Initial Paid" value={`₹${selectedBooking.pricing?.initialPaidAmount || selectedBooking.pricing?.totalAmount || 0}`} />

                                        {/* ── Pricing Breakdown for Chauffeur ── */}
                                        {selectedBooking.pricing?.breakdown?.filter(b => b.amount > 0).map((item, idx) => (
                                            <div key={idx} className="mx-1 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                                <span className="text-[8px] font-black uppercase text-black/30 tracking-widest">{item.name}</span>
                                                <span className="text-[10px] font-[1000] text-white tracking-tight">+₹{item.amount}</span>
                                            </div>
                                        ))}

                                        <DetailItem icon={<Package size={14} />} label="Grand Total" value={selectedBooking.price || `₹${selectedBooking.pricing?.totalAmount || 0}`} />
                                    </div>
                                </div>

                                {/* Operational Notes (Phase 11 Sync) */}
                                {selectedBooking.notes?.internal && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">System Audit Logs</h4>
                                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                                            <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed whitespace-pre-line">{selectedBooking.notes.internal}</p>
                                        </div>
                                    </div>
                                )}

                                {/* SOS / Issues Section */}
                                {selectedBooking.issues?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <ShieldAlert size={11} /> Emergency alerts & issues
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedBooking.issues.map((issue, idx) => {
                                                const isSOS = issue.type === 'SOS';
                                                const isOpen = issue.status === 'open';
                                                return (
                                                    <div key={idx} className={`p-4 rounded-2xl border-white/5 relative overflow-hidden ${isSOS && isOpen ? 'bg-red-50 border-red-200' :
                                                        isSOS ? 'bg-white/[0.02] border-white/10' :
                                                            'bg-amber-50 border-amber-200'
                                                        }`}>
                                                        {isSOS && isOpen && (
                                                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
                                                        )}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle size={13} className={isSOS ? 'text-red-600' : 'text-amber-600'} />
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isSOS ? 'text-red-700' : 'text-amber-700'
                                                                    }`}>{issue.type || 'Issue'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${issue.status === 'open' ? 'bg-red-100 text-red-700' :
                                                                    issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                                        'bg-white/[0.05] text-white/60'
                                                                    }`}>{issue.status}</span>
                                                                <span className="text-[8px] text-content-subtle">
                                                                    {new Date(issue.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-bold text-content leading-relaxed">{issue.description}</p>
                                                        {issue.photo && (
                                                            <button onClick={() => window.open(issue.photo, '_blank')}
                                                                className="mt-3 w-full rounded-xl overflow-hidden border border-white/10 relative group">
                                                                <img src={issue.photo} className="w-full h-32 object-cover" alt="Evidence" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">View Full</span>
                                                                </div>
                                                            </button>
                                                        )}
                                                        {isOpen && (
                                                            <button
                                                                onClick={() => {
                                                                    toast.success('Issue marked resolved');
                                                                }}
                                                                className="mt-3 w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:border-green-300 hover:text-green-600 transition-all"
                                                            >
                                                                Mark as Resolved
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Command Control */}
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-[0.3em] px-1 opacity-50">Command Protocol</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 'pending', color: 'bg-amber-500' },
                                            { val: 'confirmed', color: 'bg-[var(--primary)]' },
                                            { val: 'en_route', color: 'bg-indigo-500' },
                                            { val: 'in_progress', color: 'bg-violet-500' },
                                            { val: 'completed', color: 'bg-emerald-500' },
                                            { val: 'cancelled', color: 'bg-red-500' },
                                        ].map(({ val, color }) => (
                                            <button
                                                key={val}
                                                onClick={() => handleUpdateStatus(selectedBooking._id, val)}
                                                className={`p-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all relative overflow-hidden group/btn ${selectedBooking.status === val
                                                    ? `bg-black text-brand border-black shadow-2xl shadow-black/50`
                                                    : 'bg-slate-50/50 dark:bg-white/[0.02] text-content-subtle border-slate-200/60 dark:border-white/5 hover:border-brand/50 hover:text-brand'
                                                    }`}
                                            >
                                                {selectedBooking.status === val && <div className={`absolute top-0 right-0 w-1.5 h-full ${color}`} />}
                                                {val.replace(/[-_]/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Captain Assignment for Instant bookings */}
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Assign Captain</h4>
                                    <button
                                        onClick={() => { setAssignmentType('pickup'); setIsAssignModalOpen(true); }}
                                        className="w-full p-4 rounded-2xl border-white/5 border-dashed border-white/10 bg-white/[0.02]/50 flex items-center justify-between group hover:border-brand transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User size={18} className="text-content-subtle group-hover:text-brand transition-all" />
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-content-subtle group-hover:text-brand">
                                                    {selectedBooking.provider ? 'Reassign Captain' : 'Assign Captain'}
                                                </p>
                                                {selectedBooking.provider && (
                                                    <p className="text-[9px] text-green-600 font-bold mt-0.5">
                                                        Current: {selectedBooking.provider?.id?.name || selectedBooking.provider?.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className="text-content-subtle" />
                                    </button>
                                </div>
                            </div>
                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex gap-3">
                                <button
                                    onClick={() => fetchBookings(true)}
                                    className="flex-1 h-12 bg-surface border border-slate-200/60 dark:border-white/10 text-content rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 "
                                >
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Sync Data
                                </button>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="flex-1 h-12 bg-black text-brand rounded-xl font-black text-[9px] uppercase tracking-widest hover:brightness-125 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-black/50 active:scale-95"
                                >
                                    <CheckCircle2 size={14} /> Close Terminal
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <AdminModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign captain"
            >
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest px-1">
                        Booking: {selectedBooking?.bookingId || selectedBooking?._id?.slice(-8)}
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
                        {(staffList || []).map(captain => (
                            <button
                                key={captain._id}
                                onClick={() => handleAssign(captain)}
                                className={`w-full p-4 rounded-2xl border flex items-center gap-4 hover:border-brand hover:bg-brand/5 transition-all group text-left ${selectedBooking?.provider?.id?._id === captain._id || selectedBooking?.provider?.id === captain._id
                                    ? 'border-brand bg-brand/5'
                                    : 'border-white/5 bg-white/[0.02]/30'
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-[#0F172A] flex items-center justify-center text-brand font-black text-base">
                                        {(captain.name || 'C')[0]}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-white/5 border-white ${captain.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-content leading-none truncate">{captain.name}</p>
                                    <p className="text-[9px] font-bold text-content-subtle mt-0.5">{captain.phone || '—'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${captain.isOnline ? 'bg-green-100 text-green-700' : 'bg-white/[0.05] text-white/40'
                                            }`}>
                                            {captain.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                        {captain.profile?.city && (
                                            <span className="text-[7px] font-bold text-content-subtle">{captain.profile.city}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-0.5">
                                        <Star size={9} className="text-yellow-500" fill="currentColor" />
                                        <span className="text-[10px] font-black text-content">{captain.rating || '—'}</span>
                                    </div>
                                    <UserCheck size={16} className="text-content-subtle group-hover:text-brand transition-all" />
                                </div>
                            </button>
                        ))}
                        {(!staffList || staffList.length === 0) && (
                            <div className="py-10 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                                <User size={30} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-xs font-black text-content-subtle uppercase">No captains in network</p>
                            </div>
                        )}
                    </div>
                </div>
            </AdminModal>
        </>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-all hover:bg-slate-100 dark:hover:bg-white/5">
        <div className="flex items-center gap-3">
            <div className="text-brand opacity-60 bg-brand/5 p-2 rounded-lg">{icon}</div>
            <span className="text-[9px] font-black uppercase text-content-subtle tracking-[0.2em] opacity-50">{label}</span>
        </div>
        <span className="text-[11px] font-black text-content uppercase tracking-tight">{value}</span>
    </div>
);

const AdminModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-content/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-surface w-full max-w-lg rounded-[2.5rem] shadow-premium relative z-10 overflow-hidden border border-slate-200/60 dark:border-white/5"
            >
                <div className="px-10 py-8 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-black text-content leading-none tracking-tight uppercase">{title}</h2>
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mt-2 opacity-80">Operational Authorization</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-black dark:hover:bg-brand rounded-2xl border border-slate-200 dark:border-white/10 text-content-subtle hover:text-brand dark:hover:text-white transition-all">
                        <XCircle size={20} />
                    </button>
                </div>
                <div className="p-10">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

const LiveMapView = ({ bookings, onSelectBooking }) => {
    const mapRef = React.useRef(null);
    const [map, setMap] = useState(null);
    const markersRef = React.useRef({});

    // Filter active bookings with coordinates
    const activeMappableBookings = bookings.filter(b =>
        ['pending', 'confirmed', 'assigned', 'pickup-assigned', 'en_route', 'at-studio', 'in_progress', 'quality-check', 'delivery-assigned'].includes(b.status) &&
        ((b.location?.address?.coordinates?.lat && b.location?.address?.coordinates?.lng) ||
         (b.driverLocation?.lat && b.driverLocation?.lng))
    );

    useEffect(() => {
        if (!window.google) return;

        const initMap = async () => {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: 28.6139, lng: 77.2090 }, // Default fallback
                zoom: 12,
                styles: [
                    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
                    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
                    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
                    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
                    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
                    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
                    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
                    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
                    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
                    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
                    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
                    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
                    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
                    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
                    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
                    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
                ],
                disableDefaultUI: true,
                zoomControl: true,
            });
            setMap(mapInstance);
        };

        if (mapRef.current && !map) {
            initMap();
        }
    }, [mapRef, map]);

    useEffect(() => {
        if (!map || !window.google) return;

        // Current set of active IDs
        const activeIds = new Set(activeMappableBookings.map(b => b._id || b.id));

        // 1. Remove markers for bookings no longer active
        Object.keys(markersRef.current).forEach(id => {
            if (!activeIds.has(id)) {
                markersRef.current[id].setMap(null);
                delete markersRef.current[id];
            }
        });

        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        activeMappableBookings.forEach(booking => {
            const bId = booking._id || booking.id;
            const pickupLat = booking.location?.address?.coordinates?.lat;
            const pickupLng = booking.location?.address?.coordinates?.lng;
            const driverLat = booking.driverLocation?.lat;
            const driverLng = booking.driverLocation?.lng;
            const consumerLat = booking.consumerLocation?.lat;
            const consumerLng = booking.consumerLocation?.lng;

            // 1. PICKUP MARKER (STATIC)
            // ... (rest of markers logic) ...
            if (pickupLat && pickupLng) {
                const pickupPos = { lat: pickupLat, lng: pickupLng };
                const pickupMarkerId = `${bId}_pickup`;
                
                const pickupIcon = {
                    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z M12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm2 5h-4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1z',
                    fillColor: '#ef4444', // Red for pickup (User car)
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#ffffff',
                    scale: 1.5,
                    anchor: new window.google.maps.Point(12, 12)
                };

                if (markersRef.current[pickupMarkerId]) {
                    markersRef.current[pickupMarkerId].setPosition(pickupPos);
                } else {
                    const marker = new window.google.maps.Marker({
                        position: pickupPos,
                        map,
                        icon: pickupIcon,
                        title: `Pickup: ${booking.bookingId || bId}`
                    });
                    marker.addListener('click', () => onSelectBooking(booking));
                    markersRef.current[pickupMarkerId] = marker;
                }
                bounds.extend(pickupPos);
                hasPoints = true;
            }

            // 2. DRIVER MARKER (DYNAMIC)
            if (driverLat && driverLng) {
                const driverPos = { lat: driverLat, lng: driverLng };
                const driverMarkerId = `${bId}_driver`;
                
                let color = '#2563eb'; // Blue
                if (booking.status === 'en_route') color = '#0ea5e9';
                else if (booking.status === 'in_progress') color = '#8b5cf6';

                const driverIcon = {
                    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-15c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 12h-2v-2h2v2zm0-4h-2V7h2v6z', // Alert/Target Style for driver
                    fillColor: color,
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 1.8,
                    anchor: new window.google.maps.Point(12, 12)
                };

                if (markersRef.current[driverMarkerId]) {
                    markersRef.current[driverMarkerId].setPosition(driverPos);
                    markersRef.current[driverMarkerId].setIcon(driverIcon);
                } else {
                    const marker = new window.google.maps.Marker({
                        position: driverPos,
                        map,
                        icon: driverIcon,
                        title: `Driver: ${booking.provider?.name || 'Assigned'}`
                    });
                    marker.addListener('click', () => onSelectBooking(booking));
                    markersRef.current[driverMarkerId] = marker;
                }
                bounds.extend(driverPos);
                hasPoints = true;

                // 3. POLYLINE (CONNECTION)
                if (pickupLat && pickupLng && booking.status === 'en_route') {
                    const polyId = `${bId}_poly`;
                    const path = [driverPos, { lat: pickupLat, lng: pickupLng }];
                    
                    if (markersRef.current[polyId]) {
                        markersRef.current[polyId].setPath(path);
                    } else {
                        const poly = new window.google.maps.Polyline({
                            path,
                            geodesic: true,
                            strokeColor: '#3b82f6',
                            strokeOpacity: 0.6,
                            strokeWeight: 2,
                            icons: [{
                                icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                                offset: '100%'
                            }],
                            map
                        });
                        markersRef.current[polyId] = poly;
                    }
                }
            }

            // 4. CONSUMER MARKER (DYNAMIC)
            if (consumerLat && consumerLng) {
                const consumerPos = { lat: consumerLat, lng: consumerLng };
                const consumerMarkerId = `${bId}_consumer`;
                
                const consumerIcon = {
                    path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                    fillColor: '#f59e0b', // Amber for consumer
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 1,
                    anchor: new window.google.maps.Point(12, 12)
                };

                if (markersRef.current[consumerMarkerId]) {
                    markersRef.current[consumerMarkerId].setPosition(consumerPos);
                } else {
                    const marker = new window.google.maps.Marker({
                        position: consumerPos,
                        map,
                        icon: consumerIcon,
                        title: `Consumer: ${booking.consumer?.name || 'User'}`
                    });
                    marker.addListener('click', () => onSelectBooking(booking));
                    markersRef.current[consumerMarkerId] = marker;
                }
                bounds.extend(consumerPos);
                hasPoints = true;
            }
        });

        // Soft fit bounds - only if significantly changed or new points added
        if (hasPoints && map.getBounds() && !map.getBounds().contains(bounds.getNorthEast())) {
            map.fitBounds(bounds);
        } else if (hasPoints && !map.getBounds()) {
            map.fitBounds(bounds);
        }
    }, [map, activeMappableBookings, onSelectBooking]);

    return (
        <div className="bg-white/5 rounded-[3rem] border border-white/5 shadow-soft overflow-hidden h-[600px] relative">
            <div ref={mapRef} className="w-full h-full" />

            {/* Overlay Panel */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 shadow-lg pointer-events-auto">
                    <h3 className="text-sm font-black text-content uppercase tracking-widest leading-none">Global Network Grid</h3>
                    <p className="text-[10px] font-bold text-content-subtle mt-1">{activeMappableBookings.length} Active Nodes Tracked</p>
                </div>

                {/* Status Legend */}
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/50 shadow-lg pointer-events-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary-light)]"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Dispatched</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">Active</span>
                    </div>
                </div>
            </div>

            {activeMappableBookings.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm pointer-events-none">
                    <div className="text-center p-8 bg-white/5 rounded-3xl shadow-2xl shadow-black/50 border border-white/5">
                        <MapIcon size={40} className="mx-auto text-gray-200 mb-4" />
                        <h4 className="text-sm font-black text-content uppercase tracking-widest">No Active Trackable Nodes</h4>
                        <p className="text-xs text-content-subtle mt-2">Bookings must be active and have GPS coordinates.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookings;
