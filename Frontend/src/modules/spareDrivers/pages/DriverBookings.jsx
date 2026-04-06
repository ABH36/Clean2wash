import React, { useEffect, useState } from 'react';
import {
    MapPin,
    Clock,
    User,
    XCircle,
    ChevronRight,
    Calendar,
    Loader2,
    Phone,
    Car,
    Wallet,
    X
} from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';

const LIVE_STATUSES = ['en_route', 'arrived', 'active'];
const CLOSED_STATUSES = ['completed', 'cancelled'];

const formatDisplayDate = (dateValue) => {
    if (!dateValue) return 'ASAP';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'ASAP';
    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusBadge = (status) => {
    const tones = {
        pending: 'bg-gray-50 text-black/50 border-gray-200',
        en_route: 'bg-blue-50 text-blue-600 border-blue-100',
        arrived: 'bg-amber-50 text-amber-700 border-amber-100',
        active: 'bg-green-50 text-green-700 border-green-100',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100'
    };

    return tones[status] || 'bg-gray-50 text-black/50 border-gray-200';
};

const isRoundTripPointBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('point');
};

const isFullDayBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('full day') || identity.includes('full-day') || identity.includes('fullday');
};

const getBookedDurationLabel = (booking) => (
    booking?.service?.duration || booking?.schedule?.estimatedDuration || null
);

const isOutstationBooking = (booking) => {
    const identity = [
        booking?.service?.metadata?.id,
        booking?.service?.name,
        booking?.service?.title
    ].filter(Boolean).join(' ').toLowerCase();

    return identity.includes('outstation');
};

const DriverBookings = () => {
    const [tab, setTab] = useState('AVAILABLE');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        spareDriverAPI.getBookings()
            .then((res) => {
                if (res?.data?.bookings) {
                    setBookings(res.data.bookings);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const available = bookings.filter((booking) => ![...CLOSED_STATUSES, ...LIVE_STATUSES].includes(booking.status));
    const scheduled = bookings.filter((booking) => LIVE_STATUSES.includes(booking.status));

    const handleAccept = async (id) => {
        try {
            await spareDriverAPI.acceptBooking(id);
            setBookings((prev) => prev.map((booking) => (
                booking._id === id ? { ...booking, status: 'en_route' } : booking
            )));
            setSelectedBooking((current) => (
                current?._id === id ? { ...current, status: 'en_route' } : current
            ));
            toast.success('Booking accepted');
        } catch (err) {
            console.error('Failed to accept booking', err);
            toast.error(err.message || 'Could not accept booking');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Optional reason for rejecting this request:') || '';

        try {
            const response = await spareDriverAPI.rejectBooking(id, reason);
            setBookings((prev) => prev.filter((booking) => booking._id !== id));
            setSelectedBooking((current) => current?._id === id ? null : current);
            toast.success(response?.message || 'Booking rejected');
        } catch (err) {
            console.error('Failed to reject booking', err);
            toast.error(err.message || 'Could not reject booking');
        }
    };

    const BookingCard = ({ booking, isAvailable }) => {
        const pickup = booking.location?.address?.street || booking.location?.address?.city || 'Unknown';
        const fare = `₹${booking.pricing?.totalAmount || 0}`;
        const when = booking.schedule?.date
            ? formatDisplayDate(booking.schedule.date)
            : 'ASAP';
        const isRoundTrip = isRoundTripPointBooking(booking);
        const isFullDay = isFullDayBooking(booking);
        const bookedDuration = getBookedDurationLabel(booking);
        const isOutstation = isOutstationBooking(booking);

        return (
            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">{booking.bookingId || booking._id}</p>
                        <p className="text-sm font-black text-black uppercase">{booking.service?.name || 'Service'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-black">{fare}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded border text-[8px] font-black uppercase mt-1 ${getStatusBadge(booking.status)}`}>
                            {booking.status?.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <User size={11} className="text-black/25 shrink-0" />
                    <span className="text-[10px] font-black text-black/50 uppercase truncate">{booking.consumer?.name || 'Customer'}</span>
                    <span className="text-black/10 mx-1">|</span>
                    <MapPin size={11} className="text-black/25 shrink-0" />
                    <span className="text-[10px] font-black text-black/50 uppercase truncate">{pickup}</span>
                </div>

                {isRoundTrip && (
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                        Return drop at same pickup point
                    </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    {bookedDuration && (
                        <span className="inline-flex items-center px-2 py-1 rounded border border-black/5 bg-black/[0.02] text-[8px] font-black uppercase text-black/55">
                            {bookedDuration}
                        </span>
                    )}
                    {isFullDay && (
                        <span className="inline-flex items-center px-2 py-1 rounded border border-amber-100 bg-amber-50 text-[8px] font-black uppercase text-amber-700">
                            Full Day Shift
                        </span>
                    )}
                    {isOutstation && (
                        <span className="inline-flex items-center px-2 py-1 rounded border border-blue-100 bg-blue-50 text-[8px] font-black uppercase text-blue-700">
                            Outstation
                        </span>
                    )}
                </div>

                {!isAvailable && (
                    <div className="flex items-center gap-2 text-black/35">
                        <Clock size={11} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase">{when}</span>
                    </div>
                )}

                {isAvailable ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleReject(booking._id)}
                            className="flex-1 h-9 border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => handleAccept(booking._id)}
                            className="flex-1 h-9 bg-[#F29F05] text-black text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => setSelectedBooking(booking)}
                            className="h-9 px-3 border border-gray-200 text-black/50 rounded-md flex items-center justify-center"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full h-9 border border-gray-100 text-black text-[10px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-2"
                    >
                        View Details <ChevronRight size={13} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <DriverLayout title="Bookings">
            <div className="px-5 py-6 space-y-5">
                <div className="flex border border-black/[0.04] bg-white rounded-[1.4rem] overflow-hidden shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                    {['AVAILABLE', 'SCHEDULED'].map((currentTab) => (
                        <button
                            key={currentTab}
                            onClick={() => setTab(currentTab)}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === currentTab ? 'bg-black text-white' : 'text-black/30'}`}
                        >
                            {currentTab}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={20} className="animate-spin text-black/20" />
                        </div>
                    ) : tab === 'AVAILABLE' ? (
                        available.length > 0 ? (
                            available.map((booking) => <BookingCard key={booking._id} booking={booking} isAvailable />)
                        ) : (
                            <div className="py-16 flex flex-col items-center gap-2 opacity-20">
                                <Calendar size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No jobs nearby</p>
                            </div>
                        )
                    ) : (
                        scheduled.length > 0 ? (
                            scheduled.map((booking) => <BookingCard key={booking._id} booking={booking} isAvailable={false} />)
                        ) : (
                            <div className="py-16 flex flex-col items-center gap-2 opacity-20">
                                <Clock size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No active trips</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedBooking && (
                <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px] flex items-end justify-center">
                    <div className="w-full max-w-[430px] bg-[linear-gradient(180deg,#FFF9EF_0%,#FFFFFF_18%,#FFFFFF_100%)] rounded-t-[32px] px-5 pt-5 pb-7 max-h-[85vh] overflow-y-auto shadow-[0_-24px_60px_rgba(15,23,42,0.16)]">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Booking Details</p>
                                <h2 className="text-lg font-black text-black uppercase mt-1">{selectedBooking.service?.name || 'Chauffeur Service'}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black/40"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Booking ID</p>
                                    <p className="text-[11px] font-black text-black mt-1">{selectedBooking.bookingId || selectedBooking._id}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[8px] font-black uppercase ${getStatusBadge(selectedBooking.status)}`}>
                                    {selectedBooking.status?.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-gray-100 rounded-xl px-4 py-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Fare</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Wallet size={14} className="text-[#F29F05]" />
                                        <p className="text-[12px] font-black text-black">₹{selectedBooking.pricing?.totalAmount || 0}</p>
                                    </div>
                                </div>
                                <div className="border border-gray-100 rounded-xl px-4 py-3">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Vehicle</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Car size={14} className="text-[#F29F05]" />
                                        <p className="text-[12px] font-black text-black truncate">
                                            {selectedBooking.vehicle?.brand || 'Vehicle'} {selectedBooking.vehicle?.model || ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-xl px-4 py-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-black/30 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Customer</p>
                                        <p className="text-[12px] font-black text-black uppercase truncate mt-1">{selectedBooking.consumer?.name || 'Customer'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-black/30 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Phone</p>
                                        <p className="text-[12px] font-black text-black mt-1">{selectedBooking.consumer?.phone || 'Not available'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-xl px-4 py-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-[#F29F05] shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Pickup</p>
                                        <p className="text-[12px] font-black text-black mt-1">
                                            {selectedBooking.location?.address?.street || selectedBooking.location?.address?.city || 'Unknown pickup'}
                                        </p>
                                    </div>
                                </div>

                                {isRoundTripPointBooking(selectedBooking) ? (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Drop</p>
                                            <p className="text-[12px] font-black text-black mt-1">
                                                Same pickup point return
                                            </p>
                                        </div>
                                    </div>
                                ) : (selectedBooking.location?.destination?.street || selectedBooking.location?.destination?.address?.street ? (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Drop</p>
                                            <p className="text-[12px] font-black text-black mt-1">
                                                {selectedBooking.location?.destination?.street || selectedBooking.location?.destination?.address?.street}
                                            </p>
                                        </div>
                                    </div>
                                ) : null)}

                                <div className="flex items-start gap-3">
                                    <Clock size={16} className="text-black/30 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Schedule</p>
                                        <p className="text-[12px] font-black text-black mt-1">
                                            {selectedBooking.schedule?.type === 'scheduled'
                                                ? formatDisplayDate(selectedBooking.schedule?.date)
                                                : 'Instant booking'}
                                        </p>
                                    </div>
                                </div>

                                {getBookedDurationLabel(selectedBooking) && (
                                    <div className="flex items-start gap-3">
                                        <Calendar size={16} className="text-black/30 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest">Booked Window</p>
                                            <p className="text-[12px] font-black text-black mt-1">
                                                {getBookedDurationLabel(selectedBooking)}
                                            </p>
                                            {isFullDayBooking(selectedBooking) && (
                                                <p className="text-[9px] font-bold text-amber-700 uppercase mt-1">
                                                    Full day trip. Overtime starts after booked window.
                                                </p>
                                            )}
                                            {isOutstationBooking(selectedBooking) && (
                                                <p className="text-[9px] font-bold text-blue-700 uppercase mt-1">
                                                    Outstation rules apply. Keep destination, toll and return notes handy.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(selectedBooking.notes?.consumer || selectedBooking.notes?.provider || selectedBooking.notes?.internal) && (
                                <div className="border border-gray-100 rounded-xl px-4 py-4">
                                    <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Notes</p>
                                    <p className="text-[11px] font-bold text-black/70 leading-relaxed whitespace-pre-line">
                                        {selectedBooking.notes?.consumer || selectedBooking.notes?.provider || selectedBooking.notes?.internal}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="w-full h-11 border border-gray-200 text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                            >
                                Close Details <XCircle size={14} />
                            </button>

                            {selectedBooking.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleReject(selectedBooking._id)}
                                        className="w-full h-11 border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl"
                                    >
                                        Reject Request
                                    </button>
                                    <button
                                        onClick={() => handleAccept(selectedBooking._id)}
                                        className="w-full h-11 bg-[#F29F05] text-black text-[10px] font-black uppercase tracking-widest rounded-xl"
                                    >
                                        Accept Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DriverLayout>
    );
};

export default DriverBookings;
