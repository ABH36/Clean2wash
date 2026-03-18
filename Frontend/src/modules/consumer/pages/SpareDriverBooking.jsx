import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, User, MapPin, Calendar, Clock, Car,
    ChevronRight, Star, Shield, Info, CheckCircle2,
    ShieldCheck, Lock,
    X, Timer, Navigation, Phone, MessageSquare,
    AlertTriangle, Search, CreditCard, Play,
    Loader2, Check, Map, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import { serviceAPI, bookingAPI } from '../../../utils/api';

import pointImg from '../../../assets/services/point.png';
import hourlyImg from '../../../assets/services/hourly.png';
import fullDayImg from '../../../assets/services/full_day.png';
import outstationImg from '../../../assets/services/outstation.png';

const PHASES = {
    SERVICE_TYPE: 'SERVICE_TYPE',
    BOOKING_DETAILS: 'BOOKING_DETAILS',
    CONFIRM_VEHICLE: 'CONFIRM_VEHICLE',
    FINDING_DRIVER: 'FINDING_DRIVER',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    TRIP_ACTIVE: 'TRIP_ACTIVE',
    TRIP_COMPLETED: 'TRIP_COMPLETED'
};

const SERVICE_TYPES = [
    { id: 'point', title: 'Point-to-Point', subtitle: 'Single trip from A to B', img: pointImg, color: '#F29F05', basePrice: 299 },
    { id: 'hourly', title: 'Hourly Booking', subtitle: 'Flexible local errands', img: hourlyImg, color: '#3B82F6', basePrice: 199 },
    { id: 'full', title: 'Full Day', subtitle: 'Dedicated city driver', img: fullDayImg, color: '#10B981', basePrice: 999 },
    { id: 'outstation', title: 'Outstation', subtitle: 'Inter-city travel care', img: outstationImg, color: '#A855F7', basePrice: 1499 }
];


const SpareDriverBooking = () => {
    const navigate = useNavigate();
    const { vehicles, addresses, refreshStats } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // State
    const [phase, setPhase] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_booking_phase');
        return saved || PHASES.SERVICE_TYPE;
    });

    useEffect(() => {
        sessionStorage.setItem('chauffeur_booking_phase', phase);
    }, [phase]);

    const [selectedType, setSelectedType] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_selected_type');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (selectedType) {
            sessionStorage.setItem('chauffeur_selected_type', JSON.stringify(selectedType));
        }
    }, [selectedType]);

    const [bookingDetails, setBookingDetails] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_booking_details');
        return saved ? JSON.parse(saved) : {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '10:00',
            duration: '4 Hours'
        };
    });

    useEffect(() => {
        sessionStorage.setItem('chauffeur_booking_details', JSON.stringify(bookingDetails));
    }, [bookingDetails]);

    const [selectedVehicle, setSelectedVehicle] = useState(vehicles?.[0] || null);
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await serviceAPI.getChauffeurServices();
                if (res.status === 'success') {
                    setServices(res.data.services);
                }
            } catch (err) {
                console.error("Failed to fetch services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Initial check for vehicles
    useEffect(() => {
        if (vehicles?.length > 0 && !selectedVehicle) {
            setSelectedVehicle(vehicles[0]);
        }
    }, [vehicles, selectedVehicle]);

    const handleConfirmBooking = async () => {
        try {
            setIsProcessing(true);
            const bookingData = {
                vehicle: selectedVehicle._id,
                service: {
                    id: selectedType.id,
                    name: selectedType.title,
                    category: 'Chauffeur',
                    type: 'sparedriver',
                    basePrice: selectedType.basePrice,
                    duration: bookingDetails.duration
                },
                pricing: {
                    baseAmount: selectedType.basePrice,
                    totalAmount: selectedType.basePrice
                },
                schedule: {
                    type: 'scheduled',
                    date: bookingDetails.date,
                    timeSlot: { start: bookingDetails.time, end: bookingDetails.time },
                    estimatedDuration: bookingDetails.duration
                },
                location: {
                    type: 'home',
                    address: {
                        street: addresses?.find(a => a.isPrimary)?.address || 'HSR Layout',
                        city: 'Bengaluru'
                    }
                },
                provider: {
                    type: 'sparedriver'
                }
            };

            const res = await bookingAPI.createBooking(bookingData);
            if (res.status === 'success') {
                // Clear session state
                sessionStorage.removeItem('chauffeur_booking_phase');
                sessionStorage.removeItem('chauffeur_selected_type');
                sessionStorage.removeItem('chauffeur_booking_details');

                navigate('/payment-checkout', {
                    state: {
                        bookingId: res.data.booking._id,
                        amount: selectedType.basePrice,
                        serviceName: `Premium ${selectedType.title}`,
                        date: bookingDetails.date,
                        time: bookingDetails.time
                    }
                });
            }
        } catch (err) {
            console.error("Booking creation failed:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartTrip = () => {
        setPhase(PHASES.TRIP_ACTIVE);
        // Simulate trip ending after some time
        setTimeout(() => {
            setPhase(PHASES.TRIP_COMPLETED);
        }, 5000);
    };

    const renderHeader = (title, showBack = true) => (
        <header className="px-5 pt-10 pb-3 bg-white sticky top-0 z-50 flex items-center justify-between border-b border-gray-100/50">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button
                        onClick={() => phase === PHASES.SERVICE_TYPE ? navigate(-1) : setPhase(prev => {
                            if (prev === PHASES.BOOKING_DETAILS) return PHASES.SERVICE_TYPE;
                            if (prev === PHASES.CONFIRM_VEHICLE) return PHASES.BOOKING_DETAILS;
                            return PHASES.SERVICE_TYPE;
                        })}
                        className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-black active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={16} strokeWidth={3} />
                    </button>
                )}
                <h1 className="text-lg font-black text-black tracking-tight uppercase leading-none">{title}</h1>
            </div>
            {phase === PHASES.BOOKING_DETAILS && (
                <div className="bg-brand/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-brand">
                    Schedule Only
                </div>
            )}
        </header>
    );

    const renderServiceType = () => (
        <div className="p-5 space-y-5">
            <div className="space-y-1">
                <h2 className="text-xl font-[1000] text-black tracking-tighter leading-none uppercase">Expert Drivers</h2>
                <p className="text-[9px] font-black text-black/30 uppercase tracking-[0.25em]">On-demand chauffeur service</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Loading Premium Drivers...</p>
                    </div>
                ) : services.map((type) => (
                    <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setSelectedType({
                                id: type.id,
                                title: type.title,
                                subtitle: type.subtitle,
                                img: type.image || pointImg,
                                basePrice: type.basePrice
                            });
                            setPhase(PHASES.BOOKING_DETAILS);
                        }}
                        className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 group transition-all hover:border-brand/20"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-110 flex-shrink-0">
                            <img src={type.image || pointImg} className="w-full h-full object-cover" alt={type.title} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">{type.title}</h3>
                            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{type.subtitle}</p>
                            <div className="mt-2.5 flex items-center gap-2">
                                <div className="bg-black text-white px-2 py-1 rounded-md flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-0.5">From ₹{type.basePrice}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[#F29F05]">
                                    <Star size={10} fill="currentColor" />
                                    <span className="text-[10px] font-black uppercase leading-none">{type.rating || '4.9'}</span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-black/10 transition-transform group-hover:translate-x-1 group-hover:text-black/30" />
                    </motion.button>
                ))}
            </div>

            {/* Why Choose Us */}
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-black/[0.03]">
                <h4 className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-4 text-center">Clean2Wash Guarantee</h4>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: Shield, title: 'SAFE', desc: 'Verified' },
                        { icon: Star, title: 'EXPERT', desc: 'Top Rated' },
                        { icon: Timer, title: 'FAST', desc: '15 Min Wait' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-2">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-black/[0.02] shadow-sm">
                                <item.icon size={16} className="text-brand" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none">{item.title}</p>
                                <p className="text-[7px] font-bold text-black/30 uppercase tracking-widest mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderBookingDetails = () => (
        <div className="p-5 space-y-5">
            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-2.5 block pl-1">Booking Slot</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-100 rounded-xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-2 text-black/20">
                                <Calendar size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Select Date</span>
                            </div>
                            <input
                                type="date"
                                value={bookingDetails.date}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                                className="text-[13px] font-black bg-transparent border-none outline-none p-0 text-black appearance-none focus:ring-0"
                            />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-3.5 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center gap-2 text-black/20">
                                <Clock size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Start Time</span>
                            </div>
                            <input
                                type="time"
                                value={bookingDetails.time}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })}
                                className="text-[13px] font-black bg-transparent border-none outline-none p-0 text-black appearance-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-2.5 block pl-1">Pickup Location</label>
                    <div
                        onClick={() => navigate('/map')}
                        className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm group active:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/50 flex-shrink-0">
                            <MapPin size={14} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-[11px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Current Residence</h4>
                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest truncate">{addresses?.find(a => a.isPrimary)?.address || 'HSR Layout, Bengaluru'}</p>
                        </div>
                        <ChevronRight size={14} className="text-black/10 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>

                {selectedType.id === 'hourly' && (
                    <div>
                        <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-2.5 block pl-1">Duration</label>
                        <div className="flex flex-wrap gap-2">
                            {['4 Hours', '8 Hours', '12 Hours'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setBookingDetails({ ...bookingDetails, duration: d })}
                                    className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${bookingDetails.duration === d ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-gray-50 text-black/30 border-transparent hover:bg-gray-100'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-brand/5 rounded-2xl p-4 border border-brand/10 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Estimated Fee</span>
                    <span className="text-xl font-[1000] text-black tracking-tight">₹{selectedType.basePrice}</span>
                </div>
                <div className="h-px bg-brand/10 w-full" />
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-brand/20 shadow-sm">
                        <Info size={14} className="text-brand" />
                    </div>
                    <p className="text-[8px] font-bold text-black/50 leading-relaxed uppercase tracking-tight">
                        Standard fare covers first <span className="text-black font-black">{bookingDetails.duration}</span>. Extra minutes will be charged at <span className="text-black font-black">₹3.5/min</span>.
                    </p>
                </div>
            </div>

            {/* Safety Footer Details to fill space */}
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-black/[0.03] space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-black/[0.02] shadow-sm">
                        <Shield size={12} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none mb-0.5">Insurance Covered</p>
                        <p className="text-[7px] font-bold text-black/30 uppercase tracking-widest">Up to ₹5 Lakhs protection</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-black/[0.02] shadow-sm">
                        <User size={12} className="text-brand" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none mb-0.5">Background Verified</p>
                        <p className="text-[7px] font-bold text-black/30 uppercase tracking-widest">Identity & criminal records checked</p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setPhase(PHASES.CONFIRM_VEHICLE)}
                className="w-full bg-black text-white h-13 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
                Confirm Details
                <ChevronRight size={16} strokeWidth={4} className="transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );

    const renderConfirmVehicle = () => (
        <div className="p-5 space-y-5">
            <div className="space-y-3">
                <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-1 block pl-1">Confirm Vehicle</label>
                <div className="grid grid-cols-1 gap-3">
                    {vehicles?.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setSelectedVehicle(v)}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedVehicle?.id === v.id ? 'bg-white border-brand shadow-lg shadow-brand/5' : 'bg-gray-50/50 border-black/[0.03]'}`}
                        >
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm border border-black/[0.04]">
                                <img src={v.img} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[13px] font-[1000] text-black leading-none mb-1 uppercase tracking-tight">{v.brand} {v.model}</h4>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{v.plate}</p>
                            </div>
                            {selectedVehicle?.id === v.id && (
                                <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                    <Check size={12} strokeWidth={4} className="text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => navigate('/vehicles')}
                        className="p-3.5 rounded-2xl border border-dashed border-gray-200 flex items-center gap-4 text-left hover:border-brand/30 transition-colors bg-gray-50/30"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-black/[0.03]">
                            <Car size={18} className="text-black/15" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[13px] font-black text-black/40 leading-none mb-1 uppercase tracking-tight">Add New Vehicle</h4>
                            <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Register your car/bike</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 text-white rounded-[2rem] p-5 space-y-4 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-3xl -mr-8 -mt-8" />

                <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Secure Booking</span>
                    </div>
                    <span className="text-[9px] font-black text-brand uppercase tracking-widest underline decoration-brand/30 underline-offset-4 cursor-pointer">View Details</span>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 leading-none">Standard Payout</p>
                        <p className="text-2xl font-[1000] text-white tracking-tighter leading-none">₹{selectedType.basePrice}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1.5 leading-none">Booking Type</p>
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] font-black uppercase tracking-tight text-white">Scheduled</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleConfirmBooking}
                    className="w-full bg-brand text-black h-14 rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(242,159,5,0.2)] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-3 overflow-hidden group"
                >
                    Schedule My Chauffeur
                    <Lock size={16} fill="currentColor" className="opacity-40" />

                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>

                <div className="flex items-center justify-center gap-2 pt-1 opacity-40">
                    <ShieldCheck size={12} className="text-brand" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">SSL Secured Transaction</span>
                </div>
            </div>

            <p className="text-center text-[8px] font-bold text-black/20 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                By scheduling, you agree to our <span className="text-black/40">Transit Terms</span> and <span className="text-black/40">Safety Guidelines</span>.
            </p>
        </div>
    );

    const renderFindingDriver = () => (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="relative mb-8">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.2, 0.05] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-brand rounded-full blur-2xl"
                />
                <div className="relative z-10 w-24 h-24 bg-[#FAF8F5] rounded-[2rem] flex items-center justify-center border border-brand/20 shadow-xl shadow-brand/5">
                    <Loader2 size={32} className="text-brand animate-spin" strokeWidth={2} />
                </div>

                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2 bg-black text-white px-2 py-1 rounded-lg border border-white shadow-lg"
                >
                    <div className="flex items-center gap-1">
                        <Timer size={10} className="text-brand animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Securing Slot</span>
                    </div>
                </motion.div>
            </div>

            <div className="space-y-3 max-w-[240px]">
                <h2 className="text-xl font-[1000] text-black uppercase tracking-tight leading-none">Scheduling Chauffeur</h2>
                <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.15em] leading-relaxed">Arranging your elite driver for the selected time slot</p>
            </div>

            <div className="mt-8 w-full max-w-[280px] space-y-2">
                <div className="bg-gray-50/50 border border-black/[0.02] rounded-xl p-3 flex items-center gap-3 text-left">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-brand border border-brand/10 shadow-sm">
                        <CheckCircle2 size={12} />
                    </div>
                    <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Advanced Booking Protocol</span>
                </div>
            </div>
        </div>
    );

    const renderBookingConfirmed = () => (
        <div className="p-5 space-y-5">
            <div className="flex flex-col items-center text-center py-4">
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-lg shadow-emerald-500/5"
                >
                    <Calendar size={28} strokeWidth={2} />
                </motion.div>
                <h2 className="text-xl font-[1000] text-black uppercase tracking-tight leading-none mb-2">Booking Scheduled</h2>
                <div className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{bookingDetails.date} @ {bookingDetails.time}</span>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-black/[0.04] p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20">
                        <User size={24} />
                    </div>
                    <div>
                        <h4 className="text-[15px] font-[1000] text-black uppercase tracking-tight leading-none mb-1">Elite Chauffeur</h4>
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <span className="w-1 h-1 rounded-full bg-brand" /> Driver Details arriving soon
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-black/[0.03] grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-black/[0.02] flex flex-col gap-1">
                        <span className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em] leading-none mb-0.5">Assigned Car</span>
                        <div className="flex items-center gap-1.5">
                            <Car size={10} className="text-black/40" />
                            <span className="text-[10px] font-black text-black uppercase leading-none truncate">{selectedVehicle?.brand} {selectedVehicle?.model}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-black/[0.02] flex flex-col gap-1">
                        <span className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em] leading-none mb-0.5">Estimated Fare</span>
                        <div className="flex items-center gap-1.5">
                            <CreditCard size={10} className="text-black/40" />
                            <span className="text-[10px] font-black text-black uppercase leading-none">₹{selectedType.basePrice}</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate('/history')}
                className="w-full bg-black text-white h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
            >
                View in History
                <ChevronRight size={18} strokeWidth={3} />
            </button>
        </div>
    );

    const renderTripActive = () => (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            <div className="flex-1 relative">
                <div className="absolute inset-0 bg-[#0A0A0A]">
                    <div className="w-full h-full bg-[radial-gradient(circle,rgba(242,159,5,0.04)_1px,transparent_1px)] bg-[size:16px_16px]" />
                </div>

                <div className="absolute top-10 left-4 right-4 z-20">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-3.5 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
                                <Navigation size={18} className="text-brand animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-white uppercase tracking-tight leading-none mb-1">Live Location</h4>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] leading-none">{driverInfo?.name} is driving</p>
                            </div>
                        </div>
                        <div className="px-2 py-1 bg-brand/20 text-brand border border-brand/20 rounded-md text-[8px] font-black uppercase tracking-widest leading-none">Active</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-t-[2.5rem] p-6 space-y-5 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-30 pb-8">
                <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto mb-2" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.25em] mb-1.5 leading-none">Session Duration</p>
                        <h4 className="text-3xl font-[1000] text-black tracking-tighter leading-none tabular-nums">00:15:32</h4>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-brand font-black text-[9px] uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                            Live Session
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50/50 border border-black/[0.03] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shadow-sm border border-black/[0.03]">
                            <img src={driverInfo?.img} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-black leading-none mb-0.5">{driverInfo?.name}</p>
                            <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">Verified Chauffeur</p>
                        </div>
                    </div>
                    <button className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-1.5 border border-red-100 shadow-sm">
                        <AlertTriangle size={12} fill="currentColor" strokeWidth={1} />
                        SOS
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className="w-full bg-gray-50 text-black h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-black/[0.02] shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <MessageSquare size={14} />
                        Help
                    </button>
                    <button className="w-full bg-black text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Car size={14} />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTripCompleted = () => (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-lg shadow-emerald-500/5"
            >
                <CheckCircle2 size={36} strokeWidth={2.5} />
            </motion.div>

            <div className="space-y-3 max-w-[240px]">
                <h2 className="text-2xl font-[1000] text-black uppercase tracking-tight leading-none">Session<br />Completed</h2>
                <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.15em] leading-relaxed">Thank you for traveling with Clean2Wash elite chauffeurs.</p>
            </div>

            <div className="w-full bg-gray-50/50 border border-black/[0.02] p-5 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-[1000] text-black tracking-tight leading-none">₹{selectedType.basePrice}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Time In Session</span>
                    <span className="text-[12px] font-black text-black uppercase leading-none">00:45:12</span>
                </div>
            </div>

            <div className="w-full space-y-3 pt-2">
                <button
                    onClick={() => navigate(`/rate?id=${activeBookingId}`)}
                    className="w-full bg-black text-white h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center mt-2"
                >
                    Rate Driver
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="w-full text-black/30 h-10 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center transition-all hover:bg-gray-50 bg-gray-50/50"
                >
                    Exit to Home
                </button>
            </div>
        </div>
    );

    const getPhaseTitle = () => {
        switch (phase) {
            case PHASES.SERVICE_TYPE: return 'Select Service';
            case PHASES.BOOKING_DETAILS: return 'Booking Details';
            case PHASES.CONFIRM_VEHICLE: return 'Confirm Vehicle';
            case PHASES.FINDING_DRIVER: return 'Finding Driver';
            case PHASES.BOOKING_CONFIRMED: return 'Summary';
            case PHASES.TRIP_ACTIVE: return 'Trip Active';
            case PHASES.TRIP_COMPLETED: return 'Finished';
            default: return 'Spare Driver';
        }
    };

    return (
        <MobileLayout hideNav={phase === PHASES.TRIP_ACTIVE || phase === PHASES.FINDING_DRIVER || phase === PHASES.TRIP_COMPLETED}>
            <div className="min-h-screen bg-white font-sans flex flex-col">
                {(phase !== PHASES.FINDING_DRIVER && phase !== PHASES.TRIP_ACTIVE && phase !== PHASES.TRIP_COMPLETED) &&
                    renderHeader(getPhaseTitle(), true)}

                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full"
                        >
                            {phase === PHASES.SERVICE_TYPE && renderServiceType()}
                            {phase === PHASES.BOOKING_DETAILS && renderBookingDetails()}
                            {phase === PHASES.CONFIRM_VEHICLE && renderConfirmVehicle()}
                            {phase === PHASES.FINDING_DRIVER && renderFindingDriver()}
                            {phase === PHASES.BOOKING_CONFIRMED && renderBookingConfirmed()}
                            {phase === PHASES.TRIP_ACTIVE && renderTripActive()}
                            {phase === PHASES.TRIP_COMPLETED && renderTripCompleted()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .font-black { font-weight: 900; }
                .tracking-tighter { letter-spacing: -0.05em; }
            `}} />
        </MobileLayout>
    );
};

function Radar(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 12L7.5 21" />
            <path d="M12 12l4.5 9" />
            <path d="M12 12L2 12" />
            <path d="M12 12l7.5-9" />
            <path d="M12 12l4.5-9" />
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

export default SpareDriverBooking;
