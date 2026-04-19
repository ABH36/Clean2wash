import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, CheckCircle2, XCircle, Star, ChevronRight,
    Navigation, RotateCcw, Zap, ArrowRight, ChevronLeft, Inbox
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

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
    if (rawStatus === 'completed') return 'text-emerald-500 bg-emerald-50';
    if (rawStatus === 'cancelled') return 'text-red-500 bg-red-50';
    if (['pending', 'confirmed'].includes(rawStatus)) return 'text-amber-500 bg-amber-50';
    return 'text-blue-500 bg-blue-50';
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

const BookingCard = ({ booking, onNavigate }) => (
    <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => {
            if (ACTIVE_STATUSES.includes(booking.rawStatus)) {
                onNavigate('/spare-driver');
                return;
            }
            onNavigate(`/spare-driver/history?bookingId=${booking.id}`);
        }}
        className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
    >
        <div className="relative h-24 overflow-hidden">
            <img src={booking.carImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
            <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${booking.statusColor} shadow-md`}>
                {booking.status === 'Completed' && <CheckCircle2 size={10} />}
                {booking.status === 'Cancelled' && <XCircle size={10} />}
                {['Searching', 'En route', 'Trip active'].includes(booking.status) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {booking.status}
            </div>
            <div className="absolute bottom-2.5 left-2.5">
                <p className="text-white font-[1000] text-[13px] uppercase tracking-tight leading-none mb-1">{booking.service}</p>
                <div className="flex items-center gap-2">
                    <p className="text-white/40 text-[8px] font-black tracking-widest leading-none uppercase">{booking.bookingId}</p>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <p className="text-[#FF9900] font-black text-[12px] leading-none uppercase">{booking.amount}</p>
                </div>
            </div>
        </div>

        <div className="px-3.5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                {booking.driverImg ? (
                    <img src={booking.driverImg} className="w-8 h-8 rounded-lg object-cover border border-slate-50 shadow-sm" alt="" />
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Navigation size={14} className="text-slate-300" />
                    </div>
                )}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 leading-none mb-1 uppercase tracking-tight">{booking.driver}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{booking.date}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {['En route', 'Trip active'].includes(booking.status) && (
                    <div className="flex items-center gap-1 bg-[#FF9900]/10 text-[#FF9900] px-2.5 py-1.5 rounded-lg border border-[#FF9900]/20">
                        <Clock size={10} strokeWidth={3} />
                        <span className="font-black text-[9px] uppercase">{booking.eta}</span>
                    </div>
                )}
                {booking.status === 'Completed' && !booking.rated && (
                    <div className="flex items-center gap-1 bg-[#FF9900]/05 text-[#FF9900] px-2.5 py-1.5 rounded-lg border border-[#FF9900]/10">
                        <Star size={10} fill="currentColor" />
                        <span className="font-black text-[9px] uppercase">Rate</span>
                    </div>
                )}
                <ChevronRight size={14} className="text-slate-200" />
            </div>
        </div>
    </motion.div>
);

const MyBookings = () => {
    const navigate = useNavigate();
    const { bookings, user } = useAuth();
    const [activeTab, setActiveTab] = useState('Active');

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
            <div className="bg-slate-50 min-h-screen pb-32">
                <header className="px-4 py-3 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={18} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">My Bookings</h1>
                        </div>
                    </div>
                </header>

                <div className="px-4 pt-4 space-y-4">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                    activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'
                                }`}
                            >
                                {tab}
                                <span className={`h-4.5 px-2 rounded-lg flex items-center justify-center text-[9px] font-black ${
                                    activeTab === tab ? 'bg-[#FF9900] text-slate-900' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    {mappedBookings[tab].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {list.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                    <Inbox size={32} className="text-slate-100 mx-auto mb-3" />
                                    <p className="text-[12px] font-bold text-slate-300">No bookings in this tab</p>
                                </div>
                            ) : (
                                list.map((booking) => <BookingCard key={booking.id} booking={booking} onNavigate={navigate} />)
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <button
                        onClick={() => navigate('/spare-driver')}
                        className="w-full bg-slate-900 px-4 py-3.5 rounded-[22px] flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all group shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF9900]/10 rounded-bl-full -mr-8 -mt-8 blur-xl" />
                        <div className="w-10 h-10 bg-[#FF9900] rounded-xl flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:rotate-12">
                            <Zap size={20} className="text-slate-900" fill="currentColor" />
                        </div>
                        <div className="flex-1 text-left relative z-10">
                            <p className="text-white font-[1000] text-[13px] uppercase tracking-tight leading-none mb-1">New Booking</p>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">Chauffeur Service</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/20 group-hover:text-[#FF9900] transition-colors relative z-10">
                            <ArrowRight size={16} />
                        </div>
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default MyBookings;
