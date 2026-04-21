import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, History, MapPin, Clock, ShieldCheck, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import MobileLayout from '../components/layout/MobileLayout';
import api from '../../../utils/api';

const formatDateTime = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getBadgeClass = (status = '') => ({
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-600',
    vehicle_not_available: 'bg-orange-50 text-orange-700',
    skipped: 'bg-white/[0.05] text-white/60',
    confirmed: 'bg-blue-50 text-blue-700',
    en_route: 'bg-blue-50 text-blue-700',
    arrived: 'bg-brand/10 text-brand',
    washing: 'bg-purple-50 text-purple-700',
    before_photo: 'bg-purple-50 text-purple-700',
    after_photo: 'bg-purple-50 text-purple-700'
}[status] || 'bg-white/[0.05] text-white/60');

const ApartmentWashHistory = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectedBookingId = searchParams.get('bookingId');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.request('/bookings/history?category=Apartment&limit=25');
                setBookings(response?.data?.bookings || []);
            } catch (error) {
                console.error('Failed to fetch apartment wash history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const orderedBookings = useMemo(() => {
        return [...bookings].sort((a, b) => {
            if (selectedBookingId && a._id === selectedBookingId) return -1;
            if (selectedBookingId && b._id === selectedBookingId) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [bookings, selectedBookingId]);

    return (
        <MobileLayout>
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-5 pt-12 pb-4 flex items-center gap-4 border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-black/05'}`}>
                    <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/[0.02] text-white' : 'bg-black/[0.05] text-black'}`}>
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className={`text-xl font-black tracking-tight uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Apartment history</h1>
                </header>

                <div className="p-5 space-y-4 pb-24">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-white/5 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : orderedBookings.length > 0 ? (
                        orderedBookings.map((booking) => {
                            const issueCount = Array.isArray(booking.issues)
                                ? booking.issues.filter((issue) => ['open', 'investigating'].includes(issue.status)).length
                                : 0;
                            const route = [booking.location?.parkingDetails?.basement, booking.location?.parkingDetails?.block, booking.location?.parkingDetails?.pillar]
                                .filter(Boolean)
                                .join(' • ');
                            const isSelected = selectedBookingId === booking._id;
                            const isLive = !['completed', 'cancelled', 'refunded', 'skipped', 'vehicle_not_available'].includes(booking.status);

                            return (
                                <motion.div
                                    key={booking._id}
                                    whileTap={{ scale: 0.985 }}
                                    className={`bg-white/5 border rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 ${isSelected ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20">
                                                <History size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-black text-white uppercase tracking-tight leading-none mb-1">
                                                    {booking.service?.name || 'Apartment Wash'}
                                                </h3>
                                                <p className="text-[9px] font-bold text-black/35 uppercase tracking-widest">
                                                    #{booking.bookingId || booking._id?.slice(-6)} • {booking.location?.hubId?.name || booking.location?.address?.street || 'Apartment'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] ${getBadgeClass(booking.status)}`}>
                                            {booking.status?.replace(/_/g, ' ') || 'unknown'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-white/[0.02] p-3">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-black/30">Slot</p>
                                            <p className="mt-1 text-[11px] font-black uppercase text-white">{booking.schedule?.slot || booking.schedule?.timeSlot?.start || 'Pending'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/[0.02] p-3">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-black/30">Route</p>
                                            <p className="mt-1 text-[11px] font-black uppercase text-white">{route || 'Parking pending'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-black/[0.03] pt-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={12} className="text-brand mt-0.5 shrink-0" />
                                            <span className="text-[10px] font-black text-black/55 uppercase">
                                                {booking.location?.address?.street || booking.location?.address?.formattedAddress || 'Apartment address pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-black/35" />
                                            <span className="text-[10px] font-black text-black/55 uppercase">
                                                {formatDateTime(booking.schedule?.date || booking.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {booking.feedback?.rating && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-700">
                                                    <Star size={10} fill="currentColor" /> Rated {booking.feedback.rating}/5
                                                </span>
                                            )}
                                            {issueCount > 0 && (
                                                <span className="rounded-md bg-red-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-red-600">
                                                    {issueCount} issue{issueCount > 1 ? 's' : ''} open
                                                </span>
                                            )}
                                            {booking.serviceImages?.after?.length > 0 && (
                                                <span className="rounded-md bg-blue-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-blue-600">
                                                    Proof uploaded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                if (isLive) {
                                                    navigate(`/booking-status?id=${booking._id}&type=apartment`);
                                                    return;
                                                }
                                                navigate(`/rate?id=${booking._id}`);
                                            }}
                                            className="h-11 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest"
                                        >
                                            {isLive ? 'Track wash' : booking.feedback?.rating ? 'Update rating' : 'Rate wash'}
                                        </button>
                                        <button
                                            onClick={() => navigate(`/apartment-wash/support?bookingId=${booking._id}`)}
                                            className="h-11 rounded-xl border border-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Support
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center py-20 gap-3 opacity-30">
                            <ShieldCheck size={48} />
                            <p className="text-sm font-black uppercase tracking-widest">No apartment wash history</p>
                        </div>
                    )}
                </div>
            </div>
        </MobileLayout>
    );
};

export default ApartmentWashHistory;
