import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, MapPin, Navigation, Clock, Zap, 
    Info, ShieldAlert, Phone, MessageSquare, Car
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import { socketService } from '../../../utils/socket';

const PublicLiveTrack = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [staffLocation, setStaffLocation] = useState(null);
    const [eta, setEta] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const response = await fetch(`${API_URL}/consumer/bookings/share/${id}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    setBooking(data.data.booking);
                } else {
                    setError(data.message || 'Unauthorized or expired tracking link.');
                }
            } catch (err) {
                setError('Unable to reach the tracking server.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [id, API_URL]);

    // Socket Telemetry
    useEffect(() => {
        if (!id) return;
        socketService.joinBookingRoom(id);
        const socket = socketService.getSocket();

        if (socket) {
            socket.on('location_updated', (data) => {
                if (data.bookingId === id) setStaffLocation(data.location);
            });
            socket.on('booking_status_updated', (data) => {
                if (data.bookingId === id) {
                    setBooking(prev => ({ ...prev, status: data.status }));
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('location_updated');
                socket.off('booking_status_updated');
            }
        };
    }, [id]);

    // Live ETA Calculation
    useEffect(() => {
        if (!staffLocation || !booking?.location?.address?.coordinates || !window.google?.maps) return;

        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: [staffLocation],
                destinations: [booking.location.address.coordinates],
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === 'OK') {
                    setEta(response.rows[0].elements[0].duration.text);
                }
            }
        );
    }, [staffLocation, booking?.location?.address?.coordinates]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Verifying link...</h2>
                <p className="text-slate-400 text-xs font-bold mt-2">Connecting to Clean2Wash secure safety channel</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <ShieldAlert size={40} className="text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Link expired</h2>
                <p className="text-white/40 font-bold mt-2 leading-relaxed">{error}</p>
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Info size={20} className="text-[#FF9900]" />
                    <p className="text-[10px] text-left font-bold text-slate-400 uppercase tracking-tight">
                        Trip sharing links are temporary and expire once the service is finalized or cancelled.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-10">
            {/* Header */}
            <header className="px-5 pt-10 pb-5 bg-white/5 border-b border-white/5 sticky top-0 z-50 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-[#FF9900] tracking-widest uppercase mb-0.5">Safety Protocol Active</p>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">Live Trip Tracking</h1>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase">Live</span>
                </div>
            </header>

            <div className="p-4 space-y-4">
                {/* Status HUD */}
                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#FF9900]/20 blur-[60px] rounded-full" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Service Status</p>
                            <h2 className="text-xl font-black italic uppercase text-white tracking-tight">{booking.status.replace(/[-_]/g, ' ')}</h2>
                        </div>
                        <div className="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 text-center">
                            <p className="text-[8px] font-black text-[#FF9900] uppercase mb-0.5">ETA</p>
                            <p className="text-sm font-black tabular-nums">{eta || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="relative h-[350px] rounded-[2.5rem] overflow-hidden border border-white shadow-2xl shadow-black/50">
                    <GoogleMapBox 
                        center={staffLocation || booking.location?.address?.coordinates}
                        zoom={15}
                        markers={[
                            {
                                position: booking.location?.address?.coordinates,
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
                                    scaledSize: { width: 32, height: 32 }
                                }
                            },
                            ...(staffLocation ? [{
                                position: staffLocation,
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
                                    scaledSize: { width: 42, height: 42 }
                                }
                            }] : [])
                        ]}
                    />
                </div>

                {/* Specialist Card */}
                {booking.provider && (
                    <div className="bg-white/5 rounded-[2.5rem] p-5 border border-white/5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5">
                            <img src={booking.provider.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">On-Duty Specialist</p>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">{booking.provider.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Verified Expert</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-11 h-11 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center border border-gray-50 opacity-40">
                                <Phone size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white/5 rounded-[2rem] p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <p className="text-[12px] font-black text-slate-900 uppercase italic">Safety Protocol Active</p>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                        This live tracking link was shared by the customer for safety purposes. You are viewing a real-time feed of the specialist's arrival for vehicle <span className="font-black text-slate-900 uppercase">{booking.vehicle?.brand} {booking.vehicle?.model}</span>.
                    </p>
                </div>
            </div>

            <div className="mt-6 px-10 text-center">
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Powered by Clean2Wash Elite Security</p>
            </div>
        </div>
    );
};

export default PublicLiveTrack;
