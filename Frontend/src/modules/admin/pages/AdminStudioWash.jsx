import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Calendar, Car, CheckCircle2, ChevronRight, ClipboardList, Loader2,
    MapPin, Navigation, RefreshCw, ShieldCheck, User, Wrench, Activity,
    Target, Package, UserCheck, MoreVertical, Search, Globe
} from 'lucide-react';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import PageShell, { SectionCard, FilterBar, StatusTabs, PageLoader } from '../components/PageShell';

const STUDIO_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Live Queue' },
    { id: 'mapping', label: 'Dispatch Center' },
    { id: 'services', label: 'Catalog' }
];

const ACTIVE_STATUSES = new Set([
    'pending', 'confirmed', 'accepted', 'assigned', 'pickup-assigned',
    'en_route', 'arrived', 'picked-up', 'at-studio',
    'in_progress', 'quality-check', 'ready-for-delivery',
    'delivery-assigned', 'out_for_delivery'
]);

const nextStudioStatus = (status = '') => {
    const order = [
        'confirmed', 'pickup-assigned', 'en_route', 'arrived', 'picked-up',
        'at-studio', 'in_progress', 'quality-check', 'ready-for-delivery',
        'delivery-assigned', 'out_for_delivery', 'completed'
    ];
    const currentIndex = order.indexOf(status);
    if (currentIndex === -1) return 'confirmed';
    return order[Math.min(currentIndex + 1, order.length - 1)];
};

const badgeClass = (status = '') => {
    const map = {
        pending: 'adm-badge-warning',
        confirmed: 'adm-badge-info',
        'pickup-assigned': 'adm-badge-navy',
        en_route: 'adm-badge-info',
        arrived: 'adm-badge-success',
        'at-studio': 'adm-badge-navy',
        'in_progress': 'adm-badge-warning',
        'quality-check': 'adm-badge-warning',
        'ready-for-delivery': 'adm-badge-success',
        'delivery-assigned': 'adm-badge-navy',
        'out_for_delivery': 'adm-badge-info',
        completed: 'adm-badge-success',
        cancelled: 'adm-badge-error'
    };
    return map[status] || 'bg-slate-100 text-slate-500';
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
    const sectionId = searchParams.get('section') || 'overview';

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
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConsole();
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
        return pickup || { lat: 28.6139, lng: 77.2090 };
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
                infoContent: <div className="text-[11px] font-black uppercase p-1">Pickup Point</div>
            });
        }
        if (destination) {
            markers.push({
                position: destination,
                icon: buildMarkerIcon('#F97316'),
                infoContent: <div className="text-[11px] font-black uppercase p-1">Studio / Destination</div>
            });
        }
        return markers;
    }, [selectedBooking]);

    const handleAssignStaff = async (type) => {
        if (!selectedBooking?._id) return;
        const staffId = type === 'pickup' ? pickupStaffId : deliveryStaffId;
        if (!staffId) {
            toast.error(`Select ${type} personnel first`);
            return;
        }
        setAssigning(true);
        try {
            await adminAPI.assignStaff(selectedBooking._id, staffId, type);
            toast.success(`Personnel assigned to ${type} protocol`);
            await loadConsole(true);
        } catch (error) {
            toast.error(error.message || 'Mission assignment failed');
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
            toast.success(`Protocol advanced to ${nextStatus.toUpperCase()}`);
            await loadConsole(true);
        } catch (error) {
            toast.error(error.message || 'Status transition failed');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const m = consoleData.metrics || {};
    const staffList = consoleData.staff || [];

    return (
        <PageShell
            title="Studio Command"
            subtitle="Elite studio logistics and wash lifecycle management"
            icon={Wrench}
            accent="amber"
            badge="Studio-v4"
            actions={
                <button 
                    onClick={() => loadConsole(true)} 
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>
            }
        >
            <div className="space-y-8">
                {/* ── METRIC TILES ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Logs', value: m.totalStudioBookings || 0, icon: ClipboardList, color: 'text-slate-900', bg: 'bg-slate-50' },
                        { label: 'Live Trips', value: m.liveStudioBookings || 0, icon: Navigation, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Catalog', value: m.totalStudioServices || 0, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Vendors', value: m.activeVendors || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Staff Node', value: m.activeStaff || 0, icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Gaps', value: m.unassignedPickup || 0, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' }
                    ].map((item, i) => (
                        <div key={i} className={`p-5 rounded-[1.5rem] border border-slate-100 ${item.bg} relative overflow-hidden group`}>
                            <item.icon className={`w-5 h-5 mb-3 ${item.color}`} />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{item.value}</p>
                        </div>
                    ))}
                </div>

                <FilterBar>
                    <StatusTabs 
                        tabs={STUDIO_SECTIONS}
                        active={sectionId}
                        onChange={(id) => setSearchParams({ section: id })}
                    />
                </FilterBar>

                {loading ? (
                    <PageLoader />
                ) : sectionId === 'overview' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <SectionCard title="Geospatial Telemetry" subtitle="Real-time route visibility for selected mission" icon={Globe} noPad>
                                <div className="h-[500px] w-full bg-slate-50 relative">
                                    <GoogleMapBox
                                        center={mapCenter}
                                        zoom={13}
                                        darkMode={false}
                                        markers={mapMarkers}
                                    />
                                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Active Mission</p>
                                        <p className="text-xs font-black text-slate-900 uppercase">{selectedBooking?.bookingId || 'No active lock'}</p>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <SectionCard title="Operations Control" noPad>
                                <div className="p-6 space-y-4">
                                    <button onClick={() => navigate('/admin/users?type=vendors')} className="w-full p-4 rounded-2xl border border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all"><ShieldCheck size={18} /></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Vendor Registry</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </button>
                                    <button onClick={() => navigate('/admin/users?type=staff')} className="w-full p-4 rounded-2xl border border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all"><UserCheck size={18} /></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Staff Registry</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </button>
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                                        <Target className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">Mission Focus</p>
                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <h4 className="text-lg font-black uppercase tracking-tight">{selectedBooking?.bookingId || 'NONE'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{selectedBooking?.serviceName || 'No service data'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${badgeClass(selectedBooking?.status)}`}>
                                                    {selectedBooking?.status || 'IDLE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                ) : sectionId === 'bookings' ? (
                    <SectionCard 
                        title="Mission Queue" 
                        actions={
                            <div className="relative w-72 group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-amber-500 transition-all" 
                                    placeholder="Identify log..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        }
                        noPad
                    >
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {bookings.map((booking) => (
                                <motion.button
                                    key={booking._id}
                                    layout
                                    onClick={() => setSelectedBookingId(booking._id)}
                                    className={`p-6 rounded-[2rem] border transition-all text-left group flex flex-col ${
                                        selectedBookingId === booking._id 
                                            ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' 
                                            : 'bg-white border-slate-100 hover:border-amber-500'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                            selectedBookingId === booking._id ? 'bg-amber-500 text-slate-900' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                            {(booking.consumer?.name || 'G')[0]}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${badgeClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className={`text-sm font-black uppercase tracking-tight ${selectedBookingId === booking._id ? 'text-white' : 'text-slate-800'}`}>
                                            #{booking.bookingId || booking._id?.slice(-8).toUpperCase()}
                                        </h4>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedBookingId === booking._id ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {booking.consumer?.name || 'Guest'} • {booking.serviceName}
                                        </p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </SectionCard>
                ) : sectionId === 'mapping' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SectionCard title="Deployment Protocol" subtitle="Assign personnel to operational pipeline" icon={UserCheck}>
                            <div className="space-y-8 p-4">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                        {(selectedBooking?.consumer?.name || 'X')[0]}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Mission</p>
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-2">#{selectedBooking?.bookingId || 'NONE'}</h4>
                                        <p className="text-xs font-bold text-slate-600 uppercase">{selectedBooking?.consumer?.name} • ₹{selectedBooking?.price}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pickup Personnel</label>
                                        <div className="flex gap-3">
                                            <select 
                                                value={pickupStaffId} 
                                                onChange={(e) => setPickupStaffId(e.target.value)} 
                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-xs font-black uppercase focus:bg-white focus:border-amber-500 outline-none transition-all"
                                            >
                                                <option value="">Select Pickup Agent</option>
                                                {staffList.map(s => <option key={s._id} value={s._id}>{s.name} • {s.phone}</option>)}
                                            </select>
                                            <button onClick={() => handleAssignStaff('pickup')} disabled={assigning || !selectedBooking} className="h-12 px-6 bg-slate-900 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all">
                                                Assign
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Delivery Personnel</label>
                                        <div className="flex gap-3">
                                            <select 
                                                value={deliveryStaffId} 
                                                onChange={(e) => setDeliveryStaffId(e.target.value)} 
                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-xs font-black uppercase focus:bg-white focus:border-amber-500 outline-none transition-all"
                                            >
                                                <option value="">Select Delivery Agent</option>
                                                {staffList.map(s => <option key={s._id} value={s._id}>{s.name} • {s.phone}</option>)}
                                            </select>
                                            <button onClick={() => handleAssignStaff('delivery')} disabled={assigning || !selectedBooking} className="h-12 px-6 bg-slate-900 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all">
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                        <SectionCard title="Lifecycle Transition" subtitle="Advance operational status through workflow" icon={Activity}>
                            <div className="space-y-8 p-4">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
                                        <RefreshCw className={`text-amber-500 ${updatingStatus ? 'animate-spin' : ''}`} size={32} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Phase</p>
                                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-6 ${badgeClass(selectedBooking?.status)}`}>
                                        {selectedBooking?.status || 'IDLE'}
                                    </span>
                                    <div className="w-full h-px bg-slate-200 mb-6" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Advance To</p>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8">
                                        {nextStudioStatus(selectedBooking?.status).replace(/[-_]/g, ' ')}
                                    </h4>
                                    <button 
                                        onClick={handleAdvanceStatus} 
                                        disabled={!selectedBooking || updatingStatus} 
                                        className="w-full h-14 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-200 hover:bg-amber-500 hover:text-slate-900 transition-all flex items-center justify-center gap-3"
                                    >
                                        {updatingStatus ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        Authorize Transition
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                ) : (
                    <SectionCard 
                        title="Service Catalog" 
                        subtitle="Studio service protocol inventory"
                        icon={Package}
                        actions={
                            <button onClick={() => navigate('/admin/services')} className="h-10 px-5 bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Global Service Desk
                            </button>
                        }
                        noPad
                    >
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {(consoleData.studioServices || []).map((service) => (
                                <div key={service._id} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-amber-500 transition-all group shadow-sm">
                                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <Wrench size={20} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{service.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 mb-4">{service.category} • {service.time}</p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                        <span className="text-lg font-black text-slate-900">₹{service.price}</span>
                                        <span className="adm-badge adm-badge-success">{service.status || 'LIVE'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </PageShell>
    );
};

export default AdminStudioWash;
