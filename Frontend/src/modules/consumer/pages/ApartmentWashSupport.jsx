import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, AlertTriangle, CalendarClock, MapPin, LifeBuoy } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';
import api, { bookingAPI } from '../../../utils/api';

const ISSUE_OPTIONS = [
    { id: 'vehicle_not_available', label: 'Vehicle not found' },
    { id: 'parking_access', label: 'Parking access issue' },
    { id: 'quality_issue', label: 'Wash quality issue' },
    { id: 'captain_issue', label: 'Captain behaviour' },
    { id: 'schedule_issue', label: 'Schedule issue' },
    { id: 'other', label: 'Other issue' }
];

const formatDate = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const ApartmentWashSupport = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bookingIdFromQuery = searchParams.get('bookingId');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(bookingIdFromQuery || '');
    const [description, setDescription] = useState('');
    const [issueType, setIssueType] = useState(ISSUE_OPTIONS[0].id);

    useEffect(() => {
        const fetchApartmentBookings = async () => {
            try {
                const historyRes = await api.request('/bookings/history?category=Apartment&limit=15');
                const apartmentBookings = historyRes?.data?.bookings || [];
                setBookings(apartmentBookings);
                if (!bookingIdFromQuery && apartmentBookings[0]?._id) {
                    setSelectedBookingId(apartmentBookings[0]._id);
                }
            } catch (error) {
                console.error('Failed to fetch apartment wash support context:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApartmentBookings();
    }, [bookingIdFromQuery]);

    const selectedBooking = useMemo(
        () => bookings.find((booking) => booking._id === selectedBookingId) || null,
        [bookings, selectedBookingId]
    );

    const handleSubmitIssue = async () => {
        if (!selectedBookingId) {
            toast.error('Select an apartment wash booking first');
            return;
        }
        if (!description.trim()) {
            toast.error('Please describe the issue first');
            return;
        }

        setSubmitting(true);
        try {
            await bookingAPI.reportIssue(selectedBookingId, {
                type: issueType,
                description: description.trim()
            });
            toast.success('Apartment wash issue reported to admin');
            const refreshed = await bookingAPI.getBooking(selectedBookingId);
            const nextBooking = refreshed?.data?.booking;
            if (nextBooking) {
                setBookings((current) => current.map((booking) => booking._id === selectedBookingId ? nextBooking : booking));
            }
            setDescription('');
        } catch (error) {
            console.error('Failed to report apartment wash issue:', error);
            toast.error(error.message || 'Could not report this apartment wash issue');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-[#0A0F0D]">
                <header className="px-5 pt-12 pb-4 flex items-center gap-4 border-b border-white/5">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center text-white">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">Apartment support</h1>
                </header>

                <div className="p-5 space-y-5 pb-24">
                    <div className="rounded-[2rem] border border-black/[0.04] bg-white/5 p-5 ">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                                <LifeBuoy size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Linked support</p>
                                <p className="text-[11px] font-bold uppercase tracking-tight text-white/60">Select the apartment wash booking and report the exact issue to admin.</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-white/5 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Select booking</label>
                                <select
                                    value={selectedBookingId}
                                    onChange={(event) => setSelectedBookingId(event.target.value)}
                                    className="w-full rounded-2xl border border-black/[0.06] bg-white/[0.02] px-4 py-4 text-[11px] font-[1000] uppercase tracking-tight outline-none focus:border-brand/20"
                                >
                                    <option value="">Select apartment wash booking</option>
                                    {bookings.map((booking) => (
                                        <option key={booking._id} value={booking._id}>
                                            {booking.location?.hubId?.name || 'Apartment'} • {booking.schedule?.slot || booking.schedule?.timeSlot?.start || 'Slot'} • #{booking.bookingId || booking._id.slice(-6)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedBooking && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[2rem] border border-black/[0.04] bg-white/[0.02]/70 p-5 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35">{selectedBooking.service?.name || 'Apartment wash'}</p>
                                            <p className="mt-1 text-sm font-black uppercase tracking-tight text-white">{selectedBooking.location?.hubId?.name || 'Apartment'}</p>
                                        </div>
                                        <span className="rounded-xl bg-black px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                                            {selectedBooking.status?.replace(/_/g, ' ') || 'unknown'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={13} className="mt-0.5 text-brand shrink-0" />
                                            <span className="text-[10px] font-black uppercase text-black/55">
                                                {[selectedBooking.location?.parkingDetails?.basement, selectedBooking.location?.parkingDetails?.block, selectedBooking.location?.parkingDetails?.pillar].filter(Boolean).join(' • ') || 'Parking route pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CalendarClock size={13} className="mt-0.5 text-brand shrink-0" />
                                            <span className="text-[10px] font-black uppercase text-black/55">
                                                {formatDate(selectedBooking.schedule?.date || selectedBooking.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedBooking.issues?.length > 0 && (
                                        <div className="rounded-2xl bg-white/5 p-4 border border-black/[0.04]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Latest issues</p>
                                            <div className="mt-3 space-y-3">
                                                {[...selectedBooking.issues].slice(-3).reverse().map((issue, index) => (
                                                    <div key={issue._id || `${issue.type}-${index}`} className="rounded-xl bg-white/[0.02] px-3 py-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-[10px] font-black uppercase text-white">{issue.type || 'Issue'}</p>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-red-500">{issue.status || 'open'}</span>
                                                        </div>
                                                        <p className="mt-1 text-[10px] font-bold text-black/55 leading-relaxed">{issue.description || 'No description shared'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Issue type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ISSUE_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setIssueType(option.id)}
                                            className={`rounded-2xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${issueType === option.id ? 'border-brand bg-brand/10 text-brand' : 'border-black/[0.06] bg-white/[0.02] text-black/50'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Describe issue</label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    placeholder="Explain what happened so admin can resolve the apartment wash issue quickly..."
                                    className="w-full rounded-2xl border border-black/[0.06] bg-white/[0.02] px-4 py-4 text-[11px] font-bold tracking-tight text-white outline-none focus:border-brand/20"
                                />
                            </div>

                            <button
                                onClick={handleSubmitIssue}
                                disabled={submitting || !selectedBookingId}
                                className="w-full rounded-2xl bg-black py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
                            >
                                {submitting ? 'Sending issue' : 'Report to admin'}
                            </button>

                            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-600" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Need urgent help?</p>
                                </div>
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-tight text-amber-900/80">
                                    For safety or urgent vehicle-access issues, report here immediately so admin can intervene before the next wash cycle.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </MobileLayout>
    );
};

export default ApartmentWashSupport;
