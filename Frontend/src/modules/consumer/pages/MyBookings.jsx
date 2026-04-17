import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, CheckCircle2, XCircle, Star, ChevronRight,
    Navigation, RotateCcw, Filter, Zap, ArrowRight, ChevronLeft,
    Calendar, Inbox, MapPin
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['Active', 'Past', 'Cancelled'];

const MyBookings = () => {
    const navigate = useNavigate();
    const { bookings, user } = useAuth();
    const [activeTab, setActiveTab] = useState('Active');

    const userBookings = bookings.filter(b => b.consumer === user?.id || b.consumer?.id === user?.id || b.userId === user?.id);
    const activeStatuses = [
        'pending', 'confirmed', 'accepted', 'assigned',
        'en_route', 'arrived', 'active',
        'before_photo', 'in_progress', 'after_photo',
        'pickup-assigned', 'at-studio', 'quality-check',
        'ready-for-delivery', 'delivery-assigned', 'out_for_delivery'
    ];

    const getDisplayStatus = (status) => {
        const mapping = {
            'pending': 'Searching',
            'confirmed': 'Found captain',
            'accepted': 'Driver accepted',
            'assigned': 'Confirmed',
            'en_route': 'En route',
            'arrived': 'Arrived',
            'active': 'Trip active',
            'before_photo': 'Inspecting',
            'in_progress': 'Washing',
            'after_photo': 'Finishing',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'pickup-assigned': 'Pickup',
            'at-studio': 'At studio',
            'quality-check': 'Audit',
            'ready-for-delivery': 'Delivering'
        };
        return mapping[status] || status;
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return 'text-emerald-500 bg-emerald-50';
        if (status === 'cancelled') return 'text-red-500 bg-red-50';
        if (['pending', 'confirmed'].includes(status)) return 'text-amber-500 bg-amber-50';
        return 'text-blue-500 bg-blue-50';
    };

    const mappedBookings = {
        Active: userBookings.filter(b => activeStatuses.includes(b.status)).map(b => {
            const isVendor = b.service?.type === 'vendor' || b.type === 'vendor';
            return {
                id: b._id || b.id,
                bookingId: b.bookingId || b.id,
                service: b.service?.name || b.serviceName || 'Car wash',
                captain: b.provider?.id?.name || b.provider?.name || (isVendor ? 'Service studio' : 'Searching…'),
                captainImg: b.provider?.id?.photo || b.provider?.photo || null,
                carImg: b.vehicle?.image || b.vehicleImg || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
                status: getDisplayStatus(b.status),
                statusColor: getStatusColor(b.status),
                eta: b.status === 'en_route' ? '12 min' : (b.status === 'in_progress' ? 'Washing' : '—'),
                amount: `₹${b.pricing?.totalAmount || b.amount || b.price}`,
                date: b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
                type: b.service?.type || b.type || 'captain',
                rawStatus: b.status
            };
        }),
        Past: userBookings.filter(b => b.status === 'completed').map(b => ({
            id: b._id || b.id,
            bookingId: b.bookingId || b.id,
            service: b.service?.name || b.serviceName,
            captain: b.provider?.id?.name || 'Rahul Sharma',
            captainImg: b.provider?.id?.photo || null,
            carImg: b.vehicle?.image || b.vehicleImg || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
            status: 'Completed',
            statusColor: 'text-emerald-500 bg-emerald-50',
            rating: b.feedback?.rating || 0,
            rated: !!b.feedback?.rating,
            amount: `₹${b.pricing?.totalAmount || b.amount || b.price}`,
            date: b.createdAt ? new Date(b.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'Recently'
        })),
        Cancelled: userBookings.filter(b => b.status === 'cancelled').map(b => ({
            id: b._id || b.id,
            bookingId: b.bookingId || b.id,
            service: b.service?.name || b.serviceName,
            status: 'Cancelled',
            statusColor: 'text-red-500 bg-red-50',
            amount: `₹${b.pricing?.totalAmount || b.amount || b.price}`,
            date: b.createdAt ? new Date(b.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'Recently',
            carImg: b.vehicle?.image || b.vehicleImg || 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=400&q=80'
        }))
    };

    const list = mappedBookings[activeTab];

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">My bookings</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Manage your requests</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-5">
                    {/* ── Tabs ── */}
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {TABS.map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>
                                {tab}
                                <span className={`h-4.5 px-1.5 rounded-lg flex items-center justify-center text-[9px] font-bold ${activeTab === tab ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {mappedBookings[tab].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ── Booking Feed ── */}
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {list.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                    <Inbox size={32} className="text-slate-100 mx-auto mb-3" />
                                    <p className="text-[12px] font-bold text-slate-300">No bookings in this sector</p>
                                </div>
                            ) : list.map((b) => <BookingCard key={b.id} booking={b} onNavigate={navigate} />)}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Quick Action ── */}
                    <button 
                        onClick={() => navigate('/instant-wash')} 
                        className="w-full bg-slate-900 p-5 rounded-[2rem] flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all group shadow-xl"
                    >
                        <div className="w-11 h-11 bg-brand rounded-2xl flex items-center justify-center shrink-0">
                            <Zap size={22} className="text-slate-900" fill="currentColor" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-bold text-[15px] leading-tight mb-1">Book a new wash</p>
                            <p className="text-white/40 text-[10px] font-medium leading-none">Instant or scheduled service</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/20 group-hover:text-brand transition-colors">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

const BookingCard = ({ booking: b, onNavigate }) => (
    <motion.div 
        whileTap={{ scale: 0.99 }}
        onClick={() => {
            if (b.type === 'sparedriver') {
                if (['pending', 'confirmed', 'accepted', 'assigned', 'en_route', 'arrived', 'active'].includes(b.rawStatus)) {
                    onNavigate('/spare-driver');
                    return;
                }
                onNavigate(`/spare-driver/history?bookingId=${b.id}`);
                return;
            }
            if (['Searching', 'En route', 'Washing', 'At studio', 'Trip active'].includes(b.status)) onNavigate(`/booking-status?type=${b.type}&id=${b.id}`);
            else onNavigate(`/order/${b.id}`);
        }}
        className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
    >
        <div className="relative h-28 overflow-hidden">
            <img src={b.carImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold ${b.statusColor} shadow-md`}>
                {b.status === 'Completed' && <CheckCircle2 size={12} />}
                {b.status === 'Cancelled' && <XCircle size={12} />}
                {['Searching', 'En route', 'Washing', 'Delivering', 'Trip active'].includes(b.status) && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {b.status}
            </div>
            <div className="absolute bottom-3 left-3 space-y-1">
                <p className="text-white font-bold text-[15px] leading-none">{b.service}</p>
                <p className="text-white/40 text-[9px] font-medium leading-none">{b.bookingId || b.id}</p>
            </div>
            <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <p className="text-white font-bold text-[14px] leading-none">{b.amount}</p>
            </div>
        </div>

        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {b.captainImg ? (
                    <img src={b.captainImg} className="w-9 h-9 rounded-xl object-cover border border-slate-50 shadow-sm" alt="" />
                ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Navigation size={16} className="text-slate-300" />
                    </div>
                )}
                <div>
                    <h4 className="text-[13px] font-bold text-slate-800 leading-none mb-1.5">{b.captain || 'Service staff'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-none">{b.date}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {['En route', 'Washing', 'Pickup', 'Trip active'].includes(b.status) && (
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-500 px-3 py-1.5 rounded-xl border border-blue-100/30">
                        <Clock size={12} strokeWidth={3} /><span className="font-bold text-[11px]">{b.eta}</span>
                    </div>
                )}
                {b.status === 'Completed' && !b.rated && (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-100/30">
                        <Star size={12} fill="currentColor" /><span className="font-bold text-[11px]">Rate</span>
                    </div>
                )}
                {b.status === 'Completed' && b.rated && (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-100/30">
                        <Star size={12} fill="currentColor" /><span className="font-bold text-[11px]">{b.rating}</span>
                    </div>
                )}
                {b.status === 'Cancelled' && (
                    <div className="flex items-center gap-1.5 bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100">
                        <RotateCcw size={12} strokeWidth={3} /><span className="font-bold text-[11px]">Rebook</span>
                    </div>
                )}
                <ChevronRight size={16} className="text-slate-200" />
            </div>
        </div>
    </motion.div>
);

export default MyBookings;
