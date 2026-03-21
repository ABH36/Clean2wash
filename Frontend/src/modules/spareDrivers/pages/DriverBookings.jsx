import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, XCircle, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverBookings = () => {
    const [tab, setTab] = useState('AVAILABLE');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        spareDriverAPI.getBookings()
            .then(res => {
                if (res?.data?.bookings) setBookings(res.data.bookings);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Map DB bookings to display structure
    const available = bookings
        .filter(b => !['completed', 'cancelled', 'en_route', 'arrived', 'active'].includes(b.status))
        .map(b => ({
            id: b._id,
            type: b.service?.name || 'Service',
            customer: b.consumer?.name || 'Customer',
            pickup: b.location?.address?.street || b.location?.address?.city || 'Unknown',
            dist: '--',
            reward: `₹${b.pricing?.totalAmount || 0}`
        }));

    const scheduled = bookings
        .filter(b => ['en_route', 'arrived', 'active'].includes(b.status))
        .map(b => ({
            id: b._id,
            type: b.service?.name || 'Service',
            customer: b.consumer?.name || 'Customer',
            date: b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : 'ASAP',
            reward: `₹${b.pricing?.totalAmount || 0}`,
            status: b.status.toUpperCase()
        }));

    const handleAccept = async (id) => {
        try {
            await spareDriverAPI.acceptBooking(id);
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'en_route' } : b));
        } catch (err) {
            console.error('Failed to accept booking', err);
        }
    };

    const BookingCard = ({ b, isAvail, onAccept }) => (
        <div className="border border-gray-100 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">{b.id}</p>
                    <p className="text-sm font-black text-black uppercase">{b.type}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-black">{b.reward}</p>
                    {b.status && (
                        <span className="text-[8px] font-black text-[#F29F05] uppercase">{b.status}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <User size={11} className="text-black/25" />
                <span className="text-[10px] font-black text-black/50 uppercase">{b.customer}</span>
                <span className="text-black/10 mx-1">|</span>
                {b.pickup ? (
                    <>
                        <MapPin size={11} className="text-black/25" />
                        <span className="text-[10px] font-black text-black/50 uppercase">{b.pickup}</span>
                        <span className="text-[10px] font-black text-black/25 ml-auto">{b.dist}</span>
                    </>
                ) : (
                    <>
                        <Clock size={11} className="text-black/25" />
                        <span className="text-[10px] font-black text-black/50 uppercase">{b.date}</span>
                    </>
                )}
            </div>

            {isAvail ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => onAccept && onAccept(b.id)}
                        className="flex-1 h-9 bg-[#F29F05] text-black text-[10px] font-black uppercase tracking-widest rounded-md"
                    >
                        Accept
                    </button>
                    <button className="w-9 h-9 border border-gray-200 text-black/30 rounded-md flex items-center justify-center">
                        <XCircle size={15} />
                    </button>
                </div>
            ) : (
                <button className="w-full h-9 border border-gray-100 text-black text-[10px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-2">
                    View Details <ChevronRight size={13} />
                </button>
            )}
        </div>
    );

    return (
        <DriverLayout title="Bookings">
            <div className="px-5 py-6 space-y-5">

                {/* ── Tab Switch ── */}
                <div className="flex border border-gray-100 rounded-lg overflow-hidden">
                    {['AVAILABLE', 'SCHEDULED'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-black text-white' : 'text-black/30'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* ── Cards ── */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-black/20" /></div>
                    ) : tab === 'AVAILABLE' ? (
                        available.length > 0
                            ? available.map(b => <BookingCard key={b.id} b={b} isAvail onAccept={handleAccept} />)
                            : (
                                <div className="py-16 flex flex-col items-center gap-2 opacity-20">
                                    <Calendar size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No jobs nearby</p>
                                </div>
                            )
                    ) : (
                        scheduled.map(b => <BookingCard key={b.id} b={b} isAvail={false} />)
                    )}
                </div>

            </div>
        </DriverLayout>
    );
};

export default DriverBookings;
