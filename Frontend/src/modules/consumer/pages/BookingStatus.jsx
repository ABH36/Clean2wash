import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Phone, MessageSquare, ShieldCheck, MapPin,
    CheckCircle2, Navigation, Star, Clock, Zap, Info,
    AlertTriangle, Droplets, Trash2, Truck, ChevronRight, ShieldAlert
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const CAPTAIN_STEPS = [
    { id: 'pending', label: 'Booking Created', desc: 'Wash requested successfully', Icon: Zap, activeColor: 'text-violet-500', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'assigned', label: 'Captain Assigned', desc: 'Expert captain on the job', Icon: ShieldCheck, activeColor: 'text-blue-500', activeBg: 'bg-blue-50', activeBorder: 'border-blue-200' },
    { id: 'en_route', label: 'En Route', desc: 'Captain is heading your way', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300' },
    { id: 'arrived', label: 'Arrived', desc: 'Captain reached your location', Icon: MapPin, activeColor: 'text-brand', activeBg: 'bg-brand/10', activeBorder: 'border-brand/20' },
    { id: 'before_photo', label: 'Inspection Done', desc: 'Vehicle condition documented', Icon: CheckCircle2, activeColor: 'text-orange-500', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { id: 'in_progress', label: 'Wash in Progress', desc: 'Deep cleaning in action', Icon: Droplets, activeColor: 'text-sky-500', activeBg: 'bg-sky-50', activeBorder: 'border-sky-200' },
    { id: 'after_photo', label: 'Final Inspection', desc: 'Quality check completed', Icon: CheckCircle2, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
    { id: 'completed', label: 'Completed', desc: 'Spotless! Enjoy your ride', Icon: CheckCircle2, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
];

const VENDOR_STEPS = [
    { id: 'pending', label: 'Studio Request', desc: 'Awaiting studio confirmation', Icon: Zap, activeColor: 'text-violet-500', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'accepted', label: 'Studio Confirmed', desc: 'Premium studio assigned', Icon: ShieldCheck, activeColor: 'text-blue-500', activeBg: 'bg-blue-50', activeBorder: 'border-blue-200' },
    { id: 'pickup-assigned', label: 'Pickup assigned', desc: 'Driver is coming for pickup', Icon: Navigation, activeColor: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300' },
    { id: 'arrived', label: 'At Your Door', desc: 'Vehicle handover in progress', Icon: MapPin, activeColor: 'text-brand', activeBg: 'bg-brand/10', activeBorder: 'border-brand/20' },
    { id: 'at-studio', label: 'At Studio', desc: 'Vehicle reached detailing hub', Icon: Truck, activeColor: 'text-orange-500', activeBg: 'bg-orange-50', activeBorder: 'border-orange-200' },
    { id: 'in_progress', label: 'Wash in Progress', desc: 'Deep cleaning in action', Icon: Droplets, activeColor: 'text-sky-500', activeBg: 'bg-sky-50', activeBorder: 'border-sky-200' },
    { id: 'quality-check', label: 'Quality Check', desc: 'Luxury finishing & audit', Icon: CheckCircle2, activeColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
    { id: 'ready-for-delivery', label: 'Ready for Home', desc: 'Wash done, awaiting driver', Icon: ShieldCheck, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
    { id: 'completed', label: 'Delivered', desc: 'Returned in pristine condition', Icon: CheckCircle2, activeColor: 'text-green-600', activeBg: 'bg-green-50', activeBorder: 'border-green-200' },
];

const BookingStatus = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { bookings, updateBookingStatus } = useAuth();

    const type = searchParams.get('type') || 'captain';
    const bookingId = searchParams.get('id');
    const STEPS = type === 'vendor' ? VENDOR_STEPS : CAPTAIN_STEPS;

    // Find live booking
    const liveBooking = bookings.find(b => (b.bookingId === bookingId || b._id === bookingId || b.id === bookingId)) || { id: 'CarWash-8821', serviceName: 'Eco Doorstep Wash', price: '₹473', status: 'CREATED' };

    const [step, setStep] = useState(0);

    // Sync step with booking status
    useEffect(() => {
        const status = liveBooking.status || 'CREATED';
        const index = STEPS.findIndex(s => s.id === status);
        setStep(index !== -1 ? index : 0);
    }, [liveBooking.status, type, STEPS]);

    // Find performer details (Captain or Staff)
    const performer = liveBooking.provider?.id;

    const performerName = performer?.name || (type === 'vendor' ? 'Service Hub' : 'Matching…');

    const handleCancel = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-content uppercase tracking-tight">Are you sure you want to cancel this booking?</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            updateBookingStatus(bookingId, 'cancelled');
                            navigate('/');
                            toast.success('Booking cancelled');
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Cancel Booking
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-content px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                        Keep Booking
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    if (liveBooking.status === 'cancelled') {
        return (
            <MobileLayout hideNav>
                <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-content tracking-tight">Booking Cancelled</h2>
                    <p className="text-content-subtle font-bold mt-2">This booking has been cancelled as per your request.</p>
                    <button onClick={() => navigate('/')} className="mt-8 w-full h-14 bg-content text-white rounded-[2rem] font-black">Back to Home</button>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout hideNav>

            {/* ── Header ─────────────────────────────── */}
            <header className="px-4 pt-10 pb-4 bg-white flex items-center justify-between sticky top-0 z-50 border-b border-gray-100">
                <button onClick={() => navigate('/')} className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <ChevronLeft size={18} strokeWidth={2.5} className="text-content" />
                </button>
                <div className="text-center">
                    <p className="text-[9px] font-bold text-content-subtle tracking-widest uppercase">{liveBooking.id}</p>
                    <h1 className="text-base font-black tracking-tight text-content leading-none">Live Tracking</h1>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Live</span>
                </div>
            </header>

            <div className="pb-24 space-y-4 px-4 pt-4">

                {/* ── Map ────────────────────────────────────── */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft" style={{ height: 200 }}>
                    <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                        alt="Map"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-900/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Captain marker */}
                    <motion.div
                        initial={{ x: -60, y: 50 }}
                        animate={step >= 1 ? { x: 0, y: 0 } : {}}
                        transition={{ duration: 5, ease: 'easeInOut' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                        <div className="relative">
                            <div className="w-11 h-11 bg-brand rounded-xl rotate-12 flex items-center justify-center shadow-lg border-2 border-white">
                                <Navigation size={20} className="text-white -rotate-12" fill="white" strokeWidth={1.5} />
                            </div>
                            <div className="absolute inset-0 bg-brand/30 rounded-xl rotate-12 animate-ping scale-150" />
                        </div>
                    </motion.div>

                    {/* Destination / Hub */}
                    <div className="absolute bottom-8 right-8 z-10">
                        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-100">
                            {type === 'vendor' ? <Truck size={16} className="text-brand" /> : <MapPin size={16} className="text-content" fill="currentColor" />}
                        </div>
                    </div>

                    {/* ETA */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
                        <Clock size={13} className="text-brand" strokeWidth={2.5} />
                        <div>
                            <p className="text-[7px] font-black uppercase tracking-widest text-content-subtle leading-none">ETA</p>
                            <p className="text-sm font-black text-content leading-none mt-0.5">
                                {step === 0 ? '—' : (step === 1 || step === 2) ? '12 min' : 'Arrived'}
                            </p>
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
                            className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Documentation</p>
                                    <h2 className="text-base font-black tracking-tight text-content mt-0.5">Vehicle Inspections</h2>
                                </div>
                                <ShieldCheck size={18} className="text-brand" />
                            </div>

                            <div className="p-4 grid grid-cols-2 gap-3">
                                {/* Before Photos */}
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-content-subtle uppercase tracking-widest ml-1">Pre-Wash / Before</span>
                                    <div className="aspect-[3/4] rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative group">
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
                                    <div className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${step >= 6 ? 'bg-gray-50 border-gray-100 overflow-hidden' : 'bg-brand/5 border-brand/20'}`}>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle">Progress</p>
                            <h2 className="text-base font-black tracking-tight text-content mt-0.5">{STEPS[step]?.label}</h2>
                        </div>
                        <span className="text-[9px] font-black text-brand bg-brand/10 px-2.5 py-1.5 rounded-lg">
                            {step + 1} / {STEPS.length}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="px-5">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden my-3">
                            <motion.div
                                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full bg-brand rounded-full"
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
                                        <div className={`absolute left-[18px] top-12 w-px h-3 transition-colors duration-700 ${isDone ? 'bg-brand' : 'bg-gray-100'}`} />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${isDone ? 'bg-brand border-brand shadow-md' :
                                        isActive ? `${s.activeBg} ${s.activeBorder} shadow-sm` :
                                            'bg-gray-50 border-gray-100'
                                        }`}>
                                        {isDone
                                            ? <CheckCircle2 size={15} className="text-white" strokeWidth={2.5} />
                                            : <Icon size={15} strokeWidth={2.5} className={isActive ? s.activeColor : 'text-gray-300'} />
                                        }
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-black tracking-tight transition-colors leading-none ${isDone ? 'text-gray-300 line-through' : isActive ? 'text-content' : 'text-gray-300'
                                            }`}>{s.label}</p>
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.span
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center gap-1.5 text-[10px] text-content-subtle overflow-hidden mt-0.5"
                                                    style={{ display: 'flex' }}
                                                >
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-pulse flex-shrink-0" />
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
                            className="bg-content rounded-2xl overflow-hidden border border-white/5 shadow-lg"
                        >
                            {/* Top row */}
                            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10">
                                            <img src={performer?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"} alt={performerName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-content" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Your {type === 'vendor' ? 'Hub Contact' : 'Captain'}</p>
                                        <h3 className="text-base font-black text-white tracking-tight leading-none">{performerName}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex items-center gap-1 bg-accent-yellow px-2 py-0.5 rounded-lg">
                                                <Star size={9} fill="currentColor" className="text-black" />
                                                <span className="text-[9px] font-black text-black">{performer?.rating || '4.9'}</span>
                                            </div>
                                            <span className="text-white/30 text-[9px] font-bold">Verified</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform">
                                        <Phone size={18} className="text-white" fill="white" strokeWidth={1.5} />
                                    </button>
                                    <button className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                                        <MessageSquare size={18} className="text-white" strokeWidth={2} />
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
                            <div className="bg-white/5 px-5 py-3 flex items-center gap-2">
                                <AlertTriangle size={12} className="text-accent-yellow flex-shrink-0" />
                                <p className="text-white/30 text-[9px] font-medium">Share PIN only after captain photographs your vehicle</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Service', value: liveBooking.service?.name || liveBooking.serviceName || 'Car Wash' },
                        { label: 'Paid', value: `₹${liveBooking.pricing?.totalAmount || liveBooking.amount || liveBooking.price || '0'}` },
                        { label: 'Vehicle', value: liveBooking.vehicle?.name || liveBooking.vehicleInfo?.name || liveBooking.vehicle || 'Honda City' },
                        { label: 'Duration', value: '~45 minutes' },
                    ].map((d) => (
                        <div key={d.label} className="bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3">
                            <p className="text-[8px] font-black uppercase tracking-widest text-content-subtle mb-0.5">{d.label}</p>
                            <p className="text-sm font-black text-content tracking-tight leading-snug">{d.value}</p>
                        </div>
                    ))}
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
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-6 pb-10 z-50">
                {liveBooking.status === 'completed' ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-green-50 p-3 rounded-2xl border border-green-100">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                                <CheckCircle2 size={20} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-content italic leading-none">Wash Completed!</p>
                                <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest mt-1">Car is sparkling clean</p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(`/rate?id=${bookingId}`)}
                            className="w-full h-14 bg-content text-white rounded-[2rem] font-black text-sm shadow-xl shadow-content/20 flex items-center justify-center gap-2"
                        >
                            View Summary & Rate <ChevronRight size={18} strokeWidth={3} />
                        </motion.button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/help')}
                            className="flex-1 h-14 bg-white border-2 border-gray-100 text-content rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} className="text-brand" fill="currentColor" /> Need Help?
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(`/sos?id=${bookingId}`)}
                            className="w-14 h-14 bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center shadow-lg shadow-red-200"
                        >
                            <ShieldAlert size={20} />
                        </motion.button>
                        {(liveBooking.status === 'pending' || liveBooking.status === 'confirmed') && (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleCancel}
                                className="w-14 h-14 bg-red-50 border-2 border-red-100 text-red-500 rounded-2xl font-black text-sm flex items-center justify-center"
                            >
                                <Trash2 size={20} />
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* Floating SOS for quick access if header is scrolled */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => navigate(`/sos?id=${bookingId}`)}
                className="fixed bottom-32 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] border-4 border-white active:scale-90 transition-transform"
            >
                <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-25" />
                <ShieldAlert size={24} strokeWidth={2.5} />
            </motion.button>

        </MobileLayout>
    );
};

export default BookingStatus;
