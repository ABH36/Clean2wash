import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { adminAPI } from '../../../utils/adminApi';
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
        // Auto-refresh every 30s for live data
        pollRef.current = setInterval(() => fetchBookings(true), 30000);
        return () => clearInterval(pollRef.current);
    }, []);

    // Filter logic
    const filteredBookings = bookings.filter(b => {
        const id = b.bookingId || b._id || '';
        const customerName = b.consumer?.name || b.userName || '';
        const matchesSearch =
            id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pickup-assigned': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'en_route': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'at-studio': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'in_progress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'quality-check': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'delivery-assigned': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
        <AdminLayout title="Operations Hub">
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
                                <p className="text-white font-black text-sm">{sosCount} Active SOS Alert{sosCount > 1 ? 's' : ''}</p>
                                <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">Immediate response required</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                        </div>
                    </motion.div>
                )}

                {/* Tactical Action Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
                        {['all', 'pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-brand shadow-sm' : 'text-content-subtle'}`}
                            >
                                {f === 'en_route' ? 'En Route' : f}
                                {f === 'all' && <span className="ml-1 text-brand">{bookings.length}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-80 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-soft">
                            <Search size={16} className="text-content-subtle" />
                            <input
                                type="text"
                                placeholder="Search by ID or Customer..."
                                className="bg-transparent outline-none text-xs font-bold text-content w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => fetchBookings(true)}
                            className={`p-2.5 bg-white border border-gray-100 rounded-2xl shadow-soft text-content-subtle hover:text-brand transition-all ${refreshing ? 'animate-spin text-brand' : ''}`}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <div className="flex bg-white border border-gray-100 p-1 rounded-2xl shadow-soft">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-content text-white' : 'text-content-subtle hover:bg-gray-50'}`}>
                                <List size={16} />
                            </button>
                            <button onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-content text-white' : 'text-content-subtle hover:bg-gray-50'}`}>
                                <MapIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Data Terminal */}
                {viewMode === 'list' ? (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest">Order Node</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest">User Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest">Service Protocol</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest">Current Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest">Valuation</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-content-subtle uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-20 text-center">
                                                <div className="w-8 h-8 mx-auto border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
                                                <p className="text-xs mt-4 font-black text-content-subtle uppercase">Loading Network Data...</p>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredBookings.map((booking) => {
                                        const id = booking.bookingId || booking._id?.substring(0, 8);
                                        const customerName = booking.consumer?.name || 'Guest';
                                        const serviceName = booking.service?.name || booking.serviceName || 'Service';
                                        const captainName = booking.provider?.id?.name || booking.provider?.name;
                                        const hasSOS = booking.issues?.some(i => i.type === 'SOS' && i.status === 'open');
                                        const price = booking.price || '₹0';

                                        return (
                                            <tr
                                                key={booking._id}
                                                className={`hover:bg-gray-50/30 transition-all cursor-pointer group ${hasSOS ? 'bg-red-50/30' : ''}`}
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {hasSOS && <ShieldAlert size={12} className="text-red-500 flex-shrink-0" />}
                                                        <div>
                                                            <p className="text-xs font-black text-content leading-none truncate max-w-[110px]">{id}</p>
                                                            <p className="text-[9px] font-bold text-content-subtle mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-brand/5 flex items-center justify-center font-black text-brand text-[10px]">
                                                            {customerName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-content">{customerName}</p>
                                                            <p className="text-[9px] text-content-subtle">{booking.consumer?.phone || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-content-muted leading-tight">{serviceName}</p>
                                                    <p className="text-[9px] font-black text-brand uppercase tracking-widest mt-0.5">
                                                        {booking.schedule?.type === 'scheduled' ? '📅 Scheduled' : '⚡ Instant'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                                        {booking.status.replace(/[-_]/g, ' ')}
                                                    </span>
                                                    {captainName && (
                                                        <p className="text-[8px] text-content-subtle mt-1 truncate max-w-[100px]">{captainName}</p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-black text-content">{price}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                                                            className="p-2 bg-gray-50 hover:bg-brand hover:text-white rounded-lg text-content-subtle transition-all"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredBookings.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-20 text-center">
                                                <AlertCircle size={40} className="mx-auto text-gray-200 mb-4" />
                                                <p className="text-sm font-black text-content-subtle uppercase tracking-widest">No matching records found in system</p>
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
            </div>

            {/* Sidebar Details Drawer */}
            <AnimatePresence>
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
                            className="w-full max-w-md bg-white h-full relative z-10 shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-black text-content leading-none">{selectedBooking.bookingId || selectedBooking._id || selectedBooking.id}</h3>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mt-2">Payload Details</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-content-subtle hover:bg-white transition-all"
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
                                            <ShieldAlert size={10} /> SOS ACTIVE
                                        </span>
                                    )}
                                </div>

                                {/* Customer Section */}
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Customer</h4>
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center font-black text-base">
                                            {(selectedBooking.consumer?.name || 'G')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-content truncate">{selectedBooking.consumer?.name || 'Guest'}</p>
                                            <p className="text-[10px] text-content-subtle font-bold">{selectedBooking.consumer?.phone || '—'}</p>
                                        </div>
                                        {selectedBooking.consumer?.phone && (
                                            <a href={`tel:${selectedBooking.consumer.phone}`} className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                                                <Phone size={14} className="text-white" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Captain/Provider Section */}
                                {selectedBooking.provider && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Assigned Captain</h4>
                                        <div className="p-4 rounded-2xl bg-[#0F172A] text-white">
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
                                        {selectedBooking.schedule?.type === 'scheduled' ? (
                                            <>
                                                <DetailItem icon={<Calendar size={14} />} label="Date" value={selectedBooking.schedule?.date ? new Date(selectedBooking.schedule.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                                                <DetailItem icon={<Clock size={14} />} label="Time Slot" value={selectedBooking.schedule?.timeSlot ? `${selectedBooking.schedule.timeSlot.start} – ${selectedBooking.schedule.timeSlot.end}` : '—'} />
                                            </>
                                        ) : (
                                            <DetailItem icon={<Zap size={14} />} label="Booked At" value={selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'} />
                                        )}
                                        <DetailItem icon={<Hash size={14} />} label="Security PIN" value={selectedBooking.securityPin || '—'} />
                                        <DetailItem icon={<Package size={14} />} label="Amount" value={selectedBooking.price || `₹${selectedBooking.pricing?.totalAmount || 0}`} />
                                    </div>
                                </div>

                                {/* SOS / Issues Section */}
                                {selectedBooking.issues?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <ShieldAlert size={11} /> Emergency Alerts & Issues
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedBooking.issues.map((issue, idx) => {
                                                const isSOS = issue.type === 'SOS';
                                                const isOpen = issue.status === 'open';
                                                return (
                                                    <div key={idx} className={`p-4 rounded-2xl border-2 relative overflow-hidden ${
                                                        isSOS && isOpen ? 'bg-red-50 border-red-200' :
                                                        isSOS ? 'bg-gray-50 border-gray-200' :
                                                        'bg-amber-50 border-amber-200'
                                                    }`}>
                                                        {isSOS && isOpen && (
                                                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
                                                        )}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle size={13} className={isSOS ? 'text-red-600' : 'text-amber-600'} />
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                                    isSOS ? 'text-red-700' : 'text-amber-700'
                                                                }`}>{issue.type || 'Issue'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                    issue.status === 'open' ? 'bg-red-100 text-red-700' :
                                                                    issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>{issue.status}</span>
                                                                <span className="text-[8px] text-content-subtle">
                                                                    {new Date(issue.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-bold text-content leading-relaxed">{issue.description}</p>
                                                        {issue.photo && (
                                                            <button onClick={() => window.open(issue.photo, '_blank')}
                                                                className="mt-3 w-full rounded-xl overflow-hidden border border-gray-200 relative group">
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
                                                                className="mt-3 w-full py-2 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-content-subtle hover:border-green-300 hover:text-green-600 transition-all"
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
                                    <h4 className="text-[9px] font-black text-content-subtle uppercase tracking-widest px-1">Command Control</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 'pending', color: 'amber' },
                                            { val: 'confirmed', color: 'blue' },
                                            { val: 'en_route', color: 'indigo' },
                                            { val: 'in_progress', color: 'violet' },
                                            { val: 'completed', color: 'green' },
                                            { val: 'cancelled', color: 'red' },
                                        ].map(({ val, color }) => (
                                            <button
                                                key={val}
                                                onClick={() => handleUpdateStatus(selectedBooking._id, val)}
                                                className={`p-2.5 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                                                    selectedBooking.status === val
                                                        ? 'bg-content text-white border-content shadow-lg'
                                                        : 'bg-white text-content-subtle border-gray-100 hover:border-brand/30 hover:text-brand'
                                                }`}
                                            >
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
                                        className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-between group hover:border-brand transition-all"
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
                            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                                <button
                                    onClick={() => fetchBookings(true)}
                                    className="flex-1 h-12 bg-white border border-gray-100 text-content rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="flex-1 h-12 bg-content text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AdminModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign Captain"
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
                                className={`w-full p-4 rounded-2xl border flex items-center gap-4 hover:border-brand hover:bg-brand/5 transition-all group text-left ${
                                    selectedBooking?.provider?.id?._id === captain._id || selectedBooking?.provider?.id === captain._id
                                        ? 'border-brand bg-brand/5'
                                        : 'border-gray-100 bg-gray-50/30'
                                }`}
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-[#0F172A] flex items-center justify-center text-brand font-black text-base">
                                        {(captain.name || 'C')[0]}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                        captain.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-content leading-none truncate">{captain.name}</p>
                                    <p className="text-[9px] font-bold text-content-subtle mt-0.5">{captain.phone || '—'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                            captain.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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
                            <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                <User size={30} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-xs font-black text-content-subtle uppercase">No captains in network</p>
                            </div>
                        )}
                    </div>
                </div>
            </AdminModal>
        </AdminLayout>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-soft">
        <div className="flex items-center gap-3">
            <div className="text-brand opacity-60">{icon}</div>
            <span className="text-[9px] font-black uppercase text-content-subtle tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-content">{value}</span>
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
                className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100"
            >
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-content leading-none">{title}</h2>
                        <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-2 ml-1">Enterprise Management System</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl border border-gray-100 text-content-subtle transition-all">
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
        b.location?.address?.coordinates?.lat &&
        b.location?.address?.coordinates?.lng
    );

    useEffect(() => {
        if (!window.google) return;

        const initMap = async () => {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: 12.9716, lng: 77.5946 }, // Default Bengaluru
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

        // Clear old markers
        Object.values(markersRef.current).forEach(marker => marker.map = null);
        markersRef.current = {};

        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        activeMappableBookings.forEach(booking => {
            const lat = booking.location.address.coordinates.lat;
            const lng = booking.location.address.coordinates.lng;
            const bId = booking._id || booking.id;

            // Pin styling based on status
            let color = '#2563eb'; // Default blue (confirmed)
            if (booking.status === 'pending') color = '#f59e0b'; // Amber
            else if (['in_progress', 'at-studio'].includes(booking.status)) color = '#8b5cf6'; // Purple

            const svgMarker = {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: color,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 24)
            };

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map,
                icon: svgMarker,
                title: `${booking.bookingId || bId} | ${booking.provider?.name || 'Pending Provider'}`
            });

            marker.addListener('click', () => {
                onSelectBooking(booking);
            });

            markersRef.current[bId] = marker;
            bounds.extend({ lat, lng });
            hasPoints = true;
        });

        if (hasPoints) {
            map.fitBounds(bounds);
            // Prevent zooming in too close for a single point
            const listener = window.google.maps.event.addListener(map, "idle", function () {
                if (map.getZoom() > 14) map.setZoom(14);
                window.google.maps.event.removeListener(listener);
            });
        }
    }, [map, activeMappableBookings, onSelectBooking]);

    return (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-soft overflow-hidden h-[600px] relative">
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
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
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
                    <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
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
