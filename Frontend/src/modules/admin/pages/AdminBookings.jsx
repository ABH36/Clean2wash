import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import {
    Search, Calendar, Clock, CheckCircle2, XCircle, Truck, Navigation2,
    User, Package, ExternalLink, AlertCircle, UserCheck, MapPin,
    Map as MapIcon, List, ShieldAlert, Phone, Star, Car, RefreshCw,
    Zap, ChevronDown, Hash, X, Filter, MoreVertical, MapPinOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { 
    SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader 
} from '../components/PageShell';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    const fetchBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await adminAPI.getAllBookings();
            if (res.status === 'success') {
                const freshBookings = res.data.bookings || [];
                setBookings(freshBookings);
                if (selectedBooking) {
                    const updated = freshBookings.find(b => b._id === selectedBooking._id);
                    if (updated) setSelectedBooking(updated);
                }
            }
        } catch (err) {
            console.error('Failed to load bookings', err);
            toast.error('Failed to sync network');
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
        socketService.joinAdminRoom();

        const handleBookingUpdate = (data) => {
            console.log('[Admin Bookings] 📡 Booking update received:', data);
            fetchBookings(true);
        };

        const handleLocationPulse = (data) => {
            setBookings(prev => prev.map(b => {
                if (b._id === data.bookingId || b.id === data.bookingId) {
                    return {
                        ...b,
                        driverLocation: { lat: data.lat, lng: data.lng, lastUpdated: new Date() }
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
            toast.error(`🚨 SOS ALERT: Booking #${data.bookingId}`, { duration: 10000 });
            fetchBookings(true);
        });

        return () => {
            socketService.off('booking_status_updated', handleBookingUpdate);
            socketService.off('new_booking', handleBookingUpdate);
            socketService.off('new_booking_broadcast', handleBookingUpdate);
            socketService.off('specialist_location_pulse', handleLocationPulse);
            socketService.off('SOS_EMERGENCY_ALERT');
        };
    }, []);

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

    const handleUpdateStatus = async (bookingId, status) => {
        try {
            await adminAPI.updateBookingStatus(bookingId, status);
            await fetchBookings(true);
            toast.success(`Status updated: ${status.toUpperCase()}`);
        } catch (err) {
            toast.error('Status update failed');
        }
    };

    const handleAssign = async (captain) => {
        if (!selectedBooking) return;
        try {
            await adminAPI.assignCaptain(selectedBooking._id, captain._id);
            await fetchBookings(true);
            setIsAssignModalOpen(false);
            toast.success(`Captain ${captain.name} Assigned`);
        } catch (err) {
            toast.error('Assignment failed');
        }
    };

    const sosCount = bookings.filter(b => b.issues?.some(i => i.type === 'SOS' && i.status === 'open')).length;

    // UI Formatting helpers
    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'en_route': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <PageShell
            title="Command Center"
            subtitle="Real-time Logistics & Fleet Dispatch"
            icon={Truck}
            accent="navy"
            badge={`${filteredBookings.length} Active Nodes`}
            actions={
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fetchBookings(true)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin text-amber-500' : ''} />
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('map')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <MapIcon size={16} />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* ── SOS EMERGENCY BANNER ── */}
                <AnimatePresence>
                    {sosCount > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-rose-600 rounded-3xl p-5 flex items-center justify-between shadow-xl shadow-rose-200 border border-white/20">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                                        <ShieldAlert size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-sm uppercase tracking-widest leading-none">Emergency Protocol Active</h4>
                                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1.5">{sosCount} Priority SOS Nodes Detected</p>
                                    </div>
                                </div>
                                <button className="px-5 py-2.5 bg-black/20 hover:bg-black/40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                                    Open SOS Console
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── SEARCH & FILTER ENGINE ── */}
                <FilterBar>
                    <SearchBox 
                        placeholder="Scan Order ID or Customer Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="w-px h-8 bg-slate-100 mx-1 hidden md:block" />
                    <StatusTabs 
                        tabs={[
                            { label: 'All', value: 'all', count: bookings.length },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Live', value: 'en_route' },
                            { label: 'Active', value: 'in_progress' },
                            { label: 'Done', value: 'completed' },
                        ]}
                        active={statusFilter}
                        onChange={setStatusFilter}
                    />
                    <div className="flex-1" />
                    <select 
                        className="adm-input py-2 px-3 text-[11px] font-black uppercase w-auto bg-slate-50 border-slate-200"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Service Categories</option>
                        <option value="Doorstep">Doorstep Service</option>
                        <option value="Studio">Studio Drop</option>
                        <option value="Chauffeur">Chauffeur Drive</option>
                    </select>
                </FilterBar>

                {/* ── DATA DISPLAY ── */}
                {loading ? (
                    <PageLoader />
                ) : filteredBookings.length === 0 ? (
                    <EmptyState 
                        icon={Package}
                        title="No Bookings Detected"
                        subtitle="Try adjusting your filters or search parameters."
                    />
                ) : viewMode === 'list' ? (
                    <SectionCard noPad>
                        <div className="adm-table-container">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Logistics ID</th>
                                        <th>Customer Unit</th>
                                        <th>Service Protocol</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-right">Valuation</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => {
                                        const id = booking.bookingId || booking._id?.substring(0, 8).toUpperCase();
                                        const hasSOS = booking.issues?.some(i => i.type === 'SOS' && i.status === 'open');
                                        return (
                                            <tr 
                                                key={booking._id} 
                                                className={`group cursor-pointer hover:bg-slate-50/80 transition-all ${hasSOS ? 'bg-rose-50/30' : ''}`}
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${hasSOS ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
                                                        <div>
                                                            <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">#{id}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                {new Date(booking.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                                            {(booking.consumer?.name || 'G')[0].toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-black text-slate-800 truncate uppercase leading-none mb-1">
                                                                {booking.consumer?.name || 'Guest Entity'}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-500 tracking-wider">
                                                                {booking.consumer?.phone || 'SECURE LINE'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-slate-400" />
                                                        <span className="text-[11px] font-black text-slate-700 uppercase">
                                                            {booking.service?.name || 'Standard'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {booking.service?.category}
                                                    </p>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(booking.status)}`}>
                                                        {booking.status.replace(/[-_]/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <p className="text-[13px] font-black text-slate-800 tracking-tight">
                                                        ₹{booking.pricing?.totalAmount || booking.price || 0}
                                                    </p>
                                                </td>
                                                <td className="text-right">
                                                    <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                ) : (
                    <div className="adm-card overflow-hidden h-[600px] border-slate-200">
                        <LiveMapView bookings={filteredBookings} onSelectBooking={setSelectedBooking} />
                    </div>
                )}
            </div>

            {/* ── SIDEBAR DRAWER ── */}
            <AnimatePresence>
                {selectedBooking && (
                    <BookingDrawer 
                        booking={selectedBooking} 
                        onClose={() => setSelectedBooking(null)}
                        onUpdateStatus={handleUpdateStatus}
                        onOpenAssign={() => setIsAssignModalOpen(true)}
                    />
                )}
            </AnimatePresence>

            {/* ── ASSIGNMENT MODAL ── */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <AssignModal 
                        staffList={staffList}
                        selectedBooking={selectedBooking}
                        onClose={() => setIsAssignModalOpen(false)}
                        onAssign={handleAssign}
                    />
                )}
            </AnimatePresence>
        </PageShell>
    );
};

/* ── SUB-COMPONENTS ── */

const BookingDrawer = ({ booking, onClose, onUpdateStatus, onOpenAssign }) => (
    <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full relative z-10 shadow-2xl flex flex-col border-l border-slate-200"
        >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                        #{booking.bookingId || booking._id?.substring(0, 10).toUpperCase()}
                    </h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-2">Mission Payload Details</p>
                </div>
                <button onClick={onClose} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white transition-all text-slate-400">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Quick Status */}
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-slate-200">
                        {booking.status.replace(/[-_]/g, ' ')}
                    </span>
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                        {booking.schedule?.type === 'scheduled' ? '📅 Scheduled' : '⚡ Instant'}
                    </span>
                </div>

                {/* Customer Section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <User size={12} /> Unit Authority
                    </h4>
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                            {(booking.consumer?.name || 'G')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 uppercase truncate leading-none mb-1.5">
                                {booking.consumer?.name || 'Anonymous Entity'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold tracking-wider">
                                {booking.consumer?.phone || 'NO SECURE LINE'}
                            </p>
                        </div>
                        {booking.consumer?.phone && (
                            <a href={`tel:${booking.consumer.phone}`} className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                <Phone size={16} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Captain / Provider Section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Navigation2 size={12} /> Mission Specialist
                    </h4>
                    {booking.provider ? (
                        <div className="p-5 rounded-3xl bg-slate-900 text-white flex items-center gap-5 shadow-xl shadow-slate-200">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-black text-white text-lg">
                                {(booking.provider?.id?.name || booking.provider?.name || 'C')[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black truncate leading-none mb-1.5">
                                    {booking.provider?.id?.name || booking.provider?.name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[10px] font-bold text-white/60">
                                        {booking.provider?.id?.rating || '5.0'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onOpenAssign} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/5 transition-all">
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onOpenAssign}
                            className="w-full p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-colors">
                                <UserPlus size={24} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-600">Assign Dispatch Specialist</p>
                        </button>
                    )}
                </div>

                {/* Logistics Intel */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Package size={12} /> Logistics Intel
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <IntelItem label="Service" value={booking.service?.name} icon={Package} />
                        <IntelItem label="Vehicle" value={booking.vehicle?.plate || 'Not Linked'} icon={Car} />
                        <div className="col-span-2">
                            <IntelItem 
                                label="Location Grid" 
                                value={`${booking.location?.address?.street}, ${booking.location?.address?.city}`} 
                                icon={MapPin} 
                            />
                        </div>
                    </div>
                </div>

                {/* Operational Control */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Controls</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {['confirmed', 'en_route', 'in_progress', 'completed', 'cancelled'].map(st => (
                            <button
                                key={st}
                                onClick={() => onUpdateStatus(booking._id, st)}
                                className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    booking.status === st 
                                        ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-lg' 
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                }`}
                            >
                                {st.replace(/[-_]/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
                >
                    Close Intel Terminal
                </button>
            </div>
        </motion.div>
    </div>
);

const IntelItem = ({ label, value, icon: Icon }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 mb-1.5 opacity-40">
            <Icon size={10} className="text-slate-900" />
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-[11px] font-black text-slate-800 uppercase truncate">{value || '—'}</p>
    </div>
);

const AssignModal = ({ staffList, selectedBooking, onClose, onAssign }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-premium relative z-10 overflow-hidden border border-white/20"
        >
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Assign Specialist</h2>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 opacity-80">Network Authorization Required</p>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-slate-900 rounded-2xl border border-slate-200 text-slate-400 hover:text-white transition-all">
                    <X size={20} />
                </button>
            </div>
            <div className="p-8">
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {staffList.map(captain => (
                        <button
                            key={captain._id}
                            onClick={() => onAssign(captain)}
                            className="w-full p-4 rounded-3xl border border-slate-100 hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center gap-4 group"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                                    {(captain.name || 'C')[0]}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${captain.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{captain.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 tracking-wider">{captain.phone}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1">
                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                        <span className="text-[10px] font-black text-slate-700">{captain.rating || '5.0'}</span>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${captain.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {captain.isOnline ? 'Available' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <UserCheck size={18} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    </div>
);

const LiveMapView = ({ bookings, onSelectBooking }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const markersRef = useRef({});

    const activeMappableBookings = bookings.filter(b =>
        ['pending', 'confirmed', 'assigned', 'pickup-assigned', 'en_route', 'at-studio', 'in_progress', 'quality-check', 'delivery-assigned'].includes(b.status) &&
        ((b.location?.address?.coordinates?.lat && b.location?.address?.coordinates?.lng) ||
         (b.driverLocation?.lat && b.driverLocation?.lng))
    );

    useEffect(() => {
        if (!window.google) return;
        const initMap = async () => {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: 28.6139, lng: 77.2090 },
                zoom: 12,
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
            });
            setMap(mapInstance);
        };
        if (mapRef.current && !map) initMap();
    }, [map]);

    useEffect(() => {
        if (!map || !window.google) return;
        const activeIds = new Set(activeMappableBookings.map(b => b._id || b.id));
        Object.keys(markersRef.current).forEach(id => {
            if (!activeIds.has(id.split('_')[0])) {
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

            if (pickupLat && pickupLng) {
                const pos = { lat: pickupLat, lng: pickupLng };
                const mId = `${bId}_pickup`;
                if (!markersRef.current[mId]) {
                    markersRef.current[mId] = new window.google.maps.Marker({
                        position: pos, map, 
                        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#f43f5e', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }
                    });
                    markersRef.current[mId].addListener('click', () => onSelectBooking(booking));
                }
                bounds.extend(pos);
                hasPoints = true;
            }

            if (driverLat && driverLng) {
                const pos = { lat: driverLat, lng: driverLng };
                const mId = `${bId}_driver`;
                if (!markersRef.current[mId]) {
                    markersRef.current[mId] = new window.google.maps.Marker({
                        position: pos, map,
                        icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff', rotation: 0 }
                    });
                    markersRef.current[mId].addListener('click', () => onSelectBooking(booking));
                } else {
                    markersRef.current[mId].setPosition(pos);
                }
                bounds.extend(pos);
                hasPoints = true;
            }
        });

        if (hasPoints) map.fitBounds(bounds);
    }, [map, activeMappableBookings]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-5 py-3 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Network Topology</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1">{activeMappableBookings.length} Active Nodes Tracked</p>
            </div>
            {activeMappableBookings.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm">
                    <div className="text-center p-10 bg-white rounded-[2.5rem] shadow-premium border border-slate-100 max-w-sm">
                        <MapPinOff size={48} className="mx-auto text-slate-200 mb-5" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Active Signals</h4>
                        <p className="text-[11px] text-slate-400 mt-3 font-medium leading-relaxed">Bookings must be in an active state with GPS coordinates to appear on the grid.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const mapStyles = [
    { "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] }
];

export default AdminBookings;
