import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Clock, MapPin, ChevronRight, AlertCircle, Zap } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';

const DriverDashboard = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [driver, setDriver] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            spareDriverAPI.getProfile(),
            spareDriverAPI.getBookings(),
            spareDriverAPI.getTransactions({ limit: 5 })
        ]).then(([profileRes, bookingsRes, transRes]) => {
            setDriver(profileRes.data.driver);
            setBookings(bookingsRes.data.bookings || []);
            setTransactions(transRes.data.transactions || []);
            setIsOnline(profileRes.data.driver.isOnline || false);
        }).catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // 📍 Phase 1: Live Pulse Protocol
    useEffect(() => {
        let watchId = null;

        if (isOnline) {
            console.log('[DriverDashboard] Going Online: Starting Pulse...');
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;

                        // 1. Update Backend (REST)
                        spareDriverAPI.updateLocation(latitude, longitude).catch(err => {
                            console.error("Pulse Failed:", err);
                        });

                        // 2. Broadcast via Socket if trip is active
                        const activeTrip = bookings.find(b => ['en_route', 'arrived', 'active'].includes(b.status));
                        if (activeTrip) {
                            socketService.connect();
                            socketService.joinBookingRoom(activeTrip._id);
                            const socket = socketService.getSocket();
                            if (socket) {
                                socket.emit('update_location', {
                                    bookingId: activeTrip._id,
                                    location: { lat: latitude, lng: longitude }
                                });
                            }
                        }
                    },
                    (err) => console.error('GPS Protocol Error:', err),
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
                );
            }
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [isOnline, bookings]);

    const activeJob = bookings.find(b => ['en_route', 'arrived', 'active', 'pending'].includes(b.status));

    const getJobDisplay = (job) => {
        if (!job) return null;
        return {
            customer: job.consumer?.name || 'Customer',
            pickup: job.location?.address?.street || 'Pick up location',
            time: job.status === 'pending' ? 'Immediate' : 'In Progress',
            type: job.service?.name || 'Chauffeur Service',
            reward: `₹${job.pricing?.totalAmount || 0}`
        };
    };

    const handleToggleOnline = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await spareDriverAPI.toggleOnline(newStatus);
        } catch (error) {
            console.error('Toggle online failed:', error);
            setIsOnline(!newStatus); // Rollback on error
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        let pin = null;
        if (newStatus === 'active') {
            pin = window.prompt('Enter 4-digit Security PIN from customer:');
            if (!pin) return;
        }

        try {
            await spareDriverAPI.updateBookingStatus(bookingId, newStatus, pin);
            // Refresh data to show updated status
            const data = await spareDriverAPI.getBookings();
            setBookings(data.data.bookings || []);
        } catch (error) {
            alert(error.message || 'Failed to update status');
        }
    };

    const handleCancel = async (bookingId) => {
        const reason = window.prompt('Please provide a reason for cancellation:');
        if (reason === null) return;

        try {
            await spareDriverAPI.cancelBooking(bookingId, reason);
            const data = await spareDriverAPI.getBookings();
            setBookings(data.data.bookings || []);
            toast.success('Booking cancelled successfully');
        } catch (error) {
            alert(error.message || 'Failed to cancel booking');
        }
    };

    const jobInfo = getJobDisplay(activeJob);

    if (loading) {
        return (
            <DriverLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-[#F29F05] border-t-transparent rounded-full animate-spin" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Dashboard">
            <div className="px-5 py-6 space-y-5">

                {/* ── Online Toggle ── */}
                <div className="border border-gray-100 rounded-lg p-4 flex items-center justify-between transition-all duration-500">
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-sm font-black uppercase transition-colors ${isOnline ? 'text-green-600' : 'text-black'}`}>
                            {isOnline ? 'Online — Preparing Pulse' : 'Offline'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleOnline}
                        className={`w-12 h-6 rounded-sm relative transition-colors duration-300 flex items-center px-0.5 ${isOnline ? 'bg-[#F29F05]' : 'bg-gray-200'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-sm shadow transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Today's Pay", value: `₹${driver?.wallet?.balance || 0}`, note: 'wallet' },
                        { label: 'Rating', value: (driver?.rating || 5.0).toFixed(1), note: '★' },
                        { label: 'Status', value: driver?.status === 'active' ? 'Verified' : 'Reviewing', note: 'shield' },
                    ].map((s, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-3">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">{s.label}</p>
                            <p className="text-[17px] font-black text-black leading-none">{s.value}</p>
                            <p className="text-[8px] font-black text-[#F29F05] uppercase mt-1">{s.note}</p>
                        </div>
                    ))}
                </div>

                {/* ── Active Job ── */}
                {jobInfo ? (
                    <div className={`border rounded-lg p-4 space-y-3 transition-all ${activeJob.status === 'pending' ? 'border-gray-100 bg-white' : 'border-[#F29F05] bg-[#FFFBF0]'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${activeJob.status === 'pending' ? 'text-black/30' : 'text-[#F29F05]'}`}>
                                {activeJob.status === 'pending' ? 'Available Request' : 'Active Mission'}
                            </span>
                            <span className="text-[9px] font-black text-black/30 uppercase">{jobInfo.reward}</span>
                        </div>

                        <div>
                            <p className="text-sm font-black text-black uppercase">{jobInfo.type}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-black/40">
                                <Clock size={11} />
                                <span className="text-[10px] font-black uppercase">{jobInfo.time} ({activeJob.status})</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                            <MapPin size={12} className="text-black/30 shrink-0" />
                            <span className="text-[10px] font-black text-black/60 uppercase truncate">{jobInfo.pickup}</span>
                        </div>

                        <div className="space-y-2">
                            {activeJob.status === 'en_route' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'arrived')}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-black text-white flex items-center justify-center gap-2"
                                >
                                    Confirm Arrival at Location
                                </button>
                            )}

                            {activeJob.status === 'arrived' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'active')}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-[#F29F05] text-black flex items-center justify-center gap-2"
                                >
                                    Verify PIN & Start Trip
                                </button>
                            )}

                            {activeJob.status === 'active' && (
                                <button
                                    onClick={() => handleUpdateStatus(activeJob._id, 'completed')}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-green-600 text-white flex items-center justify-center gap-2"
                                >
                                    Complete Mission
                                </button>
                            )}

                            {['en_route', 'arrived'].includes(activeJob.status) && (
                                <button
                                    onClick={() => handleCancel(activeJob._id)}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-100 text-red-500 flex items-center justify-center gap-2 mt-2"
                                >
                                    Cancel Request
                                </button>
                            )}

                            {activeJob.status === 'pending' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await spareDriverAPI.acceptBooking(activeJob._id);
                                            const data = await spareDriverAPI.getBookings();
                                            setBookings(data.data.bookings || []);
                                        } catch (err) {
                                            alert(err.message);
                                        }
                                    }}
                                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-md bg-[#F29F05] text-black flex items-center justify-center gap-2"
                                >
                                    Accept Request
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-2">
                        <AlertCircle size={20} className="text-black/15" />
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest text-center">
                            {isOnline ? 'Waiting for job broadcasts...' : 'Go online to receive jobs'}
                        </p>
                    </div>
                )}

                {/* ── Recent Earnings ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-black/25 uppercase tracking-widest leading-none">Recent Earnings</p>
                        <button
                            onClick={() => navigate('/spare-driver/history-log')}
                            className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest leading-none"
                        >
                            View All
                        </button>
                    </div>

                    <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-50 bg-white">
                        {transactions.length > 0 ? (
                            transactions.map((t, i) => (
                                <div key={i} className="px-4 py-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                            <TrendingUp size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-black leading-none mb-1 uppercase tracking-tight">Booking Multiplier</p>
                                            <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-green-600 leading-none">+₹{t.amount}</p>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center bg-gray-50/30">
                                <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">No earnings recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Links ── */}
                <div>
                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest mb-3">Driver Hub</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {[
                            { label: 'Document Center', icon: Clock },
                            { label: 'Training Overview', icon: Star },
                            { label: 'Help & Support', icon: AlertCircle },
                        ].map(({ label, icon: Icon }, i) => (
                            <button key={i} className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icon size={14} className="text-black/30" />
                                    <span className="text-[11px] font-black text-black uppercase tracking-tight">{label}</span>
                                </div>
                                <ChevronRight size={13} className="text-black/20" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </DriverLayout>
    );
};

export default DriverDashboard;
