import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Calendar,
    Car,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Loader2,
    MapPin,
    Navigation,
    RefreshCw,
    ShieldCheck,
    User,
    Wrench
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import GoogleMapBox from '../../../components/common/GoogleMapBox';

const STUDIO_SECTIONS = ['overview', 'bookings', 'mapping', 'services'];

const getSection = (value) => STUDIO_SECTIONS.includes(value) ? value : 'overview';

const ACTIVE_STATUSES = new Set([
    'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned',
    'en_route', 'arrived', 'picked-up', 'at-studio',
    'in_progress', 'quality-check', 'ready-for-delivery',
    'delivery-assigned', 'out_for_delivery'
]);

const nextStudioStatus = (status = '') => {
    const order = [
        'confirmed',
        'pickup-assigned',
        'en_route',
        'arrived',
        'picked-up',
        'at-studio',
        'in_progress',
        'quality-check',
        'ready-for-delivery',
        'delivery-assigned',
        'out_for_delivery',
        'completed'
    ];
    const currentIndex = order.indexOf(status);
    if (currentIndex === -1) return 'confirmed';
    return order[Math.min(currentIndex + 1, order.length - 1)];
};

const badgeClass = (status = '') => {
    const map = {
        pending: 'bg-amber-50 text-amber-700',
        confirmed: 'bg-blue-50 text-blue-700',
        'pickup-assigned': 'bg-indigo-50 text-indigo-700',
        en_route: 'bg-cyan-50 text-cyan-700',
        arrived: 'bg-purple-50 text-purple-700',
        'at-studio': 'bg-violet-50 text-violet-700',
        'in_progress': 'bg-fuchsia-50 text-fuchsia-700',
        'quality-check': 'bg-orange-50 text-orange-700',
        'ready-for-delivery': 'bg-emerald-50 text-emerald-700',
        'delivery-assigned': 'bg-teal-50 text-teal-700',
        'out_for_delivery': 'bg-sky-50 text-sky-700',
        completed: 'bg-green-50 text-green-700',
        cancelled: 'bg-red-50 text-red-700'
    };
    return map[status] || 'bg-gray-50 text-gray-700';
};

const toLatLng = (booking = {}) => {
    const pickup = booking?.location?.address?.coordinates;
    if (!pickup || !Number.isFinite(Number(pickup.lat)) || !Number.isFinite(Number(pickup.lng))) return null;
    return { lat: Number(pickup.lat), lng: Number(pickup.lng) };
};

const toDestinationLatLng = (booking = {}) => {
    const destination = booking?.location?.destination?.coordinates;
    if (!destination || !Number.isFinite(Number(destination.lat)) || !Number.isFinite(Number(destination.lng))) return null;
    return { lat: Number(destination.lat), lng: Number(destination.lng) };
};

const buildMarkerIcon = (fill) => ({
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.52 7 13 7 13s7-7.48 7-13c0-3.87-3.13-7-7-7z',
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.7
});

const AdminStudioWash = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const section = getSection(searchParams.get('section'));

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [consoleData, setConsoleData] = useState({
        metrics: {},
        bookings: [],
        staff: [],
        vendors: [],
        studioServices: []
    });
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [pickupStaffId, setPickupStaffId] = useState('');
    const [deliveryStaffId, setDeliveryStaffId] = useState('');
    const [search, setSearch] = useState('');

    const loadConsole = async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await adminAPI.getStudioWashConsole();
            setConsoleData(res?.data || { metrics: {}, bookings: [], staff: [], vendors: [], studioServices: [] });
        } catch (error) {
            toast.error(error.message || 'Failed to load studio wash console');
        } finally {
            if (silent) setRefreshing(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        loadConsole();
    }, []);

    useEffect(() => {
        socketService.joinAdminRoom();
        const sync = () => loadConsole(true);
        socketService.on('booking_status_updated', sync);
        socketService.on('new_booking', sync);
        socketService.on('new_studio_booking', sync);
        return () => {
            socketService.off('booking_status_updated', sync);
            socketService.off('new_booking', sync);
            socketService.off('new_studio_booking', sync);
        };
    }, []);

    const bookings = useMemo(() => {
        const source = consoleData?.bookings || [];
        if (!search.trim()) return source;
        const q = search.trim().toLowerCase();
        return source.filter((booking) => {
            const id = booking.bookingId || booking._id || '';
            const name = booking.consumer?.name || '';
            const phone = booking.consumer?.phone || '';
            const service = booking.serviceName || booking.service?.name || '';
            return [id, name, phone, service].join(' ').toLowerCase().includes(q);
        });
    }, [consoleData, search]);

    const activeBookings = useMemo(() => bookings.filter((booking) => ACTIVE_STATUSES.has(booking.status)), [bookings]);

    const selectedBooking = useMemo(
        () => bookings.find((booking) => booking._id === selectedBookingId) || activeBookings[0] || bookings[0] || null,
        [bookings, selectedBookingId, activeBookings]
    );

    useEffect(() => {
        if (!selectedBooking) return;
        setSelectedBookingId(selectedBooking._id);
        setPickupStaffId(selectedBooking?.pickupStaff?._id || '');
        setDeliveryStaffId(selectedBooking?.deliveryStaff?._id || '');
    }, [selectedBooking?._id]);

    const mapCenter = useMemo(() => {
        const pickup = toLatLng(selectedBooking);
        return pickup || { lat: 22.7196, lng: 75.8577 };
    }, [selectedBooking]);

    const mapPolyline = useMemo(() => {
        if (!selectedBooking) return [];
        const start = toLatLng(selectedBooking);
        const end = toDestinationLatLng(selectedBooking);
        if (start && end) {
            return [{
                path: [start, end],
                options: {
                    strokeColor: '#0F172A',
                    strokeOpacity: 0.92,
                    strokeWeight: 4,
                    geodesic: true
                }
            }];
        }
        return [];
    }, [selectedBooking]);

    const mapMarkers = useMemo(() => {
        if (!selectedBooking) return [];
        const pickup = toLatLng(selectedBooking);
        const destination = toDestinationLatLng(selectedBooking);
        const markers = [];
        if (pickup) {
            markers.push({
                position: pickup,
                icon: buildMarkerIcon('#0F172A'),
                infoContent: (
                    <div className="text-[11px] font-black uppercase">
                        Pickup
                    </div>
                )
            });
        }
        if (destination) {
            markers.push({
                position: destination,
                icon: buildMarkerIcon('#F97316'),
                infoContent: (
                    <div className="text-[11px] font-black uppercase">
                        Destination / Studio
                    </div>
                )
            });
        }
        return markers;
    }, [selectedBooking]);

    const handleSectionChange = (nextSection) => {
        setSearchParams({ section: nextSection });
    };

    const handleAssignStaff = async (type) => {
        if (!selectedBooking?._id) return;
        const staffId = type === 'pickup' ? pickupStaffId : deliveryStaffId;
        if (!staffId) {
            toast.error(`Select ${type} staff first`);
            return;
        }
        setAssigning(true);
        try {
            await adminAPI.assignStaff(selectedBooking._id, staffId, type);
            toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} staff assigned`);
            await loadConsole(true);
        } catch (error) {
            toast.error(error.message || 'Could not assign staff');
        } finally {
            setAssigning(false);
        }
    };

    const handleAdvanceStatus = async () => {
        if (!selectedBooking?._id) return;
        const nextStatus = nextStudioStatus(selectedBooking.status);
        setUpdatingStatus(true);
        try {
            await adminAPI.updateBookingStatus(selectedBooking._id, nextStatus);
            toast.success(`Status updated to ${nextStatus}`);
            await loadConsole(true);
        } catch (error) {
            toast.error(error.message || 'Status update failed');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-brand" />
            </div>
        );
    }

    const m = consoleData.metrics || {};
    const staffList = consoleData.staff || [];

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-[1.2rem] p-5 shadow-[0_14px_28px_rgba(15,23,42,0.06)] flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[9px] font-black text-black/35 uppercase tracking-[0.22em]">Studio Wash Ops</p>
                    <h2 className="text-[24px] font-black text-black uppercase leading-tight mt-2">Manage Full Wash Workflow</h2>
                    <p className="text-[10px] font-bold text-black/45 mt-2">Bookings, staff assignment, studio services, and operational map are centralized here.</p>
                </div>
                <button onClick={() => loadConsole(true)} className={`h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase ${refreshing ? 'text-brand' : 'text-black/55'}`}>
                    <RefreshCw size={14} className={`inline-block mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                    { label: 'Total Bookings', value: m.totalStudioBookings || 0, icon: ClipboardList },
                    { label: 'Live Bookings', value: m.liveStudioBookings || 0, icon: Navigation },
                    { label: 'Studio Services', value: m.totalStudioServices || 0, icon: Wrench },
                    { label: 'Vendors', value: m.activeVendors || 0, icon: ShieldCheck },
                    { label: 'Staff', value: m.activeStaff || 0, icon: User },
                    { label: 'Pickup Gaps', value: m.unassignedPickup || 0, icon: Calendar }
                ].map((item) => (
                    <div key={item.label} className="bg-white border border-gray-100 rounded-[1rem] p-3.5 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                        <item.icon size={14} className="text-brand" />
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mt-2">{item.label}</p>
                        <p className="text-[22px] font-black text-black mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit">
                {STUDIO_SECTIONS.map((item) => (
                    <button
                        key={item}
                        onClick={() => handleSectionChange(item)}
                        className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider ${section === item ? 'bg-black text-white' : 'text-black/50'}`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {section === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-[1rem] p-4">
                        <h3 className="text-[14px] font-black text-black uppercase">Active Studio Trips</h3>
                        <p className="text-[10px] font-bold text-black/40 mt-1">Map with route polyline between pickup and destination/studio.</p>
                        <div className="h-[420px] rounded-xl overflow-hidden border border-gray-100 mt-4">
                            <GoogleMapBox
                                center={mapCenter}
                                zoom={13}
                                darkMode={false}
                                polylines={mapPolyline}
                                markers={mapMarkers}
                            />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3">
                        <h3 className="text-[14px] font-black text-black uppercase">Operational Shortcuts</h3>
                        <button onClick={() => navigate('/admin/users?type=vendors')} className="w-full h-11 rounded-xl border border-gray-200 px-4 flex items-center justify-between text-[10px] font-black uppercase text-black/70">
                            Open Vendor Registry <ChevronRight size={14} />
                        </button>
                        <button onClick={() => navigate('/admin/users?type=staff')} className="w-full h-11 rounded-xl border border-gray-200 px-4 flex items-center justify-between text-[10px] font-black uppercase text-black/70">
                            Open Staff Registry <ChevronRight size={14} />
                        </button>
                        <button onClick={() => navigate('/admin/services')} className="w-full h-11 rounded-xl border border-gray-200 px-4 flex items-center justify-between text-[10px] font-black uppercase text-black/70">
                            Open Service Inventory <ChevronRight size={14} />
                        </button>
                        <div className="border border-gray-100 rounded-xl p-4 mt-2">
                            <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">Selected Booking</p>
                            <p className="text-[14px] font-black text-black uppercase mt-1">{selectedBooking?.bookingId || 'No booking selected'}</p>
                            <p className="text-[10px] font-bold text-black/50 mt-1">{selectedBooking?.serviceName || '-'}</p>
                            <span className={`inline-flex mt-2 px-2 py-1 rounded-md text-[9px] font-black uppercase ${badgeClass(selectedBooking?.status)}`}>
                                {selectedBooking?.status || 'idle'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {section === 'bookings' && (
                <div className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-[14px] font-black text-black uppercase">Studio Booking Queue</h3>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by booking ID, customer, phone..." className="h-10 w-[360px] max-w-full border border-gray-200 rounded-lg px-3 text-[11px] font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                        {bookings.map((booking) => (
                            <button key={booking._id} onClick={() => setSelectedBookingId(booking._id)} className={`w-full border rounded-xl px-4 py-3 text-left ${selectedBookingId === booking._id ? 'border-black bg-black/[0.02]' : 'border-gray-100'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[12px] font-black text-black uppercase">{booking.bookingId || booking._id}</p>
                                        <p className="text-[10px] font-bold text-black/55">{booking.consumer?.name || 'Consumer'} • {booking.serviceName || booking.service?.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${badgeClass(booking.status)}`}>{booking.status}</span>
                                </div>
                            </button>
                        ))}
                        {!bookings.length && <p className="text-[10px] font-black text-black/35 uppercase tracking-widest">No studio bookings found.</p>}
                    </div>
                </div>
            )}

            {section === 'mapping' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3">
                        <h3 className="text-[14px] font-black text-black uppercase">Staff Assignment</h3>
                        <p className="text-[10px] font-bold text-black/45">Assign pickup and delivery staff for selected studio booking.</p>
                        <div className="border border-gray-100 rounded-xl p-3">
                            <p className="text-[9px] font-black text-black/35 uppercase tracking-widest">Booking</p>
                            <p className="text-[13px] font-black text-black uppercase mt-1">{selectedBooking?.bookingId || '-'}</p>
                            <p className="text-[10px] font-bold text-black/45 mt-1">{selectedBooking?.consumer?.name || '-'} • {selectedBooking?.price || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Pickup Staff</label>
                            <select value={pickupStaffId} onChange={(event) => setPickupStaffId(event.target.value)} className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[11px] font-black">
                                <option value="">Select pickup staff</option>
                                {staffList.map((staff) => <option key={staff._id} value={staff._id}>{staff.name} • {staff.phone}</option>)}
                            </select>
                            <button onClick={() => handleAssignStaff('pickup')} disabled={assigning || !selectedBooking} className="mt-2 h-10 px-4 rounded-lg bg-black text-white text-[10px] font-black uppercase">
                                {assigning ? 'Assigning...' : 'Assign Pickup'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Delivery Staff</label>
                            <select value={deliveryStaffId} onChange={(event) => setDeliveryStaffId(event.target.value)} className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[11px] font-black">
                                <option value="">Select delivery staff</option>
                                {staffList.map((staff) => <option key={staff._id} value={staff._id}>{staff.name} • {staff.phone}</option>)}
                            </select>
                            <button onClick={() => handleAssignStaff('delivery')} disabled={assigning || !selectedBooking} className="mt-2 h-10 px-4 rounded-lg bg-black text-white text-[10px] font-black uppercase">
                                {assigning ? 'Assigning...' : 'Assign Delivery'}
                            </button>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3">
                        <h3 className="text-[14px] font-black text-black uppercase">Status Control</h3>
                        <p className="text-[10px] font-bold text-black/45">Advance selected booking through full wash lifecycle.</p>
                        <div className="border border-gray-100 rounded-xl p-3">
                            <p className="text-[9px] font-black text-black/35 uppercase tracking-widest">Current</p>
                            <span className={`inline-flex mt-2 px-2 py-1 rounded-md text-[9px] font-black uppercase ${badgeClass(selectedBooking?.status)}`}>{selectedBooking?.status || '-'}</span>
                            <p className="text-[10px] font-bold text-black/45 mt-2">Next: {nextStudioStatus(selectedBooking?.status)}</p>
                        </div>
                        <button onClick={handleAdvanceStatus} disabled={!selectedBooking || updatingStatus} className="h-11 px-5 rounded-xl bg-brand text-black text-[10px] font-black uppercase flex items-center gap-2">
                            {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Advance Status
                        </button>
                    </div>
                </div>
            )}

            {section === 'services' && (
                <div className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-[14px] font-black text-black uppercase">Studio Service Catalog</h3>
                        <button onClick={() => navigate('/admin/services')} className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase text-black/60">
                            Open Global Service Desk
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {(consoleData.studioServices || []).map((service) => (
                            <div key={service._id} className="border border-gray-100 rounded-xl p-3">
                                <p className="text-[12px] font-black text-black uppercase">{service.name}</p>
                                <p className="text-[10px] font-bold text-black/45 mt-1">{service.category} • {service.time}</p>
                                <p className="text-[18px] font-black text-black mt-2">₹{service.price || 0}</p>
                                <span className="inline-flex mt-2 px-2 py-1 rounded-md bg-gray-100 text-[9px] font-black uppercase text-black/60">{service.status || 'Live'}</span>
                            </div>
                        ))}
                        {!(consoleData.studioServices || []).length && (
                            <p className="text-[10px] font-black text-black/35 uppercase tracking-widest">No studio services configured.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudioWash;
