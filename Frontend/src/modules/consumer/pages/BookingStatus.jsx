import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Phone, MessageSquare, ShieldCheck, MapPin,
    CheckCircle2, Navigation, Star, Clock, Zap, Info,
    AlertTriangle, Droplets, Trash2, Truck, ChevronRight, ShieldAlert,
    Car, Share, Sparkles
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import { socketService } from '../../../utils/socket';

const playStatusDing = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) { }
};

const vibrateProtocol = (type) => {
    if (!('vibrate' in navigator)) return;
    if (type === 'arrived') navigator.vibrate([200, 100, 200, 100, 200]);
    else if (type === 'completed') navigator.vibrate([100, 50, 100, 50, 500]);
    else navigator.vibrate(100);
};

// smooth marker movement handled by Google Map state updates

const CountdownTimer = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!targetTime || !targetTime.timeSlot?.start) return;
        const calculateTime = () => {
            const now = new Date();
            const dateStr = new Date(targetTime.date).toDateString();
            const timeStr = targetTime.timeSlot.start;
            const fullDateStr = `${dateStr} ${timeStr}`;
            const target = new Date(fullDateStr);
            const diff = target - now;
            if (diff <= 0) { setTimeLeft('Now!'); return; }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            let res = '';
            if (h > 0) res += `${h}h `;
            res += `${m}m ${s}s`;
            setTimeLeft(res);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);
    return <span>{timeLeft}</span>;
};

const CAPTAIN_STEPS = [
    { id: 'pending', label: 'Booking Created', desc: 'Wash requested successfully', Icon: Zap, activeColor: 'text-[#F59E0B]', activeBg: 'bg-[#F59E0B]/10', activeBorder: 'border-[#F59E0B]/20' },
    { id: 'assigned', label: 'Captain Assigned', desc: 'Expert captain on the job', Icon: ShieldCheck, activeColor: 'text-white', activeBg: 'bg-white/10', activeBorder: 'border-white/20' },
    { id: 'en_route', label: 'En Route', desc: 'Captain is heading your way', Icon: Navigation, activeColor: 'text-[#F59E0B]', activeBg: 'bg-[#F59E0B]/10', activeBorder: 'border-[#F59E0B]/20' },
    { id: 'arrived', label: 'Arrived', desc: 'Captain reached your location', Icon: MapPin, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-500/10', activeBorder: 'border-emerald-500/20' },
    { id: 'before_photo', label: 'Inspection Done', desc: 'Vehicle condition documented', Icon: CheckCircle2, activeColor: 'text-[#F59E0B]', activeBg: 'bg-[#F59E0B]/10', activeBorder: 'border-[#F59E0B]/20' },
    { id: 'in_progress', label: 'Wash in Progress', desc: 'Deep cleaning in action', Icon: Droplets, activeColor: 'text-blue-500', activeBg: 'bg-blue-500/10', activeBorder: 'border-blue-500/20' },
    { id: 'after_photo', label: 'Final Inspection', desc: 'Quality check completed', Icon: CheckCircle2, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-500/10', activeBorder: 'border-emerald-500/20' },
    { id: 'completed', label: 'Completed', desc: 'Spotless! Enjoy your ride', Icon: CheckCircle2, activeColor: 'text-white', activeBg: 'bg-white/10', activeBorder: 'border-white/20' },
];

const APARTMENT_STEPS = [
    { id: 'pending', label: 'Plan Active', desc: 'Subscription wash scheduled', Icon: Zap, activeColor: 'text-violet-500', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'assigned', label: 'Specialist Assigned', desc: 'Building supervisor ready', Icon: ShieldCheck, activeColor: 'text-blue-500', activeBg: 'bg-blue-50', activeBorder: 'border-blue-200' },
    { id: 'en_route', label: 'Specialist In-Park', desc: 'Heading to your parking slot', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300' },
    { id: 'arrived', label: 'At Vehicle', desc: 'Specialist reached the vehicle', Icon: MapPin, activeColor: 'text-brand', activeBg: 'bg-brand/10', activeBorder: 'border-brand/20' },
    { id: 'before_photo', label: 'Inspection Done', desc: 'Initial state documented', Icon: CheckCircle2, activeColor: 'text-orange-500', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { id: 'in_progress', label: 'Wash in Progress', desc: 'Premium detailing active', Icon: Droplets, activeColor: 'text-sky-500', activeBg: 'bg-sky-50', activeBorder: 'border-sky-200' },
    { id: 'after_photo', label: 'Final Inspection', desc: 'Quality audit completed', Icon: CheckCircle2, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
    { id: 'completed', label: 'Service Done', desc: 'Spotless! Ready to drive', Icon: CheckCircle2, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
];

const VENDOR_STEPS = [
    { id: 'pending', label: 'Studio Request', desc: 'Awaiting studio confirmation', Icon: Zap, activeColor: 'text-violet-500', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'accepted', label: 'Studio Confirmed', desc: 'Premium studio assigned', Icon: ShieldCheck, activeColor: 'text-blue-500', activeBg: 'bg-blue-50', activeBorder: 'border-blue-200' },
    { id: 'pickup-assigned', label: 'Pickup Specialist', desc: 'Awaiting departure', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300' },
    { id: 'en_route', label: 'En Route', desc: 'Specialist is heading your way', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-200', activeBorder: 'border-blue-400' },
    { id: 'arrived', label: 'At Your Door', desc: 'Verify handover status', Icon: MapPin, activeColor: 'text-brand', activeBg: 'bg-brand/10', activeBorder: 'border-brand/20' },
    { id: 'picked-up', label: 'Vehicle Secured', desc: 'Moving to Studio Node', Icon: ShieldCheck, activeColor: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-200' },
    { id: 'at-studio', label: 'At Studio', desc: 'Vehicle reached detailing hub', Icon: Truck, activeColor: 'text-orange-500', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { id: 'in_progress', label: 'Wash in Progress', desc: 'Deep cleaning in action', Icon: Droplets, activeColor: 'text-sky-500', activeBg: 'bg-sky-50', activeBorder: 'border-sky-200' },
    { id: 'quality-check', label: 'Quality Check', desc: 'Luxury finishing & audit', Icon: CheckCircle2, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
    { id: 'ready-for-delivery', label: 'Ready for Home', desc: 'Wash done, awaiting driver', Icon: ShieldCheck, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
    { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Specialist heading to you', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300' },
    { id: 'at_delivery_address', label: 'Specialist Arrived', desc: 'Collect your vehicle', Icon: MapPin, activeColor: 'text-brand', activeBg: 'bg-brand/10', activeBorder: 'border-brand/20' },
    { id: 'completed', label: 'Delivered', desc: 'Returned in pristine condition', Icon: CheckCircle2, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
];

const BookingStatus = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, updateBookingStatus } = useAuth();
    const { isDarkMode } = useTheme();

    const type = searchParams.get('type') || 'captain';
    const bookingId = searchParams.get('id');
    
    // Find live booking
    const liveBooking = bookings.find(b => (b.bookingId === bookingId || b._id === bookingId || b.id === bookingId)) || { id: 'CarWash-8821', serviceName: 'Eco Doorstep Wash', price: '₹473', status: 'pending' };

    const isApartment = type === 'apartment' || 
                       liveBooking.service?.type === 'apartment' || 
                       liveBooking.serviceName?.toLowerCase().includes('apartment') ||
                       liveBooking.service?.name?.toLowerCase().includes('apartment');

    const STEPS = isApartment ? APARTMENT_STEPS : (type === 'vendor' ? VENDOR_STEPS : CAPTAIN_STEPS);

    const [step, setStep] = useState(0);
    const [staffLocation, setStaffLocation] = useState(null);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);

    // 📡 Live Telemetry Protocol
    useEffect(() => {
        if (!bookingId) return;

        // Step 1: Join booking room remains manual as it's targeted context
        socketService.joinBookingRoom(bookingId);
        const socket = socketService.getSocket();

        if (socket) {
            // Priority 1: Specialist Telemetry Pulse
            const handleLocationPulse = (data) => {
                if (data.bookingId === bookingId) {
                    setStaffLocation(data.location);
                }
            };
            socket.on('location_updated', handleLocationPulse);
            socket.on('specialist_location_pulse', handleLocationPulse);

            // Priority 2: Status Synchronization
            socket.on('booking_status_updated', (data) => {
                if (data.bookingId === bookingId) {
                    const statusMsg = typeof data.status === 'string' ? data.status.replace(/[-_]/g, ' ') : 'Updated';
                    toast.success(`Protocol Updated: ${statusMsg}`);
                    playStatusDing();
                    if (data.status === 'arrived') vibrateProtocol('arrived');
                    else if (data.status === 'completed') vibrateProtocol('completed');
                    else vibrateProtocol('standard');
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('location_updated');
                socket.off('specialist_location_pulse');
                socket.off('booking_status_updated');
            }
        };
    }, [bookingId]);

    // 🏎️ Dynamic ETA Engine (Real-world Protocol)
    useEffect(() => {
        if (!staffLocation || !liveBooking.location?.address?.coordinates || !window.google?.maps) return;

        const calculateLiveETA = () => {
            const service = new window.google.maps.DistanceMatrixService();
            const origin = new window.google.maps.LatLng(staffLocation.lat, staffLocation.lng);
            const destination = new window.google.maps.LatLng(
                liveBooking.location.address.coordinates.lat, 
                liveBooking.location.address.coordinates.lng
            );

            service.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: [destination],
                    travelMode: window.google.maps.TravelMode.DRIVING,
                    unitSystem: window.google.maps.UnitSystem.METRIC,
                    avoidHighways: false,
                    avoidTolls: false,
                },
                (response, status) => {
                    if (status === 'OK' && response.rows[0].elements[0].status !== 'ZERO_RESULTS') {
                        const element = response.rows[0].elements[0];
                        setEta(element.duration.text);
                        setDistance(element.distance.text);
                    } else {
                        console.warn('ETA Calc Failed:', status);
                    }
                }
            );
        };

        const timer = setTimeout(calculateLiveETA, 1000); // Small debounce
        return () => clearTimeout(timer);
    }, [staffLocation, liveBooking.location?.address?.coordinates]);

    // Sync step with booking status
    useEffect(() => {
        const currentStatus = (liveBooking.status || 'pending').toLowerCase();
        const index = STEPS.findIndex(s => s.id.toLowerCase() === currentStatus);
        setStep(index !== -1 ? index : 0);
    }, [liveBooking.status, type, STEPS]);

    // Find performer details (Captain or Staff)
    const performer = liveBooking.provider?.id;

    const performerName = performer?.name || (type === 'vendor' ? 'Service Hub' : 'Matching…');

    // 🛡️ Safety protocol: Share Live Trip
    const handleShareTrip = () => {
        const shareUrl = `${window.location.origin}/share-trip/${bookingId}`;
        const message = `Hey! I'm tracking my live vehicle service on Clean2Wash. Follow the specialist's arrival here: ${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleCancel = () => {
        const isSkip = isApartment;
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight">
                    {isSkip ? 'Skip today\'s scheduled wash?' : 'Are you sure you want to cancel this booking?'}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            const newStatus = isSkip ? 'skipped' : 'cancelled';
                            updateBookingStatus(bookingId, newStatus);
                            if (!isSkip) navigate('/');
                            toast.success(isSkip ? 'Wash skipped for today. Staff notified.' : 'Booking cancelled');
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        {isSkip ? 'Skip Today' : 'Cancel Booking'}
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-white/[0.05] text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        {isSkip ? 'Don\'t Skip' : 'Keep Booking'}
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    if (liveBooking.status?.toLowerCase() === 'cancelled') {
        return (
            <MobileLayout hideNav>
                <div className={`flex flex-col items-center justify-center min-h-screen px-6 text-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <AlertTriangle size={40} className="text-rose-500" />
                        </motion.div>
                    </div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Booking cancelled</h2>
                    <p className={`font-black text-[10px] tracking-widest mt-3 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Ref 404: Protocol terminated</p>
                    <button onClick={() => navigate('/')} className={`mt-12 w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl ${
                        isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>Return to Dash</button>
                </div>
            </MobileLayout>
        );
    }

    if (liveBooking.status?.toLowerCase() === 'skipped') {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
                    <div className="w-20 h-20 bg-white/[0.02] rounded-3xl flex items-center justify-center mb-4">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <Navigation size={40} className="text-gray-400 rotate-[225deg]" />
                        </motion.div>
                    </div>
                    <h2 className="text-2xl font-black text-content tracking-tight">Wash skipped</h2>
                    <p className="text-content-subtle font-bold mt-2">Today's session has been skipped. Your regular schedule will continue from the next slot.</p>
                    <button onClick={() => navigate('/')} className="mt-8 w-full h-14 bg-content text-white rounded-[2rem] font-black uppercase tracking-widest">Back to Dashboard</button>
                </div>
            </MobileLayout>
        );
    }

    if (liveBooking.status?.toLowerCase() === 'vehicle_not_available') {
        return (
            <MobileLayout hideNav>
                <div className={`flex flex-col items-center justify-center min-h-screen px-6 text-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                    <div className="w-20 h-20 bg-[#F59E0B]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#F59E0B]/20">
                        <Car size={40} className="text-[#F59E0B]" />
                    </div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Vehicle not found</h2>
                    <p className={`font-black text-[10px] tracking-widest mt-3 leading-relaxed max-w-[240px] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Handover protocol failed: Specialist could not locate target vehicle.</p>
                    <div className="mt-12 flex flex-col gap-3 w-full">
                        <button onClick={() => navigate('/support')} className="w-full h-16 bg-[#F59E0B] text-black rounded-2xl font-black uppercase tracking-[0.1em] text-[12px]">Emergency Desk</button>
                        <button onClick={() => navigate('/')} className="w-full h-16 bg-white/[0.03] border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[12px]">Back to Dashboard</button>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    if (liveBooking.status?.toLowerCase() === 'pending') {
        return (
            <MobileLayout hideNav>
                <div className={`flex flex-col items-center justify-center min-h-screen px-4 text-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                    <div className="relative mb-16 flex items-center justify-center">
                        <div className="w-56 h-56 bg-[#F59E0B]/5 rounded-full flex items-center justify-center animate-pulse">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-24 h-24 bg-[#F59E0B] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#F59E0B]/40"
                            >
                                <Navigation size={32} className="text-black fill-black" />
                            </motion.div>
                        </div>
                        <div className="absolute w-56 h-56 border-[3px] border-[#F59E0B]/20 rounded-full animate-ping" />
                        <div className="absolute w-72 h-72 border-white/5 border-[#F59E0B]/10 rounded-full animate-ping delay-500" />
                    </div>

                    <div className="space-y-4 px-6">
                        <h2 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>Locating elite</h2>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                            Scanning Faro hub for nearest specialist for your <span className="text-[#F59E0B]">{liveBooking.service?.name}</span>
                        </p>
                    </div>

                    <div className="mt-16 space-y-6 w-full px-8">
                        <div className={`flex flex-col gap-3 border p-5 rounded-[2rem] shadow-2xl ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Signal Integrity</span>
                                <span className="text-[9px] font-black text-[#F59E0B] uppercase">100% Perfect</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 60, ease: 'linear' }}
                                    className="h-full bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]"
                                />
                            </div>
                        </div>
                        <button onClick={handleCancel} className="text-[11px] font-black text-rose-500/40 uppercase tracking-[0.2em] hover:text-rose-500 transition-colors">Terminate Discovery</button>
                    </div>

                    <div className="absolute bottom-12 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Protocol Response v4.1 Active</span>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout hideNav>
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                {/* ── Header ─────────────────────────────── */}
                <header className={`px-4 pt-10 pb-4 flex items-center justify-between sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/80 border-black/5'}`}>
                    <button onClick={() => navigate('/')} className={`w-9 h-9 border rounded-xl flex items-center justify-center active:scale-95 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'}`}>
                        <ChevronLeft size={18} strokeWidth={2.5} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </button>
                    <div className="text-center">
                        <p className={`text-[9px] font-black tracking-[0.2em] leading-none mb-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>{liveBooking.id}</p>
                        <h1 className={`text-base font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Telemetry feed</h1>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center border border-[#F59E0B]/20">
                            <Sparkles size={16} className="text-[#F59E0B]" fill="currentColor" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-[9px] font-black text-emerald-500 tracking-widest">Live</span>
                        </div>
                    </div>
                </header>

            <div className="pb-24 space-y-4 px-4 pt-4">

                {/* ── Map ────────────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl" style={{ height: 280 }}>
                    <GoogleMapBox
                        center={staffLocation || liveBooking.location?.address?.coordinates || { lat: 20.5937, lng: 78.9629 }}
                        zoom={15}
                        markers={[
                            {
                                position: liveBooking.location?.address?.coordinates || { lat: 20.5937, lng: 78.9629 },
                                icon: {
                                    url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Premium Car icon
                                    scaledSize: { width: 32, height: 32 },
                                    anchor: { x: 16, y: 32 }
                                },
                                infoContent: (
                                    <div className="p-2 font-outfit text-center">
                                        <p className="text-[10px] font-black uppercase text-brand">Wash Location</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 truncate max-w-[120px]">{liveBooking.location?.address?.label || 'Target Site'}</p>
                                    </div>
                                )
                            },
                            ...(staffLocation ? [{
                                position: staffLocation,
                                icon: {
                                    url: type === 'vendor' 
                                        ? 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png' // Studio Hub
                                        : 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png', // Specialist Bike
                                    scaledSize: { width: 42, height: 42 },
                                    anchor: { x: 21, y: 42 }
                                },
                                infoContent: (
                                    <div className="p-2 font-outfit text-center">
                                        <p className="text-[10px] font-black uppercase text-brand">
                                            {type === 'vendor' ? 'Service Hub' : 'Specialist'}
                                        </p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1">Live Tracking Active</p>
                                    </div>
                                )
                            }] : [])
                        ]}
                    />

                    {/* Overlay gradient for aesthetics */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[400]" />

                    {/* ETA / Timer */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10 shadow-2xl z-[500]">
                        <Clock size={15} className="text-[#F59E0B]" strokeWidth={2.5} />
                        <div>
                            {liveBooking.schedule?.type === 'scheduled' && liveBooking.status === 'confirmed' ? (
                                <>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Starts in</p>
                                    <p className="text-sm font-black text-white leading-none tabular-nums">
                                        <CountdownTimer targetTime={liveBooking.schedule} />
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none mb-1 text-center">ETA</p>
                                    <p className="text-sm font-black text-white leading-none text-center">
                                        {step === 0 ? '—' : (step === 1 || step === 2) ? (eta || 'Wait...') : 'Active'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Route label */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                            <div className="flex-1 h-px bg-gradient-to-r from-brand to-blue-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                        <span className="text-[8px] font-bold text-content-subtle ml-1">
                            {type === 'vendor' ? 'Home → Studio Hub → Home' : (liveBooking.address?.city ? `Live at ${liveBooking.address?.city}` : 'Your Location')}
                        </span>
                    </div>
                </div>

                {/* ── Photo Documentation ─────────────────────────────── */}
                <AnimatePresence>
                    {step >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={`rounded-[2rem] border shadow-2xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'}`}
                        >
                            <div className={`px-5 py-5 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Visual check</p>
                                    <h2 className={`text-base font-black tracking-tighter uppercase mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Status protocol</h2>
                                </div>
                                <ShieldCheck size={20} className="text-[#F59E0B]" />
                            </div>

                            <div className="p-4 grid grid-cols-2 gap-3">
                                {/* Before Photos */}
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Pre-Wash / Before</span>
                                    <div className="aspect-[3/4] rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden relative group">
                                        <img
                                            src={liveBooking.serviceImages?.before?.[0] || liveBooking.beforePhotos?.[0] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80"}
                                            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                                            alt="Before Wash"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                                            <p className="text-[7px] font-black text-white uppercase tracking-widest">Captured at {liveBooking.serviceImages?.before?.[0] ? new Date(liveBooking.updatedAt).toLocaleTimeString() : '10:42 AM'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* After Photos */}
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Post-Wash / After</span>
                                    <div className={`aspect-[3/4] rounded-xl border-white/5 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${step >= 6 ? 'bg-white/[0.02] border-white/5 overflow-hidden' : 'bg-brand/5 border-brand/20'}`}>
                                        {step >= 6 ? (
                                            <>
                                                <img
                                                    src={liveBooking.serviceImages?.after?.[0] || liveBooking.afterPhotos?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80"}
                                                    className="w-full h-full object-cover"
                                                    alt="After Wash"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                                                    <p className="text-[7px] font-black text-white uppercase tracking-widest">Captured at {liveBooking.serviceImages?.after?.[0] ? new Date(liveBooking.updatedAt).toLocaleTimeString() : '11:15 AM'}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Droplets size={24} className="text-brand/30 animate-bounce" />
                                                <p className="text-[8px] font-black text-brand/40 uppercase tracking-widest text-center px-4">Waiting for<br />Final Polish</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Stepper ─────────────────────────────────── */}
                <div className={`rounded-[2rem] border shadow-2xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'}`}>
                    {/* Header */}
                    <div className={`px-5 py-5 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                        <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Timeline</p>
                            <h2 className={`text-base font-black tracking-tighter uppercase mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{STEPS[step]?.label}</h2>
                        </div>
                        <span className="text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1.5 rounded-xl border border-[#F59E0B]/20">
                            {step + 1} / {STEPS.length}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="px-5">
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden my-4">
                            <motion.div
                                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full bg-[#F59E0B] rounded-full shadow-[0_0_10px_#F59E0B]"
                            />
                        </div>
                    </div>

                    {/* Steps list */}
                    <div className="px-4 pb-4 space-y-0.5">
                        {STEPS.map((s, i) => {
                            const isDone = step > i;
                            const isActive = step === i;
                            const { Icon } = s;
                            return (
                                <div key={s.id} className="flex items-center gap-3 py-2.5 relative">
                                    {/* Connector */}
                                    {i < STEPS.length - 1 && (
                                        <div className={`absolute left-[18px] top-12 w-px h-3 transition-colors duration-700 ${isDone ? 'bg-brand' : 'bg-white/[0.05]'}`} />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${isDone ? 'bg-brand border-brand shadow-2xl shadow-black/40' :
                                        isActive ? `${s.activeBg} ${s.activeBorder} ` :
                                            'bg-white/[0.02] border-white/5'
                                        }`}>
                                        {isDone
                                            ? <CheckCircle2 size={15} className="text-white" strokeWidth={2.5} />
                                            : <Icon size={15} strokeWidth={2.5} className={isActive ? s.activeColor : 'text-gray-300'} />
                                        }
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-black tracking-tight transition-colors leading-none ${isDone ? 'text-white/20' : isActive ? 'text-white' : 'text-white/10'
                                            }`}>{s.label}</p>
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.span
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#F59E0B]/60 overflow-hidden mt-1.5"
                                                    style={{ display: 'flex' }}
                                                >
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0" />
                                                    {s.desc}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Badge */}
                                    {isDone && <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">Done</span>}
                                    {isActive && <span className="text-[9px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-lg animate-pulse">Now</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Captain Card ─────────────────────────────── */}
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={`rounded-[2rem] overflow-hidden border shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-[#0F1412] border-white/10' : 'bg-white border-black/5'}`}
                        >
                            {/* ⏰ Scheduled Assignment Progress */}
                            {liveBooking.schedule?.type === 'scheduled' && step <= 2 && (
                                <div className="bg-white/5 px-5 py-4 border-b border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Commitment signal</p>
                                        <div className="flex items-center gap-1.5 bg-brand/20 px-2 py-0.5 rounded-lg border border-brand/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                            <span className="text-[8px] font-black text-brand uppercase">Active</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white font-black uppercase tracking-tighter">
                                        {liveBooking.pickupStaff ? 'Specialist assigned — Preparing protocol' : 'Finalizing specialist assignment...'}
                                    </p>
                                </div>
                            )}

                            {/* Top row */}
                            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border-white/5 border-white/10">
                                            <img src={performer?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"} alt={performerName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-white/5 border-content" />
                                    </div>
                                    <div>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Elite specialist</p>
                                        <h3 className={`text-base font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{performerName}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1 bg-[#F59E0B]/20 px-2 py-0.5 rounded-lg border border-[#F59E0B]/20">
                                                <Star size={9} fill="#F59E0B" className="text-[#F59E0B]" />
                                                <span className="text-[9px] font-black text-[#F59E0B]">{performer?.rating || '4.9'}</span>
                                            </div>
                                            <VerifiedBadge type="specialist" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button 
                                        onClick={handleShareTrip}
                                        className={`w-11 h-11 border backdrop-blur-md rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                                            isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/20' : 'bg-black/[0.03] border-black/10 text-black/20'
                                        } hover:text-[#F59E0B]`}
                                        title="Share Live Trip"
                                    >
                                        <Share size={18} strokeWidth={2.5} />
                                    </button>
                                    <button className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center shadow-2xl shadow-black/40 active:scale-90 transition-transform">
                                        <Phone size={18} className="text-white" fill="white" strokeWidth={1.5} />
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/chat/${bookingId}`)}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${
                                        isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                                    }`}>
                                        <MessageSquare size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>

                            {/* PIN section */}
                            <div className="border-t border-white/5 mx-4" />
                            <div className="px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Handover PIN</p>
                                    <div className="flex items-center gap-2">
                                        {(liveBooking.securityPin || '----').split('').map((d, i) => (
                                            <div key={i} className="w-9 h-10 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
                                                <span className="text-white font-black text-base">{d}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <ShieldCheck size={22} className="text-green-400 ml-auto" />
                                    <p className="text-green-400 text-[8px] font-black uppercase tracking-widest mt-1">Verified</p>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-white/[0.03] px-5 py-3 flex items-center gap-3">
                                <AlertTriangle size={12} className="text-[#F59E0B] flex-shrink-0" />
                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest leading-none">Share PIN only after Captain photographs vehicle state.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`rounded-[2rem] border shadow-2xl p-5 transition-all duration-300 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-4 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Bill breakdown</p>
                        <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Base Treatment</span>
                            <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{liveBooking.pricing?.baseAmount || liveBooking.price || 0}</span>
                        </div>
                        {(liveBooking.pricing?.addonAmount > 0) && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tight">Elite Add-ons</span>
                                <span className="text-[11px] font-black text-white italic">₹{liveBooking.pricing.addonAmount}</span>
                            </div>
                        )}
                        {(liveBooking.pricing?.discountAmount > 0) && (
                            <div className="flex justify-between items-center text-emerald-500">
                                <span className="text-[10px] font-black uppercase tracking-tight italic">Black Member Savings</span>
                                <span className="text-[11px] font-black">-₹{liveBooking.pricing.discountAmount}</span>
                            </div>
                        )}
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className={`text-[12px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>Final Settlement</span>
                            <span className="text-xl font-black text-[#F59E0B] tracking-tighter">
                                {isApartment ? 'Subscription Active' : `₹${liveBooking.pricing?.totalAmount || liveBooking.amount || liveBooking.price || '0'}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Note ─────────────────────────────────────── */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
                    <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        Park your vehicle with <span className="font-black">2 ft clearance</span> on all sides for the signature 360° wash.
                    </p>
                </div>

            </div>

            {/* ── CTA Footer ── */}
            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t px-6 py-6 pb-12 z-50 backdrop-blur-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/95 border-black/5'
            }`}>
                {liveBooking.status === 'completed' ? (
                    <div className="space-y-5">
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-500/10'}`}>
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                                <CheckCircle2 size={24} strokeWidth={3} />
                            </div>
                            <div>
                                <p className={`text-[15px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Protocol complete</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Vehicle restored to pristine</p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(`/rate?id=${bookingId}`)}
                            className={`w-full h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 ${
                                isDarkMode ? 'bg-white text-black shadow-black/50' : 'bg-black text-white shadow-black/10'
                            }`}
                        >
                            Review summary <ChevronRight size={18} strokeWidth={4} />
                        </motion.button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/help')}
                            className="flex-1 h-14 bg-white/[0.03] border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                        >
                            <MessageSquare size={18} className="text-[#F59E0B]" fill="currentColor" /> Assistance
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(`/safety/sos?id=${bookingId}`)}
                            className="w-14 h-14 bg-rose-600 text-white rounded-2xl font-black flex items-center justify-center shadow-2xl shadow-rose-600/20 active:bg-rose-700 transition-all"
                        >
                            <ShieldAlert size={22} />
                        </motion.button>
                        {(liveBooking.status === 'pending' || liveBooking.status === 'confirmed' || liveBooking.status === 'assigned') && (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleCancel}
                                className="w-14 h-14 bg-white/[0.03] border border-rose-500/20 text-rose-500 rounded-2xl font-black flex items-center justify-center group relative hover:bg-rose-500/10 transition-all"
                            >
                                <Trash2 size={22} />
                            </motion.button>
                        )}
                    </div>
                )}
            </div>
          </div>
        </MobileLayout>
    );
};

export default BookingStatus;
