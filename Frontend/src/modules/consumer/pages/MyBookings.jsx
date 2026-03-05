import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock, CheckCircle2, XCircle, Star, ChevronRight,
    Navigation, RotateCcw, Filter, Zap, ArrowRight, ChevronLeft
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const TABS = ['Active', 'Past', 'Cancelled'];

const BOOKINGS = {
    Active: [
        { id: 'CarWash-8821', service: 'Instant Eco Wash', captain: 'Rahul Sharma', captainImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', carImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', status: 'Captain En Route', statusColor: 'text-blue-600 bg-blue-50', eta: '12 min', amount: '₹473', date: 'Today, 2:30 PM' },
    ],
    Past: [
        { id: 'CarWash-7761', service: 'Full Deep Clean', captain: 'Amit Singh', captainImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', carImg: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80', status: 'Completed', statusColor: 'text-green-600 bg-green-50', rating: 4.9, rated: true, amount: '₹1,199', date: 'Yesterday, 10:15 AM' },
        { id: 'CarWash-7102', service: 'Instant Eco Wash', captain: 'Vikram Das', captainImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', carImg: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80', status: 'Completed', statusColor: 'text-green-600 bg-green-50', rating: 4.7, rated: false, amount: '₹299', date: 'Feb 18, 3:00 PM' },
    ],
    Cancelled: [
        { id: 'CarWash-6490', service: 'Tire & Rim Shine', captain: null, captainImg: null, carImg: 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=400&q=80', status: 'Cancelled', statusColor: 'text-red-600 bg-red-50', amount: '₹199', date: 'Feb 15, 12:00 PM' },
    ],
};

const MyBookings = () => {
    const navigate = useNavigate();
    const { bookings, user, registeredUsers } = useAuth();
    const [activeTab, setActiveTab] = useState('Active');

    // Filter and Map Bookings
    const userBookings = bookings.filter(b => b.userId === user?.id || b.userId === 'GUEST');

    const mappedBookings = {
        Active: userBookings.filter(b => ['pending', 'confirmed', 'in-progress', 'scheduled'].includes(b.status)).map(b => {
            const performer = b.performerId ? [...(registeredUsers.captain || []), ...(registeredUsers.staff || [])].find(u => u.id === b.performerId) : null;
            const isDriver = b.type === 'sparedrivers' || b.category === 'Chauffeur';

            return {
                id: b.id || b._id,
                service: b.serviceName || b.service?.name || 'Cleaning Service',
                captain: b.driver?.name || performer?.name || 'Searching…',
                captainImg: b.driver?.img || null,
                carImg: b.vehicleImg || (isDriver ? 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80' : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'),
                status: b.status === 'pending' ? 'Matching' : b.status === 'confirmed' ? 'En Route' : b.status === 'in-progress' ? 'In Progress' : 'Scheduled',
                statusColor: b.status === 'pending' ? 'text-violet-600 bg-violet-50' : b.status === 'scheduled' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50',
                eta: b.status === 'scheduled' ? (b.service?.scheduledAt || b.date || 'Soon') : (b.status === 'confirmed' ? '12 min' : (b.status === 'in-progress' ? 'Washing' : '—')),
                amount: b.price || b.amount || '—',
                date: b.date || new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: b.type
            };
        }),
        Past: userBookings.filter(b => b.status === 'completed' || b.status === 'finished').map(b => ({
            id: b.id || b._id,
            service: b.serviceName || b.service?.name,
            captain: b.driver?.name || 'Rahul Sharma',
            captainImg: b.driver?.img || null,
            carImg: b.vehicleImg || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&q=80',
            status: 'Completed',
            statusColor: 'text-green-600 bg-green-50',
            rating: b.rating || 4.9,
            rated: b.rated !== undefined ? b.rated : true,
            amount: b.price || b.amount,
            date: b.date || new Date(b.timestamp).toLocaleDateString()
        })),
        Cancelled: userBookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).map(b => ({
            id: b.id || b._id,
            service: b.serviceName || b.service?.name,
            status: 'Cancelled',
            statusColor: 'text-red-600 bg-red-50',
            amount: b.price || b.amount,
            date: b.date || new Date(b.timestamp).toLocaleDateString(),
            carImg: b.vehicleImg || 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=400&q=80'
        }))
    };

    const list = mappedBookings[activeTab];

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-content leading-none">My Bookings</h1>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest mt-0.5">Wash History</p>
                    </div>
                </div>
                <button className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Filter size={16} strokeWidth={2.5} className="text-content-muted" />
                </button>
            </header>

            <div className="px-4 pt-4 pb-24 space-y-4">

                {/* ── Tabs ── */}
                <div className="flex gap-2">
                    {TABS.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-brand text-white shadow-md' : 'bg-white border border-gray-100 text-content-subtle'
                                }`}>
                            {tab} <span className={`ml-1 px-1 py-0.5 rounded text-[8px] ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100'}`}>{mappedBookings[tab].length}</span>
                        </button>
                    ))}
                </div>

                {/* ── Cards ── */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                        {list.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Clock size={24} className="text-content-subtle" />
                                </div>
                                <p className="font-black text-content-subtle text-sm">No bookings here</p>
                            </div>
                        ) : list.map((b) => <BookingCard key={b.id} booking={b} onNavigate={navigate} />)}
                    </motion.div>
                </AnimatePresence>

                {/* ── Book Again CTA ── */}
                <div onClick={() => navigate('/instant-wash')} className="flex items-center gap-4 bg-content p-4 rounded-2xl cursor-pointer group">
                    <div className="w-11 h-11 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap size={20} className="text-white" fill="white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm tracking-tight">Book a new wash</p>
                        <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">Instant or Scheduled</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={15} className="text-white" strokeWidth={2.5} />
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

const BookingCard = ({ booking: b, onNavigate }) => (
    <motion.div whileTap={{ scale: 0.99 }}
        onClick={() => {
            if (['Matching', 'En Route', 'In Progress'].includes(b.status)) onNavigate(`/booking-status?type=${b.type}&id=${b.id}`);
            else onNavigate(`/order/${b.id}`);
        }}
        className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden cursor-pointer">
        <div className="relative h-28 overflow-hidden">
            <img src={b.carImg} alt={b.service} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${b.statusColor}`}>
                {b.status === 'Completed' && <CheckCircle2 size={10} strokeWidth={3} />}
                {b.status === 'Cancelled' && <XCircle size={10} strokeWidth={3} />}
                {['Matching', 'En Route', 'In Progress', 'Scheduled'].includes(b.status) && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />}
                <span className="text-[8px] font-black uppercase tracking-widest">{b.status}</span>
            </div>
            <div className="absolute bottom-3 left-3">
                <p className="text-white font-black text-base tracking-tight leading-none">{b.service}</p>
                <p className="text-white/60 text-[9px] font-bold mt-0.5">{b.id}</p>
            </div>
            <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                <span className="text-white font-black text-sm">{b.amount}</span>
            </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                {b.captainImg ? (
                    <img src={b.captainImg} alt={b.captain} className="w-8 h-8 rounded-xl object-cover border border-gray-100" />
                ) : (
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Navigation size={13} className="text-content-subtle" />
                    </div>
                )}
                <div>
                    <p className="font-black text-sm text-content leading-none">{b.captain || 'No Captain'}</p>
                    <p className="text-[9px] text-content-subtle font-bold mt-0.5">{b.date}</p>
                </div>
            </div>
            <div>
                {['En Route', 'In Progress', 'Scheduled'].includes(b.status) && (
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl">
                        <Clock size={12} strokeWidth={3} /><span className="font-black text-xs">{b.eta}</span>
                    </div>
                )}
                {b.status === 'Completed' && !b.rated && (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl">
                        <Star size={12} fill="currentColor" /><span className="font-black text-xs">Rate</span>
                    </div>
                )}
                {b.status === 'Completed' && b.rated && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-2 rounded-xl">
                        <Star size={12} fill="currentColor" /><span className="font-black text-xs">{b.rating}</span>
                    </div>
                )}
                {b.status === 'Cancelled' && (
                    <div className="flex items-center gap-1 bg-gray-50 text-content-subtle px-3 py-2 rounded-xl">
                        <RotateCcw size={12} strokeWidth={2.5} /><span className="font-black text-xs">Rebook</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default MyBookings;
