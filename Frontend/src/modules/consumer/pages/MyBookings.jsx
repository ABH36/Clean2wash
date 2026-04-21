import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, CheckCircle2, XCircle, Star, ChevronRight,
    Navigation, RotateCcw, Zap, ArrowRight, ChevronLeft, Inbox, Sparkles
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const TABS = ['Active', 'Past', 'Cancelled'];
const ACTIVE_STATUSES = ['pending', 'confirmed', 'accepted', 'assigned', 'en_route', 'arrived', 'active'];
const isSpareDriverBooking = (booking = {}) => (
    booking?.service?.type === 'sparedriver'
    || booking?.type === 'sparedriver'
    || booking?.service?.category === 'Chauffeur'
    || String(booking?.serviceName || '').toLowerCase().includes('chauffeur')
    || String(booking?.serviceName || '').toLowerCase().includes('spare driver')
);

const getDisplayStatus = (status) => {
    const mapping = {
        pending: 'Searching',
        confirmed: 'Found driver',
        accepted: 'Driver accepted',
        assigned: 'Confirmed',
        en_route: 'En route',
        arrived: 'Arrived',
        active: 'Trip active',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };
    return mapping[status] || status;
};

const getStatusColor = (rawStatus) => {
    if (rawStatus === 'completed') return 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
    if (rawStatus === 'cancelled') return 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
    if (['pending', 'confirmed'].includes(rawStatus)) return 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20';
    return 'text-blue-500 bg-blue-500/10 border border-blue-500/20';
};

const normalizeBooking = (booking) => ({
    id: booking?._id || booking?.id,
    bookingId: booking?.bookingId || booking?._id || booking?.id,
    service: booking?.service?.name || booking?.serviceName || 'Spare Driver',
    driver: booking?.provider?.id?.name || booking?.provider?.name || 'Searching...',
    driverImg: booking?.provider?.id?.photo || booking?.provider?.photo || null,
    carImg: booking?.vehicle?.image || booking?.vehicleImg || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    rawStatus: booking?.status || 'pending',
    status: getDisplayStatus(booking?.status || 'pending'),
    statusColor: getStatusColor(booking?.status || 'pending'),
    eta: booking?.status === 'en_route' ? '12 min' : (booking?.status === 'active' ? 'Live trip' : '—'),
    amount: `₹${booking?.pricing?.totalAmount || booking?.amount || booking?.price || 0}`,
    date: booking?.createdAt
        ? new Date(booking.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })
        : 'Recently',
    rating: booking?.feedback?.rating || 0,
    rated: Boolean(booking?.feedback?.rating)
});

const BookingSkeleton = ({ isDarkMode }) => (
    <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-[2rem] border overflow-hidden animate-pulse ${
                isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.02] border-black/5'
            }`}>
                <div className={`h-24 relative overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-black/05'}`}>
                    <div className="absolute inset-0 shimmer-effect" />
                </div>
                <div className="px-3.5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/05'}`} />
                        <div className="space-y-2">
                            <div className={`w-24 h-3 rounded ${isDarkMode ? 'bg-white/5' : 'bg-black/05'}`} />
                            <div className={`w-16 h-2 rounded ${isDarkMode ? 'bg-white/5' : 'bg-black/05'}`} />
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const BookingCard = ({ booking, onNavigate, isDarkMode }) => (
    <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => {
            if (ACTIVE_STATUSES.includes(booking.rawStatus)) {
                onNavigate(`/spare-driver?bookingId=${booking.id}`);
                return;
            }
            onNavigate(`/spare-driver/history?bookingId=${booking.id}`);
        }}
        className={`rounded-[2rem] border overflow-hidden shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'
        }`}
    >
        <div className="relative h-24 overflow-hidden">
            <img src={booking.carImg} alt="" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${isDarkMode ? 'from-[#0A0F0D]' : 'from-black/40'}`} />
            <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest ${booking.statusColor} backdrop-blur-sm shadow-2xl`}>
                {booking.status === 'Completed' && <CheckCircle2 size={10} />}
                {booking.status === 'Cancelled' && <XCircle size={10} />}
                {['Searching', 'En route', 'Trip active'].includes(booking.status) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {booking.status}
            </div>
            <div className="absolute bottom-2.5 left-2.5">
                <p className="text-white font-[1000] text-[13px] tracking-tighter leading-none mb-1">{booking.service}</p>
                <div className="flex items-center gap-2">
                    <p className="text-white/40 text-[8px] font-black tracking-widest leading-none uppercase">{booking.bookingId}</p>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <p className="text-[#F59E0B] font-black text-[12px] leading-none">{booking.amount}</p>
                </div>
            </div>
        </div>

        <div className="px-3.5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                {booking.driverImg ? (
                    <img src={booking.driverImg} className={`w-8 h-8 rounded-lg object-cover border ${isDarkMode ? 'border-white/10' : 'border-black/5'}`} alt="" />
                ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/05 border-black/5'
                    }`}>
                        <Navigation size={14} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
                    </div>
                )}
                <div>
                    <h4 className={`text-[11px] font-black tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{booking.driver}</h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{booking.date}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {['En route', 'Trip active'].includes(booking.status) && (
                    <div className="flex items-center gap-1 bg-[#F59E0B]/10 text-[#F59E0B] px-2.5 py-1.5 rounded-lg border border-[#F59E0B]/20">
                        <Clock size={10} strokeWidth={3} />
                        <span className="font-black text-[9px] uppercase">{booking.eta}</span>
                    </div>
                )}
                {booking.status === 'Completed' && !booking.rated && (
                    <div className="flex items-center gap-1 bg-[#F59E0B]/10 text-[#F59E0B] px-2.5 py-1.5 rounded-lg border border-[#F59E0B]/20">
                        <Star size={10} fill="currentColor" />
                        <span className="font-black text-[9px] uppercase">Rate</span>
                    </div>
                )}
                <ChevronRight size={14} className={isDarkMode ? 'text-white/10' : 'text-black/10'} />
            </div>
        </div>
    </motion.div>
);

const MyBookings = () => {
    const navigate = useNavigate();
    const { bookings, user } = useAuth();
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('Active');

    const isLoading = bookings === null;

    const userBookings = useMemo(
        () => (bookings || []).filter((b) =>
            (b.consumer === user?.id || b.consumer?.id === user?.id || b.userId === user?.id)
            && isSpareDriverBooking(b)
        ),
        [bookings, user?.id]
    );

    const mappedBookings = useMemo(() => {
        const active = userBookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).map(normalizeBooking);
        const past = userBookings.filter((b) => b.status === 'completed').map(normalizeBooking);
        const cancelled = userBookings.filter((b) => b.status === 'cancelled').map(normalizeBooking);
        return { Active: active, Past: past, Cancelled: cancelled };
    }, [userBookings]);

    const list = mappedBookings[activeTab] || [];

    return (
        <MobileLayout>
            <div className={`min-h-screen pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`px-4 py-3 sticky top-0 z-[60] border-b flex items-center justify-between backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/90 border-black/5'}`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all border ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'}`}>
                            <ChevronLeft size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </button>
                        <div>
                            <h1 className={`text-[17px] font-[1000] tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>My bookings</h1>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                        <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                    </div>
                </header>

                <div className="px-4 pt-4 space-y-4">
                    <div className={`flex p-1.5 rounded-[20px] border transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.02] border-black/5 shadow-sm'}`}>
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                    activeTab === tab 
                                        ? (isDarkMode ? 'bg-white text-black shadow-2xl' : 'bg-white text-black shadow-md') 
                                        : (isDarkMode ? 'text-white/20' : 'text-black/30')
                                }`}
                            >
                                {tab}
                                <span className={`h-4.5 px-2 rounded-lg flex items-center justify-center text-[9px] font-[1000] ${
                                    activeTab === tab ? 'bg-[#F59E0B] text-black' : 'bg-white/5 text-white/20'
                                }`}>
                                    {isLoading ? '...' : mappedBookings[tab].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {isLoading ? (
                                <BookingSkeleton isDarkMode={isDarkMode} />
                            ) : list.length === 0 ? (
                                <div className={`text-center py-20 rounded-[2.5rem] border border-dashed transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-black/10'}`}>
                                    <Inbox size={32} className={isDarkMode ? 'text-white/10 mx-auto mb-3' : 'text-black/10 mx-auto mb-3'} />
                                    <p className={`text-[12px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>No history found</p>
                                </div>
                            ) : (
                                list.map((booking) => <BookingCard key={booking.id} booking={booking} onNavigate={navigate} isDarkMode={isDarkMode} />)
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <button
                        onClick={() => navigate('/spare-driver')}
                        className={`w-full px-4 py-3.5 rounded-[22px] flex items-center gap-4 border active:scale-[0.98] transition-all group relative overflow-hidden ${
                            isDarkMode ? 'bg-[#0F1412] border-white/10 shadow-black/50' : 'bg-white border-black/5 shadow-black/5 shadow-2xl'
                        }`}
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#F59E0B]/10 rounded-bl-full -mr-8 -mt-8 blur-xl" />
                        <div className="w-10 h-10 bg-[#F59E0B] rounded-xl flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:rotate-12 shadow-lg">
                            <Zap size={20} className="text-black" fill="currentColor" />
                        </div>
                        <div className="flex-1 text-left relative z-10">
                            <p className={`font-black text-[13px] tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>New booking</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Chauffeur service</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative z-10 ${
                            isDarkMode ? 'bg-white/5 text-white/20 group-hover:text-[#F59E0B]' : 'bg-black/5 text-black/20 group-hover:text-[#F59E0B]'
                        }`}>
                            <ArrowRight size={16} />
                        </div>
                    </button>
                <p className={`text-[10px] font-black text-center py-8 tracking-[0.3em] uppercase leading-none ${isDarkMode ? 'text-white/10' : 'text-black/10'}`}>Service History v1.4</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default MyBookings;
