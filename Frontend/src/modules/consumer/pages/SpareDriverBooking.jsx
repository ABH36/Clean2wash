import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, User, MapPin, Calendar, Clock, Car,
    ChevronRight, Star, Shield, Info, CheckCircle2,
    ShieldCheck, Lock,
    X, Timer, Navigation, Phone, MessageSquare,
    AlertTriangle, Search, CreditCard, Play,
    Loader2, Check, Map, Settings, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import GoogleMapBox from '../../../components/common/GoogleMapBox';
import bookingAPI, { serviceAPI, spareDriverAPI } from '../../../utils/api';
import { socketService } from '../../../utils/socket';
import MobileLayout from '../components/layout/MobileLayout';

// 🏎️ Chauffeur Service Visuals
import pointImg from '../../../assets/chauffeur/point.png';
import hourlyImg from '../../../assets/chauffeur/hourly.png';
import fullImg from '../../../assets/chauffeur/full.png';
import outstationImg from '../../../assets/chauffeur/outstation.png';

const PHASES = {
    SERVICE_TYPE: 'SERVICE_TYPE',
    BOOKING_DETAILS: 'BOOKING_DETAILS',
    CONFIRM_VEHICLE: 'CONFIRM_VEHICLE',
    CHECKOUT: 'CHECKOUT',
    FINDING_DRIVER: 'FINDING_DRIVER',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    TRIP_ACTIVE: 'TRIP_ACTIVE',
    TRIP_COMPLETED: 'TRIP_COMPLETED'
};

// 🛠️ Asset Protocol: Unique Service Identities
const SERVICE_ASSETS = {
    'point': { icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', color: '#3B82F6', pulse: 'animate-pulse' }, // Premium Car
    'hourly': { icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', color: '#10B981', pulse: 'animate-bounce' }, // Driver
    'full': { icon: 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png', color: '#F29F05', pulse: 'animate-pulse' }, // specialist
    'outstation': { icon: 'https://cdn-icons-png.flaticon.com/512/2330/2330453.png', color: '#A855F7', pulse: 'animate-pulse' }, // Trip
    'user': 'https://cdn-icons-png.flaticon.com/512/7077/7077313.png'
};

const SERVICE_TYPES = [
    { id: 'point', title: 'Point-to-Point', subtitle: 'Single trip from A to B', img: pointImg, color: SERVICE_ASSETS.point.color, basePrice: 299 },
    { id: 'hourly', title: 'Hourly Booking', subtitle: 'Flexible local errands', img: hourlyImg, color: SERVICE_ASSETS.hourly.color, basePrice: 199 },
    { id: 'full', title: 'Full Day', subtitle: 'Dedicated city driver', img: fullImg, color: SERVICE_ASSETS.full.color, basePrice: 999 },
    { id: 'outstation', title: 'Outstation', subtitle: 'Inter-city travel care', img: outstationImg, color: SERVICE_ASSETS.outstation.color, basePrice: 1499 }
];


const getVehicleMultiplier = (type) => {
    const multipliers = {
        'Hatchback': 1.0, 'Sedan': 1.2, 'SUV': 1.5, 'MUV': 1.4, 'Compact SUV': 1.4,
        'MPV': 1.4, 'Pickup': 1.6, 'Luxury Sedan': 2.0, 'Luxury SUV': 2.2,
        'Coupe': 1.8, 'Convertible': 2.0, 'Sports Car': 2.5, 'Supercar': 3.0,
        'EV': 1.2, 'Mini Truck': 1.8, 'Truck': 2.5, 'Van': 1.8, 'Bus': 2.5,
        'Traveler': 1.8, 'Tractor': 2.0, 'Vintage': 2.5, 'Bike': 0.6,
        'Scooter': 0.5, 'Superbike': 0.9, 'Luxury': 2.0
    };
    return multipliers[type] || 1.0;
};

const SpareDriverBooking = () => {
    const navigate = useNavigate();
    const { 
        vehicles, refreshStats, getUser,
        getRazorpayKey, createPaymentOrder, verifyPayment 
    } = useAuth();
    const { savedAddresses: addresses, selectedAddress, currentLocation } = useGeoLocation();
    const userCoords = useMemo(() => 
        selectedAddress?.coordinates || currentLocation || { lat: 28.6139, lng: 77.2090 }
    , [selectedAddress, currentLocation]);
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
        if (!selectedType && [PHASES.BOOKING_DETAILS, PHASES.CONFIRM_VEHICLE, PHASES.FINDING_DRIVER].includes(phase)) {
            setPhase(PHASES.SERVICE_TYPE);
        }
    }, [selectedType, phase]);

    useEffect(() => {
        sessionStorage.setItem('chauffeur_booking_details', JSON.stringify(bookingDetails));
    }, [bookingDetails]);

    const [selectedVehicle, setSelectedVehicle] = useState(vehicles?.[0] || null);
    const [activeBookingId, setActiveBookingId] = useState(() => {
        return sessionStorage.getItem('chauffeur_active_booking_id') || null;
    });
    const [driverLocation, setDriverLocation] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [destination, setDestination] = useState(() => {
        const saved = sessionStorage.getItem('chauffeur_destination');
        return saved ? JSON.parse(saved) : null;
    });
    const [estimatedKm, setEstimatedKm] = useState(0);
    const [useSubscription, setUseSubscription] = useState(false);

    useEffect(() => {
        if (destination) {
            sessionStorage.setItem('chauffeur_destination', JSON.stringify(destination));
        }
    }, [destination]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [lookingTime, setLookingTime] = useState(180);

    // ── Looking Countdown ──
    useEffect(() => {
        let timer;
        const isWaiting = phase === PHASES.FINDING_DRIVER && (!bookingDetails?.status || bookingDetails.status === 'pending');
        
        if (isWaiting && lookingTime > 0) {
            timer = setInterval(() => {
                setLookingTime(prev => prev - 1);
            }, 1000);
        } else if (lookingTime === 0 && isWaiting) {
            // If still pending after 60s, show a fallback or notify user
            // For now, we'll keep searching but show a 'Still searching' message or allow retry
        }
        return () => clearInterval(timer);
    }, [phase, lookingTime, bookingDetails?.status]);

    // ── Session Timer ──
    useEffect(() => {
        let interval;
        if (phase === PHASES.TRIP_ACTIVE) {
            // Restore from session or start new
            const startTimeString = sessionStorage.getItem('chauffeur_trip_start_time');
            const startTime = startTimeString ? Number(startTimeString) : Date.now();
            
            if (!startTimeString) {
                sessionStorage.setItem('chauffeur_trip_start_time', startTime.toString());
            }

            interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((now - startTime) / 1000));
                setElapsedTime(diff);
            }, 1000);
        } else if (phase === PHASES.TRIP_COMPLETED) {
            const startTimeString = sessionStorage.getItem('chauffeur_trip_start_time');
            const endTime = Date.now();
            if (startTimeString) {
                const startTime = Number(startTimeString);
                setElapsedTime(Math.floor((endTime - startTime) / 1000));
            }
        }
        return () => clearInterval(interval);
    }, [phase]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ── WebSocket Telemetry ──
    useEffect(() => {
        if (activeBookingId && (phase === PHASES.TRIP_ACTIVE || phase === PHASES.FINDING_DRIVER)) {
            console.log(`[SpareDriver] Connecting Telemetry for Session: ${activeBookingId}`);

            socketService.connect();
            socketService.joinBookingRoom(activeBookingId);

            const socket = socketService.getSocket();
            if (socket) {
                // Listen for driver pulses
                socket.on('location_updated', (data) => {
                    console.log('[SpareDriver] Telemetry Pulse:', data);
                    if (data.location) {
                        setDriverLocation(data.location);
                    }
                });

                // Listen for status changes
                socket.on('booking_status_updated', (data) => {
                    console.log('[SpareDriver] Status Update:', data.status);
                    setBookingDetails(prev => ({ ...prev, status: data.status }));
                    if (data.status === 'completed') setPhase(PHASES.TRIP_COMPLETED);
                    if (data.status === 'active') setPhase(PHASES.TRIP_ACTIVE);
                });
            }

            return () => {
                const socket = socketService.getSocket();
                if (socket) {
                    socket.off('location_updated');
                    socket.off('booking_status_updated');
                }
            };
        }
    }, [activeBookingId, phase]);

    // ── Session Restoration ──
    useEffect(() => {
        const restoreSession = async () => {
            if (activeBookingId && !bookingDetails) {
                try {
                    console.log('[SpareDriver] Restoring Session:', activeBookingId);
                    const res = await bookingAPI.getBooking(activeBookingId);
                    if (res.status === 'success') {
                        setBookingDetails(res.data.booking);
                        // Infer phase from status
                        const status = res.data.booking.status;
                        if (['en_route', 'arrived'].includes(status)) setPhase(PHASES.FINDING_DRIVER); // "Finding" also includes tracking
                        if (['active'].includes(status)) setPhase(PHASES.TRIP_ACTIVE);
                        if (['completed'].includes(status)) setPhase(PHASES.TRIP_COMPLETED);
                    }
                } catch (err) {
                    console.error("Session restoration failed:", err);
                    sessionStorage.removeItem('chauffeur_active_booking_id');
                    setActiveBookingId(null);
                }
            }
        };
        restoreSession();
    }, [activeBookingId]);

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
    
    // 🚨 SOS Handler 🚨
    const handleSOS = async () => {
        if (!activeBookingId) return;
        try {
            const res = await spareDriverAPI.reportEmergency({
                bookingId: activeBookingId,
                reason: 'User triggered SOS from Booking App',
                latitude: currentLocation?.lat || 0,
                longitude: currentLocation?.lng || 0
            });
            if (res.status === 'success') {
                alert('🚨 EMERGENCY PROTOCOL ACTIVATED: Admin has been notified of your location. Stay calm, help is being dispatched.');
            }
        } catch (err) {
            console.error('SOS Failure:', err);
            alert('Safety alert failed. Please call 100/112 immediately.');
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedVehicle) {
            alert("Please select a vehicle to continue");
            return;
        }
        setIsProcessing(true);
        try {
            // 1. Calculate and Prepare Order
            const multiplier = getVehicleMultiplier(selectedVehicle?.type || 'Sedan');
            const amount = Math.round(selectedType.basePrice * multiplier);

            const commonBookingData = {
                vehicle: selectedVehicle?._id || selectedVehicle?.id,
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
                    vehicleMultiplier: multiplier,
                    totalAmount: amount,
                    initialPaidAmount: amount,
                    currency: 'INR'
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
                        street: selectedAddress?.street || addresses?.find(a => a.isPrimary)?.street || addresses?.[0]?.street || 'Current Location',
                        city: selectedAddress?.city || addresses?.find(a => a.isPrimary)?.city || addresses?.[0]?.city || '',
                        coordinates: selectedAddress?.coordinates || currentLocation || addresses?.[0]?.coordinates || { lat: 28.6139, lng: 77.2090 }
                    }
                },
                destination: selectedType.id === 'point' ? destination : null,
                provider: { type: 'sparedriver' }
            };

            // ── Scenario A: Subscription Pass ──
            if (useSubscription) {
                const subBookingData = {
                    ...commonBookingData,
                    paymentMethod: 'subscription'
                };

                const res = await bookingAPI.createBooking(subBookingData);
                if (res.status === 'success') {
                    const bId = res.data.booking._id;
                    setActiveBookingId(bId);
                    sessionStorage.setItem('chauffeur_active_booking_id', bId);
                    
                    setLookingTime(180);
                    setPhase(PHASES.FINDING_DRIVER);
                }
                return;
            }

            // ── Scenario B: Razorpay Online ──
            const razorKeyRes = await getRazorpayKey();
            if (!razorKeyRes.success) throw new Error("Could not fetch payment configuration");

            const orderRes = await createPaymentOrder(amount, 'INR', `sd_${Date.now()}`); 
            if (!orderRes.success) throw new Error("Payment order creation failed");

            const options = {
                key: razorKeyRes.data.key_id,
                amount: orderRes.data.amount,
                currency: "INR",
                name: "Clean2Wash Chauffeur",
                description: `Booking for ${selectedType.title}`,
                order_id: orderRes.data.order_id,
                handler: async (response) => {
                    try {
                        setIsProcessing(true);
                        const bookingData = {
                            ...commonBookingData,
                            paymentMethod: 'online',
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature
                        };

                        const res = await bookingAPI.createBooking(bookingData);
                        if (res.status === 'success') {
                            const bId = res.data.booking._id;
                            setActiveBookingId(bId);
                            sessionStorage.setItem('chauffeur_active_booking_id', bId);

                            setLookingTime(180);
                            setPhase(PHASES.FINDING_DRIVER);
                        }
                    } catch (err) {
                        console.error("Booking Finalization Failed:", err);
                        alert(err.message || "Booking failed. Please try again.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: getUser('consumer')?.name || "",
                    email: getUser('consumer')?.email || "",
                    contact: getUser('consumer')?.phone || ""
                },
                theme: { color: "#F29F05" },
                modal: { ondismiss: () => setIsProcessing(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Booking initialization failed:", err);
            alert(err.message || "Could not initialize booking. Please try again.");
        } finally {
            if (!useSubscription) setIsProcessing(false);
        }
    };

    const handleStartTrip = () => {
        setPhase(PHASES.TRIP_ACTIVE);
        // Simulate trip ending after some time
        setTimeout(() => {
            setPhase(PHASES.TRIP_COMPLETED);
        }, 5000);
    };

    const handleCancelRequest = async () => {
        if (!activeBookingId) {
            setPhase(PHASES.CONFIRM_VEHICLE);
            return;
        }

        const confirmCancel = window.confirm("Are you sure you want to cancel this request?");
        if (!confirmCancel) return;

        try {
            await bookingAPI.cancelBooking(activeBookingId, "User cancelled during searching");
            setActiveBookingId(null);
            sessionStorage.removeItem('chauffeur_active_booking_id');
            setPhase(PHASES.SERVICE_TYPE);
        } catch (err) {
            console.error("Cancellation failed:", err);
            alert("Could not cancel. Please contact support.");
        }
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
                ) : (services.length > 0 ? services : SERVICE_TYPES).map((type) => (
                    <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setSelectedType({
                                id: type._id || type.id,
                                title: type.name || type.title,
                                subtitle: type.description || type.subtitle,
                                img: type.image || type.img || SERVICE_ASSETS.point.icon,
                                basePrice: type.basePrice
                            });
                            // ⚡ Phase 10: Auto-Duration for Full Day & Outstation ⚡
                            if ((type.name || type.title || '').toLowerCase().includes('full day')) {
                                setBookingDetails(prev => ({ ...prev, duration: '8 Hours' }));
                            } else if ((type.name || type.title || '').toLowerCase().includes('outstation')) {
                                setBookingDetails(prev => ({ ...prev, duration: '24 Hours' }));
                            } else if ((type.name || type.title || '').toLowerCase().includes('point')) {
                                setBookingDetails(prev => ({ ...prev, duration: '1 Hour' }));
                            }
                            setPhase(PHASES.BOOKING_DETAILS);
                        }}
                        className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 group transition-all hover:border-brand/20"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-110 flex-shrink-0">
                            <img src={type.image || type.img || SERVICE_ASSETS.point.icon} className="w-full h-full object-cover" alt={type.title} />
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
            {/* 📍 Point-to-Point Destination Selector */}
            {selectedType?.id === 'point' && (
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-1 block pl-1">Where to? (Destination)</label>
                    <div className="bg-gray-50/50 rounded-2xl border border-black/[0.03] p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-black/[0.04] shadow-sm">
                            <MapPin size={16} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[12px] font-black text-black uppercase tracking-tight leading-none mb-1">
                                {destination?.street || "Select your drop-off point"}
                            </p>
                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest leading-none">
                                {destination ? `~${estimatedKm} km estimated distance` : "Required for Point-to-Point"}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                // For now, we'll auto-simulate destination pick or open a picker logic
                                // Ideally this opens a map search/pin drop modal
                                setDestination({
                                    street: "Connaught Place, Delhi",
                                    city: "New Delhi",
                                    coordinates: { lat: 28.6328, lng: 77.2197 }
                                });
                                setEstimatedKm(8.5);
                            }}
                            className="text-[9px] font-black text-brand uppercase underline decoration-brand/30 underline-offset-4"
                        >
                            Change
                        </button>
                    </div>
                </div>
            )}

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
                            <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest truncate">{selectedAddress?.street || addresses?.find(a => a.isPrimary)?.street || addresses?.[0]?.street || 'Current Location'}</p>
                        </div>
                        <ChevronRight size={14} className="text-black/10 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>

                {selectedType.id === 'hourly' && (
                    <div>
                        <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-2.5 block pl-1">Duration</label>
                        <div className="flex flex-wrap gap-2">
                            {['4 Hours', '8 Hours'].map((d) => (
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
                        Standard fare covers first <span className="text-black font-black">{bookingDetails.duration}</span>. 
                        {selectedType?.id === 'outstation' ? " Stay & Food Allowance (₹500/day) applies. Tolls & Parking by customer. " : ""}
                        Wait charges <span className="text-black font-black">₹2/min</span> apply after 15m.
                        Night return <span className="text-black font-black">₹300</span> applies if trip ends after 11 PM.
                        {selectedType?.id === 'outstation' ? " Max 9h driving/day for safety." : ""}
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
                            key={v._id || v.id}
                            onClick={() => setSelectedVehicle(v)}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center gap-4 text-left ${(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) ? 'bg-white border-brand shadow-lg shadow-brand/5' : 'bg-gray-50/50 border-black/[0.03]'}`}
                        >
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm border border-black/[0.04]">
                                <img src={v.img} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[13px] font-[1000] text-black leading-none mb-1 uppercase tracking-tight">{v.brand} {v.model}</h4>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{v.plate}</p>
                            </div>
                            {(selectedVehicle?._id || selectedVehicle?.id) === (v._id || v.id) && (
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
                        <p className="text-2xl font-[1000] text-white tracking-tighter leading-none">₹{selectedType?.basePrice || '---'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1.5 leading-none">Booking Type</p>
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] font-black uppercase tracking-tight text-white">Scheduled</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setPhase(PHASES.CHECKOUT)}
                    disabled={isProcessing}
                    className="w-full bg-brand text-black h-14 rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(242,159,5,0.2)] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-3 overflow-hidden group disabled:opacity-50"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            Confirm Mission Details
                            <Lock size={16} fill="currentColor" className="opacity-40" />
                        </>
                    )}

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

    const renderFindingDriver = () => {
        // 🏎️ Simulated nearby drivers for Rapido vibe
        const nearbyDrivers = [
            { id: 1, lat: userCoords.lat + 0.003, lng: userCoords.lng + 0.002, rot: 45 },
            { id: 2, lat: userCoords.lat - 0.002, lng: userCoords.lng + 0.004, rot: 120 },
            { id: 3, lat: userCoords.lat + 0.004, lng: userCoords.lng - 0.003, rot: 280 },
            { id: 4, lat: userCoords.lat - 0.004, lng: userCoords.lng - 0.002, rot: 15 },
        ];

        return (
            <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
                {/* 🗺️ Live Metadata Integration: Service-specific Telemetry */}
                <div className="absolute inset-0 z-0">
                    <GoogleMapBox
                        center={userCoords}
                        zoom={15}
                        markers={[
                            {
                                position: userCoords,
                                icon: {
                                    url: SERVICE_ASSETS.user,
                                    scaledSize: { width: 32, height: 32 },
                                    anchor: { x: 16, y: 32 }
                                },
                                infoContent: <div className="p-1 font-black text-[9px] uppercase text-brand tracking-widest">Your Terminal</div>
                            },
                            ...nearbyDrivers.map(d => ({
                                position: { lat: d.lat, lng: d.lng },
                                icon: {
                                    url: SERVICE_ASSETS[selectedType?.id || 'point'].icon,
                                    scaledSize: { width: 28, height: 28 },
                                    rotation: d.rot,
                                    anchor: { x: 14, y: 14 }
                                }
                            }))
                        ]}
                        darkMode={true}
                    />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full animate-pulse blur-3xl opacity-30" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-6 pb-12">
                    <div className="w-full flex items-center justify-between pt-4">
                        <button onClick={() => setPhase(PHASES.CONFIRM_VEHICLE)} className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90">
                            <X size={16} />
                        </button>
                        <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-full flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-ping`} style={{ backgroundColor: SERVICE_ASSETS[selectedType?.id || 'point'].color }} />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Searching {selectedType?.title} Grid</span>
                        </div>
                        <div className="w-8" />
                    </div>

                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                            <div className="absolute -inset-16 bg-brand/5 rounded-full animate-ping opacity-10" />
                            <div className="absolute -inset-8 bg-brand/10 rounded-full animate-ping opacity-20" />
                            <div className="relative w-28 h-28 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-[1000] text-brand tabular-nums leading-none">{lookingTime}</span>
                                    <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">SECONDS</span>
                                </div>
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                    <motion.circle
                                        cx="56" cy="56" r="52" fill="none" stroke="#F29F05" strokeWidth="4"
                                        strokeDasharray="327"
                                        animate={{ strokeDashoffset: 327 - (327 * (180 - lookingTime)) / 180 }}
                                        transition={{ duration: 1, ease: "linear" }}
                                    />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full mb-3">
                                <Radar className="w-3 h-3 text-brand animate-spin" />
                                <span className="text-[8px] font-black text-brand uppercase tracking-[0.2em]">
                                    {lookingTime > 120 ? 'Phase 1: Local Grid (1.0 km)' : 'Phase 2: Expanded Network Scan'}
                                </span>
                            </div>
                            <h3 className="text-2xl font-[1000] text-white uppercase tracking-tighter leading-none mb-2">Requesting<br />Chauffeurs</h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed h-8">
                                {lookingTime > 150 ? 'Pinging nearby driver terminals...' : 
                                 lookingTime > 120 ? 'Connecting to local telemetry...' : 
                                 lookingTime > 90 ? 'Broadcasting to outer perimeter...' : 
                                 lookingTime > 60 ? 'Optimizing route assignments...' : 
                                 lookingTime > 30 ? 'Nearyby captains notified...' : 
                                 'Securely finalizing driver pulse...'}
                            </p>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex gap-3">
                            <button 
                                onClick={handleSOS}
                                className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20 active:scale-90 transition-transform pointer-events-auto"
                            >
                                <AlertTriangle size={24} />
                            </button>
                            <button 
                                onClick={handleCancelRequest}
                                className="flex-1 h-14 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform pointer-events-auto"
                            >
                                <X size={18} className="text-white/40" />
                                <span className="text-[13px] font-black text-white uppercase tracking-widest">Cancel Request</span>
                            </button>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                                        <ShieldCheck size={18} className="text-brand" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white leading-none mb-0.5">ELITE PROTOCOL</p>
                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Only 4.8★+ Rated Drivers</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-0.5 leading-none">Security PIN</p>
                                    <p className="text-sm font-[1000] text-white tracking-widest leading-none">LOCKED</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[8px] font-black text-white/10 uppercase tracking-[0.4em] animate-pulse">
                            Secure Handshake in Progress
                        </p>
                    </div>
                </div>
            </div>
        );
    };

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
                            <span className="text-[10px] font-black text-black uppercase leading-none">₹{selectedType?.basePrice || bookingDetails?.pricing?.totalAmount || '---'}</span>
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
                {/* 🗺️ Live Mission Overlay */}
                <div className="absolute inset-0 z-0">
                    <GoogleMapBox
                        center={driverLocation || userCoords}
                        zoom={15}
                        markers={[
                            {
                                position: userCoords,
                                icon: {
                                    url: SERVICE_ASSETS.user,
                                    scaledSize: { width: 20, height: 20 },
                                    anchor: { x: 10, y: 10 }
                                }
                            },
                            ...(driverLocation ? [{
                                position: driverLocation,
                                icon: {
                                    url: SERVICE_ASSETS[selectedType?.id || 'point'].icon,
                                    scaledSize: { width: 42, height: 42 },
                                    anchor: { x: 21, y: 21 }
                                },
                                infoContent: (
                                    <div className="p-1 font-outfit text-center">
                                        <p className="text-[8px] font-black uppercase text-brand tracking-widest">Your Captain</p>
                                        <p className="text-[10px] font-black text-black leading-none mt-1">{driverInfo?.name || 'En Route'}</p>
                                    </div>
                                )
                            }] : [])
                        ]}
                        darkMode={true}
                    />
                </div>

                <div className="absolute top-10 left-4 right-4 z-20">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-3.5 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center">
                                <Navigation size={18} className={`text-brand ${driverLocation ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-white uppercase tracking-tight leading-none mb-1">Live Telemetry</h4>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] leading-none">
                                    {driverLocation ? 'Driver is moving' : 'Waiting for GPS pulse...'}
                                </p>
                            </div>
                        </div>
                        <div className="px-2 py-1 bg-brand/20 text-brand border border-brand/20 rounded-md text-[8px] font-black uppercase tracking-widest leading-none">
                            {phase === PHASES.FINDING_DRIVER ? 'Searching' : 'En Route'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-t-[2.5rem] p-6 space-y-5 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-30 pb-8">
                <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto mb-2" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.25em] mb-1.5 leading-none">Session Duration</p>
                        <h4 className="text-3xl font-[1000] text-black tracking-tighter leading-none tabular-nums">{formatTime(elapsedTime)}</h4>
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
                    {bookingDetails?.status === 'arrived' ? (
                        <div className="bg-brand/10 border border-brand/20 px-3 py-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-brand uppercase tracking-widest mb-0.5">Start PIN</p>
                            <p className="text-sm font-[1000] text-black tracking-widest">{bookingDetails?.securityPin}</p>
                        </div>
                    ) : (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-black leading-none">₹{bookingDetails?.pricing?.totalAmount || 0}</p>
                            <p className="text-[7px] font-bold text-black/25 uppercase tracking-widest mt-1">Total Fare</p>
                        </div>
                    )}
                </div>

                {/* 🏷️ Phase 11: Real-time Surcharge Pulse 🏷️ */}
                {(bookingDetails?.pricing?.totalAmount > (selectedType?.basePrice || 0)) && (
                    <div className="px-5 py-3 bg-brand/[0.03] border border-brand/10 rounded-2xl space-y-1.5 anim-pulse-subtle">
                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1.5 opacity-60">Surcharges Applied</p>
                        {bookingDetails.notes?.internal?.includes('[WAITING]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Waiting Fee</span>
                                <span className="text-[9px] font-black text-black">Applied</span>
                            </div>
                        )}
                        {bookingDetails.notes?.internal?.includes('[ARREARS]') && (
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-black/40 uppercase">Trip Extension</span>
                                <span className="text-[9px] font-black text-black">Active</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🛡️ Outstation Safety & Allowance Context 🛡️ */}
                {selectedType?.id === 'outstation' && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-blue-600" />
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Outstation Mission Protocol</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Stay & Food Allowance</span>
                                <span className="text-[8px] font-black text-blue-900">₹500 / 24h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-blue-900/40 uppercase">Daily Driving Limit</span>
                                <span className="text-[8px] font-black text-blue-900">9 Hours Max</span>
                            </div>
                        </div>
                        <p className="text-[7px] font-bold text-blue-900/30 uppercase leading-tight">
                            Note: Tolls, State Taxes & Parking are to be paid by the customer directly.
                        </p>
                    </div>
                )}

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
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Base Fare</span>
                    <span className="text-[12px] font-black text-black leading-none">₹{selectedType?.basePrice || '---'}</span>
                </div>
                
                {bookingDetails?.pricing?.breakdown?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between opacity-60">
                        <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">{item.name}</span>
                        <span className="text-[10px] font-black text-black leading-none">+₹{item.amount}</span>
                    </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] font-black text-brand uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-[1000] text-black tracking-tight leading-none">₹{bookingDetails?.pricing?.totalAmount || '---'}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-black/5 pt-3">
                    <span className="text-[9px] font-black text-black/25 uppercase tracking-widest">Time In Session</span>
                    <span className="text-[12px] font-black text-black uppercase leading-none">{formatTime(elapsedTime)}</span>
                </div>
            </div>

            <div className="w-full space-y-3 pt-2">
                <button
                    onClick={() => {
                        sessionStorage.removeItem('chauffeur_active_booking_id');
                        sessionStorage.removeItem('chauffeur_booking_phase');
                        sessionStorage.removeItem('chauffeur_trip_start_time');
                        navigate('/home');
                        refreshStats();
                    }}
                    className="w-full bg-black text-white h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
                >
                    Return Home
                </button>
                <button
                    onClick={() => navigate('/spare-driver/history')}
                    className="w-full border border-gray-100 text-black/40 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
                >
                    View Trip Details
                </button>
            </div>
        </div>
    );

    const renderCheckout = () => (
        <div className="p-5 space-y-5">
            <div className="space-y-3">
                <label className="text-[9px] font-black text-black/25 uppercase tracking-[0.25em] mb-1 block pl-1">Trip Summary</label>
                
                {/* Visual Route Indicator */}
                <div className="bg-white rounded-3xl p-5 border border-black/[0.04] shadow-sm space-y-4">
                    <div className="flex gap-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 border-l-2 border-dotted border-gray-200" />
                        
                        <div className="space-y-6 flex-1">
                            {/* Point A */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20 z-10">
                                    <MapPin size={16} className="text-brand" />
                                </div>
                                <div className="pt-1">
                                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest leading-none mb-1.5">Pickup Location (A)</p>
                                    <p className="text-[12px] font-[1000] text-black leading-tight uppercase tracking-tight">
                                        {selectedAddress?.street || 'Current Location'}
                                    </p>
                                </div>
                            </div>

                            {/* Point B */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center border border-black/10 z-10">
                                    <MapPin size={16} className="text-red-500" />
                                </div>
                                <div className="pt-1">
                                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest leading-none mb-1.5">Destination Point (B)</p>
                                    <p className="text-[12px] font-[1000] text-black leading-tight uppercase tracking-tight">
                                        {destination?.street || 'Drop Location Not Set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-black/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={12} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Est. Distance</span>
                        </div>
                        <span className="text-[11px] font-black text-black uppercase tracking-tight">{estimatedKm} KM</span>
                    </div>
                </div>
            </div>

            {/* Subscription Toggle */}
            <div className={`p-4 rounded-3xl border transition-all ${useSubscription ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50/50 border-black/[0.03]'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${useSubscription ? 'bg-white border-emerald-200 text-emerald-500' : 'bg-white border-black/[0.04] text-black/40'}`}>
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-black uppercase tracking-tight leading-none mb-1">Use Subscription</p>
                            <p className="text-[8px] font-bold text-black/30 uppercase tracking-widest">1 Credit per trip</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setUseSubscription(!useSubscription)}
                        className={`w-11 h-6 rounded-full relative transition-colors ${useSubscription ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useSubscription ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 text-white rounded-[2rem] p-5 space-y-4 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-3xl -mr-8 -mt-8" />

                <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Checkout Sync</span>
                    </div>
                    <ShieldCheck size={12} className="text-brand/50" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 leading-none">Total Payout</p>
                        <p className="text-2xl font-[1000] text-white tracking-tighter leading-none">
                            {useSubscription ? "₹0" : `₹${Math.round(selectedType.basePrice * (selectedType.id === 'hourly' ? parseInt(bookingDetails.duration) : 1) * getVehicleMultiplier(selectedVehicle?.type || 'Sedan'))}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1.5 leading-none">Payment Mode</p>
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] font-black uppercase tracking-tight text-white">{useSubscription ? 'Pass Credit' : 'Razorpay Secure'}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleConfirmBooking}
                    disabled={isProcessing || (selectedType?.id === 'point' && !destination)}
                    className="w-full bg-brand text-black h-14 rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(242,159,5,0.2)] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-3 overflow-hidden group disabled:opacity-50"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            {useSubscription ? 'Confirm & Book Pass' : 'Pay & Start Mission'}
                            <ChevronRight size={16} strokeWidth={4} className="transition-transform group-hover:translate-x-1" />
                        </>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
            </div>
        </div>
    );

    const getPhaseTitle = () => {
        switch (phase) {
            case PHASES.SERVICE_TYPE: return 'Select Service';
            case PHASES.BOOKING_DETAILS: return 'Booking Details';
            case PHASES.CONFIRM_VEHICLE: return 'Confirm Vehicle';
            case PHASES.CHECKOUT: return 'Checkout Details';
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
                            {phase === PHASES.CHECKOUT && renderCheckout()}
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

